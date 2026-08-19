// Second pass: resolve section backgrounds (they live in .section-background children)
// and sample the fluid type scale across widths so it can be re-derived as clamp().
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const WIDTHS = [390, 480, 768, 1024, 1280, 1440, 1920];
const SELS = ['h1', 'h2', 'h3', 'h4', 'p', '.header-nav-item a', '.sqs-block-button-element'];

const browser = await chromium.launch();
const out = { backgrounds: {}, scale: {}, gutters: {} };

for (const w of WIDTHS) {
  const page = await browser.newPage({ viewport: { width: w, height: 900 } });
  await page.goto('https://www.matchbox.health/', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(800);
  const r = await page.evaluate((sels) => {
    const o = { bg: [], type: {}, vars: {} };
    document.querySelectorAll('section.page-section').forEach((s, i) => {
      const inner = s.querySelector('.section-background');
      o.bg.push({
        i, theme: s.getAttribute('data-section-theme'),
        sectionBg: getComputedStyle(s).backgroundColor,
        innerBg: inner ? getComputedStyle(inner).backgroundColor : null,
        hasImage: inner ? getComputedStyle(inner).backgroundImage !== 'none' || !!inner.querySelector('img') : false,
        contentWidth: (() => { const c = s.querySelector('.content-wrapper,.fluid-engine'); return c ? Math.round(c.getBoundingClientRect().width) : null; })(),
      });
    });
    for (const sel of sels) { const el = document.querySelector(sel); if (el) o.type[sel] = parseFloat(getComputedStyle(el).fontSize); }
    const bs = getComputedStyle(document.body);
    for (const v of ['--sqs-site-max-width','--sqs-site-gutter','--sqs-mobile-site-gutter'])
      o.vars[v] = bs.getPropertyValue(v).trim() || getComputedStyle(document.querySelector('.page-section')).getPropertyValue(v).trim();
    return o;
  }, SELS);
  out.backgrounds[w] = r.bg; out.scale[w] = r.type; out.gutters[w] = r.vars;
  await page.close();
  console.log(`  ${String(w).padStart(4)}px  h1=${r.type.h1}  h2=${r.type.h2}  p=${r.type.p}  gutter=${r.vars['--sqs-site-gutter']||'-'}`);
}
await browser.close();
writeFileSync(new URL('../tokens/scale.json', import.meta.url), JSON.stringify(out, null, 2));

console.log('\nsection backgrounds @1440:');
for (const b of out.backgrounds[1440]) console.log(`  [${b.i}] ${String(b.theme).padEnd(12)} section=${b.sectionBg}  inner=${b.innerBg}  img=${b.hasImage}  contentW=${b.contentWidth}`);
