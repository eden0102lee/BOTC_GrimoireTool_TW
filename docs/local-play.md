# 本機 LAN 遊玩說明

說書人在同一台電腦啟動本機伺服器，玩家用手機／平板連同一 Wi‑Fi，以瀏覽器加入房間。

## 快速開始

**Windows 一鍵**：雙擊專案根目錄的 `啟動伺服器.bat`（或 `start-server.bat`）。

或在終端機：

```bash
npm install
npm start
```

這會：

1. 若尚無 `dist/`，先執行 `npm run build`
2. 在 `0.0.0.0:8080` 提供靜態前端
3. 在 `0.0.0.0:8081` 啟動 WebSocket 房間伺服器
4. 自動開啟說書人瀏覽器（設 `OPEN_BROWSER=0` 可關閉）
5. 若埠已被佔用，印出明確錯誤並結束（通常表示伺服器已在跑）

終端機會印出本機與 LAN 網址，例如：

```text
Storyteller (this machine): http://localhost:8080/
Players on same Wi-Fi:      http://192.168.x.x:8080/
WebSocket:                  ws://192.168.x.x:8081/
Health check:               http://localhost:8080/api/health
```

健康檢查：瀏覽器或 `curl http://localhost:8080/api/health` 應回傳 `{ "ok": true, ... }`。

## 伺服器控制台指令

伺服器視窗保持開啟時，可輸入指令後按 Enter：

| 指令 | 說明 |
| --- | --- |
| `restart` / `r` | 若原始碼比 `dist/` 新則重建前端，並重啟 WebSocket |
| `rebuild` | 強制重建前端，再重啟 WebSocket |
| `help` / `h` | 顯示指令列表 |
| `quit` / `exit` | 停止伺服器（等同 Ctrl+C） |

重啟後請在瀏覽器 **Ctrl+F5** 硬重新整理。線上房間連線會中斷，說書人需重新創建／加入小鎮。

## 說書人步驟

1. 用電腦瀏覽器開啟 `http://localhost:8080/`（或 LAN IP）
2. 新增座位 `[A]`、選擇劇本 `[E]`、選單 → 角色 → 指派角色
3. 選單 → **連線** → **創建小鎮 `[C]`**，輸入房間碼
4. 連線分頁會顯示 LAN 網址與房間碼；點「複製玩家連結」分享
5. 需要時按 **發送角色**；`[Q]` 推進階段、提名投票皆會同步

### 集石官方快捷鍵

| 鍵 | 功能 |
| --- | --- |
| `[A]` | 添加座位 |
| `[C]` | 創建小鎮 |
| `[J]` | 加入小鎮 |
| `[Q]` | 進入白天（推進階段） |
| `[R]` | 角色能力表 |
| `[N]` | 夜晚順序表 |

### 本專案擴充快捷鍵

| 鍵 | 功能 |
| --- | --- |
| `[H]` | 隱藏角色（投影） |
| `[S]` | 上一階段 |
| `[E]` | 選擇劇本 |
| `[B]` | 戰報／復盤 |
| `[V]` | 投票紀錄 |
| `[F]` | 新增傳奇角色 |
| `[Esc]` | 關閉視窗 |

完整列表見左側 ShortcutPanel。分配角色與複製連結**無**快捷鍵，僅選單操作。

## 玩家步驟

1. 連上與說書人相同的 Wi‑Fi
2. 用瀏覽器開啟說書人分享的連結（含 `#房間碼`），或按 `[J]` 加入小鎮
3. 點座位坐下，等待角色與投票

## 開發模式（前後端分開）

```bash
# 終端機 1：前端（可選 --host 0.0.0.0 給 LAN）
npm run serve

# 終端機 2：WebSocket
npm run serve:ws
```

前端會自動連到「目前頁面 hostname」的 `:8081` WebSocket（不再寫死 `live.clocktower.online`）。

若要**跨網路**用固定網址連線（Render），見 [online-hosting.md](./online-hosting.md)。

## 防火牆

若玩家連不上：

- Windows：允許 Node.js 透過私人網路的連入連線（埠 `8080`、`8081`）
- 確認手機與電腦在同一網段（訪客 Wi‑Fi 常會隔離裝置）
- 暫時用 `http://<電腦LAN-IP>:8080/#房間碼` 測試

## 環境變數（選用）

| 變數 | 預設 | 說明 |
| --- | --- | --- |
| `PORT` | `8080` | HTTP 靜態埠 |
| `WS_PORT` | `8081` | WebSocket 埠 |
| `HOST` | `0.0.0.0` | 綁定介面 |
| `VUE_APP_WS_PORT` | `8081` | 建置前端時寫入的 WS 埠（本機） |
| `VUE_APP_WS_URL` | （空） | 若設定（如 `wss://….onrender.com/`），建置後前端改連此完整 URL |
| `OPEN_BROWSER` | （開啟） | 設為 `0` 則啟動時不自動開瀏覽器 |

## 安全提醒

本機 LAN 模式會放寬 WebSocket origin 檢查，僅適合受信任的區域網路，勿直接暴露到公網。
