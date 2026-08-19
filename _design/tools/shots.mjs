import { chromium } from 'playwright';
const LOCAL = process.env.LOCAL || 'http://localhost:8081';
const b = await chromium.launch();
for (const path of ['/', '/features/', '/privacy-policy/', '/404.html'])
  for (const [vp, size] of Object.entries({desktop:{width:1440,height:900}, mobile:{width:390,height:844}})) {
    const p = await b.newPage(); await p.setViewportSize(size);
    await p.goto(LOCAL + path, { waitUntil:'networkidle' });
    await p.evaluate(async()=>{await new Promise(r=>{let y=0;const t=setInterval(()=>{window.scrollTo(0,y+=500);if(y>document.body.scrollHeight){clearInterval(t);r();}},30);});window.scrollTo(0,0);});
    await p.waitForTimeout(600);
    const slug = path === '/' ? 'home' : path.replace(/\//g,'').replace('.html','');
    await p.screenshot({ path:`_design/screens/final-${slug}-${vp}.png`, fullPage: vp==='mobile' ? false : false });
    await p.close();
  }
await b.close(); console.log('shots written');
