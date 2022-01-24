const service = require('./admin.service');
const logger = require('../../lib/logger');
const error = require('../../lib/error')

class AdminController {
  constructor() { }

  async processCommand(req, res, next) {
    const { mode, data = {} } = req.body
    try {
      let result
      switch (mode) {
        case 'get':
          result = await service.findOne(req, data, {})
          break;
        case 'all':
          result = await service.all(req)
          break;
        default:
          throw error('NOT_AUTHENTICATED', 'route does not exist')
      }
      logger.info(req, `Successfully finished ${mode} action on forms data `)
      req.response = result
      next()
    } catch (error) {
      logger.error(req, `Error processing ${mode} action on forms data `, error)
      next(error)
    }
  }
}

module.exports = new AdminController()