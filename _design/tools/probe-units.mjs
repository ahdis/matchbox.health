/* vw and vmax coincide at 1440x900, so section and header padding are
   re-measured on a TALL viewport where the two units disagree. */
import { chromium } from 'playwright';
const b = await chromium.launch();
for (const [w,h] of [[1440,900],[1440,1600],[390,844],[390,1400]]) {
  const p = await b.newPage({ viewport:{width:w,height:h} });
  await p.goto('https://www.matchbox.health/', { waitUntil:'networkidle' });
  await p.waitForTimeout(500);
  const r = await p.evaluate(() => {
    const vis = s => [...document.querySelectorAll(s)].filter(e => e.getBoundingClientRect().width > 0);
    const cw = [...document.querySelectorAll('section.page-section .content-wrapper')];
    return { hdr: getComputedStyle(vis('.header-announcement-bar-wrapper')[0]).padding,
             hero: getComputedStyle(cw[0]).paddingTop,
             light: getComputedStyle(cw[2]).paddingTop,
             list: getComputedStyle(document.querySelector('.user-items-list')).paddingTop };
  });
  const vw=w/100, vmax=Math.max(w,h)/100;
  const f=(v)=>{const n=parseFloat(v); return `${n.toFixed(2)} (=${(n/vw).toFixed(2)}vw / ${(n/vmax).toFixed(2)}vmax)`;};
  console.log(`${w}x${h}\n   header  ${r.hdr}\n   hero    ${f(r.hero)}\n   light   ${f(r.light)}\n   list    ${f(r.list)}`);
  await p.close();
}
await b.close();
