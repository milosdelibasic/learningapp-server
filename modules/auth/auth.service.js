const bcrypt = require("bcryptjs");
const error = require("../../lib/error");
const logger = require("../../lib/logger");
const { generateToken, generateRefreshToken } = require("./../auth.js");
const mainDBHandler = require("../../database/main.handler");

class ProfileService {
  constructor() {}

  async registerUser(req, data) {
    let { email = "", password = "" } = data;
    console.log(
      "🚀 ~ file: auth.service.js ~ line 11 ~ ProfileService ~ registerUser ~ data",
      data
    );

    if (email.length === 0 || password.length === 0) {
      throw error("NO_DATA_PROVIDED");
    }

    try {
      const foundByEmail = await mainDBHandler.findOne(req, "profiles", {
        email: email.toLowerCase(),
      });

      if (foundByEmail) throw error("EMAIL_REGISTERED");

      //   const foundByPhone = await mainDBHandler.findAll(req, "profiles", {
      //     phone: data.phone,
      //   });
      //   const alreadyRegistered = foundByPhone.find((it) => it.type === "user");

      //   if (alreadyRegistered) {
      //     throw error("UNIQUE_PHONE");
      //   }

      data.password = _cryptPassword(password);
      data.active = true;
      data.type = "user";
      data.email = email && email.toLowerCase().trim();
      let user = null;

      user = await mainDBHandler.insertOne(req, "profiles", data);

      delete data.password;

      const token = await generateToken(user);
      const refreshToken = await generateRefreshToken(user._id);
      user.token = token;
      user.refreshToken = refreshToken;

      logger.debug(
        req,
        `AuthService - Successfully registered User with email: ${data.email} `
      );
      return user;
    } catch (error) {
      logger.error(
        req,
        `AuthService - Failed to register User with email: ${data.email}. `,
        error
      );
      throw error;
    }
  }

  async login(req, data) {
    const { email = "", password = "" } = data;

    if (email.length === 0 || password.length === 0) {
      throw error("NO_DATA_PROVIDED");
    }
    try {
      const foundByEmail = await mainDBHandler.findOne(req, "profiles", {
        email: email.toLowerCase(),
      });
      if (!foundByEmail || foundByEmail.type !== "user")
        throw error("NOT_FOUND_EMAIL");
      const found = foundByEmail;
      if (!_validatePassword(password, found.password)) {
        throw error("INVALID_PASSWORD");
      }

      if (found && found.password) delete found.password;

      const token = await generateToken(found);
      const refreshToken = await generateRefreshToken(found._id);

      found.token = token;
      found.refreshToken = refreshToken;

      logger.debug(
        req,
        `AuthService - Successfully logged in User with email/username: ${data.email} `
      );

      return found;
    } catch (error) {
      logger.error(
        req,
        `AuthService - Error login User with email/username: ${data.email}. `,
        error
      );
      throw error;
    }
  }
}

const _cryptPassword = (password) => {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

const _validatePassword = (password, hash) => {
  return bcrypt.compareSync(password, hash);
};

module.exports = new ProfileService();
