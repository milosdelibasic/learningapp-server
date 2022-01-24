const axios = require("axios");
const logger = require("../../../lib/logger");
const { OAuth2Client } = require("google-auth-library");
const config = require("../../../config");
const nodemailer = require("nodemailer");
const { mainTemplate } = require('../../../lib/email.templates/main-template')
const { invitationTemplate } = require('../../../lib/email.templates/invitation')

const GOOGLE_USER_DATA_ENDPOINT =
  "https://www.googleapis.com/oauth2/v1/userinfo?alt=json";
const redirectUrls = config.GOOGLE_AUTH_REDIRECT_URLS.split(',');

const params = "personFields=emailAddresses";
const GOOGLE_CONTACTS_ENDPOINT = 
  "https://people.googleapis.com/v1/people/me/connections?"+params;

const _login = async (req, data) => {

    logger.debug(req, 'Google router, login initialization');
    const { code, referral } = data.data;

    const googleData = await getGoogleData(req, code, GOOGLE_USER_DATA_ENDPOINT);

    logger.debug(req, 'Google router, login, google data', googleData);
    const userForReturn = {
      id: googleData.id,
      fullName: ((googleData.given_name || '') + ' ' + (googleData.family_name || '')).trim(),
      firstName: googleData.given_name,
      lastName: googleData.family_name,
      email: googleData.email,
      avatar: googleData.picture,
      referral
    }
    logger.debug(req, 'Google router, login, google user for return', userForReturn);
    return userForReturn;
}

const _friends = async (req, data) => {
  logger.debug(req, 'Google router, friends initialization', data);
    const { code } = data;

    const result = await getGoogleData(req, code, GOOGLE_CONTACTS_ENDPOINT);
    logger.debug(req, 'Google router, friends, google data', result);
    return result.connections;
}

const _sendInvitation = async (req, data) => {
    const html = mainTemplate('Fandom eSports Invitation', config.NODE_WEB_APP, "SEND INVITATION", invitationTemplate('https://fandomesports.gg/e2021fs#/'));
    try {
      logger.debug(req, 'Google router, sendEmail initialization');
      const token = await _getAccessToken(req, data.code);
      const requestConfig = {
        method: "get",
        url: GOOGLE_USER_DATA_ENDPOINT,
        headers: {
        Authorization: `Bearer ${token.access_token}`,
        },
      };
      const googleData = await axios(requestConfig);

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          type: 'OAuth2',
          user: googleData.data.email,
          clientId: config.GOOGLE_AUTH_CLIENT_ID,
          clientSecret: config.GOOGLE_AUTH_CLIENT_SECRET,
          accessToken: token.access_token,
          refreshToken: token.refresh_token
        }
      });

      const mailOptions = {
        from: googleData.data.email,
        to: data.recipient,
        subject: data.subject,
        html
      };

      await transporter.sendMail(mailOptions)
      logger.debug(req, 'Google router, sendEmail method finished');
    } catch(err) {
      logger.error(req, 'Error sending email with Google', err)
      throw err;
    }
  }

const getGoogleData = async (req, code, url) => {
    try {
      logger.debug(req, 'Google router, getGoogleData fetch access token initialization', code);
      const token = (await _getAccessToken(req, code)).access_token;
      
      logger.debug(req, 'Google router, getGoogleData access token fetched', token);
      const requestConfig = {
        method: "get",
        url: url,
        headers: {
        Authorization: `Bearer ${token}`,
        },
      };
        
      logger.debug(req, 'Google router, getGo ogleData request authentification with auth params params', requestConfig);
      const response = await axios(requestConfig);
      logger.debug(req, 'Google router, GetGoogleData method successfully processed');
      return response.data;
    } catch (err) {
      logger.error(req, 'Error registering with Google', err)
      throw err;
    }
}

const _getAccessToken = async (req, code) => {
    const oauth2client = new OAuth2Client(
        config.GOOGLE_AUTH_CLIENT_ID,
        config.GOOGLE_AUTH_CLIENT_SECRET,
        redirectUrls[0]
    );
    const response = await oauth2client.getToken(code);
    logger.debug(req, 'Google router, GetAccessToken method successfully processed', response);
    const token = response.tokens;
    
    return token;
}

module.exports = {
    login: _login,
    friends: _friends,
    sendInvitation: _sendInvitation,
    getAccessToken: _getAccessToken
}