const logger = require("../../../lib/logger");
const error = require('../../../lib/error');
const config = require("../../../config");
const axios = require("axios");

const _login = async(req, data) => {
    const { accessToken, referral } = data.data;

    logger.debug(req, 'Twitch router, getUserData access token fetched', accessToken);
  
    try {
        const response = await getData("https://api.twitch.tv/helix/users", accessToken);
        req.response = response.data.data[0];
        const userForReturn = {
            id: response.data.data[0].id,
            fullName: response.data.data[0].display_name.toLowerCase(),
            firstName: "",
            lastName: "",
            email: response.data.data[0].email ? response.data.data[0].email : "",
            avatar: response.data.data[0].profile_image_url,
            referral
        }
        logger.debug(req, 'Twitch router, getUserData authentification successfull with response', response);
        return userForReturn;
    } catch (err) {
        console.error(err);
    }
};

const _friends = async(req, data) => {
    const accessToken = data.token;

    logger.debug(req, 'Twitch router, getFriends access token fetched', accessToken);
    try {
        var followers = [];
        var following = [];
        const response = await getData("https://api.twitch.tv/helix/users", accessToken);
        const id = response.data.data[0].id;

        var resultFollowing = await getData(`https://api.twitch.tv/helix/users/follows?from_id=${id}&first=100`, accessToken);
        following = following.concat(resultFollowing.data.data);
        var cursor;
        while (resultFollowing.data.pagination && resultFollowing.data.pagination.cursor) {
            cursor = resultFollowing.data.pagination.cursor;
            resultFollowing = await getData(`https://api.twitch.tv/helix/users/follows?from_id=${id}&first=100&after=${cursor}`, accessToken);

            following = following.concat(resultFollowing.data.data);
        }
        logger.debug(req, 'Twitch router, Following data', following);

        var resultFollowers = await getData(`https://api.twitch.tv/helix/users/follows?to_id=${id}&first=100`, accessToken);
        followers = followers.concat(resultFollowers.data.data);
        var cursor;
        while (resultFollowers.data.pagination && resultFollowers.data.pagination.cursor) {
            cursor = resultFollowers.data.pagination.cursor;
            resultFollowers = await getData(`https://api.twitch.tv/helix/users/follows?to_id=${id}&first=100&after=${cursor}`, accessToken);
            followers = followers.concat(resultFollowers.data.data);
        }
        logger.debug(req, 'Twitch router, Followers data', followers);
        
        const promisesFollowers = followers.map(async user => {
            return (await getData(`https://api.twitch.tv/helix/users?id=${user.from_id}`, accessToken)).data.data[0];
        });

        const promisesFollowing = following.map(async user => {
            return (await getData(`https://api.twitch.tv/helix/users?id=${user.to_id}`, accessToken)).data.data[0];
        });
        const resFollowing = await Promise.all(promisesFollowing);
        const resFollowers = await Promise.all(promisesFollowers);
        const users = { followers: resFollowers, following: resFollowing };
        req.response = users;
        logger.debug(req, 'Twitch router, successfully get friends', followers);
        return users;
    } catch (err) {
        console.error(err);
    }
}

const getData = async(url, accessToken) => {
    const requestConfig = {
        method: "get",
        url,
        headers: {
            Authorization: `Bearer ${accessToken}`,
            "Client-ID": config.TWITCH_AUTH_CLIENT_ID,
        },
    };
    const result = await axios(requestConfig)
    return result;
};


module.exports = {
    login: _login,
    friends: _friends
}