import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({viewport:{width:700,height:140}});
await p.goto('file:///tmp/fonttest.html');
await p.waitForTimeout(600);
await p.screenshot({path:'_design/screens/fonttest.png'});
await b.close();
