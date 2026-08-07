# 角色互動規則 LABEL 對照

依定稿 camelCase LABEL 整理（由 `scripts/apply-card-labels-to-rules.js` 產生）。

## LABEL 一覽

| LABEL | 戰報池 |
|---|---|
| `setup` | 開局設置 |
| `firstNight` / `everyNight` / `otherNight` | 夜卡 |
| `firstDay` / `everyDay` | 今日晝間能力 |
| `optional` / `trigger` / `nominate` / `death` | 可選紀錄 |
| `passive` | 通常不進池 |

`once` 為旗標，不是 LABEL。

## 全部角色

| id | 名稱 | cards |
|---|---|---|
| `ojo` | 奧赫 | otherNight |
| `lycanthrope` | 半獸人 | otherNight |
| `banshee` | 報喪女妖 | otherNight |
| `riot` | 暴亂 | otherNight |
| `tealady` | 茶藝師 | passive |
| `choirboy` | 唱詩男孩 | otherNight |
| `towncrier` | 城鎮公告員 | otherNight |
| `chef` | 廚師 | firstNight |
| `preacher` | 傳教士 | everyNight |
| `assassin` | 刺客 | otherNight:once |
| `villageidiot` | 村夫 | everyNight |
| `lordoftyphon` | 堤豐之首 | everyNight |
| `investigator` | 調查員 | firstNight |
| `gambler` | 賭徒 | otherNight |
| `fanggu` | 方古 | setup:once + otherNight |
| `lunatic` | 瘋子 | everyNight |
| `snitch` | 告密者 | firstNight |
| `engineer` | 工程師 | everyNight |
| `princess` | 公主 | otherNight |
| `empath` | 共情者 | everyNight |
| `widow` | 寡婦 | firstNight |
| `bureaucrat` | 官員 | everyNight |
| `butler` | 管家 | everyNight |
| `noble` | 貴族 | firstNight |
| `king` | 國王 | everyNight |
| `alhadikhia` | 哈迪寂亞 | otherNight |
| `scarletwoman` | 紅唇女郎 | trigger |
| `bonecollector` | 集骨者 | otherNight:once |
| `spy` | 間諜 | everyNight |
| `general` | 將軍 | everyNight |
| `zombuul` | 殭怖 | otherNight + death |
| `godfather` | 教父 | setup:once + firstNight + otherNight |
| `professor` | 教授 | otherNight:once |
| `organgrinder` | 街頭風琴手 | everyNight |
| `puzzlemaster` | 解謎大師 | everyNight |
| `eviltwin` | 鏡像雙子 | firstNight + trigger |
| `drunk` | 酒鬼 | setup:once |
| `baron` | 男爵 | setup:once |
| `legion` | 軍團 | otherNight |
| `barista` | 咖啡師 | everyNight |
| `kazali` | 卡札力 | everyNight |
| `boffin` | 科學怪人 | firstNight |
| `fearmonger` | 恐懼之靈 | everyNight |
| `barber` | 理髮師 | death |
| `leviathan` | 利維坦 | everyNight |
| `lleech` | 痢蛭 | everyNight |
| `alchemist` | 煉金術士 | firstNight |
| `mezepheles` | 靈言師 | everyNight |
| `harlot` | 流鶯 | otherNight |
| `innkeeper` | 旅店老闆 | otherNight |
| `damsel` | 落難少女 | everyNight |
| `pithag` | 麻臉巫婆 | otherNight |
| `flowergirl` | 賣花女孩 | otherNight |
| `goon` | 莽夫 | trigger |
| `hatter` | 帽匠 | otherNight |
| `devilsadvocate` | 魔鬼代言人 | everyNight |
| `magician` | 魔術師 | firstNight |
| `farmer` | 農夫 | otherNight |
| `seamstress` | 女裁縫 | everyNight:once |
| `highpriestess` | 女祭司 | everyNight |
| `witch` | 女巫 | everyNight |
| `nodashii` | 諾達鯴 | setup:once + otherNight |
| `po` | 珀 | otherNight |
| `pukka` | 普卡 | everyNight |
| `knight` | 騎士 | firstNight |
| `balloonist` | 氣球駕駛員 | everyNight |
| `thief` | 竊賊 | everyNight |
| `exorcist` | 驅魔人 | otherNight |
| `monk` | 僧侶 | otherNight |
| `shabaloth` | 沙巴洛斯 | otherNight |
| `bountyhunter` | 賞金獵人 | everyNight |
| `oracle` | 神諭者 | otherNight |
| `amnesiac` | 失憶者 | everyNight |
| `ogre` | 食人魔 | firstNight |
| `cannibal` | 食人族 | everyNight |
| `steward` | 事務官 | firstNight |
| `courtier` | 侍臣 | everyNight:once |
| `chambermaid` | 侍女 | everyNight |
| `ravenkeeper` | 守鴉人 | death |
| `nightwatchman` | 守夜人 | everyNight |
| `mathematician` | 數學家 | everyNight |
| `sailor` | 水手 | everyNight |
| `undertaker` | 送葬者 | otherNight |
| `marionette` | 提線木偶 | setup:once |
| `poisoner` | 投毒者 | everyNight |
| `librarian` | 圖書管理員 | firstNight |
| `vigormortis` | 亡骨魔 | setup:once + otherNight |
| `wraith` | 亡魂 | everyNight |
| `vizier` | 維齊爾 | firstNight |
| `plaguedoctor` | 瘟疫醫生 | otherNight |
| `vortox` | 渦流 | otherNight + trigger |
| `wizard` | 巫師 | everyNight |
| `snakecharmer` | 舞蛇人 | everyNight |
| `cerenovus` | 洗腦師 | everyNight |
| `washerwoman` | 洗衣婦 | firstNight |
| `sage` | 賢者 | death |
| `xaan` | 限 | everyNight |
| `imp` | 小惡魔 | otherNight + trigger |
| `lilmonsta` | 小怪寶 | everyNight |
| `pixie` | 小精靈 | firstNight |
| `cacklejack` | 笑匠 | otherNight |
| `sweetheart` | 心上人 | death |
| `tinker` | 修補匠 | trigger |
| `shugenja` | 修行者 | firstNight |
| `apprentice` | 學徒 | firstNight |
| `huntsman` | 巡山人 | everyNight |
| `yaggababble` | 牙嘎巴布 | everyNight |
| `cultleader` | 異教領袖 | everyNight |
| `minstrel` | 吟遊詩人 | trigger |
| `hermit` | 隱士 | everyNight |
| `poppygrower` | 罌粟種植者 | everyNight |
| `harpy` | 鷹身女妖 | everyNight |
| `moonchild` | 月之子 | death |
| `acrobat` | 雜技演員 | otherNight |
| `juggler` | 雜耍藝人 | firstDay + otherNight:once |
| `gossip` | 造謠者 | everyDay + otherNight |
| `fortuneteller` | 占卜師 | setup:once + everyNight |
| `summoner` | 召喚師 | everyNight |
| `philosopher` | 哲學家 | everyNight:once |
| `clockmaker` | 鐘錶匠 | firstNight |
| `dreamer` | 築夢師 | everyNight |
| `bishop` | 主教 | nominate |
| `grandmother` | 祖母 | firstNight + death |
| `slayer` | 獵手 | everyDay:once |
| `gunslinger` | 槍手 | everyDay |
| `soldier` | 士兵 | passive |
| `virgin` | 貞潔者 | nominate:once |
| `saint` | 聖徒 | trigger |
| `mayor` | 鎮長 | trigger |
| `judge` | 法官 | nominate:once |
| `fool` | 弄臣 | death:once |
| `pacifist` | 和平主義者 | passive |
| `mastermind` | 主謀 | trigger |
| `artist` | 藝術家 | everyDay:once |
| `savant` | 博學者 | everyDay |
| `klutz` | 呆瓜 | death |
| `matron` | 女舍監 | everyDay |
