const error = require('../../lib/error')
const logger = require('../../lib/logger')
const axios = require('axios')
const moment = require('moment')
const accounting = require('accounting-js')
const config = require('../../config')
const mainDBHandler = require('../../database/main.handler');
const uuid = require('uuid/v4')

const DEFAULT_LIMITS = {
  "minimumDeposit": 5,
  "minimumWithdraw": 5,
  "maximumDeposit": 2000,
  "maximumWithdraw": 2000,
}

class PaymentService {

  async generateToken(req) {
    try {
      const token = await braintreeService.generateToken()
      logger.debug(req, `Successfully generated braintree token `)
      return token
    } catch (error) {
      logger.error(req, `PaymentService - Error generating token. `, error);
      throw error;
    }
  }

  async deposit(req, data) {
    // dummy deposit method
    if (config.MAX_DAILY_DEPOSIT_AMOUNT) {
      if (Number(data.amount) > Number(config.MAX_DAILY_DEPOSIT_AMOUNT)) {
        throw error('CUSTOM', {code: 400, message: `Your wallet has a deposit limit of ${accounting.formatMoney(Number(config.MAX_DAILY_DEPOSIT_AMOUNT))} per day`})
      }
      const statOfTheDay = moment().startOf('day').valueOf()
      const userTransactions = await mainDBHandler.aggregate(req, 'transactions', [
        {$match: {type: 'user', userId: req.user._id, transactionType: 'DEPOSIT', createdAt: { $gte: statOfTheDay }}},
        {$group: {_id: null, amount: {$sum: '$amount'}, credit: {$sum: '$credit'}}}
      ])
      if (userTransactions && userTransactions[0] && (userTransactions[0].amount + Number(data.amount)) > Number(config.MAX_DAILY_DEPOSIT_AMOUNT)) {
        throw error('CUSTOM', {code: 400, message: `Your wallet has a deposit limit of ${accounting.formatMoney(Number(config.MAX_DAILY_DEPOSIT_AMOUNT))} per day`})
      }
    }

    try {
      const transaction = {
        transactionId: uuid(),
        type: 'user',
        transactionType: 'DEPOSIT',
        status: 'd44335691',
        paymentType: 'card',
        info: `Deposit from user ${data.email}`,
        amount: Number(data.amount),
        userId: data.userId,
        createdAt: (new Date()).getTime()
      }
      let result = await mainDBHandler.insertOne(req, 'transactions', transaction, {});
      logger.debug(req, `PaymentService - Successfully processed dummy deposit charge `)
      return result;
    } catch (error) {
      logger.error(req, `PaymentService - Error processing dummy deposit charge. `, error)
      throw error
    }
  }

  async withdraw(req, data) {
    try {
      const { amount, paypalEmail } = data;
      if (amount < 0) throw error('CUSTOM', { code: 400, message: 'd01411821' })

      const dbLimit = await mainDBHandler.findOne(req, 'config', { type: 'limit' })
      const limit = { ...DEFAULT_LIMITS, ...(dbLimit || {}) }
      if (amount <= limit.minimumWithdraw) throw error('CUSTOM', { code: 400, message: 'd06471751' })
      if (amount >= limit.maximumWithdraw) throw error('CUSTOM', { code: 400, message: 'd0420666' })
      const user = await profileService.findOne(req, { id: req.fingerprint.user.id }, {})

      const userTransactions = await mainDBHandler.aggregate(req, 'transactions', [
        { $match: { type: 'user', userId: user.id } },
        { $group: { _id: null, amount: { $sum: '$amount' }, credit: { $sum: '$credit' } } }
      ])
      if (userTransactions[0].amount < amount) throw error('CUSTOM', { code: 400, message: 'd5604941' })

      if (!user) {
        throw error('NOT_FOUND', `User doesn't exist`)
      }
      const paypalAuthToken = await _getPaypalAuthToken(req)

      const payout = {
        sender_batch_header: {
          sender_batch_id: (new Date()).getTime().toString(),
          email_subject: 'You have a payout!',
          email_message: 'You have received a payout! Thanks for using our service!'
        },
        items: [
          {
            recipient_type: 'EMAIL',
            amount: {
              'value': amount,
              'currency': 'USD'
            },
            receiver: paypalEmail
          }
        ]
      };
      const paypalTransaction = await axios({
        url: '/v1/payments/payouts',
        method: 'post',
        baseURL: config.PAYPAL_URL,
        data: payout,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + paypalAuthToken.data.access_token
        }
      })

      const paymentData = await this.insertOne(req, paypalTransaction.data, {})
      const transaction = {
        transactionId: paymentData.batch_header.payout_batch_id,
        type: 'user',
        transactionType: 'WITHDRAW',
        status: 'd44335691',
        paymentType: 'paypal',
        info: paypalEmail,
        amount: -amount,
        userId: user.id,
        createdAt: (new Date()).getTime()
      }
      await mainDBHandler.insertOne(req, 'transactions', transaction, {})

      logger.debug(req, `PaymentService - Successfully user with paypal email: ${paypalEmail} made a ${amount} withdraw `)
      return 'success';
    } catch (error) {
      logger.error(req, `PaymentService - Error withdrawing ${data.amount} by ${data.paypalEmail}. `, error);
      throw error
    }
  }

  async cashToVirtualPoints(req, cash, loggedUser) {
    try {
      if (cash < 0) throw error('CUSTOM', { code: 400, message: 'd01411821' })
      const user = await mainDBHandler.findOne(req, 'profiles', { email: loggedUser.email }, {})
      if (user.password) delete user.password

      const userTransactions = await mainDBHandler.aggregate(req, 'transactions', [
        { $match: { type: 'user', userId: loggedUser.id } },
        { $group: { _id: null, amount: { $sum: '$amount' }, credit: { $sum: '$credit' } } }
      ])
      if (userTransactions.length > 0 && userTransactions[0].amount >= cash && userTransactions[0].amount > 0) {
        const transaction = {
          type: 'user',
          transactionType: 'CONVERSION',
          status: 'd43334659',
          paymentType: 'd30863026',
          amount: -cash,
          credit: Number(config.CONVERSION_RATE) * cash,
          userId: user.id,
          createdAt: (new Date()).getTime()
        }
        await mainDBHandler.insertOne(req, 'transactions', transaction, {})
        return 'success';
      } else {
        throw error('CUSTOM', { code: 400, message: 'd5604941' })
      }
    } catch (error) {
      logger.error(req, 'PaymentService - Error during converting cash to virtual points. ', error)
      throw error
    }
  }


  async processWithdrawWebhook(req) {
    try {
      const hook = req.body
      if (hook.resource && hook.resource.batch_header && (hook.resource.batch_header.batch_status === "SUCCESS" || hook.resource.batch_header.batch_status === "DENIED")) {

        const transaction = await mainDBHandler.findOne(req, 'transactions', { transactionId: hook.resource.batch_header.payout_batch_id }, {})

        if (!transaction) {
          logger.error(req, 'PaymentService - processWithdrawWebhook transaction not found ', hook.resource)
        }
        await mainDBHandler.updateOne(req, 'transactions', { id: transaction.id }, { status: 'd43334659' }, {})
        await this.updateOne(req, { 'batch_header.payout_batch_id': hook.resource.batch_header.payout_batch_id }, { status: 'd43334659' }, {})
      }

      logger.debug(req, `PaymentService - Successfully processed paypal webhook `)
      return { success: true }
    } catch (error) {
      logger.error(req, `PaymentService - Error processing paypal webhook. `, error)
      throw error
    }
  }

  async _getPaypalAuthToken(req) {
    try {
      const paypalAuthToken = await axios({
        url: '/v1/oauth2/token',
        method: 'post',
        baseURL: config.PAYPAL_URL,
        data: `grant_type=client_credentials`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${Buffer.from(config.PAYPAL_CLIENT_ID + ':' + config.PAYPAL_CLIENT_SECRET).toString('base64')}`
        }
      })
      logger.debug(req, `PaymentService - Successfully returned paypal auth token `)
      return paypalAuthToken
    } catch (error) {
      logger.error(req, `PaymentService - Error returning paypal auth token. `, error)
      throw error
    }
  }

  async _checkPaymentProviderId(req, user) {
    try {
      let retVal
      if (user.paymentProviderId) {
        retVal = user
      } else {
        logger.debug(req, `User ${user.email} missing paymentProviderId, creating one`)
        const paymentProviderId = await braintreeService.createBraintreeCustomer(user)
        user.paymentProviderId = paymentProviderId
        logger.debug(req, `Created paymentProviderId ${paymentProviderId} for user ${user.email}`)
        await mainDBHandler.updateOne(req, 'profiles', { id: user.id }, user, {})
        const updatedUser = await mainDBHandler.findOne(req, 'profiles', { id: user.id }, {})
        logger.debug(req, `Updated paymentProviderId ${paymentProviderId} in user ${user.email}`)
        retVal = updatedUser
      }
      return retVal
    } catch (error) {
      logger.error(req, `Error creating braintree paymentProviderId for user ${user.email}. `, error)
      throw error('INTERNAL_ERROR')
    }
  }

  async processStripePayment(req, data) {
    try {
      // const result = await stripeService.purchase(req, data)
      const transaction = {
        // transactionId: result.id,
        type: 'user',
        transactionType: 'DEPOSIT',
        status: 'd44335691',
        paymentType: 'card',
        info: `Stripe payment from user ${data.email}`,
        amount: Number(data.amount),
        userId: data.userId,
        createdAt: (new Date()).getTime()
      }
      await mainDBHandler.insertOne(req, 'transactions', transaction, {})
      logger.debug(req, `PaymentService - Successfully processed stripe charge `)
      // return result
    } catch (error) {
      logger.error(req, `PaymentService - Error processing stripe charge. `, error)
      throw error
    }
  }

  async processStripeWebhook(req) {
    try {
      const { type, data } = req.body
      if (type === 'charge.succeeded') {
        if (data && data.object && data.object.metadata) {
          const { payment_intent, metadata } = data.object
          const { userId } = metadata
          if (userId && payment_intent) {
            const transaction = await mainDBHandler.findOne(req, 'transactions', { userId, transactionId: payment_intent }, {})

            if (!transaction) {
              logger.error(req, 'PaymentService - process stripe webhook transaction not found ', payment_intent)
            }
            await mainDBHandler.updateOne(req, 'transactions', { id: transaction.id }, { status: 'd43334659' }, {})
          }
        }
      }
      logger.debug(req, `PaymentService - Successfully processed stripe webhook `)
    } catch (error) {
      logger.error(req, `PaymentService - Error processing stripe webhook. `, error)
      throw error
    }
  }

  async checkPayPalOrder(req, data) {
    try {
      const result = await axios({
        url: `/v2/checkout/orders/${data.orderID}/capture`,
        method: 'post',
        baseURL: config.PAYPAL_URL,
        data: {},
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${Buffer.from(config.PAYPAL_CLIENT_ID + ':' + config.PAYPAL_CLIENT_SECRET).toString('base64')}`
        }
      })
      if (result && result.data && result.data.status == 'COMPLETED') {
        const transaction = {
          transactionId: data.orderID,
          type: 'user',
          transactionType: 'DEPOSIT',
          status: 'd43334659',
          paymentType: 'paypal',
          info: result.data && result.data.payer && result.data.payer.email_address ? result.data.payer.email_address : `paypal order id ${data.orderID}`,
          amount: data.amount,
          userId: data.userId,
          createdAt: (new Date()).getTime()
        }

        await mainDBHandler.insertOne(req, 'transactions', transaction, {})
      }

      logger.debug(req, `PaymentService - Successfully returned paypal auth token `)
      return result.data
    } catch (error) {
      logger.error(req, `PaymentService - Error returning paypal auth token. `, error)
      throw error
    }
  }
}

module.exports = new PaymentService()