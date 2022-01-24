/**
 * Created by laslo on 4/28/20.
 */
const logger = require('../../lib/logger');
const config = require('../../config');
const IDMongo = require("../../database/IDMongo");

const _publish = async (channel, message) => {
  logger.system('info', `Mongo Publisher sending message to ${channel} channel`);
  const publisher = await IDMongo.collection(channel);

  publisher.insertOne({ message: message }, function(err, res) {
    if (err) {
      throw err;
    }
  });
}

const _close = async (publisher) => {
}

module.exports = {
  publish: _publish,
  close: _close
}