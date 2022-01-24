const express = require('express')
const router = express.Router()
const paymentController = require('./payment.controller')
const authMiddleware = require('../../middleware/auth.middleware')
const scriptsMiddleware = require('../../middleware/scripts.middleware')

router.post('/',
    authMiddleware.checkUserToken,
    scriptsMiddleware.preScriptProcess('transactions', 'user'),
    paymentController.processCommand,
    scriptsMiddleware.postScriptProcess('transactions', 'user')
    )

router.post('/withdraw-webhook', paymentController.processWithdrawWebhook)
router.post('/stripe/webhook', paymentController.processStripeWebhook)
// router.post('/', paymentController.processCommand)


module.exports = router