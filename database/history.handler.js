const IDMongo = require("./IDMongo");
const util = require("../lib/util");
const logger = require("../lib/logger");

const getRequestData = (req) => {
  if (!req) return { apiId: "system", IP: "127.0.0.1" };
  return {
    userId: req.userId,
    apiId: req.api_id,
    IP: util.getRequestIP(req),
  };
};

const HISTORY = "history";
const IGNORE_COLLECTIONS = ["languages", "config", "session"];

class HistoryDBHandler {
  constructor() {
    this._coll;
  }

  async getCollection() {
    if (!this._coll) {
      this._coll = await IDMongo.collection(HISTORY);
    }
    return this._coll;
  }

  async insertOne(req, collection, action, id, data, old) {
    if (IGNORE_COLLECTIONS.indexOf(collection) > -1) return;
    if (!data) return;
    let history = {};
    try {
      let content = { data };
      if (action === "update") {
        if (data["$set"]) data = data["$set"];
        if (data && old) {
          const change = util.difference(data, old);
          if (Object.keys(change).length === 0) return;
          content = { change, type: old.type };
        }
      } else if (action === "deleted") {
        content = { type: data.type };
      } else if (action === "new") {
        content.type = data.type;
      }
      history = { ...getRequestData(req), collection, action, id, ...content, createdAt: new Date().getTime() };
      await (await this.getCollection()).insertOne(history);
    } catch (err) {
      logger.system(
        "warn",
        `Error saving one to history for collection ${collection} and action ${action}: ` + JSON.stringify(history),
        err
      );
    }
  }

  async insertMany(req, collection, action, array = []) {
    if (IGNORE_COLLECTIONS.indexOf(collection) > -1) return;
    if (!array || array.length === 0) return;
    const history = [];
    try {
      const reqData = getRequestData(req);
      array.forEach(({ old, data }) => {
        let content = { data };
        if (action === "update") {
          if (data["$set"]) data = data["$set"];
          if (data && old) {
            const change = util.difference(data, old);
            if (Object.keys(change).length === 0) return;
            content = { change, type: old.type };
          }
        } else if (action === "deleted") {
          content = { type: old.type };
        } else if (action === "new") {
          content.type = data.type;
        }
        history.push({ ...reqData, collection, action, id: old.id, ...content, createdAt: new Date().getTime() });
      });
      await (await this.getCollection()).insertMany(history);
    } catch (err) {
      logger.system(
        "warn",
        `Error saving many to history for collection ${collection} and action ${action}: ` + JSON.stringify(history),
        err
      );
    }
  }
}

module.exports = new HistoryDBHandler();
