/**
 * Created by laslo on 5/8/20.
 */
const isEmail = require('validator/lib/isEmail');
const error = require('../error');

const _validator = (name, value, options = {}) => {
  const { mandatory } = options
  if (mandatory) return { name, error: 'missing'}
  if (!isEmail(value)) {
    return { name, error: 'invalid'}
  }
}

module.exports = _validator