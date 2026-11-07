import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { launchBrowser } from '../scripts/lib/browser.mjs';

const TEMPLATE = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'templates', 'scroll-story.js'), 'utf8');

let browser;
test.before(async () => { browser = await launchBrowser(); });
test.after(async () => { await browser?.close(); });

// A page with a pinned story section, a parallax stage of three layers, a hold button, a flipbook and an ink canvas.
async function open({ reducedMotion = 'no-preference', script = '' } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'scroll story '));
  fs.writeFileSync(path.join(root, 'scroll-story.js'), TEMPLATE);
  fs.writeFileSync(path.join(root, 'page.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>story</title>
<style>html,body{margin:0}#story{height:3000px}#stage{position:relative;height:400px;overflow:hidden}
#stage div{position:absolute;inset:0}#fx{width:120px;height:120px}#ink{display:block;width:400px;height:200px}</style></head><body>
<section id="story"><div id="stage"><div data-depth="0.2"></div><div data-depth="0.6"></div><div data-depth="1"></div></div>
<button id="hold" type="button">Hold</button><div id="fx"></div><canvas id="ink"></canvas></section>
<div style="height:2000px"></div>
<script src="scroll-story.js"></script>
<script>${script}</script></body></html>`);
  const context = await browser.newContext({ viewport: { width: 1000, height: 700 }, reducedMotion });
  const page = await context.newPage();
  await page.goto(pathToFileURL(path.join(root, 'page.html')).href, { waitUntil: 'load' });
  return { page, close: async () => { await context.close(); fs.rmSync(root, { recursive: true, force: true }); } };
}

const layerX = (page) => page.evaluate(() => [...document.querySelectorAll('[data-depth]')]
  .map((el) => new DOMMatrix(getComputedStyle(el).transform).m41));

test('progress writes --p from the scroll, both ways; reduced motion pins it at the resting state', async () => {
  const { page, close } = await open({ script: "dfStory.progress(document.getElementById('story'))" });
  try {
    const p = () => page.evaluate(() => parseFloat(document.getElementById('story').style.getPropertyValue('--p')));
    assert.equal(await p(), 0);
    await page.evaluate(() => window.scrollTo(0, 1150));
    await page.waitForFunction(() => parseFloat(document.getElementById('story').style.getPropertyValue('--p')) > 0.4);
    assert.ok(Math.abs(await p() - 0.5) < 0.02);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForFunction(() => parseFloat(document.getElementById('story').style.getPropertyValue('--p')) === 0);
  } finally { await close(); }
  const r = await open({ reducedMotion: 'reduce', script: "dfStory.progress(document.getElementById('story'))" });
  try {
    await r.page.evaluate(() => window.scrollTo(0, 500));
    await r.page.waitForTimeout(100);
    assert.equal(await r.page.evaluate(() => document.getElementById('story').style.getPropertyValue('--p')), '1.0000');
  } finally { await r.close(); }
});

test('parallax moves each layer by its depth toward the pointer, and keeps drifting at rest', async () => {
  const { page, close } = await open({ script: "dfStory.parallax(document.getElementById('stage'), { strength: 40, drift: 0 })" });
  try {
    await page.mouse.move(990, 350);
    await page.waitForFunction(() => new DOMMatrix(getComputedStyle(document.querySelector('[data-depth=\"1\"]')).transform).m41 > 30);
    const [far, mid, near] = await layerX(page);
    assert.ok(far > 0 && far < mid && mid < near, `depth order: ${far} < ${mid} < ${near}`);
    assert.ok(Math.abs(near / far - 5) < 0.6, 'displacement proportional to depth');
    assert.equal(await page.evaluate(() => document.getElementById('stage').dataset.dfParallax), 'running');
  } finally { await close(); }
  const drift = await open({ script: "dfStory.parallax(document.getElementById('stage'), { strength: 40, drift: 0.5 })" });
  try {
    await drift.page.waitForTimeout(300);
    const a = await layerX(drift.page);
    await drift.page.waitForTimeout(400);
    assert.notDeepEqual(await layerX(drift.page), a, 'the scene never freezes');
  } finally { await drift.close(); }
});

test('parallax pauses off screen and never runs under reduced motion', async () => {
  const { page, close } = await open({ script: "dfStory.parallax(document.getElementById('stage'))" });
  try {
    await page.waitForFunction(() => document.getElementById('stage').dataset.dfParallax === 'running');
    await page.evaluate(() => window.scrollTo(0, 4000));
    await page.waitForFunction(() => document.getElementById('stage').dataset.dfParallax === 'paused');
  } finally { await close(); }
  const r = await open({ reducedMotion: 'reduce', script: "dfStory.parallax(document.getElementById('stage'))" });
  try {
    await r.page.mouse.move(900, 300);
    await r.page.waitForTimeout(300);
    assert.deepEqual(await layerX(r.page), [0, 0, 0]);
    assert.equal(await r.page.evaluate(() => document.getElementById('stage').dataset.dfParallax), 'still');
  } finally { await r.close(); }
});

test('hold: holding completes the beat, releasing lets it fall back, a tap advances it, and complete() ends it', async () => {
  const script = "window.done = 0; window.h = dfStory.hold(document.getElementById('hold'), { duration: 600, onDone: () => { window.done += 1; } })";
  const { page, close } = await open({ script });
  try {
    const box = await page.locator('#hold').boundingBox();
    await page.mouse.move(box.x + 5, box.y + 5);
    await page.mouse.down();
    await page.waitForTimeout(300);
    await page.mouse.up();
    const mid = await page.evaluate(() => window.h.progress);
    assert.ok(mid > 0.2 && mid < 0.9, `half held: ${mid}`);
    await page.waitForFunction((m) => window.h.progress < m - 0.1, mid);
    await page.mouse.down();
    await page.waitForFunction(() => window.done === 1, null, { timeout: 3000 });
    await page.mouse.up();
    assert.equal(await page.evaluate(() => [window.h.progress, document.getElementById('hold').dataset.dfHold]).then((v) => v.join()), '1,done');
  } finally { await close(); }
  const tap = await open({ script });
  try {
    await tap.page.click('#hold');
    const p = await tap.page.evaluate(() => window.h.progress);
    assert.ok(p >= 0.12, `a tap advances: ${p}`);
    await tap.page.evaluate(() => window.h.complete());
    assert.equal(await tap.page.evaluate(() => window.done), 1);
  } finally { await tap.close(); }
});

test('hold works from the keyboard, and one press completes it under reduced motion', async () => {
  const script = "window.done = 0; window.h = dfStory.hold(document.getElementById('hold'), { duration: 400, onDone: () => { window.done += 1; } })";
  const { page, close } = await open({ script });
  try {
    await page.focus('#hold');
    await page.keyboard.down(' ');
    await page.waitForFunction(() => window.done === 1, null, { timeout: 3000 });
    await page.keyboard.up(' ');
  } finally { await close(); }
  const r = await open({ reducedMotion: 'reduce', script });
  try {
    await r.page.click('#hold');
    assert.equal(await r.page.evaluate(() => window.done), 1);
  } finally { await r.close(); }
});

test('flipbook steps through the sheet on screen, and shows its poster still under reduced motion', async () => {
  const script = "dfStory.flipbook(document.getElementById('fx'), { frames: 8, cols: 4, fps: 24, poster: 2 })";
  const { page, close } = await open({ script });
  try {
    const seen = new Set();
    for (let i = 0; i < 12; i++) { seen.add(await page.evaluate(() => document.getElementById('fx').dataset.dfFrame)); await page.waitForTimeout(40); }
    assert.ok(seen.size >= 4, `frames seen: ${[...seen]}`);
    assert.equal(await page.evaluate(() => getComputedStyle(document.getElementById('fx')).backgroundSize), '400% 200%');
  } finally { await close(); }
  const r = await open({ reducedMotion: 'reduce', script });
  try {
    await r.page.waitForTimeout(300);
    assert.deepEqual(await r.page.evaluate(() => [document.getElementById('fx').dataset.dfFrame, document.getElementById('fx').dataset.dfFlipbook,
      getComputedStyle(document.getElementById('fx')).backgroundPosition]), ['2', 'poster', '66.6667% 0%']);
  } finally { await r.close(); }
});

test('ink: coverage grows with p, rises from the bottom, and is all-or-nothing under reduced motion', async () => {
  const script = "window.k = dfStory.ink(document.getElementById('ink'), { color: '#141019' })";
  const { page, close } = await open({ script });
  try {
    const cover = await page.evaluate(() => [0, 0.25, 0.5, 0.75, 1].map((p) => window.k.draw(p)));
    assert.equal(cover[0], 0);
    assert.equal(cover[4], 1);
    for (let i = 1; i < cover.length; i++) assert.ok(cover[i] >= cover[i - 1], `monotonic: ${cover}`);
    const rows = await page.evaluate(() => {
      window.k.draw(0.4);
      const c = document.getElementById('ink'); const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      const row = (y) => { let n = 0; for (let x = 0; x < c.width; x++) n += d[(y * c.width + x) * 4 + 3] > 0; return n / c.width; };
      return [row(2), row(c.height - 3)];
    });
    assert.ok(rows[1] > rows[0], `more ink at the bottom than at the top: ${rows}`);
  } finally { await close(); }
  const r = await open({ reducedMotion: 'reduce', script });
  try {
    assert.deepEqual(await r.page.evaluate(() => [0.3, 0.6].map((p) => window.k.draw(p))), [0, 1]);
  } finally { await r.close(); }
});

test('preload: honest progress over decode, upload and compile; reaches 1 only after compile; failures are listed', async () => {
  const script = `
    const c = document.createElement('canvas'); c.width = c.height = 64; c.getContext('2d').fillRect(0, 0, 64, 64);
    const ok = c.toDataURL('image/png');
    window.log = [];
    window.run = dfStory.preload([{ src: ok, weight: 2 }, ok, 'data:image/png;base64,bm90IGFuIGltYWdl'], {
      onProgress: (p) => window.log.push(['p', p]),
      upload: async (img) => { window.log.push(['upload', img.naturalWidth]); },
      compile: () => new Promise((res) => setTimeout(() => { window.log.push(['compiled']); res(); }, 150)),
    }).then((r) => ({ images: r.images.filter(Boolean).length, failed: r.failed.length }));`;
  const { page, close } = await open({ script });
  try {
    assert.deepEqual(await page.evaluate(() => window.run), { images: 2, failed: 1 });
    const log = await page.evaluate(() => window.log);
    const ps = log.filter((e) => e[0] === 'p').map((e) => e[1]);
    for (let i = 1; i < ps.length; i++) assert.ok(ps[i] > ps[i - 1], `never backwards: ${ps}`);
    assert.equal(ps.at(-1), 1);
    const compiled = log.findIndex((e) => e[0] === 'compiled');
    assert.ok(log.slice(0, compiled).every((e) => e[0] !== 'p' || e[1] < 1), 'not 1 before compile');
    assert.equal(log.filter((e) => e[0] === 'upload').length, 2);
    assert.ok(log.filter((e) => e[0] === 'upload').every((e) => e[1] === 64), 'uploaded decoded images');
  } finally { await close(); }
});
