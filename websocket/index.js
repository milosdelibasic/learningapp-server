/**
 * Created by laslo on 4/28/20.
 */
const WebSocket = require("ws");
const url = require("url");
const uuid = require("uuid/v1");
const logger = require("../lib/logger");
const mainDBHandler = require("../database/main.handler");

const wss = new WebSocket.Server({ noServer: true });

const usersMap = {};

const _start = (server) => {
  logger.system("info", "WebSocket starting websocket server");
  wss.on("connection", (ws, request, username) => {
    usersMap[username] = ws;
    logger.debug(request, "WebSocket connection received", username);
    ws.on("message", (msg) => {
      logger.debug(
        request,
        `WebSocket received message ${msg} from user ${username}`
      );

      var message = JSON.parse(msg);
      if (message.ping === true) {
        ws.send(JSON.stringify({ pong: true }));
      }
      //wss.emit("message", msg);
    });
    ws.on("close", () => {
      delete usersMap[username];
      logger.debug(
        request,
        `WebSocket connection closed from user ${username}`
      );
    });
  });

  server.on("upgrade", async (request, socket, head) => {
    request.api_id = uuid();
    const pathname = url.parse(request.url).pathname;
    if (pathname) {
      let username = pathname.substr(1);
      console.log("WebSocket username", username);
      const user = await mainDBHandler.findOne(request, "profiles", { username });
      if (user) {
        logger.debug(
          request,
          `WebSocket received connection from user with username ${username}`
        );
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit("connection", ws, request, username);
        });
      }
    }
  });
};

const _brodcastToAll = (message) => {
  message = typeof message === "object" ? JSON.stringify(message) : message;
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
};

const _sendToUsername = (username, message) => {
  message = typeof message === "object" ? JSON.stringify(message) : message;
  const client = usersMap[username];
  if (client && client.readyState === WebSocket.OPEN) {
    client.send(message);
  } else {
    delete usersMap[username];
    try {
      if (client) {
        client.close();
      }
    } catch (err) {
      logger.system(
        "error",
        `WebSocket error while closing websocket connect for user ${username}`
      );
    }
  }
};

const _onMessage = (channel, message) => {
  logger.system(
    "debug",
    `WebSocket received message ${message} for channel ${channel}`
  );

  if(channel === "chats") {
    _sendToUsername(message.to, message);
    return;
  }
  //TODO add additional logic if we want to separate per channel
  _brodcastToAll(message);
};

module.exports = {
  start: _start,
  brodcastToAll: _brodcastToAll,
  sendToUsername: _sendToUsername,
  onMessage: _onMessage,
};
