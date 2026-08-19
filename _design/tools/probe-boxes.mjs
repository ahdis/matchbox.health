/* Dumps the visible box tree of one section so column widths, gaps and
   alignment are read off the live page rather than guessed. */
import { chromium } from 'playwright';
const vp = process.env.VP === 'mobile' ? {width:390,height:844} : {width:1440,height:900};
const path = process.argv[2] || '/';
const root = process.argv[3] || 'main';
const b = await chromium.launch();
const p = await b.newPage(); await p.setViewportSize(vp);
await p.goto((process.env.BASE||'https://www.matchbox.health') + path, { waitUntil:'networkidle' });
await p.addStyleTag({content:'.preFade,[class*="preFade"],.sqs-block{opacity:1!important;transform:none!important;visibility:visible!important}'});
await p.evaluate(async()=>{await new Promise(r=>{let y=0;const t=setInterval(()=>{window.scrollTo(0,y+=500);if(y>document.body.scrollHeight){clearInterval(t);r();}},30);});window.scrollTo(0,0);});
await p.waitForTimeout(900);
const lines = await p.evaluate((rootSel) => {
  const out = []; const seen = new Set();
  const walk = (el, d) => {
    if (d > 14) return;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;                 // hidden duplicate chrome
    const c = getComputedStyle(el);
    const cls = (el.className||'').toString().split(/\s+/).filter(Boolean).slice(0,3).join('.');
    const key = `${r.x},${r.y},${r.width},${r.height}`;
    const interesting = c.display.includes('flex') || c.display.includes('grid') || el.tagName === 'IMG'
      || c.padding !== '0px' || c.gap !== 'normal' || !seen.has(key);
    seen.add(key);
    if (interesting)
      out.push(`${'  '.repeat(d)}${el.tagName.toLowerCase()}${cls?'.'+cls:''} `
        + `[${Math.round(r.x)},${Math.round(r.y+scrollY)} ${Math.round(r.width)}x${Math.round(r.height)}] `
        + `${c.display}${c.gap!=='normal'?' gap:'+c.gap:''}`
        + `${c.padding!=='0px'?' pad:'+c.padding:''}${c.margin!=='0px'?' mar:'+c.margin:''}`
        + `${c.maxWidth!=='none'?' maxw:'+c.maxWidth:''}`
        + `${c.gridTemplateColumns&&c.gridTemplateColumns!=='none'?' cols:'+c.gridTemplateColumns:''}`);
    for (const ch of el.children) walk(ch, d+1);
  };
  document.querySelectorAll(rootSel).forEach(e => walk(e, 0));
  return out;
}, root);
console.log(`${path} @ ${vp.width}px  root=${root}`);
console.log(lines.join('\n'));
await b.close();
