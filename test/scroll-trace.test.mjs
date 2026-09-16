import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchBrowser, newPage, settle } from '../scripts/lib/browser.mjs';
import { runScrollTrace } from '../scripts/lib/scroll-trace.mjs';
import { startFixtureServer } from './helpers/fixture-server.mjs';

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');

async function trace(file, selectors) {
  const server = await startFixtureServer(FIXTURES);
  const browser = await launchBrowser();
  try {
    const { page } = await newPage(browser);
    await page.goto(`${server.url}/${file}`);
    await settle(page, { quiet: 300 });
    return await runScrollTrace(page, { selectors, steps: 8 });
  } finally {
    await browser.close();
    await server.close();
  }
}

test('reconstructs the scroll-to-property mapping', async () => {
  const t = await trace('scroll-linked.html', ['#bar']);
  assert.equal(t.available, true);
  assert.equal(t.series.length, 8);
  const transforms = t.series.map((s) => s.values['#bar'].transform);
  assert.ok(new Set(transforms).size > 3, 'transform should vary with scroll');
  assert.ok(t.series.at(-1).progress > t.series[0].progress);
});

test('records itself unavailable when scrolling cannot be driven', async () => {
  const t = await trace('scroll-locked.html', ['#bar']);
  assert.equal(t.available, false);
  assert.match(t.reason, /scroll/i);
});
