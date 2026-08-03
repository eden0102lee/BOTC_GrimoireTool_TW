# 集石魔典功能對照（Parity Checklist）

對照對象：[集石官方魔典](https://clocktower.gstonegames.com/grimoire/)  
參考 fork：[limpy01/townsquare](https://github.com/limpy01/townsquare)（botcgrimoire.top，繁中 townsquare 優化版）  
底座：[bra1n/townsquare](https://github.com/bra1n/townsquare)（本專案 `clocktower-grimoire_TW`）

狀態圖例：

| 符號 | 含義 |
| --- | --- |
| ✅ | 已具備／與集石線下說書流程等效 |
| ⚠️ | 部分實作或行為與集石不同 |
| ❌ | 集石有、本專案尚未具備 |
| ➕ | 本專案相對集石／上游新增 |

最後更新：2026-07-31（P0：官中角色同步 + 奇遇 Loric）

---

## 說書人線下開局優先序總覽

| 優先 | 類別 | 狀態 | 說明 |
| --- | --- | --- | --- |
| P0 | 座位／角色／提醒／夜序 | ✅ | 核心魔典流程完整 |
| P0 | 提名／投票／處決 | ✅ | 含投票倒數、幽靈票、說書人改票 |
| P0 | 劇本 TB/BMR/S&V + 自訂 JSON | ✅ | 含集石 script tool 連結 |
| P0 | 官中最新角色資料 | ✅ | `npm run sync:official` 對齊 botc-release（約 156 玩家角色）；繁中 CSV／limpy 合併 |
| P0 | 奇遇（Loric）官方角色 | ✅ | 11 個官方奇遇；與傳奇共用魔典區，選單分組 |
| P1 | 獨立計時器 | ❌ | 僅投票倒數，無可拖曳全域計時 |
| P2 | 一鍵預設卡組 | ❌ | 集石「精品預設」快速配板 |
| P2 | `_meta` 自訂夜序／bootlegger | ❌ | limpy01 文件有、本專案未實作 |
| P2 | 復盤圖片／海報匯出 | ❌ | 本專案改以戰報 JSON/Markdown |
| P3 | 雲端帳號／群聊／語音／頭像 | ❌ | 集石生態功能，線下 ST 非必需 |

---

## ✅ 已具備／parity

### 座位／玩家管理

| 功能 | 備註 |
| --- | --- |
| 新增座位 `[A]` | 選單 → 玩家，上限 20 |
| 改名 | 點玩家名稱 |
| 死亡／復活 | 點 shroud／life |
| 投票權（無票／幽靈票） | `isVoteless`、死亡後可標記 |
| 旅行者 | `team=traveler`，流放投票規則 |
| 座位交換／移動 | 玩家右鍵選單 |
| 隨機座位 | 選單 → 玩家 → 隨機座位 |
| 清空／移除玩家 | 含確認對話框 |

### 角色指派

| 功能 | 備註 |
| --- | --- |
| 手動指派 | 點 token → 角色 modal |
| 隨機指派 | RolesModal（選單 → 角色），依 `game.json` 陣容比例；**無快捷鍵**（集石 `[C]` 保留給創建小鎮） |
| 惡魔偽裝（3 格） | bluffs 區塊 |
| setup 角色警示 | 酒鬼／男爵等 `setup: true` 三角警告 |
| 允許重複角色 | RolesModal 勾選 |
| 傳奇角色 `[F]` | FabledModal + 場上 fabled 區 |
| 移除全部角色 | 選單 → 角色 |

### 提醒標記

| 功能 | 備註 |
| --- | --- |
| 角色提醒 | ReminderModal，依已指派／bluff 角色 |
| 全域提醒 `remindersGlobal` | 自訂 JSON 支援 |
| 自訂備註 | prompt 新增文字提醒 |
| 自訂角色圖示 | 魔典選單「允許自訂圖示」 |

### 提名／投票／處決

| 功能 | 備註 |
| --- | --- |
| 提名 | 玩家右鍵 → 提名 |
| 投票倒數 | Vote.vue 3-2-1 + 音效 |
| 逐票鎖定／改票 | 說書人可 override（`fromST`）；集石「改票」等效 |
| 處決／流放標記 | mark execution；旅行者過半數規則 |
| 投票紀錄 `[V]` | VoteHistoryModal，可開放玩家查看 |
| Live 投票同步 | WebSocket session |

### 參考表

| 功能 | 備註 |
| --- | --- |
| 角色能力表 `[R]` | ReferenceModal，含相剋 jinxes |
| 夜間順序表 `[N]` | NightOrderModal，含爪牙／惡魔資訊步驟 |
| 場上夜序數字 | `grimoire.isNightOrder` 疊加在 token 旁 |

### 劇本／版本

| 功能 | 備註 |
| --- | --- |
| TB／BMR／S&V／LUF | EditionModal，繁中劇本名 |
| 自訂 JSON 上傳／URL／剪貼簿 | 相容官方 Script Tool 與[集石 script tool](https://clocktower.gstonegames.com/script_tool/) |
| `_meta` 劇本名／作者／logo | parseRoles 寫入 edition |
| 熱門自訂劇本連結 | EditionModal 內建 gist 列表 |

### Live Session（LAN）

| 功能 | 備註 |
| --- | --- |
| 建立房間 | 選單 → 連線 → **創建小鎮 `[C]`** |
| 加入 | URL `#房間碼` 或 **`[J]`** 加入小鎮 |
| 複製玩家／LAN 連結 | copyLanUrl / copySessionUrl |
| 佔位 claim seat | 玩家點座位，左下角 chair 圖示 |
| 發送角色 | distributeRoles → 同步至已佔位玩家；惡魔一併收到惡魔偽裝；玩家端不套用 `[H]` 投影隱藏，發送後僅自己的座位顯示角色 |
| 延遲顯示 | ping ms |
| 遊戲狀態 JSON | GameStateModal 複製／載入 |

### 其他 townsquare 基底

| 功能 | 備註 |
| --- | --- |
| 背景圖（含 mp4/webm） | 自訂 URL |
| 縮放 | 選單 +/- |
| 關閉動畫／靜音 | 選單 |
| Discord／GitHub 連結 | Help 分頁 |

---

## ⚠️ 部分實作／行為不同

### 晝夜／階段

| 項目 | 集石 | 本專案 |
| --- | --- | --- |
| 切換方式 | `[Q]` 晝夜二元切換（進入白天） | `[Q]` 推進細粒度階段（標籤對齊集石「進入白天」）；`[S]` 退回僅本專案 |
| 階段粒度 | 日／夜 | 第0夜 → 清晨 → 私聊 → 公聊 → 投票 → 黃昏 → 第N夜… |
| 玩家端同步 | 雲端同步 | 僅 `isNight` 經 WebSocket 同步；細階段與戰報為說書人本機 |

### 魔典／公開顯示

| 項目 | 集石／上游 | 本專案 |
| --- | --- | --- |
| 視圖 | 集石：單一魔典布局 | ✅ 單一魔典布局（已移除上游 `[G]` 魔典↔城鎮廣場） |
| 投影隱藏 | 集石無獨立切換 | ➕ 選單／`[H]`「隱藏角色」（`rolesHidden`）：翻轉 token、隱藏提醒／夜序／bluff |
| 頁面標題 | Grimoire | ✅ 固定「魔典」 |

### 角色資料（i18n）

| 項目 | 集石 | 本專案 |
| --- | --- | --- |
| 官中角色名／能力 | 內嵌簡中 roles.json（約 209 id），bundle 更新 | ✅ 社群 [BOTC Translations（TW）](https://docs.google.com/spreadsheets/d/1aAJdqSTafHnw01w-WZ94UPx1Me70Kz-EG1NFfBht2tA/edit?gid=1544433985) → `characters_zh_TW.csv` → `npm run sync:characters`；現有 id 幾乎皆有繁中（試算表缺 **mephit**）。**非**與集石即時同步 |
| 夜間提醒文案 | 簡中 | ✅ 試算表有 `firstNightReminder`／`otherNightReminder` 時已寫入繁中；未覆蓋 id 或試算表缺欄仍可能為英文 |
| 角色數量 | 200+（內嵌 ~209） | 本工作樹約 **156** id（bra1n 主線 ~130＋官方擴充）；集石 ~209。擴充至集石規模屬後續工作 |

### 劇本進階 JSON

| 項目 | limpy01／集石文件 | 本專案 |
| --- | --- | --- |
| `_meta.firstNight` / `otherNight` 陣列 | 改寫整局夜序 | ❌ 未解析；NightOrderModal 僅用角色 `firstNight` 數值排序 |
| `_meta.bootlegger` | 私貨商人奇遇規則字串 | ⚠️ 奇遇角色「私貨商人」已可加入魔典；劇本 `_meta.bootlegger` 陣列文案尚未解析顯示 |
| 自訂 `jinxes` | 原創角色相剋 | ⚠️ 僅內建 `hatred.json`，自訂 JSON jinxes 未合併 |

### 驗證

| 項目 | 集石 | 本專案 |
| --- | --- | --- |
| 玩家人數 vs 陣容 | 可能有提示 | ⚠️ RolesModal 顯示各 team 比例，但不阻擋錯誤人數開局 |
| setup 角色（酒鬼／提線偶） | 可能有配板檢查 | ⚠️ 僅警告「隨機指派不會處理 setup」；無自動酒鬼／marionette 流程 |
| 自訂角色缺失 | 加入前提示 | ✅ socket 提示 missing roles |

### 計時

| 項目 | 集石 | 本專案 |
| --- | --- | --- |
| 可拖曳計時器 | 獨立工具，控場用 | ⚠️ 僅 Vote 提名時 per-player 倒數（可調秒數） |

### Live Session 基礎設施

| 項目 | 集石 | 本專案 |
| --- | --- | --- |
| 伺服器 | 集石雲端 | ⚠️ 本機 LAN WebSocket（`npm run play`） |
| 建立房間快捷鍵 | 集石 `[C]` 創建小鎮 | ✅ `[C]` 創建小鎮（對齊集石） |
| 小程序／App | 有 | ❌ 僅 Web |

### UI

| 項目 | 集石 | 本專案 |
| --- | --- | --- |
| 視覺風格 | 集石官方美術 | ⚠️ townsquare 風格 |
| 快捷鍵面板 | 無 | ➕ ShortcutPanel（左側）；**集石六鍵** + 本專案擴充分區 |
| 選單結構 | 分頁：魔典／連線／玩家／角色／說明 | ✅ 五分頁；集石六鍵分散於魔典／連線／說明 |

### 復盤

| 項目 | 集石 | 本專案 |
| --- | --- | --- |
| 局後紀錄 | 詳細紀錄 + 生成用戶海報 | ⚠️ 戰報 JSON/Markdown（➕），無圖片海報 |

---

## ❌ 集石有、本專案缺失

依**線下說書人**重要性排序。

### P0 — 角色資料與奇遇

| 功能 | 集石說明 | 本專案 |
| --- | --- | --- |
| 官中最新角色資料 | 官方維護、持續更新（200+ 角色） | ✅ `npm run sync:official` 自 botc-release 合併；繁中靠 CSV + limpy；約 156 玩家角色 + 14 傳奇 + 11 奇遇 |
| 奇遇（Loric）官方角色 | 園丁、私貨商人、暴風捕手等 | ✅ `loric.json`；選單「新增傳奇／奇遇」分組；與傳奇同魔典槽位 |

> 仍非集石雲端即時推送；更新時執行 `npm run sync:official`（離線可用 `node scripts/merge-official-offline.js`）。

### P1 — 配板與工具

| 功能 | 集石說明 | 影響 |
| --- | --- | --- |
| 獨立可拖曳計時器 | 說書人控時（發言、私聊等） | 僅投票倒數，私聊／公聊需外掛計時 |
| `_meta` 自訂夜序 | JSON 覆寫 firstNight/otherNight 順序 | 複雜 homebrew 夜序可能與魔典不符 |
| bootlegger（私貨商人） | 劇本 `_meta.bootlegger` 奇遇規則字串 | 奇遇 token 已有；`_meta.bootlegger` 文案顯示仍缺 |

### P2 — 資料與生態

| 功能 | 說明 |
| --- | --- |
| 一鍵預設卡組 | 點名稱代入精品預設角色組合；臨時開局需手動選單指派角色 |
| 角色百科／Wiki | 集石規劃中的百科查詢 |
| 復盤圖片／「生成用戶海報」 | 局後分享用圖，非 JSON |
| 集石帳號／雲端存檔 | 跨裝置、戰報上雲 |
| 微信小程序／App | 行動端原生入口 |

### P3 — 連線社交（線下 ST 通常用語音軟體）

| 功能 | 說明 |
| --- | --- |
| 說書人私聊 | 玩家 ↔ ST 一對一文字 |
| 群聊 | 房間內聊天 |
| 語音整合 | 魔典需搭配騰訊會議等（非內建） |
| 玩家頭像 | 個人化顯示 |

### 鍵盤快捷鍵

| 快捷鍵 | 集石官方 | 本專案 |
| --- | --- | --- |
| `[A]` | 添加座位 | ✅ 添加座位 |
| `[C]` | 創建小鎮 | ✅ 創建小鎮（host session） |
| `[J]` | 加入小鎮 | ✅ 加入小鎮 |
| `[Q]` | 進入白天 | ✅ 進入白天（推進階段；細粒度為本專案擴充） |
| `[R]` | 角色能力表 | ✅ 角色能力表 |
| `[N]` | 夜晚順序表 | ✅ 夜晚順序表 |
| `[G]` | 魔典↔城鎮廣場（上游） | ❌ 已移除（對齊集石單一魔典） |
| `[H]` | — | ➕ 隱藏角色（投影） |
| 分配角色 | 選單操作 | ⚠️ 選單 → 角色（無快捷鍵） |
| 複製連結 | — | ❌ 無快捷鍵 |

**本專案擴充快捷鍵**（集石無）：`[H]` 隱藏角色、`[S]` 上一階段、`[B]` 戰報、`[E]` 劇本、`[V]` 投票紀錄、`[F]` 傳奇角色、`Esc` 關閉視窗。

---

## ➕ 本專案新增（集石無或明顯不同）

| 功能 | 說明 |
| --- | --- |
| **戰報／復盤 `[B]`** | 自動紀錄角色／死亡／提名／提醒／劇本／隱藏角色；手動筆記；依日／夜／階段篩選；JSON／Markdown 匯出；`localStorage` 持久化 |
| **細粒度階段追蹤** | PhaseTracker：清晨／私聊／公聊／投票／黃昏／黑夜；`[Q]`/`[S]` 推進／退回 |
| **隱藏角色 `[H]`** | 選單 → 魔典；投影用公開畫面（`rolesHidden`） |
| **繁中 UI** | `src/i18n/zh_TW.js` 全面覆蓋選單／modal／投票／prompt |
| **CSV 角色同步** | `npm run sync:characters` → `roles.json` + `roles.zh_TW.json` overlay |
| **官方角色同步** | `npm run sync:official` → botc-release 角色／傳奇／奇遇／jinxes |
| **奇遇（Loric）** | 園丁、私貨商人、暴風捕手等 11 個；與傳奇同區顯示 |
| **本機 LAN 一鍵開服** | `npm run play`（build + 靜態 HTTP + WS）；`/api/host-info` 顯示 LAN IP |
| **快捷鍵面板** | 左側 ShortcutPanel，可收合 |
| **夜序／惡魔資訊繁中提醒** | NightOrderModal 爪牙／惡魔步驟繁中 template |

---

## 說書人線下開局必用路徑（本專案）

1. `npm run serve` 或 `npm run play`
2. 選劇本 `[E]` → 新增座位 `[A]` → 選單 → 角色 → 選擇並指派
3. `[H]` 隱藏角色（投影）；`[Q]`／`[S]` 推進階段；提醒標記；夜序 `[N]`
4. （可選）`[C]` 創建小鎮 → 玩家 `[J]` 加入 → 發送角色 → 提名投票
5. （可選）戰報 `[B]` 匯出復盤

## 與 limpy01 fork 差異摘要

| 項目 | limpy01 | 本專案 |
| --- | --- | --- |
| `_meta` 夜序／bootlegger | 文件標示支援 | 未實作 |
| 原創角色 jinxes | JSON `jinxes` 欄位 | 僅靜態 hatred.json |
| 細階段／戰報 | 無 | ➕ 有 |
| LAN 開服腳本 | 無 | ➕ `npm run play` |
| 授權 | GPLv3 + 第7條附加 | GPLv3（bra1n 底座） |

---

## 已知文件不一致

（無 — 2026-07-31 已對齊集石單一魔典布局，移除 `[G]` 雙視圖）
