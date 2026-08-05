# 官方角色技能資訊卡（SNV）

> 自動產生：`node scripts/export-official-skill-cards.js <edition>`  
> 更新：2026-08-05  
> **請直接改各角色欄位後整檔覆蓋**；留空表示不確定。

## 審核後套用

1. 改完 `docs/official-skill-cards-<edition>.md` 後整檔覆蓋。
2. TB 版執行 `node scripts/apply-tb-skill-cards-to-rules.js` 寫入 `roleInteractionRules.json`。
3. 例句可改 `docs/official-sentence-edit-tb.md`（或審核版 `official-sentence-review-*.md`）。
4. 重新匯出：`npm run export:skill-cards -- all`、`npm run export:sentence-examples -- all`。

## 代碼說明

### 時機（可多個，逗號分隔）

| 代碼 | 含義 |
| --- | --- |
| `setup` | 設置階段影響設置 |
| `once` | 一次性（整局或該情境一次） |
| `firstOnly` | 僅首夜 |
| `everyNight` | 每個夜晚（含首夜） |
| `fromNight2` | 次夜開始每個夜晚（夜晚*） |
| `trigger` | 條件滿足觸發（請填「觸發」欄） |

### 影響（可多個）

| 代碼 | 含義 |
| --- | --- |
| `life` | 生死（死亡／復活） |
| `role` | 角色變化 |
| `alignment` | 陣營變化 |
| `status` | 狀態（醉酒／中毒／瘋狂） |
| `info` | 獲得／告知資訊 |
| `special` | 特殊狀態（保護／票數／主人…） |

### 對象

`self` / `other` / `both`

### 例句

- 短動詞（預設「選擇」）+ 對象  
- 結果另起一行 `└ …`  
- 無戰報寫 `(無)`

---
共 **30** 名角色。

### savant | 博學者

- team: `townsfolk`
- 能力: 每個白天，你可以私下詢問說書人以得知兩條信息：一個是正確的，一個是錯誤的。
- 規則: enabled=(無規則)
- 時機: (請填)
- 影響: (請填)
- 對象: (請填)
- 觸發: (無)
- 動詞: 選擇
- 輸入: (無)
- effects: (無)
- template: ``
- 例句:

```
(無)
```
- 備註: 

### towncrier | 城鎮公告員

- team: `townsfolk`
- 能力: 每個夜晚*，你會得知在今天白天時是否有爪牙發起過提名。
- 規則: enabled=是
- 時機: fromNight2
- 影響: special, info
- 對象: (請填)
- 觸發: (無)
- 動詞: 得知
- 輸入: select:res(結果)
- effects: 自身 爪牙提名、自身 爪牙未提名
- template: `{actor} → {action} → {res}`
- 例句:

```
（請依規則補例句；action=得知）
```
- 備註: sheet:https://docs.google.com/spreadsheets/d/1RyPinE2xfHcllNpQ60pPSShaRAkmXHqv2ikxPRAjvdg/edit?gid=1544433985

### klutz | 呆瓜

- team: `outsider`
- 能力: 當你得知你死亡時，你要公開選擇一名存活的玩家：如果他是邪惡的，你的陣營落敗。
- 規則: enabled=(無規則)
- 時機: (請填)
- 影響: (請填)
- 對象: (請填)
- 觸發: (無)
- 動詞: 選擇
- 輸入: (無)
- effects: (無)
- template: ``
- 例句:

```
(無)
```
- 備註: 

### fanggu | 方古

- team: `demon`
- 能力: 每個夜晚*，你要選擇一名玩家：他死亡。被該能力殺死的外來者改為變成邪惡的方古且你代替他死亡，但每局遊戲僅能成功轉化一次。[+1外來者]
- 規則: enabled=是
- 時機: setup, fromNight2
- 影響: life, special
- 對象: (請填)
- 觸發: (無)
- 動詞: 殺害
- 輸入: player:target(目標對象)
- effects: 目標死亡、目標掛死亡標記、目標對象 第一位外來者
- template: `{actor} → {action} → 選擇 {target} → {target} 死亡`
- 例句:

```
（請依規則補例句；action=殺害）
```
- 備註: sheet:https://docs.google.com/spreadsheets/d/1RyPinE2xfHcllNpQ60pPSShaRAkmXHqv2ikxPRAjvdg/edit?gid=1544433985

### deviant | 怪咖

- team: `traveler`
- 能力: 如果你表現得很有趣，當天你不能被流放。
- 規則: enabled=(無規則)
- 時機: (請填)
- 影響: (請填)
- 對象: (請填)
- 觸發: (無)
- 動詞: 選擇
- 輸入: (無)
- effects: (無)
- template: ``
- 例句:

```
(無)
```
- 備註: 

### mutant | 畸形秀演員

- team: `outsider`
- 能力: 如果你“瘋狂”地證明自己是外來者，你可能被處決。
- 規則: enabled=(無規則)
- 時機: (請填)
- 影響: (請填)
- 對象: (請填)
- 觸發: (無)
- 動詞: 選擇
- 輸入: (無)
- effects: (無)
- template: ``
- 例句:

```
(無)
```
- 備註: 

### bonecollector | 集骨者

- team: `traveler`
- 能力: 每局遊戲限一次，在夜晚時*，你可以選擇一名死亡的玩家：他重新獲得能力直到下個黃昏。
- 規則: enabled=是
- 時機: fromNight2
- 影響: special
- 對象: (請填)
- 觸發: (無)
- 動詞: 殺害
- 輸入: player:target(目標對象)
- effects: 目標對象 具有能力
- template: `{actor} → {action} → 選擇 {target} → {target} 死亡`
- 例句:

```
（請依規則補例句；action=殺害）
```
- 備註: sheet:https://docs.google.com/spreadsheets/d/1RyPinE2xfHcllNpQ60pPSShaRAkmXHqv2ikxPRAjvdg/edit?gid=1544433985

### eviltwin | 鏡像雙子

- team: `minion`
- 能力: 你與一名對立陣營的玩家互相知道對方是什麼角色。如果其中善良玩家被處決，邪惡陣營獲勝。如果你們都存活，善良陣營無法獲勝。
- 規則: enabled=是
- 時機: firstOnly
- 影響: (請填)
- 對象: (請填)
- 觸發: (無)
- 動詞: 選擇
- 輸入: player:p1(玩家 1), player:p2(玩家 2)
- effects: (無)
- template: `{actor} → {action} → {p1} & {p2}`
- 例句:

```
（請依規則補例句；action=選擇）
```
- 備註: sheet:https://docs.google.com/spreadsheets/d/1RyPinE2xfHcllNpQ60pPSShaRAkmXHqv2ikxPRAjvdg/edit?gid=1544433985

### barista | 咖啡師

- team: `traveler`
- 能力: 每個夜晚，直至下個黃昏，由說書人二選一：1）一名玩家解除並免受醉酒和中毒影響，且會得知正確信息；2）一名玩家的能力可以生效兩次。該玩家會得知是哪個效果。
- 規則: enabled=是
- 時機: everyNight
- 影響: special, info
- 對象: (請填)
- 觸發: (無)
- 動詞: 得知
- 輸入: player:p1(目標玩家), select:res(附加效果)
- effects: 目標玩家 清醒&健康、目標玩家 能力x2
- template: `{actor} → {action} → {p1} / {res}`
- 例句:

```
（請依規則補例句；action=得知）
```
- 備註: sheet:https://docs.google.com/spreadsheets/d/1RyPinE2xfHcllNpQ60pPSShaRAkmXHqv2ikxPRAjvdg/edit?gid=1544433985

### barber | 理髮師

- team: `outsider`
- 能力: 如果你死亡，在當晚惡魔可以選擇兩名玩家（不能選擇其他惡魔）交換角色。
- 規則: enabled=是
- 時機: fromNight2
- 影響: special
- 對象: (請填)
- 觸發: (無)
- 動詞: 選擇
- 輸入: player:p1(玩家 1), player:p2(玩家 2)
- effects: 玩家 1 今晚剪頭髮
- template: `{actor} → {action} → {p1} & {p2}`
- 例句:

```
（請依規則補例句；action=選擇）
```
- 備註: sheet:https://docs.google.com/spreadsheets/d/1RyPinE2xfHcllNpQ60pPSShaRAkmXHqv2ikxPRAjvdg/edit?gid=1544433985

### harlot | 流鶯

- team: `traveler`
- 能力: 每個夜晚*，你要選擇一名存活的玩家：如果他同意，你會得知他的角色，但是你們兩個可能同時死亡。
- 規則: enabled=是
- 時機: fromNight2
- 影響: life, info
- 對象: (請填)
- 觸發: (無)
- 動詞: 得知
- 輸入: player:target(目標對象)
- effects: 目標死亡、目標掛死亡標記
- template: `{actor} → {action} → 選擇 {target} → {target} 死亡`
- 例句:

```
（請依規則補例句；action=得知）
```
- 備註: sheet:https://docs.google.com/spreadsheets/d/1RyPinE2xfHcllNpQ60pPSShaRAkmXHqv2ikxPRAjvdg/edit?gid=1544433985

### pithag | 麻臉巫婆

- team: `minion`
- 能力: 每個夜晚*，你要選擇一名玩家和一個角色，如果該角色不在場，他變成該角色。如果因此創造了一個惡魔，當晚的死亡由說書人決定。
- 規則: enabled=是
- 時機: fromNight2
- 影響: life
- 對象: (請填)
- 觸發: (無)
- 動詞: 殺害
- 輸入: player:p1(目標玩家), role:r1(對應角色)
- effects: 目標死亡
- template: `{actor} → {action} → {p1} → {r1}`
- 例句:

```
（請依規則補例句；action=殺害）
```
- 備註: sheet:https://docs.google.com/spreadsheets/d/1RyPinE2xfHcllNpQ60pPSShaRAkmXHqv2ikxPRAjvdg/edit?gid=1544433985

### flowergirl | 賣花女孩

- team: `townsfolk`
- 能力: 每個夜晚*，你會得知在今天白天時是否有惡魔投過票。
- 規則: enabled=是
- 時機: fromNight2
- 影響: special, info
- 對象: (請填)
- 觸發: (無)
- 動詞: 得知
- 輸入: select:res(結果)
- effects: 自身 惡魔投票、自身 惡魔未投票
- template: `{actor} → {action} → {res}`
- 例句:

```
（請依規則補例句；action=得知）
```
- 備註: sheet:https://docs.google.com/spreadsheets/d/1RyPinE2xfHcllNpQ60pPSShaRAkmXHqv2ikxPRAjvdg/edit?gid=1544433985

### seamstress | 女裁縫

- team: `townsfolk`
- 能力: 每局遊戲限一次，在夜晚時，你可以選擇除你以外的兩名玩家：你會得知他們是否為同一陣營。
- 規則: enabled=是
- 時機: everyNight
- 影響: info
- 對象: (請填)
- 觸發: (無)
- 動詞: 得知
- 輸入: player:p1(玩家 1), player:p2(玩家 2), select:res(結果判斷)
- effects: (無)
- template: `{actor} → {action} → {p1} & {p2} → {res}`
- 例句:

```
（請依規則補例句；action=得知）
```
- 備註: sheet:https://docs.google.com/spreadsheets/d/1RyPinE2xfHcllNpQ60pPSShaRAkmXHqv2ikxPRAjvdg/edit?gid=1544433985

### witch | 女巫

- team: `minion`
- 能力: 每個夜晚，你要選擇一名玩家：如果他明天白天發起提名，他死亡。如果只有三名存活的玩家，你失去此能力。
- 規則: enabled=是
- 時機: everyNight
- 影響: special
- 對象: (請填)
- 觸發: (無)
- 動詞: 殺害
- 輸入: player:target(目標對象)
- effects: 目標對象 詛咒
- template: `{actor} → {action} → 選擇 {target} → {target} 死亡`
- 例句:

```
（請依規則補例句；action=殺害）
```
- 備註: sheet:https://docs.google.com/spreadsheets/d/1RyPinE2xfHcllNpQ60pPSShaRAkmXHqv2ikxPRAjvdg/edit?gid=1544433985

### nodashii | 諾-達鯴

- team: `demon`
- 能力: 每個夜晚*，你要選擇一名玩家：他死亡。與你鄰近的兩名鎮民中毒。
- 規則: enabled=是
- 時機: fromNight2
- 影響: life, status
- 對象: (請填)
- 觸發: (無)
- 動詞: 投毒
- 輸入: player:target(目標對象)
- effects: 目標死亡、目標對象 中毒、目標掛死亡標記
- template: `{actor} → {action} → 選擇 {target} → {target} 死亡`
- 例句:

```
（請依規則補例句；action=投毒）
```
- 備註: sheet:https://docs.google.com/spreadsheets/d/1RyPinE2xfHcllNpQ60pPSShaRAkmXHqv2ikxPRAjvdg/edit?gid=1544433985

### oracle | 神諭者

- team: `townsfolk`
- 能力: 每個夜晚*，你會得知有多少名死亡的玩家是邪惡的。
- 規則: enabled=是
- 時機: fromNight2
- 影響: info
- 對象: (請填)
- 觸發: (無)
- 動詞: 得知
- 輸入: number:num(得知數字)
- effects: (無)
- template: `{actor} → {action} → {num}`
- 例句:

```
（請依規則補例句；action=得知）
```
- 備註: sheet:https://docs.google.com/spreadsheets/d/1RyPinE2xfHcllNpQ60pPSShaRAkmXHqv2ikxPRAjvdg/edit?gid=1544433985

### mathematician | 數學家

- team: `townsfolk`
- 能力: 每個夜晚，你會得知有多少名玩家的能力因為其他角色的能力而未正常生效。（從上個黎明到你被喚醒時）
- 規則: enabled=是
- 時機: everyNight
- 影響: special, info
- 對象: (請填)
- 觸發: (無)
- 動詞: 得知
- 輸入: number:num(得知數字)
- effects: 自身 異常
- template: `{actor} → {action} → {num}`
- 例句:

```
（請依規則補例句；action=得知）
```
- 備註: sheet:https://docs.google.com/spreadsheets/d/1RyPinE2xfHcllNpQ60pPSShaRAkmXHqv2ikxPRAjvdg/edit?gid=1544433985

### butcher | 屠夫

- team: `traveler`
- 能力: 每個白天，首次處決後，你可以再次發起提名。
- 規則: enabled=(無規則)
- 時機: (請填)
- 影響: (請填)
- 對象: (請填)
- 觸發: (無)
- 動詞: 選擇
- 輸入: (無)
- effects: (無)
- template: ``
- 例句:

```
(無)
```
- 備註: 

### vigormortis | 亡骨魔

- team: `demon`
- 能力: 每個夜晚*，你要選擇一名玩家：他死亡。被你殺死的爪牙保留他的能力，且與他鄰近的兩名鎮民之一中毒。[-1外來者]
- 規則: enabled=是
- 時機: setup, fromNight2
- 影響: life, status, special
- 對象: (請填)
- 觸發: (無)
- 動詞: 投毒
- 輸入: player:target(目標對象)
- effects: 目標死亡、目標對象 中毒、目標對象 具有能力、目標掛死亡標記
- template: `{actor} → {action} → 選擇 {target} → {target} 死亡`
- 例句:

```
（請依規則補例句；action=投毒）
```
- 備註: sheet:https://docs.google.com/spreadsheets/d/1RyPinE2xfHcllNpQ60pPSShaRAkmXHqv2ikxPRAjvdg/edit?gid=1544433985

### vortox | 渦流

- team: `demon`
- 能力: 每個夜晚*，你要選擇一名玩家：他死亡。鎮民玩家的能力都會產生錯誤信息。如果白天沒人被處決，邪惡陣營獲勝。
- 規則: enabled=是
- 時機: fromNight2
- 影響: life
- 對象: (請填)
- 觸發: (無)
- 動詞: 殺害
- 輸入: player:target(目標對象)
- effects: 目標死亡、目標掛死亡標記
- template: `{actor} → {action} → 選擇 {target} → {target} 死亡`
- 例句:

```
（請依規則補例句；action=殺害）
```
- 備註: sheet:https://docs.google.com/spreadsheets/d/1RyPinE2xfHcllNpQ60pPSShaRAkmXHqv2ikxPRAjvdg/edit?gid=1544433985

### snakecharmer | 舞蛇人

- team: `townsfolk`
- 能力: 每個夜晚，你要選擇一名存活的玩家：如果你選中了惡魔，你和他交換角色和陣營，然後他中毒。
- 規則: enabled=是
- 時機: everyNight
- 影響: status
- 對象: (請填)
- 觸發: (無)
- 動詞: 投毒
- 輸入: player:target(目標對象)
- effects: 目標對象 中毒
- template: `{actor} → {action} → 選擇 {target} → {target} 中毒`
- 例句:

```
（請依規則補例句；action=投毒）
```
- 備註: sheet:https://docs.google.com/spreadsheets/d/1RyPinE2xfHcllNpQ60pPSShaRAkmXHqv2ikxPRAjvdg/edit?gid=1544433985

### cerenovus | 洗腦師

- team: `minion`
- 能力: 每個夜晚，你要選擇一名玩家和一個善良角色。他明天白天和夜晚需要“瘋狂”地證明自己是這個角色，不然他可能被處決。
- 規則: enabled=是
- 時機: everyNight
- 影響: status
- 對象: (請填)
- 觸發: (無)
- 動詞: 選擇
- 輸入: player:p1(目標玩家), role:r1(對應角色)
- effects: 目標玩家 瘋狂
- template: `{actor} → {action} → {p1} → {r1}`
- 例句:

```
（請依規則補例句；action=選擇）
```
- 備註: sheet:https://docs.google.com/spreadsheets/d/1RyPinE2xfHcllNpQ60pPSShaRAkmXHqv2ikxPRAjvdg/edit?gid=1544433985

### sage | 賢者

- team: `townsfolk`
- 能力: 如果惡魔殺死了你，在當晚你會被喚醒並得知兩名玩家，其中一名是殺死你的那個惡魔。
- 規則: enabled=是
- 時機: fromNight2
- 影響: info
- 對象: (請填)
- 觸發: (無)
- 動詞: 得知
- 輸入: player:target(目標對象)
- effects: (無)
- template: `{actor} → {action} → 選擇 {target}`
- 例句:

```
（請依規則補例句；action=得知）
```
- 備註: sheet:https://docs.google.com/spreadsheets/d/1RyPinE2xfHcllNpQ60pPSShaRAkmXHqv2ikxPRAjvdg/edit?gid=1544433985

### sweetheart | 心上人

- team: `outsider`
- 能力: 當你死亡時，會有一名玩家開始醉酒。
- 規則: enabled=是
- 時機: fromNight2
- 影響: status
- 對象: (請填)
- 觸發: (無)
- 動詞: 選擇
- 輸入: (無)
- effects: 自身 醉酒
- template: `{actor} → {action}`
- 例句:

```
（請依規則補例句；action=選擇）
```
- 備註: passive — 試算表/被動，無輸入卡

### artist | 藝術家

- team: `townsfolk`
- 能力: 每局遊戲限一次，在白天時，你可以私下詢問說書人一個是非問題，你會得知該問題的答案。
- 規則: enabled=(無規則)
- 時機: (請填)
- 影響: (請填)
- 對象: (請填)
- 觸發: (無)
- 動詞: 選擇
- 輸入: (無)
- effects: (無)
- template: ``
- 例句:

```
(無)
```
- 備註: 

### juggler | 雜耍藝人

- team: `townsfolk`
- 能力: 在你的首個白天，你可以公開猜測任意玩家的角色最多五次。在當晚，你會得知猜測正確的角色數量。
- 規則: enabled=是
- 時機: fromNight2
- 影響: special, info
- 對象: (請填)
- 觸發: (無)
- 動詞: 得知
- 輸入: number:num(得知數字)
- effects: 自身 正確
- template: `{actor} → {action} → {num}`
- 例句:

```
（請依規則補例句；action=得知）
```
- 備註: sheet:https://docs.google.com/spreadsheets/d/1RyPinE2xfHcllNpQ60pPSShaRAkmXHqv2ikxPRAjvdg/edit?gid=1544433985

### philosopher | 哲學家

- team: `townsfolk`
- 能力: 每局遊戲限一次，在夜晚時，你可以選擇一個善良角色：你獲得該角色的能力。如果這個角色在場，他醉酒。
- 規則: enabled=是
- 時機: everyNight
- 影響: status, special
- 對象: (請填)
- 觸發: (無)
- 動詞: 選擇
- 輸入: player:target(目標對象)
- effects: 目標對象 是哲學家、目標對象 醉酒、目標對象 Drunk、目標對象 Is the Philosopher
- template: `{actor} → {action} → 選擇 {target} → {target} 醉酒`
- 例句:

```
（請依規則補例句；action=選擇）
```
- 備註: sheet:https://docs.google.com/spreadsheets/d/1RyPinE2xfHcllNpQ60pPSShaRAkmXHqv2ikxPRAjvdg/edit?gid=1544433985

### clockmaker | 鐘錶匠

- team: `townsfolk`
- 能力: 在你的首個夜晚，你會得知惡魔與爪牙之間最近的距離。
- 規則: enabled=是
- 時機: firstOnly
- 影響: info
- 對象: (請填)
- 觸發: (無)
- 動詞: 得知
- 輸入: number:num(得知數字)
- effects: (無)
- template: `{actor} → {action} → {num}`
- 例句:

```
（請依規則補例句；action=得知）
```
- 備註: sheet:https://docs.google.com/spreadsheets/d/1RyPinE2xfHcllNpQ60pPSShaRAkmXHqv2ikxPRAjvdg/edit?gid=1544433985

### dreamer | 築夢師

- team: `townsfolk`
- 能力: 每個夜晚，你要選擇除你及旅行者以外的一名玩家：你會得知一個善良角色和一個邪惡角色，該玩家是其中一個角色。
- 規則: enabled=是
- 時機: everyNight
- 影響: info
- 對象: (請填)
- 觸發: (無)
- 動詞: 得知
- 輸入: otherPlayer:p1(目標玩家), role:r1(善良角色), role:r2(邪惡角色)
- effects: (無)
- template: `{actor} → {action} → {p1} → {r1} / {r2}`
- 例句:

```
（請依規則補例句；action=得知）
```
- 備註: sheet:https://docs.google.com/spreadsheets/d/1RyPinE2xfHcllNpQ60pPSShaRAkmXHqv2ikxPRAjvdg/edit?gid=1544433985

