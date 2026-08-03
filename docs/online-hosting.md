# 線上連線（Render + GitHub Pages）

說書人與玩家不在同一 Wi‑Fi 時，前端在 **GitHub Pages**，WebSocket 房間在 **Render**。分享連結形如：

`https://eden0102lee.github.io/BOTC_GrimoireTool_TW/#房間碼`

## 兩個網址，各做不同事

| 網址 | 用途 |
| --- | --- |
| **https://eden0102lee.github.io/BOTC_GrimoireTool_TW/** | 魔典操作介面（給說書人／玩家開） |
| **https://botc-grimoiretool-tw.onrender.com/** | 僅 WebSocket 後端（`/health` 正常即代表連線服務 OK） |

Render 網址打開只會看到說明頁或 404，**不會**顯示魔典畫面，這是正常設計。

## 架構

| 元件 | 位置 |
| --- | --- |
| 靜態前端 | GitHub Pages（`gh-pages` 分支） |
| 房間 WebSocket | Render Web Service（`wss://botc-grimoiretool-tw.onrender.com/`） |

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

## 接上 GitHub Pages（必做，才有魔典畫面）

1. GitHub repo → **Settings → Pages** → Source 選 **Deploy from a branch** → Branch **`gh-pages`** / **`/ (root)`** → Save。  
   （若尚未有 `gh-pages` 分支，先完成下面第 2 步 workflow。）

2. **Settings → Secrets and variables → Actions** 新增：

   - Name: `VUE_APP_WS_URL`
   - Value: `wss://botc-grimoiretool-tw.onrender.com/`

3. **Actions** → **Deploy to GitHub Pages** → **Run workflow**（或 push 到 `main`）。

4. 等幾分鐘後開啟：**https://eden0102lee.github.io/BOTC_GrimoireTool_TW/**

5. **連線 → 創建小鎮** → **複製玩家連結** 分享（連結會是 GitHub Pages 網址 + `#房間碼`）。

## 本機 LAN（不變）

```bash
npm start
```

不設定 `VUE_APP_WS_URL` 時，前端連「目前頁面 hostname」的 `:8081`。詳見 [local-play.md](./local-play.md)。

## 疑難排解

| 現象 | 可能原因 |
| --- | --- |
| Render 網址沒有魔典畫面 | 正常；請改開 GitHub Pages 網址 |
| GitHub Pages 404 | 尚未跑 Deploy workflow 或未啟用 `gh-pages` 分支 |
| `Cannot find module ... App.vue` | Start Command 設錯；改為 `CLOUD=1 npm run start:ws` |
| Pages 上無法連線 | 未設 `VUE_APP_WS_URL` 或建置後未重新 Deploy Pages |
| WS 立刻被拒 | `ALLOWED_ORIGINS` 未包含你的 Pages origin |
| 第一次很慢 | Render Free 冷啟動，稍候再連 |
| 本機也連到雲端 | 本機建置／開發時誤設了 `VUE_APP_WS_URL`；清掉後重開 |
