import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { launchBrowser } from '../scripts/lib/browser.mjs';
import { recordPage, comparePages, parseAllowances } from '../scripts/lib/page-record.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIX = path.join(HERE, 'fixtures', 'kept');
const CLI = path.join(HERE, '..', 'scripts', 'check-kept.mjs');

test('the record holds what the page says and does', { timeout: 60000 }, async () => {
  const browser = await launchBrowser();
  try {
    const r = await recordPage(browser, path.join(FIX, 'before.html'));
    assert.deepEqual(r.links, ['#rates', 'rooms.html', 'mailto:desk@example.com']);
    assert.deepEqual(r.fields, ['email', 'nights']);
    assert.equal(r.forms.length, 1);
    assert.equal(r.forms[0].action, 'https://example.com/api/book');
    assert.equal(r.forms[0].method, 'post');
    assert.ok(r.handlers.some((h) => /onclick="track\('book'\)"/.test(h)), r.handlers.join(' | '));
    assert.deepEqual(r.hooks, ['book-button']);
    assert.ok(r.hooked.includes('#nav-toggle') && r.hooked.includes('#site-nav'), r.hooked.join(', '));
    assert.ok(r.headings.includes('rates'));
    assert.ok(r.figures.includes('$120') && r.figures.includes('10:30'), r.figures.join(', '));
  } finally { await browser.close(); }
});

test('a careless redesign fails for every piece of wiring it lost, and respects what is on the record', { timeout: 90000 }, async () => {
  const browser = await launchBrowser();
  try {
    const before = await recordPage(browser, path.join(FIX, 'before.html'));
    const after = await recordPage(browser, path.join(FIX, 'after.html'));
    const r = comparePages(before, after);
    assert.equal(r.ok, false);
    const fails = r.findings.filter((f) => f.grade === 'FAIL');
    const by = (what) => fails.filter((f) => f.what === what).flatMap((f) => f.items);
    assert.deepEqual(by('links'), ['rooms.html'], 'the mailto is on the record (dropped); rooms.html is not: its reason is too short');
    assert.deepEqual(by('fields'), ['nights']);
    assert.ok(by('handlers').some((h) => /track/.test(h)));
    assert.deepEqual(by('test hooks'), ['book-button']);
    assert.ok(by('selectors a script queries').includes('#nav-toggle'), JSON.stringify(by('selectors a script queries')));
    assert.ok(by('forms').some((f) => /lost nights/.test(f)));
    const warns = r.findings.filter((f) => f.grade === 'WARN');
    assert.ok(!warns.some((f) => f.what === 'headings' && f.items.includes('rates')), 'the reworded heading is on the record');
    assert.ok(warns.some((f) => f.what === 'record' && /under 12 characters/.test(f.items[0])), 'the short reason is called out');
    assert.ok(warns.some((f) => f.what === 'controls'));
    assert.equal(r.kept.links.kept, 1);
    assert.equal(r.kept.links.before, 3);
  } finally { await browser.close(); }
});

test('the same page against itself keeps everything', { timeout: 60000 }, async () => {
  const browser = await launchBrowser();
  try {
    const before = await recordPage(browser, path.join(FIX, 'before.html'));
    const r = comparePages(before, before);
    assert.equal(r.ok, true);
    assert.deepEqual(r.findings, []);
  } finally { await browser.close(); }
});

test('allowances need a reason of twelve characters or more', () => {
  const a = parseAllowances(['df-design · dropped #team, /blog · the user is retiring the blog', ' df-design · reworded "Built for teams" to "Out of your way" · the opener was a cliché ', 'df-design · dropped x · why']);
  assert.deepEqual(a.dropped.map((d) => d.item), ['#team', '/blog']);
  assert.equal(a.reworded[0].old, 'built for teams');
  assert.equal(a.short.length, 1);
});

test('the CLI records, then checks, and writes the comparison page', { timeout: 120000 }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'df-kept-'));
  try {
    const rec = spawnSync(process.execPath, [CLI, 'record', path.join(FIX, 'before.html'), '--dir', dir], { encoding: 'utf8', timeout: 60000 });
    assert.equal(rec.status, 0, rec.stdout + rec.stderr);
    assert.ok(fs.existsSync(path.join(dir, 'before.json')));
    assert.ok(fs.existsSync(path.join(dir, 'before-1440.png')));
    const chk = spawnSync(process.execPath, [CLI, 'check', path.join(FIX, 'after.html'), '--dir', dir], { encoding: 'utf8', timeout: 60000 });
    assert.equal(chk.status, 1, chk.stdout + chk.stderr);
    assert.match(chk.stdout, /FAIL\s+kept · fields: nights/);
    assert.match(chk.stdout, /Kept 1\/3 links/);
    assert.ok(fs.existsSync(path.join(dir, 'compare.html')));
    assert.ok(fs.existsSync(path.join(dir, 'after-1440.png')));
    const same = spawnSync(process.execPath, [CLI, 'check', path.join(FIX, 'before.html'), '--dir', dir], { encoding: 'utf8', timeout: 60000 });
    assert.equal(same.status, 0, same.stdout + same.stderr);
    const usage = spawnSync(process.execPath, [CLI], { encoding: 'utf8' });
    assert.equal(usage.status, 2);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
