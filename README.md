# 東港華僑市場獨立旅遊指南

保留繁體中文首頁、營業時間、停車交通、美食、隱私、條款、Cookie設定等七個正式網址與noindex404。歷史、分區、交通及設施保留官方來源脈絡；來源列表不等同當日可用性保證。

## 本地檢查

Node24、pnpm11.23.0；使用鎖定依賴，執行`pnpm check`、`pnpm build`、`node scripts/audit.mjs`、`pnpm audit:language`與`node scripts/behavior-test.mjs`。`dist/`保留忽略並由部署重新產生。工作區設定保留現有安裝建置政策。

## 部署

既有Cloudflare專案為`huaqiaofishmarket`，Wrangler4.125.0指令固定版本；Worker使用ASSETS並處理HTTP/www301、路徑查詢保留與真實404/noindex。確認新commit的正式構建、既有域名綁定及實際頁面後才算發佈驗收。原成功構建只對應原版本，程式不變更Access設定。

## 公開來源與圖片

2026-10-20地圖09:00–18:30、觀光署11:00–20:00、大鵬灣12:00–20:00分別歸因；兩官方來源列首個星期二清潔休。日期評分只出現在可見內容，不輸出aggregateRating或營業時間schema。細節見CONTENT-REVIEW.md。

歷史漁港與大鵬灣照片已本地化，明確區分市場建築與不同目的地；來源、作者、日期、授權與修改在每頁可見。見IMAGE-CREDITS.md。品牌標誌不是實景照片。

## 偏好與預報

Google Analytics須明確允許；拒絕立即生效，儲存失敗時有同分頁停用機制與限制訊息；同頁重新允許會更新有效同意且不重複載入。舊Cookie不作新的允許依據。舊SW快取退役。Google地圖獨立連線，隱私頁說明實際資料流。天氣與潮汐保留官方CWA查詢入口，不在網站推算今日高潮或提供下水安全保證。

私有分析報表和診斷保留在倉庫外。
