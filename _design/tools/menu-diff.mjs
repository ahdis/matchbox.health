/* Opens the mobile menu on live and local and compares the overlay link for
   link: text, position, size and colour. */
import { chromium } from 'playwright';
const LOCAL = process.env.LOCAL || 'http://localhost:8081';
const vp = { width: +(process.env.W||390), height: +(process.env.H||844) };
const b = await chromium.launch();
const read = async (base, open) => {
  const p = await b.newPage(); await p.setViewportSize(vp);
  await p.goto(base + '/', { waitUntil:'networkidle' });
  await p.addStyleTag({content:'[class*="cookie-banner"],.consent{display:none!important}'});
  await p.waitForTimeout(500);
  if (open) {
    await p.evaluate(() => {
      const btn = [...document.querySelectorAll('.header-burger-btn, .header__toggle')]
        .find(e => e.getBoundingClientRect().width > 0);
      btn && btn.click();
    });
    await p.waitForTimeout(900);
  }
  const r = await p.evaluate(() => {
    const vis = s => [...document.querySelectorAll(s)].filter(e => e.getBoundingClientRect().width > 0
      && getComputedStyle(e).visibility !== 'hidden' && +getComputedStyle(e).opacity > 0.5);
    const links = vis('.header-menu-nav-item a, .menu__nav a').map(e => {
      const q = e.getBoundingClientRect(), c = getComputedStyle(e);
      return { t: e.textContent.trim(), x:Math.round(q.x), y:Math.round(q.y),
               w:Math.round(q.width), h:Math.round(q.height), fs:c.fontSize, col:c.color };
    });
    const panel = document.querySelector('.header-menu, .menu');
    const bgOf = el => { for (let e=el; e; e=e.parentElement) {
      const c = getComputedStyle(e); if (c.backgroundColor !== 'rgba(0, 0, 0, 0)') return c.backgroundColor; } return null; };
    // the overlay's ground is painted by a child on the original
    let bg = panel ? bgOf(panel) : null;
    if (panel) for (const ch of panel.querySelectorAll('*')) {
      const c = getComputedStyle(ch);
      if (c.backgroundColor !== 'rgba(0, 0, 0, 0)' && ch.getBoundingClientRect().height > 200) { bg = c.backgroundColor; break; }
    }
    return { links, bg };
  });
  await p.screenshot({ path: `_design/screens/menu-${base.includes('localhost')?'local':'live'}.png` });
  await p.close(); return r;
};
const L = await read('https://www.matchbox.health', true);
const R = await read(LOCAL, true);
await b.close();
console.log(`menu overlay @ ${vp.width}x${vp.height}   live bg=${L.bg}  local bg=${R.bg}`);
console.log('  link            live x,y  wxh   fs        local x,y  wxh   fs        delta');
for (let i = 0; i < Math.max(L.links.length, R.links.length); i++) {
  const a = L.links[i], c = R.links[i];
  if (!a || !c) { console.log(`  ${(a||c).t}  -- only on ${a?'live':'local'}`); continue; }
  const d = `dx=${c.x-a.x} dy=${c.y-a.y} dw=${c.w-a.w} dh=${c.h-a.h}`;
  console.log(`  ${a.t.padEnd(15)} ${String(a.x+','+a.y).padEnd(9)}${String(a.w+'x'+a.h).padEnd(8)}${a.fs.padEnd(9)} `
    + `${String(c.x+','+c.y).padEnd(9)}${String(c.w+'x'+c.h).padEnd(8)}${c.fs.padEnd(9)} ${d}`
    + (a.col!==c.col?`  col ${a.col}->${c.col}`:''));
}
