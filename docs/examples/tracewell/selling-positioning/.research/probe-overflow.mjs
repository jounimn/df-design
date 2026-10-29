// Lists the elements whose right edge passes the viewport at a given width. Usage: node probe-overflow.mjs <page.html> [width]
import { chromium } from 'playwright';
import path from 'node:path';
const width = Number(process.argv[3] || 320);
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width, height: 800 }, reducedMotion: 'reduce' });
await p.goto('file:///' + path.resolve(process.argv[2]).split(path.sep).join('/'));
await p.waitForTimeout(800);
const out = await p.evaluate((w) => [...document.querySelectorAll('body *')].map((e) => {
  const r = e.getBoundingClientRect();
  const cls = typeof e.className === 'string' ? e.className : '';
  return { t: e.tagName.toLowerCase(), c: cls, right: Math.round(r.right), txt: (e.textContent || '').trim().slice(0, 30) };
}).filter((x) => x.right > w + 2).slice(0, 15), width);
console.log(JSON.stringify(out, null, 1));
await b.close();
