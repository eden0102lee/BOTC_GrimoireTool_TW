# 戰報互動規則盤點

> 自動產生：`node scripts/generate-interaction-inventory.js`  
> 最後更新：2026-08-05

## 摘要

| 狀態 | 數量 | 說明 |
| --- | ---: | --- |
| complete | 93 | 已有完整互動規則（inputs + effects + 句子） |
| inputs-only | 32 | 有規則但僅輸入／資訊類，無魔典連動 |
| draft-available | 0 | roleInputConfig 有專屬欄位，可一鍵建草稿 |
| fallback-default-target | 0 | 夜動但僅預設「目標對象」，需補 effects |
| passive | 0 | 被動／setup，無夜動卡片 |
| no-night-order | 27 | 無 firstNight/otherNight |
| passive-rule | 4 | 規則標記為被動 |

## 內建完整規則（種子）

- **雜技演員** (`acrobat`) — effects: 目標死亡、目標掛死亡標記
- **鍊金術士** (`alchemist`) — effects: 自身 是煉金術士
- **氣球駕駛員** (`balloonist`) — effects: 標記 已得知(爪牙)、標記 已得知(外來者)、標記 已得知(惡魔)、標記 已得知(旅行者)、標記 已得知(鎮民)
- **報喪女妖** (`banshee`) — effects: 自身 具有能力
- **賞金獵人** (`bountyhunter`) — effects: 目標對象 已得知
- **食人族** (`cannibal`) — effects: 自身中毒、最後被處死（參考）
- **侍臣** (`courtier`) — effects: 醉酒標記 醉酒 1、醉酒標記 醉酒 2、醉酒標記 醉酒 3
- **賣花女孩** (`flowergirl`) — effects: 自身 惡魔投票、自身 惡魔未投票
- **賭徒** (`gambler`) — effects: 目標死亡、目標掛死亡標記
- **造謠者** (`gossip`) — effects: 目標對象 死亡
- **祖母** (`grandmother`) — effects: 目標玩家 孫子
- **旅店老闆** (`innkeeper`) — effects: 玩家 1 保護、玩家 2 醉酒
- **調查員** (`investigator`) — effects: 玩家 1 爪牙、玩家 2 非爪牙
- **雜耍藝人** (`juggler`) — effects: 自身 正確
- **騎士** (`knight`) — effects: 玩家 1 已得知
- **圖書管理員** (`librarian`) — effects: 玩家 1 外來者、玩家 2 非外來者
- **半獸人** (`lycanthrope`) — effects: 目標死亡、目標掛死亡標記、目標對象 假爪
- **數學家** (`mathematician`) — effects: 自身 異常
- **鎮長** (`mayor`) — effects: 代替死亡
- **吟遊詩人** (`minstrel`) — effects: 自身 所有人醉酒
- **僧侶** (`monk`) — effects: 目標對象 保護
- **貴族** (`noble`) — effects: 善良玩家 1 已得知
- **哲學家** (`philosopher`) — effects: 目標對象 是哲學家、目標對象 醉酒、目標對象 Drunk、目標對象 Is the Philosopher
- **小精靈** (`pixie`) — effects: 自身 具有能力、自身 瘋狂
- **罌粟種植者** (`poppygrower`) — effects: 目標對象 邪惡相認
- **傳教士** (`preacher`) — effects: 目標對象 傳教中
- **公主** (`princess`) — effects: 目標對象 Doesn't Kill
- **教授** (`professor`) — effects: 目標對象 復活
- **水手** (`sailor`) — effects: 目標對象 醉酒
- **獵手** (`slayer`) — effects: 目標死亡、目標掛死亡標記
- **舞蛇人** (`snakecharmer`) — effects: 目標對象 中毒
- **事務官** (`steward`) — effects: 目標對象 已得知
- **茶藝師** (`tealady`) — effects: 鄰居 1 不會死、鄰居 2 不會死
- **城鎮公告員** (`towncrier`) — effects: 自身 爪牙提名、自身 爪牙未提名
- **村夫** (`villageidiot`) — effects: 目標玩家 醉酒
- **貞潔者** (`virgin`) — effects: 提名者被處決死亡、提名者掛死亡標記
- **洗衣婦** (`washerwoman`) — effects: 玩家 1 鎮民、玩家 2 非鎮民
- **理髮師** (`barber`) — effects: 玩家 1 今晚剪頭髮
- **管家** (`butler`) — effects: 目標對象 主人
- **酒鬼** (`drunk`) — effects: setRole、掛 是酒鬼 標記
- **莽夫** (`goon`) — effects: 玩家 醉酒、莽夫 轉變為[陣營]（可選）
- **帽匠** (`hatter`) — effects: 目標對象 今晚開茶會
- **隱士** (`hermit`) — effects: 能力 1、能力 2、能力 3
- **瘋子** (`lunatic`) — setup: setRole、掛 是瘋子 標記；everyNight: 目標對象 攻擊1／2／3
- **月之子** (`moonchild`) — effects: 目標對象 死亡
- **食人魔** (`ogre`) — effects: 目標對象 朋友
- **瘟疫醫生** (`plaguedoctor`) — effects: 目標對象 (說書人能力)
- **解謎大師** (`puzzlemaster`) — effects: 醉酒玩家標記
- **心上人** (`sweetheart`) — effects: 自身 醉酒
- **修補匠** (`tinker`) — effects: (無)
- **刺客** (`assassin`) — effects: 目標死亡、目標掛死亡標記
- **洗腦師** (`cerenovus`) — effects: 目標玩家 瘋狂
- **魔鬼代言人** (`devilsadvocate`) — effects: 目標對象 處決保護
- **恐懼之靈** (`fearmonger`) — effects: 目標對象 恐懼
- **教父** (`godfather`) — effects: (無)；首夜自動列出在場外來者
- **鷹身女妖** (`harpy`) — effects: 玩家 1 瘋狂、玩家 2 目標
- **提線木偶** (`marionette`) — effects: setRole、掛 是提線木偶 標記
- **靈言師** (`mezepheles`) — effects: 自身 轉為邪惡
- **街頭風琴手** (`organgrinder`) — effects: 自身 將被處決
- **麻臉巫婆** (`pithag`) — effects: 目標死亡
- **投毒者** (`poisoner`) — effects: 目標對象 中毒
- **紅唇女郎** (`scarletwoman`) — effects: 自身 是惡魔
- **召喚師** (`summoner`) — effects: 目標對象 第一晚、目標對象 第二晚、目標對象 第三晚
- **寡婦** (`widow`) — effects: 目標玩家 中毒、目標玩家 得知寡婦
- **女巫** (`witch`) — effects: 目標對象 詛咒
- **限** (`xaan`) — effects: 目標對象 第一晚、目標對象 第二晚、目標對象 第三晚、目標對象 X
- **哈迪寂亞** (`alhadikhia`) — effects: 目標死亡、玩家 1 1、玩家 2 2、玩家 3 3、玩家 1 選擇「死亡」、玩家 1 選擇「活著」
- **方古** (`fanggu`) — effects: 目標死亡、目標掛死亡標記、目標對象 第一位外來者
- **小惡魔** (`imp`) — effects: 目標死亡、目標掛死亡標記
- **卡札力** (`kazali`) — effects: 目標死亡、目標掛死亡標記
- **軍團** (`legion`) — effects: 即將處決、死亡
- **利維坦** (`leviathan`) — effects: 自身 第一天、自身 第二天、自身 第三天、自身 第四天、自身 第五天、自身 善良被處決
- **小怪寶** (`lilmonsta`) — effects: 目標死亡、目標對象 是惡魔、目標掛死亡標記
- **痢蛭** (`lleech`) — effects: 目標死亡、目標對象 中毒、目標掛死亡標記
- **堤豐之首** (`lordoftyphon`) — effects: 目標死亡、目標掛死亡標記
- **諾-達鯴** (`nodashii`) — effects: 目標死亡、目標對象 中毒、目標掛死亡標記
- **奧赫** (`ojo`) — effects: 自身 死亡
- **珀** (`po`) — effects: 目標死亡、目標對象 攻擊x3、目標掛死亡標記
- **普卡** (`pukka`) — effects: 目標死亡、目標對象 中毒、目標掛死亡標記
- **沙巴洛斯** (`shabaloth`) — effects: 目標死亡、玩家 1 復活、目標掛死亡標記
- **亡骨魔** (`vigormortis`) — effects: 目標死亡、目標對象 中毒、目標對象 具有能力、目標掛死亡標記
- **渦流** (`vortox`) — effects: 目標死亡、目標掛死亡標記
- **牙噶巴卜** (`yaggababble`) — effects: 自身 死亡
- **僵怖** (`zombuul`) — effects: 目標死亡、目標掛死亡標記
- **學徒** (`apprentice`) — effects: 目標對象 是學徒
- **咖啡師** (`barista`) — effects: 目標玩家 清醒&健康、目標玩家 能力x2
- **主教** (`bishop`) — effects: 自身 提名善良、自身 提名邪惡
- **集骨者** (`bonecollector`) — effects: 目標對象 具有能力
- **官員** (`bureaucrat`) — effects: 目標對象 票數x3
- **笑匠** (`cacklejack`) — effects: 目標對象 不是我
- **槍手** (`gunslinger`) — effects: 目標死亡、目標掛死亡標記
- **流鶯** (`harlot`) — effects: 目標死亡、目標掛死亡標記
- **竊賊** (`thief`) — effects: 目標對象 負數票

## 需優先補 effects（fallback 預設目標）

這些角色在夜序會出現能力卡，但目前只有「目標對象」輸入，尚未定義死亡／提醒等連動。


## 可從 roleInputConfig 建草稿


## 被動／無夜動卡片


## 建議下一批規則（TB 常用）

- ✅ 小惡魔 (`imp`) — 目前：complete
- ✅ 投毒者 (`poisoner`) — 目前：complete
- ✅ 僧侶 (`monk`) — 目前：complete
- ✅ 洗衣婦 (`washerwoman`) — 目前：complete
- ✅ 圖書管理員 (`librarian`) — 目前：complete
- ✅ 調查員 (`investigator`) — 目前：complete
- ⬜ 共情者 (`empath`) — 目前：inputs-only
- ⬜ 廚師 (`chef`) — 目前：inputs-only
- ⬜ 送葬者 (`undertaker`) — 目前：inputs-only
- ⬜ 守鴉人 (`ravenkeeper`) — 目前：inputs-only
- ✅ 獵手 (`slayer`) — 目前：complete
- ⬜ 間諜 (`spy`) — 目前：inputs-only
- ⬜ 男爵 (`baron`) — 目前：passive-rule
- ✅ 管家 (`butler`) — 目前：complete
- ✅ 酒鬼 (`drunk`) — 目前：complete
- ⬜ 士兵 (`soldier`) — 目前：inputs-only
- ✅ 鎮長 (`mayor`) — 目前：complete
- ✅ 貞潔者 (`virgin`) — 目前：complete

## 缺口類型 backlog

- **needs-death**：暗殺類（小惡魔、刺客變體等）→ `setDead`
- **needs-reminder:中毒**：投毒者、某些 Loric
- **needs-reminder:保護**：僧侶、某些保護類
- **info-only**：資訊類（洗衣婦、圖書館員等）→ 無 effects，僅句子
- **needs-role-change**：洗腦師、麻臉巫婆等 → 需新 effect 類型（未來）
- **passive**：報喪女妖、士兵等 → 編輯器標記 enabled:false 或空 inputs
