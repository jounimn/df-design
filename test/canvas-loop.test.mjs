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
function loopPage({ options = '', body = '', head = '' } = {}) {
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
  draw(t, ctx) { window.calls.draw += 1; ctx.fillStyle = 'hsl(' + (t / 10 % 360) + ',70%,50%)'; ctx.fillRect(0, 0, 400, 300); },
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
