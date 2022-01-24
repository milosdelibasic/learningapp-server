const Stripe = require('stripe')
const moment = require('moment')
const config = require('../../config')
const logger = require('../logger')
const error = require('../error')

const stripe = Stripe(config.STRIPE_SECRET_KEY);

exports.purchase = async (req, { amount, source, userId, email }) => {
  try {
    const data = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: 'usd',
      payment_method: source,
      metadata: { userId, email },
      description: `Deposit by user ${email}`
    })
    logger.debug(req, `Successfully made a purchase `)
    return data
  } catch (err) {
    logger.error(req, 'Error - stripe manager - in creating stripe charge. ', err)
    throw err
  }
}