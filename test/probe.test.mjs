import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { probe } from '../scripts/probe.mjs';
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
