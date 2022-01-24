const logger = require('../logger')
const error = require('../error')
const config = require('../../config')
const { google } = require('googleapis')
const OAuth2 = google.auth.OAuth2
const nodemailer = require('nodemailer')
const { forgotPasswordTemplate } = require('../email.templates/forgot-password')
const { invitationTemplate } = require('../email.templates/invitation')
const { challengeTemplate } = require('../email.templates/challenge')
const { friendRequest } = require('../email.templates/friend-request')
const { mainTemplate } = require('../email.templates/main-template')
const { contactFormTemplate } = require('../email.templates/contact-form-template');
const { reuploadFilesTemplate } = require('../email.templates/reuploadFiles');

let transporter

const oauth2Client = new OAuth2(
  config.GOOGLE_EMAIL_CLIENT_ID,
  config.GOOGLE_EMAIL_CLIENT_SECRET,
  'https://developers.google.com/oauthplayground'
)

oauth2Client.setCredentials({
  refresh_token: config.GOOGLE_EMAIL_REFRESH_TOKEN
})

const _provisionCallback = async (user, renew, callback) => {
  const tokenData = await oauth2Client.getAccessToken()
  logger.debug(null, 'Refresh email access token')
  if (!tokenData.token) {
    return callback(new Error('Unknown user'))
  } else {
    return callback(null, tokenData.token, tokenData.expiry_date)
  }
}

const _createTransport = async (tokenData) => {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      type: 'OAuth2',
      user: config.GOOGLE_EMAIL_USER,
      accessToken: tokenData.token,
      expires: tokenData.expiry_date,
      provisionCallback: _provisionCallback
    }
  })
}

const _init = async () => {
  try {
    const tokenData = await oauth2Client.getAccessToken()
    logger.debug(null, 'Initial email oAuth data received')
    await _createTransport(tokenData)
  } catch (err) {
    logger.error(null, 'Error initating email transport ', err)
  }
}

_init()

class EmailService {

  async sendTemplateEmail(req, recipient, type, title, subject, text, redirectUrl, recipientName, replyTo) {
    try {
      let html = ''
      switch (type) {
        case 'FORGOT_PASSWORD':
          html = mainTemplate('Forgot Password', config.NODE_WEB_APP, text, forgotPasswordTemplate(redirectUrl))
          break;
        case 'SEND_INVITATION':
          html = mainTemplate('Fandom eSports Invitation', config.NODE_WEB_APP, text, invitationTemplate('https://fandomesports.gg/e2021fs#/'))
          break;
        case 'CONTACT_FORM':
          html = mainTemplate('Contact form', config.NODE_WEB_APP, title, contactFormTemplate(text.email, text.name, text.subject, text.message))
          break;
        case 'REUPLOAD_FILE':
          html = mainTemplate(title, config.NODE_WEB_APP, reuploadFilesTemplate(subject, text, recipientName))
          break;
        case 'CHALLENGE':
          html = mainTemplate('Fandom eSports Friend Challenged you', config.NODE_WEB_APP, title, challengeTemplate({redirectUrl, ...text}))
          break;
        case 'FRIEND_INVITE':
          html = mainTemplate('Fandom eSports Friend Request', config.NODE_WEB_APP, title, friendRequest({redirectUrl, ...text}))
          break;
        default:
          html = `<div> Error </div>`
          break;
      }
      await this.send(req, recipient, subject, html, replyTo)
    } catch (error) {
      logger.error(req, `Error. `, error)
    }
  }

  async send(req, recipient, subject, html, replyTo) {
    const mailOptions = {
      from: replyTo || '"FandomSupport" <' + config.GOOGLE_EMAIL_USER + '>', // sender address
      to: recipient, // list of receivers
      subject: subject, // Subject line
      replyTo
    }

    mailOptions.html = html
    try {
      await transporter.sendMail(mailOptions)
      logger.debug(req, 'Successfully sent email with subject' + subject + ' to ' + recipient)
    } catch (err) {
      logger.error(req, 'Error sending email', err)
    }
  }
}

module.exports = new EmailService()