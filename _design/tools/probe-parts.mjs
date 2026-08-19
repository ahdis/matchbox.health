/* Geometry + type of named landmarks. Only visible elements are reported:
   Squarespace renders duplicate desktop and mobile headers, so filtering by
   width>0 is what keeps live and local element lists comparable. */
import { chromium } from 'playwright';
const vp = process.env.VP === 'mobile' ? {width:390,height:844} : {width:1440,height:900};
const path = process.argv[2] || '/';
const SEL = process.argv[3] || 'h1,h2,h3,h4,p,a.sqs-block-button-element,.header-nav-item a,figcaption,li,address';
const b = await chromium.launch();
const p = await b.newPage(); await p.setViewportSize(vp);
await p.goto((process.env.BASE || 'https://www.matchbox.health') + path, { waitUntil: 'networkidle' });
await p.addStyleTag({content:'.preFade,[class*="preFade"],.sqs-block{opacity:1!important;transform:none!important;visibility:visible!important}.consent{display:none!important}'});
await p.evaluate(async()=>{await new Promise(r=>{let y=0;const t=setInterval(()=>{window.scrollTo(0,y+=500);if(y>document.body.scrollHeight){clearInterval(t);r();}},30);});window.scrollTo(0,0);});
await p.waitForTimeout(900);
const rows = await p.evaluate((sel) => [...document.querySelectorAll(sel)].map(e => {
  const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return null;
  const c = getComputedStyle(e);
  return { tag: e.tagName.toLowerCase(),
    txt: (e.textContent||'').replace(/\s+/g,' ').trim().slice(0,44),
    x:Math.round(r.x), y:Math.round(r.y+scrollY), w:Math.round(r.width), h:Math.round(r.height),
    fs:parseFloat(c.fontSize), lh:c.lineHeight, fw:c.fontWeight, col:c.color,
    mt:c.marginTop, mb:c.marginBottom, ta:c.textAlign, ls:c.letterSpacing, tt:c.textTransform };
}).filter(Boolean), SEL);
console.log(`${path} @ ${vp.width}px`);
for (const r of rows)
  console.log(`  ${r.tag.padEnd(4)} ${String(r.x).padStart(4)},${String(r.y).padStart(5)} ${String(r.w).padStart(4)}x${String(r.h).padStart(4)}  ${String(r.fs).padStart(6)}/${r.lh.padEnd(8)} w${r.fw} ${r.ta.padEnd(6)} m${r.mt}/${r.mb} ${r.col.padEnd(20)} ${r.ls!=='normal'?'ls'+r.ls+' ':''}${r.tt!=='none'?r.tt+' ':''}"${r.txt}"`);
await b.close();
