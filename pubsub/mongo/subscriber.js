/**
 * Created by laslo on 4/28/20.
 */
const logger = require("../../lib/logger");
const exec = require("child_process").exec;
const config = require("../../config");
const mainDBHandler = require("../../database/main.handler");
const _ = require("lodash");

const MAX_RECONNECT_TIME = 120000; // 2 min in milliseconds
const INITIAL_RECONNECT_TIME = 500; // 2 min in milliseconds
const subscriberStreams = [];
let reconnectInterval = INITIAL_RECONNECT_TIME; // initial reconnect attempt time

const _subscribe = async (channels = [], handlers) => {
  if (!Array.isArray(channels)) channels = [channels];
  for (const channel of channels) {
    await _subscribeToChannel(channel, handlers);
  }
};

const _subscribeToChannel = async (channel, handlers) => {
  logger.system(
    "info",
    `Mongo Subscriber connecting to channel ${channel} on host ${config.NODE_DB_URL} and database ${config.NODE_DB_NAME}`
  );

  try {
    const subscriber = await mainDBHandler.collection({}, channel);
    const subscriberStream = subscriber.watch();

    subscriberStream.on("change", (next) => {
      logger.system("debug", "Mongo subscriber received a change on the channel", next);
      if (next.fullDocument) {
        handlers.forEach((handler) => handler.onMessage(channel, next.fullDocument.message));
      } else if (next.updateDescription) {
        //TODO if needed
        // handlers.forEach(handler => handler.onMessage(channel, next.fullDocument.message))
      }
    });

    subscriberStream.on("error", (err) => {
      if (_.includes(err, "ECONNREFUSED")) {
        _restartDatabase();
        _reconnect(channel, handlers);
      }
    });

    subscriberStreams.push(subscriberStream);
  } catch (err) {
    logger.error(null, "Error Subscribing ", err);
    if (_.includes(err, "ECONNREFUSED")) {
      // _restartDatabase();
      _reconnect(channel, handlers);
    }
  }
};

const _close = async () => {
  if (subscriberStreams && subscriberStreams.length) {
    for (const subscriberStream of subscriberStreams) {
      await subscriberStream.close((error, result) => {
        if (error) {
          console.log(error);
        }
        if (result) {
          console.log(result);
        }
      });
    }
  }
};

const _restartDatabase = () => {
  logger.info(null, "Restarting the Database");

  const command = config.NODE_DB_RESTART_SCRIPT;
  exec(command, (err, stdout, stderr) => {
    if (err || stderr) {
      logger.error(null, "Error Executing Database Restart.", err);
    }
  });
};

const _reconnect = (channel, handlers) => {
  setTimeout(() => {
    _subscribeToChannel(channel, handlers);
  }, reconnectInterval); // we trigger reconnect
  reconnectInterval = reconnectInterval * 2; // we increase next reconnect time
  if (reconnectInterval > MAX_RECONNECT_TIME) reconnectInterval = MAX_RECONNECT_TIME; // if reconnect time is bigger then max we put it to max
  console.log(reconnectInterval);
};

module.exports = {
  subscribe: _subscribe,
  close: _close,
};
