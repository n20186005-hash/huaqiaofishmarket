import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const outDir = resolve('public/images');
await mkdir(outDir, { recursive: true });

const photos = [
  ['market-exterior.jpg', 'https://www.taiwan.net.tw/att/1/big_scenic_spots/pic_A12-00342_14.jpg'],
  ['donggang-harbor.jpg', 'https://upload.wikimedia.org/wikipedia/commons/9/9a/%E5%B1%8F%E6%9D%B1%E7%B8%A3%E6%9D%B1%E6%B8%AF%E6%BC%81%E6%B8%AF.jpg'],
  ['dapeng-bay-bridge.jpg', 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Dapeng_Bay_National_Scenic_Area%2C_Tourism_Administration_1.jpg'],
];

for (const [name, url] of photos) {
  const response = await fetch(url, {
    headers: { 'User-Agent': 'DonggangHuaqiaoGuide/1.0 (non-profit educational guide)' },
  });
  if (!response.ok) throw new Error(`${name}: HTTP ${response.status}`);
  const type = response.headers.get('content-type') || '';
  if (!type.startsWith('image/')) throw new Error(`${name}: 非圖片內容 ${type}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 10_000) throw new Error(`${name}: 檔案異常過小 (${bytes.length} bytes)`);
  await writeFile(resolve(outDir, name), bytes);
  console.log(`${name}: ${bytes.length} bytes`);
}

console.log('真實照片已下載；請依 public/images/README.md 將頁面圖片 URL 改成本地路徑後再建置。');
