const moment = require('moment')
const fs = require('fs')
const safeStringify = require('fast-safe-stringify');
const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');

const config = require('./../config');
const util = require('../lib/util');

let folder = config.NODE_LOG_LOCATION || 'log/';
if (folder.lastIndexOf('/') != folder.length-1){
    folder = folder + '/'
}
console.log('Logs will be saved in folder:', folder)

const DATE_PATTERN = config.NODE_LOG_DATE_PATTERN || 'YYYY-MM-DD';
const KEEP_LOGS_DAYS = config.NODE_LOG_KEEP_LOGS_DAYS || 7;

const _replaceErrors = (key, value) => {
    if (value instanceof Error) {
        const error = {};

        Object.getOwnPropertyNames(value).forEach(key => {
            error[key] = value[key];
        });

        return error;
    }
    return value;
};

const logFormat = format.printf(info => {
    const splat = info[Symbol.for('splat')];
    let base = `${info.timestamp} ${info.level}: ${safeStringify(info.message)}`;
    if (splat && splat.length > 0) base += ', ' + safeStringify(splat, _replaceErrors);
    return base;
});

const appLogger = createLogger({ level: config.NODE_LOG_LEVEL || 'debug'});

appLogger.add(new transports.Console({
    format: format.combine(
        format.timestamp(),
        format.colorize(),
        format.prettyPrint(),
        logFormat
    ),
    timestamp: true,
    json: false,
    datePattern: DATE_PATTERN
}));

if (config.NODE_LOG_TO_FILE === 'true') {
    try {
        const dailyRotateTransport = new (transports.DailyRotateFile)({
            format: format.combine(
                format.timestamp(),
                format.prettyPrint(),
                logFormat
            ),
            filename: folder + 'LOG_%DATE%.log',
            timestamp: true,
            json: false,
            maxSize: '20m',
            maxFiles: KEEP_LOGS_DAYS+ 'd',
            datePattern: DATE_PATTERN
        });

        appLogger.add(dailyRotateTransport);
    } catch (err) {
        console.log(err);
    }
}

const _bindRequestData = (req, msg) => {
    msg = msg || '';
    if (req) {
        req.user_ip = util.getRequestIP(req);
    }
    return req && req.api_id ? req.api_id + '; IP' + req.user_ip + ' - ' + msg : msg;
};

const _log = (level, req, msg, ...data) => {
    const fullMsg = _bindRequestData(req, msg);
    appLogger[level](fullMsg, ...data);
}

const _checkLoggedFiles = () => {
    if (config.LOG_TO_FILE === 'true' && KEEP_LOGS_DAYS > 0) {
        const dateFormated = moment(new Date()).subtract(KEEP_LOGS_DAYS, 'days').format(DATE_PATTERN.toUpperCase());
        const minFileName = 'LOG_' + dateFormated + '.log';
        _log('info', null, 'Deleting all log files older or equal to - ' + minFileName);
        fs.readdirSync(folder).forEach(function (dir) {
            if (fs.lstatSync(folder + dir).isFile() && dir.indexOf('LOG') === 0) {
                if (dir <= minFileName) {
                    _log('info', null, 'Deleting old log file', dir);
                    fs.unlinkSync(folder + dir);
                }
            }
        })
    }
}

_checkLoggedFiles();

module.exports = {
    info: (req, msg, ...data) => _log('info', req, msg, ...data),
    error: (req, msg, err, ...data) => {
        const fullMsg = _bindRequestData(req, msg);
        appLogger.error(fullMsg, ...data, err);
    },
    warn: (req, msg, ...data) => _log('warn', req, msg, ...data),
    debug: (req, msg, ...data) => _log('debug', req, msg, ...data),
    verbose: (req, msg, ...data) => _log('verbose', req, msg, ...data),
    system: (lvl, msg, ...data) => _log(lvl, null, msg, ...data)
};
