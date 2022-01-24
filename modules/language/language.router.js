const express               = require('express');
const router                = express.Router();
const languageController    = require('./language.controller');
const authMiddleware = require('./../../middleware/auth.middleware')

router.post('/', authMiddleware.checkUserToken, languageController.processCommand);

module.exports = router;