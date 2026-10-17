import test from 'node:test';
import assert from 'node:assert/strict';
import { launchBrowser, newPage, settle } from '../scripts/lib/browser.mjs';
import { installCanvasTrace, runCanvasTrace, LIBRARY_PATTERNS } from '../scripts/lib/canvas-trace.mjs';
import { motionFixture } from './helpers/motion-fixture.mjs';
import { runStaticPass } from '../scripts/lib/static-pass.mjs';

let browser;
test.before(async () => { browser = await launchBrowser(); });
test.after(async () => { await browser?.close(); });

async function trace(kind, { reducedMotion = 'no-preference', fixture = {}, ...opts } = {}) {
  const fx = motionFixture(kind, fixture);
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
  assert.equal(c.reducedMotionAnimating, false, 'hidden under reduce (poster shown instead) is honoured');
  assert.equal(c.fallbackVisible, true);
});

test('a canvas removed under reduced motion has an unknown reduced-motion result, not false', async () => {
  const [c] = (await trace('removedUnderReduce')).canvases;
  assert.equal(c.reducedMotionAnimating, null);
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

test('the variants keep their own 1.8 s settle floor: probe passes settleMs 300 and a late canvas is still judged', async () => {
  const fx = motionFixture('lateCanvas');
  const { page, context } = await newPage(browser);
  try {
    await installCanvasTrace(context);
    await page.goto(fx.url, { waitUntil: 'load' });
    await page.waitForTimeout(2200); // the baseline page has its canvas by now; a variant reload starts from zero
    const [c] = (await runCanvasTrace(page, { frames: 4, durationMs: 800, settleMs: 300 })).canvases;
    assert.equal(c.selector, 'canvas#late');
    assert.equal(c.reducedMotionAnimating, false, 'found under reduce after the floor, and not moving');
    assert.equal(c.fallbackVisible, true);
  } finally {
    await context.close();
    fx.cleanup();
  }
});

test('experimental-webgl is recorded as webgl', async () => {
  const { page, context } = await newPage(browser);
  try {
    await installCanvasTrace(context);
    // setContent does not run init scripts; a navigation does.
    const html = `<canvas id="x" width="300" height="200" style="display:block"></canvas><script>
      const gl = document.getElementById('x').getContext('experimental-webgl');
      let k = 0; (function f() { k += 1; gl.clearColor((k % 60) / 60, 0.3, 0.6, 1); gl.clear(gl.COLOR_BUFFER_BIT); requestAnimationFrame(f); })();
    </script>`;
    await page.goto(`data:text/html,${encodeURIComponent(html)}`, { waitUntil: 'load' });
    const [c] = (await runCanvasTrace(page, { frames: 4, durationMs: 800, settleMs: 300, variants: false })).canvases;
    assert.equal(c.context, 'webgl');
    assert.equal(c.requested, 'webgl');
  } finally {
    await context.close();
  }
});

// ---- Every canvas is measured, wherever it sits ------------------------------------------------------------

const K = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => `canvas#k${i}`);

test('eight canvases, most below the fold: all eight are in the record, animating, with their place in the document', async () => {
  const started = Date.now();
  const { canvases, skippedCanvases } = await trace('eightCanvases');
  console.log(`# eightCanvases trace took ${((Date.now() - started) / 1000).toFixed(1)} s (page load and variants included)`);
  assert.deepEqual(canvases.map((c) => c.selector), K);
  assert.equal(skippedCanvases, 0);
  for (const c of canvases) {
    assert.equal(c.animating, true, `${c.selector} animating`);
    assert.equal(c.blank, false, `${c.selector} blank`);
    assert.equal(c.drawCallsOffscreen, 0, `${c.selector} pauses off-screen`);
    assert.equal(c.reducedMotionAnimating, false, `${c.selector} reduced motion`);
    assert.equal(c.fallbackVisible, true, `${c.selector} fallback`);
  }
  assert.deepEqual(canvases.map((c) => c.domIndex), [0, 1, 2, 3, 4, 5, 6, 7]);
  const tops = canvases.map((c) => c.topPx);
  assert.ok(tops.every((t, i) => i === 0 || t > tops[i - 1]), `topPx must rise: ${tops}`);
  assert.ok(tops.filter((t) => t > 900).length >= 4, `at least four canvases start below the fold: ${tops}`);
});

test('the off-screen check stays isolated: one rogue canvas among eight is the only one that fails', async () => {
  const { canvases } = await trace('eightOneRogue');
  assert.equal(canvases.length, 8);
  for (const c of canvases) {
    assert.equal(c.animating, true, `${c.selector} animating`);
    if (c.selector === 'canvas#k5') assert.ok(c.drawCallsOffscreen > 30, `k5 ${c.drawCallsOffscreen}`);
    else assert.equal(c.drawCallsOffscreen, 0, `${c.selector} ${c.drawCallsOffscreen}`);
  }
});

test('maxCanvases is only a test knob: it keeps the largest ones and counts what it left out', async () => {
  const t = await trace('eightCanvases', { maxCanvases: 3, variants: false });
  assert.equal(t.canvases.length, 3);
  assert.equal(t.skippedCanvases, 5);
});

test('a canvas inside an open shadow root is listed and measured', async () => {
  const { canvases } = await trace('shadowCanvas');
  assert.equal(canvases.length, 1);
  assert.equal(canvases[0].selector, 'canvas#sc');
  assert.equal(canvases[0].animating, true);
  assert.equal(canvases[0].drawCallsOffscreen, 0);
});

test('a canvas that cannot leave the viewport has drawCallsOffscreen null, not 0', async () => {
  const [fixed] = (await trace('fixedCanvas', { variants: false })).canvases;
  assert.equal(fixed.drawCallsOffscreen, null);
  assert.equal(fixed.animating, true);
  const fx = motionFixture('healthy', { spacer: false });
  const { page, context } = await newPage(browser);
  try {
    await installCanvasTrace(context);
    await page.goto(fx.url, { waitUntil: 'load' });
    const [short] = (await runCanvasTrace(page, { frames: 3, durationMs: 600, settleMs: 300, variants: false })).canvases;
    assert.equal(short.drawCallsOffscreen, null, 'a page shorter than the viewport cannot scroll the canvas out');
  } finally {
    await context.close();
    fx.cleanup();
  }
});

test('a canvas drawn from a worker made no draw call to judge: drawCallsOffscreen is null, not 0', async () => {
  const [c] = (await trace('offscreenWorker', { variants: false })).canvases;
  assert.equal(c.drawCalls, 0);
  assert.equal(c.drawCallsOffscreen, null);
  assert.equal(c.animating, true);
});

test('a canvas at opacity 0 is not visible and not listed', async () => {
  assert.deepEqual((await trace('opacityZero')).canvases, []);
});

test('a canvas whose box changes size between frames is flagged resized and does not read as animating', async () => {
  const [c] = (await trace('resizing', { variants: false })).canvases;
  assert.equal(c.resized, true);
  assert.equal(c.animating, false);
});

test('the page is left where it was and the counter is off', async () => {
  const fx = motionFixture('eightCanvases');
  const { page, context } = await newPage(browser);
  try {
    await installCanvasTrace(context);
    await page.goto(fx.url, { waitUntil: 'load' });
    await page.evaluate(() => window.scrollTo(0, 700));
    await runCanvasTrace(page, { frames: 2, durationMs: 400, settleMs: 300, variants: false });
    assert.deepEqual(await page.evaluate(() => [Math.round(window.scrollY), window.__dfTrace.counting]), [700, false]);
  } finally {
    await context.close();
    fx.cleanup();
  }
});

test('JSON data blocks are not motion JS', async () => {
  const withJson = '<script type="application/ld+json">' + 'x'.repeat(5000) + '</script>';
  const a = await trace('healthy', { variants: false, fixture: { inline: true } });
  const b = await trace('healthy', { variants: false, fixture: { inline: true, beforeScene: withJson } });
  assert.ok(a.motionJsBytes > 0, 'the inline scene owns the canvas context, so it counts');
  assert.equal(b.motionJsBytes, a.motionJsBytes);
});

test('the Rive pattern needs a word boundary: drive.js and derive.js are not Rive', () => {
  assert.equal(LIBRARY_PATTERNS.rive.test('https://x.example/js/drive.js'), false);
  assert.equal(LIBRARY_PATTERNS.rive.test('https://x.example/derive.js'), false);
  assert.equal(LIBRARY_PATTERNS.rive.test('https://unpkg.com/@rive-app/canvas@2/rive.js'), true);
  assert.equal(LIBRARY_PATTERNS.rive.test('https://cdn.example/rive.min.js'), true);
});
