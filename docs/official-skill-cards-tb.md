# 官方角色技能資訊卡（TB）

> 自動產生：`node scripts/export-official-skill-cards.js <edition>`  
> 更新：2026-08-06  
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
共 **27** 名角色。

### chef | 廚師

- team: `townsfolk`
- 能力: 在你的首個夜晚，你會得知場上鄰座的邪惡玩家有多少對。
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
小華【01.廚師】得知 [2]
```
- 備註: 僅首夜資訊

### investigator | 調查員

- team: `townsfolk`
- 能力: 在你的首個夜晚，你會得知兩名玩家和一個爪牙角色：這兩名玩家之一是該角色。
- 規則: enabled=是
- 時機: firstOnly
- 影響: info, special
- 對象: other
- 觸發: (無)
- 動詞: 得知
- 輸入: player:p1(玩家 1), player:p2(玩家 2), role:r1(對應角色)
- effects: 玩家 1 爪牙、玩家 2 非爪牙
- template: `{actor} → {action} → {p1} & {p2} 其中一位是 {r1}`
- 例句:

```
小華【01.調查員】得知 小明【03.男爵】 小美【04.僧侶】其中一位是 [男爵]
└ 小明【03.男爵】爪牙
└ 小美【04.僧侶】非爪牙
```
- 備註: 

### empath | 共情者

- team: `townsfolk`
- 能力: 每個夜晚，你會得知與你鄰近的兩名存活的玩家中邪惡玩家的數量。
- 規則: enabled=是
- 時機: everyNight
- 影響: info
- 對象: self
- 觸發: (無)
- 動詞: 得知
- 輸入: number:num(得知數字)
- effects: (無)
- template: `{actor} → {action} → {num}`
- 例句:

```
小華【01.共情者】得知 [2]
```
- 備註: 

### bureaucrat | 官員

- team: `traveler`
- 能力: 每個夜晚，你要選擇除你以外的一名玩家：明天白天，他的投票算作三票。
- 規則: enabled=是
- 時機: everyNight
- 影響: special
- 對象: other
- 觸發: (無)
- 動詞: 選擇
- 輸入: player:target(目標對象)
- effects: 目標對象 票數x3
- template: `{actor} → {action} → 選擇 {target}`
- 例句:

```
小華【01.官員】選擇 小明【03.洗衣婦】
└ 小明【03.洗衣婦】票數x3
```
- 備註: 

### butler | 管家

- team: `outsider`
- 能力: 每個夜晚，你要選擇除你以外的一名玩家：明天白天，只有他投票時你才能投票。
- 規則: enabled=是
- 時機: everyNight
- 影響: special
- 對象: other
- 觸發: (無)
- 動詞: 選擇
- 輸入: player:target(目標對象)
- effects: 目標對象 主人
- template: `{actor} → {action} → 選擇 {target}`
- 例句:

```
小華【01.管家】選擇 小明【03.洗衣婦】
└ 小明【03.洗衣婦】主人
```
- 備註: 

### scarletwoman | 紅唇女郎

- team: `minion`
- 能力: 如果大於等於五名玩家存活時（旅行者不計算在內）惡魔死亡，你變成那個惡魔。
- 規則: enabled=是, activation=optional
- 時機: trigger
- 影響: role, alignment
- 對象: self
- 觸發: ≥5 名玩家存活（不含旅行者）時惡魔死亡
- 動詞: 成為
- 輸入: role:r1(惡魔角色)
- effects: 自身 是惡魔
- template: `{actor}成為[{r1}]`
- 例句:

```
小華【01.紅唇女郎】成為[小惡魔]
```
- 備註: 非夜「選擇」；觸發時記錄

### spy | 間諜

- team: `minion`
- 能力: 每個夜晚，你能查看魔典。你可能會被當作善良陣營、鎮民角色或外來者角色，即使你已死亡。
- 規則: enabled=是
- 時機: everyNight
- 影響: info
- 對象: self
- 觸發: (無)
- 動詞: 查看魔典
- 輸入: text:note(備註（可留空）)
- effects: (無)
- template: `{actor} → {action}`
- 例句:

```
小華【01.間諜】查看魔典
```
- 備註: 勿預設 └ 醉酒/中毒

### drunk | 酒鬼

- team: `outsider`
- 能力: 你不知道你是酒鬼。你以為你是一個鎮民角色，但其實你不是。
- 規則: enabled=是, activation=setup
- 時機: setup
- 影響: role, status
- 對象: other
- 觸發: 劇本含酒鬼時才顯示設置字卡
- 動詞: 是
- 輸入: player:p1(酒鬼玩家), role:r1(善良角色)
- effects: setRole、掛 是酒鬼 標記
- template: `{p1}是[酒鬼]`
- 例句:

```
小華【01.獵手】是[酒鬼]
```
- 備註: 設置 A：已指派酒鬼→選鎮民角色，玩家角色改為該角色＋掛「是酒鬼」；設置 B：未指派且無標記→選善良玩家僅掛「是酒鬼」。主句無 └

### slayer | 獵手

- team: `townsfolk`
- 能力: 每局遊戲限一次，你可以在白天時公開選擇一名玩家：如果他是惡魔，他死亡。
- 規則: enabled=是, activation=optional
- 時機: once, trigger
- 影響: life
- 對象: other
- 觸發: 白天公開使用，每局一次；目標為惡魔則死亡
- 動詞: 獵殺
- 輸入: alivePlayer:target(目標對象)
- effects: 目標死亡、目標掛死亡標記
- template: `{actor} → {action} → {target}`
- 例句:

```
小華【01.獵手】獵殺 小美【02.小惡魔】
└ 小美【02.小惡魔】死亡
```
- 備註: 可選 effect 關閉時無 └；需晝間規則

### recluse | 陌客

- team: `outsider`
- 能力: 你可能會被當作邪惡陣營、爪牙角色或惡魔角色，即使你已死亡。
- 規則: enabled=(無規則)
- 時機: trigger
- 影響: info
- 對象: self
- 觸發: 被動：可能被當作邪惡／爪牙／惡魔
- 動詞: (無)
- 輸入: (無)
- effects: (無)
- template: ``
- 例句:

```
(無)
```
- 備註: 被動，通常不寫戰報

### baron | 男爵

- team: `minion`
- 能力: 會有額外的外來者在場。[+2 外來者]
- 規則: enabled=是, activation=setup
- 時機: setup
- 影響: special
- 對象: self
- 觸發: (無)
- 動詞: (無)
- 輸入: (無)
- effects: (無)
- template: `本局外來者人數為 {n} +2`
- 例句:

```
本局外來者人數為 n +2
```
- 備註: 開局紀錄即可；僅影響開局外來者數量

### beggar | 乞丐

- team: `traveler`
- 能力: 你只能使用投票標記才能投票。死亡的玩家可以將他的投票標記給你，如果他這麼做，你會得知他的陣營。你不會中毒和醉酒。
- 規則: enabled=(無規則)
- 時機: trigger
- 影響: info, special
- 對象: both
- 觸發: 收到死亡玩家投票標記時得知其陣營
- 動詞: (無)
- 輸入: (無)
- effects: (無)
- template: ``
- 例句:

```
(無)
```
- 備註: 

### gunslinger | 槍手

- team: `traveler`
- 能力: 每個白天，當首次投票被統計後，你可以選擇一名剛投過票的玩家：他死亡。
- 規則: enabled=是, activation=optional
- 時機: trigger, once
- 影響: life
- 對象: other
- 觸發: 每個白天首次投票統計後可選一名剛投票者死亡
- 動詞: 槍殺
- 輸入: alivePlayer:target(目標對象)
- effects: 目標死亡、目標掛死亡標記
- template: `{actor} → {action} → {target}`
- 例句:

```
小華【01.槍手】槍殺 小明【03.洗衣婦】
└ 小明【03.洗衣婦】死亡
```
- 備註: 白天；once 指每次投票段一次

### thief | 竊賊

- team: `traveler`
- 能力: 每個夜晚，你要選擇除你以外的一名玩家：明天白天他的投票會被算作負數。
- 規則: enabled=是
- 時機: everyNight
- 影響: special
- 對象: other
- 觸發: (無)
- 動詞: 選擇
- 輸入: player:target(目標對象)
- effects: 目標對象 負數票
- template: `{actor} → {action} → 選擇 {target}`
- 例句:

```
小華【01.竊賊】選擇 小明【03.洗衣婦】
└ 小明【03.洗衣婦】負數票
```
- 備註: 

### monk | 僧侶

- team: `townsfolk`
- 能力: 每個夜晚*，你要選擇除你以外的一名玩家：當晚惡魔的負面能力對他無效。
- 規則: enabled=是
- 時機: fromNight2
- 影響: special
- 對象: other
- 觸發: (無)
- 動詞: 保護
- 輸入: otherPlayer:target(目標對象)
- effects: 目標對象 保護
- template: `{actor} → {action} → 選擇 {target}`
- 例句:

```
小華【01.僧侶】保護 小明【03.洗衣婦】
└ 小明【03.洗衣婦】保護
```
- 備註: 

### saint | 聖徒

- team: `outsider`
- 能力: 如果你死於處決，你的陣營落敗。
- 規則: enabled=是, activation=optional
- 時機: trigger
- 影響: special
- 對象: self
- 觸發: 死於處決 → 所屬陣營落敗
- 動詞: (無)
- 輸入: select:align(陣營)
- effects: (無)
- template: `{actor}死於處決，[{align}]陣營落敗`
- 例句:

```
小華【01.聖徒】死於處決，[善良]陣營落敗
```
- 備註: 

### soldier | 士兵

- team: `townsfolk`
- 能力: 惡魔的負面能力對你無效。
- 規則: enabled=是, activation=optional
- 時機: trigger
- 影響: special
- 對象: self
- 觸發: 被惡魔負面能力選中時無效（被動）
- 動詞: (無)
- 輸入: player:target(士兵)
- effects: (無)
- template: `惡魔選擇了 {target}`
- 例句:

```
惡魔選擇了小明【01.士兵】
└ 無效
```
- 備註: 惡魔能力落在士兵上時記錄

### ravenkeeper | 守鴉人

- team: `townsfolk`
- 能力: 如果你在夜晚死亡，你會被喚醒，然後你要選擇一名玩家：你會得知他的角色。
- 規則: enabled=是, activation=optional
- 時機: trigger
- 影響: info
- 對象: other
- 觸發: 該角色今晚死亡
- 動詞: 得知
- 輸入: player:target(守鴉人選擇)
- effects: (無)
- template: `{actor} → 死亡後得知 {target}`
- 例句:

```
小華【01.守鴉人】死亡後得知 小明【03.洗衣婦】
```
- 備註: 

### undertaker | 送葬者

- team: `townsfolk`
- 能力: 每個夜晚*，你會得知今天白天死於處決的玩家的角色。
- 規則: enabled=是
- 時機: fromNight2
- 影響: info
- 對象: self
- 觸發: 當天有人死於處決時才有資訊
- 動詞: 得知
- 輸入: role:r1(處決角色)
- effects: (無)
- template: `{actor} → {action} → 今日處決 {r1}`
- 例句:

```
小華【01.送葬者】得知 今日處決 [洗衣婦]
```
- 備註: 勿 └ 自身處決；無處決可寫 (無) 或不記

### scapegoat | 替罪羊

- team: `traveler`
- 能力: 如果你的陣營的一名玩家被處決，你可能會代替他被處決。
- 規則: enabled=(無規則)
- 時機: trigger
- 影響: life
- 對象: self
- 觸發: 同陣營玩家被處決時可能代替被處決
- 動詞: (無)
- 輸入: (無)
- effects: (無)
- template: ``
- 例句:

```
(無)
```
- 備註: 

### poisoner | 投毒者

- team: `minion`
- 能力: 每個夜晚，你要選擇一名玩家：他在當晚和明天白天中毒。
- 規則: enabled=是
- 時機: everyNight
- 影響: status
- 對象: other
- 觸發: (無)
- 動詞: 投毒
- 輸入: alivePlayer:target(目標對象)
- effects: 目標對象 中毒
- template: `{actor} → {action} → 選擇 {target} → {target} 中毒`
- 例句:

```
小華【01.投毒者】投毒 小明【03.洗衣婦】
└ 小明【03.洗衣婦】中毒
```
- 備註: 

### librarian | 圖書管理員

- team: `townsfolk`
- 能力: 在你的首個夜晚，你會得知兩名玩家和一個外來者角色：這兩名玩家之一是該角色（或者你會得知沒有外來者在場。）
- 規則: enabled=是
- 時機: firstOnly
- 影響: info, special
- 對象: other
- 觸發: (無)
- 動詞: 得知
- 輸入: player:p1(玩家 1), player:p2(玩家 2), role:r1(對應角色)
- effects: 玩家 1 外來者、玩家 2 非外來者
- template: `{actor} → {action} → {p1} & {p2} 其中一位是 {r1}`
- 例句:

```
小華【01.圖書管理員】得知 小明【03.洗衣婦】 小美【04.僧侶】其中一位是 [酒鬼]
└ 小明【03.洗衣婦】外來者
└ 小美【04.僧侶】非外來者
```
- 備註: 

### washerwoman | 洗衣婦

- team: `townsfolk`
- 能力: 在你的首個夜晚，你會得知兩名玩家和一個鎮民角色：這兩名玩家之一是該角色。
- 規則: enabled=是
- 時機: firstOnly
- 影響: info, special
- 對象: other
- 觸發: (無)
- 動詞: 得知
- 輸入: player:p1(玩家 1), player:p2(玩家 2), role:r1(對應角色)
- effects: 玩家 1 鎮民、玩家 2 非鎮民
- template: `{actor} → {action} → {p1} & {p2} 其中一位是 {r1}`
- 例句:

```
小華【01.洗衣婦】得知 小明【03.圖書管理員】 小美【04.男爵】其中一位是 [圖書管理員]
└ 小明【03.圖書管理員】鎮民
└ 小美【04.男爵】非鎮民
```
- 備註: 

### imp | 小惡魔

- team: `demon`
- 能力: 每個夜晚*，你要選擇一名玩家：他死亡。如果你以這種方式自殺，一名爪牙會變成小惡魔。
- 規則: enabled=是
- 時機: fromNight2
- 影響: life, role
- 對象: both
- 觸發: 每晚選擇；若自殺則爪牙變小惡魔（另記）
- 動詞: 殺害
- 輸入: alivePlayer:target(目標對象)
- effects: 目標死亡、目標掛死亡標記
- template: `{actor} → {action} → 選擇 {target} → {target} 死亡`
- 例句:

```
1.
小華【01.小惡魔】殺害 小明【03.洗衣婦】
└ 小明【03.洗衣婦】死亡
2.
小華【01.小惡魔】選擇自己
└ 小華【01.小惡魔】死亡
└ 小美【03.投毒者】成為 [小惡魔]
```
- 備註: 可選 effect 關閉時無 └；自殺轉生另條；生成可選字卡

### fortuneteller | 占卜師

- team: `townsfolk`
- 能力: 每個夜晚，你要選擇兩名玩家：你會得知他們之中是否有惡魔。會有一名善良玩家始終被你的能力當作惡魔。
- 規則: enabled=是
- 時機: everyNight, setup
- 影響: info, special
- 對象: other
- 觸發: 開局選定一名善良玩家「視為惡魔」（整局）
- 動詞: 得知
- 輸入: player:p1(玩家 1), player:p2(玩家 2), select:res(結果判斷)
- effects: (無)
- template: `{actor} → 查驗 {p1} & {p2} → {res}`
- 例句:

```
1.
小華【01.占卜師】始終將 小明【03.洗衣婦】視為惡魔
2.
小華【01.占卜師】查驗 小明【03.洗衣婦】 小美【04.僧侶】得知 [是]
```
- 備註: res 用 是/否；「視為惡魔」標記僅開局一次

### virgin | 貞潔者

- team: `townsfolk`
- 能力: 當你首次被提名時，如果提名你的玩家是鎮民，他立刻被處決。
- 規則: enabled=是, activation=optional
- 時機: once, trigger
- 影響: life
- 對象: other
- 觸發: 首次被提名且提名者為鎮民 → 提名者立刻處決
- 動詞: (無)
- 輸入: player:nominator(提名者)
- effects: 提名者被處決死亡、提名者掛死亡標記
- template: `{nominator}提名 {actor}`
- 例句:

```
小明【03.僧侶】提名 小華【01.貞潔者】
└ 小明【03.僧侶】被處決死亡
```
- 備註: 晝間觸發；可併入提名／處決戰報

### mayor | 鎮長

- team: `townsfolk`
- 能力: 如果只有三名玩家存活且白天沒有人被處決，你的陣營獲勝。如果你在夜晚即將死亡，可能會有一名其他玩家代替你死亡。
- 規則: enabled=是, activation=optional
- 時機: trigger
- 影響: life, special
- 對象: both
- 觸發: 三人存活且白天無處決，你的陣營獲勝；夜裡將死時可能他人代死
- 動詞: (無)
- 輸入: select:scenario(情境), select:align(陣營), player:target(代替死亡玩家)
- effects: 代替死亡
- template: `{actor}鎮長情境`
- 例句:

```
1.
三人存活且白天無處決，小明【03.鎮長】帶領[善良]陣營獲勝

2.
小明【03.鎮長】即將死亡
└ 小華【01.僧侶】代替死亡
```
- 備註: 生成可選字卡

