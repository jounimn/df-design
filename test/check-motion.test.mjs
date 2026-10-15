import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import { fileURLToPath } from 'node:url';
import { launchBrowser } from '../scripts/lib/browser.mjs';
import { CHECK_NAMES, UsageError, loadCeilings, parseMotionArgs, runMotionChecks } from '../scripts/lib/motion-checks.mjs';
import { motionFixture } from './helpers/motion-fixture.mjs';

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
      const expected = inert ? 'na' : 'pass';
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

test('the shipped ceilings are read from motion-ceilings.json: a number of bytes per measured tier, rising with the tier', () => {
  const ceilings = loadCeilings();
  for (const tier of ['fast', 'medium', 'high']) assert.equal(typeof ceilings[tier], 'number', tier);
  assert.ok(ceilings.fast <= ceilings.medium && ceilings.medium <= ceilings.high, JSON.stringify(ceilings));
  assert.equal('custom' in ceilings, false);
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
  } finally {
    healthy.cleanup();
    frozen.cleanup();
  }
});

test('verification.md tells the agent to run check-motion when the page has a canvas', () => {
  const text = fs.readFileSync(path.join(path.dirname(CLI), '..', 'references', 'verification.md'), 'utf8');
  assert.match(text, /check-motion/);
});
