# 線上連線（Render + GitHub Pages）

說書人與玩家不在同一 Wi‑Fi 時，可把 WebSocket 房間伺服器部署到 [Render](https://render.com/)，前端仍由 GitHub Pages 提供。分享連結形如：

`https://<你的>.github.io/#房間碼`

## 架構

| 元件 | 位置 |
| --- | --- |
| 靜態前端 | GitHub Pages（`gh-pages`） |
| 房間 WebSocket | Render Web Service（`wss://…onrender.com/`） |

建置 Pages 時透過 `VUE_APP_WS_URL` 寫死雲端 WS 位址；本機 `npm start` **不要**設此變數，仍會連本機 `:8081`。

## 部署 WebSocket（Render）

1. 將本 repo 推到 GitHub（若尚未推送）。
2. 開啟 [Render Dashboard](https://dashboard.render.com) → **New** → **Blueprint**，選取本 repo（會讀根目錄 [`render.yaml`](../render.yaml)）。
   - 或手動 **New Web Service**（務必設定下列指令，勿用預設 `node App.vue`）：
     - **Build Command**：`npm ci --omit=dev`
     - **Start Command**：`CLOUD=1 npm run start:ws`（或留空改用根目錄 [`Procfile`](../Procfile)）
     - **Health Check Path**：`/health`

### 若 log 仍顯示 `Running 'node App.vue'`

代表 Render 服務設定裡仍保留舊的 Start Command，**不會**因 push 自動改。請到該服務：

**Settings → Build & Deploy → Start Command**

1. 刪除 `node App.vue`
2. 改為：`CLOUD=1 npm run start:ws`
3. **Save Changes** → **Manual Deploy**

或刪除舊服務，改用 **Blueprint** 依 [`render.yaml`](../render.yaml) 重建。

4. 環境變數：
   - `CLOUD=1`（Blueprint 已設）
   - `NODE_ENV=production`
   - `ALLOWED_ORIGINS=https://<你的使用者或組織>.github.io`（若 Pages 在專案子路徑，仍用 origin，不含 path）
5. 部署完成後記下服務網址，例如 `https://clocktower-grimoire-ws.onrender.com`。
6. 瀏覽器開 `https://…onrender.com/health` 應看到 `ok`。

### Free 方案注意

Free Web Service 閒置約 15 分鐘會休眠，喚醒可能要數十秒。開局前若連線失敗，等服務喚醒後重整頁面。常玩建議升 **Starter**（常駐）。

## 接上 GitHub Pages

1. 在 GitHub repo → **Settings → Secrets and variables → Actions** 新增：

   - Name: `VUE_APP_WS_URL`
   - Value: `wss://<service>.onrender.com/`（結尾建議加 `/`）

2. 推送到 `main`（或手動重跑 **Deploy to GitHub Pages** workflow），讓前端帶上此 URL 重新建置。

3. 用 Pages 網址開啟魔典 → **連線 → 創建小鎮** → **複製玩家連結** 分享給玩家。

## 本機 LAN（不變）

```bash
npm start
```

不設定 `VUE_APP_WS_URL` 時，前端連「目前頁面 hostname」的 `:8081`。詳見 [local-play.md](./local-play.md)。

## 疑難排解

| 現象 | 可能原因 |
| --- | --- |
| `Cannot find module ... App.vue` | Start Command 設錯；改為 `CLOUD=1 npm run start:ws` |
| Pages 上無法連線 | 未設 `VUE_APP_WS_URL` 或建置後未重新 Deploy Pages |
| WS 立刻被拒 | `ALLOWED_ORIGINS` 未包含你的 Pages origin |
| 第一次很慢 | Render Free 冷啟動，稍候再連 |
| 本機也連到雲端 | 本機建置／開發時誤設了 `VUE_APP_WS_URL`；清掉後重開 |
