const logger = require("../../../lib/logger");
const error = require('../../../lib/error');
const OAuthClient = require("disco-oauth");
const config = require("../../../config");
const { default: axios } = require("axios");

const redirectUrls = config.DISCORD_AUTH_REDIRECT_URLS.split(',');
const oauthClient = new OAuthClient(config.DISCORD_AUTH_CLIENT_ID, config.DISCORD_AUTH_CLIENT_SECRET);
const discord = "https://discord.com/api/users/";

const _login = async (req, data) => {
    const { code, referral } = data.data;
    try {
        
        logger.debug(req, 'Discord router, getDiscordData initialization', data);
        const key = await getAccessToken(req, code);
        logger.debug(req, 'Discord router, getDiscordData token', key);
        const user = await oauthClient.getUser(key);
        logger.debug(req, 'Discord router, getDiscordData user data fetched', user);

        const avatar = `https://cdn.discordapp.com/avatars/${user._id}/${user._avatarHash}`;
    
        const userForReturn = {
            id: user._id,
            fullName: "",
            firstName: "",
            lastName: "",
            email: user._emailId,
            avatar,
            referral
        }
        logger.debug(req, 'Discord router, getDiscordData method finished', userForReturn);
        return userForReturn;
    } catch (err) {
        logger.error(req, `Error fetching getDiscordData: `, err.message);
        throw err.message;
    }
}

const _friends = async (req, data) => {
    const { code } = data
    try {
        logger.debug(req, 'Discord router, getFriendsList initialization', data);
        const key = await getAccessToken(req, code);

        const friends = [];
        const relationships = await axios.get(`${discord}me/relationships`, {
            headers: {
                'Authorization': `Bearer ${key}`
            }
        });
        if (relationships) {
            relationships.forEach(element => {
                if (element.type === "friend") {
                    friends.push(element.User);
                }
            });
        }
        logger.debug(req, 'Discord router, getFriendsList method finished', friends);
        return friends;
    } catch (err) {
        logger.error(req, `Error fetching getFriendsList: `, err.message);
        throw err.message;
    }
}

const getAccessToken = async (req, code) => {
    //add scope for relationships
    oauthClient.setScopes("identify", "email", "guilds");
    oauthClient.setRedirect(redirectUrls[0]);
    
    const token = await oauthClient.getAccess(code);
    logger.debug(req, 'Discord router, getAccessToken method finished', token);

    return token
}

module.exports = {
    login: _login,
    friends: _friends
}