# 戰報互動規則盤點

> 由編輯器覆蓋率邏輯與 `roleInputConfig.js` 對照整理。  
> 可重新產生：`node scripts/generate-interaction-inventory.js`

## 摘要

| 狀態 | 說明 |
| --- | --- |
| **complete** | 內建 JSON 含 inputs + effects + 句子（可連動魔典） |
| **inputs-only** | 有規則但無 effects（資訊類） |
| **draft-available** | `roleInputConfig` 有專屬欄位，編輯器可「一鍵建草稿」 |
| **fallback-default-target** | 夜動僅預設「目標對象」，需補 effects 與句子 |
| **passive** | 被動／setup，不顯示夜動能力卡 |

## 內建完整規則（種子）

| 角色 | id | effects |
| --- | --- | --- |
| 小惡魔 | `imp` | 目標死亡（可選） |
| 投毒者 | `poisoner` | 目標中毒（可選） |
| 僧侶 | `monk` | 目標受保護（可選） |
| 洗衣婦 | `washerwoman` | 無（info-only，首夜） |

## 可從 roleInputConfig 建草稿（編輯器「從現有設定建立草稿」）

這些角色在舊版 `roleInputConfig.js` 已有結構化輸入，但尚未寫入 `roleInteractionRules.json`：

- 陰陽師 (`yinyangshi`) — 4 角色選擇
- 洗衣婦／圖書管理員／調查員 (`washerwoman`, `librarian`, `investigator`) — 2 玩家 + 角色
- 築夢師 (`dreamer`) — 玩家 + 善惡角色
- 洗腦師／麻臉巫婆／卡扎力等 (`cerenovus`, `pit-hag`, `kazali`, …) — 玩家 + 角色
- 廚師／共情者／數學家等 (`chef`, `empath`, `mathematician`, …) — 多玩家或數字
- 管家／气球师／将军等 (`steward`, `balloonist`, `general`, …)
- 孟婆 (`mengpo`) — 含選項「失去能力／保留能力並死亡」
- 禁衛軍Ⅱ、街頭風琴手、咖啡師等

## fallback 預設目標（需補 rules）

凡在 `roles.json` 有 `firstNight`／`otherNight`、且不在被動清單、又未列入上方專屬設定的角色，夜序會顯示**僅「目標對象」**的能力卡。  
典型需補 **needs-death** 或 **needs-reminder** 的包括：

- 所有預設 fallback 的惡魔／爪牙夜動（除已寫規則者）
- 其他選目標的善良／外來者夜動

在編輯器左欄會顯示為 **無規則（fallback）** 或 **可建草稿**。

## 被動／無夜動卡片

`roleInputConfig` 對以下類型回傳空陣列（編輯器：**被動**）：

報喪女妖、士兵、鎮長、市長、酒鬼、聖徒、陌客、紅唇女郎、男爵、主謀、畸形秀演員、無神論者、食人族、告密者、落難少女、異端分子、政客、炸彈人、提線木偶、利維坦、維齊爾、乞丐、替罪羊等（見 `roleInputConfig.js` 被動清單）。

## TB 常用角色優先 backlog

| 狀態 | 角色 |
| --- | --- |
| ✅ 已有完整規則 | 小惡魔、投毒者、僧侶、洗衣婦 |
| ⬜ 可建草稿 | 圖書管理員、調查員、築夢師、廚師、共情者、占卜師、掘墓人、守鴉人、獵手 |
| ⬜ fallback 需補 | 間諜、猩紅女郎、男爵、管家、酒鬼、士兵、市長、處女等 |

## 缺口類型（下一批實作）

1. **needs-death** — 暗殺類 → `setDead` + 句子「… → 死亡」
2. **needs-reminder:中毒** — 投毒者類 → `addReminder` 中毒
3. **needs-reminder:保護** — 僧侶類 → `addReminder` 保護
4. **info-only** — 資訊類 → `effects: []`，只優化句子模板
5. **needs-new-effect-type** — 換角色、改身份等（洗腦師、麻臉巫婆）→ 未來擴充 effect 類型
6. **passive** — 編輯器設 `enabled: false` 或空 `inputs`，避免誤出夜動卡

## 使用編輯器盤點流程

1. 選單 **Help → 戰報互動規則**
2. 左欄依徽章篩選：**完整規則**／**可建草稿**／**無規則**
3. 對「可建草稿」角色 → **從現有設定建立草稿** → 在 notes 標 `info-only` 或 `needs-death` 等
4. 右欄預覽句子與 effects → **套用並儲存**（寫入 localStorage overlay）
5. 滿意後 **匯出 JSON** 併入 `roleInteractionRules.json`（正式內建）
