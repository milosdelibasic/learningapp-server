const config = require("../config/");
const jwt = require("jsonwebtoken");
const mainDBHandler = require("../database/main.handler");
const error = require("../lib/error");

const auth = {
  checkUserToken: async (req, res, next) => {
    // check header or url parameters or post parameters for token
    const token = req.headers["x-access-token"];
    if (!token) return next(error("FORBIDDEN"));

    // verifies secret and checks exp
    jwt.verify(token, config.NODE_TOKEN_SECRET, async (err, decoded) => {
      if (err && err.message === "jwt expired") {
        return next(error("EXPIRED"));
      } else {
        if (decoded && decoded.id) {
          const user = await mainDBHandler.findOne(req, "profiles", { _id: decoded.id });

          if (user) {
            req.user = user;
            return next();
          }
        }
      }

      return next(error("FORBIDDEN"));
    });
  },

  checkRefreshToken: async (req, res, next) => {
    const token = req.headers["x-refresh-access-token"];
    if (!token) return next(error("NOT_AUTHORIZED"));

    jwt.verify(token, config.NODE_REFRESH_TOKEN_SECRET, async (err, decoded) => {
      if (err) {
        if (err.message == "jwt expired") {
          return next(error("FORBIDDEN"));
        } else {
          return next(error("FORBIDDEN"));
        }
      } else {
        if (decoded && decoded.id) {
          const user = await mainDBHandler.findOne(req, "profiles", { _id: decoded.id });
          if (user) {
            req.user = user;
            return next();
          }
        }
      }
      return next(error("FORBIDDEN"));
    });
  },

  checkIsUser: async (req, res, next) => {
    const userId = req.params.userId;
    if (!userId) return next(error('NOT_AUTHORIZED'))
    const user = await mainDBHandler.findOne(req, "profiles", { _id: userId, type: 'user' })
    if (user) {
      req.user = user;
      return next();
    } else {
      return next(error("FORBIDDEN"))
    }
  },

  checkIsRestaurant: async (req, res, next) => {
    const restaurantId = req.params.restaurantId;
    if (!restaurantId) return next(error('NOT_AUTHORIZED'))
    const user = await mainDBHandler.findOne(req, "profiles", { _id: restaurantId, type: 'restaurant' })
    if (user) {
      req.user = user;
      return next();
    } else {
      return next(error("FORBIDDEN"))
    }
  }
};

module.exports = auth;
