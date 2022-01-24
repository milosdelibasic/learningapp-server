/**
 * Created by laslo on 5/4/20.
 */
const exec = require("child_process").exec;
const IDMongo = require("./IDMongo");
const config = require("../config");
const logger = require("../lib/logger");
const _ = require("lodash");

const DB_NAME = config.NODE_DB_NAME || "test_db";

const _convert = (value) => {
  if (value instanceof IDMongo.ObjectId) {
    return value;
  } else if (typeof value === "string") {
    try {
      value = IDMongo.ObjectId(value.toString());
    } catch (err) {}
    return value;
  } else if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      value[i] = _convert(value[i]);
    }
  } else if (typeof value === "object") {
    Object.keys(value).forEach((key) => (value[key] = _convert(value[key])));
  }
  return value;
};

const _searchAndConvertObjectId = (query) => {
  Object.keys(query).forEach((key) => {
    if (!query[key]) return;
    if (key === "_id") {
      query[key] = _convert(query[key]);
    } else if (Array.isArray(query[key])) {
      query[key].forEach((element) => _searchAndConvertObjectId(element));
    } else if (typeof query[key] === "object") {
      _searchAndConvertObjectId(query[key]);
    }
  });
};

class MainDBHandler {
  constructor() {
    this.collectionMap = {};
  }

  async findOne(req, name, query = {}, options = {}) {
    try {
      const { dbConnection, doClose } = await _getConnection(req);
      _searchAndConvertObjectId(query);
      const result = await (await dbConnection.db(DB_NAME).collection(name)).findOne(query, options);
      if (doClose) IDMongo.close(req, dbConnection);
      return result;
    } catch (err) {
      logger.error(req, "Error Finding One Item in DB.", err);
      _checkDatabaseError(err);
    }
  }

  async findAll(req, name, query = {}, options = {}, sort = {}) {
    try {
      const { dbConnection, doClose } = await _getConnection(req);
      _searchAndConvertObjectId(query);
      if (Object.keys(sort).length === 0) sort = { createdAt: -1 };
      const result = await (await dbConnection.db(DB_NAME).collection(name)).find(query, options).sort(sort).toArray();
      if (doClose) IDMongo.close(req, dbConnection);
      return result;
    } catch (err) {
      logger.error(req, "Error Finding All in DB.", err);
      _checkDatabaseError(err);
    }
  }

  async distinct(req, name, field, query) {
    try {
      const { dbConnection, doClose } = await _getConnection(req);
      const result = await (await dbConnection.db(DB_NAME).collection(name)).distinct(field, query);
      if (doClose) IDMongo.close(req, dbConnection);
      return result;
    } catch (err) {
      logger.error(req, "Error Distinct in DB.", err);
      _checkDatabaseError(err);
    }
  }

  async count(req, name, query = {}, options = {}) {
    try {
      const { dbConnection, doClose } = await _getConnection(req);
      _searchAndConvertObjectId(query);
      const collection = await dbConnection.db(DB_NAME).collection(name);
      const result = await collection.countDocuments(query, options);
      if (doClose) IDMongo.close(req, dbConnection);
      return result;
    } catch (err) {
      logger.error(req, "Error Counting in DB.", err);
      _checkDatabaseError(err);
    }
  }

  async findAndCount(req, name, query = {}, options = {}) {
    try {
      const { dbConnection, doClose } = await _getConnection(req);
      _searchAndConvertObjectId(query);
      const result = await (await dbConnection.db(DB_NAME).collection(name)).find(query, options).count();
      if (doClose) IDMongo.close(req, dbConnection);
      return result;
    } catch (err) {
      logger.error(req, "Error Find and Count in DB.", err);
      _checkDatabaseError(err);
    }
  }

  async findPaged(req, name, query = {}, skip, limit, options = {}) {
    try {
      const { dbConnection, doClose } = await _getConnection(req);
      _searchAndConvertObjectId(query);
      const result = await (await dbConnection.db(DB_NAME).collection(name))
        .find(query, options)
        .skip(skip)
        .limit(limit)
        .toArray();
      if (doClose) IDMongo.close(req, dbConnection);
      return result;
    } catch (err) {
      logger.error(req, "Error Finding One in DB.", err);
      _checkDatabaseError(err);
    }
  }

  async insertOne(req, name, data, options = {}) {
    try {
      const { dbConnection, doClose } = await _getConnection(req);
      if (!data.createdAt) data.createdAt = new Date().getTime();
      if (!data.updatedAt) data.updatedAt = new Date().getTime();
      const result = await (await dbConnection.db(DB_NAME).collection(name)).insertOne(data, options);
      if (doClose) IDMongo.close(req, dbConnection);
      return result.ops[0];
    } catch (err) {
      logger.error(req, "Error Inserting One in DB.", err);
      _checkDatabaseError(err);
    }
  }

  async insertMany(req, name, array, options = {}) {
    try {
      const { dbConnection, doClose } = await _getConnection(req);
      array.forEach((data) => {
        if (!data.createdAt) data.createdAt = new Date().getTime();
        if (!data.updatedAt) data.updatedAt = new Date().getTime();
      });
      const result = await (await dbConnection.db(DB_NAME).collection(name)).insertMany(array, options);
      if (doClose) IDMongo.close(req, dbConnection);
      return result.ops;
    } catch (err) {
      logger.error(req, "Error Insert Many in DB.", err);
      _checkDatabaseError(err);
    }
  }

  async updateOne(req, name, query = {}, data, options = {}) {
    try {
      const { dbConnection, doClose } = await _getConnection(req);
      _searchAndConvertObjectId(query);
      if (!data.updatedAt) data.updatedAt = new Date().getTime();
      options.returnOriginal = false;
      const response = await (
        await dbConnection.db(DB_NAME).collection(name)
      ).findOneAndUpdate(query, { $set: data }, options);
      if (doClose) IDMongo.close(req, dbConnection);
      return response.value;
    } catch (err) {
      logger.error(req, "Error Updating One in DB.", err);
      _checkDatabaseError(err);
    }
  }

  async findOneAndUpdate(req, collection, query, data, options = {}) {
    try {
      const { dbConnection, doClose } = await _getConnection(req);
      if (!data.updatedAt) data.updatedAt = new Date().getTime();
      const result = dbConnection.collection(collection).findOneAndUpdate(query, { $set: data }, options);
      if (doClose) IDMongo.close(req, dbConnection);

      return result;
    } catch (err) {
      logger.error(req, "Error Finding one and updating.", err);
      _checkDatabaseError(err);
    }
  }

  async updateOneCustom(req, name, query = {}, data, options = {}) {
    try {
      const { dbConnection, doClose } = await _getConnection(req);
      _searchAndConvertObjectId(query);
      options.returnOriginal = false;
      const response = await (await dbConnection.db(DB_NAME).collection(name)).findOneAndUpdate(query, data, options);
      if (doClose) IDMongo.close(req, dbConnection);
      return response.value;
    } catch (err) {
      logger.error(req, "Error Updating one Custom in DB.", err);
      _checkDatabaseError(err);
    }
  }

  async updateMany(req, name, query = {}, data, options = {}) {
    try {
      const { dbConnection, doClose } = await _getConnection(req);
      _searchAndConvertObjectId(query);
      const result = await (await dbConnection.db(DB_NAME).collection(name)).updateMany(query, data, options);
      if (doClose) IDMongo.close(req, dbConnection);
      return result;
    } catch (err) {
      logger.error(req, "Error Updating Many in DB.", err);
      _checkDatabaseError(err);
    }
  }

  async deleteOne(req, name, query = {}, options = {}) {
    try {
      const { dbConnection, doClose } = await _getConnection(req);
      _searchAndConvertObjectId(query);
      const result = await (await dbConnection.db(DB_NAME).collection(name)).deleteOne(query, options);
      if (doClose) IDMongo.close(req, dbConnection);
      return result;
    } catch (err) {
      logger.error(req, "Error Deleting One in DB.", err);
      _checkDatabaseError(err);
    }
  }

  async deleteMany(req, name, query = {}, options = {}) {
    try {
      const { dbConnection, doClose } = await _getConnection(req);
      _searchAndConvertObjectId(query);
      const result = await (await dbConnection.db(DB_NAME).collection(name)).deleteMany(query, options);
      if (doClose) IDMongo.close(req, dbConnection);
      return result;
    } catch (err) {
      logger.error(req, "Error Deleting Many in DB.", err);
      _checkDatabaseError(err);
    }
  }

  async aggregate(req, name, pipelines) {
    try {
      const { dbConnection, doClose } = await _getConnection(req);
      let result = await (await dbConnection.db(DB_NAME).collection(name)).aggregate(pipelines);
      result = await result.toArray();
      if (doClose) IDMongo.close(req, dbConnection);
      return result;
    } catch (err) {
      logger.error(req, "Error Aggregating in DB", err);
      _checkDatabaseError(err);
    }
  }

  connect(req) {
    return IDMongo.connect(req);
  }

  close(req, dbConnection) {
    return IDMongo.close(req, dbConnection);
  }

  async collection(req, name) {
    const { dbConnection } = await _getConnection(req);
    return dbConnection.db(DB_NAME).collection(name);
  }
}

const _getConnection = async (req) => {
  try {
    let dbConnection,
      doClose = false;

    if (req && req.db) {
      dbConnection = req.db;
    } else {
      dbConnection = await IDMongo.connect(req);
      doClose = true;
    }

    return { dbConnection, doClose };
  } catch (err) {
    logger.error(req, "Error connecting to DB.", err);
    throw err;
  }
};

const _checkDatabaseError = (err) => {
  if (_checkError(err)) {
    _restartDatabase();
  }
  throw err;
};

const _restartDatabase = async () => {
  logger.info(null, "Restarting the Database");

  const command = config.NODE_DB_RESTART_SCRIPT;
  exec(command, async (err, stdout, stderr) => {
    if (err || stderr) {
      logger.error(null, "Error Executing Database Restart.", err);
    }
  });
};

const _checkError = (err) => {
  let isConnectionError = false;

  isConnectionError = _.includes(err, "connection timed out");
  isConnectionError = _.includes(err, "ECONNREFUSED");

  return isConnectionError;
};

module.exports = new MainDBHandler();
