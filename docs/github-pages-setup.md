# GitHub Pages 上線步驟（繁中）

魔典**前端**在 GitHub Pages；Render 只跑 WebSocket。

**魔典網址：** https://eden0102lee.github.io/BOTC_GrimoireTool_TW/

---

## 第一次啟用（只需做一次）

1. 開啟 repo：https://github.com/eden0102lee/BOTC_GrimoireTool_TW  
2. 上方分頁點 **Settings**（設定）  
3. 左側選 **Pages**  
4. **Build and deployment** → **Source** 選 **GitHub Actions**（不是 Deploy from a branch）  
5. 上方分頁點 **Actions**  
6. 左側選 **Deploy to GitHub Pages**  
7. 右側 **Run workflow** → 分支選 **main** → **Run workflow**  
8. 等約 2–5 分鐘，重新整理 **Settings → Pages**，應顯示「Your site is live at …」

## 可選：WebSocket 位址 Secret

**Settings → Secrets and variables → Actions → New repository secret**

| Name | Value |
| --- | --- |
| `VUE_APP_WS_URL` | `wss://botc-grimoiretool-tw.onrender.com/` |

未設定時 workflow 會用上述預設值。

## 之後更新

push 到 `main` 會自動重新部署；或到 **Actions** 手動 **Run workflow**。

## 常見問題

| 狀況 | 處理 |
| --- | --- |
| Settings 裡沒有 Pages | 確認 repo 是 Public，或帳號有 Pages 權限 |
| Actions 裡沒有 workflow | 確認 `.github/workflows/deploy.yml` 已在 `main` 分支 |
| 網址 404 | Source 是否已改為 **GitHub Actions** 且 workflow 已成功 |
| 有畫面但無法連線 | 檢查 Render 的 `ALLOWED_ORIGINS=https://eden0102lee.github.io` |
