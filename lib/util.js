const uuidv1 = require('uuid/v1');
const _ = require('lodash');
const error = require('./error');

const CHARACTERS = ['ABCDEFGHIJKLMNOPQRSTUVWXYZ', '0123456789', 'abcdefghijklmnopqrstuvwxyz', '!_'];

module.exports.generatePassword = () => {
    return [3, 3, 3, 1].map((len, i) => { return Array(len).fill(CHARACTERS[i]).map(x => { return x[Math.floor(Math.random() * x.length)]; }).join(''); }).concat().join('').split('').sort(() => { return 0.5 - Math.random(); }).join('');
};

const _repeatCharacters = (count, ch) => {
    if (count === 0) {
        return '';
    }
    const count2 = count / 2;
    let result = ch;

    // double the input until it is long enough.
    while (result.length <= count2) {
        result += result;
    }
    // use substring to hit the precise length target without
    // using extra memory
    return result + result.substring(0, count - result.length);
};
module.exports.repeatCharacters = _repeatCharacters;

module.exports.round = (value, places) => {
    const number = Number(value + ('e+' + places));
    return +(Math.round(number) + ('e-' + places));
};

module.exports.format = (amount, decimalCount = 2, decimal = '.', thousands = ',') => {
    try {
        decimalCount = Math.abs(decimalCount);
        decimalCount = isNaN(decimalCount) ? 2 : decimalCount;

        const negativeSign = amount < 0 ? '-' : '';

        const i = parseInt(amount = Math.abs(Number(amount) || 0).toFixed(decimalCount)).toString();
        const j = (i.length > 3) ? i.length % 3 : 0;
        return negativeSign + (j ? i.substr(0, j) + thousands : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, '$1' + thousands) + (decimalCount ? decimal + Math.abs(amount - i).toFixed(decimalCount).slice(2) : '');
    } catch (e) {
        return amount;
    }
};

module.exports.maskString = (string, lastN, symbol = '*') => {
    if (!string) return '';
    if (!lastN) return string;
    if (string.length < lastN) return string;

    return _repeatCharacters(string.length - lastN, symbol) + string.substr(string.length - lastN);
};

module.exports.returnBatchRequest = (user) => {
    return { user, api_id: uuidv1(), headers: { 'x-forwarded-for': ':LOCAL_BATCH' } };
};

module.exports.cloneBatchRequest = (req, initData) => {
    return _.defaults(initData || {}, req);
};

module.exports.getRequestIP = (req) => {
    if (req) {
        let ipData = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        ipData = ipData ? ipData.replace('::1', ':127.0.0.1').replace('::ffff', '') : 'UNKNOWN';
        return ipData;
    }
    return {};
};

module.exports.trimQuotes = string => {
    if (string.indexOf('`') >= 0) {
        return string.slice(1, -1);
    } else return string;
};

module.exports.getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports.getSystemRequest = (db) => {
    return { db }
}

module.exports.difference = (object, base) => {
  const keys = [];
  const diff = _.transform(object, function (result, value, key) {
    keys.push(key);
    if (key !== "createdAt" && key !== "updatedAt" && key !== "_id" && !_isEqual(value, base[key])) {
      if (value instanceof Date) {
        result[key] = value;
      } else if (Array.isArray(value)) {
        result[key] = {
          added: _.difference(value, base[key]),
          removed: _.difference(base[key], value),
        };
      } else {
        result[key] = _.isObject(value) && _.isObject(base[key]) ? _.difference(value, base[key]) : value;
      }
    }
  });
  // _.transform(base, function (result, value, key) {
  //     if (keys.indexOf(key) === -1 && (value === 0 || value)) {
  //         diff[key] = value;
  //     }
  // });
  return diff;
};

const _isEqual = (first, second) => {
  return _.isEqual(first, second);
};

module.exports.sleep = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};
