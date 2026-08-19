/* Image geometry + shaping on the live site: rect, object-fit, and any
   clip-path / mask / border-radius on the img OR its ancestors (the shape is
   often applied several levels up, so reading the <img> alone reports none). */
import { chromium } from 'playwright';
const vp = process.env.VP === 'mobile' ? {width:390,height:844} : {width:1440,height:900};
const path = process.argv[2] || '/';
const b = await chromium.launch();
const p = await b.newPage(); await p.setViewportSize(vp);
await p.goto('https://www.matchbox.health' + path, { waitUntil: 'networkidle' });
await p.addStyleTag({content:'.preFade,[class*="preFade"],.sqs-block{opacity:1!important;transform:none!important;visibility:visible!important}'});
await p.evaluate(async()=>{await new Promise(r=>{let y=0;const t=setInterval(()=>{window.scrollTo(0,y+=500);if(y>document.body.scrollHeight){clearInterval(t);r();}},30);});window.scrollTo(0,0);});
await p.waitForTimeout(900);
const rows = await p.evaluate(() => [...document.querySelectorAll('img')].map(im => {
  const r = im.getBoundingClientRect();
  if (r.width < 1) return null;                      // hidden mobile/desktop duplicate
  const chain = [];
  for (let e = im; e && e !== document.body; e = e.parentElement) {
    const c = getComputedStyle(e);
    const bits = [];
    if (c.clipPath !== 'none') bits.push('clip:' + c.clipPath);
    if (c.maskImage !== 'none') bits.push('mask:' + c.maskImage.slice(0,60));
    if (c.webkitMaskImage && c.webkitMaskImage !== 'none') bits.push('wmask:' + c.webkitMaskImage.slice(0,40));
    if (c.borderRadius !== '0px') bits.push('radius:' + c.borderRadius);
    if (c.overflow === 'hidden') bits.push('ovf-hidden');
    if (bits.length) chain.push(`${e.tagName.toLowerCase()}.${(e.className||'').toString().split(/\s+/)[0]}: ${bits.join(' ')}`);
  }
  const cs = getComputedStyle(im);
  return { src: im.currentSrc.split('/').pop().slice(0,50),
    x: Math.round(r.x), y: Math.round(r.y + scrollY), w: Math.round(r.width), h: Math.round(r.height),
    fit: cs.objectFit, natural: im.naturalWidth + 'x' + im.naturalHeight, shape: chain };
}).filter(Boolean));
console.log(`${path} @ ${vp.width}px`);
for (const r of rows) {
  console.log(`  ${r.src}\n     rect ${r.x},${r.y} ${r.w}x${r.h}  natural ${r.natural}  fit=${r.fit}`);
  r.shape.forEach(s => console.log('     ' + s));
}
await b.close();
