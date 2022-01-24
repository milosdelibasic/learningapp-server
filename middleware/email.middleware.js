const isEmail = require('validator/lib/isEmail');
const error = require('../lib/error');
const logger = require('../lib/logger');

exports.checkEmail = (req, res, next) => {
    if (!req.body.email || req.body.email.trim().length === 0) return next(error('BAD_REQUEST', 'Email missing'))
    req.body.email = req.body.email.toLowerCase().trim()
  
    if (!isEmail(req.body.email)) {
      logger.warn(req, 'ERROR Verify Code - Wrong Email format')
      return next(error('BAD_REQUEST', 'Wrong Email format'))
    }
    next()
};

exports.checkEmailAvailability = async (req, res, next) => {
    //TODO if needed
    res.json({ success: true });
};

