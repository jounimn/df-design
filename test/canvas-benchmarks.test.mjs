import test from 'node:test';
import assert from 'node:assert/strict';
import { summariseCanvases, renderBenchmarkSection, ceilingsFrom } from '../scripts/lib/canvas-benchmarks.mjs';

// A probe record, reduced to what the aggregator reads.
const canvas = (over = {}) => ({
  selector: 'canvas#c', context: 'webgl', renderer: 'ANGLE (Test GPU)', animating: true, blank: false,
  frameMs: { p50: 16.7, p95: 20 }, drawCallsOffscreen: 0, reducedMotionAnimating: false, fallbackVisible: true,
  ...over,
});
const record = (site, motionJsBytes, canvases) => ({ site, canvasJsBytes: { jsBytes: motionJsBytes + 1000, motionJsBytes }, canvases });

const cohort = {
  'Clay 3D': { tier: 'high', sites: ['a.example', 'b.example', 'c.example', 'd.example'] },
  'ASCII art': { tier: 'medium', sites: ['e.example'] },
  'Neon glow': { tier: 'fast', sites: ['f.example'] },
};

test('median and p75 are computed on motion JS weight', () => {
  const records = [
    record('a.example', 100000, [canvas()]),
    record('b.example', 200000, [canvas()]),
    record('c.example', 300000, [canvas()]),
    record('d.example', 400000, [canvas()]),
  ];
  const s = summariseCanvases(records, cohort);
  assert.deepEqual(s.techniques['Clay 3D'].weight, { min: 100000, median: 250000, max: 400000 });
  assert.equal(s.tiers.high.p75, 300000, 'nearest-rank p75 of four values is the third');
});

test('a technique with no records, or none with an animating canvas, is "not measured" and renders no number', () => {
  const records = [record('e.example', 5000, [canvas({ animating: false })])];
  const s = summariseCanvases(records, cohort);
  assert.equal(s.techniques['ASCII art'], 'not measured');
  assert.equal(s.techniques['Neon glow'], 'not measured');
  const md = renderBenchmarkSection(s, '2026-10-14');
  const row = md.split('\n').find((l) => l.includes('Neon glow'));
  assert.match(row, /not measured/);
  assert.equal(/\d/.test(row.replace('Neon glow', '')), false, `no number in: ${row}`);
});

test('frameMs is never compared across renderers: two renderers give two rows', () => {
  const records = [
    record('a.example', 1, [canvas({ renderer: 'ANGLE (Intel UHD)', frameMs: { p50: 8, p95: 10 } })]),
    record('b.example', 1, [canvas({ renderer: 'SwiftShader', frameMs: { p50: 33, p95: 50 } })]),
    record('c.example', 1, [canvas({ renderer: 'SwiftShader', frameMs: { p50: 35, p95: 60 } })]),
  ];
  const { frameMs } = summariseCanvases(records, cohort).techniques['Clay 3D'];
  assert.deepEqual(frameMs.map((r) => r.renderer).sort(), ['ANGLE (Intel UHD)', 'SwiftShader']);
  const soft = frameMs.find((r) => r.renderer === 'SwiftShader');
  assert.equal(soft.n, 2);
  assert.deepEqual(soft.p50, { min: 33, median: 34, max: 35 });
  const md = renderBenchmarkSection(summariseCanvases(records, cohort), '2026-10-14');
  assert.match(md, /SwiftShader/);
  assert.match(md, /ANGLE \(Intel UHD\)/);
});

test('shares are fractions of the technique\'s canvases, ignoring those that could not be judged', () => {
  const records = [
    record('a.example', 1, [
      canvas({ reducedMotionAnimating: false, drawCallsOffscreen: 0, fallbackVisible: true }),
      canvas({ selector: 'canvas#2', reducedMotionAnimating: true, drawCallsOffscreen: 90, fallbackVisible: false }),
    ]),
    record('b.example', 1, [
      canvas({ reducedMotionAnimating: false, drawCallsOffscreen: null, fallbackVisible: null, context: '2d' }),
      canvas({ selector: 'canvas#3', reducedMotionAnimating: false, drawCallsOffscreen: 0, fallbackVisible: true }),
    ]),
  ];
  const t = summariseCanvases(records, cohort).techniques['Clay 3D'];
  assert.equal(t.canvases, 4);
  assert.equal(t.reducedMotionShare, 3 / 4);
  assert.equal(t.offscreenPauseShare, 2 / 3, 'the canvas with drawCallsOffscreen null is not counted');
  assert.equal(t.fallbackShare, 2 / 3, 'the 2D canvas with fallbackVisible null is not counted');
});

test('a share with nothing to judge is null, not 0', () => {
  const records = [record('a.example', 1, [canvas({ drawCallsOffscreen: null, fallbackVisible: null })])];
  const t = summariseCanvases(records, cohort).techniques['Clay 3D'];
  assert.equal(t.offscreenPauseShare, null);
  assert.equal(t.fallbackShare, null);
});

test('only canvases that animate count, and a record from before canvas tracing is skipped', () => {
  const records = [
    record('a.example', 100, [canvas(), canvas({ selector: 'canvas#still', animating: false })]),
    { site: 'b.example' },
    { site: 'c.example', canvases: null, canvasJsBytes: null },
  ];
  const t = summariseCanvases(records, cohort).techniques['Clay 3D'];
  assert.equal(t.canvases, 1);
  assert.equal(t.sites, 1);
});

test('ceilingsFrom returns the per-tier p75 only for tiers that have data', () => {
  const records = [
    record('a.example', 100000, [canvas()]),
    record('b.example', 300000, [canvas()]),
    record('e.example', 20000, [canvas({ context: '2d' })]),
  ];
  const s = summariseCanvases(records, cohort);
  assert.deepEqual(ceilingsFrom(s), { medium: 20000, high: 300000 });
  assert.equal('fast' in ceilingsFrom(s), false);
});

test('a site shared by two techniques counts once in its tier\'s p75', () => {
  const shared = { A: { tier: 'high', sites: ['a.example', 'b.example'] }, B: { tier: 'high', sites: ['a.example'] } };
  const records = [record('a.example', 100, [canvas()]), record('b.example', 900, [canvas()])];
  const s = summariseCanvases(records, shared);
  assert.equal(s.tiers.high.n, 2);
  assert.equal(s.tiers.high.p75, 900);
});

test('the section is headed with the date and states the renderer next to every frame time', () => {
  const records = [record('a.example', 150000, [canvas()])];
  const md = renderBenchmarkSection(summariseCanvases(records, cohort), '2026-10-14');
  assert.match(md, /^## Canvas and WebGL, measured 2026-10-14$/m);
  assert.match(md, /ANGLE \(Test GPU\)/);
  assert.match(md, /Clay 3D/);
});
