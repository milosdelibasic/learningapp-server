const express               = require('express');
const router                = express.Router();
const controller     = require('./admin.controller');
const authMiddleware = require('../../middleware/auth.middleware')

router.post('/', authMiddleware.checkUserToken, controller.processCommand)
module.exports = router;