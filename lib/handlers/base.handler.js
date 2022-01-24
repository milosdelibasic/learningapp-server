/**
 * Created by laslo on 5/4/20.
 */
const uuid = require('uuid/v4')
const IDMongo = require("./../../database/IDMongo");

class BaseHandler {
  constructor(name) {
    this.name = name;
  }

  async getCollection() {
    if (!this.collection) {
      this.collection = await IDMongo.collection(this.name)
      this.collection.createIndex( { id: 1 }, { unique: true } )
    }
    return this.collection
  }

  async findOne(query, options = {}) {
    return (await this.getCollection()).findOne(query, options)
  }

  async findAll(query, options = {}, sort) {
    return (await this.getCollection()).find(query, options).sort(sort).toArray()
  }

  async findAndCount(query, options = {}) {
    return (await this.getCollection()).find(query, options).count()
  }

  async findWithSkipAndLimit(query, skip, limit, options = {}) {
    return (await this.getCollection()).find(query, options).skip(skip).limit(limit).toArray()
  }

  async insertOne(data, options = {}) {
    if (!data.id) data.id = uuid()
    data.createdAt = new Date().getTime()
    data.updatedAt = new Date().getTime()
    const result = await (await this.getCollection()).insertOne(data, options)
    return result.ops[0]
  }

  async updateOne(query, data, options = {}) {
    data.updatedAt = new Date().getTime()
    return (await this.getCollection()).updateOne(query, { $set: data }, options)
  }

  async customUpdate(query, data, options = {}) {
    return (await this.getCollection()).updateOne(query, data , options)
  }

  async deleteOne(query, options = {}) {
    return (await this.getCollection()).deleteOne(query, options)
  }

  async deleteMany(query, options = {}) {
    return (await this.getCollection()).deleteMany(query, options)
  }

  async aggregate(pipelines) {
    return (await this.getCollection()).aggregate(pipelines)
  }
}

module.exports = BaseHandler