import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchBrowser, newPage, settle } from '../scripts/lib/browser.mjs';
import { runInventory } from '../scripts/lib/motion-inventory.mjs';
import { runPropertyTrace } from '../scripts/lib/property-trace.mjs';
import { startFixtureServer } from './helpers/fixture-server.mjs';

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');

test('the inventory misses ticker-driven motion but the property trace catches it', async () => {
  const server = await startFixtureServer(FIXTURES);
  const browser = await launchBrowser();
  try {
    const { page } = await newPage(browser);
    await page.goto(`${server.url}/raf-motion.html`);
    await settle(page, { quiet: 300 });

    // The whole reason §7.3 exists: this page is visibly animating and the
    // animation API reports nothing.
    const { animations } = await runInventory(page);
    assert.equal(animations.length, 0, 'fixture must not use CSS/WAAPI animation');

    const trace = await runPropertyTrace(page, { selectors: ['#mover'], samples: 20, durationMs: 700 });
    const mover = trace.elements.find((e) => e.selector === '#mover');
    assert.ok(mover, '#mover not traced');
    assert.equal(mover.moved, true, 'trace failed to detect ticker-driven motion');
    assert.ok(mover.series.length >= 10);

    const transforms = new Set(mover.series.map((s) => s.transform));
    assert.ok(transforms.size > 3, `expected varied transforms, saw ${transforms.size}`);
  } finally {
    await browser.close();
    await server.close();
  }
});
