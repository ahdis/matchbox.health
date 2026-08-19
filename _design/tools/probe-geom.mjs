/* Section and chrome geometry on the live site. Sections are transparent --
   the colour is painted by a .section-background child -- and the header band
   by div.header-background-*, so both are queried on the child, not the parent. */
import { chromium } from 'playwright';
const vp = process.env.VP === 'mobile' ? {width:390,height:844} : {width:1440,height:900};
const path = process.argv[2] || '/';
const b = await chromium.launch();
const p = await b.newPage(); await p.setViewportSize(vp);
await p.goto('https://www.matchbox.health' + path, { waitUntil: 'networkidle' });
await p.addStyleTag({content:'.preFade,[class*="preFade"],.sqs-block{opacity:1!important;transform:none!important;visibility:visible!important}'});
await p.evaluate(async()=>{await new Promise(r=>{let y=0;const t=setInterval(()=>{window.scrollTo(0,y+=500);if(y>document.body.scrollHeight){clearInterval(t);r();}},30);});window.scrollTo(0,0);});
await p.waitForTimeout(900);
const out = await p.evaluate(() => {
  const R = e => { const r = e.getBoundingClientRect(); return {x:Math.round(r.x),y:Math.round(r.y+scrollY),w:Math.round(r.width),h:Math.round(r.height)}; };
  const o = { header:null, band:null, sections:[], footer:null, body:document.body.scrollHeight };
  const hdr = document.querySelector('#header,header');
  if (hdr) { const c = getComputedStyle(hdr); o.header = {...R(hdr), bg:c.backgroundColor, position:c.position}; }
  // the coloured strip behind the header is a separate painted div
  for (const el of document.querySelectorAll('[class*="header-background"]')) {
    const c = getComputedStyle(el);
    if (c.backgroundColor !== 'rgba(0, 0, 0, 0)') { o.band = {cls:el.className.trim(), ...R(el), bg:c.backgroundColor}; break; }
  }
  document.querySelectorAll('section.page-section').forEach((s,i) => {
    const c = getComputedStyle(s);
    const bg = s.querySelector('.section-background');
    const cw = s.querySelector('.content-wrapper');
    const ct = s.querySelector('.content');
    o.sections.push({ i, theme:s.getAttribute('data-section-theme'),
      ...R(s), color:c.color,
      bg: bg ? getComputedStyle(bg).backgroundColor : null,
      wrapPad: cw ? [getComputedStyle(cw).paddingTop, getComputedStyle(cw).paddingBottom,
                     getComputedStyle(cw).paddingLeft, getComputedStyle(cw).paddingRight].join(' ') : null,
      contentRect: ct ? R(ct) : null });
  });
  const f = document.querySelector('#footer-sections');
  if (f) o.footer = R(f);
  return o;
});
console.log(`${path} @ ${vp.width}px   body=${out.body}`);
console.log('  header ', JSON.stringify(out.header));
console.log('  band   ', JSON.stringify(out.band));
for (const s of out.sections)
  console.log(`  [${s.i}] ${String(s.theme).padEnd(11)} y=${String(s.y).padStart(5)} h=${String(s.h).padStart(4)} bg=${s.bg} fg=${s.color}\n        pad(t b l r)=${s.wrapPad}  content=${JSON.stringify(s.contentRect)}`);
console.log('  footer ', JSON.stringify(out.footer));
await b.close();
