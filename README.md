# Clocktower Grimoire TW

以 [bra1n/townsquare](https://github.com/bra1n/townsquare) 為底座的血染鐘樓魔典本機版，針對繁體中文說書人與 LAN 連入場景強化。

> 上游專案已不再積極維護；本 fork 保留原授權（GPL-3.0）與署名。

## 功能亮點

- 說書人魔典（對齊集石單一布局）；`[H]` 或選單隱藏角色（投影公開畫面）；`[Q]` 下一階段
- 劇本、角色指派、提醒標記、夜晚順序
- Live Session：本機 WebSocket 房間、即時投票、角色發放；**`[C]` 創建小鎮**、`[J]` 加入
- **繁中角色 CSV 同步**（不連 Google Sheets API）
- **官方角色／奇遇同步**（`npm run sync:official`，對齊 botc-release）
- **戰報／復盤**：依日／夜瀏覽、自動與手動紀錄、JSON／Markdown 匯出
- **本機 LAN 開服**：雙擊 `啟動伺服器.bat` 或 `npm start`

功能對照集石魔典見 [`docs/parity-checklist.md`](docs/parity-checklist.md)。  
LAN 遊玩步驟見 [`docs/local-play.md`](docs/local-play.md)。  
跨網路公開網址（Render + GitHub Pages）見 [`docs/online-hosting.md`](docs/online-hosting.md)。  
**GitHub Pages 第一次啟用**（找不到部署時必看）→ [`docs/github-pages-setup.md`](docs/github-pages-setup.md)。

## 快速開始

**一鍵開服（推薦）**：雙擊專案根目錄的 `啟動伺服器.bat`（或 `start-server.bat`）。

會自動檢查 Node／依賴、啟動 HTTP + WebSocket，並開啟瀏覽器。關閉該視窗即可停服。

```bash
npm install

# 一鍵本機 LAN（等同雙擊 .bat：build 如需 + 靜態站 + WS + 開瀏覽器）
npm start
# 或
npm run play

# 開發：前端
npm run serve

# 開發：WebSocket（另開終端機）
npm run serve:ws
```

預設（本機 LAN）：

- 前端／靜態：`http://localhost:8080/`
- WebSocket：`ws://localhost:8081/`（未設定 `VUE_APP_WS_URL` 時連「目前頁面 host」的 `:8081`）
- 健康檢查：`http://localhost:8080/api/health`

線上局：部署 Render WS 後，於 GitHub Actions secret 設定 `VUE_APP_WS_URL=wss://….onrender.com/`，詳見 [`docs/online-hosting.md`](docs/online-hosting.md)。

## 繁中角色 CSV 同步

### 角色資料來源

| 來源 | 說明 |
| --- | --- |
| **集石魔典** | Vue 打包內嵌簡體中文 `roles.json`（約 209 筆），無公開 roles API；角色圖示 CDN：`https://oss.gstonegames.com/data_file/clocktower/role_icon/{slug}.png` |
| **本專案** | 社群 [BOTC Translations（TW）](https://docs.google.com/spreadsheets/d/1aAJdqSTafHnw01w-WZ94UPx1Me70Kz-EG1NFfBht2tA/edit?gid=1544433985) → `data/raw/characters_zh_TW.csv` → `npm run sync:characters` |

本 repo 的 `src/roles.json` 以 bra1n/townsquare 約 **130** 個角色 id 為基礎（工作樹若已擴充則更多）；集石內嵌約 **209** 筆。**擴充角色集不在此步驟範圍**，目前以社群試算表覆蓋既有 id 的繁中欄位為主。

### 流程

1. 維護試算表匯出：`data/raw/community_translations_preview.csv`（或自試算表重新匯出後覆蓋）。
2. 產生同步用 CSV（不含 `flavor` 欄；`reminders`／`remindersGlobal` 內若為逗號分隔多 token 會轉成 `|`）：

```bash
npm run build:characters
```

3. 寫入 `src/roles.json` 與 overlay `src/roles.zh_TW.json`：

```bash
npm run sync:characters
```

腳本以英文角色 `id` 對應 `src/roles.json`，覆寫繁中欄位。試算表中有、但專案沒有的 id（例如部分 fabled／實驗角色）會在終端警告並略過。

### CSV 欄位對照

| CSV 欄位 | 對應 roles.json | 說明 |
| --- | --- | --- |
| `id` | `id` | 英文角色鍵（必填，如 `washerwoman`） |
| `name` | `name` | 繁中名稱 |
| `ability` | `ability` | 繁中能力敘述 |
| `firstNightReminder` | `firstNightReminder` | 首夜提醒 |
| `otherNightReminder` | `otherNightReminder` | 其他夜提醒 |
| `reminders` | `reminders` | 以 `\|` 分隔，或 JSON 陣列字串 |
| `remindersGlobal` | `remindersGlobal` | 同上 |

詳見 [`docs/character-sources.md`](docs/character-sources.md)。

## 戰報／復盤

說書人選單 **Help → 戰報／復盤**（或 Live Session 內／快捷鍵 `[B]`）：

- 自動紀錄：指派角色、死亡／復活、提名／處決、提醒、劇本／晝夜切換
- 手動補記：玩家行為／發言摘要（可關聯座位）
- 依日／夜篩選時間軸
- 匯出 JSON 或 Markdown；內容存於 `localStorage`

## npm scripts

| 指令 | 說明 |
| --- | --- |
| `npm start` / `npm run play` | 一鍵 LAN：建置（如需）＋靜態＋WS，並開瀏覽器；執行中可輸入 `restart` / `rebuild` / `quit` |
| `npm run serve` | Vue 開發伺服器 |
| `npm run serve:ws` | 本機 WebSocket（development） |
| `npm run start:ws` | 啟動 WS（Render／雲端用；設 `CLOUD=1`） |
| `npm run build:characters` | 社群試算表 CSV → `characters_zh_TW.csv` |
| `npm run sync:characters` | CSV → roles JSON |
| `npm run sync:official` | 自 botc-release 同步角色／傳奇／奇遇／jinxes（需網路） |
| `npm run sync:script-tool` | 自 [官方劇本工具](https://script.bloodontheclocktower.com/) 更新圖示、簡中→繁中說明與相剋（可用 `--force-icons` / `--overwrite-text`） |
| `npm run build` | 正式建置到 `dist/` |
| `npm run lint` | ESLint |

## 授權與歸因

- 程式碼：GPL-3.0（繼承 bra1n/townsquare）
- Blood on the Clocktower 為 The Pandemonium Institute 商標；角色資料僅供非商業同好使用
- 本專案與集石／官方無附屬關係

## 上游說明

原始 townsquare README 功能說明、自訂劇本／角色 JSON 格式仍適用。若需官方線上版，見 <https://clocktower.online>。
