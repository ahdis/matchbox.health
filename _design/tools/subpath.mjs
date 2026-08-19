import { chromium } from 'playwright';
const BASE=process.env.BASE || 'http://localhost:8090/matchbox.health';
const b=await chromium.launch();
for (const path of ['/','/features/','/privacy-policy/','/404.html']) {
  const p=await b.newPage(); await p.setViewportSize({width:1440,height:900});
  const bad=[];
  p.on('response', r=>{ if(r.status()>=400) bad.push(`${r.status()} ${r.url().replace(BASE,'')}`); });
  await p.goto(BASE+path,{waitUntil:'networkidle'});
  await p.waitForTimeout(600);
  const ok = await p.evaluate(()=>({
    css: getComputedStyle(document.body).fontFamily.includes('Poppins'),
    heroBg: getComputedStyle(document.querySelector('.section') || document.body).backgroundColor,
    imgs: [...document.querySelectorAll('img')].filter(i=>i.naturalWidth>0).length,
    imgsTotal: document.querySelectorAll('img').length,
  }));
  console.log(`  ${path.padEnd(18)} css=${ok.css} imgsLoaded=${ok.imgs}/${ok.imgsTotal} bg=${ok.heroBg} failures=${bad.length?bad.join(', '):'none'}`);
  await p.close();
}
await b.close();
