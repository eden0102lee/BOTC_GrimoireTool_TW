const fs = require("fs");
const http = require("http");
const https = require("https");
const WebSocket = require("ws");
const client = require("prom-client");

// Create a Registry which registers the metrics
const register = new client.Registry();
// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: "clocktower-online"
});

const PING_INTERVAL = 30000; // 30 seconds

const HOST = process.env.HOST || "0.0.0.0";
const WS_PORT = parseInt(process.env.WS_PORT || "8081", 10);
const LISTEN_PORT = parseInt(process.env.PORT || String(WS_PORT), 10);
const IS_DEV = process.env.NODE_ENV === "development";
const CLOUD =
  process.env.CLOUD === "1" ||
  process.env.RENDER === "true" ||
  !!process.env.RENDER_SERVICE_ID;
const LOCAL_PLAY =
  process.env.LOCAL_PLAY === "1" || (IS_DEV && !CLOUD);

function parseAllowedOrigins() {
  const raw = process.env.ALLOWED_ORIGINS;
  if (!raw) return null;
  return raw
    .split(",")
    .map(s => s.trim())
    .filter(Boolean);
}

const EXTRA_ORIGINS = parseAllowedOrigins();

function isAllowedOrigin(origin) {
  if (!origin) return LOCAL_PLAY || CLOUD;
  if (LOCAL_PLAY) return true;
  if (
    EXTRA_ORIGINS &&
    EXTRA_ORIGINS.some(o => origin === o || origin.startsWith(o))
  ) {
    return true;
  }
  return !!origin.match(
    /^https?:\/\/([^.]+\.github\.io|localhost|127\.0\.0\.1|clocktower\.online|eddbra1nprivatetownsquare\.xyz|\d{1,3}(?:\.\d{1,3}){3}(?::\d+)?)/i
  );
}

function handleHttpRequest(req, res) {
  if (req.url === "/health" || req.url === "/healthz") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ok");
    return;
  }
  if (req.url === "/metrics") {
    res.setHeader("Content-Type", register.contentType);
    register.metrics().then(out => res.end(out));
    return;
  }
  if (CLOUD && (req.url === "/" || req.url === "/index.html")) {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(`<!DOCTYPE html>
<html lang="zh-Hant">
<head><meta charset="utf-8"><title>Clocktower WS</title></head>
<body style="font-family:sans-serif;max-width:36em;margin:2em auto;line-height:1.5">
<h1>WebSocket 房間伺服器運作中</h1>
<p>此網址只提供即時連線（WebSocket），<strong>不是</strong>魔典操作介面。</p>
<p>請用 GitHub Pages 開啟魔典：</p>
<p><a href="https://eden0102lee.github.io/BOTC_GrimoireTool_TW/">https://eden0102lee.github.io/BOTC_GrimoireTool_TW/</a></p>
<p>健康檢查：<a href="/health">/health</a></p>
</body></html>`);
    return;
  }
  // Legacy prod served Prometheus on every path; keep that for HTTPS mode only via /metrics
  res.writeHead(404);
  res.end();
}

let server = null;
let wss;

if (CLOUD) {
  // PaaS (Render etc.): TLS terminated at edge; plain HTTP + WS on $PORT
  server = http.createServer(handleHttpRequest);
  wss = new WebSocket.Server({
    server,
    verifyClient: info => isAllowedOrigin(info.origin)
  });
  server.listen(LISTEN_PORT, HOST, () => {
    console.log(
      `WebSocket (cloud) listening on http://${HOST}:${LISTEN_PORT}/ (LOCAL_PLAY=${
        LOCAL_PLAY ? "1" : "0"
      })`
    );
  });
} else if (IS_DEV) {
  // Local / LAN: raw WS port (play-server + serve:ws)
  wss = new WebSocket.Server({
    port: WS_PORT,
    host: HOST,
    verifyClient: info => isAllowedOrigin(info.origin)
  });
  console.log(
    `WebSocket listening on ws://${HOST}:${WS_PORT}/ (LOCAL_PLAY=${
      LOCAL_PLAY ? "1" : "0"
    })`
  );
} else {
  // Legacy self-hosted HTTPS (cert.pem / key.pem in cwd)
  const options = {
    cert: fs.readFileSync("cert.pem"),
    key: fs.readFileSync("key.pem")
  };
  server = https.createServer(options, (req, res) => {
    if (req.url === "/health" || req.url === "/healthz") {
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end("ok");
      return;
    }
    res.setHeader("Content-Type", register.contentType);
    register.metrics().then(out => res.end(out));
  });
  wss = new WebSocket.Server({
    server,
    verifyClient: info => isAllowedOrigin(info.origin)
  });
  const legacyPort = parseInt(process.env.HTTPS_PORT || "8080", 10);
  server.listen(legacyPort, HOST, () => {
    console.log(
      `WebSocket (HTTPS) listening on ${HOST}:${legacyPort} (LOCAL_PLAY=${
        LOCAL_PLAY ? "1" : "0"
      })`
    );
  });
}

function noop() {}

// calculate latency on heartbeat
function heartbeat() {
  this.latency = Math.round((new Date().getTime() - this.pingStart) / 2);
  this.counter = 0;
  this.isAlive = true;
}

// map of channels currently in use
const channels = {};

// metrics
const metrics = {
  players_concurrent: new client.Gauge({
    name: "players_concurrent",
    help: "Concurrent Players",
    collect() {
      this.set(wss.clients.size);
    }
  }),
  channels_concurrent: new client.Gauge({
    name: "channels_concurrent",
    help: "Concurrent Channels",
    collect() {
      this.set(Object.keys(channels).length);
    }
  }),
  channels_list: new client.Gauge({
    name: "channel_players",
    help: "Players in each channel",
    labelNames: ["name"],
    collect() {
      for (let channel in channels) {
        this.set(
          { name: channel },
          channels[channel].filter(
            ws =>
              ws &&
              (ws.readyState === WebSocket.OPEN ||
                ws.readyState === WebSocket.CONNECTING)
          ).length
        );
      }
    }
  }),
  messages_incoming: new client.Counter({
    name: "messages_incoming",
    help: "Incoming messages"
  }),
  messages_outgoing: new client.Counter({
    name: "messages_outgoing",
    help: "Outgoing messages"
  }),
  connection_terminated_host: new client.Counter({
    name: "connection_terminated_host",
    help: "Terminated connection due to host already present"
  }),
  connection_terminated_spam: new client.Counter({
    name: "connection_terminated_spam",
    help: "Terminated connection due to message spam"
  }),
  connection_terminated_timeout: new client.Counter({
    name: "connection_terminated_timeout",
    help: "Terminated connection due to timeout"
  })
};

// register metrics
for (let metric in metrics) {
  register.registerMetric(metrics[metric]);
}

// a new client connects
wss.on("connection", function connection(ws, req) {
  // url pattern: clocktower.online/<channel>/<playerId|host>
  const url = req.url.toLocaleLowerCase().split("/");
  ws.playerId = url.pop();
  ws.channel = url.pop();
  // check for another host on this channel
  if (
    ws.playerId === "host" &&
    channels[ws.channel] &&
    channels[ws.channel].some(
      client =>
        client !== ws &&
        client.readyState === WebSocket.OPEN &&
        client.playerId === "host"
    )
  ) {
    console.log(ws.channel, "duplicate host");
    ws.close(1000, `The channel "${ws.channel}" already has a host`);
    metrics.connection_terminated_host.inc();
    return;
  }
  ws.isAlive = true;
  ws.pingStart = new Date().getTime();
  ws.counter = 0;
  // add channel to list
  if (!channels[ws.channel]) {
    channels[ws.channel] = [];
  }
  channels[ws.channel].push(ws);
  // start ping pong
  ws.ping(noop);
  ws.on("pong", heartbeat);
  // handle message
  ws.on("message", function incoming(data) {
    metrics.messages_incoming.inc();
    // check rate limit (max 5msg/second)
    ws.counter++;
    if (ws.counter > (5 * PING_INTERVAL) / 1000) {
      console.log(ws.channel, "disconnecting user due to spam");
      ws.close(
        1000,
        "Your app seems to be malfunctioning, please clear your browser cache."
      );
      metrics.connection_terminated_spam.inc();
      return;
    }
    const messageType = data
      .toLocaleLowerCase()
      .substr(1)
      .split(",", 1)
      .pop();
    switch (messageType) {
      case '"ping"':
        // ping messages will only be sent host -> all or all -> host
        channels[ws.channel].forEach(function each(client) {
          if (
            client !== ws &&
            client.readyState === WebSocket.OPEN &&
            (ws.playerId === "host" || client.playerId === "host")
          ) {
            client.send(
              data.replace(/latency/, (client.latency || 0) + (ws.latency || 0))
            );
            metrics.messages_outgoing.inc();
          }
        });
        break;
      case '"direct"':
        // handle "direct" messages differently
        console.log(
          new Date(),
          wss.clients.size,
          ws.channel,
          ws.playerId,
          data
        );
        try {
          const dataToPlayer = JSON.parse(data)[1];
          channels[ws.channel].forEach(function each(client) {
            if (
              client !== ws &&
              client.readyState === WebSocket.OPEN &&
              dataToPlayer[client.playerId]
            ) {
              client.send(JSON.stringify(dataToPlayer[client.playerId]));
              metrics.messages_outgoing.inc();
            }
          });
        } catch (e) {
          console.log("error parsing direct message JSON", e);
        }
        break;
      default:
        // all other messages
        console.log(
          new Date(),
          wss.clients.size,
          ws.channel,
          ws.playerId,
          data
        );
        channels[ws.channel].forEach(function each(client) {
          if (client !== ws && client.readyState === WebSocket.OPEN) {
            client.send(data);
            metrics.messages_outgoing.inc();
          }
        });
        break;
    }
  });
});

// start ping interval timer
const interval = setInterval(function ping() {
  // ping each client
  wss.clients.forEach(function each(ws) {
    if (ws.isAlive === false) {
      metrics.connection_terminated_timeout.inc();
      return ws.terminate();
    }
    ws.isAlive = false;
    ws.pingStart = new Date().getTime();
    ws.ping(noop);
  });
  // clean up empty channels
  for (let channel in channels) {
    if (
      !channels[channel].length ||
      !channels[channel].some(
        ws =>
          ws &&
          (ws.readyState === WebSocket.OPEN ||
            ws.readyState === WebSocket.CONNECTING)
      )
    ) {
      metrics.channels_list.remove({ name: channel });
      delete channels[channel];
    }
  }
}, PING_INTERVAL);

// handle server shutdown
wss.on("close", function close() {
  clearInterval(interval);
});
