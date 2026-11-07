// scripts/ink-pass.mjs in two layers. The pure helpers always run. The pixel tests run scripts/py/ink-pass.py on
// small synthetic pictures made here (so there is no licence to record) when a Python with numpy and Pillow is found,
// and are skipped otherwise (node scripts/cutout.mjs setup makes a venv that has both).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  parseInkArgs, inksFromBrief, resolveInks, resolveFill, inkPythonArgs, layersPythonArgs, inkPythonCandidates,
  luminance, treatment, UsageError,
} from '../scripts/lib/ink-pass.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(HERE, '..', 'scripts', 'ink-pass.mjs');
const INK = '#141019', PAPER = '#F0EBDF', HINT = '#2E7DFF'; // a test palette, not any project's

// ---------------- pure helpers ----------------

test('the brief\'s Hint line gives the inks: the darker of the base pair is the ink, the colour after the arrow the hint', () => {
  const brief = 'Grammar: ...\nHint:          paper #F0EBDF and ink #141019 → signal blue #2E7DFF, cold: (1) the subject\n';
  assert.deepEqual(inksFromBrief(brief), { ink: '#141019', paper: '#F0EBDF', hint: '#2E7DFF' });
  assert.deepEqual(inksFromBrief('- **Hint:** ink #000000 and #ffffff -> #ff0000'), { ink: '#000000', paper: '#FFFFFF', hint: '#FF0000' });
  assert.deepEqual(inksFromBrief('Hint: #222222 and #eeeeee, none: the identity has no loud colour'), { ink: '#222222', paper: '#EEEEEE', hint: null });
  assert.equal(inksFromBrief('Hint: none, the base pair carries it'), null);
  assert.equal(inksFromBrief('no hint line here'), null);
  assert.ok(luminance('#000000') < luminance('#808080') && luminance('#808080') < luminance('#FFFFFF'));
});

test('no built-in palette: the inks come from the flags or the brief, and a hint map needs a hint', () => {
  const read = () => 'Hint: #141019 and #F0EBDF → #2E7DFF';
  assert.throws(() => resolveInks({ exclude: [], erase: [] }), /the inks come from the brief/);
  assert.deepEqual(resolveInks({ brief: 'b.md', exclude: [], erase: [] }, read), { ink: INK, paper: PAPER, hint: HINT });
  assert.deepEqual(resolveInks({ brief: 'b.md', hint: '#00ff00', exclude: [], erase: [] }, read), { ink: INK, paper: PAPER, hint: '#00FF00' });
  assert.throws(() => resolveInks({ ink: '#000000', paper: '#ffffff', map: 'hint', exclude: [], erase: [] }), /needs a hint colour/);
  assert.throws(() => resolveInks({ brief: 'b.md', exclude: [], erase: [] }, () => 'Hint: none'), /no Hint line with a base pair/);
  assert.equal(resolveFill({ fill: '#abcdef' }), '#ABCDEF');
  assert.equal(resolveFill({ brief: 'b.md' }, read), INK);
  assert.throws(() => resolveFill({}), /needs --fill/);
});

test('the command line is checked before anything runs', () => {
  const ok = parseInkArgs(['ink', 'a.png', '--out', 'o/a', '--ink', INK, '--paper', PAPER, '--erase', '1,2,3,4', '--erase', '5,6,7,8', '--width', '3072,1200']);
  assert.deepEqual(ok.opts.erase, ['1,2,3,4', '5,6,7,8']);
  assert.equal(parseInkArgs([]).cmd, 'help');
  const bad = [
    [['paint', 'a.png'], /unknown command/],
    [['ink', 'a.png', '--ink', INK], /needs --out/],
    [['ink', 'a.png', 'b.png', '--out', 'o'], /takes one image/],
    [['ink', 'a.png', '--out', 'o', '--ink', 'pink'], /#rrggbb/],
    [['ink', 'a.png', '--out', 'o', '--map', 'night'], /--map takes/],
    [['ink', 'a.png', '--out', 'o', '--texture', 'grain'], /--texture takes/],
    [['ink', 'a.png', '--out', 'o', '--width', 'big'], /--width/],
    [['ink', 'a.png', '--out', 'o', '--lo', '0.8', '--hi', '0.2'], /--lo must be below --hi/],
    [['ink', 'a.png', '--out', 'o', '--erase', '1,2,3'], /x0,y0,x1,y1/],
    [['ink', 'a.png', '--out', 'o', '--cutout', 'cat'], /person or object/],
    [['ink', 'a.png', '--out', 'o', '--cutout', 'person', '--figure', 'f.png'], /not both/],
    [['ink', 'a.png', '--out', 'o', '--glow'], /unknown option/],
    [['layers', 'a.png', '--out', 'd', '--name', 'n'], /--alpha/],
    [['layers', 'a.png', '--out', 'd', '--alpha', 'none'], /--name/],
    [['doctor', 'a.png'], /no files/],
  ];
  for (const [argv, re] of bad) assert.throws(() => parseInkArgs(argv), (e) => e instanceof UsageError && re.test(e.message), argv.join(' '));
});

test('the Python argument list carries the inks and every setting; the record names them', () => {
  const p = parseInkArgs(['ink', 'raw/p.png', '--out', 'art/p', '--map', 'paper', '--lo', '0.1', '--erase', '1,2,3,4', '--debug', '--seed', '3']);
  const inks = { ink: INK, paper: PAPER, hint: HINT };
  assert.deepEqual(inkPythonArgs(p, inks, 'art/p.figure.png'), ['ink', 'raw/p.png', 'art/p', '--ink', INK, '--paper', PAPER, '--hint', HINT, '--map', 'paper', '--lo', '0.1', '--seed', '3', '--figure', 'art/p.figure.png', '--erase', '1,2,3,4', '--debug']);
  assert.deepEqual(layersPythonArgs(parseInkArgs(['layers', 'a.png', '--out', 'art', '--name', 'k', '--alpha', 'ellipse', '--format', 'png']), INK), ['layers', 'a.png', 'art', 'k', '--alpha', 'ellipse', '--fill', INK, '--format', 'png']);
  const t = treatment(p.opts, inks);
  assert.match(t, /map paper, hatch/); assert.match(t, new RegExp(`hint ${HINT}`)); assert.match(t, /lo 0\.1/); assert.match(t, /erased 1,2,3,4/);
});

test('the Python search starts with DF_DESIGN_INK_PYTHON, then the cutout venv', () => {
  assert.deepEqual(inkPythonCandidates({ DF_DESIGN_INK_PYTHON: '/x/python' }), [['/x/python', []]]);
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'df-ink-home-'));
  try {
    const venvPy = process.platform === 'win32' ? path.join(home, 'cutout-venv', 'Scripts', 'python.exe') : path.join(home, 'cutout-venv', 'bin', 'python');
    fs.mkdirSync(path.dirname(venvPy), { recursive: true }); fs.writeFileSync(venvPy, '');
    assert.deepEqual(inkPythonCandidates({ DF_DESIGN_CUTOUT_HOME: home })[0], [venvPy, []]);
  } finally { fs.rmSync(home, { recursive: true, force: true }); }
});

// ---------------- the pixels ----------------

function findPython() {
  for (const [cmd, pre] of inkPythonCandidates()) {
    const r = spawnSync(cmd, [...pre, '-I', '-c', 'import numpy, PIL, sys; print(sys.executable)'], { encoding: 'utf8' });
    if (r.status === 0) return r.stdout.trim();
  }
  return null;
}
const PY = findPython();
const skip = PY ? false : 'no Python with numpy and Pillow found (run node scripts/cutout.mjs setup)';

const py = (code, ...args) => {
  const r = spawnSync(PY, ['-I', '-c', code, ...args], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  return r.stdout.trim();
};
const cli = (args) => spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', timeout: 240000, env: { ...process.env, DF_DESIGN_INK_PYTHON: PY || '' } });
const json = (r) => { assert.equal(r.status, 0, r.stderr || r.stdout); return JSON.parse(r.stdout); };

// Synthetic pictures: concentric rings (form everywhere), horizontal bands (contours that run left to right), a flat
// grey (no structure at all), each optionally with a saturated blue patch and a figure alpha over part of it.
const MAKE = `
import sys, numpy as np
from PIL import Image
kind, out = sys.argv[1], sys.argv[2]
H, W = 216, 384
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
if kind == 'rings': g = 0.5 + 0.5 * np.cos(np.hypot(xx - 150, yy - 108) / 7.0)
elif kind == 'bands': g = 0.5 + 0.5 * np.cos(yy / 6.0)
else: g = np.full((H, W), 0.5, np.float32)
img = np.repeat((g * 200 + 25).astype(np.uint8)[..., None], 3, axis=2)
img[20:90, 260:370] = [46, 125, 255]
Image.fromarray(img).save(out + '.png')
a = np.zeros((H, W), np.uint8); a[40:200, 280:340] = 255
Image.fromarray(a, 'L').save(out + '.alpha.png')
`;
function picture(kind) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'df-ink-'));
  py(MAKE, kind, path.join(dir, kind));
  return { dir, src: path.join(dir, `${kind}.png`), alpha: path.join(dir, `${kind}.alpha.png`) };
}
const base = ['--ink', INK, '--paper', PAPER, '--hint', HINT, '--width', '384', '--cell', '24', '--strokelen', '40', '--json'];

test('pixels: only the brief\'s inks come out, the hint only inside its mask, never on the figure', { skip, timeout: 240000 }, () => {
  const p = picture('rings');
  try {
    const free = json(cli(['ink', p.src, '--out', path.join(p.dir, 'free'), ...base])).results[0];
    assert.equal(free.colours, 3, 'ink, paper and the hint, nothing between');
    assert.ok(free.hint_pct > 0.5, `the blue patch is re-applied as the hint (${free.hint_pct} %)`);
    assert.ok(free.hint_pct < 12, 'and only there');
    const fig = json(cli(['ink', p.src, '--out', path.join(p.dir, 'fig'), ...base, '--figure', p.alpha])).results[0];
    assert.equal(fig.hint_on_figure, 0);
    assert.ok(fig.hint_pct < free.hint_pct, 'the figure took its share of the patch out of the mask');
    const none = json(cli(['ink', p.src, '--out', path.join(p.dir, 'none'), ...base, '--hint-mask', 'none'])).results[0];
    assert.equal(none.hint_pct, 0);
    assert.equal(none.colours, 2);
    const used = new Set(py('import sys, numpy as np\nfrom PIL import Image\na=np.asarray(Image.open(sys.argv[1]).convert("RGB")).reshape(-1,3)\nprint(" ".join("#%02X%02X%02X" % tuple(c) for c in np.unique(a, axis=0)))', path.join(p.dir, 'free.png')).split(' '));
    assert.deepEqual([...used].sort(), [HINT, INK, PAPER].sort());
  } finally { fs.rmSync(p.dir, { recursive: true, force: true }); }
});

test('pixels: the pass is deterministic, and each width is inked on its own', { skip, timeout: 240000 }, () => {
  const p = picture('rings');
  try {
    const a = json(cli(['ink', p.src, '--out', path.join(p.dir, 'a'), ...base, '--width', '384,192'])).results;
    assert.deepEqual(a.map((r) => [r.width, r.height]), [[384, 216], [192, 108]]);
    assert.ok(fs.existsSync(path.join(p.dir, 'a@384.png')) && fs.existsSync(path.join(p.dir, 'a@192.png')));
    json(cli(['ink', p.src, '--out', path.join(p.dir, 'b'), ...base, '--width', '384,192']));
    assert.ok(fs.readFileSync(path.join(p.dir, 'a@384.png')).equals(fs.readFileSync(path.join(p.dir, 'b@384.png'))), 'same input, same settings, same bytes');
    const seeded = json(cli(['ink', p.src, '--out', path.join(p.dir, 'c'), ...base, '--seed', '99'])).results[0];
    assert.ok(seeded.width === 384 && !fs.readFileSync(path.join(p.dir, 'a@384.png')).equals(fs.readFileSync(path.join(p.dir, 'c.png'))), 'the seed moves the strokes');
  } finally { fs.rmSync(p.dir, { recursive: true, force: true }); }
});

test('pixels: hatching follows the form; screentone stays only where there is no structure', { skip, timeout: 240000 }, () => {
  const p = picture('bands');
  const f = picture('flat');
  try {
    const bands = json(cli(['ink', p.src, '--out', path.join(p.dir, 'h'), ...base, '--hint-mask', 'none'])).results[0];
    assert.ok(bands.hatched_pct > 40, `the bands are hatched (${bands.hatched_pct} %)`);
    // horizontal bands have contours that run left to right, so the strokes do: fewer ink/paper changes along a row
    // than down a column, inside the band area (the blue patch, top right, is left out)
    const runs = py('import sys, numpy as np\nfrom PIL import Image\na=np.asarray(Image.open(sys.argv[1]).convert("L"))[100:216, 0:250] > 128\nprint(int((a[:,1:]!=a[:,:-1]).sum()), int((a[1:,:]!=a[:-1,:]).sum()))', path.join(p.dir, 'h.png')).split(' ').map(Number);
    assert.ok(runs[0] * 1.5 < runs[1], `strokes run along the contours (row changes ${runs[0]}, column changes ${runs[1]})`);
    py('import sys\nfrom PIL import Image\nImage.new("RGB",(384,216),(128,128,128)).save(sys.argv[1])', f.src);
    const flat = json(cli(['ink', f.src, '--out', path.join(f.dir, 'h'), ...base, '--hint-mask', 'none'])).results[0];
    assert.equal(flat.hatched_pct, 0, 'a flat grey has no structure, so it is screentone');
    assert.ok(flat.ink_pct > 15 && flat.paper_pct > 15, `the screentone carries the mid-tone (ink ${flat.ink_pct} %, paper ${flat.paper_pct} %)`);
    const dots = json(cli(['ink', p.src, '--out', path.join(p.dir, 'd'), ...base, '--texture', 'dots'])).results[0];
    assert.equal(dots.hatched_pct, 0);
  } finally { fs.rmSync(p.dir, { recursive: true, force: true }); fs.rmSync(f.dir, { recursive: true, force: true }); }
});

test('pixels: the maps invert for paper and hint grounds, and the hint ground spares the figure', { skip, timeout: 240000 }, () => {
  const p = picture('flat');
  try {
    // a dark flat picture: on the ink map it is mostly ink; on the paper map (inverted) mostly paper
    py('import sys\nfrom PIL import Image\nImage.new("RGB",(384,216),(30,30,30)).save(sys.argv[1])', p.src);
    const ink = json(cli(['ink', p.src, '--out', path.join(p.dir, 'i'), ...base])).results[0];
    const paper = json(cli(['ink', p.src, '--out', path.join(p.dir, 'p'), ...base, '--map', 'paper'])).results[0];
    assert.ok(ink.ink_pct > 90 && paper.paper_pct > 90, `ink map ${ink.ink_pct} % ink, paper map ${paper.paper_pct} % paper`);
    const hint = json(cli(['ink', p.src, '--out', path.join(p.dir, 'h'), ...base, '--map', 'hint', '--figure', p.alpha])).results[0];
    assert.ok(hint.hint_pct > 70, 'the hint is the ground');
    assert.equal(hint.hint_on_figure, 0, 'but not on the figure');
  } finally { fs.rmSync(p.dir, { recursive: true, force: true }); }
});

test('pixels: layers fills the figure\'s place with the ground and keeps the figure on its own plane', { skip, timeout: 240000 }, () => {
  const p = picture('rings');
  try {
    json(cli(['ink', p.src, '--out', path.join(p.dir, 'k'), ...base]));
    const r = json(cli(['layers', path.join(p.dir, 'k.png'), '--out', path.join(p.dir, 'art'), '--name', 'k', '--alpha', p.alpha, '--fill', INK, '--format', 'png', '--json'])).results[0];
    assert.ok(r.figure_pct > 8 && r.figure_pct < 15, `the figure is its share of the frame (${r.figure_pct} %)`);
    const probe = py('import sys, numpy as np\nfrom PIL import Image\nb=np.asarray(Image.open(sys.argv[1]).convert("RGB"));f=np.asarray(Image.open(sys.argv[2]))\nprint("#%02X%02X%02X" % tuple(b[120,310]), f.shape[2], int(f[120,310,3]), int(f[10,10,3]))', r.background, r.figure).split(' ');
    assert.equal(probe[0], INK, 'the figure\'s place in the background is the ground');
    assert.equal(probe[1], '4');
    assert.equal(probe[2], '255', 'the figure is opaque on its plane');
    assert.equal(probe[3], '0', 'and transparent round it');
    const webp = json(cli(['layers', path.join(p.dir, 'k.png'), '--out', path.join(p.dir, 'art'), '--name', 'e', '--alpha', 'ellipse', '--fill', INK, '--json'])).results[0];
    assert.match(webp.background, /e\.webp$/);
    assert.equal(webp.figure, null);
  } finally { fs.rmSync(p.dir, { recursive: true, force: true }); }
});
