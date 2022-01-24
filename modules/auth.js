const config = require("../config");
const jwt = require("jsonwebtoken");

module.exports.generateToken = (data, options = { expiresIn: 7 * 24 * 60 * 60 }) => {
    // expires in 7 days 7 * 24 * 60 * 60
    const token = jwt.sign(
        {
            email: data.email,
            id: data._id,
        },
        config.NODE_TOKEN_SECRET,
        {
            expiresIn: options.expiresIn
        }
    );
    return token;
}
module.exports.generateRefreshToken = (userId, options = { expiresIn: 86400 * 182 }) => {
    // expires in half year 86400 * 182 
    const token = jwt.sign(
        {
            id: userId,
        },
        config.NODE_REFRESH_TOKEN_SECRET,
        {
            expiresIn: options.expiresIn,
        }
    );
    return token;
};