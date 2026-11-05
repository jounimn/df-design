// Drawn assets for an identity that draws its own (references/drawn-assets.md).
//
//   node scripts/draw.mjs check <dir | file.svg ...> [--stroke <width>] [--palette "#hex,#hex"] [--json]
//   node scripts/draw.mjs roughen <in.svg> [--out <file>] [--seed <n>] [--amount <px>] [--step <px>]
//   node scripts/draw.mjs sheet <dir | file.svg ...> [--out <sheet.png>] [--ground <colour>] [--ink <colour>]
//
// check   reads the set and fails what breaks one line and one palette: a raster or live text inside, a colour
//         that is not currentColor / var(--token) / the palette, a stroke width other than the set's, no viewBox.
//         Mixed viewBoxes, widths and caps are warnings. Exit 1 on a FAIL.
// roughen draws clean geometry again by hand: every path and shape is sampled every --step px (default 3), moved
//         along its normal by seeded noise up to --amount px (default 0.8), and written back as one smooth path.
//         The same seed gives the same drawing; record it in assets.md. Exit 1 when nothing could be drawn.
// sheet   renders the whole set on the brief's ground and ink, inverted, and at icon size (24px), into one PNG:
//         the thing to look at before a drawing goes on a page. Exit 1 when no SVG was found.
import fs from 'node:fs';
import path from 'node:path';
import { lintSet, roughenPoints, pointsToPath } from './lib/drawn.mjs';

const USAGE = 'Usage: node scripts/draw.mjs check <dir | file.svg ...> [--stroke <width>] [--palette "#hex,#hex"] [--json]\n'
  + '       node scripts/draw.mjs roughen <in.svg> [--out <file>] [--seed <n>] [--amount <px>] [--step <px>]\n'
  + '       node scripts/draw.mjs sheet <dir | file.svg ...> [--out <sheet.png>] [--ground <colour>] [--ink <colour>]';
const [cmd, ...argv] = process.argv.slice(2);
const VALUED = new Set(['--stroke', '--palette', '--out', '--seed', '--amount', '--step', '--ground', '--ink']);
const BOOL = new Set(['--json']);
const flag = (k, d) => { const i = argv.indexOf(`--${k}`); return i >= 0 && argv[i + 1] != null ? argv[i + 1] : d; };
const bad = (msg) => { console.error(`${msg}\n${USAGE}`); process.exit(2); };
if (!cmd || cmd === '--help' || cmd === '-h') { console.log(USAGE); process.exit(cmd ? 0 : 2); }
if (!['check', 'roughen', 'sheet'].includes(cmd)) bad(`unknown command ${cmd}`);
for (const a of argv) if (a.startsWith('--') && !VALUED.has(a) && !BOOL.has(a)) bad(`unknown flag ${a}`);
const positional = argv.filter((a, i) => !a.startsWith('--') && !VALUED.has(argv[i - 1]));
const num = (k, d) => { const v = Number(flag(k, d)); if (!Number.isFinite(v)) bad(`--${k} takes a number`); return v; };

const svgFiles = (inputs) => {
  const out = [];
  for (const p of inputs) {
    if (!fs.existsSync(p)) bad(`no such file or folder: ${p}`);
    if (fs.statSync(p).isDirectory()) for (const f of fs.readdirSync(p).sort()) { if (f.toLowerCase().endsWith('.svg')) out.push(path.join(p, f)); }
    else out.push(p);
  }
  return out;
};
const rel = (f) => path.relative(process.cwd(), f).replace(/\\/g, '/');

if (cmd === 'check') {
  const files = svgFiles(positional.length ? positional : bad('check takes a folder or SVG files'));
  if (!files.length) { console.error('no SVG files found'); process.exit(1); }
  const stroke = flag('stroke', null) == null ? null : num('stroke');
  const palette = (flag('palette', '') || '').split(',').map((s) => s.trim()).filter(Boolean);
  const findings = lintSet(files.map((f) => ({ name: rel(f), svg: fs.readFileSync(f, 'utf8') })), { stroke, palette });
  const fails = findings.filter((x) => x.level === 'FAIL').length;
  if (argv.includes('--json')) console.log(JSON.stringify({ files: files.length, fails, findings }, null, 2));
  else {
    for (const x of findings) console.log(`${x.level.padEnd(5)} ${x.rule.padEnd(13)} ${x.file}  ${x.detail}`);
    console.log(`${files.length} drawings · ${fails} FAIL · ${findings.length - fails} WARN`);
  }
  process.exit(fails ? 1 : 0);
}

const { launchBrowser } = await import('./lib/browser.mjs');

if (cmd === 'roughen') {
  const input = positional[0] || bad('roughen takes one SVG file');
  if (!fs.existsSync(input)) bad(`no such file: ${input}`);
  const seed = num('seed', 1), amount = num('amount', 0.8), step = num('step', 3);
  if (step < 0.5) bad('--step takes 0.5 or more');
  const out = flag('out', input.replace(/\.svg$/i, '') + '.drawn.svg');
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage();
    await page.setContent(`<!doctype html><body>${fs.readFileSync(input, 'utf8')}</body>`);
    const strokes = await page.evaluate((step) => {
      const els = [...document.querySelectorAll('svg path, svg line, svg polyline, svg polygon, svg rect, svg circle, svg ellipse')];
      return els.map((el, index) => {
        const len = el.getTotalLength ? el.getTotalLength() : 0;
        if (!(len > 0)) return { index, runs: [] };
        const count = Math.max(4, Math.ceil(len / step));
        const pts = [];
        for (let k = 0; k <= count; k++) { const p = el.getPointAtLength((len * k) / count); pts.push([p.x, p.y]); }
        // a moveTo inside a path adds no length, so the samples jump across it: split there
        const runs = [[pts[0]]];
        const seg = len / count;
        for (let k = 1; k < pts.length; k++) {
          const [ax, ay] = pts[k - 1], [bx, by] = pts[k];
          if (Math.hypot(bx - ax, by - ay) > seg * 2.5) runs.push([]);
          runs[runs.length - 1].push(pts[k]);
        }
        const shape = el.tagName.toLowerCase();
        const alwaysClosed = ['polygon', 'rect', 'circle', 'ellipse'].includes(shape);
        return { index, runs: runs.filter((r) => r.length > 1).map((r) => {
          const [fx, fy] = r[0], [lx, ly] = r[r.length - 1];
          const closed = alwaysClosed || Math.hypot(lx - fx, ly - fy) < seg * 1.5;
          return { points: closed ? r.slice(0, -1) : r, closed };
        }) };
      });
    }, step);
    let drawn = 0;
    const ds = strokes.map(({ index, runs }) => ({ index, d: runs.map((run, j) => {
      drawn++;
      return pointsToPath(roughenPoints(run.points, { seed: seed * 7919 + index * 131 + j, amount, closed: run.closed }), { closed: run.closed });
    }).join('') }));
    if (!drawn) { console.error(`nothing to draw in ${rel(input)}: no path or shape with length`); process.exit(1); }
    const svg = await page.evaluate((ds) => {
      const GEOMETRY = ['d', 'x', 'y', 'width', 'height', 'cx', 'cy', 'r', 'rx', 'ry', 'x1', 'y1', 'x2', 'y2', 'points', 'pathLength'];
      const els = [...document.querySelectorAll('svg path, svg line, svg polyline, svg polygon, svg rect, svg circle, svg ellipse')];
      for (const { index, d } of ds) {
        if (!d) continue;
        const el = els[index];
        const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        for (const a of el.attributes) if (!GEOMETRY.includes(a.name)) p.setAttribute(a.name, a.value);
        p.setAttribute('d', d);
        el.replaceWith(p);
      }
      return new XMLSerializer().serializeToString(document.querySelector('svg'));
    }, ds);
    const note = `<!-- drawn by df-design draw.mjs roughen · seed ${seed} · amount ${amount} · step ${step} · from ${path.basename(input)} -->\n`;
    fs.writeFileSync(out, note + svg.replace(/ xmlns:xlink="[^"]*"/, '') + '\n');
    console.log(`${rel(out)}  ${drawn} strokes drawn · seed ${seed} · amount ${amount}px`);
  } finally { await browser.close(); }
  process.exit(0);
}

if (cmd === 'sheet') {
  const files = svgFiles(positional.length ? positional : bad('sheet takes a folder or SVG files'));
  if (!files.length) { console.error('no SVG files found'); process.exit(1); }
  const ground = flag('ground', '#F4F2EC'), ink = flag('ink', '#1C1B19');
  const out = flag('out', path.join(fs.statSync(positional[0]).isDirectory() ? positional[0] : path.dirname(positional[0]), 'sheet.png'));
  const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const cells = files.map((f) => {
    const svg = fs.readFileSync(f, 'utf8').replace(/<\?xml[^>]*>/, '').replace(/<!--[\s\S]*?-->/g, '');
    return `<figure><div class="big">${svg}</div><div class="big inv">${svg}</div><div class="small">${svg}${svg}${svg}</div><figcaption>${esc(path.basename(f))}</figcaption></figure>`;
  }).join('');
  const html = `<!doctype html><meta charset="utf-8"><style>
    body{margin:0;padding:32px;background:${ground};color:${ink};font:13px/1.4 ui-monospace,Menlo,Consolas,monospace}
    main{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:24px}
    figure{margin:0;display:grid;grid-template-columns:1fr 1fr;gap:8px}
    .big{display:grid;place-items:center;aspect-ratio:1;border:1px solid color-mix(in srgb,${ink} 18%,transparent)}
    .big svg{width:80%;height:80%}
    .inv{background:${ink};color:${ground}}
    .small{grid-column:1/-1;display:flex;gap:12px;align-items:center}
    .small svg{width:24px;height:24px}
    figcaption{grid-column:1/-1;opacity:.7}
  </style><main>${cells}</main>`;
  const browser = await launchBrowser();
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    await page.setContent(html);
    fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
    await page.screenshot({ path: out, fullPage: true });
    console.log(`${rel(path.resolve(out))}  ${files.length} drawings on ${ground} / ${ink}, inverted, and at 24px`);
  } finally { await browser.close(); }
  process.exit(0);
}
