/* Mobile header and the open menu overlay: the button is not always a
   hamburger and the overlay's colours need not match the header's. */
import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport:{width:390,height:844} });
await p.goto('https://www.matchbox.health/', { waitUntil:'networkidle' });
await p.addStyleTag({content:'.preFade,[class*="preFade"],.sqs-block{opacity:1!important;transform:none!important;visibility:visible!important}'});
await p.waitForTimeout(600);
const read = async (label) => console.log(label, JSON.stringify(await p.evaluate(() => {
  const vis = s => [...document.querySelectorAll(s)].filter(e => e.getBoundingClientRect().width > 0);
  const R = e => { const r = e.getBoundingClientRect(); return [Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)]; };
  const burger = vis('.header-burger-btn, .header-menu-icon, [class*=burger]')[0];
  const menu = document.querySelector('.header-menu');
  const mc = menu && getComputedStyle(menu);
  const link = vis('.header-menu-nav-item a')[0];
  const lc = link && getComputedStyle(link);
  const logo = vis('.header-title img')[0];
  return {
    logo: logo && { rect:R(logo), natural:logo.naturalWidth+'x'+logo.naturalHeight },
    burger: burger && { cls:burger.className.trim().slice(0,80), rect:R(burger),
                        icon: burger.querySelector('.top,.bottom,[class*=icon]')?.className?.toString().slice(0,60) },
    menuOpen: menu ? mc.opacity !== '0' && mc.visibility !== 'hidden' : null,
    menuBg: mc && mc.backgroundColor, menuTheme: menu && menu.className.trim().slice(0,60),
    menuPad: mc && mc.padding,
    link: link && { rect:R(link), text:link.textContent.trim(), fs:lc.fontSize, lh:lc.lineHeight,
                    fw:lc.fontWeight, col:lc.color, mar:lc.margin, ta:getComputedStyle(link.parentElement).textAlign },
  };
}), null, 1));
await read('closed:');
// several burgers exist (duplicate desktop/mobile chrome); click the visible one
await p.evaluate(() => [...document.querySelectorAll('.header-burger-btn')]
  .find(e => e.getBoundingClientRect().width > 0).click());
await p.waitForTimeout(700);
await read('open:  ');
await p.screenshot({ path: '_design/screens/live-menu-mobile.png' });
await b.close();
