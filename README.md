# 東港華僑市場非營利旅遊指南

為屏東縣東港鎮「東港漁港漁產品直銷中心（原華僑市場）」製作的獨立非營利景點資訊網站。主站為單頁式深度落地頁，另有隱私權政策、服務條款與 Cookie 設定三個獨立二級頁面。

## 技術版本

- Astro `7.2.4`
- Tailwind CSS `4.3.3` + `@tailwindcss/vite` `4.3.3`
- TypeScript `6.0.3`（落在 `@astrojs/check@0.9.10` 的 `^5.0.0 || ^6.0.0` 支援範圍）
- pnpm `11.23.0`
- Node.js `24.19.0` LTS
- Cloudflare Wrangler `4.125.0`（部署指令精確鎖定）
- 無資料庫、無登入、無 CMS

所有 `package.json` 直接依賴都使用精確版本；`pnpm-lock.yaml` 與直接依賴同步。此單包專案不需要 `pnpm-workspace.yaml`。

## 網域唯一設定點

只需修改 `astro.config.mjs` 內的 `SITE`。未設定正式網域時保留空字串即可正常建置；此時 canonical、絕對 Open Graph URL、絕對 JSON-LD URL 與 sitemap 會省略，不會使用占位網域。設定正式 HTTPS 網域後，`@astrojs/sitemap` 才會啟用。

## 開發與檢查

```bash
corepack enable
CI=1 corepack pnpm install --frozen-lockfile
pnpm check
pnpm build
pnpm run audit
pnpm run audit:language
```

## Cloudflare Workers Static Assets

`wrangler.jsonc` 以 Workers Static Assets 發佈 Astro 靜態輸出：

```bash
pnpm build
pnpm deploy
```

## GA4 與 Cookie

測量 ID 為 `G-HXM22WWPKP`。分析腳本預設不載入；只有使用者在 `/cookies/` 明確允許分析型 Cookie 後才動態載入。本站不使用行銷／個人化廣告追蹤。

## 圖片

實景照片使用公共觀光資料與可標示授權的 Wikimedia Commons 圖片。由於本次執行環境無法解析外部圖片主機 DNS，照片保留為受控來源的 HTTPS URL，而非偽造本地檔；來源與授權說明見 `IMAGE-CREDITS.md`。在可連線的建置環境執行 `pnpm vendor:photos` 即可把三張實景照片下載到 `public/images/`；主頁建置時會自動優先使用本地檔案，無須再改程式碼。


## 版本新鮮度說明

本次研究時 npm 已顯示 Astro `7.2.6` 為最新穩定版；但目前執行環境無法連線 npm registry，無法為剛發布版本重新產生可驗證的 `pnpm-lock.yaml`。為避免手工偽造 lockfile，本交付保留已同步驗證的 Astro `7.2.4` 鎖檔組合。這是目前唯一已知的『最新穩定版』偏差，詳見 `DELIVERY-CHECK.md`。在可連線環境應先升級 Astro 並重新鎖檔，再完成最終 CI。
