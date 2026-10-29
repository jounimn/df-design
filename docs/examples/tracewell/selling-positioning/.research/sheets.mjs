// Rebuilds the contact sheets from captures already taken by sheet.mjs. A sheet is written as an HTML file next to
// the captures and opened from disk, so its file:// images load. Usage: node sheets.mjs <outdir> [per-sheet]
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const outdir = path.resolve(process.argv[2]);
const per = Number(process.argv[3] || 4);
const shots = JSON.parse(fs.readFileSync(path.join(outdir, 'status.json'), 'utf8'));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1240, height: 10 } });
let s = 0;
for (let g = 0; g < shots.length; g += per) {
  s++;
  const rows = shots.slice(g, g + per).map((x) => {
    const n = String(x.i).padStart(2, '0');
    const imgs = ['a', 'b', 'c'].map((k) => (fs.existsSync(path.join(outdir, `${n}-${k}.png`)) ? `<img src="${n}-${k}.png">` : '<i></i>')).join('');
    return `<div class="row"><p>#${x.i} ${x.url}</p><div class="imgs">${imgs}</div></div>`;
  }).join('');
  const html = path.join(outdir, `sheet-${String(s).padStart(2, '0')}.html`);
  fs.writeFileSync(html, `<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#fff;font:13px/1.3 monospace;color:#000}.row{padding:6px 8px;border-bottom:2px solid #000}.imgs{display:flex;gap:6px}img,i{width:400px;height:250px;display:block;background:#ddd;object-fit:cover;object-position:top}p{margin:0 0 4px;white-space:nowrap;overflow:hidden}</style>${rows}`);
  await page.goto('file:///' + html.split(path.sep).join('/'));
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(outdir, `sheet-${String(s).padStart(2, '0')}.png`), fullPage: true });
}
await browser.close();
console.log(`${s} sheets`);
