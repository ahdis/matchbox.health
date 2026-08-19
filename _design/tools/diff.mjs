/* Matches landmarks between live and local BY TEXT (never by selector, since
   the DOMs differ) and reports x / width / y / height / font-size deltas.
   Target: dx=0 dw=0 everywhere first, then converge y and h. */
import { chromium } from 'playwright';
const LOCAL = process.env.LOCAL || 'http://localhost:8081';
const vp = process.env.VP === 'mobile' ? {width:390,height:844} : {width:1440,height:900};
const path = process.argv[2] || '/';

const probe = () => {
  const out = [];
  const norm = s => (s||'').replace(/\s+/g,' ').trim();
  const seen = new Map();
  const add = (label, e) => {
    if (!e) return;
    const r = e.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;           // hidden duplicate chrome
    // the original keeps its closed menu overlay laid out at opacity 0, which
    // would otherwise pair against the rebuild's footer links
    if (e.closest('.header-menu, .menu, .sqs-cookie-banner-v2, .consent')) return;
    for (let a = e; a; a = a.parentElement)
      if (getComputedStyle(a).opacity === '0' || getComputedStyle(a).visibility === 'hidden') return;
    const n = (seen.get(label) || 0) + 1; seen.set(label, n);
    const c = getComputedStyle(e);
    out.push({ label: n > 1 ? `${label}#${n}` : label,
      x:Math.round(r.x), y:Math.round(r.y+scrollY), w:Math.round(r.width), h:Math.round(r.height),
      fs:+parseFloat(c.fontSize).toFixed(2), col:c.color, bg:c.backgroundColor });
  };
  // headings, paragraphs, links-as-buttons, images and the chrome landmarks
  for (const e of document.querySelectorAll('h1,h2,h3,h4,p,address,li'))
    add('t:' + norm(e.textContent).slice(0,34).toLowerCase(), e);
  for (const e of document.querySelectorAll('a')) {
    const t = norm(e.textContent);
    if (t) add('a:' + t.slice(0,26).toLowerCase(), e);
  }
  const imgs = [...document.querySelectorAll('img')]
    .filter(e => e.getBoundingClientRect().width > 1)
    .sort((p, q) => p.getBoundingClientRect().top - q.getBoundingClientRect().top);
  imgs.forEach((e, i) => add('img' + i, e));
  add('header', document.querySelector('header,#header'));
  add('footer', document.querySelector('footer,#footer-sections'));
  for (const e of document.querySelectorAll('section.page-section, main > .section'))
    add('section', e);
  return out;
};

const shoot = async (b, url) => {
  const p = await b.newPage(); await p.setViewportSize(vp);
  await p.goto(url, { waitUntil:'networkidle' });
  await p.addStyleTag({content:'.preFade,[class*="preFade"],.sqs-block{opacity:1!important;transform:none!important;visibility:visible!important}.consent,[class*="cookie"]{display:none!important}'});
  await p.evaluate(async()=>{await new Promise(r=>{let y=0;const t=setInterval(()=>{window.scrollTo(0,y+=500);if(y>document.body.scrollHeight){clearInterval(t);r();}},30);});window.scrollTo(0,0);});
  await p.waitForTimeout(900);
  const r = await p.evaluate(probe);
  const h = await p.evaluate(() => document.body.scrollHeight);
  await p.close(); return { rows: r, h };
};

const b = await chromium.launch();
const L = await shoot(b, 'https://www.matchbox.health' + path);
const R = await shoot(b, LOCAL + path);
await b.close();

const map = o => Object.fromEntries(o.rows.map(r => [r.label, r]));
const a = map(L), c = map(R);
console.log(`${path} @ ${vp.width}px    live ${L.h}  local ${R.h}  delta ${R.h-L.h}`);
console.log('  landmark                         dx    dw    dy    dh   dfs  note');
let bad = 0;
for (const k of Object.keys(a)) {
  const x = a[k], y = c[k];
  if (!y) { console.log(`  ${k.slice(0,32).padEnd(32)}   --  missing locally`); bad++; continue; }
  const d = [y.x-x.x, y.w-x.w, y.y-x.y, y.h-x.h];
  const dfs = +(y.fs-x.fs).toFixed(2);
  const note = (y.col!==x.col ? ` col ${x.col}->${y.col}` : '')
             + (y.bg!==x.bg && (x.bg!=='rgba(0, 0, 0, 0)'||y.bg!=='rgba(0, 0, 0, 0)') ? ` bg ${x.bg}->${y.bg}` : '');
  if (d.some(v => Math.abs(v) > 1) || Math.abs(dfs) > 0.2 || note) {
    console.log(`  ${k.slice(0,32).padEnd(32)}` + d.map(v=>String(v).padStart(6)).join('') + String(dfs).padStart(6) + note);
    bad++;
  }
}
const extra = Object.keys(c).filter(k => !a[k]);
if (extra.length) console.log('  only local: ' + extra.slice(0,12).join(', '));
console.log(`  ${bad} landmark(s) off, ${Object.keys(a).length} compared`);
