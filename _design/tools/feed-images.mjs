/* The PNG images that feed readers and link previews use, cut from the logo:
   docs/assets/img/feed-icon.png  (256x256) the flame on mint: the Atom <icon>,
                                  Feedly's webfeeds:icon, apple-touch-icon
   docs/assets/img/social-card.png (1200x630) the logo on mint: og:image, the
                                  Atom <logo> and each feed entry's media:content
   Readers do not reliably take WebP, and with no image of its own Feedly picked
   the white ahdis logo from the footer and showed it on black. Both images use
   the logo at its native size, so nothing is upscaled.
   Run after changing the logo: node _design/tools/feed-images.mjs */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const LOGO = 'data:image/webp;base64,' + readFileSync('docs/assets/img/matchbox-logo.webp').toString('base64');
const MINT = '#97d6ba';                                   // --mint in site.css
// The flame in the 725x306 logo. Its right lobe reaches below the top of the
// match head, so the clip leaves out the head (left of x=55, below y=139).
const FLAME = { x: 628, y: 0, w: 97, h: 146, clip: 'polygon(0 0,97px 0,97px 146px,55px 146px,55px 139px,0 139px)' };

const b = await chromium.launch();
async function render(file, width, height, body) {
  const p = await b.newPage({ viewport: { width, height } });
  await p.setContent(`<!doctype html><style>html,body{margin:0;width:${width}px;height:${height}px;` +
    `background:${MINT};display:grid;place-items:center}</style>${body}`);
  await p.evaluate(() => Promise.all([...document.images].map(i => i.decode())));
  await p.screenshot({ path: file });
  await p.close();
  console.log(`  ${file}`);
}
await render('docs/assets/img/feed-icon.png', 256, 256,
  `<div style="width:${FLAME.w}px;height:${FLAME.h}px;background:url(${LOGO}) -${FLAME.x}px -${FLAME.y}px no-repeat;clip-path:${FLAME.clip}"></div>`);
await render('docs/assets/img/social-card.png', 1200, 630, `<img src="${LOGO}" width="725" height="306" alt="">`);
await b.close();
