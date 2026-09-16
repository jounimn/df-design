import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchBrowser, newPage } from '../scripts/lib/browser.mjs';
import { startFixtureServer } from './helpers/fixture-server.mjs';

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');

test('launches a browser and loads a page at the corpus viewport', async () => {
  const server = await startFixtureServer(FIXTURES);
  const browser = await launchBrowser();
  try {
    const { page } = await newPage(browser);
    await page.goto(`${server.url}/static-basic.html`);
    assert.equal(await page.title(), 'Static Basic');
    const vp = page.viewportSize();
    assert.equal(vp.width, 1440);
    assert.equal(vp.height, 900);
  } finally {
    await browser.close();
    await server.close();
  }
});

test('honours the reducedMotion setting', async () => {
  const browser = await launchBrowser();
  try {
    const { page } = await newPage(browser, { reducedMotion: 'reduce' });
    await page.setContent('<p>x</p>');
    const reduced = await page.evaluate(
      () => matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
    assert.equal(reduced, true);
  } finally {
    await browser.close();
  }
});
