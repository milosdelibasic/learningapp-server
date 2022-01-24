const DBHandler = require("../database/main.handler");

module.exports = (err, req, res, next) => {
  res.status(err.code || 500);
  res.send({ error: err });
  try {
    if (req.db) {
      DBHandler.close(req, req.db);
      req.db = null;
    }
  } catch (err) {
    //to prevent breaking the app on connection errors
  }
};
