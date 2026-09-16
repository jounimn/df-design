import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { launchBrowser, newPage, settle } from '../scripts/lib/browser.mjs';
import { runStaticPass } from '../scripts/lib/static-pass.mjs';
import { startFixtureServer } from './helpers/fixture-server.mjs';

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');

async function probe(file) {
  const server = await startFixtureServer(FIXTURES);
  const browser = await launchBrowser();
  try {
    const { page } = await newPage(browser);
    await page.goto(`${server.url}/${file}`);
    await settle(page, { quiet: 300 });
    return await runStaticPass(page);
  } finally {
    await browser.close();
    await server.close();
  }
}

test('measures the opening statement and its tracking', async () => {
  const r = await probe('static-basic.html');
  assert.equal(r.hero.fontSizePx, 72);
  assert.ok(r.hero.letterSpacingEm < -0.02, `expected tight tracking, got ${r.hero.letterSpacingEm}`);
  assert.equal(r.hero.tag, 'h1');
});

test('samples a painted ground, never a transparent one', async () => {
  const r = await probe('static-basic.html');
  assert.match(r.groundColor, /^rgba?\(/);
  assert.ok(!/,\s*0\)$/.test(r.groundColor), `ground came back transparent: ${r.groundColor}`);
});

test('counts sections and ground changes', async () => {
  const r = await probe('static-basic.html');
  assert.ok(r.sectionCount >= 2);
  assert.ok(r.groundChanges >= 1);
});

// Regression: probing linear.app returned accentColor "rgba(0, 0, 0, 0)" because
// the picker took the first button in DOM order — a 32px transparent icon toggle —
// and the transparent value was PUBLISHED, not quarantined.
test('skips a transparent icon button and finds the real CTA', async () => {
  const r = await probe('cta-decoy.html');
  assert.equal(r.accentColor, 'rgb(94, 106, 210)');
  assert.equal(r.ctaRadiusPx, 8);
  assert.ok(r.ctaSmallerDimPx > 32, `picked the 32px decoy: ${r.ctaSmallerDimPx}px`);
});

test('reports an unknown accent rather than a transparent one when nothing qualifies', async () => {
  const r = await probe('heroless-canvas.html');
  assert.equal(r.accentColor, 'unknown');
});

test('a heroless page yields hero: null and is still fully measured', async () => {
  const r = await probe('heroless-canvas.html');
  assert.equal(r.hero, null);
  assert.equal(r.features.canvas, 1);
  assert.ok(r.canvasAreaRatio > 0.5, `canvas should dominate, got ${r.canvasAreaRatio}`);
  assert.ok(r.pageHeightPx > 0);
});
