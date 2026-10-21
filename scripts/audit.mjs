import {readFileSync,readdirSync,existsSync,statSync} from 'node:fs';
import assert from 'node:assert/strict';
import {join} from 'node:path';
const walk=p=>readdirSync(p).flatMap(n=>statSync(join(p,n)).isDirectory()?walk(join(p,n)):[join(p,n)]);
const plain=s=>s.replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/\s+/g,' ').trim();
const pages=walk('dist').filter(p=>p.endsWith('.html'));
let faq=0;const titles=new Set();
for(const p of pages){
 const s=readFileSync(p,'utf8'),title=s.match(/<title>([^<]+)<\/title>/)?.[1];
 assert(title&&!titles.has(title),p+' unique title');titles.add(title);
 assert.equal((s.match(/<h1(?:\s|>)/g)||[]).length,1,p+' H1');
 assert.match(s,/<meta name="description" content="[^"]+"/,p+' description');
 assert.match(s,/<link rel="canonical" href="https:\/\/huaqiaofishmarket.com\//,p+' canonical');
 assert(!/\/Users\/|GSC|Search Console|api.open-meteo|marine-api|tide-high|market-exterior|pic_A12|39,447/.test(s),p+' stale/private references');
 assert(s.includes('https://creativecommons.org/licenses/by-sa/4.0/'),p+' CC licence');
 assert(s.includes('https://admin.taiwan.net.tw/English/Others/Articles?a=106'),p+' government licence');
 assert(s.includes('2020-09-06')&&s.includes('2022-01-01'),p+' photo dates');
 for(const m of s.matchAll(/(?:href|src)="(\/[^"#?]*)(?:[^\"]*)"/g))assert(existsSync('dist'+m[1])||existsSync('dist'+m[1]+'/index.html'),p+' missing '+m[1]);
 for(const m of s.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)){
  const schema=JSON.parse(m[1]);assert(!schema.aggregateRating&&!schema.openingHours&&!schema.openingHoursSpecification&&schema.isAccessibleForFree===undefined,p+' unsupported schema');
  if(schema['@type']==='FAQPage'){
   const details=[...s.matchAll(/<details[^>]*>\s*<summary[^>]*>([\s\S]*?)<\/summary>\s*<p[^>]*>([\s\S]*?)<\/p>\s*<\/details>/g)].map(m=>[plain(m[1]),plain(m[2])]);assert.deepEqual(details,schema.mainEntity.map(x=>[plain(x.name),plain(x.acceptedAnswer.text)]),p+' FAQ');faq+=details.length;
  }
 }
 if(p.endsWith('/404.html'))assert(s.includes('noindex'),p+' noindex');
 if(!/\/(privacy|terms|cookies)\//.test(p)&&!p.endsWith('/404.html'))for(const v of ['09:00–18:30','11:00–20:00','12:00–20:00','39,645'])assert(s.includes(v),p+' source comparison '+v);
}
const map=readFileSync('dist/sitemap-0.xml','utf8');assert.equal((map.match(/<loc>/g)||[]).length,7);assert(!map.includes('404'));assert.equal(pages.length,8);
console.log(`PASS ${pages.length} pages;7 original sitemap routes; unique metadata, resources, source comparison, exact photo credits and ${faq} matched FAQ pairs.`);
