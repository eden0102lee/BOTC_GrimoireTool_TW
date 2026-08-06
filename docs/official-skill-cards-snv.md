# 官方角色技能資訊卡（SNV）

> 自動產生：`node scripts/export-official-skill-cards.js <edition>`  
> 更新：2026-08-05  
> **請直接改各角色欄位後整檔覆蓋**；留空表示不確定。

## 審核後套用

1. 改完 `docs/official-skill-cards-<edition>.md` 後整檔覆蓋（規則欄位與例句皆在此檔）。
2. 執行 `npm run apply:skill-cards` 寫入 `roleInteractionRules.json`（戰報互動）。
3. 重新匯出（可選）：`npm run export:skill-cards -- all`（會依 JSON+OVERRIDES 覆寫 md，手改例句請先備份）。

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
- 時機: trigger
- 影響: info
- 對象: self
- 觸發: 每個白天可問說書人兩條資訊（一真一假）
- 動詞: 得知
- 輸入: (無)
- effects: (無)
- template: ``
- 例句:

```
小華【01.博學者】得知兩條資訊
└[輸入][正確/錯誤]
└[輸入][正確/錯誤]
```
- 備註: 白天私下；通常不寫結構化戰報

### towncrier | 城鎮公告員

- team: `townsfolk`
- 能力: 每個夜晚*，你會得知在今天白天時是否有爪牙發起過提名。
- 規則: enabled=是
- 時機: fromNight2
- 影響: info, special
- 對象: self
- 觸發: (無)
- 動詞: 得知
- 輸入: select:res(結果)
- effects: 自身 爪牙提名、自身 爪牙未提名
- template: `{actor} → {action} → {res}`
- 例句:

```
小華【01.城鎮公告員】得知爪牙 [有/沒有]提名
```
- 備註: 

### klutz | 呆瓜

- team: `outsider`
- 能力: 當你得知你死亡時，你要公開選擇一名存活的玩家：如果他是邪惡的，你的陣營落敗。
- 規則: enabled=(無規則)
- 時機: trigger
- 影響: special
- 對象: other
- 觸發: 得知死亡時公開選一名存活者；若邪惡則己方陣營敗
- 動詞: 選擇
- 輸入: (無)
- effects: (無)
- template: ``
- 例句:

```
小華【01.呆瓜】死亡時選擇 小明【03.方古】
└ [善良]陣營落敗
```
- 備註: 

### fanggu | 方古

- team: `demon`
- 能力: 每個夜晚*，你要選擇一名玩家：他死亡。被該能力殺死的外來者改為變成邪惡的方古且你代替他死亡，但每局遊戲僅能成功轉化一次。[+1外來者]
- 規則: enabled=是
- 時機: setup, fromNight2, once
- 影響: life, role, alignment
- 對象: both
- 觸發: 殺到外來者時可改為己死、對方變邪惡方古（每局一次）
- 動詞: 殺害
- 輸入: player:target(目標對象)
- effects: 目標死亡、目標掛死亡標記、目標對象 第一位外來者
- template: `{actor} → {action} → 選擇 {target} → {target} 死亡`
- 例句:

```
1.
本局外來者 +1
2.
小華【01.方古】殺害 小明【03.藝術家】
└ 小明【03.藝術家】死亡
3.
小華【01.方古】殺害 小美【04.呆瓜】（外來者）
└ 小華【01.方古】死亡
└ 小美【04.呆瓜】成為邪惡方古
```
- 備註: 

### deviant | 怪咖

- team: `traveler`
- 能力: 如果你表現得很有趣，當天你不能被流放。
- 規則: enabled=(無規則)
- 時機: trigger
- 影響: special
- 對象: self
- 觸發: 今天夠有趣則不會被放逐
- 動詞: (無)
- 輸入: (無)
- effects: (無)
- template: ``
- 例句:

```
(無)
```
- 備註: 旅行者被動；說書人裁定

### mutant | 畸形秀演員

- team: `outsider`
- 能力: 如果你“瘋狂”地證明自己是外來者，你可能被處決。
- 規則: enabled=(無規則)
- 時機: trigger
- 影響: special
- 對象: self
- 觸發: 若執著讓人相信自己是外來者，可能被處決
- 動詞: (無)
- 輸入: (無)
- effects: (無)
- template: ``
- 例句:

```
(無)
```
- 備註: 被動／說書人裁定

### bonecollector | 集骨者

- team: `traveler`
- 能力: 每局遊戲限一次，在夜晚時*，你可以選擇一名死亡的玩家：他重新獲得能力直到下個黃昏。
- 規則: enabled=是
- 時機: once, fromNight2
- 影響: special
- 對象: other
- 觸發: (無)
- 動詞: 選擇
- 輸入: player:target(死亡玩家)
- effects: 目標對象 具有能力
- template: `{actor} → {action} → 選擇 {target}`
- 例句:

```
小華【01.集骨者】選擇 小明【03.藝術家】（死亡）
└ 小明【03.藝術家】具有能力
```
- 備註: 至明昏恢復能力；每局一次；template 勿帶「死亡」結果句

### eviltwin | 鏡像雙子

- team: `minion`
- 能力: 你與一名對立陣營的玩家互相知道對方是什麼角色。如果其中善良玩家被處決，邪惡陣營獲勝。如果你們都存活，善良陣營無法獲勝。
- 規則: enabled=是
- 時機: firstOnly, trigger
- 影響: info, special
- 對象: other
- 觸發: 善側雙胞胎被處決→邪勝；雙方皆活時善不能勝
- 動詞: (無)
- 輸入: player:p1(鏡像雙子), player:p2(對立雙子)
- effects: (無)（標記「雙胞胎」）
- template: `{p1} 與 {p2} 互認`
- 例句:

```
1.
小華【01.鏡像雙子】與 小明【03.藝術家】互認
2.
鏡像雙子存活，善良陣營無法獲勝。
3.
善良雙子死於處決，邪惡陣營獲勝。
```
- 備註: 首夜互認；非 setup 改人數

### barista | 咖啡師

- team: `traveler`
- 能力: 每個夜晚，直至下個黃昏，由說書人二選一：1）一名玩家解除並免受醉酒和中毒影響，且會得知正確信息；2）一名玩家的能力可以生效兩次。該玩家會得知是哪個效果。
- 規則: enabled=是
- 時機: everyNight
- 影響: special, info
- 對象: other
- 觸發: (無)
- 動詞: (無)
- 輸入: player:p1(目標玩家), select:res(附加效果)
- effects: 目標玩家 清醒&健康、目標玩家 能力x2
- template: `{actor} → {action} → {p1} / {res}`
- 例句:

```
(無)
```
- 備註: 旅行者夜動；若要記戰報可寫「咖啡師 → 玩家／清醒&健康或能力x2」。目前依例句保留 (無)

### barber | 理髮師

- team: `outsider`
- 能力: 如果你死亡，在當晚惡魔可以選擇兩名玩家（不能選擇其他惡魔）交換角色。
- 規則: enabled=是
- 時機: trigger, fromNight2
- 影響: role
- 對象: other
- 觸發: 理髮師死亡之夜，惡魔可換兩名玩家角色
- 動詞: (無)
- 輸入: player:p1(玩家 1), player:p2(玩家 2)
- effects: 玩家 1 今晚剪頭髮
- template: `{actor} → {action} → {p1} & {p2}`
- 例句:

```
小華【01.理髮師】死亡
└ 惡魔選擇 小明【03.藝術家】 ↔ 小美【04.數學家】交換角色
```
- 備註: 標記「今晚剪頭髮」；不可選其他惡魔

### harlot | 流鶯

- team: `traveler`
- 能力: 每個夜晚*，你要選擇一名存活的玩家：如果他同意，你會得知他的角色，但是你們兩個可能同時死亡。
- 規則: enabled=是
- 時機: fromNight2
- 影響: info, life
- 對象: both
- 觸發: (無)
- 動詞: 選擇
- 輸入: player:target(目標對象)
- effects: 目標死亡、目標掛死亡標記
- template: `{actor} → {action} → 選擇 {target} → {target} 死亡`
- 例句:

```
小華【01.流鶯】選擇 小明【03.藝術家】（同意/不同意）
└ 小華【01.流鶯】得知 [藝術家]
└ （可選）雙雙殉情
```
- 備註: 不同意則無└；說書人可讓雙方死亡

### pithag | 麻臉巫婆

- team: `minion`
- 能力: 每個夜晚*，你要選擇一名玩家和一個角色，如果該角色不在場，他變成該角色。如果因此創造了一個惡魔，當晚的死亡由說書人決定。
- 規則: enabled=是
- 時機: fromNight2
- 影響: role, life
- 對象: other
- 觸發: (無)
- 動詞: 選擇
- 輸入: player:p1(目標玩家), role:r1(對應角色)
- effects: （角色不在場時）目標變成該角色；（若因此出現新惡魔）當晚死亡由說書人決定
- template: `{actor} → {action} → {p1} → {r1}`
- 例句:

```
1.
小華【01.麻臉巫婆】選擇 小明【03.藝術家】變成 [男爵]
└ 小明【03.藝術家】變成 小明【03.男爵】
2.
小華【01.麻臉巫婆】創造了一個惡魔
└ 說書人選擇 小美【02.方古】死亡

```
- 備註: 1.可選└ ；若變出新惡魔，當晚惡魔擊殺由說書人決定

### flowergirl | 賣花女孩

- team: `townsfolk`
- 能力: 每個夜晚*，你會得知在今天白天時是否有惡魔投過票。
- 規則: enabled=是
- 時機: fromNight2
- 影響: info, special
- 對象: self
- 觸發: (無)
- 動詞: 得知
- 輸入: select:res(結果)
- effects: 自身 惡魔投票、自身 惡魔未投票
- template: `{actor} → {action} → {res}`
- 例句:

```
小華【01.賣花女孩】得知惡魔[有/沒有]投票
```
- 備註: 

### seamstress | 女裁縫

- team: `townsfolk`
- 能力: 每局遊戲限一次，在夜晚時，你可以選擇除你以外的兩名玩家：你會得知他們是否為同一陣營。
- 規則: enabled=是
- 時機: once, everyNight
- 影響: info
- 對象: other
- 觸發: (無)
- 動詞: 得知
- 輸入: player:p1(玩家 1), player:p2(玩家 2), select:res(結果判斷)
- effects: (無)
- template: `{actor} → {action} → {p1} & {p2} → {res}`
- 例句:

```
小華【01.女裁縫】得知 小明【03.藝術家】 小美【04.方古】[相同/不同]陣營
```
- 備註: 

### witch | 女巫

- team: `minion`
- 能力: 每個夜晚，你要選擇一名玩家：如果他明天白天發起提名，他死亡。如果只有三名存活的玩家，你失去此能力。
- 規則: enabled=是
- 時機: everyNight
- 影響: special, life
- 對象: other
- 觸發: (無)
- 動詞: 詛咒
- 輸入: player:target(目標對象)
- effects: 目標對象 詛咒；（隔日若該玩家提名）目標死亡
- template: `{actor} → {action} → 選擇 {target}`
- 例句:

```
1.
小華【01.女巫】詛咒 小明【03.藝術家】
└ 小明【03.藝術家】詛咒
2.
小明【03.藝術家】被咒殺死亡
```
- 備註: 僅三人存活時失去能力；夜動只掛詛咒，死亡在隔日提名時

### nodashii | 諾-達鯴

- team: `demon`
- 能力: 每個夜晚*，你要選擇一名玩家：他死亡。與你鄰近的兩名鎮民中毒。
- 規則: enabled=是
- 時機: setup, fromNight2
- 影響: life, status
- 對象: both
- 觸發: (無)
- 動詞: 殺害
- 輸入: player:target(目標對象)
- effects: 目標死亡、目標掛死亡標記；（setup／持續）兩側最近鎮民 中毒
- template: `{actor} → {action} → 選擇 {target} → {target} 死亡`
- 例句:

```
1.
諾-達鯴導致 小美【04.鐘錶匠】小強【05.數學家】中毒
2.
小華【01.諾-達鯴】殺害 小明【03.藝術家】
└ 小明【03.藝術家】死亡
```
- 備註: setup 時對兩側最近鎮民掛中毒（座位／角色變動時需更新）；夜殺為 fromNight2

### oracle | 神諭者

- team: `townsfolk`
- 能力: 每個夜晚*，你會得知有多少名死亡的玩家是邪惡的。
- 規則: enabled=是
- 時機: fromNight2
- 影響: info
- 對象: self
- 觸發: (無)
- 動詞: 得知
- 輸入: number:num(得知數字)
- effects: (無)
- template: `{actor} → {action} → {num}`
- 例句:

```
小華【01.神諭者】得知 [2]
```
- 備註: 死亡玩家中邪惡數量

### mathematician | 數學家

- team: `townsfolk`
- 能力: 每個夜晚，你會得知有多少名玩家的能力因為其他角色的能力而未正常生效。（從上個黎明到你被喚醒時）
- 規則: enabled=是
- 時機: everyNight
- 影響: info, special
- 對象: self
- 觸發: (無)
- 動詞: 得知
- 輸入: number:num(得知數字)
- effects: 自身 異常
- template: `{actor} → {action} → {num}`
- 例句:

```
小華【01.數學家】得知 [1]
```
- 備註: 今日能力異常作用的玩家人數

### butcher | 屠夫

- team: `traveler`
- 能力: 每個白天，首次處決後，你可以再次發起提名。
- 規則: enabled=(無規則)
- 時機: trigger
- 影響: special
- 對象: other
- 觸發: 白天首次處決後可再提名一人
- 動詞: (無)
- 輸入: (無)
- effects: (無)
- template: ``
- 例句:

```
小華【01.屠夫】追加提名 小明【03.藝術家】
```
- 備註: 

### vigormortis | 亡骨魔

- team: `demon`
- 能力: 每個夜晚*，你要選擇一名玩家：他死亡。被你殺死的爪牙保留他的能力，且與他鄰近的兩名鎮民之一中毒。[-1外來者]
- 規則: enabled=是
- 時機: setup, fromNight2
- 影響: life, status, special
- 對象: both
- 觸發: (無)
- 動詞: 殺害
- 輸入: player:target(目標對象)
- effects: 目標死亡、目標對象 中毒、目標對象 具有能力、目標掛死亡標記
- template: `{actor} → {action} → 選擇 {target} → {target} 死亡`
- 例句:

```
1.
本局外來者 -1
2.
小華【01.亡骨魔】殺害 小明【03.洗腦師】
└ 小明【03.洗腦師】死亡
└ 小明【03.洗腦師】具有能力
└ 小美【04.藝術家】中毒
```
- 備註: 殺爪牙→保留能力＋鄰近一鎮民中毒；開局 −1 外來者

### vortox | 渦流

- team: `demon`
- 能力: 每個夜晚*，你要選擇一名玩家：他死亡。鎮民玩家的能力都會產生錯誤信息。如果白天沒人被處決，邪惡陣營獲勝。
- 規則: enabled=是
- 時機: fromNight2, trigger
- 影響: life, info, special
- 對象: both
- 觸發: 白天無處決 → 邪惡獲勝；鎮民資訊必錯
- 動詞: 殺害
- 輸入: player:target(目標對象)
- effects: 目標死亡、目標掛死亡標記
- template: `{actor} → {action} → 選擇 {target} → {target} 死亡`
- 例句:

```
1.
小華【01.渦流】殺害 小明【03.藝術家】
└ 小明【03.藝術家】死亡
2.
白天無處決 → [邪惡]陣營獲勝
```
- 備註: 

### snakecharmer | 舞蛇人

- team: `townsfolk`
- 能力: 每個夜晚，你要選擇一名存活的玩家：如果你選中了惡魔，你和他交換角色和陣營，然後他中毒。
- 規則: enabled=是
- 時機: everyNight
- 影響: role, alignment, status
- 對象: both
- 觸發: (無)
- 動詞: 選擇
- 輸入: player:target(目標對象)
- effects: 目標對象 中毒
- template: `{actor} → {action} → 選擇 {target} → {target} 中毒`
- 例句:

```
小華【01.舞蛇人】選擇 小明【03.方古】
└ 互換角色／陣營
└ 小明【03.舞蛇人】中毒
```
- 備註: 僅命中惡魔時交換；新舞蛇人中毒

### cerenovus | 洗腦師

- team: `minion`
- 能力: 每個夜晚，你要選擇一名玩家和一個善良角色。他明天白天和夜晚需要“瘋狂”地證明自己是這個角色，不然他可能被處決。
- 規則: enabled=是
- 時機: everyNight
- 影響: status
- 對象: other
- 觸發: (無)
- 動詞: 洗腦
- 輸入: player:p1(目標玩家), role:r1(對應角色)
- effects: 目標玩家 瘋狂
- template: `{actor} → {action} → {p1} → {r1}`
- 例句:

```
1.
小華【01.洗腦師】洗腦 小明【03.藝術家】為[鐘錶匠]瘋狂
└ 小明【03.藝術家】瘋狂
2.
小明【03.藝術家】不夠瘋狂遭到處決
└ 小明【03.藝術家】死亡

```
- 備註: 說書人裁定

### sage | 賢者

- team: `townsfolk`
- 能力: 如果惡魔殺死了你，在當晚你會被喚醒並得知兩名玩家，其中一名是殺死你的那個惡魔。
- 規則: enabled=是
- 時機: trigger, fromNight2
- 影響: info
- 對象: other
- 觸發: 被惡魔殺死時得知兩名玩家之一為惡魔
- 動詞: 得知
- 輸入: player:p1(玩家 1), player:p2(玩家 2)
- effects: (無)
- template: `{actor} → 死亡後得知 {p1} & {p2} 其中一位是惡魔`
- 例句:

```
小華【01.賢者】死亡後得知 小明【03.方古】 小美【04.藝術家】其中一位是惡魔
```
- 備註: 輸入為兩名玩家（其一為殺他的惡魔）

### sweetheart | 心上人

- team: `outsider`
- 能力: 當你死亡時，會有一名玩家開始醉酒。
- 規則: enabled=是
- 時機: trigger, fromNight2
- 影響: status
- 對象: other
- 觸發: 心上人死亡時一名玩家開始醉酒
- 動詞: (無)
- 輸入: player:p1(醉酒玩家)
- effects: 目標玩家 醉酒
- template: `{actor}死亡 → {p1} 醉酒`
- 例句:

```
小華【01.心上人】死亡
└ 小明【03.藝術家】醉酒
```
- 備註: 醉酒的是「另一名玩家」，非心上人自身

### artist | 藝術家

- team: `townsfolk`
- 能力: 每局遊戲限一次，在白天時，你可以私下詢問說書人一個是非問題，你會得知該問題的答案。
- 規則: enabled=(無規則)
- 時機: once, trigger
- 影響: info
- 對象: self
- 觸發: 白天私下問是非題（每局一次）
- 動詞: 詢問
- 輸入: (無)
- effects: (無)
- template: ``
- 例句:

```
小華【01.藝術家】詢問說書人：[輸入][是/否]
```
- 備註: 

### juggler | 雜耍藝人

- team: `townsfolk`
- 能力: 在你的首個白天，你可以公開猜測任意玩家的角色最多五次。在當晚，你會得知猜測正確的角色數量。
- 規則: enabled=是
- 時機: once, trigger, fromNight2
- 影響: info, special
- 對象: self
- 觸發: 首日公開猜至多五次；當晚得知猜對數
- 動詞: 得知
- 輸入: number:num(得知數字)；（白天猜測過程可另記）
- effects: 自身 正確
- template: `{actor} → {action} → {num}`
- 例句:

```
1.
小華【01.雜耍藝人】猜測

小華【01.雜耍藝人】是[雜耍藝人]
小美【02.心上人】是[心上人] 或 放棄猜測
小明【03.藝術家】是[方古] 或 放棄猜測
小王【04.方古】是[方古] 或 放棄猜測
小強【05.麻臉巫婆】是[方古] 或 放棄猜測
2.
小華【01.雜耍藝人】得知猜對 [3]
```
- 備註: 首日公開猜；當晚回報猜對數

### philosopher | 哲學家

- team: `townsfolk`
- 能力: 每局遊戲限一次，在夜晚時，你可以選擇一個善良角色：你獲得該角色的能力。如果這個角色在場，他醉酒。
- 規則: enabled=是
- 時機: once, everyNight
- 影響: role, status, special
- 對象: both
- 觸發: (無)
- 動詞: 選擇
- 輸入: role:r1(善良角色)
- effects: 自身 是哲學家（獲該角色能力）、（若該角色在場）該玩家 醉酒
- template: `{actor} → {action} → [{r1}]`
- 例句:

```
小華【01.哲學家】選擇 [數學家]
└ 小華【01.哲學家】成為[數學家]
└ 小明【03.數學家】醉酒
```
- 備註: 選善良角色；在場則對方醉酒；掛「是哲學家」標記（例句「成為」=獲其能力／可視實作換代幣）

### clockmaker | 鐘錶匠

- team: `townsfolk`
- 能力: 在你的首個夜晚，你會得知惡魔與爪牙之間最近的距離。
- 規則: enabled=是
- 時機: firstOnly
- 影響: info
- 對象: self
- 觸發: (無)
- 動詞: 得知
- 輸入: number:num(得知數字)
- effects: (無)
- template: `{actor} → {action} → {num}`
- 例句:

```
小華【01.鐘錶匠】得知 [2]
```
- 備註: 惡魔到最近爪牙距離（鄰座=1）

### dreamer | 築夢師

- team: `townsfolk`
- 能力: 每個夜晚，你要選擇除你及旅行者以外的一名玩家：你會得知一個善良角色和一個邪惡角色，該玩家是其中一個角色。
- 規則: enabled=是
- 時機: everyNight
- 影響: info
- 對象: other
- 觸發: (無)
- 動詞: 得知
- 輸入: otherPlayer:p1(目標玩家), role:r1(善良角色), role:r2(邪惡角色)
- effects: (無)
- template: `{actor} → {action} → {p1} → {r1} / {r2}`
- 例句:

```
小華【01.築夢師】得知 小明【03.藝術家】是 [藝術家] 或 [方古]
```
- 備註: 一善一邪角色，其一正確

