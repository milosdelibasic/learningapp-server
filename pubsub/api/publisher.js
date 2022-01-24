/**
 * Created by laslo on 4/28/20.
 */
const axios = require('axios')
const logger = require('../../lib/logger');
const config = require('../../config');

const NODES = config.NODE_INSTANCES.split(',')

const _pushMessage = async (node, channel, message) => {
  try {
    logger.system('debug', `Pushing pubsub message to node ${node}`)
    await axios({
      url: `/api/pubsub/`+channel,
      method: 'post',
      baseURL: node.trim(),
      data: message,
      headers: {
        'Authorization': config.NODE_PUBSUB_AUTH
      }
    })
    logger.system('debug', `Successfully pushed pubsub message to node ${node}`)
  } catch (err) {
    logger.system('error', `Error API publishing message to ${node} on channel ${channel}`, err)
  }
}

const _publish = (channel, message) => {
  NODES.forEach(node => _pushMessage(node, channel, message))
}

const _close = (publisher) => {

}

module.exports = {
  publish: _publish,
  close: _close
}