/* Below 768 the fluid type scale tracks vmax, not vw -- so the same 390px-wide
   phone renders different type at different viewport HEIGHTS. Verified here by
   holding the width and varying the height. */
import { chromium } from 'playwright';
const b = await chromium.launch();
console.log('viewport      hero-h1   display    lead      body     menu-link');
for (const [w,h] of [[390,844],[390,900],[390,600],[414,896],[768,900],[768,600],[1440,900],[1440,1200]]) {
  const p = await b.newPage({ viewport:{width:w,height:h} });
  await p.goto('https://www.matchbox.health/', { waitUntil:'networkidle' });
  await p.addStyleTag({content:'.preFade,[class*="preFade"],.sqs-block{opacity:1!important;transform:none!important;visibility:visible!important}'});
  await p.waitForTimeout(500);
  const r = await p.evaluate(() => {
    const vis = s => [...document.querySelectorAll(s)].filter(e => e.getBoundingClientRect().width > 0);
    const bt = (s,t) => vis(s).find(e => (e.textContent||'').replace(/\s+/g,' ').trim().startsWith(t));
    const fs = e => e ? parseFloat(getComputedStyle(e).fontSize) : null;
    return [fs(bt('h1','Matchbox is an open')), fs(bt('h2','Your tooling')),
            fs(vis('.list-item-content__description p')[0]),
            fs(bt('p','ahdis ag')), fs(document.querySelector('.header-menu-nav-item a'))];
  });
  const unit = Math.max(w,h)/100, vw = w/100;
  const coef = v => v==null ? '   -   ' : ((v-16)/unit).toFixed(3).padStart(7);
  const coefw = v => v==null ? '   -   ' : ((v-16)/vw).toFixed(3).padStart(7);
  console.log(`${String(w+'x'+h).padEnd(10)} ${r.map(v=>String(v??'-').padStart(8)).join('')}`);
  console.log(`   /vmax:  ${r.map(coef).join(' ')}`);
  console.log(`   /vw:    ${r.map(coefw).join(' ')}`);
  await p.close();
}
await b.close();
