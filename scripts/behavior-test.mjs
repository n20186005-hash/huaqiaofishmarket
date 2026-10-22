import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import worker from '../worker.mjs';
let assetCalls=0;const env={ASSETS:{fetch:async()=>{assetCalls++;return new Response('missing',{status:404});}}};
for(const u of ['http://huaqiaofishmarket.com/privacy/?q=1','https://www.huaqiaofishmarket.com/privacy/?q=1']){const r=await worker.fetch(new Request(u),env);assert.equal(r.status,301);assert.equal(r.headers.get('location'),'https://huaqiaofishmarket.com/privacy/?q=1');}
let r=await worker.fetch(new Request('https://huaqiaofishmarket.com/cookies?q=1'),env);assert.equal(r.headers.get('location'),'https://huaqiaofishmarket.com/cookies/?q=1');r=await worker.fetch(new Request('https://huaqiaofishmarket.com/missing'),env);assert.equal(r.status,404);assert.equal(await r.text(),'missing');assert.match(r.headers.get('X-Robots-Tag'),/noindex/);assert.equal(assetCalls,1);
await import('./consent-test.mjs');
const code=readFileSync('public/consent.js','utf8');
// Legacy cookie JSON values do not become new grants; inaccessible cookie cleanup cannot crash the page.
for(const cookieValue of ['null','{"analytics":"yes"}','{"analytics":true}']){
 const scripts=[];const win={name:'',addEventListener(){}};const doc={getElementById:id=>scripts.find(s=>s.id===id),createElement:()=>({}),head:{appendChild:s=>scripts.push(s)}};
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
