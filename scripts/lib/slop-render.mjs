// The render tier of check-slop: opens each page in Playwright and settles the gates only a browser can judge.
// Gate ids and tiers: GATES in slop-static.mjs (render: true), documented in references/gates.md.
// Modelled on Hallmark's sloplint-render (github.com/nutlope/hallmark, MIT), rewritten for Playwright.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { launchBrowser, settle } from './browser.mjs';
import { GATES } from './slop-static.mjs';

const WIDTHS = [320, 390, 768, 1024, 1440, 1920];
const FOLD = { width: 1280, height: 800 };
const LAPTOP = { width: 1440, height: 900 };
const WIDE = { width: 1920, height: 1080 };
const PHONE = { width: 390, height: 844 };
const MAX_TABS = 30;

const rel = (f) => (f && f.startsWith(process.cwd()) ? f.slice(process.cwd().length + 1) : f);
const trunc = (s, n) => (s && s.length > n ? s.slice(0, n - 1) + '…' : s);
const slugOf = (target) => target.replace(/^https?:\/\//, '').replace(/\.html?$/i, '').replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '').slice(-60) || 'page';

export async function renderCheck({ pages = [], urls = [], scope = 'page', out = null, browser: given = null } = {}) {
  const targets = [...pages.map((p) => ({ url: pathToFileURL(path.resolve(p)).href, label: rel(path.resolve(p)) })), ...urls.map((u) => ({ url: u, label: u }))];
  const findings = [];
  const screenshots = [];
  if (!targets.length) return { findings, rendered: 0, screenshots };
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
      await checkPage(browser, t, dir, report, screenshots);
    }
  } finally {
    if (!given) await browser.close();
  }
  return { findings, rendered: targets.length, screenshots: screenshots.map(rel) };
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

  // 6. The phone, full page.
  {
    const { page, context } = await open(browser, target.url, { viewport: PHONE });
    await scrollThrough(page);
    const shot = path.join(dir, 'full-390.png');
    await page.screenshot({ path: shot, fullPage: true });
    screenshots.push(shot);
    await context.close();
  }
}
