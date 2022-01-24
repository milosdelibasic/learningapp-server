const express = require("express");
const router = express.Router();
const controller = require("./data.controller");
const authMiddleware = require("../../middleware/auth.middleware");
const scriptsMiddleware = require("../../middleware/scripts.middleware");

router.post(
  "/:name/:type",
  authMiddleware.checkUserToken,
  scriptsMiddleware.preScriptProcess(),
  controller.processCommand,
  scriptsMiddleware.postScriptProcess()
);

module.exports = router;
