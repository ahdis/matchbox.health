/* Full-page screenshots of /blog/ and every post it lists, at 1440 and 390px.
   CI uploads them with each PR as the preview Pages cannot give. Writes to
   _design/screens/blog-<page>-<viewport>.png. */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
const LOCAL = process.env.LOCAL || 'http://localhost:8081';
mkdirSync('_design/screens', { recursive: true });
const b = await chromium.launch();
const index = await b.newPage();
const res = await index.goto(LOCAL + '/blog/', { waitUntil: 'networkidle' });
if (!res.ok()) { console.log('  no blog yet (/blog/ is', res.status() + ')'); await b.close(); process.exit(0); }
const posts = await index.$$eval('.posts__title a', as => as.map(a => new URL(a.href).pathname));
await index.close();
for (const path of ['/blog/', ...posts])
  for (const [vp, size] of Object.entries({ desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } })) {
    const ctx = await b.newContext({ viewport: size });
    // dismiss the consent banner so it does not cover the bottom of the shot
    await ctx.addInitScript(() => { try { localStorage.setItem('matchbox-consent', 'denied'); } catch (e) {} });
    const p = await ctx.newPage();
    await p.goto(LOCAL + path, { waitUntil: 'networkidle' });
    const slug = path.split('/').filter(Boolean).slice(1).join('-') || 'index';
    const file = `_design/screens/blog-${slug}-${vp}.png`;
    await p.screenshot({ path: file, fullPage: true });
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    console.log(`  ${file}${overflow > 0 ? `  WARNING: page is ${overflow}px wider than the viewport` : ''}`);
    await ctx.close();
  }
await b.close();
