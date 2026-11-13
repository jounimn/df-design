import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { launchBrowser } from '../scripts/lib/browser.mjs';
import { CHECK_NAMES, UsageError, evaluateMotion, loadCeilings, parseMotionArgs, runMotionChecks, sequenceFrames } from '../scripts/lib/motion-checks.mjs';
import { motionFixture } from './helpers/motion-fixture.mjs';
import { startFixtureServer } from './helpers/fixture-server.mjs';
import { recordFilm } from './helpers/film.mjs';

const CLI = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'scripts', 'check-motion.mjs');
// The overweight fixture carries about 300 KB of script; the healthy ones a few KB.
const CEILINGS = { fast: 200000, medium: 200000, high: 200000 };

let browser;
test.before(async () => { browser = await launchBrowser(); });
test.after(async () => { await browser?.close(); });

async function check(kind, { tier = 'high', ceilings = CEILINGS, fixture } = {}) {
  const fx = motionFixture(kind, fixture);
  try {
    return await runMotionChecks(fx.file, { tier, browser, ceilings });
  } finally {
    fx.cleanup();
  }
}
const byName = (result) => Object.fromEntries(result.checks.map((c) => [c.name, c]));
const failedNames = (result) => result.checks.filter((c) => c.status === 'fail').map((c) => c.name);

// ---- The matrix: every fixture fails only its own check ----------------------------------------------------

const PAGE_EXPECTED = { 'built at the chosen tier': 'na', 'works without JS': 'na', 'video honours reduced motion': 'na', 'no audio before a gesture': 'pass', 'page weight by type': 'report' };
const MATRIX = [
  ['healthy', []],
  ['frozen', ['canvas is alive']],
  ['blank', ['canvas is alive']],
  ['ignoresReducedMotion', ['canvas honours reduced motion']],
  ['neverPauses', ['canvas pauses off-screen']],
  ['noFallback', ['fallback without WebGL']],
  ['overweight', ['motion weight within tier']],
];
for (const [kind, failing] of MATRIX) {
  test(`matrix: ${kind} fails ${failing.length ? failing.join(', ') : 'nothing'}`, async () => {
    const result = await check(kind);
    assert.deepEqual(failedNames(result), failing);
    assert.equal(result.ok, failing.length === 0);
    assert.deepEqual(result.checks.map((c) => c.name), CHECK_NAMES);
    for (const c of result.checks) {
      // The frozen and blank fixtures are 2D canvases that never move: there is no WebGL fallback to compare, and a
      // canvas that does not animate has nothing to hold still under reduced motion or to pause off-screen (n/a).
      const inert = ['frozen', 'blank'].includes(kind) && c.name !== 'canvas is alive' && c.name !== 'motion weight within tier';
      // The canvas fixtures carry no headings, text, images, video or sound, and the weight is always reported.
      const expected = PAGE_EXPECTED[c.name] ?? (inert ? 'na' : 'pass');
      if (!failing.includes(c.name)) assert.equal(c.status, expected, `${kind}: ${c.name} is ${c.status} (${c.detail})`);
    }
  });
}

test('a failure names the canvas and says it in one plain sentence', async () => {
  const result = await check('frozen');
  const alive = byName(result)['canvas is alive'];
  assert.match(alive.detail, /canvas#c/);
  assert.match(alive.detail, /frozen/);
});

// ---- Pages the checks must not fail ------------------------------------------------------------------------

test('noCanvas: the four canvas checks are n/a, the weight is judged, ok is true', async () => {
  const result = await check('noCanvas');
  for (const name of CHECK_NAMES.slice(0, 4)) assert.equal(byName(result)[name].status, 'na', name);
  assert.equal(byName(result)['motion weight within tier'].status, 'pass');
  assert.equal(result.ok, true);
});

test('staticCanvas: a canvas drawn once is not "alive" or "dead": that check is n/a', async () => {
  const result = await check('staticCanvas');
  assert.equal(byName(result)['canvas is alive'].status, 'na');
  assert.equal(result.ok, true);
});

test('twoCanvases: one healthy, one frozen: alive fails and names the frozen canvas only', async () => {
  const result = await check('twoCanvases');
  assert.deepEqual(failedNames(result), ['canvas is alive']);
  const { detail } = byName(result)['canvas is alive'];
  assert.match(detail, /canvas#b/);
  assert.equal(detail.includes('canvas#a'), false, detail);
});

test('without a ceiling the weight check reports and never fails; custom never fails', async () => {
  const none = await check('overweight', { ceilings: {} });
  assert.equal(byName(none)['motion weight within tier'].status, 'report');
  assert.equal(none.ok, true);
  const custom = await check('overweight', { tier: 'custom' });
  assert.equal(byName(custom)['motion weight within tier'].status, 'report');
  assert.equal(custom.ok, true);
});

test('a tier missing from the ceilings is reported, not judged', async () => {
  const result = await check('overweight', { tier: 'fast', ceilings: { high: 200000 } });
  assert.equal(byName(result)['motion weight within tier'].status, 'report');
});

test('the shipped ceilings are read from motion-ceilings.json, with no fast key until it is measured', () => {
  const ceilings = loadCeilings();
  assert.equal(typeof ceilings.high, 'number');
  assert.equal('fast' in ceilings, false);
});

test('loadCeilings: a missing file is no ceilings; malformed JSON is an error; a value that is not a number is dropped', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tetos teste '));
  try {
    assert.deepEqual(loadCeilings(path.join(dir, 'missing.json')), {});
    const write = (name, text) => { const f = path.join(dir, name); fs.writeFileSync(f, text); return f; };
    assert.throws(() => loadCeilings(write('bad.json', '{ "high": 340, ')), /not valid JSON/);
    assert.throws(() => loadCeilings(write('list.json', '[1, 2]')), /object/);
    assert.throws(() => loadCeilings(dir), /EISDIR|illegal operation|EPERM|EACCES/i, 'an unreadable path is an error, not "no ceilings"');
    assert.deepEqual(
      loadCeilings(write('mixed.json', '{ "fast": "200 KB", "medium": null, "high": 340000, "custom": 5, "huge": 9 }')),
      { high: 340000 },
    );
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

// ---- Command line ------------------------------------------------------------------------------------------

test('parseMotionArgs accepts a target with a tier, in either order and either form', () => {
  assert.deepEqual(parseMotionArgs(['page.html', '--tier', 'high']), { target: 'page.html', tier: 'high' });
  assert.deepEqual(parseMotionArgs(['--tier=custom', 'https://x.example/']), { target: 'https://x.example/', tier: 'custom' });
});

test('parseMotionArgs rejects a missing tier, a bogus tier, a tier twice, an unknown flag and a missing target', () => {
  for (const argv of [
    ['page.html'],
    ['page.html', '--tier'],
    ['page.html', '--tier', 'bogus'],
    ['page.html', '--tier', 'fast', '--tier', 'high'],
    ['page.html', '--tier', 'fast', '--tier=high'],
    ['page.html', '--tier', 'fast', '--bogus'],
    ['--tier', 'fast'],
    ['a.html', 'b.html', '--tier', 'fast'],
  ]) assert.throws(() => parseMotionArgs(argv), UsageError, argv.join(' '));
});

// ---- works without JS ---------------------------------------------------------------------------------------

test('works without JS: a page of plain CSS passes on the fast tier', async () => {
  const result = await check('cssOnly', { tier: 'fast' });
  const c = byName(result)['works without JS'];
  assert.equal(c.status, 'pass', c.detail);
  assert.equal(result.ok, true);
});

test('works without JS: content that stays at opacity 0 until a script reveals it fails the fast tier, and only this check', async () => {
  const result = await check('revealOnScroll', { tier: 'fast' });
  assert.deepEqual(failedNames(result), ['works without JS']);
  assert.equal(result.ok, false);
  const { detail } = byName(result)['works without JS'];
  assert.match(detail, /without JavaScript/);
  assert.match(detail, /Heading 1/, 'it names examples');
  assert.ok((detail.match(/"[^"]+"/g) ?? []).length <= 5, `at most five examples: ${detail}`);
});

test('works without JS: content built by the script is missing without it, and fails the fast tier', async () => {
  const result = await check('jsRendered', { tier: 'fast' });
  assert.deepEqual(failedNames(result), ['works without JS']);
  assert.match(byName(result)['works without JS'].detail, /Rendered by script|Paragraph 1/);
});

test('works without JS: medium, high and custom only report it', async () => {
  for (const tier of ['medium', 'high', 'custom']) {
    const result = await check('revealOnScroll', { tier });
    const c = byName(result)['works without JS'];
    assert.equal(c.status, 'report', `${tier}: ${c.detail}`);
    assert.equal(result.ok, true, tier);
  }
});

test('works without JS: more than 5 % of the content missing fails; exactly 5 % passes', async () => {
  const one = await check('revealOneOfTwenty', { tier: 'fast' });
  assert.equal(byName(one)['works without JS'].status, 'pass', byName(one)['works without JS'].detail);
  const two = await check('revealTwoOfTwenty', { tier: 'fast' });
  assert.equal(byName(two)['works without JS'].status, 'fail');
});

test('works without JS: a page with no content to compare is n/a', async () => {
  const result = await check('healthy', { tier: 'fast' });
  assert.equal(byName(result)['works without JS'].status, 'na');
});

test('the fast tier has no weight ceiling: the weight is reported even when the ceilings file names one', async () => {
  const result = await check('overweight', { tier: 'fast', ceilings: { fast: 1000 } });
  assert.equal(byName(result)['motion weight within tier'].status, 'report');
  assert.equal(failedNames(result).includes('motion weight within tier'), false);
});

const cli = (...args) => spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', timeout: 240000 });

test('the CLI exits 2 with a plain one-line message for bad arguments and for a missing file', () => {
  for (const args of [[], ['page.html'], ['page.html', '--tier', 'bogus'], ['/no/such/page.html', '--tier', 'fast']]) {
    const r = cli(...args);
    assert.equal(r.status, 2, args.join(' '));
    assert.equal(r.stdout, '');
    assert.match(r.stderr, /Usage: node scripts\/check-motion\.mjs/);
    assert.equal(/\n\s+at /.test(r.stderr), false, `no stack trace: ${r.stderr}`);
  }
});

test('the CLI exits 0 on a healthy page and 1 on a frozen one', () => {
  const healthy = motionFixture('healthy');
  const frozen = motionFixture('frozen');
  try {
    const ok = cli(healthy.file, '--tier', 'custom');
    assert.equal(ok.status, 0, ok.stdout + ok.stderr);
    assert.match(ok.stdout, /PASS +canvas is alive/);
    const bad = cli(frozen.file, '--tier', 'custom');
    assert.equal(bad.status, 1, bad.stdout + bad.stderr);
    assert.match(bad.stdout, /FAIL +canvas is alive/);
    // An uncaught exit code from the check that only fails the fast tier.
    const reveal = motionFixture('revealOnScroll');
    try {
      const fast = cli(reveal.file, '--tier', 'fast');
      assert.equal(fast.status, 1, fast.stdout + fast.stderr);
      assert.match(fast.stdout, /FAIL +works without JS/);
      const medium = cli(reveal.file, '--tier', 'medium');
      assert.equal(medium.status, 0, medium.stdout + medium.stderr);
      assert.match(medium.stdout, /REPORT +works without JS/);
    } finally {
      reveal.cleanup();
    }
  } finally {
    healthy.cleanup();
    frozen.cleanup();
  }
});

// ---- The yolo tier: no ceiling, the Floor still applies --------------------------------------------------------

test('parseMotionArgs accepts the yolo tier', () => {
  assert.deepEqual(parseMotionArgs(['page.html', '--tier', 'yolo']), { target: 'page.html', tier: 'yolo' });
});

test('yolo: the weight is reported and never judged, even when the ceilings name a yolo ceiling', async () => {
  for (const ceilings of [CEILINGS, { ...CEILINGS, yolo: 1000 }, {}]) {
    const result = await check('overweight', { tier: 'yolo', ceilings });
    const c = byName(result)['motion weight within tier'];
    assert.equal(c.status, 'report', c.detail);
    assert.match(c.detail, /yolo tier has no ceiling/);
    assert.equal(failedNames(result).includes('motion weight within tier'), false);
  }
});

test('yolo: a page with no headings or paragraphs in its HTML fails readable-without-JS, with a plain reason', async () => {
  const result = await check('healthy', { tier: 'yolo' });
  assert.deepEqual(failedNames(result), ['works without JS']);
  assert.match(byName(result)['works without JS'].detail, /no headings or paragraphs in its HTML/);
});

test('the shipped ceilings have no yolo key, and a yolo key in a ceilings file is dropped', () => {
  assert.equal('yolo' in loadCeilings(), false);
  const raw = JSON.parse(fs.readFileSync(path.join(path.dirname(CLI), 'lib', 'motion-ceilings.json'), 'utf8'));
  assert.equal('yolo' in raw, false, 'motion-ceilings.json must not carry a yolo ceiling');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tetos yolo '));
  try {
    const file = path.join(dir, 'c.json');
    fs.writeFileSync(file, '{ "high": 340000, "yolo": 14000000 }');
    assert.deepEqual(loadCeilings(file), { high: 340000 });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('yolo: the canvas Floor fails as on every tier (reduced motion, fallback without WebGL)', async () => {
  // These canvas fixtures carry no text, so they also fail readable-without-JS (tested on its own above).
  const canvasFailures = (result) => failedNames(result).filter((n) => n !== 'works without JS');
  assert.deepEqual(canvasFailures(await check('ignoresReducedMotion', { tier: 'yolo' })), ['canvas honours reduced motion']);
  assert.deepEqual(canvasFailures(await check('noFallback', { tier: 'yolo' })), ['fallback without WebGL']);
});

test('yolo: content that needs JavaScript to be seen fails, as on the fast tier', async () => {
  const result = await check('revealOnScroll', { tier: 'yolo' });
  assert.deepEqual(failedNames(result), ['works without JS']);
  assert.match(byName(result)['works without JS'].detail, /yolo tier owes the Floor/);
});

test('yolo: readable without JS is judged on the reading text by characters, and 40 % of it is enough', () => {
  const item = (tag, label) => ({ key: `${tag}|${label}`, tag, label, seen: true });
  const text = (n) => 'x'.repeat(n);
  const withJs = [item('h1', text(20)), item('p', text(80)), item('p', text(100)), item('button', 'Menu'), item('a', 'Cookies')];
  const run = (seenWithout) => {
    const r = evaluateMotion({ canvases: [], motionJsBytes: 0 }, { tier: 'yolo', ceilings: {}, content: { withJs, withoutJs: seenWithout } });
    return byName(r)['works without JS'];
  };
  // The heading and the 80-character paragraph show (100 of 200 characters); the menu, the cookie link and the
  // other paragraph do not: 50 %, a pass, though more than 5 % of the items are missing.
  assert.equal(run([withJs[0], withJs[1]]).status, 'pass');
  // Only the heading: 10 % of the text, a fail.
  const fail = run([withJs[0]]);
  assert.equal(fail.status, 'fail');
  assert.match(fail.detail, /10 % of the reading text/);
  // The controls alone missing never fail yolo; the same content fails fast.
  assert.equal(run(withJs.slice(0, 3)).status, 'pass');
  const fast = evaluateMotion({ canvases: [], motionJsBytes: 0 }, { tier: 'fast', ceilings: {}, content: { withJs, withoutJs: withJs.slice(0, 3) } });
  assert.equal(byName(fast)['works without JS'].status, 'fail');
});

test('works without JS: text in the DOM under an opaque loader counts as covered, not seen', async () => {
  const yolo = await check('loaderCover', { tier: 'yolo' });
  assert.deepEqual(failedNames(yolo), ['works without JS']);
  assert.match(byName(yolo)['works without JS'].detail, /\(covered\)/);
  const fast = await check('loaderCover', { tier: 'fast' });
  assert.deepEqual(failedNames(fast), ['works without JS']);
  const high = await check('loaderCover', { tier: 'high' });
  assert.equal(byName(high)['works without JS'].status, 'report');
  assert.equal(high.ok, true);
  // The same text without the loader passes: covering is what fails, not the layout.
  assert.equal(byName(await check('cssOnly', { tier: 'yolo' }))['works without JS'].status, 'pass');
});

// Sound and weight need a network: a file:// page fetches nothing the browser reports. These run over http.
async function checkServed(kind, { tier, files = {}, beforeScene = '' } = {}) {
  const fx = motionFixture(kind, { files, beforeScene });
  const server = await startFixtureServer(fx.dir);
  try {
    return await runMotionChecks(`${server.url}/page.html`, { tier, browser, ceilings: CEILINGS });
  } finally {
    await server.close();
    fx.cleanup();
  }
}
const TONE = Buffer.alloc(40000, 7);

test('no audio before a gesture: a sound fetched as the page opens fails yolo and high and is reported on other tiers', async () => {
  const yolo = await checkServed('audioOnLoad', { tier: 'yolo', files: { 'tone.mp3': TONE } });
  assert.deepEqual(failedNames(yolo), ['no audio before a gesture']);
  assert.match(byName(yolo)['no audio before a gesture'].detail, /tone\.mp3/);
  const high = await checkServed('audioOnLoad', { tier: 'high', files: { 'tone.mp3': TONE } });
  assert.deepEqual(failedNames(high), ['no audio before a gesture']);
  const medium = await checkServed('audioOnLoad', { tier: 'medium', files: { 'tone.mp3': TONE } });
  assert.equal(byName(medium)['no audio before a gesture'].status, 'report');
  assert.equal(medium.ok, true);
});

test('no audio before a gesture: a sound fetched only on a click passes', async () => {
  const result = await checkServed('audioOnClick', { tier: 'yolo', files: { 'tone.mp3': TONE } });
  assert.equal(byName(result)['no audio before a gesture'].status, 'pass');
  assert.equal(result.ok, true);
});

test('no audio before a gesture: sound synthesized as the page opens fails yolo and high though no file is fetched', async () => {
  const yolo = await checkServed('synthOnLoad', { tier: 'yolo' });
  assert.deepEqual(failedNames(yolo), ['no audio before a gesture']);
  assert.match(byName(yolo)['no audio before a gesture'].detail, /1 AudioContext made or resumed/);
  const high = await checkServed('synthOnLoad', { tier: 'high' });
  assert.deepEqual(failedNames(high), ['no audio before a gesture']);
  const medium = await checkServed('synthOnLoad', { tier: 'medium' });
  assert.equal(byName(medium)['no audio before a gesture'].status, 'report');
});

test('no audio before a gesture: an AudioContext made only inside a click passes on yolo and high', async () => {
  for (const tier of ['yolo', 'high']) {
    const result = await checkServed('synthOnClick', { tier });
    assert.equal(byName(result)['no audio before a gesture'].status, 'pass', tier);
  }
});

test('page weight by type: reported with the first view and the full scroll, the sound counted as audio', async () => {
  const result = await checkServed('audioOnLoad', { tier: 'yolo', files: { 'tone.mp3': TONE } });
  const c = byName(result)['page weight by type'];
  assert.equal(c.status, 'report');
  assert.match(c.detail, /^first view \d+ KB \(.*audio 39 KB/);
  assert.match(c.detail, /after a full scroll/);
  assert.match(c.detail, /price for the tier message/);
});

test('page weight by type: a file:// page says it cannot be weighed in full', async () => {
  const result = await check('cssOnly', { tier: 'high' });
  const c = byName(result)['page weight by type'];
  assert.equal(c.status, 'report');
  assert.match(c.detail, /serve it over http/);
});

test('video honours reduced motion: a film that plays under reduced motion fails yolo, is reported elsewhere; a paused one passes', async () => {
  const film = await recordFilm(browser);
  const ignores = await checkServed('videoIgnoresReducedMotion', { tier: 'yolo', files: { 'film.webm': film } });
  assert.deepEqual(failedNames(ignores), ['video honours reduced motion']);
  assert.match(byName(ignores)['video honours reduced motion'].detail, /video#film/);
  const high = await checkServed('videoIgnoresReducedMotion', { tier: 'high', files: { 'film.webm': film } });
  assert.equal(byName(high)['video honours reduced motion'].status, 'report');
  const honours = await checkServed('videoHonoursReducedMotion', { tier: 'yolo', files: { 'film.webm': film } });
  assert.equal(byName(honours)['video honours reduced motion'].status, 'pass', byName(honours)['video honours reduced motion'].detail);
  assert.equal(honours.ok, true);
});

// ---- The ambition floor: a yolo page built below the tier is reported, never failed ---------------------------

const AMBITION = 'built at the chosen tier';

test('sequenceFrames: the largest set of numbered stills sharing one name', () => {
  const e = (url) => ({ url, type: 'Image', bytes: 10 });
  assert.equal(sequenceFrames([e('a/f_001.png'), e('a/f_002.png'), e('a/f_003.webp?v=1'), e('logo.png'), e('b/x-10.jpg')]), 3);
  assert.equal(sequenceFrames([]), 0);
});

test('ambition: a plain CSS page called yolo is reported as built below the chosen tier, and never fails', async () => {
  const result = await check('cssOnly', { tier: 'yolo' });
  const c = byName(result)[AMBITION];
  assert.equal(c.status, 'report', c.detail);
  assert.match(c.detail, /^built below the chosen tier: none of the yolo techniques/);
  assert.match(c.detail, /re-send the tier message/);
  assert.equal(failedNames(result).includes(AMBITION), false);
});

test('ambition: one WebGL scene at a few KB is still below the tier: under the High ceiling', async () => {
  const c = byName(await check('healthy', { tier: 'yolo' }))[AMBITION];
  assert.equal(c.status, 'report');
  assert.match(c.detail, /under the 195 KB High ceiling/);
  assert.match(c.detail, /Seen: a real-time 3D scene \(1 WebGL canvas\)/);
});

test('ambition: a WebGL scene over the High ceiling is built at the chosen tier', async () => {
  const c = byName(await checkServed('healthy', { tier: 'yolo', beforeScene: "<script>fetch('scene.bin')</script>", files: { 'scene.bin': Buffer.alloc(400000, 9) } }))[AMBITION];
  assert.equal(c.status, 'pass', c.detail);
  assert.match(c.detail, /^built at the chosen tier: a real-time 3D scene/);
});

test('ambition: an image sequence and layered parallax are seen', async () => {
  const frames = Object.fromEntries(Array.from({ length: 40 }, (_, i) => [`f_${String(i + 1).padStart(3, '0')}.png`, Buffer.alloc(10000, i)]));
  const seq = byName(await checkServed('imageSequence', { tier: 'yolo', files: frames }))[AMBITION];
  assert.equal(seq.status, 'pass', seq.detail);
  assert.match(seq.detail, /an image sequence \(40 numbered frames\)/);
  const layers = byName(await check('parallaxPlanes', { tier: 'yolo' }))[AMBITION];
  assert.match(layers.detail, /layered parallax \(4 planes\)/);
});

test('ambition: the other tiers set no ambition floor', async () => {
  assert.equal(byName(await check('cssOnly', { tier: 'high' }))[AMBITION].status, 'na');
});

test('the CLI accepts --tier yolo and exits 1 when the Floor fails', () => {
  const reveal = motionFixture('revealOnScroll');
  try {
    const r = cli(reveal.file, '--tier', 'yolo');
    assert.equal(r.status, 1, r.stdout + r.stderr);
    assert.match(r.stdout, /FAIL +works without JS/);
    assert.match(r.stdout, /REPORT +page weight by type/);
    assert.match(r.stdout, /\(tier: yolo\)/);
  } finally {
    reveal.cleanup();
  }
});

test('verification.md tells the agent to run check-motion when the page has a canvas', () => {
  const text = fs.readFileSync(path.join(path.dirname(CLI), '..', 'references', 'verification.md'), 'utf8');
  assert.match(text, /check-motion/);
});
