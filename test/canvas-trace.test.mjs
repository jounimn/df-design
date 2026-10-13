import test from 'node:test';
import assert from 'node:assert/strict';
import { launchBrowser, newPage, settle } from '../scripts/lib/browser.mjs';
import { installCanvasTrace, runCanvasTrace } from '../scripts/lib/canvas-trace.mjs';
import { motionFixture } from './helpers/motion-fixture.mjs';

let browser;
test.before(async () => { browser = await launchBrowser(); });
test.after(async () => { await browser?.close(); });

async function trace(kind, { reducedMotion = 'no-preference', ...opts } = {}) {
  const fx = motionFixture(kind);
  const { page, context } = await newPage(browser, { reducedMotion });
  try {
    await installCanvasTrace(context);
    await page.goto(fx.url, { waitUntil: 'load' });
    await settle(page, { quiet: 300 });
    return await runCanvasTrace(page, opts);
  } finally {
    await context.close();
    fx.cleanup();
  }
}

test('healthy: a WebGL canvas that animates', async () => {
  const { canvases } = await trace('healthy');
  assert.equal(canvases.length, 1);
  const [c] = canvases;
  assert.equal(c.selector, 'canvas#c');
  assert.equal(c.context, 'webgl');
  assert.equal(c.animating, true);
  assert.equal(c.blank, false);
  assert.ok(c.changedShare > 0.0005, `changedShare ${c.changedShare}`);
  assert.ok(c.rafPerSec > 20, `rafPerSec ${c.rafPerSec}`);
  assert.ok(c.frameMs.p50 > 0 && c.frameMs.p95 >= c.frameMs.p50);
  assert.equal(typeof c.renderer, 'string');
});

test('frozen: draws every frame but nothing changes', async () => {
  const [c] = (await trace('frozen')).canvases;
  assert.equal(c.context, '2d');
  assert.equal(c.animating, false);
  assert.equal(c.blank, false);
});

test('blank: a single colour', async () => {
  const [c] = (await trace('blank')).canvases;
  assert.equal(c.blank, true);
  assert.equal(c.animating, false);
});

test('a canvas with display:none, 0x0, or in a hidden section is not listed', async () => {
  assert.deepEqual((await trace('hiddenCanvas')).canvases, []);
});

test('a canvas added 1.5 s after load is found', async () => {
  const { canvases } = await trace('lateCanvas', { settleMs: 2000 });
  assert.deepEqual(canvases.map((c) => c.selector), ['canvas#late']);
  assert.equal(canvases[0].animating, true);
});

test('preserveDrawingBuffer:false still reads as animating (pixels come from the compositor)', async () => {
  const [c] = (await trace('healthy')).canvases;
  assert.equal(c.animating, true);
});

test('the selector is stable across two runs', async () => {
  const a = (await trace('twoCanvases')).canvases.map((c) => c.selector);
  const b = (await trace('twoCanvases')).canvases.map((c) => c.selector);
  assert.deepEqual(a, ['canvas#a', 'canvas#b']);
  assert.deepEqual(a, b);
});

test('no canvas gives an empty list', async () => {
  assert.deepEqual((await trace('noCanvas')).canvases, []);
});
