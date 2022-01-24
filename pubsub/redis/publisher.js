/**
 * Created by laslo on 4/28/20.
 */
const redis = require('redis');
const logger = require('../../lib/logger');
const config = require('../../config');

logger.system('info', `Publisher connecting on host ${config.NODE_REDIS_HOST} and port ${config.NODE_REDIS_PORT}`)
const publisher = redis.createClient(config.NODE_REDIS_PORT, config.NODE_REDIS_HOST)

publisher.on("ready", () => {
  logger.system('info', `Publisher is ready`)
});

publisher.on("error", (err) => {
  logger.system('info', `Error connecting publisher`, err)
});

const _publish = (channel, message) => {
  publisher.publish(channel, JSON.stringify(message))
}

const _close = (publisher) => {
  publisher.quit();
}

module.exports = {
  publish: _publish,
  close: _close
}