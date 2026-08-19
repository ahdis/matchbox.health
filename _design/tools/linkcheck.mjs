/* Checks every link and asset reference on the local build. */
import { chromium } from 'playwright';
const BASE = 'http://localhost:8081';
const PAGES = ['/', '/features', '/privacy-policy', '/404.html'];
const b = await chromium.launch();
const internal = new Set(), external = new Set(), failed = [];
for (const path of PAGES) {
  const p = await b.newPage();
  p.on('response', r => { if (r.status() >= 400) failed.push(`${r.status()} ${r.url()}  (on ${path})`); });
  await p.goto(BASE + path, { waitUntil: 'networkidle' });
  // resolve against the page so relative hrefs are checked as the browser sees them
  const hrefs = await p.evaluate(() => [...document.querySelectorAll('a[href]')]
    .map(a => ({ raw: a.getAttribute('href'), abs: a.href })));
  for (const { raw, abs } of hrefs) {
    if (!raw || raw.startsWith('#')) continue;
    if (raw.startsWith('mailto:') || /^https?:/.test(raw)) { external.add(raw); continue; }
    internal.add(abs);
  }
  await p.close();
}
console.log('  internal links:', [...internal].sort().map(u => u.replace(BASE,'') || '/').join('  '));
console.log('\n  external/mailto:', external.size, 'distinct');
// resolve internal links
for (const h of internal) {
  const r = await fetch(h, { redirect: 'follow' });
  if (!r.ok) failed.push(`${r.status} ${h}`);
}
console.log('\n  failed requests:', failed.length ? '\n    ' + failed.join('\n    ') : 'none');
await b.close();
