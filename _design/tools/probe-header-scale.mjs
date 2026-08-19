import { chromium } from 'playwright';
const b = await chromium.launch();
console.log(' width  hdrH   logo w x h    logoX logoY   navY  gutter  bandH');
for (const w of [390, 480, 600, 767, 768, 900, 1024, 1280, 1440, 1920]) {
  const p = await b.newPage({ viewport:{width:w,height:900} });
  await p.goto('https://www.matchbox.health/', { waitUntil:'networkidle' });
  await p.addStyleTag({content:'.preFade,[class*="preFade"]{opacity:1!important;transform:none!important;visibility:visible!important}'});
  await p.waitForTimeout(500);
  const r = await p.evaluate(() => {
    const vis = s => [...document.querySelectorAll(s)].filter(e => e.getBoundingClientRect().width > 0);
    const R = e => { const q = e.getBoundingClientRect(); return [Math.round(q.x),Math.round(q.y),Math.round(q.width),Math.round(q.height)]; };
    const h = document.querySelector('#header'); const img = vis('.header-title img')[0];
    const wrap = vis('.header-announcement-bar-wrapper')[0];
    const nav = vis('.header-nav-item a')[0];
    const band = vis('.header-background-solid')[0];
    return { hdr: R(h)[3], logo: img && R(img), pad: wrap && getComputedStyle(wrap).padding,
             navY: nav && R(nav)[1], band: band && R(band)[3] };
  });
  console.log(`${String(w).padStart(5)} ${String(r.hdr).padStart(5)}  ${r.logo?`${String(r.logo[2]).padStart(4)} x ${String(r.logo[3]).padStart(3)}`:'   -'}  ${r.logo?String(r.logo[0]).padStart(5)+String(r.logo[1]).padStart(6):''} ${String(r.navY??'-').padStart(6)}  ${r.pad}  ${r.band}`);
  await p.close();
}
await b.close();
