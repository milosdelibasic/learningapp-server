/**
 * Created by laslo on 5/8/20.
 */
const isLength = require('validator/lib/isLength');
const error = require('../error');

const _validator = (name, value, options = {}) => {
  const { min, max, mandatory } = options
  if (value){
    if ((max || min) && !isLength(name, { min, max })) return { name, error: 'length', data: { min, max }}
  } else {
    if (mandatory) return { name, error: 'missing'}
  }
}

module.exports = _validator