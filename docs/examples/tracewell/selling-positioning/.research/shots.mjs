// README screenshots for the Tracewell example: hero (1440x900 viewport, at rest), full (1440, full page, at rest),
// mobile (390, full page, at rest) and motion (a mid-motion frame at 1440x900 with motion allowed). JPEG quality 70.
// Usage: node shots.mjs <page.html> <outdir>
import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const [file, outdir] = process.argv.slice(2);
fs.mkdirSync(outdir, { recursive: true });
const url = 'file:///' + path.resolve(file).split(path.sep).join('/');
const browser = await chromium.launch();

async function atRest(width, height, full, name) {
  const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce', deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1200);
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 400) { await page.evaluate((y) => scrollTo(0, y), y); await page.waitForTimeout(40); }
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(outdir, name), type: 'jpeg', quality: 70, fullPage: full });
  await ctx.close();
}

await atRest(1440, 900, false, 'hero.jpg');
await atRest(1440, 900, true, 'full.jpg');
await atRest(390, 844, true, 'mobile.jpg');

// Mid-motion: motion allowed, the hero loop running, the request pulse mid-flight, and the waterfall half drawn.
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference', deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
// Scroll so the trace panel is entering the viewport (the view() timeline is mid-range), then freeze every
// animation at its current time so the frame is a true mid-motion state.
const y = await page.evaluate(() => {
  const r = document.querySelector('.trace').getBoundingClientRect();
  return window.scrollY + r.top - (window.innerHeight - r.height * 0.6);
});
await page.evaluate((y) => scrollTo(0, y), y);
await page.waitForTimeout(1500);
await page.evaluate(() => document.getAnimations().forEach((a) => a.pause()));
await page.screenshot({ path: path.join(outdir, 'motion.jpg'), type: 'jpeg', quality: 70 });
await ctx.close();
await browser.close();
for (const f of ['hero.jpg', 'full.jpg', 'mobile.jpg', 'motion.jpg']) console.log(f, fs.statSync(path.join(outdir, f)).size);
