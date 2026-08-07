## Live session server

Node.js WebSocket backend for Storyteller ↔ player live sessions.

### Modes

| Mode | How | Listen |
| --- | --- | --- |
| **Development / LAN** | `npm run serve:ws` or via `npm start` | `ws://0.0.0.0:8081` |
| **Cloud (Render)** | `CLOUD=1 npm run start:ws` | HTTP + WS on `$PORT` (TLS at the platform edge) |
| **Legacy self-hosted HTTPS** | `cert.pem` + `key.pem` in cwd, no `CLOUD` | HTTPS on port 8080 |

### Local setup

From the project root:

```shell
npm install
npm run serve:ws
```

Or:

```shell
NODE_ENV=development LOCAL_PLAY=1 node server/index.js
```

The frontend connects to `hostname:8081` unless `VUE_APP_WS_URL` is set at build time.

### Cloud setup (Render)

See root [`render.yaml`](../render.yaml).

Required env:

- `CLOUD=1` (also auto-detected when `RENDER=true`)
- `ALLOWED_ORIGINS` — comma-separated page origins, e.g. `https://you.github.io`
- Health check: `GET /health` → `ok`

### Legacy HTTPS setup

Generate `cert.pem` and `key.pem` (e.g. Let's Encrypt), place them in the working directory used to start the process, then from the project root:

```shell
npm install
node server/index.js
```

Optional: [pm2](https://pm2.keymetrics.io/) with `ecosystem.config.js`.

### Allowing access from different domains

Default whitelist matches `*.github.io`, localhost, private IPs, and upstream townsquare hosts. Override or extend with:

```text
ALLOWED_ORIGINS=https://your.custom.domain,https://you.github.io
```
