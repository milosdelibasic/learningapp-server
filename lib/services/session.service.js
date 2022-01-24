/**
 * Created by laslo on 27.12.18..
 */

const redis = require('redis')
const { promisify } = require('util')
const logger = require('../logger')
const config = require('../../config')
const client = redis.createClient(config.NODE_REDIS_PORT, config.NODE_REDIS_HOST)
const getAsync = promisify(client.get).bind(client)
const setAsync = promisify(client.set).bind(client)
const delAsync = promisify(client.del).bind(client)

client.select(config.NODE_REDIS_SESSION_STORAGE || 1)
client.on('error', (err) => {
  logger.system('error', 'SessionService Redis error', err)
})
client.on('connect', () => {
  logger.system('info', 'SessionService Redis connected')
})
/**
 * Finds user information based on passed key
 *
 * @param key - session token
 * @returns {Promise<null>}
 * @private
 */
const _getKey = async (key) => {
  const userInfo = await getAsync(key)
  return (userInfo ? JSON.parse(userInfo) : null)
}
/**
 * Write user information to redis
 * @param key - newly generated session token
 * @param user - user information
 * @returns {Promise<void>}
 * @private
 */
const _setKey = async (key, user, ...args) => {
  await setAsync(key, JSON.stringify(user), ...args)
}
/**
 * Remove authenticated user from redis by token
 *
 * @param key - authentication token
 * @returns {Promise<void>}
 * @private
 */
const _removeKey = async (key) => {
  await delAsync(key)
}

module.exports.getKey = _getKey
module.exports.setKey = _setKey
module.exports.removeKey = _removeKey
