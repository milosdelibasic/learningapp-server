const error = require('../../../lib/error');
const logger = require('../../../lib/logger');
const axios = require('axios');
const config = require("../../../config");
const qs = require('qs');

const redirectUrls = config.INSTAGRAM_AUTH_REDIRECT_URLS.split(',');
const graph = "https://graph.instagram.com/";
const instagram = "https://api.instagram.com/";
const clientId = config.INSTAGRAM_AUTH_CLIENT_ID;
const clientSecret = config.INSTAGRAM_AUTH_CLIENT_SECRET;

const _login = async (req, data) => {
    const { code, referral } = data.data
    try {
        logger.debug(req, 'Instagram router, getData initialization');
        const token = await getAccesToken(code);
        const { access_token, user_id } = token;
        const user = await axios.get(`${graph}me?fields=id,username&access_token=${access_token}`);
        const userForReturn = {
            id: user.data.id,
            fullName: "",
            firstName: "",
            lastName: "",
            email: "",
            avatar: null,
            referral
        }
        return userForReturn;
    } catch (err) {
        logger.error(req, "Error registering with Instagram. ", err)
        throw err;
    }
    
}

const getAccesToken = async (code) => {
    const token = await axios({
        method: 'post',
        url: `${instagram}oauth/access_token`,
        data: qs.stringify({
            "client_id":clientId,
            "client_secret":clientSecret,
            "grant_type":"authorization_code",
            "redirect_uri":redirectUrls[0],
            "code":code
        }),
        headers: {
          'content-type': 'application/x-www-form-urlencoded'
        }
    });
    return token.data;
}

module.exports = {
    login: _login
}