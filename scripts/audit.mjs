import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const root = new URL('..', import.meta.url).pathname;
const walk = (dir) => readdirSync(dir).flatMap((n) => { const p = join(dir,n); return statSync(p).isDirectory() ? walk(p) : [p]; });
const targets = [join(root,'src'), join(root,'public')].filter(existsSync).flatMap(walk);
const bad = /example\.com|localhost|chrome-extension:\/\//i;
const hits = targets.filter((p) => bad.test(readFileSync(p,'utf8')));
if (hits.length) { console.error('禁止內容：', hits); process.exit(1); }
const config = readFileSync(join(root,'astro.config.mjs'),'utf8');
if (!config.includes("const SITE = '';")) throw new Error('SITE 唯一設定點遺失');
if (existsSync(join(root,'pnpm-workspace.yaml'))) throw new Error('單包專案不應出現 pnpm-workspace.yaml');
console.log('靜態稽核通過：無占位/非法協定、SITE 單一設定點、無 workspace。');
