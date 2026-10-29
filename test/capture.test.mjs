import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PAGE = path.join(HERE, 'fixtures', 'slop', 'render-good.html');
const CLI = path.join(HERE, '..', 'scripts', 'capture.mjs');
const run = (...args) => spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', timeout: 120000 });

// PNG dimensions from the IHDR chunk
const pngSize = (file) => { const b = fs.readFileSync(file); return [b.readUInt32BE(16), b.readUInt32BE(20)]; };

test('captures a page at desktop and phone, at 2x, and prints a ready <img> for each', { timeout: 120000 }, () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'df-capture-'));
  try {
    const r = run(PAGE, '--out', out, '--name', 'rooms');
    assert.equal(r.status, 0, r.stdout + r.stderr);
    const desktop = path.join(out, 'rooms-home-desktop.png');
    const phone = path.join(out, 'rooms-home-phone.png');
    assert.ok(fs.existsSync(desktop) && fs.existsSync(phone), r.stdout);
    assert.deepEqual(pngSize(desktop), [2880, 1800]);
    assert.deepEqual(pngSize(phone), [780, 1688]);
    assert.match(r.stdout, /<img src="[^"]*rooms-home-desktop\.png" width="2880" height="1800"/);
    assert.match(r.stdout, /2 screenshots/);
  } finally { fs.rmSync(out, { recursive: true, force: true }); }
});

test('--selector captures one element, --full the whole page, --scale 1 at device size', { timeout: 120000 }, () => {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'df-capture-'));
  try {
    const part = run(PAGE, '--out', out, '--sizes', 'desktop', '--selector', 'h1', '--scale', '1');
    assert.equal(part.status, 0, part.stdout + part.stderr);
    const [w, h] = pngSize(path.join(out, 'screen-home-desktop-part.png'));
    assert.ok(w < 1440 && h < 400, `h1 part is ${w} x ${h}`);
    const full = run(PAGE, '--out', out, '--sizes', 'desktop', '--full', '--scale', '1');
    assert.equal(full.status, 0, full.stdout + full.stderr);
    const [, fh] = pngSize(path.join(out, 'screen-home-desktop.png'));
    assert.ok(fh > 900, `full page is ${fh} tall`);
  } finally { fs.rmSync(out, { recursive: true, force: true }); }
});

test('bad command lines exit 2 without opening a browser', () => {
  assert.equal(run().status, 2);
  assert.equal(run(PAGE, '--sizes', 'watch').status, 2);
  assert.equal(run(PAGE, '--bogus').status, 2);
  assert.equal(run('no-such-file.html').status, 2);
});
