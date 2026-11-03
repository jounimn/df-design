import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { lintSet, roughenPoints, pointsToPath, rng } from '../scripts/lib/drawn.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GOOD = path.join(HERE, 'fixtures', 'drawn', 'good');
const BAD = path.join(HERE, 'fixtures', 'drawn', 'bad');
const CLI = path.join(HERE, '..', 'scripts', 'draw.mjs');
const run = (...args) => spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', timeout: 120000 });
const svg = (body, attrs = 'viewBox="0 0 24 24"') => `<svg xmlns="http://www.w3.org/2000/svg" ${attrs}>${body}</svg>`;
const rules = (findings, level) => findings.filter((f) => !level || f.level === level).map((f) => f.rule).sort();

test('a set drawn in currentColor, tokens and one width passes', () => {
  const f = lintSet([
    { name: 'a.svg', svg: svg('<path d="M2 2h20" stroke="currentColor" stroke-width="1.5"/>') },
    { name: 'b.svg', svg: svg('<circle cx="12" cy="12" r="4" style="stroke:var(--hint);stroke-width:1.5;fill:none"/>') },
  ], { stroke: 1.5 });
  assert.deepEqual(f, []);
});

test('raster, live text, script and stray colours fail; the palette lets a named colour through', () => {
  const f = lintSet([{ name: 'x.svg', svg: svg('<image href="data:image/png;base64,AA"/><text>hi</text><script>1</script><path d="M0 0" fill="#C0FFEE" stroke="rgb(1, 2, 3)"/>') }]);
  assert.deepEqual(rules(f, 'FAIL'), ['colour', 'colour', 'raster', 'script', 'text']);
  const ok = lintSet([{ name: 'x.svg', svg: svg('<path d="M0 0" fill="#c0ffee"/>') }], { palette: ['#C0FFEE'] });
  assert.deepEqual(ok, []);
});

test('no viewBox fails; a viewBox, width or cap that differs from the set warns', () => {
  const f = lintSet([
    { name: 'a.svg', svg: svg('<path d="M0 0" stroke-width="2" stroke-linecap="round"/>') },
    { name: 'b.svg', svg: svg('<path d="M0 0" stroke-width="2" stroke-linecap="round"/>') },
    { name: 'c.svg', svg: svg('<path d="M0 0" stroke-width="3" stroke-linecap="butt"/>', 'viewBox="0 0 48 48"') },
    { name: 'd.svg', svg: svg('<path d="M0 0"/>', '') },
  ]);
  assert.deepEqual(rules(f, 'FAIL'), ['viewbox']);
  assert.deepEqual(rules(f, 'WARN'), ['linecap', 'stroke-width', 'viewbox']);
  assert.equal(f.find((x) => x.level === 'WARN' && x.rule === 'viewbox').file, 'c.svg');
});

test('--stroke turns another width into a FAIL on the file that draws it', () => {
  const f = lintSet([{ name: 'a.svg', svg: svg('<path d="M0 0" stroke-width="2"/>') }], { stroke: 1.5 });
  assert.deepEqual(f.map((x) => [x.level, x.rule, x.file]), [['FAIL', 'stroke-width', 'a.svg']]);
});

test('roughenPoints repeats for one seed, differs across seeds, and never moves a point past the amount', () => {
  const line = Array.from({ length: 40 }, (_, i) => [i * 2, 10]);
  const a = roughenPoints(line, { seed: 5, amount: 1 });
  assert.deepEqual(a, roughenPoints(line, { seed: 5, amount: 1 }));
  assert.notDeepEqual(a, roughenPoints(line, { seed: 6, amount: 1 }));
  for (const [i, [x, y]] of a.entries()) {
    assert.ok(Math.hypot(x - line[i][0], y - line[i][1]) <= 1 + 1e-9, `point ${i} moved too far`);
  }
  assert.ok(a.some(([, y]) => Math.abs(y - 10) > 0.05), 'the line wavers');
  assert.deepEqual(roughenPoints(line, { seed: 5, amount: 0 }), line);
});

test('pointsToPath writes one cubic per segment and closes a closed run', () => {
  const pts = [[0, 0], [10, 0], [10, 10], [0, 10]];
  const open = pointsToPath(pts);
  assert.match(open, /^M0 0(C[-\d. ]+){3}$/);
  const closed = pointsToPath(pts, { closed: true });
  assert.equal((closed.match(/C/g) || []).length, 4);
  assert.ok(closed.endsWith('Z'));
  assert.ok(rng(1)() !== rng(2)());
});

test('check exits 0 on the good set and 1 on the bad one, and --json carries the findings', () => {
  const good = run('check', GOOD, '--stroke', '2');
  assert.equal(good.status, 0, good.stdout + good.stderr);
  assert.match(good.stdout, /2 drawings · 0 FAIL/);
  const badRun = run('check', BAD, '--json');
  assert.equal(badRun.status, 1);
  const j = JSON.parse(badRun.stdout);
  assert.equal(j.files, 2);
  assert.ok(j.findings.some((x) => x.rule === 'raster'));
});

test('bad command lines exit 2', () => {
  assert.equal(run().status, 2);
  assert.equal(run('paint', GOOD).status, 2);
  assert.equal(run('check', GOOD, '--bogus').status, 2);
  assert.equal(run('check', 'no-such-folder').status, 2);
});

test('roughen redraws every shape as a path, keeps the styling, and repeats for one seed; sheet writes a PNG', { timeout: 180000 }, () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'df-draw-'));
  try {
    const a = path.join(out, 'a.svg'), b = path.join(out, 'b.svg');
    let r = run('roughen', path.join(GOOD, 'spark.svg'), '--seed', '4', '--out', a);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    r = run('roughen', path.join(GOOD, 'spark.svg'), '--seed', '4', '--out', b);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    const drawn = fs.readFileSync(a, 'utf8');
    assert.equal(drawn, fs.readFileSync(b, 'utf8'));
    assert.doesNotMatch(drawn, /<(polygon|circle)\b/);
    assert.equal((drawn.match(/<path\b/g) || []).length, 2);
    assert.match(drawn, /stroke="var\(--hint\)"/);
    assert.match(drawn, /seed 4/);
    assert.equal(run('check', a, '--stroke', '2').status, 0);
    const sheet = path.join(out, 'sheet.png');
    r = run('sheet', GOOD, '--out', sheet);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    assert.equal(fs.readFileSync(sheet).subarray(1, 4).toString(), 'PNG');
  } finally { fs.rmSync(out, { recursive: true, force: true }); }
});
