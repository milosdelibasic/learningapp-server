const logger = require("../../../lib/logger");
const error = require('../../../lib/error');
const axios = require("axios");

const FACEBOOK_ROOT = "https://graph.facebook.com/v10.0/";

const _login = async (req, data) => {
    const { userId, token, referral } = data.data
    try {
        logger.debug(req, 'Facebook router, fbAuthenticate initialization', data);
        const response = await _getData(
            `${FACEBOOK_ROOT}${userId}?fields=id,first_name,last_name,email,picture&access_token=${token}`
        );
        logger.debug(req, 'Facebook router, fbAuthenticate user data fetched', response.response);
    
        logger.debug(req, 'Facebook router, fbAuthenticate fetch user picture initialization');
        const picture = await _getData(
            `${FACEBOOK_ROOT}${userId}/picture?type=large&redirect=false&height=500`
        );
        logger.debug(req, 'Facebook router, fbAuthenticate user picture fetched', picture.data);
    
        if (!response || !response.data) {
            throw error("NOT_FOUND");
        }
    
        if (_isPictureMissingInData(response, picture)) {
            response.data.userPicture = picture.data;
        }

        const userForReturn = {
            id: response.data.id,
            fullName: ((response.data.first_name || '') + ' ' + (response.data.last_name || '')).trim(),
            firstName: response.data.first_name,
            lastName: response.data.last_name,
            email: response.data.email,
            avatar: response.data.picture.data.url,
            referral
        }

        logger.debug(req, 'Facebook router, fbAuthenticate method finished', userForReturn);
        return userForReturn;
    } catch (err) {
        logger.error(req, `Error fetching Facebook Graph API: `, err.message);
        throw err.message;
    }
}

const _friends = async (req, data) => {
    const { token } = data;
    
    try {
        logger.debug(req, 'Facebook router, fbGetFriends initialization', data);
        const response = await _getData(
            `${FACEBOOK_ROOT}me/friends?fields=id,email&access_token=${token}`
        );
        logger.debug(req, 'Facebook router, fbGetFriends friends data fetched', response.data);
    
        logger.debug(req, 'Facebook router, fbGetFriends method finished');
        return response.data;
    } catch (err) {
        logger.error(req, `Error fetching fbGetFriends: `, err.message);
        throw err.message;
    }
}

const _isPictureMissingInData = (data, picture) => {
    return picture && picture.data && !data.data.picture;
}

const _getData = async (url) => {
    return await axios.get(url);
}

module.exports = {
    login: _login,
    friends: _friends
}