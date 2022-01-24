const logger = require("../lib/logger");
const error = require("../lib/error");
const fs = require("fs");
const config = require("../config");
const path = require("path");

const MODULE_LOCATION =
  config.NODE_MODULES_SCRIPTS_LOCATION || `${global.appRoot}/scripts`;

class ScriptsMiddleware {
  constructor() {}

  preScriptProcess(module, dataType) {
    return async (req, res, next) => {
      try {
        let { name = module, mode, data = {}, type = dataType } = {
          ...req.body,
          ...req.query,
          ...req.params,
        };
        const fileName = `pre_${name}_${type}.js`;
        const filePath = path.join(MODULE_LOCATION, fileName);
        const exists = fs.existsSync(filePath);
        if (exists) {
          const script = require(filePath);
          const result = await script(req, data, mode);
          data = result.data;
          mode = result.mode ? result.mode : mode;
          req.query = {};
          req.params = {};
          req.body = { module, name, mode, data, type };
          logger.debug(req, `Successfully performed preScript `);
        }
        next();
      } catch (error) {
        logger.error(req, `Error performing preScript. `, error);
        next(error);
      }
    };
  }

  postScriptProcess(module, dataType) {
    return async (req, res, next) => {
      try {
        let { name = module, mode, data = {}, type = dataType } = {
          ...req.body,
          ...req.query,
          ...req.params,
        };
        const fileName = `post_${name}_${type}.js`;
        const filePath = path.join(MODULE_LOCATION, fileName);
        const exists = fs.existsSync(filePath);
        if (exists) {
          const script = require(filePath);
          req.response = await script(req, data, mode);
          logger.debug(req, `Successfully performed postScript `);
        }
        next();
      } catch (error) {
        logger.error(req, `Error performing postScript. `, error);
        next(error);
      }
    };
  }
}

module.exports = new ScriptsMiddleware();
