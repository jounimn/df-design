import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { launchBrowser, newPage } from '../scripts/lib/browser.mjs';
import { bundleDir, writeBundle, renderContactSheet } from '../scripts/lib/bundle.mjs';

test('bundleDir composes captures/<site>/<date>', () => {
  assert.equal(
    bundleDir('captures', 'example.com', '2026-09-16'),
    path.join('captures', 'example.com', '2026-09-16'),
  );
});

test('writeBundle writes every artifact and returns their paths', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'dfd-'));
  const browser = await launchBrowser();
  try {
    const { page } = await newPage(browser);
    await page.setContent('<div style="width:200px;height:120px;background:#27f795"></div>');
    const shot = await page.screenshot();

    const dir = bundleDir(root, 'example.com', '2026-09-16');
    const out = await writeBundle(dir, {
      record: { site: 'example.com', archetype: 'typographic' },
      raw: { anything: true },
      motion: { animations: [] },
      frames: [{ name: 'scroll-000.png', buffer: shot }],
    });

    assert.ok(out.files.includes('record.json'));
    const record = JSON.parse(await fs.readFile(path.join(dir, 'record.json'), 'utf8'));
    assert.equal(record.site, 'example.com');
    await fs.access(path.join(dir, 'frames', 'scroll-000.png'));

    const sheet = await renderContactSheet(
      browser,
      [{ name: 'scroll-000.png', buffer: shot }],
      path.join(dir, 'contact.png'),
    );
    const stat = await fs.stat(sheet);
    assert.ok(stat.size > 0, 'contact sheet is empty');
  } finally {
    await browser.close();
    await fs.rm(root, { recursive: true, force: true });
  }
});
