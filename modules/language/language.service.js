const error = require('../../lib/error').error;
const logger = require('../../lib/logger');
const mainDBHandler = require('../../database/main.handler');
const { Console } = require('winston/lib/winston/transports');

class LanguageService {

  async findAll(req, options = {}) {
    try {
      const data = await mainDBHandler.findAll(req, 'languages', {}, options)
      logger.debug(req, `Successfully returned all languages `)
      return data
    } catch (error) {
      logger.error(req, `Error returning all languages. `, error)
      throw error
    }
  }

  async findByLang(req, lang, options = {}) {
    try {
      const data =  await mainDBHandler.findOne(req, 'languages', { lang }, options)
      logger.debug(req, `Successfully returned language with lang ${lang} `)
      return data
    } catch (error) {
      logger.error(req, `Error returning language with lang ${lang}. `, error)
      throw error
    }
  }

  async create(req, language, options = {}) {
    try {
      const data = await mainDBHandler.insertOne(req, 'languages', language, options)
      logger.debug(req, `Successfully created language with lang ${language.lang} `)
      return data
    } catch (error) {
      logger.error(req, `Error creating language with lang ${language.lang}. `, error)
      throw error
    }
  }

  async update(req, id, language, options = {}) {
    try {
      await mainDBHandler.updateOne(req, 'languages', { id }, language, options)
      const data = await models.LanguageHandler.findOne({ id }, options)
      logger.debug(req, `Successfully updated language with id ${id} `)
      return data
    } catch (error) {
      logger.error(req, `Error updating language with id ${id}. `, error)
      throw error
    }
  }

  async checkLanguageChangesAndPull(req, lang, crc = '') {
    try {
      const data = await mainDBHandler.findOne(req, 'languages', { lang, crc: { $ne: crc } })
      return data
    } catch (error) {
      logger.error(req, `Error pulling changed language data for ${lang. crc}. `, error)
      throw error
    }
  }
}

module.exports = new LanguageService()