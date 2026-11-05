import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseProbeArgs, probe, splitClicks } from '../scripts/probe.mjs';
import { startFixtureServer } from './helpers/fixture-server.mjs';
import { motionFixture } from './helpers/motion-fixture.mjs';

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');

test('a conventional page probes end to end', async () => {
  const server = await startFixtureServer(FIXTURES);
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'dfd-probe-'));
  try {
    const { record, dir } = await probe(`${server.url}/static-basic.html`, { root, cohort: 'fixture' });
    assert.equal(record.archetype, 'typographic');
    assert.equal(record.hero.fontSizePx, 72);
    assert.equal(record.cohort, 'fixture');
    assert.ok(record.measured_at, 'record must carry its own measurement date');
    await fs.access(path.join(dir, 'contact.png'));
    await fs.access(path.join(dir, 'motion.json'));
    const raw = JSON.parse(await fs.readFile(path.join(dir, 'raw.json'), 'utf8'));
    assert.equal(raw.motionCapture, undefined, 'a page that scrolls gets no motion capture unless asked');
  } finally {
    await fs.rm(root, { recursive: true, force: true });
    await server.close();
  }
});

// Spec §14 test 6 — the Antigravity case. If this fails, the prober is not finished.
test('a heroless, mostly-animated page yields a usable record and drops nothing', async () => {
  const server = await startFixtureServer(FIXTURES);
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'dfd-probe-'));
  try {
    const { record, dir } = await probe(`${server.url}/heroless-canvas.html`, { root });
    assert.ok(['canvas', 'novel'].includes(record.archetype), `unexpected archetype ${record.archetype}`);
    assert.equal(record.hero, null);

    const motion = JSON.parse(await fs.readFile(path.join(dir, 'motion.json'), 'utf8'));
    assert.ok(motion.trace.elements.length > 0, 'motion.json must not be empty for an animated page');

    // Nothing dropped: the record exists, is addressable, and keeps its raw capture.
    assert.equal(record.site, new URL(server.url).hostname);
    await fs.access(path.join(dir, 'raw.json'));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
    await server.close();
  }
});

test('records whether the site honours the reduced-motion contract', async () => {
  const server = await startFixtureServer(FIXTURES);
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'dfd-probe-'));
  try {
    const { record } = await probe(`${server.url}/css-motion.html`, { root });
    assert.equal(typeof record.reducedMotion.honoured, 'boolean');
  } finally {
    await fs.rm(root, { recursive: true, force: true });
    await server.close();
  }
});

test('records the canvases of a WebGL page, with weight and libraries', async () => {
  const fx = motionFixture('healthy');
  const server = await startFixtureServer(fx.dir);
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'dfd-probe-'));
  try {
    const { record, quarantine } = await probe(`${server.url}/page.html`, { root });
    assert.equal(record.canvases.length, 1);
    assert.equal(record.canvases[0].selector, 'canvas#c');
    assert.equal(record.canvases[0].context, 'webgl');
    assert.equal(record.canvases[0].animating, true);
    assert.ok(record.canvasJsBytes.motionJsBytes > 0);
    assert.deepEqual(record.libraries, []);
    assert.deepEqual(quarantine.filter((q) => q.field === 'canvases'), []);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
    await server.close();
    fx.cleanup();
  }
});

// ---- Options for pages that stream forever or sit behind a gate (the YOLO survey, 2026-11-03) -----------------

test('parseProbeArgs: the old command line keeps the old defaults', () => {
  assert.deepEqual(parseProbeArgs(['https://x.example/']), { url: 'https://x.example/', cohort: null, root: 'captures', wait: 'load', timeout: 30000, clicks: [] });
  assert.deepEqual(parseProbeArgs(['https://x.example/', '--cohort', 'yolo', '--root', 'out']).cohort, 'yolo');
});

test('parseProbeArgs: --wait, --timeout and --click, repeatable and comma-separated', () => {
  const o = parseProbeArgs(['https://x.example/', '--wait', 'domcontentloaded', '--timeout', '60000', '--click', '#age-yes, #sound-off', '--click', ':is(.begin, .start)']);
  assert.equal(o.wait, 'domcontentloaded');
  assert.equal(o.timeout, 60000);
  assert.deepEqual(o.clicks, ['#age-yes', '#sound-off', ':is(.begin, .start)']);
  assert.deepEqual(splitClicks('button[data-x="a,b"], #go'), ['button[data-x="a,b"]', '#go']);
});

test('parseProbeArgs: a bad wait, a bad timeout, a missing value, an unknown option and no url are refused', () => {
  for (const argv of [
    ['https://x.example/', '--wait', 'never'],
    ['https://x.example/', '--timeout', 'soon'],
    ['https://x.example/', '--timeout', '-5'],
    ['https://x.example/', '--click'],
    ['https://x.example/', '--bogus'],
    ['--wait', 'load'],
  ]) assert.throws(() => parseProbeArgs(argv), Error, argv.join(' '));
});

// A gate: the content and the sound arrive only after the visitor clicks "Enter".
const GATE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Gate</title></head><body>
<button id="enter" style="font-size:40px">Enter</button><main id="m" hidden><h1 style="font-size:72px">Behind the gate</h1><p>Inside.</p></main>
<script>fetch('poster.png');document.getElementById('enter').addEventListener('click', () => { document.getElementById('m').hidden = false; fetch('tone.mp3'); });</script>
</body></html>`;

async function gateSite() {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'dfd-gate-'));
  await fs.writeFile(path.join(dir, 'gate.html'), GATE);
  await fs.writeFile(path.join(dir, 'tone.mp3'), Buffer.alloc(30000, 3));
  await fs.writeFile(path.join(dir, 'poster.png'), Buffer.alloc(5000, 1));
  const server = await startFixtureServer(dir);
  return { url: `${server.url}/gate.html`, close: async () => { await server.close(); await fs.rm(dir, { recursive: true, force: true }); } };
}

test('--click passes a gate; the record weighs the first view before the click and the full page after it', async () => {
  const site = await gateSite();
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'dfd-probe-'));
  try {
    const { record } = await probe(site.url, { root, wait: 'domcontentloaded', timeout: 20000, clicks: ['#enter'] });
    assert.deepEqual(record.load, { wait: 'domcontentloaded', timeout: 20000, clicks: ['#enter'] });
    assert.equal(record.transfer.firstView.byKind.audio, 0);
    assert.ok(record.transfer.firstView.byKind.images >= 5000, JSON.stringify(record.transfer.firstView));
    assert.ok(record.transfer.full.byKind.audio >= 30000, JSON.stringify(record.transfer.full));
    assert.equal(record.transfer.audioBeforeGesture, 0);
    assert.ok(record.transfer.full.total > record.transfer.firstView.total);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
    await site.close();
  }
});

test('a click that finds nothing is recorded as a gate not passed, and the probe still finishes', async () => {
  const site = await gateSite();
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'dfd-probe-'));
  try {
    const { record } = await probe(site.url, { root, timeout: 3000, clicks: ['#no-such-button'] });
    assert.equal(record.load.clicksFailed.length, 1);
    assert.equal(record.load.clicksFailed[0].selector, '#no-such-button');
    assert.equal(record.transfer.full.byKind.audio, 0);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
    await site.close();
  }
});

test('a page without a canvas records an empty list', async () => {
  const fx = motionFixture('noCanvas');
  const server = await startFixtureServer(fx.dir);
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'dfd-probe-'));
  try {
    const { record } = await probe(`${server.url}/page.html`, { root });
    assert.deepEqual(record.canvases, []);
    assert.deepEqual(record.libraries, []);
  } finally {
    await fs.rm(root, { recursive: true, force: true });
    await server.close();
    fx.cleanup();
  }
});

test('a page whose scrolling a library owns gets the motion capture in its bundle', { timeout: 240000 }, async () => {
  const server = await startFixtureServer(FIXTURES);
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'dfd-probe-'));
  try {
    const { dir, motionCapture } = await probe(`${server.url}/motion-owned.html`, { root });
    assert.equal(motionCapture.why, 'programmatic scroll did not move the document');
    assert.equal(motionCapture.reachedEnd, true, motionCapture.endReason);
    assert.equal(motionCapture.movedBy, 'wheel');
    const raw = JSON.parse(await fs.readFile(path.join(dir, 'raw.json'), 'utf8'));
    assert.deepEqual(raw.motionCapture, motionCapture);
    const motion = JSON.parse(await fs.readFile(path.join(dir, 'motion.json'), 'utf8'));
    assert.equal(motion.scroll.available, false);
    assert.deepEqual(motion.capture, motionCapture);
    for (const s of motionCapture.sheets) await fs.access(path.join(dir, s));
    await fs.access(path.join(dir, 'motion', 'video.webm'));
    await fs.access(path.join(dir, 'motion', 'capture.json'));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
    await server.close();
  }
});

test('a virtual scroller, where the document does not scroll at all, gets the motion capture too', { timeout: 240000 }, async () => {
  const server = await startFixtureServer(FIXTURES);
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'dfd-probe-'));
  try {
    const { dir, motionCapture } = await probe(`${server.url}/motion-virtual.html`, { root });
    assert.match(motionCapture.why, /^virtual scroll/);
    assert.equal(motionCapture.reachedEnd, true, motionCapture.endReason);
    assert.equal(motionCapture.movedBy, 'wheel');
    const raw = JSON.parse(await fs.readFile(path.join(dir, 'raw.json'), 'utf8'));
    assert.deepEqual(raw.motionCapture, motionCapture);
    const motion = JSON.parse(await fs.readFile(path.join(dir, 'motion.json'), 'utf8'));
    assert.equal(motion.scroll.available, false);
    assert.deepEqual(motion.capture, motionCapture);
    for (const s of motionCapture.sheets) await fs.access(path.join(dir, s));
    await fs.access(path.join(dir, 'motion', 'video.webm'));
    await fs.access(path.join(dir, 'motion', 'capture.json'));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
    await server.close();
  }
});

test('--motion asks for the capture on a page that scrolls normally', { timeout: 240000 }, async () => {
  const server = await startFixtureServer(FIXTURES);
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'dfd-probe-'));
  try {
    const { dir, motionCapture } = await probe(`${server.url}/motion-normal.html`, { root, motion: true });
    assert.equal(motionCapture.why, 'asked (--motion)');
    assert.equal(motionCapture.reachedEnd, true);
    await fs.access(path.join(dir, motionCapture.sheets[0]));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
    await server.close();
  }
});
