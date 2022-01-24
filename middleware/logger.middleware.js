const uuidv1 = require('uuid/v1');
const logger = require('../lib/logger');

exports.logRequest = function (req, res, next) {
    const url = req.originalUrl || '';
    req.api_id = uuidv1();
    const body = req.body ? { ...req.body } : {}
    delete body.fingerprint
    logger.info(req, `${req.method} ${url} ; body: ${JSON.stringify(body)}`);
    next();
};
exports.logErrors = function (err, req, res, next) {
    const url = req.originalUrl || '';
    logger.error(req, `${req.method} ${url} ; body ${JSON.stringify(req.body)}. err: ${JSON.stringify(err)}`);
    next(err);
};
