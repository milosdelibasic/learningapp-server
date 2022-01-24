const logger = require("../../../lib/logger");
const error = require('../../../lib/error');
const axios = require("axios");
const config = require("../../../config");
const OAuth = require('oauth');
const { promisify } = require('util');

const TWITTER_V1 = "https://api.twitter.com/1.1/";
const TWITTER_V2 = "https://api.twitter.com/2/";

const _oauth = async (url) => {
    const consumer = new OAuth.OAuth(
        "https://twitter.com/oauth/request_token", "https://twitter.com/oauth/access_token", 
        config.TWITTER_CONSUMER_KEY, config.TWITTER_CONSUMER_SECRET, "1.0A", url, "HMAC-SHA1");
    return consumer;
}
const _oauthGet = async (url, oauthAccessToken, oauthAccessTokenSecret) => {
    const oauthConsumer = await _oauth(null);
    return promisify(oauthConsumer.get.bind(oauthConsumer))(url, oauthAccessToken, oauthAccessTokenSecret)
      .then(body => JSON.parse(body))
}

const _login = async (req, data) => {
    
    const { oauth_token, oauth_token_secret, referral } = data.data;

    logger.debug(req, 'Twitter router, login initialization', data);

    try {
        //oauth1 api v1
        const response = await _oauthGet(`${TWITTER_V1}account/verify_credentials.json?include_email=true`, oauth_token, oauth_token_secret);

        const userForReturn = {
            id: response.id_str,
            fullName: response.name,
            firstName: "",
            lastName: "",
            email: response.email,
            avatar: response.profile_image_url_https,
            referral
        }


        //oauth1 api v2
        // const response = await _oauthGet(`${TWITTER_V2}users/${user_id}?user.fields=profile_image_url`, oauth_token, oauth_token_secret);

        // const userForReturn = {
        //     id: response.id,
        //     fullName: response.name,
        //     firstName: "",
        //     lastName: "",
        //     email: "",
        //     avatar: response.profile_image_url,
        //     referral
        // }

        logger.debug(req, 'Twitter router, login method user data fetched', response);

        logger.debug(req, 'Twitter router, login method finished', userForReturn);
        return userForReturn;
    } catch (err) {
        logger.error(req, `Error fetching Twitter data: `, err.message);
        throw err.message;
    }
}

module.exports = {
    login: _login,
    oauth: _oauth
}