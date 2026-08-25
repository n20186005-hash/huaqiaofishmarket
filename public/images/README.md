# 實景照片本地化

此資料夾預留以下真實照片檔名：

- `market-exterior.jpg` — 交通部觀光署「東港漁港漁產品直銷中心（華僑市場）」公開景點照片
- `donggang-harbor.jpg` — Wikimedia Commons「屏東縣東港漁港.jpg」，作者雅婕，CC BY-SA 4.0
- `dapeng-bay-bridge.jpg` — Wikimedia Commons「Dapeng Bay National Scenic Area, Tourism Administration 1.jpg」，來源／作者交通部觀光署，政府網站資料開放宣告

在可連線的建置環境執行：

```bash
pnpm vendor:photos
```

主頁會在建置時自動偵測上述本地檔案；存在時優先使用 `/images/` 本地路徑，不存在時才退回已標示來源的 HTTPS 原始圖片。這樣不需要手動修改 Astro 原始碼。

完整授權與來源說明請見根目錄 `IMAGE-CREDITS.md`。
