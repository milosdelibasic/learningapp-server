const service = require('./data.service')
const logger = require('../../lib/logger')
const config = require('../../config/index')

const flattenObject = (ob, searchableProjections, prefix = '') => {
  let toReturn = '';
  for (const key in ob) {
    if (!ob.hasOwnProperty(key)) continue;
    const value = ob[key]
    if ((typeof value) == 'object') {
      toReturn += flattenObject(value, searchableProjections, prefix ? prefix+'.'+key : key);
    } else if (searchableProjections[prefix ? prefix+'.'+key : key]){
      toReturn += value
    }
  }
  return toReturn;
};

class MainController {
  constructor() { }

  async processCommand(req, res, next) {
    const { name, mode, data = {}, type } = { ...req.body, ...req.query, ...req.params };
    try {
      let result
      switch (mode) {
        case 'new':
          result = await service.createData(req, name, type, data, {})
          break;
        case 'update':
          result = await service.updateData(req, name, type, data._id, data, {})
          break;
        case 'all':
          result = await service.all(req, name, type, data, {})
          break;
        case 'count':
          result = await service.count(req, name, type, data, {})
          break;
        case 'get':
          result = await service.get(req, name, type, data, {})
          break;
        case 'page':
          result = await service.paged(req, name, type, data, {})
          break;
        case 'delete':
          result = await service.deleteData(req, name, type, data._id, {})
          break;
        case 'agg':
          const { pipeline = [], mode: aggMode, pageNumber = 1, pageSize = 25 } = data

          if (name !== "points") {
            result = await service.aggregate(req, name, type, pipeline, aggMode, pageNumber, pageSize);

            if (aggMode === 'get') {
              if (Array.isArray(result)) {
                if (result.length === 0) result = null
                else result = result[0]
              }
            }
          }
          break;
        case 'id':
          result = await service.findDataById(req, name, type, data, {})
          break;
        case 'done':
          result = data
          break;
        default:
          result = {}
      }
      if (result) logger.info(req, `Successfully finished ${mode} action on ${type} in collection ${name} `)
      req.response = result
      next()
      // res.json(result)
    } catch (error) {
      logger.error(req, `Error processing ${mode} action on ${type} in collection ${name} `, error)
      next(error)
    }
  }
}

module.exports = new MainController()