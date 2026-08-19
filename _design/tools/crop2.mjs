/* Same clip from live and local, side by side, for eyeballing what a measured
   delta actually looks like. */
import { chromium } from 'playwright';
const LOCAL = process.env.LOCAL || 'http://localhost:8081';
const vp = process.env.VP === 'mobile' ? {width:390,height:844} : {width:1440,height:900};
const [path, sel, out] = [process.argv[2], process.argv[3], process.argv[4]];
const b = await chromium.launch();
for (const [name, base] of [['live','https://www.matchbox.health'],['local',LOCAL]]) {
  const p = await b.newPage(); await p.setViewportSize(vp);
  await p.goto(base + path, { waitUntil:'networkidle' });
  await p.addStyleTag({content:'.preFade,[class*="preFade"],.sqs-block{opacity:1!important;transform:none!important;visibility:visible!important}.consent,[class*="cookie-banner"]{display:none!important}'});
  await p.evaluate(async()=>{await new Promise(r=>{let y=0;const t=setInterval(()=>{window.scrollTo(0,y+=500);if(y>document.body.scrollHeight){clearInterval(t);r();}},30);});window.scrollTo(0,0);});
  await p.waitForTimeout(900);
  const el = await p.$(name === 'live' ? sel.split('|')[0] : (sel.split('|')[1] || sel.split('|')[0]));
  if (!el) { console.log(`${name}: selector not found`); await p.close(); continue; }
  await el.screenshot({ path: `_design/screens/${out}-${name}.png` });
  console.log(`${name}: _design/screens/${out}-${name}.png`);
  await p.close();
}
await b.close();
