const paymentService      = require('./payment.service')
const logger              = require('../../lib/logger')
const error               = require('../../lib/error')
const config              = require('../../config')
class PaymentController {

  async processCommand(req, res, next) {
    const { mode, data = {} } = req.body;
    try {
      let result
      switch (mode) {
        case 'token':
          result = await paymentService.generateToken(req)
          break;
        case 'deposit':
          result = await paymentService.deposit(req, data)
          break;
        case 'withdraw':
          result = await paymentService.withdraw(req, data)
          break;
        case 'cashToVirtual':
          result = await paymentService.cashToVirtualPoints(req, data.cash, req.fingerprint.user)
          break;
        case 'transactions':
          result = await paymentService.getUserPayments(req, data.pageSize, data.pageNumber, req.fingerprint.user.id, {})
          break;
        case 'paypal-check':
          result = await paymentService.checkPayPalOrder(req, data)
          break;
        case 'stripe-deosit':
          result = await paymentService.processStripePayment(req, data)
          break;
        case 'stripe-charge':
          result = await paymentService.processStripePayment(req, data)
          break;
        default:
          throw error('NOT_AUTHENTICATED', 'route does not exist')
      }
      logger.info(req, `Successfully finished ${mode} action on payment data `)
      req.response = result
      next()
    } catch (error) {
      logger.error(req, `Error processing ${mode} action on payment data `, error)
      next(error)
    }
  }

  async processWithdrawWebhook(req, res, next) {
    try {
      await paymentService.processWithdrawWebhook(req)
      req.response = { success: true }
      next()
    } catch (error) {
      logger.error(req, `Error processing paypal webhook event. `, error)
      next(error)
    }
  }
  
  async processStripeWebhook(req, res, next) {
    try {
      await paymentService.processStripeWebhook(req)
      res.status(200).send();
    } catch (error) {
      logger.error(req, `Error processing paypal webhook event. `, error)
      next(error)
    }
  }
}

module.exports = new PaymentController()