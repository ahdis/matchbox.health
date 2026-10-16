/* Checks every link and asset reference on the local build. Crawls from the
   home page, so new pages (blog posts) are covered without a list to keep up
   to date. Exits non-zero on any failure, for CI. */
import { chromium } from 'playwright';
const BASE = 'http://localhost:8081';
const SEEDS = ['/', '/404.html'];
const b = await chromium.launch();
const internal = new Set(), external = new Set(), failed = [], visited = new Set();
const isPage = u => u.startsWith(BASE) && !/\.[a-z0-9]+$/i.test(new URL(u).pathname.replace(/\/$/, '')) || u.endsWith('.html');
const queue = SEEDS.map(p => BASE + p);
while (queue.length) {
  const url = queue.shift().split('#')[0];
  if (visited.has(url)) continue;
  visited.add(url);
  const path = url.replace(BASE, '') || '/';
  const p = await b.newPage();
  p.on('response', r => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}  (on ${path})`); });
  await p.goto(url, { waitUntil: 'networkidle' });
  // resolve against the page so relative hrefs are checked as the browser sees them
  const hrefs = await p.evaluate(() => [...document.querySelectorAll('a[href]')]
    .map(a => ({ raw: a.getAttribute('href'), abs: a.href })));
  for (const { raw, abs } of hrefs) {
    if (!raw || raw.startsWith('#')) continue;
    if (raw.startsWith('mailto:') || /^https?:/.test(raw)) { external.add(raw); continue; }
    const target = abs.split('#')[0];
    internal.add(target);
    if (isPage(target) && !visited.has(target)) queue.push(target);
  }
  await p.close();
}
console.log('  pages crawled:', [...visited].sort().map(u => u.replace(BASE, '') || '/').join('  '));
console.log('\n  internal links:', [...internal].sort().map(u => u.replace(BASE,'') || '/').join('  '));
console.log('\n  external/mailto:', external.size, 'distinct');
// resolve internal links that were not crawled (assets, the feed)
for (const h of internal) {
  if (visited.has(h)) continue;
  const r = await fetch(h, { redirect: 'follow' });
  if (!r.ok) failed.push(`${r.status} ${h}`);
}
console.log('\n  failed requests:', failed.length ? '\n    ' + failed.join('\n    ') : 'none');
await b.close();
process.exitCode = failed.length ? 1 : 0;
