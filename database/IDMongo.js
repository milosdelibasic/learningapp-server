/**
 * Created by laslo on 5/4/20.
 */

const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;

const config = require("../config");
const logger = require("../lib/logger");

const DB_URL= config.NODE_DB_URL

const _close = async (req, connection) => {
  try {
    if (connection) {
      await connection.close();
    }
  } catch (e) {
    logger.error(req, `IDMongo Error in closing mongodb connections: ${e}`);
  }
}

const _connect = async(req) => {
  let connection
  try {
    logger.debug(req, `IDMongo Connecting to : ${DB_URL}`);
    connection = await MongoClient.connect(
      DB_URL,
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        reconnectTries: 0,
        bufferMaxEntries: 0
      }
    );
    logger.debug(req, `IDMongo Connected to : ${DB_URL}`);

  } catch (e) {
    logger.error(req, `IDMongo Error connecting to mongodb: ${e}`);
    throw e;
  }

  connection.on("close", (e) => {
    logger.debug(req, `IDMongo Connection close`);
  });
  if (req) req.db = connection
  return connection;
}

const _isObjectId = (id) => {
  let result = true
  try {
    new ObjectId(id)
  } catch (err) {
    result = false
  }
  return result
}

module.exports = {
  connect: _connect,
  close: _close,
  ObjectId,
  isObjectId: _isObjectId
}