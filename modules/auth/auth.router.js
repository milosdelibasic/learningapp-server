const express               = require('express');
const router                = express.Router();
const authController     = require('./auth.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const scriptsMiddleware = require('../../middleware/scripts.middleware');
const config = require("../../config");
const logger = require("../../lib/logger");


router.post('/',
  authMiddleware.checkUserToken,
  scriptsMiddleware.preScriptProcess('auth', 'user'),
  authController.processCommand,
  scriptsMiddleware.postScriptProcess('auth', 'user')
);

module.exports = router;