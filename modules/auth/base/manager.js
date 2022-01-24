const error = require("../../../lib/error");
const logger = require("../../../lib/logger");
const bcrypt = require("bcryptjs");
const emailService = require("../../../lib/services/email.service");
const crypto = require("crypto");
const config = require("../../../config");
const mainDBHandler = require("../../../database/main.handler");
const reward = require("../../../_utils/reward");

const _create = async (req, data, options) => {
    try {
      const result = await mainDBHandler.insertOne(req, "profiles", data, options);
      logger.debug(
        req,
        `AuthService - Successfully created Profile with id: ${data.id} `
      );
      return result;
    } catch (error) {
      logger.error(
        req,
        `AuthService - Error creating Profile with data: ${data}. `,
        error
      );
      throw error;
    }
}

const _findOne = async (req, query, options) => {
    try {
      const result = await mainDBHandler.findOne(req, "profiles", query, options);
      logger.debug(
        req,
        `AuthService - Successfully returned Profile for query: ${query} `
      );
      return result;
    } catch (error) {
      logger.error(
        req,
        `AuthService - Error returning Profile for query: ${query}. `,
        error
      );
      throw error;
    }
}

const _update = async (req, id, data, options) => {
    const userForUpdate = data.user;
    try {
      delete userForUpdate._id;
      await mainDBHandler.updateOne(req, "profiles", { _id :id }, userForUpdate, options);
      const result = await mainDBHandler.findOne(req, "profiles", { _id :id }, options);
      if (result && result.password) delete result.password;
      logger.debug(
        req,
        `AuthService - Successfully updated Profile with id: ${id} `
      );
      return result;
    } catch (error) {
      logger.error(
        req,
        `AuthService - Error updating Profile with id: ${id}. `,
        error
      );
      throw error;
    }
}

const _registerUser = async (req, data) => {
    const userForRegister = data.data;
    try {
      const foundByEmail = await mainDBHandler.findOne(req, "profiles", {
        email: userForRegister.email.toLowerCase(),
      });
      if (foundByEmail) throw error("EMAIL_REGISTERED");

      const foundByUsername = await mainDBHandler.findOne(req, "profiles", {
        username: userForRegister.username,
      });
      if (foundByUsername) throw error("USERNAME_REGISTERED");

      if (userForRegister.password !== userForRegister.confirmPassword)
        throw error("PASSWORDS_DONT_MATCH");
      delete userForRegister.confirmPassword;
      userForRegister.password = _cryptPassword(userForRegister.password);
      const profileData = { ...userForRegister };
      delete profileData.password;
      userForRegister.approved = false;
      userForRegister.verified = false;
      userForRegister.active = true;
      userForRegister.type = "user";
      userForRegister.role = "user";
      userForRegister.email = userForRegister.email && userForRegister.email.toLowerCase()
      userForRegister.username = userForRegister.username  && userForRegister.username.toLowerCase()
      const user = await mainDBHandler.insertOne(null, "profiles", userForRegister);
      if (user.referral) {
        await reward.gamification("points", "points", user._id, null, "register_with_FC", "gamification");
        await reward.gamification("points", "points", user.referral, null, "FC_register", "gamification");
      }

      const invites = await mainDBHandler.findAll(req, 'friends', { type: 'friend', invited: userForRegister.email })
      for (const invite of invites) {
        await mainDBHandler.updateOne(req, 'friends', { _id: invite._id}, { invited: ''+user._id, status: 'd12441123' })
      }

      const predictions = await mainDBHandler.findAll(req, 'data', { type: 'prediction', friendsId: { $in: [userForRegister.email]} })
      for (const prediction of predictions) {
        const { friendsId } = prediction
        if (friendsId) {
          for (let i=0; i< friendsId.length; i++) {
            if (friendsId[i] === userForRegister.email){
              friendsId[i] === ''+user._id
            }
          }
          await mainDBHandler.updateOne(req, 'data', {_id: prediction._id}, { friendsId })
        }
      }

      req.fingerprint.timestampDifference = Math.abs(
        req.fingerprint.serverTimestamp - req.fingerprint.timestamp
      );
      req.fingerprint.user = user;

      const foundSession = await mainDBHandler.findOne(
        req, "sessions",
        { "user.email": req.fingerprint.user.email },
        {}
      );
      if (!foundSession) {
        await mainDBHandler.insertOne(req, "sessions", req.fingerprint, {});
      } else {
        await mainDBHandler.updateOne(
          req, "sessions",
          { "user.email": req.fingerprint.user.email },
          req.fingerprint,
          {}
        );
      }

      logger.debug(
        req,
        `AuthService - Successfully registered User with email: ${userForRegister.email} `
      );
      return user;
    } catch (error) {
      logger.error(
        req,
        `AuthService - Failed to register User with email: ${userForRegister.email}. `,
        error
      );
      throw error;
    }
}

const _login = async (req, data) => {
    const { user } = data
    try {
      const foundByEmail = await mainDBHandler.findOne(req, "profiles", {
        type: 'user',
        email: user.email.toLowerCase(),
      });
      const foundByUsername = await mainDBHandler.findOne(req, "profiles", {
        type: 'user',
        username: user.email.toLowerCase(),
      });
      if (!foundByEmail && !foundByUsername) throw error("NOT_FOUND");
      const found = foundByEmail || foundByUsername;
      if (!found.active) {
        throw error("ACCOUNT_INACTIVE");
      }
      if (!found.password || !_validatePassword(user.password, found.password))
        throw error("INVALID_EMAIL_PASSWORD");

      if (found && found.password) delete found.password;

      req.fingerprint.timestampDifference = Math.abs(
        req.fingerprint.serverTimestamp - req.fingerprint.timestamp
      );
      req.fingerprint.user = found;

      const foundSession = await mainDBHandler.findOne(
        req, "sessions",
        { "user.email": req.fingerprint.user.email },
        {}
      );
      if (!foundSession) {
        await mainDBHandler.insertOne(req, "sessions", req.fingerprint, {});
      } else {
        await mainDBHandler.updateOne(
          req, "sessions",
          { "user.email": req.fingerprint.user.email },
          req.fingerprint,
          {}
        );
      }

      logger.debug(
        req,
        `AuthService - Successfully logged in User with email/username: ${user.email} `
      );
      return found;
    } catch (error) {
      logger.error(
        req,
        `AuthService - Error login User with email/username: ${user.email}. `,
        error
      );
      throw error;
    }
}

const _sendForgotPasswordLink = async (req, data) => {
    const userFromRequest = data.data
    try {
      const user = await mainDBHandler.findOne(
        req, "profiles",
        { email: userFromRequest.email },
        {}
      );
      if (!user) {
        throw error("NOT_FOUND", "user with presented email");
      }

      const forgotToken = crypto.createHash("sha256").digest("hex");

      const hashedToken = _cryptPassword(forgotToken);
      await mainDBHandler.updateOne(
        req, "profiles",
        { email: userFromRequest.email },
        { forgotToken: hashedToken, forgotTimestamp: new Date().getTime() },
        {}
      );

      const redirectUrl = `${config.NODE_WEB_APP_URL}/reset/${forgotToken}/${userFromRequest.email}`;
      await emailService.sendTemplateEmail(
        req,
        userFromRequest.email,
        "FORGOT_PASSWORD",
        "Forgot password",
        "FandomEsports forgot password",
        "Click on the button to enter a new password",
        redirectUrl
      );
      logger.debug(
        req,
        `AuthService - Successfully sent reset password code to email: ${userFromRequest.email} `
      );
      return { success: true };
    } catch (error) {
      logger.error(
        req,
        `AuthService - Error sending forgot password code to email: ${userFromRequest.email}. `,
        error
      );
      throw error;
    }
}

const _forgotPasswordChange = async (req, data) => {
    try {
      const { token, email, password } = data;

      const user = await mainDBHandler.findOne(
        req, "profiles",
        { email: data.email },
        {}
      );
      if (!user) {
        throw error("NOT_FOUND", "user with presented email");
      }

      const difference = Math.abs(new Date().getTime() - user.forgotTimestamp);
      if (difference > 600000) {
        // 600000 is 10 minutes in miliseconds
        await mainDBHandler.updateOne(
          req, "profiles",
          { email },
          { forgotToken: null, forgotTimestamp: null },
          {}
        );
        throw error("NOT_ALLOWED", "token has expired");
      }
      if (!_validatePassword(token, user.forgotToken)) {
        throw error("NOT_ALLOWED", "presented token not valid");
      }

      user.password = _cryptPassword(password);
      user.forgotToken = null;
      user.forgotTimestamp = null;
      await mainDBHandler.updateOne(req, "profiles", { email }, user, {});
      delete user.password;
      logger.debug(
        req,
        `AuthService - Successfully changed forgot password for User with email: ${data.email}. `,
        error
      );
      return user;
    } catch (error) {
      logger.error(
        req,
        `AuthService - Error changing forgot password for User with email: ${data.email}. `,
        error
      );
      throw error;
    }
}

const _changePassword = async (req, data) => {
    try {
      const { oldPassword, password, confirmPassword } = data.data;
      const user = await mainDBHandler.findOne(
        req, "profiles",
        { email: req.fingerprint.user.email },
        {}
      );
      if (!_validatePassword(oldPassword, user.password)) {
        throw error("INVALID_PASSWORD");
      }
      if (password !== confirmPassword) {
        throw error("PASSWORDS_DONT_MATCH");
      }
      user.password = _cryptPassword(password);
      await mainDBHandler.updateOne(
        req, "profiles",
        { email: req.fingerprint.user.email },
        user,
        {}
      );
      delete user.password;
      logger.debug(
        req,
        `AuthService - Successfully changed password for User with email: ${req.fingerprint.user.email} `
      );
      return user;
    } catch (error) {
      logger.error(
        req,
        `AuthService - Error changing password for User with email: ${req.fingerprint.user.email}. `,
        error
      );
      throw error;
    }
}

const _sendInvitation = async (req, data) => {
    try {
      const email = req.fingerprint.user.email;
      const text = `Your friend <b class="inviteLink">${email}</b> invited you to Fandom eSports! </br> Click on a button below to join.`;
      await emailService.sendTemplateEmail(
        req,
        data.email,
        "SEND_INVITATION",
        null,
        "Fandom eSports Invitation",
        text
      );

      logger.debug(
        req,
        `AuthService - Successfully sent invitation to email: ${data.email} `
      );
      return { success: true };
    } catch (error) {
      logger.error(
        req,
        `AuthService - Error sending invitation to email: ${data.email}. `,
        error
      );
      throw error;
    }
}

const _contactForm = async (req, data) => {
    const text = `You have a new message!`;
    try {
      const { name, email, subject, message } = data;
      if (!name.length || !email.length || !subject.length || !message.length) {
        throw error("NOT_ALLOWED", "Please fill in the form and try again");
      }
      await emailService.sendTemplateEmail(
        req,
        config.NODE_EMAIL_CONTACT_TO,
        "CONTACT_FORM",
        "You have a new message!",
        text,
        data
      );
      logger.debug(
        req,
        `AuthService - Successfully received contact form email`
      );
      return "success";
    } catch (error) {
      logger.error(req, `AuthService - error submiting contact form`, error);
      throw error;
    }
}

const _findByUsername = async (req, username, options) => {
  try {
    const data = await mainDBHandler.findOne(req, 'profiles', { username }, options);
    logger.debug(req, `AuthService - Successfully returned User with username: ${username} `);
    return data;
  } catch (error) {
    logger.error(req, `AuthService - Error returning User with username: ${username}. `, error);
    throw error;
  }
}

const _findByEmail = async (req, email, options) => {
  try {
    const data = await mainDBHandler.findOne(req, 'profiles', { email }, options);
    logger.debug(req, `AuthService - Successfully returned User with email: ${email} `);
    return data;
  } catch (error) {
    logger.error(req, `AuthService - Error returning User with email: ${email}. `, error);
    throw error;
  }
}

const _cryptPassword = (password) => {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};
  
const _validatePassword = (password, hash) => {
    return bcrypt.compareSync(password, hash);
};

module.exports = {
    create: _create,
    findOne: _findOne,
    update: _update,
    registerUser: _registerUser,
    login: _login,
    sendForgotPasswordLink: _sendForgotPasswordLink,
    forgotPasswordChange: _forgotPasswordChange,
    changePassword: _changePassword,
    sendInvitation: _sendInvitation,
    contactForm: _contactForm,
    findByUsername: _findByUsername,
    findByEmail: _findByEmail
}