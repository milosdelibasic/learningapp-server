/**
 * Created by laslo on 17.12.18..
 */
const helmet = require('helmet')
const config = require('../config')

const ancestors = config.NODE_WEB_APP.split(',')

module.exports = (app) => {
  app.disable('x-powered-by')
  app.use(helmet())
  app.use(helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", config.NODE_WEB_APP_URL],
      styleSrc: ["'self'", "'unsafe-inline'", config.NODE_WEB_APP_URL],
      scriptSrc: ["'self'", "'unsafe-inline'", config.NODE_WEB_APP_URL],
      imgSrc: ["'self'", "data:", config.NODE_WEB_APP_URL],
      frameSrc: ["'self'", config.NODE_WEB_APP_URL, "player.twitch.tv"],
      frameAncestors: ancestors
    }
  }))
}
