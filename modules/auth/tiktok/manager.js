const error = require('../../../lib/error');
const logger = require('../../../lib/logger');
const axios = require('axios');
const config = require("../../../config");
const qs = require('qs');

const redirectUrls = config.TIKTOK_AUTH_REDIRECT_URLS.split(',');
const tiktok = "https://open-api.tiktok.com/oauth/";
const clientKey = config.TIKTOK_AUTH_CLIENT_KEY;
const clientSecret = config.TIKTOK_AUTH_CLIENT_SECRET;

const _login = async (req, data) => {
    const { code, referral } = data.data
    try {
        logger.debug(req, 'TikTok router, getData initialization, code: ', code);
        const token = await getAccesToken(req, code);
        const { access_token, open_id } = token;
        logger.debug(req, `TikTok router, access token: ${access_token}, open id = ${open_id}`);
        const user = await axios.get(`${tiktok}userinfo?open_id=${open_id}&access_token=${access_token}`);
        logger.debug(req, 'TikTok router, TikTok user data ', user);
        const userForReturn = {
            id: user.data.open_id,
            fullName: "",
            firstName: "",
            lastName: "",
            email: "",
            avatar: user.data.avatar,
            referral
        }
        return userForReturn;
    } catch (err) {
        logger.error(req, "Error registering with TikTok. ", err)
        throw err;
    }
    
}

const getAccesToken = async (req, code) => {
    try{
        logger.debug(req, 'TikTok router, getAccesToken initialization');
        const token = await axios.post(
            `${tiktok}access_token?client_key=${clientKey}&client_secret=${clientSecret}&code=${code}&grant_type=authorization_code`
            );
        logger.debug(req, 'TikTok router, token data: ', token);
        return token.data;
    } catch (err) {
        logger.error(req, "Error get Access Token with TikTok. ", err)
        throw err;
    }
}

module.exports = {
    login: _login
}