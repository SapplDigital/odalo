import { createRequire } from 'node:module';
const require = createRequire('C:/Users/basti/source/repos/odalo/odalo/');
const { chromium } = require('@playwright/test');
import fs from 'node:fs';
const B='http://localhost:4321';
const langs=['es','en','de'];
const paths=['','plans/','work/','about/','audit/','services/web/','services/local/','services/video/','services/ads/','work/sample-hotel/','work/sample-clinic/','work/sample-shop/','privacy/','cookies/','legal/'];
const urls=['/', '/404.html', '/nonexistent/', ...langs.flatMap(l=>paths.map(p=>`/${l}/${p}`))];
const br=await chromium.launch({channel:'msedge'});
const ctx=await br.newContext({storageState:{cookies:[],origins:[{origin:B,localStorage:[{name:'odalo.cookies',value:'essential'}]}]}});
const out=[]; const seen=new Map();
for(const u of urls){
  const p=await ctx.newPage(); const fails=[]; const cons=[];
  p.on('requestfailed',r=>fails.push(r.url())); p.on('response',r=>{if(r.status()>=400)fails.push(r.status()+' '+r.url())});
  p.on('console',m=>{if(['error','warning'].includes(m.type()))cons.push(m.text().slice(0,200))});
  const r=await p.goto(B+u,{waitUntil:'networkidle'}).catch(e=>null);
  await p.waitForTimeout(300);
  const d=await p.evaluate(()=>({
    title:document.title, lang:document.documentElement.lang, h1:[...document.querySelectorAll('h1')].map(h=>h.textContent.trim()),
    desc:document.querySelector('meta[name=description]')?.content, canon:document.querySelector('link[rel=canonical]')?.href,
    alts:[...document.querySelectorAll('link[rel=alternate]')].map(l=>l.hreflang+'='+l.href), robots:document.querySelector('meta[name=robots]')?.content,
    og:document.querySelector('meta[property="og:image"]')?.content,
    links:[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')),
    imgs:[...document.querySelectorAll('img')].map(i=>({src:i.getAttribute('src'),alt:i.alt})),
    svgs:document.querySelectorAll('svg').length, text:document.body.innerText, ow:document.documentElement.scrollWidth-innerWidth,
    empties:[...document.querySelectorAll('a[href="#"],a[href=""],a:not([href])')].length
  }));
  out.push({u,status:r?.status(),...d,fails,cons}); await p.close();
}
fs.writeFileSync(process.env.TEMP+'/crawl.json',JSON.stringify(out,null,1));
// internal link check
const all=new Set(); for(const o of out) for(const l of o.links){ if(l.startsWith('/')&&!l.startsWith('//')) all.add(l.split('#')[0]||'/'); }
const bad=[]; for(const l of all){ const r=await ctx.request.get(B+l); if(r.status()>=400) bad.push(l+' '+r.status()); }
console.log('internal links',all.size,'bad',bad);
for(const o of out) console.log(o.status,o.u,'|',o.lang,'|',o.title,'|h1:',o.h1.length,'|ow',o.ow,'|fails',o.fails.length,'|cons',o.cons.length,'|noindex',o.robots||'');
await br.close();
