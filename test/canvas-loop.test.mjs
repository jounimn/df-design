import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { launchBrowser } from '../scripts/lib/browser.mjs';

const TEMPLATE = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'templates', 'canvas-loop.js'), 'utf8');

let browser;
test.before(async () => { browser = await launchBrowser(); });
test.after(async () => { await browser?.close(); });

// A page with one 400x300 canvas at the top, 3000 px of room below it, the template and a recording draw/poster.
function loopPage({ options = '', body = '', head = '', draw = '' } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'canvas loop '));
  fs.writeFileSync(path.join(root, 'canvas-loop.js'), TEMPLATE);
  fs.writeFileSync(path.join(root, 'page.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>loop</title>${head}
<style>html,body{margin:0}canvas{display:block;width:400px;height:300px}</style></head><body>
<canvas id="c"></canvas><div id="fb" hidden>fallback</div>${body}<div style="height:3000px"></div>
<script src="canvas-loop.js"></script>
<script>
window.calls = { draw: 0, poster: 0 };
window.loop = dfCanvasLoop(document.getElementById('c'), {
  context: '2d',
  draw(t, ctx) { window.calls.draw += 1; ${draw} ctx.fillStyle = 'hsl(' + (t / 10 % 360) + ',70%,50%)'; ctx.fillRect(0, 0, 400, 300); },
  poster(ctx) { window.calls.poster += 1; ctx.fillStyle = '#336'; ctx.fillRect(0, 0, 400, 300); },
  fallback: '#fb',
  ${options}
});
</script></body></html>`);
  const file = path.join(root, 'page.html');
  return { root, file, url: pathToFileURL(file).href, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) };
}

async function open({ reducedMotion = 'no-preference', deviceScaleFactor = 1, ...pageOptions } = {}) {
  const fx = loopPage(pageOptions);
  const context = await browser.newContext({ viewport: { width: 1000, height: 700 }, reducedMotion, deviceScaleFactor });
  const page = await context.newPage();
  await page.goto(fx.url, { waitUntil: 'load' });
  return { page, close: async () => { await context.close(); fx.cleanup(); } };
}
const draws = (page) => page.evaluate(() => window.calls.draw);
// Resuming is judged by "more frames arrived", with room for a slow machine, not by a fixed wait.
const resumed = (page, since) => page.waitForFunction((n) => window.calls.draw > n + 5, since, { timeout: 4000 });

test('draw runs on rAF while the canvas is in view', async () => {
  const { page, close } = await open();
  try {
    await page.waitForFunction(() => window.calls.draw > 0); // the first frame of a fresh page can be late
    // Frames keep coming, on rAF: judged by arrival with room for a slow machine, not by a rate in a fixed window.
    await resumed(page, await draws(page) + 10);
    assert.equal(await page.evaluate(() => document.getElementById('c').dataset.dfLoop), 'running');
  } finally { await close(); }
});

test('scrolling the canvas out of view stops draw within 200 ms; scrolling back resumes', async () => {
  const { page, close } = await open();
  try {
    await page.waitForTimeout(300);
    await page.evaluate(() => window.scrollTo(0, 2500));
    await page.waitForTimeout(200);
    const stopped = await draws(page);
    await page.waitForTimeout(500);
    assert.equal(await draws(page), stopped, 'no draw while out of view');
    assert.equal(await page.evaluate(() => document.getElementById('c').dataset.dfLoop), 'paused');
    await page.evaluate(() => window.scrollTo(0, 0));
    await resumed(page, stopped);
  } finally { await close(); }
});

test('a hidden tab (visibilitychange) pauses draw', async () => {
  const { page, close } = await open();
  try {
    await page.waitForTimeout(300);
    const hide = (hidden) => page.evaluate((h) => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => h });
      document.dispatchEvent(new Event('visibilitychange'));
    }, hidden);
    await hide(true);
    await page.waitForTimeout(200);
    const stopped = await draws(page);
    await page.waitForTimeout(400);
    assert.equal(await draws(page), stopped);
    await hide(false);
    await resumed(page, stopped);
  } finally { await close(); }
});

test("under reducedMotion 'reduce', poster is called once and draw never", async () => {
  const { page, close } = await open({ reducedMotion: 'reduce' });
  try {
    await page.waitForTimeout(600);
    assert.deepEqual(await page.evaluate(() => window.calls), { draw: 0, poster: 1 });
    assert.deepEqual(await page.evaluate(() => [document.getElementById('c').dataset.dfLoop, document.getElementById('c').dataset.dfPoster]), ['poster', 'done']);
  } finally { await close(); }
});

test('a reduced-motion change while the page is open stops the loop and draws the poster; turning it off resumes', async () => {
  const { page, close } = await open();
  try {
    await page.waitForTimeout(300);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForTimeout(200);
    const stopped = await draws(page);
    await page.waitForTimeout(400);
    assert.equal(await draws(page), stopped);
    assert.equal(await page.evaluate(() => window.calls.poster), 1);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await resumed(page, stopped);
  } finally { await close(); }
});

test('canvas.width never exceeds clientWidth × maxDpr, at devicePixelRatio 3 with maxDpr 2', async () => {
  const { page, close } = await open({ deviceScaleFactor: 3, options: 'maxDpr: 2' });
  try {
    await page.waitForTimeout(200);
    const { dpr, width, height, clientWidth } = await page.evaluate(() => {
      const c = document.getElementById('c');
      return { dpr: devicePixelRatio, width: c.width, height: c.height, clientWidth: c.clientWidth };
    });
    assert.equal(dpr, 3);
    assert.equal(width, clientWidth * 2);
    assert.equal(height, 300 * 2);
  } finally { await close(); }
});

test('the default cap is 2, and a 1x screen is not scaled up', async () => {
  const three = await open({ deviceScaleFactor: 3 });
  try {
    assert.equal(await three.page.evaluate(() => document.getElementById('c').width), 800);
  } finally { await three.close(); }
  const one = await open();
  try {
    assert.equal(await one.page.evaluate(() => document.getElementById('c').width), 400);
  } finally { await one.close(); }
});

test('stop() ends the loop', async () => {
  const { page, close } = await open();
  try {
    await page.waitForTimeout(300);
    await page.evaluate(() => window.loop.stop());
    const stopped = await draws(page);
    await page.waitForTimeout(400);
    assert.equal(await draws(page), stopped);
  } finally { await close(); }
});

// ---- Context loss, fallback, slideshow, export ---------------------------------------------------------------

// A WebGL canvas on the template, with the same markup as the motion fixtures (a fallback laid over the canvas).
function glPage({ spacer = 3000 } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'canvas loop gl '));
  fs.writeFileSync(path.join(root, 'canvas-loop.js'), TEMPLATE);
  fs.writeFileSync(path.join(root, 'page.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>gl loop</title>
<style>html,body{margin:0}</style></head><body>
<div style="position:relative;width:400px;height:300px">
<canvas id="c" width="400" height="300" style="width:400px;height:300px;display:block"></canvas>
<div id="fb" hidden style="display:none;position:absolute;top:0;left:0;width:400px;height:300px;background:linear-gradient(90deg,#112233,#ddaa44)"></div>
</div>
<h1>A canvas on the loop</h1>
<p>A real page has words around its canvas; the without-JS check needs something to compare.</p>
<div style="height:${spacer}px"></div>
<script src="canvas-loop.js"></script>
<script>
window.calls = { draw: 0, poster: 0, restore: 0 };
const build = (gl) => {
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'));
  gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, 'precision mediump float;uniform float t;void main(){gl_FragColor=vec4(.5+.5*sin(t+gl_FragCoord.x*.02),.5+.5*cos(t*1.3+gl_FragCoord.y*.02),.6,1.);}'));
  gl.linkProgram(pr); gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  return gl.getUniformLocation(pr, 't');
};
let uniform = null;
const frame = (gl, s) => { gl.viewport(0, 0, gl.canvas.width, gl.canvas.height); gl.uniform1f(uniform, s); gl.drawArrays(gl.TRIANGLES, 0, 3); };
window.loop = dfCanvasLoop(document.getElementById('c'), {
  context: 'webgl',
  draw(t, gl) { window.gl = gl; if (!uniform) uniform = build(gl); window.calls.draw += 1; frame(gl, t / 1000); },
  poster(gl) { window.gl = gl; if (!uniform) uniform = build(gl); window.calls.poster += 1; frame(gl, 0); },
  fallback: '#fb',
  restore(gl) { window.calls.restore += 1; uniform = build(gl); },
});
</script></body></html>`);
  const file = path.join(root, 'page.html');
  return { root, file, url: pathToFileURL(file).href, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) };
}

async function openGl({ init } = {}) {
  const fx = glPage();
  const context = await browser.newContext({ viewport: { width: 1000, height: 700 } });
  if (init) await context.addInitScript(init);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(fx.url, { waitUntil: 'load' });
  return { page, errors, close: async () => { await context.close(); fx.cleanup(); } };
}
const state = (page) => page.evaluate(() => {
  const c = document.getElementById('c');
  const fb = document.getElementById('fb');
  return { loop: c.dataset.dfLoop, canvasDisplay: c.style.display, fallbackHidden: fb.hidden, fallbackShown: getComputedStyle(fb).display !== 'none' };
});
// A lost context hands out no extensions, so the extension object is taken while the context is alive.
const LOSE = () => { window.ext = window.gl.getExtension('WEBGL_lose_context'); window.ext.loseContext(); };
const RESTORE = () => window.ext.restoreContext();

test('webglcontextlost stops the loop and shows the fallback element; webglcontextrestored resumes', async () => {
  const { page, errors, close } = await openGl();
  try {
    await page.waitForFunction(() => window.calls.draw > 5);
    await page.evaluate(LOSE);
    await page.waitForFunction(() => document.getElementById('c').dataset.dfLoop === 'fallback');
    const lost = await state(page);
    assert.equal(lost.canvasDisplay, 'none');
    assert.equal(lost.fallbackShown, true);
    const stopped = await draws(page);
    await page.waitForTimeout(400);
    assert.equal(await draws(page), stopped, 'no draw while the context is lost');

    await page.evaluate(RESTORE);
    await page.waitForFunction(() => document.getElementById('c').dataset.dfLoop === 'running');
    const back = await state(page);
    assert.equal(back.canvasDisplay, 'block', 'the canvas gets back the display it had');
    assert.equal(back.fallbackShown, false, 'the fallback is hidden again, even though it had an inline display');
    assert.equal(await page.evaluate(() => window.calls.restore), 1, 'the page was told to rebuild its GL resources');
    await resumed(page, stopped);
    assert.deepEqual(errors, []);
  } finally { await close(); }
});

const NO_WEBGL = () => {
  const native = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function getContext(type, ...rest) { return /webgl/.test(type) ? null : native.call(this, type, ...rest); };
};

test('getContext returning null shows the fallback and does not throw', async () => {
  const { page, errors, close } = await openGl({ init: NO_WEBGL });
  try {
    await page.waitForTimeout(500);
    const s = await state(page);
    assert.equal(s.loop, 'fallback');
    assert.equal(s.fallbackShown, true);
    assert.equal(s.canvasDisplay, 'none');
    assert.equal(await draws(page), 0);
    assert.deepEqual(errors, []);
  } finally { await close(); }
});

test('a fallback selector that matches nothing logs one console warning and does not throw', async () => {
  const fx = loopPage({ options: "fallback: '#missing'," });
  const context = await browser.newContext({ viewport: { width: 1000, height: 700 } });
  // The page asks for a 2d context: make that fail, so the loop has to fall back.
  await context.addInitScript(() => { HTMLCanvasElement.prototype.getContext = () => null; });
  const page = await context.newPage();
  const errors = [];
  const warnings = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'warning') warnings.push(m.text()); });
  try {
    await page.goto(fx.url, { waitUntil: 'load' });
    await page.waitForTimeout(400);
    assert.equal(await page.evaluate(() => document.getElementById('c').dataset.dfLoop), 'fallback');
    assert.equal(warnings.filter((w) => w.includes('#missing')).length, 1, warnings.join(' | '));
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
    fx.cleanup();
  }
});

test('with a slideshow (document df:slidechange), only a canvas inside slide detail.slide runs; moving on swaps them', async () => {
  const { copyPresentationFixture } = await import('./helpers/presentation-fixture.mjs');
  const fx = copyPresentationFixture();
  fs.writeFileSync(path.join(fx.dir, 'canvas-loop.js'), TEMPLATE);
  const file = path.join(fx.dir, 'presentation.html');
  const html = fs.readFileSync(file, 'utf8')
    .replace('<h2>01 · Miolo & Filhos</h2>', '<h2>01 · Miolo & Filhos</h2><canvas id="a" style="width:400px;height:200px;display:block"></canvas>')
    .replace('<h2>02 · Concept</h2>', '<h2>02 · Concept</h2><canvas id="b" style="width:400px;height:200px;display:block"></canvas>')
    .replace('<script src="slideshow.js"></script>', `<script src="slideshow.js"></script><script src="canvas-loop.js"></script><script>
window.n = { a: 0, b: 0 };
for (const id of ['a', 'b']) dfCanvasLoop(document.getElementById(id), { context: '2d', draw(t, ctx) { window.n[id] += 1; ctx.fillStyle = 'hsl(' + (t / 10 % 360) + ',70%,50%)'; ctx.fillRect(0, 0, 400, 200); }, poster(ctx) { ctx.fillStyle = '#336'; ctx.fillRect(0, 0, 400, 200); }, fallback: '#none' });
</script>`);
  fs.writeFileSync(file, html);
  const context = await browser.newContext({ viewport: { width: 1000, height: 700 } });
  const page = await context.newPage();
  try {
    await page.goto(pathToFileURL(file).href, { waitUntil: 'load' });
    await page.waitForFunction(() => window.n.a > 5);
    // The canvas on slide 2 is not blank while its slide is out of focus: it already shows its poster, so the slide
    // that comes in has something on it from the first frame.
    assert.equal(await page.evaluate(() => document.getElementById('b').getContext('2d').getImageData(10, 10, 1, 1).data[3]), 255);
    const at = await page.evaluate(() => ({ ...window.n }));
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => window.n.b), at.b, 'the canvas on slide 2 does not run while slide 1 is in focus');
    assert.ok(await page.evaluate(() => window.n.a) > at.a);

    await page.evaluate(() => window.__DF_SLIDESHOW__.go(2));
    await page.waitForFunction((n) => window.n.b > n + 5, at.b, { timeout: 4000 });
    await page.waitForTimeout(200);
    const a = await page.evaluate(() => window.n.a);
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => window.n.a), a, 'the canvas on slide 1 paused');
  } finally {
    await context.close();
    fx.cleanup();
  }
});

test('an error inside draw stops the loop, logs once, and shows the fallback instead of freezing silently', async () => {
  const fx = loopPage({ draw: 'if (window.calls.draw === 4) throw new Error("boom");' });
  const context = await browser.newContext({ viewport: { width: 1000, height: 700 } });
  const page = await context.newPage();
  const errors = [];
  const logged = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') logged.push(m.text()); });
  try {
    await page.goto(fx.url, { waitUntil: 'load' });
    await page.waitForFunction(() => document.getElementById('c').dataset.dfLoop === 'fallback');
    const stopped = await draws(page);
    await page.waitForTimeout(400);
    assert.equal(await draws(page), stopped, 'no more frames after the error');
    assert.equal(await page.evaluate(() => getComputedStyle(document.getElementById('fb')).display !== 'none'), true, 'the fallback is visible');
    assert.equal(logged.filter((l) => l.includes('boom')).length, 1, logged.join(' | '));
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
    fx.cleanup();
  }
});

// Old webviews: no IntersectionObserver, no ResizeObserver, a MediaQueryList with only addListener.
const OLD_BROWSER = () => {
  delete window.IntersectionObserver;
  delete window.ResizeObserver;
  MediaQueryList.prototype.addEventListener = undefined;
  MediaQueryList.prototype.removeEventListener = undefined;
};

test('without IntersectionObserver, ResizeObserver or MediaQueryList.addEventListener the loop still runs', async () => {
  const fx = loopPage();
  const context = await browser.newContext({ viewport: { width: 1000, height: 700 } });
  await context.addInitScript(OLD_BROWSER);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  try {
    await page.goto(fx.url, { waitUntil: 'load' });
    await page.waitForFunction(() => window.calls.draw > 5);
    assert.equal(await page.evaluate(() => document.getElementById('c').dataset.dfLoop), 'running');
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
    fx.cleanup();
  }
});

test('if the loop cannot start at all, the fallback shows and nothing throws', async () => {
  const fx = loopPage();
  const context = await browser.newContext({ viewport: { width: 1000, height: 700 } });
  await context.addInitScript(() => { window.matchMedia = undefined; });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  try {
    await page.goto(fx.url, { waitUntil: 'load' });
    assert.equal(await page.evaluate(() => document.getElementById('c').dataset.dfLoop), 'fallback');
    assert.equal(await page.evaluate(() => getComputedStyle(document.getElementById('fb')).display !== 'none'), true);
    assert.equal(errors.filter((e) => !e.includes('matchMedia')).length, 0, errors.join(' | '));
  } finally {
    await context.close();
    fx.cleanup();
  }
});

test('a canvas that starts out of view gets its poster at once, draws nothing, and runs when it scrolls in', async () => {
  const fx = loopPage({ head: '<style>#c{margin-top:2500px !important}</style>' });
  const context = await browser.newContext({ viewport: { width: 1000, height: 700 } });
  const page = await context.newPage();
  try {
    await page.goto(fx.url, { waitUntil: 'load' });
    await page.waitForTimeout(400);
    assert.deepEqual(await page.evaluate(() => window.calls), { draw: 0, poster: 1 });
    assert.deepEqual(await page.evaluate(() => [document.getElementById('c').dataset.dfLoop, document.getElementById('c').dataset.dfPoster]), ['paused', 'done']);
    await page.evaluate(() => window.scrollTo(0, 2400));
    await page.waitForFunction(() => window.calls.draw > 5);
  } finally {
    await context.close();
    fx.cleanup();
  }
});

test('dfPoster is only "done" when a poster was really drawn', async () => {
  const fx = loopPage({ options: 'poster: undefined,' });
  const context = await browser.newContext({ viewport: { width: 1000, height: 700 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  try {
    await page.goto(fx.url, { waitUntil: 'load' });
    await page.waitForTimeout(300);
    assert.deepEqual(await page.evaluate(() => [document.getElementById('c').dataset.dfLoop, document.getElementById('c').dataset.dfPoster ?? null]), ['poster', null]);
  } finally {
    await context.close();
    fx.cleanup();
  }
});

test('with window.__DF_EXPORT__ === true set by an init script, poster is called once, draw never, and dataset.dfPoster is done', async () => {
  const fx = loopPage();
  const context = await browser.newContext({ viewport: { width: 1000, height: 700 }, reducedMotion: 'no-preference' });
  await context.addInitScript(() => { window.__DF_EXPORT__ = true; });
  const page = await context.newPage();
  try {
    await page.goto(fx.url, { waitUntil: 'load' });
    await page.waitForTimeout(500);
    assert.deepEqual(await page.evaluate(() => window.calls), { draw: 0, poster: 1 });
    assert.deepEqual(await page.evaluate(() => [document.getElementById('c').dataset.dfLoop, document.getElementById('c').dataset.dfPoster]), ['poster', 'done']);
  } finally {
    await context.close();
    fx.cleanup();
  }
});

test('a loop-based page passes every check-motion check (by construction)', async () => {
  const { runMotionChecks } = await import('../scripts/lib/motion-checks.mjs');
  const fx = glPage();
  try {
    const result = await runMotionChecks(fx.file, { tier: 'high', browser, ceilings: { high: 200000 } });
    assert.deepEqual(result.checks.filter((c) => c.status === 'fail'), []);
    for (const c of result.checks) assert.equal(c.status, 'pass', `${c.name}: ${c.detail}`);
    assert.equal(result.ok, true);
  } finally { fx.cleanup(); }
});
