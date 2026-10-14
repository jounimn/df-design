import test from 'node:test';
import assert from 'node:assert/strict';
import { launchBrowser, newPage, settle } from '../scripts/lib/browser.mjs';
import { installCanvasTrace, runCanvasTrace } from '../scripts/lib/canvas-trace.mjs';
import { motionFixture } from './helpers/motion-fixture.mjs';
import { runStaticPass } from '../scripts/lib/static-pass.mjs';

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

// ---- Task 2: draw hooks, variants, libraries, weight -------------------------------------------------------

test('healthy: pauses off-screen, honours reduced motion, falls back without WebGL', async () => {
  const t = await trace('healthy');
  const [c] = t.canvases;
  assert.equal(c.drawCallsOffscreen, 0);
  assert.ok(c.drawCalls > 20, `drawCalls ${c.drawCalls}`);
  assert.equal(c.reducedMotionAnimating, false);
  assert.equal(c.fallbackVisible, true);
  assert.deepEqual(c.fallbackErrors, []);
});

test('neverPauses: keeps drawing while the canvas is out of the viewport', async () => {
  const [c] = (await trace('neverPauses')).canvases;
  assert.ok(c.drawCallsOffscreen > 30, `drawCallsOffscreen ${c.drawCallsOffscreen}`);
});

test('ignoresReducedMotion: still animates under reduce', async () => {
  const [c] = (await trace('ignoresReducedMotion')).canvases;
  assert.equal(c.reducedMotionAnimating, true);
  assert.equal(c.drawCallsOffscreen, 0);
  assert.equal(c.fallbackVisible, true);
});

test('noFallback: blank and throwing without WebGL', async () => {
  const [c] = (await trace('noFallback')).canvases;
  assert.equal(c.fallbackVisible, false);
  assert.ok(c.fallbackErrors.length > 0);
  assert.equal(c.reducedMotionAnimating, false);
});

test('a 2D canvas is unaffected by --disable-webgl, so its fallback fields are null', async () => {
  const [c] = (await trace('frozen')).canvases;
  assert.equal(c.fallbackVisible, null);
  assert.deepEqual(c.fallbackErrors, []);
});

test('overweight: motion JS includes the script that owns the canvas context', async () => {
  const healthy = await trace('healthy');
  const heavy = await trace('overweight');
  assert.ok(heavy.motionJsBytes > healthy.motionJsBytes + 200000, `${heavy.motionJsBytes} vs ${healthy.motionJsBytes}`);
  assert.ok(heavy.jsBytes >= heavy.motionJsBytes);
});

test('libraries: detected from a script URL and from a window global', async () => {
  const fx = motionFixture('healthy', {
    beforeScene: '<script src="https://cdn.example/three@0.160.0/build/three.module.min.js"></script><script>window.PIXI = {};</script>',
  });
  const { page, context } = await newPage(browser);
  try {
    await context.route('https://cdn.example/**', (r) => r.fulfill({ contentType: 'text/javascript', body: 'window.__stub = 1;' }));
    await installCanvasTrace(context);
    await page.goto(fx.url, { waitUntil: 'load' });
    const t = await runCanvasTrace(page, { frames: 2, durationMs: 400, settleMs: 200, variants: false });
    assert.deepEqual([...t.libraries].sort(), ['pixi', 'three']);
    const without = await trace('healthy', { variants: false });
    // The only script this page has that the plain one lacks is the library stub, so it accounts for the whole
    // difference, in the transferred sense of jsBytes (a route-fulfilled body of 18 bytes transfers 12).
    const added = t.motionJsBytes - without.motionJsBytes;
    assert.ok(added > 0, `with ${t.motionJsBytes}, without ${without.motionJsBytes}: the stub bytes must be added`);
    assert.equal(added, t.jsBytes - without.jsBytes);
  } finally {
    await context.close();
    fx.cleanup();
  }
});

test('jsBytes counts transferred (gzip) bytes, not decoded ones', async () => {
  const fx = motionFixture('overweight');
  const { gzipSync } = await import('node:zlib');
  const fs = await import('node:fs');
  const http = await import('node:http');
  const scene = fs.readFileSync(`${fx.dir}/scene.js`);
  const server = http.createServer((req, res) => {
    if (req.url.endsWith('scene.js')) { res.writeHead(200, { 'content-type': 'text/javascript', 'content-encoding': 'gzip' }); res.end(gzipSync(scene)); return; }
    res.writeHead(200, { 'content-type': 'text/html' }); res.end(fs.readFileSync(fx.file));
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const { page, context } = await newPage(browser);
  try {
    await installCanvasTrace(context);
    await page.goto(`http://127.0.0.1:${server.address().port}/page.html`, { waitUntil: 'load' });
    const t = await runCanvasTrace(page, { frames: 2, durationMs: 400, settleMs: 200, variants: false });
    assert.ok(t.jsBytes > 0 && t.jsBytes < scene.length / 10, `jsBytes ${t.jsBytes} of ${scene.length}`);
  } finally {
    await context.close();
    await new Promise((r) => server.close(r));
    fx.cleanup();
  }
});

test('variants:false leaves the variant fields null', async () => {
  const [c] = (await trace('healthy', { variants: false })).canvases;
  assert.equal(c.reducedMotionAnimating, null);
  assert.equal(c.fallbackVisible, null);
  assert.equal(typeof c.drawCallsOffscreen, 'number');
});

// ---- Review fixes: variants, timing, static pass ----------------------------------------------------------

test('a canvas hidden under reduced motion passes the reduced-motion variant without a 30 s wait', async () => {
  const started = Date.now();
  const [c] = (await trace('hiddenUnderReduce')).canvases;
  assert.ok(Date.now() - started < 60000, 'the trace must not sit in Playwright\'s 30 s screenshot wait');
  assert.equal(c.reducedMotionAnimating, false);
  assert.equal(c.fallbackVisible, true);
});

test('a canvas removed under reduced motion reads as not animating there', async () => {
  const [c] = (await trace('removedUnderReduce')).canvases;
  assert.equal(c.reducedMotionAnimating, false);
});

test('a canvas replaced by its fallback without WebGL is judged by the area it occupied, not by the missing element', async () => {
  const [c] = (await trace('swapsCanvasForFallback')).canvases;
  assert.equal(c.fallbackVisible, true);
  assert.deepEqual(c.fallbackErrors, []);
});

test('several rAF loops on one page do not multiply rafPerSec or collapse frameMs', async () => {
  const [c] = (await trace('threeLoops')).canvases;
  assert.ok(c.rafPerSec >= 20 && c.rafPerSec <= 75, `rafPerSec ${c.rafPerSec}`);
  assert.ok(c.frameMs.p50 >= 8 && c.frameMs.p50 <= 40, `p50 ${c.frameMs.p50}`);
});

test('the static pass does not claim the context of a canvas the page initialises later', async () => {
  const fx = motionFixture('lateTwoD');
  const { page, context } = await newPage(browser);
  try {
    await installCanvasTrace(context);
    await page.goto(fx.url, { waitUntil: 'load' });
    await runStaticPass(page);
    const t = await runCanvasTrace(page, { frames: 3, durationMs: 600, settleMs: 2000, variants: true });
    const [c] = t.canvases;
    assert.equal(c.context, '2d');
    assert.equal(c.requested, '2d');
    assert.equal(c.fallbackVisible, null, 'a 2D canvas is not part of the WebGL fallback check');
  } finally {
    await context.close();
    fx.cleanup();
  }
});

test('the variants wait as long as the baseline: a canvas that arrives 1.5 s late is found in them', async () => {
  const [c] = (await trace('lateCanvas', { settleMs: 2000 })).canvases;
  assert.equal(c.reducedMotionAnimating, false);
  assert.equal(c.fallbackVisible, true);
});
