const service = require('./language.service');
const error = require('../../lib/error');
const logger = require('../../lib/logger');
const config = require('../../config/index');

class LanguageController {
  constructor() {
  }
  async processCommand(req, res, next) {
    const { mode, data = {} } = req.body;
    try {
      let result;
      switch(mode) {
        case 'get':
          result = await service.findByLang(req, req.query.lang, {})
          break;
        case 'all':
          result = await service.findAll(req, data);
          break;
        case 'create':
          result = await service.create(req, data, {})
          break;
        case 'update':
          result =await service.update(req, req.query.id, data)
          break;
        case 'changes':
          result = await service.checkLanguageChangesAndPull(req, req.query.lang, crc)
          break;
        default:
          throw error('NOT_AUTHENTICATED', 'route does not exist')
      }
      logger.info(req, `Successfully finished ${mode} action on language data `)
      req.response = result
      next()
      // res.json(result)
    } catch (error) {
      logger.error(req, `Error processing ${mode} action on language data `, error)
      next(error)
    }
  }
}

module.exports = new LanguageController()