import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import worker from '../worker.mjs';
let assetCalls=0;const env={ASSETS:{fetch:async()=>{assetCalls++;return new Response('missing',{status:404});}}};
for(const u of ['http://huaqiaofishmarket.com/privacy/?q=1','https://www.huaqiaofishmarket.com/privacy/?q=1']){const r=await worker.fetch(new Request(u),env);assert.equal(r.status,301);assert.equal(r.headers.get('location'),'https://huaqiaofishmarket.com/privacy/?q=1');}
let r=await worker.fetch(new Request('https://huaqiaofishmarket.com/cookies?q=1'),env);assert.equal(r.headers.get('location'),'https://huaqiaofishmarket.com/cookies/?q=1');r=await worker.fetch(new Request('https://huaqiaofishmarket.com/missing'),env);assert.equal(r.status,404);assert.equal(await r.text(),'missing');assert.match(r.headers.get('X-Robots-Tag'),/noindex/);assert.equal(assetCalls,1);
const code=readFileSync('public/consent.js','utf8');
let raw=JSON.stringify({analytics:true}), writable=true, session={};
const storage={getItem:()=>raw,setItem:(k,v)=>{if(!writable)throw Error('blocked');if(k==='huaqiao-consent-v2')raw=v;},removeItem:()=>{if(!writable)throw Error('blocked');}};
const sessionStorage={getItem:k=>session[k]||null,setItem:(k,v)=>{session[k]=v},removeItem:k=>{delete session[k]}};
function page(name=''){const scripts=[];const window={name};const document={documentElement:{lang:"en"},getElementById:id=>scripts.find(s=>s.id===id),createElement:()=>({}),head:{appendChild:s=>scripts.push(s)}};vm.runInNewContext(code,{window,document,localStorage:storage,sessionStorage});return {window,scripts};}
let p=page();assert.equal(p.scripts.length,1);writable=false;assert.equal(p.window.huaqiaoConsent.save(false),false);assert.equal(p.window['ga-disable-G-HXM22WWPKP'],true);
let next=page(p.window.name);assert.equal(next.scripts.length,0);assert.equal(next.window['ga-disable-G-HXM22WWPKP'],true);assert.equal(JSON.parse(raw).analytics,true);
// Even if session/name cannot carry the tombstone, blocked writes refuse a stale grant.
session={};next=page();assert.equal(next.scripts.length,0);assert.equal(next.window.huaqiaoConsent.save(true),false);assert.equal(next.scripts.length,1);assert.equal(page().scripts.length,0);
writable=true;const chosen=page();chosen.window.huaqiaoConsent.save(false);assert.equal(page(chosen.window.name).scripts.length,0);chosen.window.huaqiaoConsent.save(true);assert.equal(page(chosen.window.name).scripts.length,1);
storage.getItem=()=>{throw Error('blocked read')};assert.equal(page().scripts.length,0);
console.log('PASS Worker 301/query/ASSETS404; consent immediate refusal, failed writes and stale grants across pages.');
// Refusal must survive same-tab navigation even when session storage is unavailable.
raw=JSON.stringify({analytics:true});writable=true;storage.getItem=()=>raw;
sessionStorage.getItem=()=>{throw Error('session blocked')};sessionStorage.setItem=()=>{throw Error('session blocked')};sessionStorage.removeItem=()=>{throw Error('session blocked')};
p=page();assert.equal(p.scripts.length,1);writable=false;p.window.huaqiaoConsent.save(false);writable=true;next=page(p.window.name);assert.equal(next.scripts.length,0);assert.equal(next.window['ga-disable-G-HXM22WWPKP'],true);
console.log('PASS session-storage failure: window-name veto prevents stale-grant recovery in same tab.');
// Banner controls remain usable when both reads and writes throw.
const ui=Object.fromEntries(['cookie-banner','cookie-banner-status','cookies-essential','cookies-accept'].map(id=>[id,{attrs:{},handlers:{},setAttribute(k,v){this.attrs[k]=v},addEventListener(k,v){this.handlers[k]=v}}]));
const scripts=[];const win={name:''};
vm.runInNewContext(code,{window:win,document:{documentElement:{lang:"en"},getElementById:id=>ui[id]||scripts.find(s=>s.id===id),createElement:()=>({}),head:{appendChild:s=>scripts.push(s)}},localStorage:{getItem(){throw Error('blocked')},setItem(){throw Error('blocked')},removeItem(){throw Error('blocked')}},sessionStorage});
assert.equal(ui['cookie-banner'].attrs['data-open'],'true');
ui['cookies-essential'].handlers.click();assert.equal(win['ga-disable-G-HXM22WWPKP'],true);assert.equal(scripts.length,0);assert.match(ui['cookie-banner-status'].textContent,/無法儲存/);
ui['cookies-accept'].handlers.click();assert.equal(scripts.length,1);assert.match(ui['cookie-banner-status'].textContent,/無法儲存/);
console.log('PASS banner storage exceptions: rejection disables immediately; explicit grant only; failure is visible.');
// Same-page allow -> deny -> allow must change effective consent while retaining one loader.
raw=JSON.stringify({analytics:true});writable=true;storage.getItem=()=>raw;
const roundtrip=page();
assert.equal(roundtrip.scripts.length,1);
roundtrip.window.huaqiaoConsent.save(false);
assert.equal(roundtrip.window['ga-disable-G-HXM22WWPKP'],true);
let events=roundtrip.window.dataLayer.map(args=>Array.from(args));
assert.equal(events.filter(e=>e[0]==='consent'&&e[1]==='update').at(-1)[2].analytics_storage,'denied');
roundtrip.window.huaqiaoConsent.save(true);
assert.equal(roundtrip.window['ga-disable-G-HXM22WWPKP'],false);
events=roundtrip.window.dataLayer.map(args=>Array.from(args));
assert.equal(events.filter(e=>e[0]==='consent'&&e[1]==='update').at(-1)[2].analytics_storage,'granted');
assert.equal(roundtrip.scripts.length,1);
assert.equal(events.filter(e=>e[0]==='config').length,1);
for(const saved of ['null','{}','[]','false','1','"bad"','{']){raw=saved;assert.equal(page().scripts.length,0,saved);}
console.log('PASS actual consent update allow/deny/reallow with one loader/config and no reload; null/malformed JSON fails closed.');
// Legacy cookie JSON values do not become new grants; inaccessible cookie cleanup cannot crash the page.
for(const cookieValue of ['null','{"analytics":"yes"}','{"analytics":true}']){
 const scripts=[];const win={name:''};const doc={getElementById:id=>scripts.find(s=>s.id===id),createElement:()=>({}),head:{appendChild:s=>scripts.push(s)}};
 Object.defineProperty(doc,'cookie',{get:()=>`huaqiao_consent=${encodeURIComponent(cookieValue)}`,set:()=>{throw Error('cookie write blocked')}});
 vm.runInNewContext(code,{window:win,document:doc,localStorage:{getItem:()=>null,setItem(){},removeItem(){}},sessionStorage:{getItem:()=>null,setItem(){},removeItem(){}}});
 assert.equal(scripts.length,0);assert.equal(win['ga-disable-G-HXM22WWPKP'],true);
}
console.log('PASS old cookie null/truthy/true ignored for new grant; cookie-write exception is nonfatal.');
// Exercise actual mobile menu event code extracted from the delivered layout source.
const layout=readFileSync('src/layouts/BaseLayout.astro','utf8');
const menuScript=[...layout.matchAll(/<script is:inline>([\s\S]*?)<\/script>/g)].find(m=>m[1].includes('mobile-menu-toggle'))?.[1];assert(menuScript);
const button={expanded:'false',addEventListener(type,handler){assert.equal(type,'click');this.click=handler},getAttribute(){return this.expanded},setAttribute(k,v){assert.equal(k,'aria-expanded');this.expanded=v}};
const menu={hidden:true,toggleAttribute(k,value){assert.equal(k,'hidden');this.hidden=value}};
vm.runInNewContext(menuScript,{document:{getElementById:id=>id==='mobile-menu-toggle'?button:menu},navigator:{},window:{}});
button.click({currentTarget:button});assert.equal(button.expanded,'true');assert.equal(menu.hidden,false);
button.click({currentTarget:button});assert.equal(button.expanded,'false');assert.equal(menu.hidden,true);
console.log('PASS delivered mobile-menu script opens/closes controlled navigation and updates aria-expanded.');
