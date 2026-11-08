// The render tier of check-slop: opens each page in Playwright and settles the gates only a browser can judge.
// Gate ids and tiers: GATES in slop-static.mjs (render: true), documented in references/gates.md.
// Modelled on Hallmark's sloplint-render (github.com/nutlope/hallmark, MIT), rewritten for Playwright.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { launchBrowser, settle } from './browser.mjs';
import { GATES } from './slop-static.mjs';
import { captureMotion, movingSignals, decodePng } from './motion-capture.mjs';

const WIDTHS = [320, 390, 768, 1024, 1440, 1920];
const FOLD = { width: 1280, height: 800 };
const LAPTOP = { width: 1440, height: 900 };
const WIDE = { width: 1920, height: 1080 };
const PHONE = { width: 390, height: 844 };
const MAX_TABS = 30;

const rel = (f) => (f && f.startsWith(process.cwd()) ? f.slice(process.cwd().length + 1) : f);
const trunc = (s, n) => (s && s.length > n ? s.slice(0, n - 1) + '…' : s);
const slugOf = (target) => target.replace(/^https?:\/\//, '').replace(/\.html?$/i, '').replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '').slice(-60) || 'page';

export async function renderCheck({ pages = [], urls = [], scope = 'page', out = null, browser: given = null, motion = false } = {}) {
  const targets = [...pages.map((p) => ({ url: pathToFileURL(path.resolve(p)).href, label: rel(path.resolve(p)) })), ...urls.map((u) => ({ url: u, label: u }))];
  const findings = [];
  const screenshots = [];
  const motions = [];
  if (!targets.length) return { findings, rendered: 0, screenshots, motion: motions };
  const browser = given || (await launchBrowser());
  try {
    for (const t of targets) {
      const dir = path.resolve(out || path.join('captures', 'slop'), slugOf(t.label));
      fs.mkdirSync(dir, { recursive: true });
      const report = (gate, grade, line, evidence) => {
        const g = GATES[gate];
        if (scope === 'app' && (gate === 'fold' || gate === 'dead-half' || gate === 'word-budget')) return;
        if (scope === 'component' && (gate === 'fold' || gate === 'dead-half' || gate === 'word-budget' || gate === 'container-cap')) return;
        findings.push({ gate, grade, tier: g.tier, file: t.label, line: line || 0, evidence: trunc(evidence, 120), fix: g.fix, render: true });
      };
      const moving = await checkPage(browser, t, dir, report, screenshots);
      // A full-page still shows a pinned scene once and a canvas at one moment: on a page that moves, add the run.
      const why = motion ? ['asked (--motion)', ...(moving || [])] : moving || [];
      if (why.length) {
        const cap = await captureMotion(browser, t.url, { out: path.join(dir, 'motion') });
        const sheets = cap.sheets.map((s) => path.join(cap.dir, s));
        screenshots.push(...sheets);
        motions.push({ file: t.label, why, dir: rel(cap.dir), sheets: sheets.map(rel), video: cap.video ? rel(path.join(cap.dir, cap.video)) : null, reachedEnd: cap.reachedEnd, endReason: cap.endReason, movedBy: cap.movedBy, sheetsFrom: cap.sheetsFrom });
      }
    }
  } finally {
    if (!given) await browser.close();
  }
  return { findings, rendered: targets.length, screenshots: screenshots.map(rel), motion: motions };
}

async function open(browser, url, { viewport, js = true, reduced = true } = {}) {
  const context = await browser.newContext({ viewport, reducedMotion: reduced ? 'reduce' : 'no-preference', javaScriptEnabled: js });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  const res = await page.goto(url, { waitUntil: 'load', timeout: 45000 }).catch((e) => ({ failed: e.message }));
  if (res && res.failed) { await context.close(); throw new Error(res.failed); }
  await settle(page, { quiet: 400 });
  return { page, context, errors };
}

async function scrollThrough(page) {
  await page.evaluate(async () => {
    const h = document.documentElement.scrollHeight;
    for (let y = 0; y < h; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); }
    scrollTo(0, 0);
    for (const i of document.querySelectorAll('img[loading="lazy"]')) i.loading = 'eager';
    await Promise.race([Promise.all([...document.images].filter((i) => !i.complete).map((i) => new Promise((r) => { i.onload = i.onerror = r; }))), new Promise((r) => setTimeout(r, 5000))]);
  });
}

async function checkPage(browser, target, dir, report, screenshots) {
  let moving = [];
  // 1. Horizontal scroll at six widths.
  for (const w of WIDTHS) {
    let opened;
    try { opened = await open(browser, target.url, { viewport: { width: w, height: 900 } }); } catch (e) { report('broken-image', 'FAIL', 0, `the page would not open: ${e.message}`); return; }
    const { page, context } = opened;
    const sw = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body ? document.body.scrollWidth : 0));
    if (sw > w + 1) {
      const culprit = await page.evaluate((w) => {
        let worst = null;
        for (const el of document.querySelectorAll('body *')) { const r = el.getBoundingClientRect(); if (r.right > w + 1 && r.width > 0 && (!worst || r.right > worst.right)) worst = { right: r.right, tag: el.tagName.toLowerCase(), cls: el.className && typeof el.className === 'string' ? el.className.split(/\s+/)[0] : '' }; }
        return worst;
      }, w);
      report('horizontal-scroll', 'FAIL', 0, `scrollWidth ${sw} at ${w}px${culprit ? ` (<${culprit.tag}${culprit.cls ? ` class="${culprit.cls}"` : ''}> reaches ${Math.round(culprit.right)}px)` : ''}`);
    }
    await context.close();
  }

  // 2. The fold at 1280 x 800.
  {
    const { page, context } = await open(browser, target.url, { viewport: FOLD });
    const fold = await page.evaluate(() => {
      const vis = (el) => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.opacity !== '0' ? r : null; };
      const h1 = document.querySelector('main h1, h1');
      if (!h1) return { none: true };
      const hero = h1.closest('section, header, article, [class*="hero"], main > *') || h1.parentElement;
      const action = [...hero.querySelectorAll('a[href], button')].find((a) => { const r = vis(a); return r && r.top >= h1.getBoundingClientRect().top - 40 && (a.textContent || '').trim(); }) || null;
      const r1 = vis(h1);
      const ra = action ? vis(action) : null;
      return { h1: r1 ? { top: r1.top, bottom: r1.bottom, text: h1.textContent.trim().slice(0, 40) } : null, action: ra ? { top: ra.top, bottom: ra.bottom, text: action.textContent.trim().slice(0, 30) } : action ? { hidden: true, text: action.textContent.trim().slice(0, 30) } : null, inner: innerHeight };
    });
    if (!fold.none) {
      if (!fold.h1) report('fold', 'FAIL', 0, 'the h1 is not painted at 1280 x 800');
      else if (fold.h1.bottom > fold.inner + 1) report('fold', 'FAIL', 0, `the headline "${fold.h1.text}" ends at y ${Math.round(fold.h1.bottom)} at 1280 x 800 (fold at 800)`);
      if (fold.action && (fold.action.hidden || fold.action.bottom > fold.inner + 1)) report('fold', 'FAIL', 0, `the hero's action "${fold.action.text}" is below the fold at 1280 x 800${fold.action.bottom ? ` (ends at y ${Math.round(fold.action.bottom)})` : ''}`);
    }
    const shot = path.join(dir, 'fold-1280.png');
    await page.screenshot({ path: shot });
    screenshots.push(shot);
    await context.close();
  }

  // 3. At 1440 x 900: focus rings, images, measure, text strain, dead half, word budget, hero and full page shots.
  {
    const { page, context } = await open(browser, target.url, { viewport: LAPTOP });
    await scrollThrough(page);
    const shotHero = path.join(dir, 'hero-1440.png');
    await page.screenshot({ path: shotHero });
    screenshots.push(shotHero);

    const broken = await page.evaluate(() => [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && (i.getAttribute('src') || i.currentSrc)).map((i) => (i.currentSrc || i.getAttribute('src') || '').split('/').pop().slice(0, 50)));
    for (const b of broken) report('broken-image', 'FAIL', 0, `image does not load: ${b}`);

    const text = await page.evaluate(() => {
      const out = { wide: [], strained: [], words: 0, maxWindow: 0, heroDead: null };
      const blocks = [...document.querySelectorAll('p, li, dd, blockquote, figcaption, td')].filter((el) => (el.innerText || '').trim().length >= 100);
      for (const el of blocks) {
        const cs = getComputedStyle(el);
        const fs = parseFloat(cs.fontSize) || 16;
        const r = el.getBoundingClientRect();
        if (r.width <= 0) continue;
        // average advance of the Latin lower case is about 0.5em; a ch is close to it
        const chars = r.width / (fs * 0.5);
        if (chars > 90) out.wide.push({ ch: Math.round(chars), text: el.innerText.trim().slice(0, 40), tag: el.tagName.toLowerCase() });
      }
      for (const el of document.querySelectorAll('p, li, dd, span, small, a, td, figcaption, label')) {
        const t = (el.innerText || '').trim();
        if (t.length < 20) continue;
        const direct = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length >= 20);
        if (!direct) continue;
        const fs = parseFloat(getComputedStyle(el).fontSize);
        if (fs && fs < 12) out.strained.push({ px: Math.round(fs * 10) / 10, text: t.slice(0, 30) });
      }
      // words per 900px window
      const items = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = walker.nextNode())) {
        if (!n.textContent.trim() || n.parentElement.closest('script, style, noscript, template')) continue;
        const range = document.createRange(); range.selectNodeContents(n);
        const r = range.getBoundingClientRect();
        if (r.height === 0) continue;
        items.push({ y: r.top + scrollY, w: n.textContent.trim().split(/\s+/).length });
      }
      items.sort((a, b) => a.y - b.y);
      let j = 0;
      for (let i = 0; i < items.length; i++) { while (items[j].y < items[i].y - 900) j++; let sum = 0; for (let k = j; k <= i; k++) sum += items[k].w; out.maxWindow = Math.max(out.maxWindow, sum); }
      out.words = items.reduce((s, x) => s + x.w, 0);
      // dead half: the hero's painted content against the canvas
      const h1 = document.querySelector('main h1, h1');
      if (h1) {
        const hero = h1.closest('section, header, article, [class*="hero"], main > *') || h1.parentElement;
        const leaves = [...hero.querySelectorAll('*')].filter((el) => { const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || cs.opacity === '0') return false; const r = el.getBoundingClientRect(); if (r.width < 8 || r.height < 8) return false; const own = [...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim()); const media = /^(IMG|SVG|CANVAS|VIDEO|PICTURE|IFRAME)$/.test(el.tagName.toUpperCase()); const painted = cs.backgroundImage !== 'none' || (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && el !== hero && r.width < innerWidth * 0.9); return own || media || painted; });
        if (leaves.length) {
          let right = 0, left = innerWidth, anyRight = false;
          for (const el of leaves) { const r = el.getBoundingClientRect(); right = Math.max(right, r.right); left = Math.min(left, r.left); if (r.left > innerWidth * 0.5 || r.right > innerWidth * 0.72) anyRight = true; }
          out.heroDead = { right: Math.round(right), left: Math.round(left), anyRight, width: innerWidth };
        }
      }
      return out;
    });
    for (const w of text.wide.slice(0, 4)) report('measure', 'FAIL', 0, `<${w.tag}> runs about ${w.ch} characters a line: "${w.text}"`);
    for (const s of text.strained.slice(0, 4)) report('text-strain', 'REFLEX', 0, `${s.px}px text: "${s.text}"`);
    if (text.maxWindow > 120) report('word-budget', 'NOTE', 0, `${text.maxWindow} words in one 900px window at 1440 (${text.words} on the page)`);
    if (text.heroDead && !text.heroDead.anyRight && text.heroDead.right < text.heroDead.width * 0.55) report('dead-half', 'REFLEX', 0, `the hero's content stops at x ${text.heroDead.right} of ${text.heroDead.width}, nothing on the right half`);

    // focus rings by tabbing
    await page.evaluate(() => scrollTo(0, 0));
    const bare = [];
    const seen = new Set();
    for (let i = 0; i < MAX_TABS; i++) {
      await page.keyboard.press('Tab');
      const r = await page.evaluate(() => {
        let el = document.activeElement;
        if (!el || el === document.body || el === document.documentElement) return null;
        const box = el.getBoundingClientRect();
        if (box.width < 4 || box.height < 4) el = (el.labels && el.labels[0]) || el.closest('label') || el.parentElement || el;
        const key = el.tagName.toLowerCase() + (el.id ? `#${el.id}` : '') + (el.className && typeof el.className === 'string' && el.className.split(/\s+/)[0] ? `.${el.className.split(/\s+/)[0]}` : '') + ((el.textContent || '').trim() ? ` "${(el.textContent || '').trim().slice(0, 18)}"` : '');
        const chain = []; for (let n = el, k = 0; n && n !== document.body && k < 4; n = n.parentElement, k++) chain.push(n);
        const look = () => chain.flatMap((n) => [null, '::before', '::after'].map((ps) => { const c = getComputedStyle(n, ps); return [c.outlineStyle === 'none' || !(parseFloat(c.outlineWidth) > 0) ? 'no-outline' : `outline ${c.outlineColor}`, c.boxShadow, c.borderColor, c.backgroundColor, c.color, c.textDecorationLine, c.opacity].join('|'); })).join('~');
        for (const n of chain) n.style.setProperty('transition', 'none', 'important');
        const focused = look();
        const active = document.activeElement;
        active.blur();
        const rest = look();
        active.focus({ preventScroll: true });
        return { key, bare: focused === rest };
      });
      if (!r) break;
      if (seen.has(r.key)) break;
      seen.add(r.key);
      if (r.bare) bare.push(r.key);
    }
    for (const k of bare.slice(0, 6)) report('focus-ring', 'FAIL', 0, `no visible focus state on ${k}`);
    if (bare.length > 6) report('focus-ring', 'FAIL', 0, `${bare.length - 6} more focusable elements with no visible focus state`);

    // glass over nothing: each frosted panel hidden for a moment, and what is behind it photographed
    for (const g of await glassBehind(page)) report('glass-over-nothing', 'REFLEX', 0, `${g.what} blurs a flat backdrop (luminance spread ${g.spread} of 255 behind it)`);

    moving = await movingSignals(page);
    const shotFull = path.join(dir, 'full-1440.png');
    await page.screenshot({ path: shotFull, fullPage: true });
    screenshots.push(shotFull);
    await context.close();
  }

  // 4. At 1920 x 1080: the container cap.
  {
    const { page, context } = await open(browser, target.url, { viewport: WIDE });
    const cap = await page.evaluate(() => {
      const blocks = [...document.querySelectorAll('main p, main h1, main h2, main li, p, h1, h2, li')].filter((el) => (el.innerText || '').trim().length >= 40 && el.getBoundingClientRect().width > 0 && !el.closest('nav, footer, header'));
      if (!blocks.length) return null;
      const left = Math.min(...blocks.map((el) => el.getBoundingClientRect().left));
      const right = Math.max(...blocks.map((el) => el.getBoundingClientRect().right));
      return { left: Math.round(left), gutterRight: Math.round(innerWidth - right), width: innerWidth };
    });
    if (cap && Math.min(cap.left, cap.gutterRight) < 120) report('container-cap', 'REFLEX', 0, `gutters of ${cap.left}px left and ${cap.gutterRight}px right at 1920: the container is not capped and centred`);
    await context.close();
  }

  // 5. Scripting off: what disappears.
  {
    const { page, context } = await open(browser, target.url, { viewport: LAPTOP, js: false });
    const gone = await page.evaluate(() => {
      const check = (sel) => [...document.querySelectorAll(sel)].filter((el) => { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); const txt = (el.innerText || el.textContent || '').trim(); return (txt || el.tagName === 'IMG') && (cs.opacity === '0' || cs.visibility === 'hidden' || (r.width === 0 && r.height === 0 && cs.display !== 'none')); });
      const heads = check('h1, h2, h3');
      const paras = check('p');
      const imgs = check('img');
      const total = document.querySelectorAll('h1, h2, h3, p, img').length;
      return { heads: heads.length, paras: paras.length, imgs: imgs.length, total, sample: [...heads, ...paras].slice(0, 2).map((el) => (el.innerText || '').trim().slice(0, 30)) };
    });
    const n = gone.heads + gone.paras + gone.imgs;
    if (n > 0) report('hidden-without-script', 'FAIL', 0, `${n} of ${gone.total} headings, paragraphs and images invisible with scripting off${gone.sample.length ? ` ("${gone.sample.join('", "')}")` : ''}`);
    await context.close();
  }

  // 6. Motion on, as a visitor without the reduced-motion setting sees it: storms, a loader over a ready page, the wheel.
  await motionGates(browser, target, report);

  // 7. The phone, full page.
  {
    const { page, context } = await open(browser, target.url, { viewport: PHONE });
    await scrollThrough(page);
    const shot = path.join(dir, 'full-390.png');
    await page.screenshot({ path: shot, fullPage: true });
    screenshots.push(shot);
    await context.close();
  }
  return moving;
}

// --- Gates from the component catalogue read on 2026-11-08 (references/yolo-references.md) ---------------------------

// Luminance spread of a screenshot: the 98th percentile minus the 2nd, so a stray pixel does not count.
function spreadOf(buf) {
  const { width, height, channels, pixels } = decodePng(buf);
  const hist = new Uint32Array(256);
  for (let i = 0; i < width * height; i++) {
    const o = i * channels;
    hist[channels >= 3 ? Math.round(0.2126 * pixels[o] + 0.7152 * pixels[o + 1] + 0.0722 * pixels[o + 2]) : pixels[o]]++;
  }
  const at = (q) => { let acc = 0; for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= q * width * height) return v; } return 255; };
  return at(0.98) - at(0.02);
}

// Each frosted panel (a backdrop blur) is hidden for a moment and what it would blur is photographed. A spread under
// 14 levels of 255 is a flat ground: the glass has nothing to bend, and reads as a grey box with a border.
async function glassBehind(page) {
  const panels = await page.evaluate(() => {
    const out = [];
    for (const el of document.querySelectorAll('body *')) {
      const cs = getComputedStyle(el);
      if (!/blur\(/.test(cs.backdropFilter || cs.webkitBackdropFilter || '') || cs.visibility === 'hidden' || cs.display === 'none') continue;
      const r = el.getBoundingClientRect();
      if (r.width * r.height < 4000) continue;
      el.setAttribute('data-df-glass', String(out.length));
      out.push({ i: out.length, what: `<${el.tagName.toLowerCase()}${typeof el.className === 'string' && el.className ? ` class="${el.className.split(/\s+/)[0]}"` : ''}>` });
      if (out.length >= 6) break;
    }
    return out;
  }).catch(() => []);
  const flat = [];
  for (const p of panels) {
    const box = await page.evaluate((i) => {
      const el = document.querySelector(`[data-df-glass="${i}"]`);
      el.scrollIntoView({ block: 'center' });
      el.style.setProperty('visibility', 'hidden', 'important');
      const r = el.getBoundingClientRect();
      const x = Math.max(0, r.left), y = Math.max(0, r.top);
      return { x, y, width: Math.min(innerWidth, r.right) - x, height: Math.min(innerHeight, r.bottom) - y };
    }, p.i);
    await page.waitForTimeout(60);
    if (box.width >= 8 && box.height >= 8) {
      const spread = spreadOf(await page.screenshot({ clip: box }));
      if (spread < 14) flat.push({ what: p.what, spread });
    }
    await page.evaluate((i) => document.querySelector(`[data-df-glass="${i}"]`).style.removeProperty('visibility'), p.i);
  }
  await page.evaluate(() => scrollTo(0, 0));
  return flat;
}

// Installed before the page's own scripts: counts wheel listeners and canvas contexts, and watches the middle of the
// viewport for a counter on a fixed layer that covers it, and for the moment the page under it was ready.
function gateProbe() {
  const g = (window.__dfGate = { wheel: 0, contexts: 0, numbers: [], firstSeen: 0, lastSeen: 0, readyAt: 0 });
  const add = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (type, fn, opts) { if (type === 'wheel' || type === 'mousewheel') g.wheel++; return add.call(this, type, fn, opts); };
  const gc = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (...a) { g.contexts++; return gc.apply(this, a); };
  const fixedAncestor = (el) => { for (let n = el; n && n !== document.body; n = n.parentElement) if (getComputedStyle(n).position === 'fixed') return n; return null; };
  const t0 = performance.now();
  const poll = () => {
    const now = performance.now() - t0;
    if (now > 7000) return;
    if (document.body) {
      const layer = document.elementsFromPoint(innerWidth / 2, innerHeight / 2).map(fixedAncestor).find((n) => {
        if (!n) return false;
        const cs = getComputedStyle(n), r = n.getBoundingClientRect();
        return r.width * r.height >= innerWidth * innerHeight * 0.85 && +cs.opacity > 0.5 && cs.visibility !== 'hidden';
      });
      const m = layer && /(?:^|\D)(\d{1,3})\s*%?(?:\D|$)/.exec(layer.innerText || '');
      if (m) {
        if (!g.firstSeen) g.firstSeen = now;
        g.lastSeen = now;
        if (g.numbers[g.numbers.length - 1] !== m[1]) g.numbers.push(m[1]);
      }
      // Ready underneath: the headline laid out and showing, and every picture in the first screen decoded.
      const h1 = document.querySelector('h1');
      if (!g.readyAt && h1 && !fixedAncestor(h1)) {
        const r = h1.getBoundingClientRect(), cs = getComputedStyle(h1);
        const imgs = [...document.images].filter((i) => { const b = i.getBoundingClientRect(); return b.bottom > 0 && b.top < innerHeight && b.width > 0; });
        if (r.width > 0 && +cs.opacity > 0.5 && cs.visibility !== 'hidden' && imgs.every((i) => i.complete)) g.readyAt = now;
      }
    }
    setTimeout(poll, 100);
  };
  poll();
}

// A 32 x 20 grid of mean luminance: enough to tell a page that changed from one that did not.
async function signature(page) {
  const { width, height, channels, pixels } = decodePng(await page.screenshot({ type: 'png' }));
  const cells = new Float32Array(32 * 20), counts = new Uint32Array(32 * 20);
  for (let y = 0; y < height; y += 2) for (let x = 0; x < width; x += 2) {
    const o = (y * width + x) * channels, k = Math.floor((y / height) * 20) * 32 + Math.floor((x / width) * 32);
    cells[k] += channels >= 3 ? 0.2126 * pixels[o] + 0.7152 * pixels[o + 1] + 0.0722 * pixels[o + 2] : pixels[o]; counts[k]++;
  }
  return cells.map((v, k) => v / Math.max(1, counts[k]));
}
const changed = (a, b) => a.reduce((n, v, k) => n + (Math.abs(v - b[k]) > 16 ? 1 : 0), 0) / a.length;

async function motionGates(browser, target, report) {
  const context = await browser.newContext({ viewport: LAPTOP, reducedMotion: 'no-preference' });
  await context.addInitScript(gateProbe);
  try {
    const page = await context.newPage();
    const ok = await page.goto(target.url, { waitUntil: 'load', timeout: 45000 }).then(() => true, () => false);
    if (!ok) return;
    await page.waitForTimeout(7200);
    const s = await page.evaluate(() => ({ ...window.__dfGate, anims: document.getAnimations().length,
      scrollable: (document.scrollingElement || document.documentElement).scrollHeight > innerHeight + 2 })).catch(() => null);
    if (!s) return;

    if (s.anims > 150 || s.contexts >= 100) report('animation-storm', 'REFLEX', 0, s.anims > 150 ? `${s.anims} animations running at once` : `${s.contexts} canvas contexts asked for`);

    // A counter that counted (three values or more) over a page that was ready half a second before it went away.
    if (s.numbers.length >= 3 && s.readyAt && s.lastSeen - Math.max(s.readyAt, s.firstSeen) >= 500) {
      report('preloader-over-painted', 'REFLEX', 0, `a counter (${s.numbers[0]} to ${s.numbers[s.numbers.length - 1]}) covered the page until ${(s.lastSeen / 1000).toFixed(1)} s; the headline and first pictures were ready at ${(s.readyAt / 1000).toFixed(1)} s`);
    }

    // The wheel: only on a page that does not scroll and listens to the wheel. Keys on one fresh load, the wheel on
    // another; each against the same wait with no input, so an ambient loop is not taken for an answer.
    if (!s.scrollable && s.wheel > 0) {
      const trial = async (act) => {
        await page.goto(target.url, { waitUntil: 'load', timeout: 45000 });
        await page.waitForTimeout(1500);
        const a = await signature(page);
        await page.waitForTimeout(900);
        const b = await signature(page);
        await act();
        await page.waitForTimeout(900);
        const c = await signature(page);
        return { base: changed(a, b), moved: changed(b, c) };
      };
      const keys = await trial(async () => { await page.mouse.click(4, 4).catch(() => {}); for (const k of ['PageDown', 'ArrowDown', 'ArrowRight', 'Space']) { await page.keyboard.press(k); await page.waitForTimeout(150); } });
      const wheel = await trial(async () => { await page.mouse.move(LAPTOP.width / 2, LAPTOP.height / 2); for (let i = 0; i < 3; i++) { await page.mouse.wheel(0, 400); await page.waitForTimeout(150); } });
      const answered = (t) => t.moved > Math.max(0.08, t.base * 3 + 0.03);
      if (answered(wheel) && !answered(keys)) report('wheel-hijack', 'FAIL', 0, `the page does not scroll; the wheel changed ${Math.round(wheel.moved * 100)} % of the picture and PageDown, the arrows and Space changed ${Math.round(keys.moved * 100)} %`);
    }
  } finally {
    await context.close();
  }
}
