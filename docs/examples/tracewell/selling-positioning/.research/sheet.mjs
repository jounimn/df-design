// Research helper for the Tracewell presentation: opens each URL in a list, takes two captures per page
// (top of page, and scrolled one screen and a half), writes them as a contact sheet so the reviewer can
// read six cases at a glance. Usage: node sheet.mjs <list.txt> <outdir> [--links <selector>]
// A line in list.txt is a URL; a line starting with "#" is ignored. With --links, the first URL is a listing page and the
// matching anchors are printed instead of captured.
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const [list, outdir] = process.argv.slice(2);
const linkSel = process.argv.includes('--links') ? process.argv[process.argv.indexOf('--links') + 1] : null;
fs.mkdirSync(outdir, { recursive: true });
const urls = fs.readFileSync(list, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36', reducedMotion: 'reduce' });
const page = await ctx.newPage();

if (linkSel) {
  await page.goto(urls[0], { waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => {});
  await page.waitForTimeout(2500);
  const links = await page.$$eval(linkSel, (as) => [...new Set(as.map((a) => a.href))]);
  console.log(links.join('\n'));
  await browser.close();
  process.exit(0);
}

const shots = [];
let i = 0;
for (const url of urls) {
  i++;
  const c2 = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: "reduce" });
  const page = await c2.newPage();
  const base = path.join(outdir, String(i).padStart(2, '0'));
  let status = 'ok';
  try {
    const res = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });
    status = res ? String(res.status()) : 'no-response';
    await page.waitForTimeout(2500);
    await page.screenshot({ path: `${base}-a.png` });
    await page.evaluate(() => window.scrollTo(0, 1400));
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${base}-b.png` });
    await page.evaluate(() => window.scrollTo(0, 3200));
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${base}-c.png` });
  } catch (e) { status = `error: ${e.message.slice(0, 60)}`; }
  await c2.close();
  shots.push({ i, url, status });
  console.log(`${i}\t${status}\t${url}`);
}

// Contact sheets: 4 cases per sheet, 3 captures each, at 400px wide.
const sheetPage = await ctx.newPage();
const groups = [];
for (let g = 0; g < shots.length; g += 4) groups.push(shots.slice(g, g + 4));
let s = 0;
for (const group of groups) {
  s++;
  const rows = group.map((x) => {
    const n = String(x.i).padStart(2, '0');
    const imgs = ['a', 'b', 'c'].map((k) => {
      const f = path.resolve(outdir, `${n}-${k}.png`);
      return fs.existsSync(f) ? `<img src="file:///${f.replace(/\\/g, '/')}">` : '<i></i>';
    }).join('');
    return `<div class="row"><p>#${x.i} ${x.status} ${x.url}</p><div class="imgs">${imgs}</div></div>`;
  }).join('');
  await sheetPage.setContent(`<style>body{margin:0;background:#fff;font:13px/1.3 monospace;color:#000}.row{padding:6px 8px;border-bottom:2px solid #000}.imgs{display:flex;gap:6px}img,i{width:400px;height:250px;display:block;background:#ddd}p{margin:0 0 4px;white-space:nowrap;overflow:hidden}</style>${rows}`);
  await sheetPage.setViewportSize({ width: 1240, height: 10 });
  await sheetPage.screenshot({ path: path.join(outdir, `sheet-${String(s).padStart(2, '0')}.png`), fullPage: true });
}
fs.writeFileSync(path.join(outdir, 'status.json'), JSON.stringify(shots, null, 2));
await browser.close();
