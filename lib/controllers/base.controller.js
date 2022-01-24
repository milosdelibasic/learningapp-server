/**
 * Created by laslo on 5/12/20.
 */
const logger = require('../logger');
const error = require('../error');

class BaseController {
  constructor(name, service) {
    this.service = service;
    this.name = name;
  }

  async findOne(req, res, next) {
    try {
      const { id } = req.params
      const result = await this.service.findOne(req, { id })
      req.response = result
      next()
      // res.json(result)
    } catch (err) {
      logger.error(req, `${this.name} controller - Error in service finding one with id ${id}`, err)
      next(error('INTERNAL_ERROR'))
    }
  }

  async findAll(req, res, next) {
    try {
      const result = await this.service.findAll(req, req.query)
      req.response = result
      next()
      // res.json(result)
    } catch (err) {
      logger.error(req, `${this.name} controller - Error in service finding one with query ${req.query}`, err)
      next(error('INTERNAL_ERROR'))
    }
  }

  async insertOne(req, res, next) {
    try {
      const result = await this.service.insertOne(req, req.body)
      req.response = result
      next()
      // res.json(result)
    } catch (err) {
      logger.error(req, `${this.name} controller - Error in service inserting one with query ${req.body}`, err)
      next(error('INTERNAL_ERROR'))
    }
  }

  async updateOne(req, res, next) {
    try {
      const result = await this.service.updateOne(req, req.query, req.body)
      req.response = result
      next()
      // res.json(result)
    } catch (err) {
      logger.error(req, `${this.name} controller - Error in service updating one with query ${req.query} and data ${req.body}`, err)
      next(error('INTERNAL_ERROR'))
    }
  }

  async deleteOne(req, res, next) {
    try {
      const { id } = req.params
      const result = await this.service.deleteOne(req, { id })
      req.response = result
      next()
      // res.json(result)
    } catch (err) {
      logger.error(req, `${this.name} controller - Error in service deleting one with id ${id}`, err)
      next(error('INTERNAL_ERROR'))
    }
  }

  async deleteMany(req, res, next) {
    try {
      const result = await this.service.deleteMany(req, req.query)
      req.response = result
      next()
      // res.json(result)
    } catch (err) {
      logger.error(req, `${this.name} controller - Error in service deleting many with query ${req.query}`, err)
      next(error('INTERNAL_ERROR'))
    }
  }
}

module.exports = BaseController