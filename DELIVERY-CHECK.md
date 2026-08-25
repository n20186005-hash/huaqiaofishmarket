# 交付前檢查紀錄

## 已完成的靜態檢查

- `package.json` 所有直接依賴均為精確版本，且與 `pnpm-lock.yaml` importer 一致。
- Node.js 透過 `.node-version` 與 `engines` 固定為 `24.19.0` LTS；pnpm 透過 `packageManager` 與 `engines` 固定為 `11.23.0`。
- TypeScript `6.0.3` 位於 `@astrojs/check@0.9.10` 的支援範圍 `^5.0.0 || ^6.0.0`。
- 單包專案沒有 `pnpm-workspace.yaml`。
- 正式網域只在 `astro.config.mjs` 的 `SITE` 一處設定；空值時 sitemap 整合停用，canonical／`og:url`／站內 JSON-LD URL 不製造占位網域。
- Google 地圖嵌入已從簡體中文參數改為繁體中文／台灣：`zh-TW`、`tw`。
- 隱私權政策、服務條款、Cookie 設定皆為獨立二級頁面，不是彈窗。
- GA4 `G-HXM22WWPKP` 只有在分析同意後才動態載入；本站不啟用行銷／個人化廣告追蹤。
- 主要頁面文案統一為繁體中文（台灣用語）。
- 原始碼靜態稽核未發現 `example.com`、`localhost`、`chrome-extension://`。
- `pnpm run audit` 與 `pnpm run audit:language` 對原始碼等價的 Node 腳本已在本環境直接執行通過（因 pnpm 本體無法下載，使用 `node scripts/...` 執行）。

## 版本新鮮度例外

研究時 npm 已顯示 Astro `7.2.6` 為最新穩定版，且發布時間只有數小時。本容器無法連線 npm registry，因此無法取得該版套件與其完整解析結果，也無法產生可驗證、同步的新版 `pnpm-lock.yaml`。為避免把手工修改的 lockfile 當成真實解析結果，專案保留已同步的 Astro `7.2.4`。

因此，**Astro 版本目前不滿足「開發時最新穩定版」這一項的字面要求**。在有 npm 網路的環境應先執行 Astro 升級並重新產生 lockfile，再做最終驗收。

其他目前選用的核心版本：Tailwind CSS `4.3.3`、pnpm `11.23.0`、Node.js `24.19.0` LTS、TypeScript `6.0.3`。

## 乾淨環境 CI 實際執行狀態

已先刪除 `node_modules`、`dist`、`.astro`，並實際執行：

```bash
CI=1 corepack pnpm install --frozen-lockfile
```

目前執行容器只有 Node.js `22.16.0`，且外部 DNS 無法解析 `registry.npmjs.org`。Corepack 在取得固定版 pnpm `11.23.0` 時以 `EAI_AGAIN` 中止；原始輸出保留在 `ci-install.log`。

因此本容器無法誠實標示以下步驟已完成：

```bash
pnpm check
pnpm build
```

也因沒有產生 `dist`，無法對「構建產物」做最後 grep 或檢查生成 sitemap。這些不是被隱藏的成功項目，而是明確的環境阻斷。

## 在可連線的正式驗收環境請執行

先把 `package.json` 的 Astro 更新到當時最新穩定版並重新產生同步 lockfile，然後：

```bash
rm -rf node_modules dist .astro
CI=1 corepack pnpm install --frozen-lockfile
pnpm check
pnpm build
pnpm run audit
pnpm run audit:language
! grep -RIE 'example\.com|localhost|chrome-extension://' dist
! grep -RIE '<lastmod>|lastmod' dist
```

若 `SITE` 仍為空字串，依設計不產生 sitemap；填入正式網域後重新建置，才檢查 sitemap 所有 URL 是否使用該正式網域且不含編造的 `lastmod`。

## 圖片本地化狀態

本次容器也無法直接下載外部圖片主機，因此目前三張實景照片在源碼中保留授權明確的 HTTPS 來源，並提供 `pnpm vendor:photos`。下載成功後，主頁在建置時會自動優先使用 `public/images/` 本地照片；若本地檔不存在才使用外部來源。Logo 與 favicon 已全部本地化。
