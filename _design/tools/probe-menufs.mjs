import { chromium } from 'playwright';
const b = await chromium.launch();
console.log(' w    h   menu-fs   /vw    /vmin');
for (const [w,h] of [[360,800],[390,844],[414,896],[500,800],[540,800],[560,800],[600,800],[640,800],[700,800],[767,800],[767,600]]) {
  const p = await b.newPage({ viewport:{width:w,height:h} });
  await p.goto('https://www.matchbox.health/', { waitUntil:'networkidle' });
  await p.waitForTimeout(400);
  const v = await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.header-menu-nav-item a')).fontSize));
  console.log(`${String(w).padStart(4)} ${String(h).padStart(4)} ${v.toFixed(3).padStart(8)} ${(v/(w/100)).toFixed(3).padStart(7)} ${(v/(Math.min(w,h)/100)).toFixed(3).padStart(7)}`);
  await p.close();
}
await b.close();
