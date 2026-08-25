import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
const root = new URL('../src', import.meta.url).pathname;
const walk = (d) => readdirSync(d).flatMap((n)=>{const p=join(d,n);return statSync(p).isDirectory()?walk(p):[p]});
const files = walk(root).filter((p)=>/\.(astro|ts|css)$/.test(p));
const mainlandTerms = ['隐私政策','最后更新','我们收集的信息','服务条款','常见问答','停车信息','详细交通','景点'];
const hits=[];
for(const f of files){const t=readFileSync(f,'utf8'); for(const s of mainlandTerms) if(t.includes(s)) hits.push(`${f}: ${s}`)}
if(hits.length){console.error('疑似簡體中文：\n'+hits.join('\n')); process.exit(1)}
console.log('語言稽核通過：主要頁面未發現設定的簡體中文詞彙。');
