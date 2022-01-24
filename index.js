const path = require("path");
global.appRoot = path.resolve(__dirname);
const os = require("os");
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const router = require("./router");
const logger = require("./lib/logger");
const config = require("./config");
const websocket = require("./websocket");
const jobs = require("./jobs");
const { subscriber } = require("./pubsub");
const https = require("https");
const http = require("http");
const errorMiddleware = require("./middleware/error.middleware");
const loggerMiddleware = require("./middleware/logger.middleware");
const startupMiddleware = require("./middleware/startup.middleware");
const mainHandler = require("./database/main.handler");
const app = express();

const _start = async () => {
  logger.system(
    "info",
    `Main Starting server on host ${os.hostname()} with ${
      config.NODE_ENV
    } enviroment`
  );

  app.use(cors()).use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", " GET, POST, PUT, DELETE");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, Content-Type, X-Auth-Token"
    );
    next();
  });

  app.use(express.json({ limit: "10mb" }));
  app.use(loggerMiddleware.logRequest);
  app.use("/api", startupMiddleware.dbConnection);

  const port = config.NODE_PORT || "3000";
  app.server = http.createServer(app);
  // Start web app
  app.server.listen(port, (err) => {
    if (err) {
      logger.system("error", "Main Unable to start app", err);
    } else {
      logger.system(
        "info",
        `Main App started on port ${port} with ${config.NODE_ENV} settings.`
      );
      _init(app);
    }
  });
};

const _startCron = () => {
  if (!config.CRON_INSTANCES) return true;
  const cronInstances = config.CRON_INSTANCES.split(",");
  return cronInstances.indexOf(os.hostname()) > -1 ? true : false;
};

const _init = async (app) => {
  try {
    logger.system("info", `Main Initializing Services`);
    if (_startCron()) {
      logger.system("info", `Starting cron on instance ` + os.hostname());
      await jobs.start();
    }
    websocket.start(app.server);
    if (subscriber) subscriber.subscribe(["messages", "chats"], [websocket], app);

    await router.load(app);
    logger.system("info", "Main All modules loaded.");

    app.use(async (req, res, next) => {
      if (req.db) {
        mainHandler.close(req, req.db);
        req.db = null;
      }

      if (req.response || req.method !== "GET") {
        const responseData = {
          data: req.response,
          images: req.changedImages ? req.changedImages : [],
          language: req.language ? req.language : {},
        };
        res.json(responseData);
      } else if (req.method === "GET") {
        res.status(404);
        res.send("Not Found");
      }
    });

    // handle error responses
    app.use(errorMiddleware);
    logger.system("info", `Main Initialized Services`);
  } catch (err) {
    logger.system("error", `Main Error Initializing Services`, err);
  }
};

try {
  _start();
} catch (err) {
  logger.system("error", "Main Failed to start server", err);
}

module.exports = app;
