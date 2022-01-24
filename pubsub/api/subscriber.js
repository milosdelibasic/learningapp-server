/**
 * Created by laslo on 4/28/20.
 */
const logger = require('../../lib/logger');
const config = require('../../config');

const _processMessage = (channels, handlers) => {
  return (req, res) => {
    const { channel } = req.params
    const message = req.body
    logger.system('debug', `Received pubsub message for channel ${channel}`)
    try {
      if (channels.indexOf(channel) > -1) {
        handlers.forEach(handler => {
          handler.onMessage(channel, message)
        })
      }
    } catch(err) {
      logger.system('debug', `Error processing message on channel ${channel}, message:`+message, err)
    }
    res.send('OK')
  }
}


const _subscribe = (channels, handlers, app) => {
  if (!Array.isArray(channels)) channels = [channels]
  logger.system('info', `Server is subscribing to channels`, channels)
  app.post('/api/pubsub/:channel', _processMessage(channels, handlers))
}

const _close = (subscriber) => {
}

module.exports = {
  subscribe: _subscribe,
  close: _close
}