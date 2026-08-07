# Contributing

本專案是 [bra1n/townsquare](https://github.com/bra1n/townsquare) 的繁中／LAN fork（GPL-3.0）。貢獻前請先閱讀 [Code of Conduct](CODE_OF_CONDUCT.md)。

## 開發

需要 Node.js **18.x**。

```bash
npm install
npm run serve          # 前端
npm run serve:ws       # WebSocket（另開終端）
# 或一鍵本機 LAN：
npm start
```

變更應通過 `npm run lint`。請勿提交 `dist/`、`node_modules/`。

## Pull Request

- 在功能分支開發，對準預設分支開 PR
- 說明變更目的與測試方式
- 若影響行為或部署，更新 `CHANGELOG.md`／`README.md`

## 維護腳本（資料同步）

玩家開服不需要這些指令；維護角色／戰報規則時使用：

| 指令 | 用途 |
| --- | --- |
| `npm run sync:characters` | CSV → roles JSON |
| `npm run sync:official` | botc-release 官方角色 |
| `npm run sync:script-tool` | 官方劇本工具圖示／文案 |
| `npm run export:skill-cards` / `apply:skill-cards` | 戰報技能卡 markdown ↔ 互動規則 |

Issue／PR：<https://github.com/eden0102lee/BOTC_GrimoireTool_TW/issues>
