#!/usr/bin/env node
/**
 * npm start entry: LAN play-server locally, WebSocket room server on Render/cloud.
 */
const isCloud =
  process.env.CLOUD === "1" ||
  process.env.RENDER === "true" ||
  !!process.env.RENDER_SERVICE_ID;

if (isCloud) {
  process.env.CLOUD = "1";
  process.env.NODE_ENV = process.env.NODE_ENV || "production";
  require("../server/index.js");
} else {
  require("./play-server.js");
}
