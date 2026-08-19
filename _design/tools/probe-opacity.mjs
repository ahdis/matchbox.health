/* Screenshots the live card with the fade animation allowed to finish
   naturally, instead of forced with opacity:1 -- the forcing may itself be
   what shifts the colours. */
import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({viewport:{width:390,height:844}});
await p.goto('https://www.matchbox.health/', {waitUntil:'networkidle'});
await p.evaluate(() => document.querySelector('.list-item').scrollIntoView({block:'center'}));
await p.waitForTimeout(2500);
console.log(await p.evaluate(() => {
  const li = document.querySelector('.list-item');
  const img = li.querySelector('img');
  const chain = [];
  for (let e = img; e && e !== document.body; e = e.parentElement) {
    const c = getComputedStyle(e);
    if (c.opacity !== '1' || c.filter !== 'none' || c.mixBlendMode !== 'normal'
        || c.backgroundColor !== 'rgba(0, 0, 0, 0)')
      chain.push(`${e.tagName.toLowerCase()}.${(e.className||'').toString().trim().split(/\s+/)[0]} op=${c.opacity} filter=${c.filter} blend=${c.mixBlendMode} bg=${c.backgroundColor}`);
  }
  return chain;
}));
await (await p.$('.list-item')).screenshot({ path:'_design/screens/li-natural.png' });
await b.close();
