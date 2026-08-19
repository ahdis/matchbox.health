// Loads the live Squarespace site and records COMPUTED styles, so the rebuild
// targets resolved values rather than guesses from the 1.2MB theme bundle.
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';

const BASE = 'https://www.matchbox.health';
const PAGES = { index: '/', features: '/features', 'privacy-policy': '/privacy-policy' };
const VIEWPORTS = { desktop: { width: 1440, height: 900 }, mobile: { width: 390, height: 844 } };

const PROPS = ['font-family','font-size','font-weight','line-height','letter-spacing','text-transform',
               'color','background-color','margin-top','margin-bottom','padding','border-radius','max-width'];

const probe = (props) => {
  const out = { sections: [], type: {}, root: {} };
  const cs = (el) => { const c = getComputedStyle(el); const o = {}; for (const p of props) o[p] = c.getPropertyValue(p); return o; };

  const rs = getComputedStyle(document.documentElement);
  for (const v of ['--sqs-site-max-width','--sqs-site-gutter','--sqs-mobile-site-gutter',
                   '--accent-hsl','--black-hsl','--white-hsl','--darkAccent-hsl','--lightAccent-hsl'])
    out.root[v] = rs.getPropertyValue(v).trim();

  document.querySelectorAll('section[data-section-theme], .page-section').forEach((s, i) => {
    const c = getComputedStyle(s);
    out.sections.push({
      i, theme: s.getAttribute('data-section-theme') || null,
      id: s.id || null,
      classes: (s.className || '').split(/\s+/).filter(x => /background-width|section-height|content-width/.test(x)),
      backgroundColor: c.backgroundColor, color: c.color,
      paddingTop: c.paddingTop, paddingBottom: c.paddingBottom,
      height: Math.round(s.getBoundingClientRect().height),
    });
  });

  for (const sel of ['h1','h2','h3','h4','p','a','.sqs-block-button-element','.header-nav-item a','.sqs-html-content li']) {
    const el = document.querySelector(sel);
    if (el) out.type[sel] = cs(el);
  }
  return out;
};

const browser = await chromium.launch();
mkdirSync(new URL('../tokens', import.meta.url), { recursive: true });
const all = {};
for (const [name, path] of Object.entries(PAGES)) {
  all[name] = {};
  for (const [vp, size] of Object.entries(VIEWPORTS)) {
    const page = await browser.newPage({ viewport: size, deviceScaleFactor: 2 });
    await page.goto(BASE + path, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(1200);
    all[name][vp] = await page.evaluate(probe, PROPS);
    await page.close();
    console.log(`  probed ${name} @ ${vp} — ${all[name][vp].sections.length} sections`);
  }
}
await browser.close();
writeFileSync(new URL('../tokens/computed.json', import.meta.url), JSON.stringify(all, null, 2));
console.log('wrote _design/tokens/computed.json');
