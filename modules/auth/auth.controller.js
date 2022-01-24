const logger = require('../../lib/logger');
const error               = require('../../lib/error');

const _manager = (social_type) => {
  var handler = require("./" + social_type + "/manager");

  return handler;
}
const SocialMode = {
  NEW: "new",
  UPDATE: "update",
  GET: "get",
  ALL: "all",
  REGISTER: "register",
  LOGIN: "login",
  FORGOT_PASSWORD: "forgot-password",
  CHANGE_FORGOT_PASSWORD: "change_forgot_password",
  CHANGE_PASSWORD: "change-password",
  SEND_INVITATION: "send-invitation",
  CONTACT_FORM: "contact-form",
  FRIENDS: "friends"
}

class AuthController {

  async processCommand(req, res, next) {
    const { mode, data = {} } = req.body
    try {
      const socialManager = _manager(data.social_type);

      let result
      switch (mode) {
        case SocialMode.NEW:
          result = await socialManager.create(req, data, {})
          break;
        case SocialMode.UPDATE:
          result = await socialManager.update(req, data.user._id, data, {})
          break;
        case SocialMode.GET:
          result = await socialManager.findOne(req, data, {})
          break;
        case SocialMode.ALL:
          result = await socialManager.findAll(req, data.query, data.options)
          break;
        case SocialMode.REGISTER:
          result = await socialManager.registerUser(req, data)
          break;
        case SocialMode.LOGIN:
          result = await socialManager.login(req, data);
          break;
        case SocialMode.FORGOT_PASSWORD:
          result = await socialManager.sendForgotPasswordLink(req, data)
          break;
        case SocialMode.CHANGE_FORGOT_PASSWORD:
          result = await socialManager.forgotPasswordChange(req, data)
          break;
        case SocialMode.CHANGE_PASSWORD:
          result = await socialManager.changePassword(req, data)
          break;
        case SocialMode.SEND_INVITATION:
          result = await socialManager.sendInvitation(req, data)
          break;
        case SocialMode.CONTACT_FORM:
          result = await socialManager.contactForm(req, data)
          break;
        case SocialMode.FRIENDS:
          result = await socialManager.friends(req, data)
          break;
        default:
          throw error('NOT_AUTHENTICATED', 'route does not exist')
      }
      logger.info(req, `Successfully finished ${data.social_type} ${mode} action on auth data `)
      req.response = result
      next()
    } catch (error) {
      logger.error(req, `Error processing ${data.social_type} ${mode} action on auth data `, error)
      next(error)
    }
  }
}

module.exports = new AuthController()