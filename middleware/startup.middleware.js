const logger = require("../lib/logger");
const DBHandler = require("../database/main.handler");

exports.dbConnection = async (req, res, next) => {
  try {
    await DBHandler.connect(req);
    next();
  } catch (err) {
    logger.error(req, "Error connecting to the Database", err);
    next(err);
  }
};
