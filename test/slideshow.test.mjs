import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { launchBrowser } from '../scripts/lib/browser.mjs';
import { REQUIRED_SECTIONS } from '../scripts/lib/presentation-checks.mjs';
import { copyPresentationFixture } from './helpers/presentation-fixture.mjs';

const N = REQUIRED_SECTIONS.length;
let browser, fixture, url;
before(async () => {
  browser = await launchBrowser();
  fixture = copyPresentationFixture();
  url = pathToFileURL(path.join(fixture.dir, 'presentation.html')).href;
});
after(async () => {
  await browser?.close();
  fixture?.cleanup();
});

// A page of its own for every test: { page, context }. Events df:slidechange are recorded from the start.
async function open({ hash = '', viewport = { width: 1440, height: 900 }, ...options } = {}) {
  const context = await browser.newContext({ viewport, ...options });
  await context.addInitScript(() => {
    window.__events = [];
    document.addEventListener('df:slidechange', (e) => window.__events.push({ from: e.detail.from, to: e.detail.to, name: e.detail.slide?.dataset.section }));
  });
  const page = await context.newPage();
  // Registered before the page loads, so an error thrown while the runtime starts is caught.
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto(url + hash, { waitUntil: 'load' });
  return { page, context, errors };
}
const shown = (page) => page.evaluate(() => [...document.querySelectorAll('section[data-section]')]
  .map((s, i) => [i + 1, getComputedStyle(s)]).filter(([, st]) => st.visibility === 'visible' && Number(st.opacity) > 0.99).map(([n]) => n));
const inView = (page, n) => page.waitForFunction((want) => {
  const now = [...document.querySelectorAll('section[data-section]')]
    .map((s, i) => [i + 1, getComputedStyle(s)]).filter(([, st]) => st.visibility === 'visible' && Number(st.opacity) > 0.99).map(([k]) => k);
  return now.length === 1 && now[0] === want;
}, n, { timeout: 5000 });
const counter = (page) => page.locator('.df-counter').textContent();
const pad = (n) => String(n).padStart(2, '0');
const withPage = (options, fn) => async () => {
  const { page, context } = await open(options);
  try { await fn(page); } finally { await context.close(); }
};

test('starts with exactly one slide in view, a counter, and no artboard turned into a slide', withPage({}, async (page) => {
  await inView(page, 1);
  assert.equal(await counter(page), `01 / ${pad(N)}`);
  assert.equal(await page.evaluate(() => window.__DF_SLIDESHOW__.count), N);
  assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('[data-social="square"]')).display), 'none');
  assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.artboards')).display), 'none', 'the wrapper that only holds artboards is hidden too');
}));

test('keys: arrows, PageUp/PageDown, Home/End, and the ends hold', withPage({}, async (page) => {
  await page.keyboard.press('ArrowRight'); await inView(page, 2);
  await page.keyboard.press('PageDown'); await inView(page, 3);
  await page.keyboard.press('ArrowLeft'); await inView(page, 2);
  await page.keyboard.press('PageUp'); await inView(page, 1);
  await page.keyboard.press('ArrowLeft'); await inView(page, 1);
  await page.keyboard.press('End'); await inView(page, N);
  await page.keyboard.press('ArrowRight'); await inView(page, N);
  await page.keyboard.press('Home'); await inView(page, 1);
  assert.equal(await counter(page), `01 / ${pad(N)}`);
}));

test('keys with a modifier, or typed into a field, do not move the slide', withPage({}, async (page) => {
  await page.keyboard.press('Shift+ArrowRight');
  await page.keyboard.press('Control+ArrowRight');
  await page.evaluate(() => { const i = document.createElement('input'); i.id = 'field'; document.querySelector('section[data-section]').appendChild(i); });
  await page.focus('#field');
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(300);
  await inView(page, 1);
}));

test('the hash follows the slide without filling the history; an edited hash still adds an entry that back undoes', withPage({}, async (page) => {
  const before = await page.evaluate(() => history.length);
  await page.keyboard.press('ArrowRight'); await inView(page, 2);
  await page.keyboard.press('ArrowRight'); await inView(page, 3);
  await page.click('.df-next'); await inView(page, 4);
  await page.evaluate(() => window.__DF_SLIDESHOW__.go(3)); await inView(page, 3);
  assert.equal(await page.evaluate(() => location.hash), '#slide-3');
  assert.equal(await page.evaluate(() => history.length), before, 'keys, buttons and the API add no history entries');
  await page.evaluate(() => { location.hash = '#slide-6'; }); await inView(page, 6);
  assert.equal(await page.evaluate(() => history.length), before + 1, 'an edited hash is a navigation');
  await page.goBack(); await inView(page, 3);
  assert.equal(await counter(page), `03 / ${pad(N)}`);
}));

test('opening #slide-3 starts on slide 3; out-of-range hashes open the nearest slide and are corrected in place; #id opens the slide holding it', async () => {
  for (const [hash, want, fixed] of [['#slide-3', 3, '#slide-3'], [`#slide-${N}`, N, `#slide-${N}`], ['#slide-99', N, `#slide-${N}`], ['#slide-0', 1, '#slide-1'], ['#closing', N, '#closing'], ['#nothing-here', 1, '#nothing-here']]) {
    const { page, context } = await open({ hash });
    try {
      await inView(page, want);
      assert.equal(await counter(page), `${pad(want)} / ${pad(N)}`, hash);
      assert.equal(await page.evaluate(() => location.hash), fixed, `${hash} should read ${fixed}`);
    } finally { await context.close(); }
  }
  const entries = async (hash) => {
    const { page, context } = await open({ hash });
    try { await inView(page, 3); return await page.evaluate(() => history.length); } finally { await context.close(); }
  };
  assert.equal(await entries('#slide-3'), await entries('#slide-3'));
  const { page, context } = await open({ hash: '#slide-99' });
  try {
    await inView(page, N);
    assert.equal(await page.evaluate(() => history.length), await entries('#slide-3'), 'the correction replaces the entry, it does not add one');
  } finally { await context.close(); }
});

test('a malformed escape in the hash (#slide-%E0) does not blank the page: slide 1, no error', async () => {
  const { page, context, errors } = await open({ hash: '#slide-%E0' });
  try {
    assert.deepEqual(errors, [], 'nothing was thrown while the runtime started');
    await inView(page, 1);
    assert.equal(await counter(page), `01 / ${pad(N)}`);
    await page.keyboard.press('ArrowRight'); await inView(page, 2);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test('an in-page link to an id moves to the slide that holds it', withPage({}, async (page) => {
  await page.click('a[href="#closing"]');
  await inView(page, N);
  assert.equal((await page.evaluate(() => location.hash)), '#closing');
}));

test('on-screen buttons: labelled, working, disabled at the ends, with a visible focus ring', withPage({}, async (page) => {
  assert.equal(await page.getAttribute('.df-prev', 'aria-label'), 'Previous slide');
  assert.equal(await page.getAttribute('.df-next', 'aria-label'), 'Next slide');
  assert.equal(await page.getAttribute('.df-prev', 'aria-disabled'), 'true');
  await page.click('.df-next'); await inView(page, 2);
  assert.equal(await page.getAttribute('.df-prev', 'aria-disabled'), 'false');
  await page.click('.df-prev'); await inView(page, 1);
  await page.keyboard.press('End'); await inView(page, N);
  assert.equal(await page.getAttribute('.df-next', 'aria-disabled'), 'true');
  for (let i = 0; i < 8 && !(await page.evaluate(() => document.activeElement?.classList.contains('df-next'))); i++) await page.keyboard.press('Tab');
  const ring = await page.evaluate(() => { const s = getComputedStyle(document.activeElement); return [s.outlineStyle, s.outlineWidth]; });
  assert.deepEqual(ring, ['solid', '3px']);
}));

const swipe = (page, dx, dy = 0) => page.evaluate(([x, y]) => {
  const fire = (type, cx, cy) => {
    const touch = new Touch({ identifier: 1, target: document.body, clientX: cx, clientY: cy });
    document.body.dispatchEvent(new TouchEvent(type, { bubbles: true, cancelable: true, touches: type === 'touchend' ? [] : [touch], changedTouches: [touch] }));
  };
  fire('touchstart', 300, 300);
  fire('touchend', 300 + x, 300 + y);
}, [dx, dy]);

test('swipe: left goes forward, right goes back; short and mostly-vertical swipes are ignored', withPage({ hasTouch: true }, async (page) => {
  await swipe(page, -200); await inView(page, 2);
  await swipe(page, 200); await inView(page, 1);
  await swipe(page, -20); await swipe(page, -200, 400); await swipe(page, 200);
  await page.waitForTimeout(300);
  await inView(page, 1);
}));

test('df:slidechange reports from, to and the slide, starting with from=null', withPage({}, async (page) => {
  await page.keyboard.press('ArrowRight'); await inView(page, 2);
  await page.keyboard.press('End'); await inView(page, N);
  assert.deepEqual(await page.evaluate(() => window.__events), [
    { from: null, to: 1, name: REQUIRED_SECTIONS[0] },
    { from: 1, to: 2, name: REQUIRED_SECTIONS[1] },
    { from: 2, to: N, name: REQUIRED_SECTIONS[N - 1] },
  ]);
}));

test('the slide is 16:9 scaled to fit and letterboxed, at desktop and phone sizes', async () => {
  for (const [viewport, scale] of [[{ width: 1440, height: 900 }, 0.75], [{ width: 390, height: 844 }, 390 / 1920], [{ width: 1920, height: 1200 }, 1]]) {
    const { page, context } = await open({ viewport });
    try {
      await inView(page, 1);
      const box = await page.evaluate(() => { const r = document.querySelector('section[data-section]').getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; });
      const w = 1920 * scale;
      const h = 1080 * scale;
      const want = [(viewport.width - w) / 2, (viewport.height - h) / 2, w, h];
      box.forEach((v, i) => assert.ok(Math.abs(v - want[i]) < 1.5, `${viewport.width}x${viewport.height}: ${box} vs ${want}`));
    } finally { await context.close(); }
  }
});

test('fast tier: [data-reveal] is masked until its slide comes into focus, opens, and replays after leaving', withPage({}, async (page) => {
  const clip = () => page.evaluate(() => getComputedStyle(document.querySelector('[data-reveal]')).clipPath);
  assert.equal(await clip(), 'inset(0px 100% 0px 0px)');
  const slide = REQUIRED_SECTIONS.indexOf('mockups') + 1;
  await page.evaluate((n) => window.__DF_SLIDESHOW__.go(n), slide);
  await inView(page, slide);
  await page.waitForFunction(() => getComputedStyle(document.querySelector('[data-reveal]')).clipPath === 'inset(0px)', null, { timeout: 5000 });
  await page.evaluate(() => window.__DF_SLIDESHOW__.go(1));
  await page.waitForFunction(() => getComputedStyle(document.querySelector('[data-reveal]')).clipPath === 'inset(0px 100% 0px 0px)', null, { timeout: 5000 });
}));

test('prefers-reduced-motion: no transition, and every reveal is already open', withPage({ reducedMotion: 'reduce' }, async (page) => {
  assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('[data-reveal]')).clipPath), 'none');
  assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('section[data-section]')).transitionDuration), '0s');
  await page.keyboard.press('ArrowRight');
  await inView(page, 2); // an instant swap, with no fade to wait out
  assert.deepEqual(await shown(page), [2]);
}));

test('window.__DF_EXPORT__ turns it all off: every section in the flow, reveals at rest, no controls', async () => {
  const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } });
  await context.addInitScript(() => { window.__DF_EXPORT__ = true; });
  try {
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'load' });
    const state = await page.evaluate(() => ({
      active: document.documentElement.classList.contains('df-slideshow'),
      api: !!window.__DF_SLIDESHOW__,
      ui: !!document.querySelector('.df-ui'),
      positions: [...new Set([...document.querySelectorAll('section[data-section]')].map((s) => getComputedStyle(s).position))],
      visible: [...document.querySelectorAll('section[data-section]')].every((s) => getComputedStyle(s).visibility === 'visible' && getComputedStyle(s).opacity === '1'),
      clip: getComputedStyle(document.querySelector('[data-reveal]')).clipPath,
      tops: [...document.querySelectorAll('section[data-section]')].map((s) => Math.round(s.getBoundingClientRect().top + scrollY)),
    }));
    assert.deepEqual([state.active, state.api, state.ui, state.positions, state.visible, state.clip], [false, false, false, ['static'], true, 'none']);
    assert.ok(state.tops.every((t, i) => i === 0 || t > state.tops[i - 1]), `sections stack in the flow, tops ${state.tops}`);
  } finally { await context.close(); }
});

test('keys are ignored in anything editable, including plaintext-only and children of a contenteditable', withPage({}, async (page) => {
  await page.evaluate(() => {
    const host = document.querySelector('section[data-section]');
    host.insertAdjacentHTML('beforeend', '<div id="plain" contenteditable="plaintext-only" tabindex="0">x</div><div id="rich" contenteditable="true"><span id="inner" tabindex="0">y</span></div>');
  });
  for (const id of ['#plain', '#inner']) {
    await page.focus(id);
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);
    await inView(page, 1);
  }
  await page.evaluate(() => document.activeElement.blur());
  await page.keyboard.press('ArrowRight'); await inView(page, 2);
}));

test('accessibility: slides are labelled regions, only the one in focus is reachable, a live region says where we are, focus follows', withPage({}, async (page) => {
  const state = () => page.evaluate(() => ({
    roles: [...document.querySelectorAll('section[data-section]')].map((s) => [s.getAttribute('role'), s.getAttribute('aria-roledescription'), s.getAttribute('aria-label')]),
    reachable: [...document.querySelectorAll('section[data-section]')].map((s, i) => [i + 1, s.inert, s.getAttribute('aria-hidden')]).filter(([, inert, hidden]) => !inert && hidden !== 'true').map(([n]) => n),
    live: document.querySelector('[role=status][aria-live=polite]')?.textContent,
    focusedSlide: [...document.querySelectorAll('section[data-section]')].findIndex((s) => s === document.activeElement) + 1,
    bodyFocused: document.activeElement === document.body,
  }));
  let st = await state();
  assert.deepEqual(st.roles.map((r) => r.slice(0, 2)), Array.from({ length: N }, () => ['region', 'slide']));
  assert.deepEqual(st.roles.map((r) => r[2]), Array.from({ length: N }, (_, i) => `Slide ${i + 1} de ${N}`));
  assert.deepEqual(st.reachable, [1]);
  assert.equal(st.live, `Slide 1 de ${N}`);
  assert.equal(st.bodyFocused, true, 'the first show does not take focus from the page');
  await page.keyboard.press('ArrowRight'); await inView(page, 2);
  st = await state();
  assert.deepEqual([st.reachable, st.live, st.focusedSlide], [[2], `Slide 2 de ${N}`, 2]);
  // From a button the focus stays on the button, so stepping with Enter keeps working.
  await page.focus('.df-next');
  await page.keyboard.press('Enter'); await inView(page, 3);
  assert.equal(await page.evaluate(() => document.activeElement.classList.contains('df-next')), true);
  assert.equal(await page.evaluate(() => document.querySelectorAll('.df-counter[role], .df-counter[aria-live]').length), 0, 'the counter is not a second live region');
}));

test('the resize listener refits the slide, and the slides do not animate while the viewport changes', withPage({}, async (page) => {
  await inView(page, 1);
  await page.setViewportSize({ width: 1000, height: 500 });
  await page.waitForFunction(() => Math.abs(Number(document.documentElement.style.getPropertyValue('--df-scale')) - Math.min(1000 / 1920, 500 / 1080)) < 0.001, null, { timeout: 5000 });
  const box = await page.evaluate(() => { const r = document.querySelector('section[data-section]').getBoundingClientRect(); return [r.width, r.height]; });
  assert.ok(Math.abs(box[0] - 1920 * (500 / 1080)) < 1.5 && Math.abs(box[1] - 500) < 1.5, `slide box ${box}`);
  const during = await page.evaluate(() => {
    window.dispatchEvent(new Event('resize'));
    return { resizing: document.documentElement.classList.contains('df-resizing'), transition: getComputedStyle(document.querySelector('section[data-section]')).transitionProperty };
  });
  assert.deepEqual(during, { resizing: true, transition: 'none' });
  await page.waitForFunction(() => !document.documentElement.classList.contains('df-resizing'), null, { timeout: 3000 });
  assert.notEqual(await page.evaluate(() => getComputedStyle(document.querySelector('section[data-section]')).transitionProperty), 'none');
}));

test('the transition between slides is a real fade: the slide being left is seen part way out', withPage({}, async (page) => {
  await inView(page, 1);
  const samples = await page.evaluate(() => new Promise((resolve) => {
    const first = document.querySelector('section[data-section]');
    const seen = [];
    window.__DF_SLIDESHOW__.go(2);
    const t0 = performance.now();
    const tick = () => {
      seen.push(Number(getComputedStyle(first).opacity));
      if (performance.now() - t0 < 900) requestAnimationFrame(tick); else resolve(seen);
    };
    requestAnimationFrame(tick);
  }));
  assert.ok(samples.some((o) => o > 0.02 && o < 0.98), `opacity of the slide being left never was in between: ${samples.slice(0, 12)}`);
  assert.equal(samples.at(-1), 0);
  await inView(page, 2);
}));

const rect = (page, selector) => page.evaluate((sel) => { const r = document.querySelector(sel).getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom, width: r.width, height: r.height }; }, selector);
const overlaps = (a, b) => a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;

test('a phone held upright: the slide stays 16:9, the controls are in a bar outside it, and a hint asks to turn the phone', async () => {
  const { page, context } = await open({ viewport: { width: 390, height: 844 } });
  try {
    await inView(page, 1);
    const slide = await rect(page, 'section[data-section]');
    assert.ok(Math.abs(slide.width / slide.height - 16 / 9) < 0.01, `slide ${slide.width}x${slide.height}`);
    for (const sel of ['.df-prev', '.df-next', '.df-counter', '.df-hint']) {
      const r = await rect(page, sel);
      assert.ok(r.width > 0 && r.height > 0, `${sel} is shown`);
      assert.equal(overlaps(r, slide), false, `${sel} sits on the slide`);
      assert.ok(r.top >= slide.bottom - 0.5, `${sel} is below the slide`);
    }
    assert.match(await page.locator('.df-hint').textContent(), /gire o celular para tela cheia/i);
    assert.equal(await page.locator('.df-hint').isVisible(), true);
    await page.click('.df-next'); await inView(page, 2);
  } finally { await context.close(); }
});

test('a phone held sideways: no hint, and the slide fills the screen', async () => {
  const { page, context } = await open({ viewport: { width: 844, height: 390 } });
  try {
    await inView(page, 1);
    assert.equal(await page.locator('.df-hint').isVisible(), false);
    const slide = await rect(page, 'section[data-section]');
    assert.ok(Math.abs(slide.height - 390) < 1.5, `the slide fills the height: ${slide.height}`);
    for (const sel of ['.df-prev', '.df-next']) assert.equal(overlaps(await rect(page, sel), slide), false, `${sel} sits on the slide`);
    assert.equal(await page.evaluate(() => getComputedStyle(document.querySelector('.df-ui')).display), 'block', 'the bar layout is for upright phones only');
  } finally { await context.close(); }
});
