# df-design Prober Implementation Plan (Plan 1 of 3)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `scripts/probe.mjs` — a re-runnable prober that turns a URL into a validated capture bundle containing static measurements, motion traces, frames, and a contact sheet.

**Architecture:** A thin CLI orchestrator over pure, independently-testable modules. Browser-dependent code (static pass, motion pass) returns plain objects; classification and validation are pure functions over those objects and need no browser. Tests run against local HTML fixtures served by an ephemeral `node:http` server, so the suite is hermetic — no network, no real sites.

**Tech Stack:** Node 24 (ESM), Playwright (`playwright` package, Chromium), `node:test` + `node:assert/strict` as the test runner (built in — no test dependency).

**Spec:** `docs/superpowers/specs/2026-09-16-df-design-learning-loop-design.md`

## Global Constraints

- Node >= 22, ESM only (`"type": "module"`). No TypeScript, no build step.
- Playwright only. Do NOT add Puppeteer — the skill's `references/verification.md` already imports `@playwright/test`. Spec §6.1.
- No image-processing dependency. The contact sheet is rendered by the browser we already have. Spec §7.8.
- Windows launch hardening is mandatory: try `channel: 'chrome'` first on `win32`, fall back to bundled Chromium, and if the fallback also fails surface the original channel error as `cause`. Spec §6.1.
- Every probe runs the page **twice**: `reducedMotion: 'no-preference'` (motion pass) and `reducedMotion: 'reduce'` (contract pass). Spec §6.2.
- **A parse failure produces a quarantined record with its raw capture attached. It never produces a deletion.** Spec §8.
- Unreachable cross-origin data is recorded as `unknown`, never as absent/zero. Spec §6.5.
- Viewport is 1440x900 for every capture, matching the existing corpus.
- Commit after every task. Conventional commit prefixes (`feat:`, `test:`, `chore:`).

---

### Task 1: Project scaffold, fixture server, and browser launch

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `scripts/lib/browser.mjs`
- Create: `test/helpers/fixture-server.mjs`
- Create: `test/fixtures/static-basic.html`
- Test: `test/browser.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `launchBrowser({ headless = true }) -> Promise<Browser>` (Playwright Browser)
  - `newPage(browser, { reducedMotion = 'no-preference', viewport = { width: 1440, height: 900 } }) -> Promise<{ page, context }>`
  - `startFixtureServer(dir) -> Promise<{ url, close }>` where `url` is like `http://127.0.0.1:PORT`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "df-design",
  "version": "0.2.0",
  "type": "module",
  "private": true,
  "engines": { "node": ">=22" },
  "scripts": {
    "test": "node --test test/",
    "probe": "node scripts/probe.mjs"
  },
  "dependencies": {
    "playwright": "^1.48.0"
  }
}
```

- [ ] **Step 2: Create `.gitignore`**

```
node_modules/
captures/
candidates/
.claude-flow/
*.log
```

Note: `captures/` is generated output and must not be committed — bundles contain
screenshots and can be large. `.claude-flow/` is unrelated tooling that has
appeared in this directory.

- [ ] **Step 3: Install dependencies**

Run: `npm install && npx playwright install chromium`
Expected: exits 0; `node_modules/playwright` exists.

- [ ] **Step 4: Create `test/fixtures/static-basic.html`**

```html
<!doctype html>
<html><head><meta charset="utf-8"><title>Static Basic</title>
<style>
  body { margin: 0; background: rgb(12, 14, 18); color: rgb(240, 240, 240);
         font-family: Georgia, serif; }
  h1 { font-size: 72px; letter-spacing: -0.03em; margin: 0; padding: 80px 40px; }
  .cta { border-radius: 6px; padding: 12px 20px; background: rgb(83, 58, 253); }
  section { min-height: 700px; padding: 40px; }
  #band-b { background: rgb(240, 238, 232); color: rgb(20, 20, 20); }
</style></head>
<body>
  <h1>Measured, not asserted</h1>
  <button class="cta">Start</button>
  <section id="band-a">Band A</section>
  <section id="band-b">Band B</section>
</body></html>
```

- [ ] **Step 5: Create `test/helpers/fixture-server.mjs`**

```js
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };

export async function startFixtureServer(dir) {
  const server = http.createServer(async (req, res) => {
    const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '');
    try {
      const body = await fs.readFile(path.join(dir, rel));
      res.writeHead(200, { 'content-type': TYPES[path.extname(rel)] ?? 'application/octet-stream' });
      res.end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address();
  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise((r) => server.close(r)),
  };
}
```

- [ ] **Step 6: Write the failing test**

Create `test/browser.test.mjs`:

```js
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
```

- [ ] **Step 7: Run test to verify it fails**

Run: `node --test test/browser.test.mjs`
Expected: FAIL — `Cannot find module '../scripts/lib/browser.mjs'`

- [ ] **Step 8: Write `scripts/lib/browser.mjs`**

```js
import { chromium } from 'playwright';

export const VIEWPORT = { width: 1440, height: 900 };

// On Windows the bundled Chromium launches from a user-writable cache directory,
// whose GPU process can be denied by security software — Chrome then crash-loops
// the GPU process and flashes compositor surfaces. The system-installed Chrome
// runs from a trusted location. Try it first, keep the error if it fails, and
// surface it as the cause if the bundled fallback fails too, so the real failure
// is never lost. (Ported from the impeccable skill's browser detector.)
export async function launchBrowser({ headless = true, args = [] } = {}) {
  let channelError;
  if (process.platform === 'win32') {
    try {
      return await chromium.launch({ channel: 'chrome', headless, args });
    } catch (err) {
      channelError = err;
    }
  }
  try {
    return await chromium.launch({ headless, args });
  } catch (err) {
    if (channelError && err.cause === undefined) err.cause = channelError;
    throw err;
  }
}

export async function newPage(browser, {
  reducedMotion = 'no-preference',
  viewport = VIEWPORT,
  recordVideoDir,
} = {}) {
  const context = await browser.newContext({
    viewport,
    reducedMotion,
    ...(recordVideoDir ? { recordVideo: { dir: recordVideoDir, size: viewport } } : {}),
  });
  const page = await context.newPage();
  return { page, context };
}

export async function settle(page, { timeout = 15000, quiet = 1200 } = {}) {
  await page.waitForLoadState('load', { timeout }).catch(() => {});
  await page.waitForLoadState('networkidle', { timeout }).catch(() => {});
  await page.evaluate(() => document.fonts?.ready).catch(() => {});
  await page.waitForTimeout(quiet);
}
```

- [ ] **Step 9: Run test to verify it passes**

Run: `node --test test/browser.test.mjs`
Expected: PASS — 2 tests.

- [ ] **Step 10: Commit**

```bash
git add package.json .gitignore scripts/lib/browser.mjs test/
git commit -m "feat: project scaffold, fixture server, hardened browser launch"
```

---

### Task 2: Archetype classifier (pure)

Spec §8. The classifier decides what kind of opening a page has. `none` and `novel` are legitimate, informative outcomes — never reasons to drop a record.

**Files:**
- Create: `scripts/lib/archetype.mjs`
- Test: `test/archetype.test.mjs`

**Interfaces:**
- Consumes: nothing (pure function over a plain object).
- Produces: `classifyArchetype(signals) -> { archetype, reason }` where `archetype` is one of `'typographic' | 'media-stage' | 'canvas' | 'interactive-demo' | 'editorial' | 'none' | 'novel'`.
  `signals` shape:
  ```js
  {
    hero: { fontSizePx: number, tag: string, textLength: number } | null,
    canvasAreaRatio: number,   // largest canvas area / first-viewport area, 0..1
    webgl: boolean,
    videoAreaRatio: number,
    firstViewportTextLength: number,
    sectionCount: number,
    animatedElementCount: number,
  }
  ```

- [ ] **Step 1: Write the failing test**

Create `test/archetype.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyArchetype } from '../scripts/lib/archetype.mjs';

const base = {
  hero: null, canvasAreaRatio: 0, webgl: false, videoAreaRatio: 0,
  firstViewportTextLength: 200, sectionCount: 6, animatedElementCount: 0,
};

test('a large heading is typographic', () => {
  const r = classifyArchetype({ ...base, hero: { fontSizePx: 72, tag: 'h1', textLength: 24 } });
  assert.equal(r.archetype, 'typographic');
});

test('a dominant canvas wins over a heading', () => {
  const r = classifyArchetype({
    ...base, canvasAreaRatio: 0.7, webgl: true,
    hero: { fontSizePx: 64, tag: 'h1', textLength: 20 },
  });
  assert.equal(r.archetype, 'canvas');
});

test('a heroless animated page is canvas, not a dropped record', () => {
  const r = classifyArchetype({
    ...base, hero: null, canvasAreaRatio: 0.9, webgl: true,
    firstViewportTextLength: 30, animatedElementCount: 40,
  });
  assert.equal(r.archetype, 'canvas');
  assert.ok(r.reason.length > 0);
});

test('a dominant video with a small heading is a media stage', () => {
  const r = classifyArchetype({
    ...base, videoAreaRatio: 0.55,
    hero: { fontSizePx: 32, tag: 'h1', textLength: 40 },
  });
  assert.equal(r.archetype, 'media-stage');
});

test('heavy motion with little text is an interactive demo', () => {
  const r = classifyArchetype({
    ...base, hero: null, firstViewportTextLength: 40, animatedElementCount: 60,
  });
  assert.equal(r.archetype, 'interactive-demo');
});

test('long text across many sections with a small heading is editorial', () => {
  const r = classifyArchetype({
    ...base, hero: { fontSizePx: 30, tag: 'h1', textLength: 60 },
    firstViewportTextLength: 1800, sectionCount: 14,
  });
  assert.equal(r.archetype, 'editorial');
});

test('a plain page with no opening statement is none, not novel', () => {
  const r = classifyArchetype({ ...base, hero: null, firstViewportTextLength: 300 });
  assert.equal(r.archetype, 'none');
});

test('nothing measurable at all is novel', () => {
  const r = classifyArchetype({
    ...base, hero: null, firstViewportTextLength: 0, sectionCount: 0,
  });
  assert.equal(r.archetype, 'novel');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/archetype.test.mjs`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `scripts/lib/archetype.mjs`**

```js
export const ARCHETYPES = [
  'typographic', 'media-stage', 'canvas', 'interactive-demo', 'editorial', 'none', 'novel',
];

const HERO_MIN_PX = 40;
const DOMINANT_AREA = 0.45;
const HEAVY_MOTION = 25;
const SPARSE_TEXT = 120;
const LONG_TEXT = 1200;
const MANY_SECTIONS = 10;

// Order matters: a dominant visual stage outranks whatever type sits on top of it.
export function classifyArchetype(s) {
  const hero = s.hero ?? null;

  if (s.webgl || s.canvasAreaRatio >= DOMINANT_AREA) {
    return { archetype: 'canvas', reason: s.webgl
      ? 'WebGL context present'
      : `canvas covers ${(s.canvasAreaRatio * 100).toFixed(0)}% of the first viewport` };
  }

  if (s.videoAreaRatio >= DOMINANT_AREA && (!hero || hero.fontSizePx < HERO_MIN_PX)) {
    return { archetype: 'media-stage', reason: 'video dominates the opening, type is secondary' };
  }

  if (hero && hero.fontSizePx >= HERO_MIN_PX) {
    if (s.firstViewportTextLength >= LONG_TEXT && s.sectionCount >= MANY_SECTIONS) {
      return { archetype: 'editorial', reason: 'large type but long running text across many sections' };
    }
    return { archetype: 'typographic', reason: `opening statement at ${hero.fontSizePx}px` };
  }

  if (s.animatedElementCount >= HEAVY_MOTION && s.firstViewportTextLength < SPARSE_TEXT) {
    return { archetype: 'interactive-demo', reason: 'heavy motion, sparse text, no opening statement' };
  }

  if (s.firstViewportTextLength >= LONG_TEXT && s.sectionCount >= MANY_SECTIONS) {
    return { archetype: 'editorial', reason: 'long running text across many sections' };
  }

  if (s.firstViewportTextLength > 0 || s.sectionCount > 0) {
    return { archetype: 'none', reason: 'page renders, but has no identifiable opening statement' };
  }

  // Nothing matched and nothing measurable. This is the interesting case:
  // richer capture and the quarantine queue, never a deletion. Spec §8.
  return { archetype: 'novel', reason: 'no known archetype matched; capture retained for schema review' };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/archetype.test.mjs`
Expected: PASS — 8 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/archetype.mjs test/archetype.test.mjs
git commit -m "feat: archetype classifier treating none/novel as outcomes, not failures"
```

---

### Task 3: Validator and quarantine (pure)

Spec §8. Every range check quarantines rather than publishes, and quarantining never removes the record.

**Files:**
- Create: `scripts/lib/validate.mjs`
- Test: `test/validate.test.mjs`

**Interfaces:**
- Consumes: nothing (pure).
- Produces: `validateRecord(raw) -> { record, quarantine }`
  - `record`: the raw object minus quarantined fields, plus `normalised` values where a rule normalises rather than rejects.
  - `quarantine`: `Array<{ field: string, value: unknown, reason: string }>`

- [ ] **Step 1: Write the failing test**

Create `test/validate.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRecord } from '../scripts/lib/validate.mjs';

const ok = {
  site: 'example.com',
  pageHeightPx: 9329,
  viewportHeightPx: 900,
  lazySignals: false,
  ctaRadiusPx: 6,
  ctaSmallerDimPx: 44,
  groundColor: 'rgb(12, 14, 18)',
  fontFaceCount: 5,
  renderedTextLength: 4000,
  hero: { fontSizePx: 64, tag: 'h1', textLength: 20 },
};

test('a clean record passes with an empty quarantine', () => {
  const { record, quarantine } = validateRecord(ok);
  assert.equal(quarantine.length, 0);
  assert.equal(record.pageHeightPx, 9329);
});

test('a short page height on a lazy-loading site is quarantined', () => {
  const { record, quarantine } = validateRecord({ ...ok, pageHeightPx: 900, lazySignals: true });
  assert.equal(record.pageHeightPx, undefined);
  assert.equal(quarantine.length, 1);
  assert.equal(quarantine[0].field, 'pageHeightPx');
});

test('a short page height WITHOUT lazy signals is kept', () => {
  const { record, quarantine } = validateRecord({ ...ok, pageHeightPx: 900, lazySignals: false });
  assert.equal(record.pageHeightPx, 900);
  assert.equal(quarantine.length, 0);
});

test('an absurd radius that resolves to a pill is normalised, not rejected', () => {
  const { record, quarantine } = validateRecord({ ...ok, ctaRadiusPx: 33554432, ctaSmallerDimPx: 44 });
  assert.equal(record.ctaRadius, 'pill');
  assert.equal(quarantine.length, 0);
});

test('an absurd radius that is not a pill is quarantined', () => {
  const { record, quarantine } = validateRecord({ ...ok, ctaRadiusPx: 900, ctaSmallerDimPx: 4000 });
  assert.equal(record.ctaRadiusPx, undefined);
  assert.equal(quarantine[0].field, 'ctaRadiusPx');
});

test('a fully transparent ground is quarantined', () => {
  const { record, quarantine } = validateRecord({ ...ok, groundColor: 'rgba(0, 0, 0, 0)' });
  assert.equal(record.groundColor, undefined);
  assert.equal(quarantine[0].field, 'groundColor');
});

test('zero font faces on a page that rendered text is quarantined', () => {
  const { quarantine } = validateRecord({ ...ok, fontFaceCount: 0, renderedTextLength: 4000 });
  assert.equal(quarantine[0].field, 'fontFaceCount');
});

test('an absent hero is legal and never quarantined', () => {
  const { record, quarantine } = validateRecord({ ...ok, hero: null });
  assert.equal(quarantine.length, 0);
  assert.equal(record.hero, null);
});

test('quarantining never removes the record itself', () => {
  const { record } = validateRecord({
    ...ok, pageHeightPx: 100, lazySignals: true, groundColor: 'rgba(0, 0, 0, 0)', fontFaceCount: 0,
  });
  assert.equal(record.site, 'example.com');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/validate.test.mjs`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `scripts/lib/validate.mjs`**

```js
const MAX_PLAUSIBLE_RADIUS_PX = 200;

function isTransparent(color) {
  if (typeof color !== 'string') return false;
  const m = color.match(/rgba?\(([^)]+)\)/i);
  if (!m) return false;
  const parts = m[1].split(',').map((p) => parseFloat(p.trim()));
  return parts.length === 4 && parts[3] === 0;
}

// Reports and separates. It never deletes a record — a quarantined field is
// removed from `record` and preserved in `quarantine` with its reason, so the
// raw capture stays the authority. Spec §8.
export function validateRecord(raw) {
  const record = { ...raw };
  const quarantine = [];
  const reject = (field, reason) => {
    quarantine.push({ field, value: raw[field], reason });
    delete record[field];
  };

  if (typeof raw.pageHeightPx === 'number' && typeof raw.viewportHeightPx === 'number') {
    if (raw.lazySignals && raw.pageHeightPx < raw.viewportHeightPx * 1.5) {
      reject('pageHeightPx',
        'page reports lazy-loading sentinels but measured under 1.5x viewport; re-probe with a scroll-to-bottom settle');
    }
  }

  if (typeof raw.ctaRadiusPx === 'number' && raw.ctaRadiusPx > MAX_PLAUSIBLE_RADIUS_PX) {
    const half = (raw.ctaSmallerDimPx ?? 0) / 2;
    if (half > 0 && raw.ctaRadiusPx >= half) {
      record.ctaRadius = 'pill';
      delete record.ctaRadiusPx;
    } else {
      reject('ctaRadiusPx', `radius ${raw.ctaRadiusPx}px exceeds ${MAX_PLAUSIBLE_RADIUS_PX}px and does not resolve to a pill`);
    }
  }

  if (isTransparent(raw.groundColor)) {
    reject('groundColor', 'ground sampled as fully transparent; the sampler must walk to a painted ancestor');
  }

  if (raw.fontFaceCount === 0 && (raw.renderedTextLength ?? 0) > 0) {
    reject('fontFaceCount', 'page rendered text but reported zero loaded faces');
  }

  // An absent hero is a measurement, not a failure. Spec §8.
  return { record, quarantine };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/validate.test.mjs`
Expected: PASS — 9 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/validate.mjs test/validate.test.mjs
git commit -m "feat: validator that quarantines implausible fields without dropping records"
```

---

### Task 4: Static pass

Spec §6.4, §6.5. Archetype-aware type measurement (largest text in the first viewport, never "the h1"), palette sampled from painted ancestors, fonts with provenance, section rhythm, feature counts.

**Files:**
- Create: `scripts/lib/static-pass.mjs`
- Create: `test/fixtures/heroless-canvas.html`
- Test: `test/static-pass.test.mjs`

**Interfaces:**
- Consumes: `newPage`, `settle` from `scripts/lib/browser.mjs`.
- Produces: `runStaticPass(page) -> Promise<StaticResult>` where `StaticResult` is:
  ```js
  {
    hero: { fontSizePx, letterSpacingEm, tag, textLength, centred } | null,
    firstViewportTextLength: number,
    groundColor: string,
    accentColor: string | 'unknown',
    ctaRadiusPx: number | null,
    ctaSmallerDimPx: number | null,
    fontFaceCount: number,
    fontFamilies: string[],
    renderedTextLength: number,
    pageHeightPx: number,
    viewportHeightPx: number,
    lazySignals: boolean,
    sectionCount: number,
    groundChanges: number,
    stickyCount: number,
    features: { mask, clip, blend, canvas, video, webgl },
    canvasAreaRatio: number,
    videoAreaRatio: number,
    reducedMotionRules: number | 'unknown',
  }
  ```

- [ ] **Step 1: Create `test/fixtures/heroless-canvas.html`**

This is the fixture that stands in for a mostly-animated, heroless page (spec §14 test 6).

```html
<!doctype html>
<html><head><meta charset="utf-8"><title>Heroless Canvas</title>
<style>
  body { margin: 0; background: rgb(6, 6, 10); }
  canvas { display: block; width: 100vw; height: 100vh; }
  .tag { position: fixed; bottom: 16px; left: 16px; color: #888; font-size: 12px; }
</style></head>
<body>
  <canvas id="stage" width="1440" height="900"></canvas>
  <div class="tag">no heading anywhere</div>
  <script>
    const ctx = document.getElementById('stage').getContext('2d');
    let t = 0;
    (function loop() {
      t += 0.02;
      ctx.fillStyle = 'rgb(6,6,10)'; ctx.fillRect(0, 0, 1440, 900);
      ctx.fillStyle = 'rgb(39,247,149)';
      ctx.fillRect(700 + Math.sin(t) * 200, 420, 40, 40);
      requestAnimationFrame(loop);
    })();
  </script>
</body></html>
```

- [ ] **Step 2: Write the failing test**

Create `test/static-pass.test.mjs`:

```js
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

test('a heroless page yields hero: null and is still fully measured', async () => {
  const r = await probe('heroless-canvas.html');
  assert.equal(r.hero, null);
  assert.equal(r.features.canvas, 1);
  assert.ok(r.canvasAreaRatio > 0.5, `canvas should dominate, got ${r.canvasAreaRatio}`);
  assert.ok(r.pageHeightPx > 0);
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `node --test test/static-pass.test.mjs`
Expected: FAIL — module not found.

- [ ] **Step 4: Write `scripts/lib/static-pass.mjs`**

```js
export async function runStaticPass(page) {
  return page.evaluate(() => {
    const vw = innerWidth, vh = innerHeight;

    const inFirstViewport = (el) => {
      const r = el.getBoundingClientRect();
      return r.top < vh && r.bottom > 0 && r.width > 0 && r.height > 0;
    };

    // Largest RENDERED text in the first viewport, whatever element holds it.
    // Never "the h1" — that assumption dropped two sites from the original corpus.
    let hero = null;
    let best = 0;
    for (const el of document.body.querySelectorAll('*')) {
      const text = (el.textContent ?? '').trim();
      if (!text || el.children.length > 0) continue;
      if (!inFirstViewport(el)) continue;
      const cs = getComputedStyle(el);
      const size = parseFloat(cs.fontSize) || 0;
      if (size > best) {
        best = size;
        const ls = cs.letterSpacing;
        const r = el.getBoundingClientRect();
        hero = {
          fontSizePx: size,
          letterSpacingEm: ls === 'normal' ? 0 : (parseFloat(ls) || 0) / size,
          tag: el.tagName.toLowerCase(),
          textLength: text.length,
          centred: Math.abs((r.left + r.right) / 2 - vw / 2) < vw * 0.06,
        };
      }
    }
    // Below a plain paragraph size there is no "opening statement" to speak of.
    if (hero && hero.fontSizePx < 20) hero = null;

    // Walk to the first painted ancestor. Sampling the element itself is what
    // produced the transparent grounds in the original corpus.
    const paintedGround = (start) => {
      let el = start;
      while (el) {
        const bg = getComputedStyle(el).backgroundColor;
        const m = bg.match(/rgba?\(([^)]+)\)/i);
        if (m) {
          const p = m[1].split(',').map((x) => parseFloat(x));
          if (!(p.length === 4 && p[3] === 0)) return bg;
        }
        el = el.parentElement;
      }
      return getComputedStyle(document.documentElement).backgroundColor;
    };

    const areaRatio = (sel) => {
      let max = 0;
      for (const el of document.querySelectorAll(sel)) {
        const r = el.getBoundingClientRect();
        max = Math.max(max, (r.width * r.height) / (vw * vh));
      }
      return Math.min(max, 1);
    };

    const countBy = (fn) => [...document.querySelectorAll('body *')].filter(fn).length;
    const cs = (el) => getComputedStyle(el);

    const sections = [...document.querySelectorAll('section, main > div, body > div')]
      .filter((el) => el.getBoundingClientRect().height > vh * 0.25);
    const grounds = sections.map((el) => paintedGround(el));
    const groundChanges = grounds.filter((g, i) => i > 0 && g !== grounds[i - 1]).length;

    const cta = document.querySelector('button, a[class*="cta"], [class*="cta"], a[role="button"]');
    const ctaRect = cta?.getBoundingClientRect();

    let webgl = false;
    for (const c of document.querySelectorAll('canvas')) {
      try {
        if (c.getContext('webgl2') || c.getContext('webgl')) webgl = true;
      } catch { /* context already claimed with different attrs */ }
    }

    // Cross-origin sheets throw on cssRules. Record 'unknown', never 0 — a floor
    // published as a count is how the original corpus understated this. Spec §6.5.
    let reducedMotionRules = 0;
    let sheetBlocked = false;
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.media?.mediaText?.includes('prefers-reduced-motion')) reducedMotionRules += 1;
        }
      } catch { sheetBlocked = true; }
    }

    const families = new Set();
    for (const f of document.fonts) families.add(f.family);

    const bodyText = (document.body.innerText ?? '');
    const firstViewportText = [...document.body.querySelectorAll('*')]
      .filter((el) => el.children.length === 0 && inFirstViewport(el))
      .map((el) => (el.textContent ?? '').trim()).join(' ');

    return {
      hero,
      firstViewportTextLength: firstViewportText.length,
      groundColor: paintedGround(document.body),
      accentColor: cta ? cs(cta).backgroundColor : 'unknown',
      ctaRadiusPx: cta ? parseFloat(cs(cta).borderTopLeftRadius) || 0 : null,
      ctaSmallerDimPx: ctaRect ? Math.min(ctaRect.width, ctaRect.height) : null,
      fontFaceCount: families.size,
      fontFamilies: [...families],
      renderedTextLength: bodyText.length,
      pageHeightPx: document.documentElement.scrollHeight,
      viewportHeightPx: vh,
      lazySignals: /lazy|IntersectionObserver|data-src/i.test(document.documentElement.outerHTML.slice(0, 200000)),
      sectionCount: sections.length,
      groundChanges,
      stickyCount: countBy((el) => cs(el).position === 'sticky'),
      features: {
        mask: countBy((el) => cs(el).maskImage !== 'none' && cs(el).maskImage !== ''),
        clip: countBy((el) => cs(el).clipPath !== 'none'),
        blend: countBy((el) => cs(el).mixBlendMode !== 'normal'),
        canvas: document.querySelectorAll('canvas').length,
        video: document.querySelectorAll('video').length,
        webgl,
      },
      canvasAreaRatio: areaRatio('canvas'),
      videoAreaRatio: areaRatio('video'),
      reducedMotionRules: sheetBlocked ? 'unknown' : reducedMotionRules,
    };
  });
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node --test test/static-pass.test.mjs`
Expected: PASS — 4 tests.

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/static-pass.mjs test/static-pass.test.mjs test/fixtures/heroless-canvas.html
git commit -m "feat: archetype-aware static pass with painted-ancestor ground sampling"
```

---

### Task 5: Animation inventory and keyframe extraction

Spec §7.1, §7.2. Ground truth for CSS and WAAPI motion.

**Files:**
- Create: `scripts/lib/motion-inventory.mjs`
- Create: `test/fixtures/css-motion.html`
- Test: `test/motion-inventory.test.mjs`

**Interfaces:**
- Consumes: `newPage`, `settle`.
- Produces: `runInventory(page) -> Promise<{ animations, keyframes, blockedSheets }>`
  - `animations`: `Array<{ selector, kind: 'css'|'transition'|'waapi', name, durationMs, delayMs, easing, iterations, playState }>`
  - `keyframes`: `Record<string, Array<{ offset, properties }>>`
  - `blockedSheets`: `number` — count of sheets that threw on `cssRules`

- [ ] **Step 1: Create `test/fixtures/css-motion.html`**

```html
<!doctype html>
<html><head><meta charset="utf-8"><title>CSS Motion</title>
<style>
  body { margin: 0; background: #0b0d12; }
  @keyframes dot-pulse { 0% { opacity: 0.3 } 50% { opacity: 1 } 100% { opacity: 0.3 } }
  .dot {
    width: 8px; height: 8px; border-radius: 50%; background: #5e6ad2;
    animation: dot-pulse 7s cubic-bezier(0.25, 1, 0.5, 1) infinite;
  }
  .card { transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1); }
</style></head>
<body>
  <div class="dot" id="dot"></div>
  <div class="card" id="card">card</div>
</body></html>
```

- [ ] **Step 2: Write the failing test**

Create `test/motion-inventory.test.mjs`:

```js
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

    assert.ok(keyframes['dot-pulse'], 'keyframe body not extracted');
    assert.equal(keyframes['dot-pulse'].length, 3);
    assert.equal(keyframes['dot-pulse'][1].properties.opacity, '1');
  } finally {
    await browser.close();
    await server.close();
  }
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `node --test test/motion-inventory.test.mjs`
Expected: FAIL — module not found.

- [ ] **Step 4: Write `scripts/lib/motion-inventory.mjs`**

```js
export async function runInventory(page) {
  return page.evaluate(() => {
    const selectorFor = (el) => {
      if (!el || !el.tagName) return 'unknown';
      if (el.id) return `#${el.id}`;
      const cls = (el.className && typeof el.className === 'string')
        ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
      return `${el.tagName.toLowerCase()}${cls}`;
    };

    const animations = [];
    for (const a of document.getAnimations()) {
      const t = a.effect?.getTiming?.() ?? {};
      const target = a.effect?.target;
      const isTransition = typeof a.transitionProperty === 'string';
      animations.push({
        selector: selectorFor(target),
        kind: isTransition ? 'transition' : (a.animationName ? 'css' : 'waapi'),
        name: a.animationName ?? a.transitionProperty ?? null,
        durationMs: typeof t.duration === 'number' ? t.duration : null,
        delayMs: t.delay ?? 0,
        easing: t.easing ?? null,
        // Infinity does not survive JSON. null means "runs forever".
        iterations: t.iterations === Infinity ? null : (t.iterations ?? 1),
        playState: a.playState,
      });
    }

    const keyframes = {};
    let blockedSheets = 0;
    for (const sheet of document.styleSheets) {
      let rules;
      try { rules = sheet.cssRules; } catch { blockedSheets += 1; continue; }
      for (const rule of rules) {
        if (rule.type !== CSSRule.KEYFRAMES_RULE && !(rule instanceof CSSKeyframesRule)) continue;
        keyframes[rule.name] = [...rule.cssRules].map((kf) => {
          const properties = {};
          for (const prop of kf.style) properties[prop] = kf.style.getPropertyValue(prop).trim();
          return { offset: kf.keyText, properties };
        });
      }
    }

    return { animations, keyframes, blockedSheets };
  });
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node --test test/motion-inventory.test.mjs`
Expected: PASS — 1 test.

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/motion-inventory.mjs test/motion-inventory.test.mjs test/fixtures/css-motion.html
git commit -m "feat: animation inventory and keyframe extraction with blocked-sheet accounting"
```

---

### Task 6: Property trace — the channel that catches library motion

Spec §7.3. **This is the task that justifies the whole motion pass.** GSAP and similar libraries write inline styles from their own ticker and create no WAAPI animations, so `document.getAnimations()` returns nothing for them. The fixture deliberately animates via `requestAnimationFrame` + inline style, exactly as GSAP does, and the test asserts the inventory finds nothing while the trace still catches the motion.

**Files:**
- Create: `scripts/lib/property-trace.mjs`
- Create: `test/fixtures/raf-motion.html`
- Test: `test/property-trace.test.mjs`

**Interfaces:**
- Consumes: `newPage`, `settle`; `runInventory` (for the contrast assertion in the test only).
- Produces: `runPropertyTrace(page, { selectors, samples = 60, durationMs = 2000 }) -> Promise<Trace>` where
  ```js
  Trace = { samples: number, intervalMs: number,
            elements: Array<{ selector, series: Array<{ t, transform, opacity, filter, clipPath }> , moved: boolean }> }
  ```
  `moved` is true when any sampled property changed across the series.

- [ ] **Step 1: Create `test/fixtures/raf-motion.html`**

```html
<!doctype html>
<html><head><meta charset="utf-8"><title>rAF Motion</title>
<style>body { margin: 0; background: #0b0d12; } #mover { width: 60px; height: 60px; background: #27f795; }</style>
</head>
<body>
  <div id="mover"></div>
  <script>
    // Deliberately NOT a CSS animation and NOT the Web Animations API.
    // This is the shape GSAP uses: its own ticker writing inline styles.
    const el = document.getElementById('mover');
    let t = 0;
    (function tick() {
      t += 0.05;
      el.style.transform = `translateX(${Math.sin(t) * 300}px)`;
      el.style.opacity = String(0.5 + Math.sin(t) * 0.5);
      requestAnimationFrame(tick);
    })();
  </script>
</body></html>
```

- [ ] **Step 2: Write the failing test**

Create `test/property-trace.test.mjs`:

```js
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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `node --test test/property-trace.test.mjs`
Expected: FAIL — module not found.

- [ ] **Step 4: Write `scripts/lib/property-trace.mjs`**

```js
const TRACKED = ['transform', 'opacity', 'filter', 'clipPath', 'backgroundPosition', 'maskPosition'];

export async function runPropertyTrace(page, { selectors, samples = 60, durationMs = 2000 } = {}) {
  return page.evaluate(
    async ({ selectors, samples, durationMs, TRACKED }) => {
      const interval = durationMs / samples;
      const targets = selectors
        .map((sel) => ({ sel, el: document.querySelector(sel) }))
        .filter((t) => t.el);

      const series = new Map(targets.map((t) => [t.sel, []]));
      const start = performance.now();

      for (let i = 0; i < samples; i += 1) {
        const t = performance.now() - start;
        for (const { sel, el } of targets) {
          const cs = getComputedStyle(el);
          const frame = { t: Math.round(t) };
          for (const prop of TRACKED) frame[prop] = cs[prop];
          series.get(sel).push(frame);
        }
        await new Promise((r) => setTimeout(r, interval));
      }

      const elements = [...series.entries()].map(([selector, frames]) => {
        const moved = TRACKED.some((prop) => new Set(frames.map((f) => f[prop])).size > 1);
        return { selector, series: frames, moved };
      });

      return { samples, intervalMs: interval, elements };
    },
    { selectors, samples, durationMs, TRACKED },
  );
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node --test test/property-trace.test.mjs`
Expected: PASS — 1 test.

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/property-trace.mjs test/property-trace.test.mjs test/fixtures/raf-motion.html
git commit -m "feat: property trace catching ticker-driven motion the animation API cannot see"
```

---

### Task 7: Scroll trace

Spec §7.4, §6.5. Reconstructs the scroll-to-property mapping. When a smooth-scroll library hijacks scrolling and the page will not move, the trace records itself as **unavailable** rather than emitting a flat series that reads as "no scroll-linked motion".

**Files:**
- Create: `scripts/lib/scroll-trace.mjs`
- Create: `test/fixtures/scroll-linked.html`
- Create: `test/fixtures/scroll-locked.html`
- Test: `test/scroll-trace.test.mjs`

**Interfaces:**
- Consumes: `newPage`, `settle`.
- Produces: `runScrollTrace(page, { selectors, steps = 24 }) -> Promise<ScrollTrace>` where
  ```js
  ScrollTrace = { available: boolean, reason?: string, steps: number,
                  series: Array<{ scrollY, progress, values: Record<selector, { transform, opacity }> }> }
  ```

- [ ] **Step 1: Create the two fixtures**

`test/fixtures/scroll-linked.html`:

```html
<!doctype html>
<html><head><meta charset="utf-8"><title>Scroll Linked</title>
<style>
  body { margin: 0; height: 4000px; background: #0b0d12; }
  #bar { position: fixed; top: 0; left: 0; height: 4px; width: 100vw;
         background: #27f795; transform-origin: 0 50%; transform: scaleX(0); }
</style></head>
<body>
  <div id="bar"></div>
  <script>
    const bar = document.getElementById('bar');
    addEventListener('scroll', () => {
      const p = scrollY / (document.body.scrollHeight - innerHeight);
      bar.style.transform = `scaleX(${p})`;
    }, { passive: true });
  </script>
</body></html>
```

`test/fixtures/scroll-locked.html` — stands in for a smooth-scroll library that swallows programmatic scrolling:

```html
<!doctype html>
<html><head><meta charset="utf-8"><title>Scroll Locked</title>
<style>body { margin: 0; height: 4000px; overflow: hidden; background: #0b0d12; }
#bar { position: fixed; top: 0; height: 4px; width: 100vw; background: #f50; }</style></head>
<body>
  <div id="bar"></div>
  <script>
    // Hijacks scrolling the way Lenis/Locomotive do: the document never moves.
    addEventListener('scroll', () => { window.scrollTo(0, 0); }, { passive: true });
  </script>
</body></html>
```

- [ ] **Step 2: Write the failing test**

Create `test/scroll-trace.test.mjs`:

```js
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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `node --test test/scroll-trace.test.mjs`
Expected: FAIL — module not found.

- [ ] **Step 4: Write `scripts/lib/scroll-trace.mjs`**

```js
export async function runScrollTrace(page, { selectors, steps = 24 } = {}) {
  const max = await page.evaluate(
    () => document.documentElement.scrollHeight - innerHeight,
  );

  if (max <= 0) {
    return { available: false, reason: 'page is not scrollable', steps: 0, series: [] };
  }

  // Probe first: if driving scroll does not move the document, a smooth-scroll
  // library owns it. Emitting a flat series here would read as "no scroll-linked
  // motion", which is the opposite of the truth. Spec §6.5.
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(max / 2));
  await page.waitForTimeout(250);
  const moved = await page.evaluate(() => window.scrollY);
  if (moved < 1) {
    await page.evaluate(() => window.scrollTo(0, 0));
    return {
      available: false,
      reason: 'programmatic scroll did not move the document; a smooth-scroll library likely owns scrolling',
      steps: 0,
      series: [],
    };
  }

  const series = [];
  for (let i = 0; i < steps; i += 1) {
    const target = Math.round((max * i) / Math.max(steps - 1, 1));
    await page.evaluate((y) => window.scrollTo(0, y), target);
    await page.waitForTimeout(120);
    series.push(await page.evaluate((sels) => {
      const values = {};
      for (const sel of sels) {
        const el = document.querySelector(sel);
        if (!el) continue;
        const cs = getComputedStyle(el);
        values[sel] = { transform: cs.transform, opacity: cs.opacity };
      }
      const denom = document.documentElement.scrollHeight - innerHeight;
      return { scrollY: window.scrollY, progress: denom > 0 ? window.scrollY / denom : 0, values };
    }, selectors));
  }

  await page.evaluate(() => window.scrollTo(0, 0));
  return { available: true, steps, series };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node --test test/scroll-trace.test.mjs`
Expected: PASS — 2 tests.

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/scroll-trace.mjs test/scroll-trace.test.mjs test/fixtures/scroll-linked.html test/fixtures/scroll-locked.html
git commit -m "feat: scroll trace that reports unavailability instead of faking a flat series"
```

---

### Task 8: Capture bundle and contact sheet

Spec §6.3, §7.8. The contact sheet is rendered by the browser we already have — no image dependency.

**Files:**
- Create: `scripts/lib/bundle.mjs`
- Test: `test/bundle.test.mjs`

**Interfaces:**
- Consumes: `launchBrowser`, `newPage`.
- Produces:
  - `bundleDir(root, site, date) -> string`
  - `writeBundle(dir, { record, raw, motion, frames }) -> Promise<{ dir, files }>` where `frames` is `Array<{ name, buffer }>`
  - `renderContactSheet(browser, frames, outPath) -> Promise<string>`

- [ ] **Step 1: Write the failing test**

Create `test/bundle.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { launchBrowser, newPage } from '../scripts/lib/browser.mjs';
import { bundleDir, writeBundle, renderContactSheet } from '../scripts/lib/bundle.mjs';

test('bundleDir composes captures/<site>/<date>', () => {
  assert.equal(bundleDir('captures', 'example.com', '2026-09-16'), path.join('captures', 'example.com', '2026-09-16'));
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

    const sheet = await renderContactSheet(browser, [{ name: 'scroll-000.png', buffer: shot }], path.join(dir, 'contact.png'));
    const stat = await fs.stat(sheet);
    assert.ok(stat.size > 0, 'contact sheet is empty');
  } finally {
    await browser.close();
    await fs.rm(root, { recursive: true, force: true });
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/bundle.test.mjs`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `scripts/lib/bundle.mjs`**

```js
import fs from 'node:fs/promises';
import path from 'node:path';

export function bundleDir(root, site, date) {
  return path.join(root, site, date);
}

export async function writeBundle(dir, { record, raw, motion, frames = [] }) {
  await fs.mkdir(path.join(dir, 'frames'), { recursive: true });
  const files = [];

  const writeJson = async (name, data) => {
    await fs.writeFile(path.join(dir, name), JSON.stringify(data, null, 2), 'utf8');
    files.push(name);
  };

  await writeJson('record.json', record);
  await writeJson('raw.json', raw);
  await writeJson('motion.json', motion);

  for (const frame of frames) {
    await fs.writeFile(path.join(dir, 'frames', frame.name), frame.buffer);
    files.push(path.join('frames', frame.name));
  }

  return { dir, files };
}

// Rendered by the browser we already launched. A thumbnail grid is the agent's
// overview image; full-resolution frames are pulled individually, at most three.
// Spec §7.8.
export async function renderContactSheet(browser, frames, outPath) {
  const cells = frames.map((f) => `
    <figure>
      <img src="data:image/png;base64,${f.buffer.toString('base64')}" />
      <figcaption>${f.name}</figcaption>
    </figure>`).join('');

  const html = `<!doctype html><meta charset="utf-8">
    <style>
      body { margin: 0; background: #111; font: 11px ui-monospace, monospace; color: #bbb; }
      .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; padding: 8px; }
      figure { margin: 0; }
      img { width: 100%; display: block; border: 1px solid #333; }
      figcaption { padding: 3px 0; }
    </style><div class="grid">${cells}</div>`;

  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  try {
    await page.setContent(html, { waitUntil: 'load' });
    await page.screenshot({ path: outPath, fullPage: true });
  } finally {
    await context.close();
  }
  return outPath;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/bundle.test.mjs`
Expected: PASS — 2 tests.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/bundle.mjs test/bundle.test.mjs
git commit -m "feat: capture bundle writer and browser-rendered contact sheet"
```

---

### Task 9: `probe.mjs` CLI and the heroless acceptance test

Spec §4.4, §6.2, §14 test 6. Wires everything together, runs both passes, and proves the Antigravity case: a heroless, mostly-animated page must produce a usable record with nothing dropped.

**Files:**
- Create: `scripts/probe.mjs`
- Test: `test/probe.test.mjs`

**Interfaces:**
- Consumes: every module from Tasks 1–8.
- Produces: `probe(url, { cohort, root = 'captures', date }) -> Promise<{ dir, record, quarantine }>`
  CLI: `node scripts/probe.mjs <url> [--cohort <tag>] [--root <dir>]`

- [ ] **Step 1: Write the failing test**

Create `test/probe.test.mjs`:

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { probe } from '../scripts/probe.mjs';
import { startFixtureServer } from './helpers/fixture-server.mjs';

const FIXTURES = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');

test('a conventional page probes end to end', async () => {
  const server = await startFixtureServer(FIXTURES);
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'dfd-probe-'));
  try {
    const { record, dir } = await probe(`${server.url}/static-basic.html`, { root, cohort: 'fixture' });
    assert.equal(record.archetype, 'typographic');
    assert.equal(record.hero.fontSizePx, 72);
    assert.equal(record.cohort, 'fixture');
    assert.ok(record.measured_at, 'record must carry its own measurement date');
    await fs.access(path.join(dir, 'contact.png'));
    await fs.access(path.join(dir, 'motion.json'));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
    await server.close();
  }
});

// Spec §14 test 6 — the Antigravity case. If this fails, the prober is not finished.
test('a heroless, mostly-animated page yields a usable record and drops nothing', async () => {
  const server = await startFixtureServer(FIXTURES);
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'dfd-probe-'));
  try {
    const { record, dir } = await probe(`${server.url}/heroless-canvas.html`, { root });
    assert.ok(['canvas', 'novel'].includes(record.archetype), `unexpected archetype ${record.archetype}`);
    assert.equal(record.hero, null);

    const motion = JSON.parse(await fs.readFile(path.join(dir, 'motion.json'), 'utf8'));
    assert.ok(motion.trace.elements.length > 0, 'motion.json must not be empty for an animated page');

    // Nothing dropped: the record exists, is addressable, and keeps its raw capture.
    assert.equal(record.site, new URL(`${server.url}`).hostname);
    await fs.access(path.join(dir, 'raw.json'));
  } finally {
    await fs.rm(root, { recursive: true, force: true });
    await server.close();
  }
});

test('records whether the site honours the reduced-motion contract', async () => {
  const server = await startFixtureServer(FIXTURES);
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'dfd-probe-'));
  try {
    const { record } = await probe(`${server.url}/css-motion.html`, { root });
    assert.equal(typeof record.reducedMotion.honoured, 'boolean');
  } finally {
    await fs.rm(root, { recursive: true, force: true });
    await server.close();
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/probe.test.mjs`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `scripts/probe.mjs`**

```js
#!/usr/bin/env node
import path from 'node:path';
import { launchBrowser, newPage, settle } from './lib/browser.mjs';
import { runStaticPass } from './lib/static-pass.mjs';
import { runInventory } from './lib/motion-inventory.mjs';
import { runPropertyTrace } from './lib/property-trace.mjs';
import { runScrollTrace } from './lib/scroll-trace.mjs';
import { classifyArchetype } from './lib/archetype.mjs';
import { validateRecord } from './lib/validate.mjs';
import { bundleDir, writeBundle, renderContactSheet } from './lib/bundle.mjs';

const today = () => new Date().toISOString().slice(0, 10);

function tracked(staticResult, inventory) {
  const fromMotion = inventory.animations.map((a) => a.selector).filter((s) => s !== 'unknown');
  const structural = ['canvas', 'header', 'main', 'section', 'h1', '[class*="hero"]'];
  return [...new Set([...fromMotion, ...structural])].slice(0, 12);
}

export async function probe(url, { cohort = null, root = 'captures', date = today() } = {}) {
  const site = new URL(url).hostname;
  const browser = await launchBrowser();

  try {
    // Motion pass — reduced motion OFF, because the point is to see the motion.
    // This is the inversion of verification.md, which emulates it to suppress motion.
    const { page, context } = await newPage(browser, { reducedMotion: 'no-preference' });
    await page.goto(url, { waitUntil: 'load' });
    await settle(page);

    const staticResult = await runStaticPass(page);
    const inventory = await runInventory(page);
    const selectors = tracked(staticResult, inventory);
    const trace = await runPropertyTrace(page, { selectors, samples: 40, durationMs: 1600 });
    const scroll = await runScrollTrace(page, { selectors, steps: 12 });

    const frames = [];
    const maxScroll = Math.max(staticResult.pageHeightPx - staticResult.viewportHeightPx, 0);
    for (let i = 0; i < 6; i += 1) {
      await page.evaluate((y) => window.scrollTo(0, y), Math.round((maxScroll * i) / 5));
      await page.waitForTimeout(200);
      frames.push({ name: `scroll-${String(i).padStart(3, '0')}.png`, buffer: await page.screenshot() });
    }
    await context.close();

    // Contract pass — reduced motion ON. Behavioural, not a stylesheet grep.
    const { page: rmPage, context: rmContext } = await newPage(browser, { reducedMotion: 'reduce' });
    await rmPage.goto(url, { waitUntil: 'load' });
    await settle(rmPage, { quiet: 600 });
    const rmInventory = await runInventory(rmPage);
    const rmTrace = await runPropertyTrace(rmPage, { selectors, samples: 12, durationMs: 500 });
    frames.push({ name: 'reduced-motion.png', buffer: await rmPage.screenshot() });
    await rmContext.close();

    const movingNormally = trace.elements.filter((e) => e.moved).length;
    const movingReduced = rmTrace.elements.filter((e) => e.moved).length;

    const { archetype, reason } = classifyArchetype({
      hero: staticResult.hero,
      canvasAreaRatio: staticResult.canvasAreaRatio,
      webgl: staticResult.features.webgl,
      videoAreaRatio: staticResult.videoAreaRatio,
      firstViewportTextLength: staticResult.firstViewportTextLength,
      sectionCount: staticResult.sectionCount,
      animatedElementCount: inventory.animations.length + movingNormally,
    });

    const raw = {
      site, url, cohort, measured_at: date, probe_version: '1.0.0',
      ...staticResult,
      archetype, archetypeReason: reason,
      reducedMotion: {
        cssRules: staticResult.reducedMotionRules,
        movingNormally,
        movingReduced,
        honoured: movingReduced < movingNormally || movingNormally === 0,
      },
    };

    const { record, quarantine } = validateRecord(raw);
    record.archetype = archetype;
    record.archetypeReason = reason;
    record.quarantined = quarantine.map((q) => q.field);

    const dir = bundleDir(root, site, date);
    await writeBundle(dir, {
      record,
      raw: { ...raw, quarantine },
      motion: { inventory, trace, scroll, reducedMotionTrace: rmTrace },
      frames,
    });
    await renderContactSheet(browser, frames, path.join(dir, 'contact.png'));

    return { dir, record, quarantine };
  } finally {
    await browser.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('probe.mjs')) {
  const [url, ...rest] = process.argv.slice(2);
  if (!url) {
    console.error('usage: node scripts/probe.mjs <url> [--cohort <tag>] [--root <dir>]');
    process.exit(1);
  }
  const arg = (name, fallback) => {
    const i = rest.indexOf(`--${name}`);
    return i >= 0 ? rest[i + 1] : fallback;
  };
  const { dir, record, quarantine } = await probe(url, {
    cohort: arg('cohort', null),
    root: arg('root', 'captures'),
  });
  console.log(`${record.site} -> ${dir}`);
  console.log(`  archetype: ${record.archetype} (${record.archetypeReason})`);
  console.log(`  quarantined: ${quarantine.length ? quarantine.map((q) => q.field).join(', ') : 'none'}`);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/probe.test.mjs`
Expected: PASS — 3 tests.

- [ ] **Step 5: Run the whole suite**

Run: `npm test`
Expected: PASS — all tests across all files, 0 failures.

- [ ] **Step 6: Commit**

```bash
git add scripts/probe.mjs test/probe.test.mjs
git commit -m "feat: probe CLI with dual reduced-motion passes and the heroless acceptance test"
```

---

## Self-Review

**Spec coverage:**

| Spec section | Task |
|---|---|
| §6.1 launch hardening | 1 |
| §6.2 two passes | 9 |
| §6.3 capture bundle | 8 |
| §6.4 static measurements | 4 |
| §6.5 unknown vs absent | 4 (blocked sheets), 7 (scroll unavailable) |
| §7.1 animation inventory | 5 |
| §7.2 keyframe extraction | 5 |
| §7.3 property trace | 6 |
| §7.4 scroll trace | 7 |
| §7.7 canvas/WebGL detection | 4 |
| §7.8 frame budget / contact sheet | 8 |
| §8 validation, quarantine, archetype | 2, 3 |
| §14 tests 1, 2, 3, 4, 6 | 5, 6, 7, 3, 9 |

**Deferred to Plans 2 and 3 (by design, not omission):** §7.5 interaction states, §7.6 library fingerprint, §9 pattern records, §10 discovery, §11 feedback and audit, §12 guardrails, §13 SKILL.md changes, §14 tests 5, 7, 8, 9, 10.

**Type consistency:** `runStaticPass`, `runInventory`, `runPropertyTrace`, `runScrollTrace`, `classifyArchetype`, `validateRecord`, `bundleDir`, `writeBundle`, `renderContactSheet` are named identically in their defining task, in `probe.mjs`, and in every test. `hero` is `null` (never `undefined`) throughout. `iterations: null` means infinite in both the inventory and its test.

**Placeholder scan:** none — every step carries runnable code.
