// Checks that an audition step "landed": real HTML pages, rendering cleanly,
// with images only under the rules in references/images.md.
// Usage: node scripts/check-auditions.mjs <auditions-dir> <images: yes|no> <captures-dir>
// 'images' is the author's answer to the stock-image question. Exit code 0 = every check passed.
import { launchBrowser } from './lib/browser.mjs';
import fs from 'node:fs';
import path from 'node:path';

const [dir, imagesAllowed, capDir] = process.argv.slice(2);
const results = [];
const check = (name, ok, detail = '') => results.push({ name, ok, detail });

// 1. Files exist
const html = fs.readdirSync(dir).filter((f) => f.endsWith('.html'));
const candidates = html.filter((f) => f !== 'index.html');
check('index.html exists', html.includes('index.html'));
check('at least 2 candidate pages', candidates.length >= 2, candidates.join(', '));

// Collect local raster images actually present on disk
const rasterExt = /\.(jpe?g|png|webp|avif|gif)$/i;
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const rasterFiles = walk(dir).filter((f) => rasterExt.test(f) && !f.includes(`${path.sep}captures${path.sep}`));

// 2. Render every page
fs.mkdirSync(capDir, { recursive: true });
const browser = await launchBrowser();
const usedImages = new Set();
for (const f of html) {
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, reducedMotion: 'reduce' });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
    page.on('requestfailed', (r) => errs.push('failed: ' + r.url()));
    await page.goto('file:///' + path.resolve(dir, f).replace(/\\/g, '/'), { waitUntil: 'load' });
    const H = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H; y += 400) { await page.evaluate((y) => scrollTo(0, y), y); await page.waitForTimeout(40); }
    await page.evaluate(() => scrollTo(0, 0));
    await page.waitForTimeout(500);
    const info = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      imgs: [...document.images].map((i) => ({ src: i.currentSrc || i.src, ok: i.complete && i.naturalWidth > 0, raster: !/\.svg($|\?)|^data:image\/svg/i.test(i.currentSrc || i.src) })),
      cssBgRaster: [...document.querySelectorAll('*')].map((e) => getComputedStyle(e).backgroundImage).filter((b) => /url\(.*\.(jpe?g|png|webp|avif)/i.test(b)),
      svgIcons: document.querySelectorAll('svg').length,
    }));
    const label = `${f} @${w}`;
    check(`${label}: no page errors or failed requests`, errs.length === 0, errs.join(' | '));
    check(`${label}: no horizontal scroll`, info.sw <= w, `scrollWidth ${info.sw}`);
    check(`${label}: every image loaded`, info.imgs.every((i) => i.ok), info.imgs.filter((i) => !i.ok).map((i) => i.src).join(', '));
    if (f !== "index.html") check(`${label}: inline SVG icons present`, info.svgIcons > 0, `${info.svgIcons} svg`);  // index.html is only the comparison frame
    info.imgs.filter((i) => i.raster).forEach((i) => usedImages.add(decodeURIComponent(i.src)));
    if (imagesAllowed === 'no') {
      const raster = info.imgs.filter((i) => i.raster).length + info.cssBgRaster.length;
      check(`${label}: no raster images (author said no)`, raster === 0, `${raster} raster`);
    }
    if (w === 1440) await page.screenshot({ path: path.join(capDir, f.replace('.html', '.jpg')), fullPage: true, type: 'jpeg', quality: 70 });
    await ctx.close();
  }
}
await browser.close();

// 3. Image rules
if (imagesAllowed === 'yes') {
  const records = walk(dir).filter((f) => /assets?\.md$/i.test(f)).map((f) => fs.readFileSync(f, 'utf8')).join('\n');
  check('asset record exists', records.length > 0);
  // Only images the pages actually display count; screenshots or stray files in the folder do not.
  const norm = (s) => s.split(path.sep).join('/').split('\\').join('/');
  const shown = rasterFiles.filter((f) => [...usedImages].some((u) => norm(u).endsWith(norm(path.relative(dir, f)))));
  check('at least one image shown (author said yes)', shown.length > 0, `${shown.length} shown of ${rasterFiles.length} on disk`);
  for (const f of shown) {
    const base = path.basename(f);
    const row = records.split('\n').find((l) => l.includes(base)) || '';
    check(`${base}: recorded`, row.length > 0);
    const url = (row.match(/https?:\/\/[^\s|)>]+/) || [])[0];
    check(`${base}: source URL recorded`, !!url, url || '');
    // Remove negated phrases first, so "no attribution required" is not read as "attribution required".
    const lic = row.replace(/(no|not|without)\s+(attribution|credit)(\s+(is\s+)?(required|needed))?|(attribution|credit)\s+(is\s+)?not\s+(required|needed)/gi, '');
    check(`${base}: licence is not CC BY / credit-required`, row.length > 0 && !/CC[ -]?BY(?![- ]?0)|attribution required|credit required|requires? (attribution|credit)/i.test(lic), row.slice(0, 160));
    if (url) {
      let code = 0;
      try { code = (await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 Chrome/130' }, signal: AbortSignal.timeout(20000) })).status; } catch { code = -1; }
      check(`${base}: source page answers`, code > 0 && (code < 400 || [401, 403, 429].includes(code)), `HTTP ${code}`);
    }
  }
}

const failed = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? '  — ' + r.detail : ''}`);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
console.log('raster files on disk:', rasterFiles.map((f) => path.relative(dir, f)).join(', ') || 'none');
process.exit(failed.length ? 1 : 0);
