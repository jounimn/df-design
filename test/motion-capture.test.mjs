import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { launchBrowser } from '../scripts/lib/browser.mjs';
import { captureMotion } from '../scripts/lib/motion-capture.mjs';
import { startFixtureServer } from './helpers/fixture-server.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(HERE, 'fixtures');
const CLI = path.join(HERE, '..', 'scripts', 'capture-motion.mjs');
const T = { timeout: 240000 };

let browser;
let server;
let root;
test.before(async () => {
  browser = await launchBrowser();
  server = await startFixtureServer(FIXTURES);
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'dfd-motion-'));
});
test.after(async () => {
  await browser?.close();
  await server?.close();
  fs.rmSync(root, { recursive: true, force: true });
});

const written = (cap) => {
  assert.ok(fs.existsSync(path.join(cap.dir, 'video.webm')), 'video.webm written');
  assert.ok(cap.sheets.length > 0, 'at least one sheet');
  for (const s of cap.sheets) assert.ok(fs.statSync(path.join(cap.dir, s)).size > 1000, `${s} is an image`);
  assert.ok(cap.stills.length >= 2, `stills at the start and the end (${cap.stills.length})`);
  for (const s of cap.stills) assert.ok(fs.existsSync(path.join(cap.dir, s.file)), `${s.file} written`);
  const json = JSON.parse(fs.readFileSync(path.join(cap.dir, 'capture.json'), 'utf8'));
  assert.equal(json.steps, cap.steps);
  assert.equal(json.reachedEnd, cap.reachedEnd);
  assert.ok(json.durations.totalMs > 0 && json.durations.videoSeconds > 0);
};

test('a normal scrolling page is driven by the wheel to its true end', T, async () => {
  const cap = await captureMotion(browser, `${server.url}/motion-normal.html`, { out: path.join(root, 'normal') });
  assert.deepEqual(cap.errors, []);
  assert.equal(cap.reachedEnd, true, cap.endReason);
  assert.equal(cap.maxStepsHit, false);
  assert.equal(cap.movedBy, 'wheel');
  assert.equal(cap.nativeScroll, true);
  assert.equal(cap.stills.at(-1).scrollY, 3100, 'the last still is the bottom of the page');
  assert.ok(cap.stills.length >= 4, `a still for each screen or so (${cap.stills.length})`);
  written(cap);
});

test('a virtual-scroll page, where scrollTo does nothing, is driven by the wheel through every scene', T, async () => {
  const cap = await captureMotion(browser, `${server.url}/motion-virtual.html`, { out: path.join(root, 'virtual') });
  assert.deepEqual(cap.errors, []);
  assert.equal(cap.reachedEnd, true, cap.endReason);
  assert.equal(cap.movedBy, 'wheel');
  assert.equal(cap.nativeScroll, false, 'the document itself never scrolled');
  // 4 500px of scenes in a 900px window: 3 600px of travel at 120px a step.
  assert.ok(cap.inputs.wheel >= 29, `the wheel moved it ${cap.inputs.wheel} times`);
  assert.ok(cap.stills.length >= 5, `stills along the way (${cap.stills.length})`);
  written(cap);
});

test('a page that swallows the wheel is driven by the keys instead', T, async () => {
  const cap = await captureMotion(browser, `${server.url}/motion-keys.html`, { out: path.join(root, 'keys') });
  assert.equal(cap.reachedEnd, true, cap.endReason);
  assert.equal(cap.movedBy, 'keys');
  assert.equal(cap.inputs.wheel, 0);
  assert.equal(cap.inputs.keys, 2, 'two key presses take three slides to the last');
  written(cap);
});

test('the safety cap stops the run and says so', T, async () => {
  const cap = await captureMotion(browser, `${server.url}/motion-normal.html`, { out: path.join(root, 'capped'), maxSteps: 3 });
  assert.equal(cap.reachedEnd, false);
  assert.equal(cap.maxStepsHit, true);
  assert.match(cap.endReason, /safety cap of 3 steps/);
  assert.equal(cap.steps, 3);
});

test('without anything to read the video, the sheets are built from the stills', T, async () => {
  const cap = await captureMotion(browser, `${server.url}/motion-virtual.html`, { out: path.join(root, 'stills-only'), ffmpeg: false, browserDecode: false });
  assert.equal(cap.sheetsFrom, 'stills');
  assert.ok(cap.sheets.length >= 1);
  assert.ok(fs.existsSync(path.join(cap.dir, cap.sheets[0])));
});

test('the CLI captures a pinned section to the end, past a gate it clicks', T, () => {
  const out = path.join(root, 'cli-pinned');
  const r = spawnSync(process.execPath, [CLI, path.join(FIXTURES, 'motion-pinned.html'), '--out', out, '--click', 'h1', '--max-steps', '200'], { encoding: 'utf8', timeout: 230000 });
  assert.equal(r.status, 0, r.stderr || r.stdout);
  assert.match(r.stdout, /end: reached/);
  assert.match(r.stdout, /click h1: ok/);
  const cap = JSON.parse(fs.readFileSync(path.join(out, 'capture.json'), 'utf8'));
  assert.equal(cap.reachedEnd, true);
  assert.equal(cap.movedBy, 'wheel');
  assert.ok(cap.stills.length >= 4, `the pinned scene is seen at several moments (${cap.stills.length})`);
  assert.ok(fs.existsSync(path.join(out, 'sheet-01.png')));
  assert.ok(fs.existsSync(path.join(out, 'video.webm')));
});

test('the CLI refuses a bad size', () => {
  const r = spawnSync(process.execPath, [CLI, 'x.html', '--size', 'big'], { encoding: 'utf8' });
  assert.equal(r.status, 2);
});
