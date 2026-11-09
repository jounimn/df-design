import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseMap, checkMap } from '../scripts/lib/migration-map.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIX = path.join(HERE, 'fixtures', 'migration');
const CLI = path.join(HERE, '..', 'scripts', 'check-kept.mjs');
const read = (f) => fs.readFileSync(path.join(FIX, f), 'utf8');

test('the map is read from the table with Legacy and Decision columns', () => {
  const rows = parseMap(read('map.md'));
  assert.equal(rows.length, 5);
  assert.deepEqual(rows.map((r) => r.decision), ['REPLACE', 'REPLACE', 'REMOVE', 'KEEP', 'REPLACE']);
  assert.match(rows[3].reason, /approved/);
  assert.equal(parseMap('# no table here'), null);
});

test('a half-applied identity fails for every legacy literal left and every token the map never names', () => {
  const r = checkMap(parseMap(read('map.md')), [path.join(FIX, 'half')]);
  assert.equal(r.ok, false);
  const by = (what) => r.findings.filter((f) => f.what === what).flatMap((f) => f.items);
  const left = by('legacy left in the code').join('\n');
  assert.match(left, /`--brand: 174 177 255`/);
  assert.match(left, /`Inter`/);
  assert.match(left, /`\[data-theme="cockpit"\]`/);
  assert.doesNotMatch(left, /--canvas/, 'a KEEP is not looked for');
  assert.deepEqual(by('custom properties the map never names').map((s) => s.split(' ')[0]), ['--surface'], 'framework --tw-* properties are not legacy identity');
});

test('the finished migration passes', () => {
  const r = checkMap(parseMap(read('map.md')), [path.join(FIX, 'done')]);
  assert.equal(r.ok, true, `IntersectionObserver is not \`Inter\`, --brand-blue is not \`--brand: …\`: ${JSON.stringify(r.findings)}`);
  assert.match(r.summary, /5 rows · 3 replace · 1 remove · 1 keep · 0 undecided/);
});

test('nothing stays by omission: an undecided row, a bare KEEP and a REPLACE with no new value fail', () => {
  const r = checkMap(parseMap(read('map-loose.md')), [path.join(FIX, 'done')]);
  const by = (what) => r.findings.filter((f) => f.what === what).flatMap((f) => f.items);
  assert.equal(by('undecided rows').length, 1);
  assert.equal(by('KEEP without an approved reason').length, 1);
  assert.equal(by('REPLACE without its new equivalent').length, 1);
});

test('the CLI map verb runs without a browser and exits 1, 0 and 2', () => {
  const run = (...a) => spawnSync(process.execPath, [CLI, 'map', ...a], { encoding: 'utf8' });
  const half = run(path.join(FIX, 'map.md'), path.join(FIX, 'half'));
  assert.equal(half.status, 1, half.stdout + half.stderr);
  assert.match(half.stdout, /FAIL\s+map · legacy left in the code/);
  const done = run(path.join(FIX, 'map.md'), path.join(FIX, 'done'));
  assert.equal(done.status, 0, done.stdout + done.stderr);
  assert.equal(run(path.join(FIX, 'map.md')).status, 2);
  assert.equal(run(path.join(FIX, 'half', 'index.css'), path.join(FIX, 'done')).status, 2, 'a file with no map table');
});
