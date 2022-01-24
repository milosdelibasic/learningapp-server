/**
 * Created by laslo on 4/28/20.
 */
const redis = require('redis');
const logger = require('../../lib/logger');
const config = require('../../config');


const _subscribe = async (channels = [], handlers) => {
  if (!Array.isArray(channels)) channels = [channels]
  if (channels.length > 0) {
    const subscriber = redis.createClient(config.NODE_REDIS_PORT, config.NODE_REDIS_HOST)

    subscriber.on("ready", () => {
      logger.system('info', `Subscriber to channel ${channels} is ready`)
    });

    subscriber.on("error", (err) => {
      logger.system('info', `Error subscribing to channel ${channels}`, err)
    });

    for (const channel of channels) {
      subscriber.subscribe(channel)
    }

    subscriber.on("message",(channel, message) => {
      logger.system('debug', `Received message for channel ${channel}`, message)
      handlers.forEach(handler => handler.onMessage(channel, message))
    })
  }
}

const _close = (subscriber) => {
  subscriber.unsubscribe();
  subscriber.quit();
}

module.exports = {
  subscribe: _subscribe,
  close: _close
}