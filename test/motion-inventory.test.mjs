import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchBrowser, newPage, settle } from '../scripts/lib/browser.mjs';
import { runInventory } from '../scripts/lib/motion-inventory.mjs';
import { startFixtureServer } from './helpers/fixture-server.mjs';

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');

test('finds a CSS animation with its real timing and easing', async () => {
  const server = await startFixtureServer(FIXTURES);
  const browser = await launchBrowser();
  try {
    const { page } = await newPage(browser);
    await page.goto(`${server.url}/css-motion.html`);
    await settle(page, { quiet: 300 });
    const { animations, keyframes } = await runInventory(page);

    const dot = animations.find((a) => a.name === 'dot-pulse');
    assert.ok(dot, 'dot-pulse animation not found');
    assert.equal(dot.durationMs, 7000);
    assert.equal(dot.easing, 'cubic-bezier(0.25, 1, 0.5, 1)');
    assert.equal(dot.iterations, null); // Infinity is not JSON-safe; null means infinite

    // The effect channel reports 'linear' for CSS animations — the whole reason
    // `easing` is read from the computed style instead. Assert both, so a
    // regression back to the effect channel fails loudly.
    assert.equal(dot.effectEasing, 'linear');

    assert.ok(keyframes['dot-pulse'], 'keyframe body not extracted');
    assert.equal(keyframes['dot-pulse'].length, 3);
    assert.equal(keyframes['dot-pulse'][1].properties.opacity, '1');
  } finally {
    await browser.close();
    await server.close();
  }
});
