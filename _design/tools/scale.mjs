/* Samples font-size of the VISIBLE landmarks across widths and fits
   size = a + b*vw above the 768px breakpoint. Squarespace's scale is fluid
   above 768 and fixed below, with a discontinuity at the boundary, so the two
   regimes are reported separately. */
import { chromium } from 'playwright';
const WIDTHS = [390, 480, 767, 768, 1024, 1280, 1440, 1920];
const b = await chromium.launch();
const rows = {};
for (const w of WIDTHS) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  await p.goto('https://www.matchbox.health/', { waitUntil: 'networkidle' });
  await p.addStyleTag({content:'.preFade,[class*="preFade"],.sqs-block{opacity:1!important;transform:none!important;visibility:visible!important}'});
  await p.evaluate(async()=>{await new Promise(r=>{let y=0;const t=setInterval(()=>{window.scrollTo(0,y+=500);if(y>document.body.scrollHeight){clearInterval(t);r();}},30);});window.scrollTo(0,0);});
  await p.waitForTimeout(700);
  rows[w] = await p.evaluate(() => {
    const vis = s => [...document.querySelectorAll(s)].filter(e => e.getBoundingClientRect().width > 1);
    const byText = (s,t) => vis(s).find(e => (e.textContent||'').replace(/\s+/g,' ').trim().startsWith(t));
    const g = e => e ? [parseFloat(getComputedStyle(e).fontSize), parseFloat(getComputedStyle(e).lineHeight)] : null;
    return {
      'hero-h1'      : g(byText('h1','Matchbox is an open')),
      'eyebrow'      : g(byText('p','Product Features')),
      'list-title'   : g(vis('.list-item-content__description p')[0] || byText('p','Validation of FHIR')),
      'body'         : g(byText('p','Need to test') || vis('.list-item-content__description')[0]),
      'tagline-h2'   : g(byText('h2','Your tooling')),
      'btn-hero'     : g(byText('a','Contact Us')),
      'btn-features' : g(byText('a','Features in Detail')),
      'nav'          : g(vis('.header-nav-item a')[0]),
      'footer-p'     : g(byText('p','© ahdis') || byText('p','ahdis ag')),
    };
  });
  await p.close();
}
await b.close();
const keys = Object.keys(rows[1440]).filter(k => rows[1440][k]);
console.log('font-size by width');
console.log('  landmark      ' + WIDTHS.map(w=>String(w).padStart(9)).join(''));
for (const k of keys)
  console.log('  ' + k.padEnd(14) + WIDTHS.map(w => (rows[w][k] ? rows[w][k][0].toFixed(3) : '-').padStart(9)).join(''));
console.log('\nfit above 768:  size = a + b*vw     (vw = width/100)');
for (const k of keys) {
  const A = rows[1024][k], B = rows[1920][k]; if (!A || !B) continue;
  const bcoef = (B[0]-A[0]) / ((1920-1024)/100);
  const a = A[0] - bcoef*10.24;
  const pred = w => a + bcoef*w/100;
  const err = [768,1280,1440].map(w => rows[w][k] ? Math.abs(pred(w)-rows[w][k][0]) : 0);
  const lhr = (rows[1440][k][1]/rows[1440][k][0]).toFixed(4);
  console.log(`  ${k.padEnd(14)} ${a.toFixed(3).padStart(7)}px + ${bcoef.toFixed(4)}vw   maxerr=${Math.max(...err).toFixed(4)}  lh=${lhr}  |  <768 fixed=${rows[390][k]?rows[390][k][0].toFixed(4):'-'} lh=${rows[390][k]?(rows[390][k][1]/rows[390][k][0]).toFixed(4):'-'}  @480=${rows[480][k]?rows[480][k][0].toFixed(4):'-'} @767=${rows[767][k]?rows[767][k][0].toFixed(4):'-'}`);
}
