# 角色資料來源（Character sources）

## 集石魔典（clocktower.gstonegames.com）

- **頁面**：<https://clocktower.gstonegames.com/grimoire/>
- **機制**：Vue SPA，完整角色文案打包在 webpack chunk 內的 `./roles.json`（調查樣本約 **209** 筆簡體中文），非獨立公開下載。
- **API**：未發現公開 roles JSON／REST（曾 probe `oss.gstonegames.com`、站內 `/api/*` → 404）。
- **圖示**：`https://oss.gstonegames.com/data_file/clocktower/role_icon/{slug}.png`
- **同 bundle 模組**：`editions.json`、`fabled.json`、`game.json`、`hatred.json`、`tpi_roles_id_map.json` 等。

證據摘要：`data/raw/_investigation_report.json`；本地留存 `_grimoire_app.js` 等（預設不提交）。

## 本專案（clocktower-grimoire_TW）

- **角色結構**：`npm run sync:official` 自官方 botc-release／本地 `data/raw` 合併（工作樹約 **181** id：玩家＋傳奇＋奇遇）。
- **繁中文案**：社群試算表 [BOTC Translations（TW）](https://docs.google.com/spreadsheets/d/1aAJdqSTafHnw01w-WZ94UPx1Me70Kz-EG1NFfBht2tA/edit?gid=1544433985)（gid `1544433985`）。
- **官方劇本工具**：<https://script.bloodontheclocktower.com/>（與 botc-release 同源；圖示在 `/src/assets/icons/...`）。`npm run sync:script-tool` 會從其 JS bundle 擷取簡中角色／相剋文案並 OpenCC 轉繁，並下載圖示。
- **管線**：
  1. 匯出／更新 `data/raw/community_translations_preview.csv`
  2. `npm run build:characters` → `data/raw/characters_zh_TW.csv`
  3. `npm run sync:characters` → `src/roles.json` + `src/roles.zh_TW.json`
  4. （可選）`npm run sync:script-tool -- --force-icons --overwrite-text` 對齊官方劇本工具文案與圖示

## 覆蓋與落差

| 項目 | 集石 | 本專案 |
| --- | --- | --- |
| 角色 id 數量 | ~209 | ~156（工作樹） |
| 中文來源 | bundle **簡中** | 社群試算表 **繁中** |
| 與集石同步 | 隨站點發版 | **手動** CSV，非即時 |

試算表約 **181** 列；對現有專案 id 幾乎全覆蓋（試算表缺 **mephit**）。多出的試算表 id（fabled／實驗等）在 sync 時以 unknown id 警告略過。

擴充角色集以追上集石 ~209 筆屬後續工作。