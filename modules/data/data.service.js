const error = require('../../lib/error');
const logger = require('../../lib/logger');
const mainDBHandler = require('../../database/main.handler');
const ObjectID = require('mongodb').ObjectID;
class MainService {
  async get(req, name, type, { filter = [] }) {
    try {
      if (!Array.isArray(filter)) filter = [filter]
      let filterQuery = { $and: [{ type }] }
      if (filter) {
        filter.forEach(filter => {
          filterQuery.$and.push(filter)
        })
      }
      const retVal = await mainDBHandler.findOne(req, name, filterQuery)
      logger.debug(req, `Successfully returned  collection ${name} type ${type} `)
      return retVal || {}
    } catch (error) {
      logger.error(req, `Error returning  collection ${name} type ${type}. `, error)
      throw error
    }
  }

  async all(req, name, type, { sort={}, filter=[], distinct, projections }) {
    try {
      if (!Array.isArray(filter)) filter = [filter]
      let filterQuery = { $and: [{ type }] }
      if (filter) {
        filter.forEach(filter => {
          filterQuery.$and.push(filter)
        })
      }
    if (type === 'null'){ filterQuery = {}}
    let retVal
    if (!distinct) {
      retVal = await mainDBHandler.findAll(req, name, filterQuery, { projection: projections }, sort)
    } else {
      retVal = await mainDBHandler.distinct(req, name, distinct, filterQuery)
    }
    logger.debug(req, `Successfully returned  collection ${name} type ${type} `)
    return retVal
  } catch(error) {
    logger.error(req, `Error returning  collection ${name} type ${type}. `, error)
    throw error
  }
}

  async count(req, name, type, { filter=[] }) {
    try {
      if (!Array.isArray(filter)) filter = [filter]
      let filterQuery = { $and: [{ type }] }
      if (filter) {
        filter.forEach(filter => {
          filterQuery.$and.push(filter)
        })
      }
    if (type === 'null'){ filterQuery = {}}
    const retVal = await mainDBHandler.count(req, name, filterQuery, {})
    logger.debug(req, `Successfully counted collection ${name} type ${type} ${retVal}`)
    return retVal
  } catch(error) {
    logger.error(req, `Error counting collection ${name} type ${type}. `, error)
    throw error
  }
}

async paged(req, name, type, data = {}) {
  try {
    const { projections, sort, pageNumber = 1, pageSize = 10 } = data //TODO parametrize page numbers
    let { filter = [] } = data
    let filterQuery = { $and: [{ type }] }
    if (filter) {
      if (!Array.isArray(filter)) filter = [filter]
      filter.forEach(filter => {
        filterQuery.$and.push(filter)
      })
    }
    const total = await mainDBHandler.findAndCount(req, name, filterQuery)
    const rows = await mainDBHandler.findAll(req, name, filterQuery, { limit: pageSize, skip: (pageNumber - 1) * pageSize, projection: projections }, sort)
    const retVal = {
      total,
      rows
    }
    logger.debug(req, `Successfully returned ${type} paged Data `)
    return retVal
  } catch (error) {
    logger.error(req, `Error returning ${type} paged Data. `, error)
    throw error
  }
}

async createData(req, name, type, payload, options = {}) {
  try {
    payload.type = type
    const data = await mainDBHandler.insertOne(req, name, payload, options)
    logger.debug(req, `Successfully created  collection ${name} type ${type} `)
    return data
  } catch (error) {
    logger.error(req, `Error creating  collection ${name} type ${type}. `, error)
    throw error
  }
} 

async updateData(req, name, type, id, payload, options = {}) {
  try {
   const query = { type, _id: ObjectID(id) }
   delete payload._id;
    const data = await mainDBHandler.updateOne(req, name, query, payload, options)
    logger.debug(req, `Successfully updated  collection ${name} type ${type} with id ${id} `)
    return data
  } catch (error) {
    logger.error(req, `Error updating  collection ${name} type ${type} with id ${id}. `, error)
    throw error
  }
}

async deleteData(req, name, type, id, options = {}) {
  try {
    const query = { type, _id: ObjectID(id)  }
    const data = await mainDBHandler.deleteOne(req, name, query, options)
    logger.debug(req, `Successfully deleted  collection ${name} type ${type} with id ${id} `)
    return data
  } catch (error) {
    logger.error(req, `Error deleting  collection ${name} type ${type} with id ${id}. `, error)
    throw error
  }
}

async aggregate(req, name, type, pipeline = [], aggMode, pageNumber, pageSize) {
  try {
    pipeline.unshift({ $match: { type } })
    let total
    if (aggMode === 'page') {
      const matchPipelines = pipeline.filter(one => one['$match'] && !one['$match']['$text'])
      const textPipelines = pipeline.filter(one => one['$match'] && one['$match']['$text'])
      const sortPipelines = pipeline.filter(one => one['$sort'])
      const restPipelines = pipeline.filter(one => !one['$sort'] && !(one['$match'] && one['$match']['$text']))
      total = await mainDBHandler.count(req, name, { $and : [...textPipelines, ...matchPipelines].map(one => one['$match']) })

      pipeline = [...textPipelines, ...restPipelines, ...sortPipelines, { $skip : (pageNumber - 1) * pageSize }, { $limit: pageSize }]
    }
    let rows = await mainDBHandler.aggregate(req, name, pipeline);
    if (aggMode === 'page') {
      rows = { total, rows }
    }
    return rows
  } catch (error) {
    logger.error(req, `Error running aggregate for  collection ${name} type ${type} with pipelines ${pipeline}. `, error)
    throw error
  }
}
async findDataById(req, name, type, data, options = {}) {
  try {
    const result = await mainDBHandler.findOne(req, name, { _id: data, type }, options)
    logger.debug(req, `Successfully returned ${type} Data  by ID`)
    return result
  } catch (error) {
    logger.error(req, `Error returning ${type} Data by Id. `, error)
    throw error
  }
}
}

module.exports = new MainService()