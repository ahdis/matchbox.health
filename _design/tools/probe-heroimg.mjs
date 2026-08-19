import { chromium } from 'playwright';
const b = await chromium.launch();
for (const vp of [{width:1440,height:900},{width:390,height:844}]) {
  const p = await b.newPage({viewport:vp});
  await p.goto('https://www.matchbox.health/', {waitUntil:'networkidle'});
  await p.addStyleTag({content:'.preFade,[class*="preFade"],.sqs-block{opacity:1!important;transform:none!important;visibility:visible!important}'});
  await p.waitForTimeout(600);
  console.log('@'+vp.width, await p.evaluate(() => {
    const img=[...document.querySelectorAll('img')].find(i=>i.currentSrc.includes('anim_green'));
    const out=[];
    for(let e=img;e&&!e.classList.contains('sqs-block');e=e.parentElement){
      const c=getComputedStyle(e), r=e.getBoundingClientRect();
      out.push(`${e.tagName.toLowerCase()}.${(e.className||'').toString().split(/\s+/)[0]} y=${Math.round(r.y+scrollY)} h=${Math.round(r.height)} m=${c.margin} p=${c.padding} disp=${c.display} maxw=${c.maxWidth}`);
    }
    return '\n   ' + out.join('\n   ');
  }));
  await p.close();
}
await b.close();
