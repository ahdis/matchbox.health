/* Screenshots the live Squarespace site against the local rebuild at both
   breakpoints and reports per-page height deltas. Writes _design/screens/. */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const LIVE  = 'https://www.matchbox.health';
const LOCAL = process.env.LOCAL || 'http://localhost:8080';
const PAGES = ['/', '/features', '/privacy-policy'];
const VIEWPORTS = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };

const dir = new URL('../screens/', import.meta.url);
mkdirSync(dir, { recursive: true });

async function shoot(ctx, url, file, vp) {
  const p = await ctx.newPage();
  await p.setViewportSize(vp);
  try {
    await p.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
    // Squarespace fades blocks in on scroll (.preFade); without this the live
    // screenshots come back with large blank regions.
    await p.addStyleTag({ content:
      '.preFade,[class*="preFade"],.sqs-block{opacity:1!important;transform:none!important;visibility:visible!important}'
      + '.consent{display:none!important}' });
    // force lazy images to resolve, then return to the top
    await p.evaluate(async () => {
      await new Promise(r => { let y = 0; const t = setInterval(() => {
        window.scrollTo(0, y += 400);
        if (y > document.body.scrollHeight) { clearInterval(t); r(); }
      }, 40); });
      window.scrollTo(0, 0);
    });
    await p.waitForTimeout(800);
    const h = await p.evaluate(() => document.body.scrollHeight);
    await p.screenshot({ path: new URL(file, dir).pathname, fullPage: true });
    return h;
  } finally { await p.close(); }
}

const b = await chromium.launch();
const ctx = await b.newContext({ deviceScaleFactor: 1 });
console.log(`${'page'.padEnd(17)}${'viewport'.padEnd(10)}${'live'.padStart(7)}${'local'.padStart(8)}${'delta'.padStart(8)}`);
for (const path of PAGES) {
  const slug = path === '/' ? 'home' : path.slice(1);
  for (const [vp, size] of Object.entries(VIEWPORTS)) {
    const a = await shoot(ctx, LIVE + path,  `${slug}-${vp}-live.png`,  size);
    const c = await shoot(ctx, LOCAL + path, `${slug}-${vp}-local.png`, size);
    const d = c - a, pct = ((d / a) * 100).toFixed(1);
    console.log(`${slug.padEnd(17)}${vp.padEnd(10)}${String(a).padStart(7)}${String(c).padStart(8)}`
      + `${(d > 0 ? '+' + d : String(d)).padStart(8)}  (${pct}%)`);
  }
}
await b.close();
