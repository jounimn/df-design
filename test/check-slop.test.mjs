import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { lintStatic, collectFiles, GATES } from '../scripts/lib/slop-static.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIX = path.join(HERE, 'fixtures', 'slop');
const CLI = path.join(HERE, '..', 'scripts', 'check-slop.mjs');

const run = (file) => lintStatic(collectFiles([path.join(FIX, file)]));
const gates = (r, grade) => r.findings.filter((f) => !grade || f.grade === grade).map((f) => f.gate);
const find = (r, gate) => r.findings.filter((f) => f.gate === gate);

test('every gate in the table has a tier and a one-line tell', () => {
  for (const [id, g] of Object.entries(GATES)) {
    assert.ok(['floor', 'reflex', 'finish'].includes(g.tier), `${id}: tier ${g.tier}`);
    assert.ok(g.tell && g.fix, `${id}: needs a tell and a fix`);
  }
});

test('the slopped page fails every Floor gate it was built to fail', () => {
  const r = run('slopped.html');
  const fails = new Set(gates(r, 'FAIL'));
  for (const g of ['transition-all', 'animates-layout', 'overflow-hidden', 'literal-colour', 'literal-font', 'gradient-ai', 'italic-word',
    'card-in-card', 'emoji-icon', 'focus-visible', 'focus-fades', 'reduced-motion', 'hidden-at-rest', 'decorative-svg', 'img-alt',
    'autoplay-unmuted', 'placeholder-copy']) {
    assert.ok(fails.has(g), `expected FAIL ${g}; got ${[...fails].join(', ')}`);
  }
});

test('the slopped page trips every Reflex gate it was built to trip', () => {
  const r = run('slopped.html');
  const reflex = new Set(gates(r, 'REFLEX'));
  for (const g of ['eyebrow', 'tracked-caps', 'mono-costume', 'safe-display-face', 'middle-dots', 'arrow-glued', 'word-dash-label',
    'numbered-markers', 'stock-second-action', 'buzzwords', 'uniform-radius', 'glow', 'sticky-collision', 'vh-hero',
    'bare-1fr-image-track', 'three-tiles', 'invented-proof']) {
    assert.ok(reflex.has(g), `expected REFLEX ${g}; got ${[...reflex].join(', ')}`);
  }
});

test('findings point at a file and a line, with the evidence quoted', () => {
  const r = run('slopped.html');
  const [ta] = find(r, 'transition-all');
  assert.match(ta.file, /slopped\.html$/);
  assert.ok(ta.line > 0);
  assert.match(ta.evidence, /\.card/);
  const [kf] = find(r, 'animates-layout');
  assert.match(kf.evidence, /grow.*width/);
  const [em] = find(r, 'italic-word');
  assert.match(em.evidence, /<em>.*h1/);
  const [dots] = find(r, 'middle-dots');
  assert.match(dots.evidence, /Design · Build · Ship/);
});

test('the clean page has no FAIL and no open REFLEX, and its waivers show as WAIVED', () => {
  const r = run('clean.html');
  assert.deepEqual(gates(r, 'FAIL'), [], JSON.stringify(find(r, gates(r, 'FAIL')[0]), null, 1));
  assert.deepEqual(gates(r, 'REFLEX'), [], JSON.stringify(r.findings.filter((f) => f.grade === 'REFLEX'), null, 1));
  const waived = gates(r, 'WAIVED');
  assert.ok(waived.includes('numbered-markers'), `numbered-markers waiver (HTML comment) should show: ${waived}`);
  assert.ok(waived.includes('mono-costume'), `mono-costume waiver (CSS comment) should show: ${waived}`);
  assert.equal(r.ok, true);
});

test('a waiver on a Floor gate is rejected and the gate still fires', () => {
  const r = run('named-look.html');
  const rejected = r.findings.find((f) => f.grade === 'WAIVER');
  assert.ok(rejected, 'a rejected waiver reports as WAIVER');
  assert.match(rejected.evidence, /focus-visible.*Floor/);
  assert.ok(gates(r, 'FAIL').includes('focus-visible'));
});

test('cream paper, a high-contrast serif and a terracotta accent is the named look', () => {
  const r = run('named-look.html');
  const [nl] = find(r, 'named-look');
  assert.ok(nl, 'named-look should fire');
  assert.equal(nl.grade, 'REFLEX');
  assert.match(nl.evidence, /cream|L 9\d/i);
});

test('a waiver reason under 24 characters is rejected', () => {
  const r = lintStatic([{ file: 'x.html', text: `<!doctype html><html lang="en"><head><title>t</title><meta name="viewport" content="width=device-width">
<!-- df-design · waive eyebrow · because -->
<style>:root{--ink:#222;--paper:#fdfbf7;--font-body:system-ui}html,body{overflow-x:clip}body{color:var(--ink);background:var(--paper);font-family:var(--font-body)}
.eyebrow{text-transform:uppercase;letter-spacing:.12em;font-size:12px} a:focus-visible{outline:2px solid var(--ink)}</style></head>
<body><div><p class="eyebrow">Features</p><h2>What you get</h2></div><a href="#x">Go</a></body></html>` }]);
  assert.ok(r.findings.some((f) => f.grade === 'WAIVER' && /under 24/.test(f.evidence)));
  assert.ok(gates(r, 'REFLEX').includes('eyebrow'));
});

test('a stylesheet linked from the page is read with the page', () => {
  const files = collectFiles([path.join(FIX, 'linked')]);
  const r = lintStatic(files);
  assert.ok(gates(r, 'FAIL').includes('transition-all'), 'the linked CSS carries transition: all');
  assert.ok(find(r, 'transition-all')[0].file.endsWith('site.css'));
});

test('the CLI exits 1 on a FAIL, 0 on a clean page, and prints JSON on request', () => {
  const bad = spawnSync(process.execPath, [CLI, path.join(FIX, 'slopped.html')], { encoding: 'utf8' });
  assert.equal(bad.status, 1, bad.stdout + bad.stderr);
  assert.match(bad.stdout, /FAIL/);
  assert.match(bad.stdout, /Floor \d+ FAIL · Reflex \d+/);
  const good = spawnSync(process.execPath, [CLI, path.join(FIX, 'clean.html')], { encoding: 'utf8' });
  assert.equal(good.status, 0, good.stdout + good.stderr);
  const json = spawnSync(process.execPath, [CLI, path.join(FIX, 'slopped.html'), '--json'], { encoding: 'utf8' });
  const parsed = JSON.parse(json.stdout);
  assert.ok(Array.isArray(parsed.findings) && parsed.findings.length > 10);
  assert.equal(parsed.ok, false);
  const floorOnly = spawnSync(process.execPath, [CLI, path.join(FIX, 'named-look.html'), '--tier', 'floor'], { encoding: 'utf8' });
  assert.equal(floorOnly.status, 1, 'focus-visible is Floor and still fails under --tier floor');
  const usage = spawnSync(process.execPath, [CLI], { encoding: 'utf8' });
  assert.equal(usage.status, 2);
});

// --- render tier ------------------------------------------------------------------------------------------------------
import os from 'node:os';
import fs from 'node:fs';
import { renderCheck } from '../scripts/lib/slop-render.mjs';
import { launchBrowser } from '../scripts/lib/browser.mjs';

const renderGates = (r, grade) => [...new Set(r.findings.filter((f) => !grade || f.grade === grade).map((f) => f.gate))];

test('the render tier names what only a browser can see on the bad page', { timeout: 180000 }, async () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'df-slop-'));
  const browser = await launchBrowser();
  try {
    const r = await renderCheck({ pages: [path.join(FIX, 'render-bad.html')], out, browser });
    const fails = new Set(renderGates(r, 'FAIL'));
    for (const g of ['fold', 'horizontal-scroll', 'focus-ring', 'measure', 'broken-image', 'hidden-without-script']) assert.ok(fails.has(g), `expected FAIL ${g}; got ${[...fails]}`);
    const reflex = new Set(renderGates(r, 'REFLEX'));
    for (const g of ['text-strain', 'container-cap', 'dead-half']) assert.ok(reflex.has(g), `expected REFLEX ${g}; got ${[...reflex]}`);
    const fold = r.findings.find((f) => f.gate === 'fold');
    assert.match(fold.evidence, /headline|action/);
    const hs = r.findings.find((f) => f.gate === 'horizontal-scroll');
    assert.match(hs.evidence, /scrollWidth \d+ at \d+px/);
    assert.equal(r.rendered, 1);
    assert.ok(r.screenshots.length >= 4, 'fold, hero, full 1440 and full 390 screenshots');
    for (const s of r.screenshots) assert.ok(fs.existsSync(path.resolve(s)), `${s} written`);
  } finally {
    await browser.close();
    fs.rmSync(out, { recursive: true, force: true });
  }
});

test('the render tier passes the good page with nothing to fix', { timeout: 180000 }, async () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'df-slop-'));
  const browser = await launchBrowser();
  try {
    const r = await renderCheck({ pages: [path.join(FIX, 'render-good.html')], out, browser });
    assert.deepEqual(renderGates(r, 'FAIL'), [], JSON.stringify(r.findings.filter((f) => f.grade === 'FAIL'), null, 1));
    assert.deepEqual(renderGates(r, 'REFLEX'), [], JSON.stringify(r.findings.filter((f) => f.grade === 'REFLEX'), null, 1));
  } finally {
    await browser.close();
    fs.rmSync(out, { recursive: true, force: true });
  }
});

test('--render on the CLI merges both tiers and reports the pages rendered', { timeout: 180000 }, () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'df-slop-'));
  try {
    const r = spawnSync(process.execPath, [CLI, path.join(FIX, 'render-good.html'), '--render', '--out', out, '--json'], { encoding: 'utf8', timeout: 170000 });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    const parsed = JSON.parse(r.stdout);
    assert.equal(parsed.rendered, 1);
    assert.ok(parsed.screenshots.length >= 4);
  } finally {
    fs.rmSync(out, { recursive: true, force: true });
  }
});

// --- the gate list and references/gates.md agree --------------------------------------------------------------------
test('every mechanical gate is documented in references/gates.md with its tier, and vice versa', () => {
  const doc = fs.readFileSync(path.join(HERE, '..', 'references', 'gates.md'), 'utf8');
  const rows = [...doc.matchAll(/^\| `([a-z0-9-]+)` \| (Floor|Reflex|Finish) \| ([MRJ/]+) \|/gm)].map((m) => ({ id: m[1], tier: m[2].toLowerCase(), cls: m[3] }));
  const documented = new Map(rows.map((r) => [r.id, r]));
  for (const [id, g] of Object.entries(GATES)) {
    const row = documented.get(id);
    assert.ok(row, `${id} is in GATES but not in references/gates.md §3`);
    assert.equal(row.tier, g.tier, `${id}: gates.md says ${row.tier}, GATES says ${g.tier}`);
    if (g.render) assert.ok(/R/.test(row.cls), `${id} is a render gate; gates.md must class it R`);
    else assert.ok(/M/.test(row.cls), `${id} is a static gate; gates.md must class it M`);
  }
  for (const r of rows) assert.ok(GATES[r.id], `${r.id} is in gates.md as a script-checked gate (backticked) but GATES does not implement it`);
});
