// Screenshots of the real product, for the page that sells it (references/images.md, "the product itself").
// Ported from Hallmark's capture.mjs (github.com/nutlope/hallmark, MIT) to Playwright, which this skill already ships.
//
//   node scripts/capture.mjs <url | file.html> [--out <dir>] [--name <prefix>] [--routes /,/pricing]
//                            [--sizes desktop,laptop,tablet,phone] [--full] [--selector "<css>"] [--wait <ms>]
//                            [--dark] [--scale <1|2>] [--reduced]
//   node scripts/capture.mjs --cdp <port> [--target "<window title>"] [--selector "<css>"] [--out <dir>] [--name <prefix>]
//
// Opens each route at 1440 x 900 (desktop) and 390 x 844 (phone) by default, waits for fonts and images, and writes
// PNGs into --out (default images/screens). For each file it prints the size and a ready <img>. --selector captures one
// element (a panel, a chart, a dialog); --full captures the whole scroll height; --cdp attaches to a desktop app already
// running with a DevTools port (an Electron app started with --remote-debugging-port=<port>) and captures its window.
// It never draws a browser bar or a device frame: the page frames the picture in the identity's own material.
// Exit code 0 = at least one screenshot written; 1 = none; 2 = bad command line.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { launchBrowser, settle } from './lib/browser.mjs';

const USAGE = 'Usage: node scripts/capture.mjs <url | file.html> [--out <dir>] [--name <prefix>] [--routes /,/pricing] [--sizes desktop,phone] [--full] [--selector "<css>"] [--wait <ms>] [--dark] [--scale 2] [--reduced]\n       node scripts/capture.mjs --cdp <port> [--target "<window title>"] [--selector "<css>"] [--out <dir>] [--name <prefix>]';
const argv = process.argv.slice(2);
const VALUED = new Set(['--out', '--name', '--routes', '--sizes', '--selector', '--wait', '--scale', '--cdp', '--target']);
const flag = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 && argv[i + 1] != null && !argv[i + 1].startsWith('--') ? argv[i + 1] : d; };
const has = (k) => argv.includes(`--${k}`);
for (const a of argv) if (a.startsWith('--') && !VALUED.has(a) && !['--full', '--dark', '--reduced', '--help', '-h'].includes(a)) { console.error(`unknown flag ${a}\n${USAGE}`); process.exit(2); }
if (has('help') || argv.includes('-h')) { console.log(USAGE); process.exit(0); }
const target = argv.find((a, i) => !a.startsWith('--') && !VALUED.has(argv[i - 1]));
if (!target && !has('cdp')) { console.error(USAGE); process.exit(2); }

const SIZES = { desktop: [1440, 900, false], laptop: [1280, 800, false], tablet: [834, 1112, true], phone: [390, 844, true] };
const out = path.resolve(flag('out', path.join('images', 'screens')));
const name = (flag('name', 'screen').replace(/[^\w.-]+/g, '-').replace(/^\.+/, '')) || 'screen';
const routes = flag('routes', '/').split(',').map((r) => r.trim()).filter(Boolean);
const sizes = flag('sizes', 'desktop,phone').split(',').map((s) => s.trim()).filter(Boolean);
const wait = Number(flag('wait', '600'));
const scale = Number(flag('scale', '2'));
const selector = flag('selector', '');
for (const s of sizes) if (!SIZES[s]) { console.error(`--sizes takes ${Object.keys(SIZES).join(', ')}; not ${s}\n${USAGE}`); process.exit(2); }
if (!Number.isFinite(scale) || scale < 1 || scale > 3) { console.error('--scale takes 1, 2 or 3'); process.exit(2); }
const relOut = (f) => path.relative(process.cwd(), f).replace(/\\/g, '/');
const imgTag = (file, w, h) => `  <img src="${relOut(file)}" width="${w}" height="${h}" alt="" loading="lazy">`;

if (has('cdp')) {
  const port = Number(flag('cdp', ''));
  if (!Number.isInteger(port) || port < 1 || port > 65535) { console.error("--cdp takes the app's DevTools port, for example --cdp 9222"); process.exit(2); }
  const want = flag('target', '').toLowerCase();
  const app = await chromium.connectOverCDP(`http://127.0.0.1:${port}`).catch((e) => { console.error(`no DevTools endpoint on port ${port}: ${e.message}`); process.exit(1); });
  let page = null;
  for (const ctx of app.contexts()) for (const pg of ctx.pages()) { const t = (await pg.title().catch(() => '')).toLowerCase(); if (!want || t.includes(want)) { page = pg; break; } }
  if (!page) { console.error(`no window${want ? ` titled like "${want}"` : ''} on port ${port}`); await app.close(); process.exit(1); }
  fs.mkdirSync(out, { recursive: true });
  const file = path.join(out, `${name}-app${selector ? '-part' : ''}.png`);
  const el = selector ? await page.$(selector) : null;
  if (selector && !el) { console.error(`no element matches ${selector}`); await app.close(); process.exit(1); }
  await (el || page).screenshot({ path: file });
  const box = el ? await el.boundingBox() : await page.evaluate(() => ({ width: innerWidth, height: innerHeight }));
  const dpr = await page.evaluate(() => devicePixelRatio).catch(() => 1);
  console.log(`${relOut(file)}  ${Math.round(box.width * dpr)} x ${Math.round(box.height * dpr)}  (app window)`);
  console.log(imgTag(file, Math.round(box.width * dpr), Math.round(box.height * dpr)));
  await app.close();
  process.exit(0);
}

const isUrl = /^https?:\/\//i.test(target);
if (!isUrl && !fs.existsSync(target)) { console.error(`no such file: ${target}`); process.exit(2); }
const urlFor = (route) => {
  if (!isUrl) return pathToFileURL(path.resolve(target)).href;
  const u = new URL(target);
  if (route === '/') return u.href;
  const r = new URL(route, u.origin);
  return r.origin === u.origin ? r.href : null;
};
fs.mkdirSync(out, { recursive: true });
const browser = await launchBrowser();
const made = [];
try {
  for (const route of isUrl ? routes : ['/']) {
    for (const size of sizes) {
      const [w, h, mobile] = SIZES[size];
      const context = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: scale, isMobile: mobile, hasTouch: mobile, colorScheme: has('dark') ? 'dark' : 'light', reducedMotion: has('reduced') ? 'reduce' : 'no-preference' });
      const page = await context.newPage();
      const to = urlFor(route);
      if (!to) { console.log(`skip ${route}: not on ${new URL(target).origin}`); await context.close(); continue; }
      const res = await page.goto(to, { waitUntil: 'load', timeout: 45000 }).catch((e) => ({ err: e.message }));
      if (res && res.err) { console.log(`skip ${route} at ${size}: ${res.err}`); await context.close(); continue; }
      await settle(page, { quiet: wait });
      await page.evaluate(async () => { for (const i of document.querySelectorAll('img[loading="lazy"]')) i.loading = 'eager'; await Promise.race([Promise.all([...document.images].filter((i) => !i.complete).map((i) => new Promise((r) => { i.onload = i.onerror = r; }))), new Promise((r) => setTimeout(r, 6000))]); }).catch(() => {});
      const slug = route === '/' ? 'home' : route.replace(/^\/|\/$/g, '').replace(/[^\w-]+/g, '-');
      const file = path.join(out, `${name}-${slug}-${size}${selector ? '-part' : ''}.png`);
      let box;
      if (selector) {
        const el = await page.$(selector);
        if (!el) { console.log(`skip ${route} at ${size}: no element matches ${selector}`); await context.close(); continue; }
        await el.scrollIntoViewIfNeeded().catch(() => {});
        await el.screenshot({ path: file });
        box = await el.boundingBox();
      } else {
        await page.screenshot({ path: file, fullPage: has('full') });
        const dims = await page.evaluate((full) => [innerWidth, full ? document.documentElement.scrollHeight : innerHeight], has('full'));
        box = { width: dims[0], height: dims[1] };
      }
      made.push({ file, w: Math.round(box.width * scale), h: Math.round(box.height * scale), route, size });
      await context.close();
    }
  }
} finally { await browser.close(); }
for (const m of made) {
  console.log(`${relOut(m.file)}  ${m.w} x ${m.h}  (${m.route}, ${m.size})`);
  console.log(imgTag(m.file, m.w, m.h));
}
if (!made.length) process.exitCode = 1;
else console.log(`\n${made.length} screenshot${made.length > 1 ? 's' : ''}. Look at each one before placing it: sample data only, nothing personal (names, emails, tokens), the screen in the state that tells the page's story.`);
