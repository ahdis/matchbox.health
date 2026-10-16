/* Verifies Google Analytics is not loaded before consent, loads after Accept,
   never loads after Decline, and that the choice persists across navigations. */
import { chromium } from 'playwright';
const b = await chromium.launch();
const gaHits = (page, bag) => page.on('request', r => {
  if (/googletagmanager\.com|google-analytics\.com/.test(r.url())) bag.push(r.url().slice(0, 60));
});
const run = async (label, action) => {
  const ctx = await b.newContext();
  const p = await ctx.newPage(); const hits = [];
  gaHits(p, hits);
  await p.goto('http://localhost:8081/', { waitUntil: 'networkidle' });
  await p.waitForTimeout(700);
  const before = await p.isVisible('.consent');
  if (action) { await p.click(action); await p.waitForTimeout(1200); }
  const after = await p.isVisible('.consent');
  // navigate again to confirm the choice sticks
  await p.goto('http://localhost:8081/features', { waitUntil: 'networkidle' });
  await p.waitForTimeout(900);
  const onSecondPage = await p.isVisible('.consent');
  console.log(`  ${label.padEnd(22)} bannerFirst=${String(before).padEnd(5)} afterClick=${String(after).padEnd(5)}`
    + ` bannerOnNextPage=${String(onSecondPage).padEnd(5)} gaRequests=${hits.length}`);
  await ctx.close();
  return { before, after, onSecondPage, ga: hits.length };
};
const none = await run('no interaction', null);
const deny = await run('Decline', '.consent__deny');
const accept = await run('Accept', '.consent__accept');
await b.close();
// exit non-zero for CI if Google is contacted without consent, or the choice does not stick
const ok = none.before && none.onSecondPage && none.ga === 0
  && deny.before && !deny.after && !deny.onSecondPage && deny.ga === 0
  && accept.before && !accept.after && !accept.onSecondPage && accept.ga > 0;
console.log(ok ? '  consent: ok' : '  consent: FAILED');
process.exitCode = ok ? 0 : 1;
