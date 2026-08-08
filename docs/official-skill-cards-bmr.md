# 官方角色技能資訊卡（BMR）

> 自動產生：`node scripts/export-official-skill-cards.js <edition>`  
> 更新：2026-08-10  
> **請直接改各角色欄位後整檔覆蓋**；留空表示不確定。

## 審核後套用

1. 改完 `docs/official-skill-cards-<edition>.md` 後整檔覆蓋（規則欄位與例句皆在此檔）。
2. 執行 `npm run apply:skill-cards` 寫入 `roleInteractionRules.json`（戰報互動）。
3. 重新匯出（可選）：`npm run export:skill-cards -- all`（會依 JSON+OVERRIDES 覆寫 md，手改例句請先備份）。

## 代碼說明

### 時機（可多個，逗號分隔）


| 代碼           | 含義              |
| ------------ | --------------- |
| `setup`      | 設置階段影響設置        |
| `once`       | 一次性（整局或該情境一次）   |
| `firstOnly`  | 僅首夜             |
| `everyNight` | 每個夜晚（含首夜）       |
| `fromNight2` | 次夜開始每個夜晚（夜晚*）   |
| `trigger`    | 條件滿足觸發（請填「觸發」欄） |


### 影響（可多個）


| 代碼          | 含義              |
| ----------- | --------------- |
| `life`      | 生死（死亡／復活）       |
| `role`      | 角色變化            |
| `alignment` | 陣營變化            |
| `status`    | 狀態（醉酒／中毒／瘋狂）    |
| `info`      | 獲得／告知資訊         |
| `special`   | 特殊狀態（保護／票數／主人…） |




### 對象

`self` / `other` / `both`

### 例句

- 短動詞（預設「選擇」）+ 對象  
- 結果另起一行 `└ …`  
- 無戰報寫 `(無)`

---

共 **30** 名角色。

### tealady | 茶藝師

- team: `townsfolk`
- 能力: 如果與你鄰近的兩名存活的玩家是善良的，他們不會死亡。
- 規則: enabled=是, activation=optional
- 時機: trigger
- 影響: special
- 對象: other
- 觸發: 兩側存活鄰居皆善良 → 他們不會死
- 動詞: (無)
- 輸入: player:p1(鄰居 1), player:p2(鄰居 2)
- effects: 鄰居 1 不會死、鄰居 2 不會死
- template: `{actor}兩側存活鄰居皆善良`
- 例句:

```
小華【01.茶藝師】兩側存活鄰居皆善良
└ 小明【03.水手】不會死亡
└ 小美【04.賭徒】不會死亡
```

- 備註: 被動；標記「不會死」由說書人手動掛在鄰居



### assassin | 刺客

- team: `minion`
- 能力: 每局遊戲限一次，在夜晚時*，你可以選擇一名玩家：他死亡，即使因為任何原因讓他不會死亡。
- 規則: enabled=是
- 時機: once, fromNight2
- 影響: life
- 對象: other
- 觸發: (無)
- 動詞: 刺殺
- 輸入: player:target(目標對象)
- effects: 目標死亡、目標掛死亡標記
- template: `{actor} → {action} → 選擇 {target} → {target} 死亡`
- 例句:

```
小華【01.刺客】刺殺 小明【03.水手】
└ 小明【03.水手】死亡
```

- 備註: 無視「不會死」；每局一次



### gambler | 賭徒

- team: `townsfolk`
- 能力: 每個夜晚*，你要選擇一名玩家並猜測該玩家的角色：如果你猜錯了，你會死亡。
- 規則: enabled=是
- 時機: fromNight2
- 影響: life, info
- 對象: both
- 觸發: (無)
- 動詞: 猜測
- 輸入: alivePlayer:target(目標對象), role:r1(猜測角色)
- effects: （猜錯時）自身死亡、自身掛死亡標記
- template: `{actor} → {action} → {target} 是 [{r1}]`
- 例句:

```
小華【01.賭徒】猜測 小明【03.水手】是 [刺客]
└ 猜錯，小華【01.賭徒】死亡
```

- 備註: 猜對可關 effect／無 └；死亡的是賭徒本人



### judge | 法官

- team: `traveler`
- 能力: 每局遊戲限一次，如果其他玩家發起了提名，你可以選擇讓本次提名直接執行處決或讓投票無效。
- 規則: enabled=是, activation=optional
- 時機: once, trigger
- 影響: special
- 對象: both
- 觸發: 他玩家提名時，可強制處決成功或失敗（每局一次）
- 動詞: 裁定
- 輸入: select:res(裁定 成功/失敗)
- effects: (無)
- template: `{actor} → {action} → 本次處決 [{res}]`
- 例句:

```
小華【01.法官】裁定本次處決 [成功]
```

- 備註: 每局一次；可選紀錄


### lunatic | 瘋子

- team: `outsider`
- 能力: 你以為你是一個惡魔，但其實你不是。惡魔知道你是瘋子以及你在每個夜晚選擇了哪些玩家。
- 規則: enabled=是
- 時機: setup, everyNight
- 影響: role, status, info, special
- 對象: both
- 觸發: 劇本含瘋子時才顯示設置字卡
- 動詞: 是／選擇
- 輸入: （setup）player:p1(瘋子玩家), role:r1(惡魔角色)；（everyNight）player:target(目標對象)
- effects: （setup）setRole、掛 是瘋子 標記；（everyNight）目標對象 攻擊1、目標對象 攻擊2、目標對象 攻擊3
- template: （setup）`{p1}是[瘋子]`／（everyNight）`{actor} → {action} → 選擇 {target}`
- 例句:

```
1.
小華【01.方古】是[瘋子]
2.
小華【01.瘋子】選擇 小明【03.水手】
└ 小明【03.水手】攻擊1
└ 惡魔得知瘋子目標 小明【03.水手】
```

- 備註: 劇本含瘋子才顯示 setup（無設置 B）。已指派瘋子字卡，或玩家已有「是瘋子」標記→選惡魔角色＋掛「是瘋子」（設置 A，同酒鬼設置 A 形式）。瘋子假殺＋告知真惡魔；無真實死亡除非他因



### pacifist | 和平主義者

- team: `townsfolk`
- 能力: 被處決的善良玩家可能不會死亡。
- 規則: enabled=是, activation=optional
- 時機: trigger
- 影響: life, special
- 對象: other
- 觸發: 善良玩家被處決時可能不死
- 動詞: (無)
- 輸入: player:target(倖免的玩家)
- effects: (無)
- template: `{target}被處決`
- 例句:

```
小明【03.水手】被處決
└ 小華【01.和平主義者】：小明【03.水手】倖免
```

- 備註: 被動／說書人裁定；無夜動



### zombuul | 僵怖

- team: `demon`
- 能力: 每個夜晚*，如果今天白天沒有人死亡，你會被喚醒並要選擇一名玩家：他死亡。當你首次死亡後，你仍存活，但會被當作死亡。
- 規則: enabled=是, activation=optional
- 時機: fromNight2, trigger
- 影響: life, special
- 對象: both
- 觸發: 當日無人死亡才夜殺；第一次死亡不真正死（視為已死）
- 動詞: 殺害
- 輸入: alivePlayer:target(目標對象)
- effects: （夜殺）目標死亡、目標掛死亡標記
- template: （雙卡）`{actor} → 殺害 → 選擇 {target}`／`{actor}第一次「死亡」→ 仍存活但視為已死`
- 例句:

```
1.
小華【01.僵怖】殺害 小明【03.水手】
└ 小明【03.水手】死亡
2.
小華【01.僵怖】第一次「死亡」→ 仍存活但視為已死
```

- 備註: 夜殺卡為 optional（僅白日無人死時用）；「今天死亡」由說書人手動掛標記；假死另卡


### godfather | 教父

- team: `minion`
- 能力: 在你的首個夜晚，你會得知有哪些外來者角色在場。如果有外來者在白天死亡，你會在當晚被喚醒並且你要選擇一名玩家：他死亡。[-1或+1外來者]
- 規則: enabled=是
- 時機: setup, firstOnly, fromNight2
- 影響: info, life, special
- 對象: both
- 觸發: 當日有外來者死亡 → 當晚可殺一人
- 動詞: 得知／殺害
- 輸入: （setup）select:res(−1/+1)；（首夜）(無，自動)；（觸發夜）alivePlayer:target(擊殺目標)
- effects: (無)
- template: `{actor} → 設置／得知／殺害…`（見多卡）
- 例句:

```
1.
小華【01.教父】設置 → 外來者 [+1]
2.
小華【01.教父】得知 → 外來者：[修補匠] [莽夫]
3.
小華【01.教父】殺害 小明【03.水手】
```

- 備註: 首夜自動帶入在場外來者；殺人僅在外來者白日死後（optional 卡），僅記錄殺害動作



### professor | 教授

- team: `townsfolk`
- 能力: 每局遊戲限一次，在夜晚時*，你可以選擇一名死亡的玩家：如果他是鎮民，你會將他起死回生。
- 規則: enabled=是
- 時機: once, fromNight2
- 影響: life
- 對象: other
- 觸發: (無)
- 動詞: 復活
- 輸入: player:target(目標對象)
- effects: 目標對象 復活
- template: `{actor} → {action} → 選擇 {target} → {target} 復活`
- 例句:

```
小華【01.教授】復活 小明【03.水手】
└ 小明【03.水手】復活
```

- 備註: 目標須為死亡鎮民；非鎮民則無效



### innkeeper | 旅店老闆

- team: `townsfolk`
- 能力: 每個夜晚*，你要選擇兩名玩家：他們當晚不會死亡，但其中一人會醉酒到下個黃昏。
- 規則: enabled=是
- 時機: fromNight2
- 影響: special, status
- 對象: other
- 觸發: (無)
- 動詞: 保護
- 輸入: player:p1(玩家 1), player:p2(玩家 2)
- effects: 玩家 1／2 保護；玩家 1／2 醉酒（二選一）
- template: `{actor} → {action} → {p1} & {p2}`
- 例句:

```
小華【01.旅店老闆】保護 小明【03.水手】 小美【04.賭徒】
└ 小明【03.水手】保護
└ 小美【04.賭徒】保護
└ 小美【04.賭徒】醉酒
```

- 備註: 兩人皆保護；其中一人醉酒（預設勾選其一）


### goon | 莽夫

- team: `outsider`
- 能力: 每個夜晚，首個使用其自身能力選擇了你的玩家會醉酒直到下個黃昏。你會轉變為他的陣營。
- 規則: enabled=是, activation=optional
- 時機: trigger
- 影響: status, alignment
- 對象: both
- 觸發: 每晚首位以能力選中你的玩家醉酒，你轉為其陣營
- 動詞: (無)
- 輸入: player:target(玩家)
- effects: 玩家 醉酒、莽夫 轉變為[陣營]（可選）
- template: `{actor} 被 {target} 選擇`
- 例句:

```
小華【01.莽夫】被 小明【03.普卡】選擇
└ 小明【03.普卡】醉酒
└ 小華【01.莽夫】轉變為[邪惡]
```

- 備註: 被動紀錄；醉酒的是選中莽夫的玩家；陣營轉變可選



### devilsadvocate | 魔鬼代言人

- team: `minion`
- 能力: 每個夜晚，你要選擇一名存活的玩家（與上個夜晚不同）：如果明天白天他被處決，他不會死亡。
- 規則: enabled=是
- 時機: everyNight
- 影響: special
- 對象: other
- 觸發: (無)
- 動詞: 選擇
- 輸入: player:target(目標對象)
- effects: 目標對象 處決保護
- template: `{actor} → {action} → 選擇 {target}`
- 例句:

```
1.
小華【01.魔鬼代言人】選擇 小明【03.水手】
└ 小明【03.水手】處決保護
2.
小明【03.水手】被處決
└ 小華【01.魔鬼代言人】：小明【03.水手】倖免
```

- 備註: 不可與昨晚同目標；例 2 為處決敘事（可選）



### fool | 弄臣

- team: `townsfolk`
- 能力: 當你首次將要死亡時，你不會死亡。
- 規則: enabled=是, activation=optional
- 時機: once, trigger
- 影響: life, special
- 對象: self
- 觸發: 第一次「死亡」時不會死
- 動詞: (無)
- 輸入: (無)
- effects: 自身 無能力
- template: `{actor}第一次死亡`
- 例句:

```
小華【01.弄臣】第一次死亡
└ 倖免，小華【01.弄臣】失去能力
```

- 備註: 被動；「失去能力」後不再觸發



### matron | 女舍監

- team: `traveler`
- 能力: 每個白天，你可以選擇至多三對玩家交換座位。玩家不能離開座位私聊。
- 規則: enabled=是, activation=optional
- 時機: trigger
- 影響: special
- 對象: other
- 觸發: 白天可換至多三對座位；不可離座密談
- 動詞: (無)
- 輸入: (無)（座位互換可自由記述）
- effects: (無)
- template: `{actor}互換座位`
- 例句:

```
小華【01.女舍監】互換座位：小明↔小美、小強↔小芳
```

- 備註: 可選紀錄；影響座位與密談規則


### po | 珀

- team: `demon`
- 能力: 每個夜晚*，你可以選擇一名玩家：他死亡。如果你上次選擇時沒有選擇任何玩家，當晚你要選擇三名玩家：他們死亡。
- 規則: enabled=是
- 時機: fromNight2
- 影響: life
- 對象: other
- 觸發: (無)
- 動詞: 殺害
- 輸入: （單殺）alivePlayer:target；（跳過）無；（三殺）alivePlayer:p1/p2/p3
- effects: 目標死亡、目標掛死亡標記；（跳過）自身 攻擊x3
- template: （見三卡：單殺／跳過／三殺）
- 例句:

```
1.
小華【01.珀】殺害 小明【03.水手】
└ 小明【03.水手】死亡
2.
小華【01.珀】沒有選擇任何玩家
└ 小華【01.珀】攻擊x3
3.
小華【01.珀】殺害 小明【03.水手】 小美【04.賭徒】 小強【05.弄臣】
└ 小明【03.水手】死亡
└ 小美【04.賭徒】死亡
└ 小強【05.弄臣】死亡
```

- 備註: 跳過後隔晚必須三殺；攻擊x3 掛在珀自身



### pukka | 普卡

- team: `demon`
- 能力: 每個夜晚，你要選擇一名玩家：他中毒。上個因你的能力中毒的玩家會死亡並恢復健康。
- 規則: enabled=是
- 時機: everyNight
- 影響: status, life
- 對象: other
- 觸發: (無)
- 動詞: 投毒
- 輸入: alivePlayer:target(新中毒目標), player:prev(上夜中毒者（可空）)
- effects: 新目標 中毒、上夜中毒者死亡
- template: `{actor} → {action} → 選擇 {target} → {target} 中毒`
- 例句:

```
小華【01.普卡】投毒 小明【03.水手】
└ 小明【03.水手】中毒
└ 小美【04.賭徒】死亡（先前中毒）
```

- 備註: 新選中毒；上夜中毒者今晚死亡（首夜通常無 prev）


### exorcist | 驅魔人

- team: `townsfolk`
- 能力: 每個夜晚*，你要選擇一名玩家（與上個夜晚不同）：如果你選中了惡魔，他會得知你是驅魔人，但他當晚不會因其自身能力而被喚醒。
- 規則: enabled=是
- 時機: fromNight2
- 影響: info, special
- 對象: other
- 觸發: (無)
- 動詞: 選擇
- 輸入: player:target(目標對象)
- effects: 目標對象 已選擇；（可選）惡魔玩家 得知驅魔人
- template: `{actor} → {action} → 選擇 {target}`
- 例句:

```
小華【01.驅魔人】選擇 小明【03.小惡魔】
└ 小明【03.小惡魔】已選擇
└ 小明【03.小惡魔】得知驅魔人
```

- 備註: 不可與昨晚同目標；命中惡魔才勾選得知



### shabaloth | 沙巴洛斯

- team: `demon`
- 能力: 每個夜晚*，你要選擇兩名玩家：他們死亡。你上個夜晚選擇過且當前死亡的玩家之一可能會被你反芻。
- 規則: enabled=是
- 時機: fromNight2
- 影響: life
- 對象: other
- 觸發: (無)
- 動詞: 殺害
- 輸入: alivePlayer:p1(玩家 1), alivePlayer:p2(玩家 2), player:revived(反芻復活（可空）)
- effects: 玩家 1／2 死亡；（可選）反芻復活
- template: `{actor} → {action} → {p1} & {p2}`
- 例句:

```
小華【01.沙巴洛斯】殺害 小明【03.水手】 小美【04.賭徒】
└ 小明【03.水手】死亡
└ 小美【04.賭徒】死亡
└ （可選）小強【05.弄臣】復活
```

- 備註: 殺兩人；可能反芻上夜選過且當前死亡者之一


### courtier | 侍臣

- team: `townsfolk`
- 能力: 每局遊戲限一次，在夜晚時，你可以選擇一個角色：如果該角色在場，該角色之一從當晚開始醉酒三天三夜。
- 規則: enabled=是
- 時機: once, everyNight
- 影響: status
- 對象: other
- 觸發: 每局一次選擇角色；其玩家醉酒三天三夜
- 動詞: 選擇
- 輸入: role:r1(選擇角色), player:target(在場則醉酒的玩家（可空）)
- effects: 醉酒標記 醉酒 3（首晚）、醉酒 2、醉酒 1
- template: `{actor} → {action} → [{r1}] → {target} 醉酒`
- 例句:

```
小華【01.侍臣】選擇 [小惡魔]
└ 小明【03.小惡魔】醉酒 3
```

- 備註: 先選角色；在場才掛醉酒 3 並逐日遞減



### chambermaid | 侍女

- team: `townsfolk`
- 能力: 每個夜晚，你要選擇除你以外的兩名存活的玩家：你會得知他們中有幾人在當晚因其自身能力而被喚醒。
- 規則: enabled=是
- 時機: everyNight
- 影響: info
- 對象: other
- 觸發: (無)
- 動詞: 得知
- 輸入: otherPlayer:p1(玩家 1), otherPlayer:p2(玩家 2), number:num(醒來人數 0/1/2)
- effects: (無)
- template: `{actor} → {action} → {p1} & {p2} 中有 [{num}] 位因自身能力醒來`
- 例句:

```
小華【01.侍女】得知 小明【03.水手】 小美【04.賭徒】中有 [1] 位因自身能力醒來
```

- 備註: 選兩名存活他玩家；回 0/1/2



### sailor | 水手

- team: `townsfolk`
- 能力: 每個夜晚，你要選擇一名存活的玩家：你或他之一會醉酒直到下個黃昏。你不會死亡。
- 規則: enabled=是
- 時機: everyNight
- 影響: status, special
- 對象: both
- 觸發: (無)
- 動詞: 選擇
- 輸入: alivePlayer:target(目標對象)
- effects: 目標 醉酒、自身 醉酒（二選一）
- template: `{actor} → {action} → 選擇 {target}`
- 例句:

```
1.
小華【01.水手】選擇 小明【03.賭徒】
└ 小明【03.賭徒】醉酒
2.
小華【01.水手】選擇 小明【03.賭徒】
└ 小華【01.水手】醉酒
```

- 備註: 你或目標之一醉酒；水手不會死（被動）



### voudon | 巫毒師

- team: `traveler`
- 能力: 只有你和死亡的玩家可以投票，且投票不需要使用投票標記。忽略票數需要過半的要求。
- 規則: enabled=(無規則)
- 時機: trigger
- 影響: special
- 對象: both
- 觸發: 僅己與死者可投票；死者票無代幣／無門檻
- 動詞: (無)
- 輸入: (無)
- effects: (無)
- template: ``
- 例句:

```
(無)
```

- 備註: 旅行者被動；影響投票規則



### tinker | 修補匠

- team: `outsider`
- 能力: 你隨時可能死亡。
- 規則: enabled=是
- 時機: fromNight2, trigger
- 影響: life
- 對象: self
- 觸發: 隨時可能死亡（說書人裁定）
- 動詞: (無)
- 輸入: (無)
- effects: (無)
- template: `{actor}死亡`
- 例句:

```
小華【01.修補匠】死亡
```

- 備註: 可無主動選擇；隨時可能死亡



### apprentice | 學徒

- team: `traveler`
- 能力: 在你的首個夜晚，如果你是善良的，你會獲得一個鎮民角色的能力；如果你是邪惡的，你會獲得一個爪牙角色的能力。
- 規則: enabled=是
- 時機: firstOnly
- 影響: role, special
- 對象: self
- 觸發: (無)
- 動詞: 獲得
- 輸入: role:r1(獲得的能力角色)
- effects: 換成獲得能力的角色代幣、自身 是學徒
- template: `{actor} → {action} → [{r1}] 能力`
- 例句:

```
小華【01.學徒】獲得 [水手] 能力
└ 小華【01.水手】是學徒
```

- 備註: 善→鎮民能力／邪→爪牙能力；換代幣+標記



### minstrel | 吟遊詩人

- team: `townsfolk`
- 能力: 當一名爪牙死於處決時，除了你和旅行者以外的所有其他玩家醉酒直到明天黃昏。
- 規則: enabled=是, activation=optional
- 時機: trigger
- 影響: status
- 對象: both
- 觸發: 有爪牙被處決
- 動詞: (無)
- 輸入: player:target(被處決的爪牙（可空）)
- effects: 自身 所有人醉酒
- template: `{target}被處決 → {actor}觸發全員醉酒`
- 例句:

```
小明【03.刺客】被處決
└ 小華【01.吟遊詩人】觸發：除了自己和旅行者以外全員醉酒至明天黃昏
```

- 備註: 白天觸發；標記「所有人醉酒」



### moonchild | 月之子

- team: `outsider`
- 能力: 當你得知你死亡時，你要公開選擇一名存活的玩家。如果他是善良的，在當晚他會死亡。
- 規則: enabled=是, activation=optional
- 時機: trigger, fromNight2
- 影響: life
- 對象: other
- 觸發: 得知自己死亡時公開選一名存活玩家；若善良則當晚死亡
- 動詞: 選擇
- 輸入: alivePlayer:target(目標對象)
- effects: 目標死亡、目標掛死亡標記
- template: `{actor}死亡時選擇 {target}`
- 例句:

```
小華【01.月之子】死亡時選擇 小明【03.水手】
└ 小明【03.水手】死亡
```

- 備註: 目標善良才死；邪惡可關 effect



### gossip | 造謠者

- team: `townsfolk`
- 能力: 每個白天，你可以公開發表一個聲明。如果該聲明正確，在當晚會有一名玩家死亡。
- 規則: enabled=是
- 時機: fromNight2, trigger
- 影響: life
- 對象: other
- 觸發: 白天公開聲明；當晚若正確則一名玩家死亡
- 動詞: 聲明／殺害
- 輸入: （白天）text:note(聲明內容)；（夜晚）alivePlayer:target(死者)
- effects: 目標死亡、目標掛死亡標記
- template: （見雙卡）`{actor} → 聲明 → {note}`／`{actor} → 殺害 → {target}`
- 例句:

```
1.
小華【01.造謠者】聲明 → 場上有三名外來者
2.
小華【01.造謠者】殺害 小明【03.水手】
└ 小明【03.水手】死亡
```

- 備註: 聲明正確才夜殺；夜裡由說書人選死者


### bishop | 主教

- team: `traveler`
- 能力: 只有說書人可以發起提名。每個白天說書人至少要提名一名你對立陣營的玩家。
- 規則: enabled=是
- 時機: trigger
- 影響: special
- 對象: both
- 觸發: 僅說書人可提名；每天至少提名一名不同陣營者
- 動詞: (無)
- 輸入: player:target(目標對象)
- effects: 自身 提名善良、自身 提名邪惡
- template: `{actor} → {action} → 選擇 {target}`
- 例句:

```
(無)
```

- 備註: 旅行者被動；提名流程由說書人執行；通常 (無)



### mastermind | 主謀

- team: `minion`
- 能力: 如果惡魔因為死於處決而因此導致遊戲結束時，再額外進行一個夜晚和一個白天。在那個白天如果有玩家被處決，他的陣營落敗。
- 規則: enabled=是, activation=optional
- 時機: trigger
- 影響: special
- 對象: both
- 觸發: 惡魔被處決後遊戲多一日；再有人處決則其陣營敗
- 動詞: (無)
- 輸入: player:target(翌日被處決的玩家（可空）), select:align(落敗陣營)
- effects: (無)
- template: （雙卡）`惡魔被處決，觸發主謀能力：遊戲再進行一天`／`{target}被處決，因為主謀能力導致[{align}]陣營落敗`
- 例句:

```
1.
惡魔被處決，觸發主謀能力：遊戲再進行一天
2.
小明【03.水手】被處決，因為主謀能力導致[善良]陣營落敗
```

- 備註: 可選紀錄


### grandmother | 祖母

- team: `townsfolk`
- 能力: 在你的首個夜晚，你會得知一名善良玩家和他的角色。如果惡魔殺死了他，你也會死亡。
- 規則: enabled=是
- 時機: firstOnly, trigger
- 影響: info, life, special
- 對象: other
- 觸發: 孫子被惡魔殺死 → 祖母死亡
- 動詞: 得知
- 輸入: player:p1(目標玩家), role:r1(對應角色)
- effects: 目標玩家 孫子
- template: `{actor} → {action} → {p1} → {r1}`
- 例句:

```
1.
小華【01.祖母】得知 小明【03.水手】是 [水手]
└ 小明【03.水手】孫子
2.
小明【03.水手】被惡魔殺害
└ 小華【01.祖母】死亡
```

- 備註: 首夜得知孫子；孫子被惡魔殺害時祖母連坐死亡

