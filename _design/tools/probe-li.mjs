import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({viewport:{width:1440,height:900}});
await p.goto('https://www.matchbox.health/', {waitUntil:'networkidle'});
await p.addStyleTag({content:'.preFade,[class*="preFade"],.sqs-block{opacity:1!important;transform:none!important;visibility:visible!important}'});
await p.evaluate(async()=>{await new Promise(r=>{let y=0;const t=setInterval(()=>{window.scrollTo(0,y+=500);if(y>document.body.scrollHeight){clearInterval(t);r();}},30);});window.scrollTo(0,0);});
await p.waitForTimeout(800);
console.log(await p.evaluate(() => {
  const li = document.querySelector('.list-item');
  const c = getComputedStyle(li);
  const r = li.getBoundingClientRect();
  return { bg:c.backgroundColor, radius:c.borderRadius, border:c.border, shadow:c.boxShadow,
           rect:[Math.round(r.x),Math.round(r.y+scrollY),Math.round(r.width),Math.round(r.height)] };
}));
// sample the actual painted pixel just inside the li corner
await p.evaluate(() => { const li=document.querySelector('.list-item'); li.scrollIntoView({block:'center'}); });
await p.waitForTimeout(400);
const box = await p.evaluate(() => { const r=document.querySelector('.list-item').getBoundingClientRect(); return {x:r.x,y:r.y,w:r.width,h:r.height}; });
await p.screenshot({ path:'_design/screens/live-li.png', clip:{x:box.x, y:box.y, width:Math.min(box.w,200), height:60} });
await b.close();
console.log('cropped _design/screens/live-li.png from inside the li box');
