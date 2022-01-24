const error = require('../../lib/error');
const logger = require('../../lib/logger');
const mainDBHandler = require('../../database/main.handler')
const config = require('../../config');

class AdminService {
  constructor() {
  }
  async findOne(req, data, options) {
    try {
      let result = await mainDBHandler.findOne(null, 'forms', { type: data.type }, options);
      logger.debug(req, `FormsService - Successfully returned form for: ${data.type} `);
      if(!result) {
        result = {}
      }
      return result;
    } catch (error) {
      logger.error(req, `FormsService - Error returning Form for:  ${data.type} `, error);
      throw error;
    }
  }

  async all(req) {
    try {
      const retVal = await mainDBHandler.findAll(null, 'forms', {},{},{ menuOrder: 1 })
      logger.debug(req, `Successfully returned Forms`)
      return retVal
    } catch (error) {
      logger.error(req, `Error returning Forms`, error)
      throw error
    }
  }

}

module.exports = new AdminService()