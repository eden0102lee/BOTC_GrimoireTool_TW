#!/usr/bin/env node
/**
 * Local LAN play server: static frontend + WebSocket on separate ports.
 * Usage: npm run play  |  npm start  |  啟動伺服器.bat
 *
 * While running, type a command and press Enter:
 *   restart / r  — rebuild frontend if needed, restart WebSocket
 *   rebuild      — force rebuild frontend, then restart WebSocket
 *   help / h     — list commands
 *   quit / exit  — stop the server
 */
const http = require("http");
const net = require("net");
const fs = require("fs");
const path = require("path");
const os = require("os");
const readline = require("readline");
const { spawn, execSync } = require("child_process");

const ROOT = path.join(__dirname, "..");
const DIST = path.join(ROOT, "dist");
const DEFAULT_HTTP_PORT = parseInt(process.env.PORT || "8080", 10);
const DEFAULT_WS_PORT = parseInt(process.env.WS_PORT || "8081", 10);
const HOST = process.env.HOST || "0.0.0.0";
const OPEN_BROWSER = process.env.OPEN_BROWSER !== "0";

/** Active ports (may differ from defaults if those are busy). */
let HTTP_PORT = DEFAULT_HTTP_PORT;
let WS_PORT = DEFAULT_WS_PORT;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".map": "application/json"
};

/** @type {import("child_process").ChildProcess | null} */
let wsChild = null;
let restartingWs = false;
let shuttingDown = false;

function getLanIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const netInfo of nets[name] || []) {
      if (netInfo.family === "IPv4" && !netInfo.internal) {
        return netInfo.address;
      }
    }
  }
  return "127.0.0.1";
}

function isPortFree(port, host) {
  return new Promise(resolve => {
    const tester = net.createServer();
    tester.once("error", () => resolve(false));
    tester.once("listening", () => {
      tester.close(() => resolve(true));
    });
    tester.listen(port, host);
  });
}

function waitForPortFree(port, host, attempts = 40, delayMs = 100) {
  return new Promise(async resolve => {
    for (let i = 0; i < attempts; i++) {
      if (await isPortFree(port, host)) {
        resolve(true);
        return;
      }
      await new Promise(r => setTimeout(r, delayMs));
    }
    resolve(false);
  });
}

function openBrowser(url) {
  if (!OPEN_BROWSER) return;
  try {
    if (process.platform === "win32") {
      spawn("cmd", ["/c", "start", "", url], {
        detached: true,
        stdio: "ignore"
      }).unref();
    } else if (process.platform === "darwin") {
      spawn("open", [url], { detached: true, stdio: "ignore" }).unref();
    } else {
      spawn("xdg-open", [url], { detached: true, stdio: "ignore" }).unref();
    }
  } catch (_) {
    // Browser open is best-effort only.
  }
}

const GH_PAGES_PREFIX = "/BOTC_GrimoireTool_TW";

function normalizeLocalUrlPath(urlPath) {
  if (urlPath.startsWith(GH_PAGES_PREFIX + "/")) {
    return urlPath.slice(GH_PAGES_PREFIX.length) || "/";
  }
  return urlPath;
}

function serveFile(req, res) {
  let urlPath = normalizeLocalUrlPath(
    decodeURIComponent(req.url.split("?")[0]),
  );

  if (urlPath === "/api/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        ok: true,
        httpPort: HTTP_PORT,
        wsPort: WS_PORT,
        uptime: process.uptime(),
        wsRunning: !!(wsChild && !wsChild.killed)
      })
    );
    return;
  }

  if (urlPath === "/api/host-info") {
    const lanIp = getLanIp();
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        lanIp,
        httpPort: HTTP_PORT,
        wsPort: WS_PORT,
        playUrl: `http://${lanIp}:${HTTP_PORT}/`
      })
    );
    return;
  }

  let filePath = path.join(DIST, urlPath === "/" ? "index.html" : urlPath);
  if (!filePath.startsWith(DIST)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      fs.readFile(path.join(DIST, "index.html"), (err2, indexData) => {
        if (err2) {
          res.writeHead(404);
          res.end("Not found. Run npm run build first.");
          return;
        }
        res.writeHead(200, {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache"
        });
        res.end(indexData);
      });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    const headers = {
      "Content-Type": MIME[ext] || "application/octet-stream"
    };
    // Avoid stale index.html pointing at an old hashed bundle after rebuilds
    if (ext === ".html" || urlPath === "/") {
      headers["Cache-Control"] = "no-cache";
    }
    res.writeHead(200, headers);
    res.end(data);
  });
}

function getNewestMtime(dir, filterFn) {
  let newest = 0;
  if (!fs.existsSync(dir)) return newest;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === "dist") continue;
      newest = Math.max(newest, getNewestMtime(full, filterFn));
    } else if (!filterFn || filterFn(full)) {
      newest = Math.max(newest, fs.statSync(full).mtimeMs);
    }
  }
  return newest;
}

function distHasGithubPagesPublicPath() {
  const indexHtml = path.join(DIST, "index.html");
  if (!fs.existsSync(indexHtml)) return false;
  try {
    const html = fs.readFileSync(indexHtml, "utf8");
    return html.includes(`${GH_PAGES_PREFIX}/js/`);
  } catch (_) {
    return false;
  }
}

function ensureDist(force = false) {
  const indexHtml = path.join(DIST, "index.html");
  const needsBuild =
    force ||
    !fs.existsSync(indexHtml) ||
    distHasGithubPagesPublicPath() ||
    getNewestMtime(path.join(ROOT, "src")) > fs.statSync(indexHtml).mtimeMs ||
    getNewestMtime(path.join(ROOT, "public")) > fs.statSync(indexHtml).mtimeMs;

  if (needsBuild) {
    if (distHasGithubPagesPublicPath() && !force) {
      console.log(
        "dist/index.html uses GitHub Pages paths; rebuilding for local LAN..."
      );
    } else {
      console.log(
        force
          ? "Force rebuilding frontend..."
          : fs.existsSync(indexHtml)
            ? "Source newer than dist/. Rebuilding frontend..."
            : "dist/ not found. Building frontend..."
      );
    }
    execSync("npm run build", {
      cwd: ROOT,
      stdio: "inherit",
      env: {
        ...process.env,
        NODE_ENV: "production",
        // Local LAN serves dist/ at site root — not GitHub Pages subpath.
        VUE_APP_PUBLIC_PATH: "/",
      },
    });
    if (distHasGithubPagesPublicPath()) {
      console.warn(
        "[WARN] dist/index.html still references GitHub Pages paths after build.",
      );
    }
  }
}

function startWsServer() {
  const env = {
    ...process.env,
    NODE_ENV: "development",
    LOCAL_PLAY: "1",
    HOST: "0.0.0.0",
    WS_PORT: String(WS_PORT)
  };
  const child = spawn("node", ["index.js"], {
    cwd: path.join(ROOT, "server"),
    env,
    stdio: "inherit"
  });
  child.on("exit", code => {
    wsChild = null;
    if (restartingWs || shuttingDown) return;
    console.log("WebSocket server exited", code);
    process.exit(code || 0);
  });
  wsChild = child;
  return child;
}

function stopWsServer() {
  return new Promise(resolve => {
    const child = wsChild;
    if (!child || child.killed) {
      resolve();
      return;
    }
    const done = () => resolve();
    child.once("exit", done);
    try {
      child.kill();
    } catch (_) {
      done();
    }
    // Fallback if kill does not emit exit promptly
    setTimeout(done, 2000);
  });
}

async function restartServers({ forceBuild = false } = {}) {
  if (restartingWs) {
    console.log("[INFO] Restart already in progress.");
    return;
  }
  restartingWs = true;
  console.log("");
  console.log(
    forceBuild
      ? "[INFO] Rebuild + restart WebSocket..."
      : "[INFO] Restarting WebSocket (rebuild if source changed)..."
  );
  try {
    ensureDist(forceBuild);
    await stopWsServer();
    const free = await waitForPortFree(WS_PORT, HOST);
    if (!free) {
      console.error(`[ERROR] Port :${WS_PORT} still busy after stopping WS.`);
      return;
    }
    startWsServer();
    console.log("[OK] WebSocket restarted. Hard-refresh the browser (Ctrl+F5).");
    console.log("");
  } catch (err) {
    console.error("[ERROR] Restart failed:", err.message || err);
  } finally {
    restartingWs = false;
  }
}

function printCommands() {
  console.log("Commands (type in this window, then Enter):");
  console.log("  restart / r   Rebuild frontend if needed, restart WebSocket");
  console.log("  rebuild       Force rebuild frontend, then restart WebSocket");
  console.log("  help / h      Show this list");
  console.log("  quit / exit   Stop the server");
  console.log("");
}

function attachStdinCommands() {
  if (!process.stdin.isTTY) return;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
  });

  rl.on("line", line => {
    const cmd = String(line || "")
      .trim()
      .toLowerCase();
    if (!cmd) return;

    switch (cmd) {
      case "restart":
      case "r":
        restartServers({ forceBuild: false });
        break;
      case "rebuild":
        restartServers({ forceBuild: true });
        break;
      case "help":
      case "h":
      case "?":
        printCommands();
        break;
      case "quit":
      case "exit":
      case "q":
        shutdown();
        break;
      default:
        console.log(`[INFO] Unknown command: ${cmd}`);
        printCommands();
    }
  });
}

function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log("");
  console.log("[INFO] Stopping server...");
  const child = wsChild;
  try {
    if (child) child.kill();
  } catch (_) {
    /* ignore */
  }
  process.exit(0);
}

async function resolvePorts() {
  const explicitHttp = process.env.PORT != null && process.env.PORT !== "";
  const explicitWs = process.env.WS_PORT != null && process.env.WS_PORT !== "";

  if (explicitHttp && explicitWs) {
    const httpFree = await isPortFree(DEFAULT_HTTP_PORT, HOST);
    const wsFree = await isPortFree(DEFAULT_WS_PORT, HOST);
    if (!httpFree || !wsFree) return null;
    return { httpPort: DEFAULT_HTTP_PORT, wsPort: DEFAULT_WS_PORT };
  }

  const wsCandidates = explicitWs
    ? [DEFAULT_WS_PORT]
    : [8081, 8083, 8085, 8087, 8089];

  for (const wsPort of wsCandidates) {
    const wsFree = await isPortFree(wsPort, HOST);
    if (!wsFree) continue;

    const httpStart = explicitHttp ? DEFAULT_HTTP_PORT : 8080;
    const httpAttempts = explicitHttp ? 1 : 20;
    for (let attempt = 0; attempt < httpAttempts; attempt++) {
      const httpPort = explicitHttp ? httpStart : httpStart + attempt * 2;
      const httpFree = await isPortFree(httpPort, HOST);
      if (httpFree) {
        if (wsPort !== 8081) {
          console.warn(
            `[WARN] WebSocket on :${wsPort} (not :8081). Live session may need a dev rebuild with VUE_APP_WS_PORT=${wsPort}.`,
          );
        }
        return { httpPort, wsPort };
      }
    }
  }

  return null;
}

async function main() {
  const resolved = await resolvePorts();
  if (!resolved) {
    console.error("");
    console.error("Cannot start: no free HTTP/WS port pair found.");
    console.error(
      `Tried :8080/:8081 through :${8080 + 19 * 2}/:${8081 + 19 * 2}.`,
    );
    console.error("");
    console.error("Stop other servers or set PORT / WS_PORT explicitly.");
    console.error("");
    process.exit(1);
  }

  HTTP_PORT = resolved.httpPort;
  WS_PORT = resolved.wsPort;
  if (HTTP_PORT !== 8080 || WS_PORT !== 8081) {
    console.log(
      `[INFO] Default ports busy; using HTTP :${HTTP_PORT} and WS :${WS_PORT}`,
    );
  }

  ensureDist();
  startWsServer();

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  http.createServer(serveFile).listen(HTTP_PORT, HOST, () => {
    const lanIp = getLanIp();
    const localUrl = `http://localhost:${HTTP_PORT}/`;
    console.log("");
    console.log("Clocktower Grimoire TW - Local LAN server");
    console.log("=========================================");
    console.log(`Storyteller (this machine): ${localUrl}`);
    console.log(`Players on same Wi-Fi:      http://${lanIp}:${HTTP_PORT}/`);
    console.log(`WebSocket:                  ws://${lanIp}:${WS_PORT}/`);
    console.log(`Health check:               ${localUrl}api/health`);
    console.log("");
    console.log("1. Open the storyteller URL, add players, host a session [C]");
    console.log("2. Share the player link (with #room code) from the menu");
    console.log("3. Press Ctrl+C, or type quit, to stop the server");
    console.log("");
    printCommands();
    attachStdinCommands();
    openBrowser(localUrl);
  });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
