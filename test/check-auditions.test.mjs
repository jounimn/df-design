import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(HERE, '..', 'scripts', 'check-auditions.mjs');
const FIXTURES = path.join(HERE, 'fixtures');
const ICON = '<svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6"/></svg>';

test('each candidate gets its reduced-motion still and its motion capture side by side', { timeout: 300000 }, () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'dfd-auditions-'));
  const dir = path.join(root, 'auditions');
  const caps = path.join(root, 'captures');
  fs.mkdirSync(dir);
  try {
    fs.writeFileSync(path.join(dir, 'index.html'), '<!doctype html><meta charset="utf-8"><title>Auditions</title><a href="a.html">A</a> <a href="b.html">B</a>');
    for (const [name, src] of [['a', 'motion-pinned.html'], ['b', 'motion-normal.html']]) {
      const html = fs.readFileSync(path.join(FIXTURES, src), 'utf8').replace('<body>', `<body>${ICON}`);
      fs.writeFileSync(path.join(dir, `${name}.html`), html);
    }
    const r = spawnSync(process.execPath, [CLI, dir, 'no', caps], { encoding: 'utf8', timeout: 290000 });
    assert.equal(r.status, 0, r.stdout + r.stderr);
    for (const name of ['a', 'b']) {
      assert.match(r.stdout, new RegExp(`PASS  ${name}\\.html: motion capture written  — \\d+ sheet\\(s\\) from .*reached the end; moved by wheel`));
      assert.ok(fs.existsSync(path.join(caps, `${name}.jpg`)), `${name}.jpg: the still at rest`);
      assert.ok(fs.existsSync(path.join(caps, `${name}-motion.png`)), `${name}-motion.png: the first sheet beside it`);
      assert.ok(fs.existsSync(path.join(caps, `${name}-motion`, 'video.webm')));
      assert.ok(fs.existsSync(path.join(caps, `${name}-motion`, 'capture.json')));
    }
    assert.ok(!fs.existsSync(path.join(caps, 'index-motion')), 'the comparison frame is not captured in motion');
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
