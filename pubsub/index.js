const config = require('../config')
if (config.NODE_PUBSUB_TYPE) {
  module.exports = require(`./${process.env.NODE_PUBSUB_TYPE}`);
} else {
  module.exports = {}
}
