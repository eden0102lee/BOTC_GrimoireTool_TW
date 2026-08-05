# 官方角色技能資訊卡（BMR）

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

### tealady | 茶藝師

- team: `townsfolk`
- 能力: 如果與你鄰近的兩名存活的玩家是善良的，他們不會死亡。
- 規則: enabled=是
- 時機: (請填)
- 影響: special
- 對象: (請填)
- 觸發: (無)
- 動詞: 殺害
- 輸入: player:target(目標對象)
- effects: 自身 不會死
- template: `{actor} → {action} → 選擇 {target} → {target} 死亡`
- 例句:

```
（請依規則補例句；action=殺害）
```
- 備註: passive — 無夜動喚醒，標記由說書人手動套用

### assassin | 刺客

- team: `minion`
- 能力: 每局遊戲限一次，在夜晚時*，你可以選擇一名玩家：他死亡，即使因為任何原因讓他不會死亡。
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

### gambler | 賭徒

- team: `townsfolk`
- 能力: 每個夜晚*，你要選擇一名玩家並猜測該玩家的角色：如果你猜錯了，你會死亡。
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

### judge | 法官

- team: `traveler`
- 能力: 每局遊戲限一次，如果其他玩家發起了提名，你可以選擇讓本次提名直接執行處決或讓投票無效。
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

### lunatic | 瘋子

- team: `outsider`
- 能力: 你以為你是一個惡魔，但其實你不是。惡魔知道你是瘋子以及你在每個夜晚選擇了哪些玩家。
- 規則: enabled=是
- 時機: everyNight
- 影響: special
- 對象: (請填)
- 觸發: (無)
- 動詞: 選擇
- 輸入: player:target(目標對象)
- effects: 目標對象 攻擊1、目標對象 攻擊2、目標對象 攻擊3
- template: `{actor} → {action} → 選擇 {target}`
- 例句:

```
（請依規則補例句；action=選擇）
```
- 備註: sheet:https://docs.google.com/spreadsheets/d/1RyPinE2xfHcllNpQ60pPSShaRAkmXHqv2ikxPRAjvdg/edit?gid=1544433985

### pacifist | 和平主義者

- team: `townsfolk`
- 能力: 被處決的善良玩家可能不會死亡。
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

### zombuul | 僵怖

- team: `demon`
- 能力: 每個夜晚*，如果今天白天沒有人死亡，你會被喚醒並要選擇一名玩家：他死亡。當你首次死亡後，你仍存活，但會被當作死亡。
- 規則: enabled=是
- 時機: fromNight2
- 影響: life, special
- 對象: (請填)
- 觸發: (無)
- 動詞: 殺害
- 輸入: player:target(目標對象)
- effects: 目標死亡、目標對象 今天死亡、目標掛死亡標記
- template: `{actor} → {action} → 選擇 {target}`
- 例句:

```
（請依規則補例句；action=殺害）
```
- 備註: sheet:https://docs.google.com/spreadsheets/d/1RyPinE2xfHcllNpQ60pPSShaRAkmXHqv2ikxPRAjvdg/edit?gid=1544433985

### godfather | 教父

- team: `minion`
- 能力: 在你的首個夜晚，你會得知有哪些外來者角色在場。如果有外來者在白天死亡，你會在當晚被喚醒並且你要選擇一名玩家：他死亡。[-1或+1外來者]
- 規則: enabled=是
- 時機: setup, everyNight
- 影響: special, info
- 對象: (請填)
- 觸發: (無)
- 動詞: 得知
- 輸入: player:target(目標對象)
- effects: 外來者死亡（今日）、目標死亡標記
- template: `{actor} → {action} → 選擇 {target} → {target} 死亡`
- 例句:

```
（請依規則補例句；action=得知）
```
- 備註: sheet:https://docs.google.com/spreadsheets/d/1RyPinE2xfHcllNpQ60pPSShaRAkmXHqv2ikxPRAjvdg/edit?gid=1544433985

### professor | 教授

- team: `townsfolk`
- 能力: 每局遊戲限一次，在夜晚時*，你可以選擇一名死亡的玩家：如果他是鎮民，你會將他起死回生。
- 規則: enabled=是
- 時機: fromNight2
- 影響: special
- 對象: (請填)
- 觸發: (無)
- 動詞: 殺害
- 輸入: player:target(目標對象)
- effects: 目標對象 復活
- template: `{actor} → {action} → 選擇 {target} → {target} 死亡`
- 例句:

```
（請依規則補例句；action=殺害）
```
- 備註: sheet:https://docs.google.com/spreadsheets/d/1RyPinE2xfHcllNpQ60pPSShaRAkmXHqv2ikxPRAjvdg/edit?gid=1544433985

### innkeeper | 旅店老闆

- team: `townsfolk`
- 能力: 每個夜晚*，你要選擇兩名玩家：他們當晚不會死亡，但其中一人會醉酒到下個黃昏。
- 規則: enabled=是
- 時機: fromNight2
- 影響: status, special
- 對象: (請填)
- 觸發: (無)
- 動詞: 保護
- 輸入: player:p1(玩家 1), player:p2(玩家 2)
- effects: 玩家 1 保護、玩家 2 醉酒
- template: `{actor} → {action} → {p1} & {p2}`
- 例句:

```
（請依規則補例句；action=保護）
```
- 備註: sheet:https://docs.google.com/spreadsheets/d/1RyPinE2xfHcllNpQ60pPSShaRAkmXHqv2ikxPRAjvdg/edit?gid=1544433985

### goon | 莽夫

- team: `outsider`
- 能力: 每個夜晚，首個使用其自身能力選擇了你的玩家會醉酒直到下個黃昏。你會轉變為他的陣營。
- 規則: enabled=是
- 時機: (請填)
- 影響: status
- 對象: (請填)
- 觸發: (無)
- 動詞: 選擇
- 輸入: player:target(目標對象)
- effects: 自身 醉酒
- template: `{actor} → {action} → 選擇 {target}`
- 例句:

```
（請依規則補例句；action=選擇）
```
- 備註: passive — 無夜動喚醒，標記由說書人手動套用

### devilsadvocate | 魔鬼代言人

- team: `minion`
- 能力: 每個夜晚，你要選擇一名存活的玩家（與上個夜晚不同）：如果明天白天他被處決，他不會死亡。
- 規則: enabled=是
- 時機: everyNight
- 影響: special
- 對象: (請填)
- 觸發: (無)
- 動詞: 選擇
- 輸入: player:target(目標對象)
- effects: 目標對象 處決保護
- template: `{actor} → {action} → 選擇 {target}`
- 例句:

```
（請依規則補例句；action=選擇）
```
- 備註: sheet:https://docs.google.com/spreadsheets/d/1RyPinE2xfHcllNpQ60pPSShaRAkmXHqv2ikxPRAjvdg/edit?gid=1544433985

### fool | 弄臣

- team: `townsfolk`
- 能力: 當你首次將要死亡時，你不會死亡。
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

### matron | 女舍監

- team: `traveler`
- 能力: 每個白天，你可以選擇至多三對玩家交換座位。玩家不能離開座位私聊。
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

### po | 珀

- team: `demon`
- 能力: 每個夜晚*，你可以選擇一名玩家：他死亡。如果你上次選擇時沒有選擇任何玩家，當晚你要選擇三名玩家：他們死亡。
- 規則: enabled=是
- 時機: fromNight2
- 影響: life, special
- 對象: (請填)
- 觸發: (無)
- 動詞: 殺害
- 輸入: player:target(目標對象)
- effects: 目標死亡、目標對象 攻擊x3、目標掛死亡標記
- template: `{actor} → {action} → 選擇 {target} → {target} 死亡`
- 例句:

```
（請依規則補例句；action=殺害）
```
- 備註: sheet:https://docs.google.com/spreadsheets/d/1RyPinE2xfHcllNpQ60pPSShaRAkmXHqv2ikxPRAjvdg/edit?gid=1544433985

### pukka | 普卡

- team: `demon`
- 能力: 每個夜晚，你要選擇一名玩家：他中毒。上個因你的能力中毒的玩家會死亡並恢復健康。
- 規則: enabled=是
- 時機: everyNight
- 影響: life, status
- 對象: (請填)
- 觸發: (無)
- 動詞: 投毒
- 輸入: player:target(目標對象)
- effects: 目標死亡、目標對象 中毒、目標掛死亡標記
- template: `{actor} → {action} → 選擇 {target} → {target} 中毒`
- 例句:

```
（請依規則補例句；action=投毒）
```
- 備註: sheet:https://docs.google.com/spreadsheets/d/1RyPinE2xfHcllNpQ60pPSShaRAkmXHqv2ikxPRAjvdg/edit?gid=1544433985

### exorcist | 驅魔人

- team: `townsfolk`
- 能力: 每個夜晚*，你要選擇一名玩家（與上個夜晚不同）：如果你選中了惡魔，他會得知你是驅魔人，但他當晚不會因其自身能力而被喚醒。
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

### shabaloth | 沙巴洛斯

- team: `demon`
- 能力: 每個夜晚*，你要選擇兩名玩家：他們死亡。你上個夜晚選擇過且當前死亡的玩家之一可能會被你反芻。
- 規則: enabled=是
- 時機: fromNight2
- 影響: life, special
- 對象: (請填)
- 觸發: (無)
- 動詞: 殺害
- 輸入: player:p1(玩家 1), player:p2(玩家 2)
- effects: 目標死亡、玩家 1 復活、目標掛死亡標記
- template: `{actor} → {action} → {p1} & {p2}`
- 例句:

```
（請依規則補例句；action=殺害）
```
- 備註: sheet:https://docs.google.com/spreadsheets/d/1RyPinE2xfHcllNpQ60pPSShaRAkmXHqv2ikxPRAjvdg/edit?gid=1544433985

### courtier | 侍臣

- team: `townsfolk`
- 能力: 每局遊戲限一次，在夜晚時，你可以選擇一個角色：如果該角色在場，該角色之一從當晚開始醉酒三天三夜。
- 規則: enabled=是
- 時機: everyNight
- 影響: special
- 對象: (請填)
- 觸發: (無)
- 動詞: 選擇
- 輸入: player:target(醉酒玩家), role:r1(選擇角色)
- effects: 醉酒標記 醉酒 1、醉酒標記 醉酒 2、醉酒標記 醉酒 3
- template: `{actor} → {action} → 選擇 {target} → {target} 醉酒`
- 例句:

```
（請依規則補例句；action=選擇）
```
- 備註: sheet:https://docs.google.com/spreadsheets/d/1RyPinE2xfHcllNpQ60pPSShaRAkmXHqv2ikxPRAjvdg/edit?gid=1544433985

### chambermaid | 侍女

- team: `townsfolk`
- 能力: 每個夜晚，你要選擇除你以外的兩名存活的玩家：你會得知他們中有幾人在當晚因其自身能力而被喚醒。
- 規則: enabled=是
- 時機: everyNight
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

### sailor | 水手

- team: `townsfolk`
- 能力: 每個夜晚，你要選擇一名存活的玩家：你或他之一會醉酒直到下個黃昏。你不會死亡。
- 規則: enabled=是
- 時機: everyNight
- 影響: status
- 對象: (請填)
- 觸發: (無)
- 動詞: 選擇
- 輸入: player:target(目標對象)
- effects: 目標對象 醉酒
- template: `{actor} → {action} → 選擇 {target} → {target} 醉酒`
- 例句:

```
（請依規則補例句；action=選擇）
```
- 備註: sheet:https://docs.google.com/spreadsheets/d/1RyPinE2xfHcllNpQ60pPSShaRAkmXHqv2ikxPRAjvdg/edit?gid=1544433985

### voudon | 巫毒師

- team: `traveler`
- 能力: 只有你和死亡的玩家可以投票，且投票不需要使用投票標記。忽略票數需要過半的要求。
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

### tinker | 修補匠

- team: `outsider`
- 能力: 你隨時可能死亡。
- 規則: enabled=是
- 時機: fromNight2
- 影響: (請填)
- 對象: (請填)
- 觸發: (無)
- 動詞: 殺害
- 輸入: player:target(目標對象)
- effects: 目標對象 死亡
- template: `{actor} → {action} → 選擇 {target} → {target} 死亡`
- 例句:

```
（請依規則補例句；action=殺害）
```
- 備註: sheet:https://docs.google.com/spreadsheets/d/1RyPinE2xfHcllNpQ60pPSShaRAkmXHqv2ikxPRAjvdg/edit?gid=1544433985

### apprentice | 學徒

- team: `traveler`
- 能力: 在你的首個夜晚，如果你是善良的，你會獲得一個鎮民角色的能力；如果你是邪惡的，你會獲得一個爪牙角色的能力。
- 規則: enabled=是
- 時機: everyNight
- 影響: special
- 對象: (請填)
- 觸發: (無)
- 動詞: 選擇
- 輸入: player:target(目標對象)
- effects: 目標對象 是學徒
- template: `{actor} → {action} → 選擇 {target}`
- 例句:

```
（請依規則補例句；action=選擇）
```
- 備註: sheet:https://docs.google.com/spreadsheets/d/1RyPinE2xfHcllNpQ60pPSShaRAkmXHqv2ikxPRAjvdg/edit?gid=1544433985

### minstrel | 吟遊詩人

- team: `townsfolk`
- 能力: 當一名爪牙死於處決時，除了你和旅行者以外的所有其他玩家醉酒直到明天黃昏。
- 規則: enabled=是
- 時機: (請填)
- 影響: special
- 對象: (請填)
- 觸發: (無)
- 動詞: 選擇
- 輸入: player:target(目標對象)
- effects: 自身 所有人醉酒
- template: `{actor} → {action} → 選擇 {target} → {target} 醉酒`
- 例句:

```
（請依規則補例句；action=選擇）
```
- 備註: passive — 無夜動喚醒，標記由說書人手動套用

### moonchild | 月之子

- team: `outsider`
- 能力: 當你得知你死亡時，你要公開選擇一名存活的玩家。如果他是善良的，在當晚他會死亡。
- 規則: enabled=是
- 時機: fromNight2
- 影響: info
- 對象: (請填)
- 觸發: (無)
- 動詞: 得知
- 輸入: player:target(目標對象)
- effects: 目標對象 死亡
- template: `{actor} → {action} → 選擇 {target} → {target} 死亡`
- 例句:

```
（請依規則補例句；action=得知）
```
- 備註: sheet:https://docs.google.com/spreadsheets/d/1RyPinE2xfHcllNpQ60pPSShaRAkmXHqv2ikxPRAjvdg/edit?gid=1544433985

### gossip | 造謠者

- team: `townsfolk`
- 能力: 每個白天，你可以公開發表一個聲明。如果該聲明正確，在當晚會有一名玩家死亡。
- 規則: enabled=是
- 時機: fromNight2
- 影響: (請填)
- 對象: (請填)
- 觸發: (無)
- 動詞: 殺害
- 輸入: player:target(目標對象)
- effects: 目標對象 死亡
- template: `{actor} → {action} → 選擇 {target} → {target} 死亡`
- 例句:

```
（請依規則補例句；action=殺害）
```
- 備註: sheet:https://docs.google.com/spreadsheets/d/1RyPinE2xfHcllNpQ60pPSShaRAkmXHqv2ikxPRAjvdg/edit?gid=1544433985

### bishop | 主教

- team: `traveler`
- 能力: 只有說書人可以發起提名。每個白天說書人至少要提名一名你對立陣營的玩家。
- 規則: enabled=是
- 時機: (請填)
- 影響: special
- 對象: (請填)
- 觸發: (無)
- 動詞: 選擇
- 輸入: player:target(目標對象)
- effects: 自身 提名善良、自身 提名邪惡
- template: `{actor} → {action} → 選擇 {target}`
- 例句:

```
（請依規則補例句；action=選擇）
```
- 備註: passive — 無夜動喚醒，標記由說書人手動套用

### mastermind | 主謀

- team: `minion`
- 能力: 如果惡魔因為死於處決而因此導致遊戲結束時，再額外進行一個夜晚和一個白天。在那個白天如果有玩家被處決，他的陣營落敗。
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

### grandmother | 祖母

- team: `townsfolk`
- 能力: 在你的首個夜晚，你會得知一名善良玩家和他的角色。如果惡魔殺死了他，你也會死亡。
- 規則: enabled=是
- 時機: everyNight
- 影響: special, info
- 對象: (請填)
- 觸發: (無)
- 動詞: 得知
- 輸入: player:p1(目標玩家), role:r1(對應角色)
- effects: 目標玩家 孫子
- template: `{actor} → {action} → {p1} → {r1}`
- 例句:

```
（請依規則補例句；action=得知）
```
- 備註: sheet:https://docs.google.com/spreadsheets/d/1RyPinE2xfHcllNpQ60pPSShaRAkmXHqv2ikxPRAjvdg/edit?gid=1544433985

