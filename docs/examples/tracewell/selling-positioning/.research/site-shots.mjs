// Site captures for the presentation, at rest (reduced motion), after a scroll-through, with every image decoded.
// Usage: node site-shots.mjs <page.html> <outdir>
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
const [file, outdir] = process.argv.slice(2);
fs.mkdirSync(outdir, { recursive: true });
const url = 'file:///' + path.resolve(file).split(path.sep).join('/');
const b = await chromium.launch();
for (const [name, w, h, full] of [['site-desktop', 1440, 900, false], ['site-desktop-full', 1440, 900, true], ['site-mobile', 390, 844, false]]) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'networkidle' });
  const sh = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < sh; y += 400) { await p.evaluate((y) => scrollTo(0, y), y); await p.waitForTimeout(30); }
  await p.evaluate(() => scrollTo(0, 0));
  const broken = await p.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; })))).then(() => [...document.images].filter((i) => !i.naturalWidth).length));
  await p.waitForTimeout(500);
  await p.screenshot({ path: path.join(outdir, `${name}.png`), fullPage: full });
  console.log(name, 'broken images:', broken);
  await ctx.close();
}
await b.close();
