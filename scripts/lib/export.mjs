// Renders a presentation.html into slides, mockups, social artboards and a PDF.
// final/ is always written; preview/ (same files, watermark layer on top) only when a watermark is requested.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseWatermarkSpec, watermarkLayer, injectWatermark, imageDataUri } from './watermark.mjs';

const SLIDE = { width: 1920, height: 1080 };
const MOCKUP_LONG_SIDE = 3000;
// A screenshot first waits for its element to hold still across animation frames, which a busy machine delays well past
// Playwright's 30 s default. Slow is fine; a hang is caught by the image and load timeouts instead.
const ACTION_TIMEOUT_MS = 180000;

// Injected at render time; the author's file is never edited.
// Social artboards keep their size even inside a flex row; they are not slides, so they stay out of the PDF.
export const EXPORT_CSS = `
section[data-section] { width: ${SLIDE.width}px !important; height: ${SLIDE.height}px !important; overflow: hidden !important; min-height: 0 !important; max-height: none !important; box-sizing: border-box; break-after: page; page-break-after: always; }
[data-social="square"] { flex: none; width: 1080px !important; height: 1080px !important; overflow: hidden !important; box-sizing: border-box; }
[data-social="story"] { flex: none; width: 1080px !important; height: 1920px !important; overflow: hidden !important; box-sizing: border-box; }
@page { size: ${SLIDE.width}px ${SLIDE.height}px; margin: 0; }
@media print { html, body { margin: 0 !important; } }
`;

// A social artboard that sits inside a slide is not part of the slide: out of the slide PNG, the PDF and the overflow measure.
export const HIDE_INNER_ARTBOARDS_CSS = 'section[data-section] [data-social] { display: none !important; }';

// For an artboard's own screenshot: hide everything but the artboard, its ancestors and the watermark layer, and let the
// ancestors stop clipping it, so an artboard bigger than its slide is captured whole and nothing overlaps it.
const ARTBOARD_SHOT_CSS = `
[data-df-anc][data-df-anc] { overflow: visible !important; }
body :not([data-df-anc]):not([data-df-art]):not([data-df-art] *):not([data-df-watermark]) { visibility: hidden !important; }
`;

// A mockup's PNG is the mockup and nothing behind it: besides the artboard rules above, whatever the ancestors paint
// (background, a ::before / ::after picture, border-image, mask, shadow) is switched off, so a section background or a
// frame layer behind a transparent mockup does not end up in the file. The checker reads the mockup's own sources only.
const MOCKUP_SHOT_CSS = `${ARTBOARD_SHOT_CSS}
[data-df-anc] { background: none !important; border-image: none !important; box-shadow: none !important; -webkit-mask: none !important; mask: none !important; }
[data-df-anc]::before, [data-df-anc]::after { display: none !important; }
`;

const fail = (message) => { throw new Error(`export: ${message}`); };
const pad = (n) => String(n).padStart(2, '0');
const safeName = (s) => String(s).trim().replace(/[^\p{L}\p{N}._-]+/gu, '-').replace(/^-+|-+$/g, '');

// The saved HTML lives one folder down (final/ or preview/), so its relative urls get a '../' prefix.
// A <base href="../"> would do it in one line but also sends every #anchor to the folder above.
//
// Only real tags are rewritten: text in <p>, <textarea> or <title>, script bodies and comments are left alone.
// An author's own <base href> already moves every relative url, so then only that href is prefixed.
const ATTRS = String.raw`(?:"[^"]*"|'[^']*'|[^'">])*`;
const TOKEN = new RegExp(
  String.raw`(?<comment><!--[\s\S]*?(?:-->|$))`
  + String.raw`|<(?<raw>script|style|textarea|title)\b(?<rattrs>${ATTRS})>(?<body>[\s\S]*?)(?<close><\/\k<raw>\s*>|$)`
  + String.raw`|<(?<name>[a-zA-Z][^\s/>]*)(?<attrs>${ATTRS})>`,
  'gi',
);
const ATTR = /(\s)([^\s"'<>/=]+)(\s*=\s*)("([^"]*)"|'([^']*)'|([^\s"'>]+))/g;

const NAMED = { quot: '"', amp: '&', lt: '<', gt: '>', apos: "'", nbsp: ' ' };
const decodeEntities = (s) => s.replace(/&(?:#(\d+)|#x([0-9a-f]+)|([a-z]+));/gi, (m, dec, hex, name) =>
  (dec ? String.fromCodePoint(Number(dec)) : hex ? String.fromCodePoint(parseInt(hex, 16)) : (NAMED[name.toLowerCase()] ?? m)));
const encodeAttr = (s, quote) => s.replace(/&/g, '&amp;').replace(quote === "'" ? /'/g : /"/g, quote === "'" ? '&#39;' : '&quot;');

const isRelative = (u) => {
  const v = u.trim();
  return v !== '' && !/^([#?/]|[a-z][a-z0-9+.-]*:)/i.test(v) && !v.includes('{{');
};
const withPrefix = (u, prefix) => prefix + u.trim().replace(/^\.\//, '');
const prefixed = (u, prefix) => (isRelative(decodeEntities(u)) ? withPrefix(u, prefix) : u);
// image-set("a.png" 1x, url(b.png) 2x type("image/png")): the bare strings are urls too. url() and type() inside the set are
// left alone here (the url() rule below prefixes the first). The closing paren is found by counting, not by the first ")".
function imageSets(css, prefix) {
  let out = '';
  let i = 0;
  for (;;) {
    const at = css.slice(i).search(/image-set\(/i);
    if (at < 0) return out + css.slice(i);
    const open = i + at + css.slice(i + at).indexOf('(') + 1;
    let depth = 1;
    let quote = '';
    let j = open;
    for (; j < css.length && depth > 0; j++) {
      const c = css[j];
      if (quote) { if (c === '\\') j++; else if (c === quote) quote = ''; } else if (c === '"' || c === "'") quote = c;
      else if (c === '(') depth++;
      else if (c === ')') depth--;
    }
    const inner = css.slice(open, depth === 0 ? j - 1 : j);
    const fixed = inner.replace(/(?:url|type)\([^)]*\)|(["'])([^"']+)\1/g, (part, q, u) => (q && isRelative(u) ? q + withPrefix(u, prefix) + q : part));
    out += css.slice(i, open) + fixed + (depth === 0 ? ')' : '');
    i = j;
  }
}
const cssUrls = (css, prefix) => imageSets(css, prefix)
  .replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi, (m, q, u) => (isRelative(u) ? `url(${q}${withPrefix(u, prefix)}${q})` : m))
  .replace(/@import\s+(["'])([^"']+)\1/gi, (m, q, u) => (isRelative(u) ? `@import ${q}${withPrefix(u, prefix)}${q}` : m));

// The urls of a srcset, in order. Same scanner as rewriteSrcset below, so "a.png 1x,b.png 2x" (no space after the comma) reads as two.
export function srcsetUrls(value) {
  const urls = [];
  let i = 0;
  while (i < value.length) {
    while (i < value.length && /[\s,]/.test(value[i])) i++;
    if (i >= value.length) break;
    let k = i;
    while (k < value.length && !/\s/.test(value[k])) k++;
    let url = value.slice(i, k);
    const trailing = /^data:/i.test(url) ? '' : (url.match(/,+$/)?.[0] ?? '');
    if (trailing) url = url.slice(0, -trailing.length);
    if (url) urls.push(url);
    i = k;
    if (trailing) continue;
    let depth = 0;
    while (i < value.length && !(value[i] === ',' && depth === 0)) {
      if (value[i] === '(') depth++;
      if (value[i] === ')') depth--;
      i++;
    }
  }
  return urls;
}

// srcset: candidates are `url [descriptor]` separated by commas. A url runs to the next whitespace, so commas inside it
// ("img.jpg?w=100,200", a whole data: uri) stay; commas at its end separate candidates.
function rewriteSrcset(value, prefix) {
  let out = '';
  let i = 0;
  while (i < value.length) {
    let j = i;
    while (j < value.length && /[\s,]/.test(value[j])) j++;
    out += value.slice(i, j);
    i = j;
    if (i >= value.length) break;
    let k = i;
    while (k < value.length && !/\s/.test(value[k])) k++;
    let url = value.slice(i, k);
    const trailing = /^data:/i.test(url) ? '' : (url.match(/,+$/)?.[0] ?? '');
    if (trailing) url = url.slice(0, -trailing.length);
    out += prefixed(url, prefix) + trailing;
    i = k;
    if (trailing) continue;
    let d = i;
    let depth = 0;
    while (d < value.length && !(value[d] === ',' && depth === 0)) {
      if (value[d] === '(') depth++;
      if (value[d] === ')') depth--;
      d++;
    }
    out += value.slice(i, d);
    i = d;
  }
  return out;
}

const URL_ATTRS = new Set(['src', 'href', 'poster', 'action', 'formaction', 'xlink:href']);
const LEGACY_BACKGROUND = new Set(['body', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th']);

function rewriteAttributes(tagName, attrs, prefix, { onlyHref = false } = {}) {
  const tag = tagName.toLowerCase();
  return attrs.replace(ATTR, (m, space, name, eq, raw, dq, sq, bare) => {
    const key = name.toLowerCase();
    const value = dq ?? sq ?? bare;
    const quote = dq !== undefined ? '"' : sq !== undefined ? "'" : '';
    if (onlyHref && key !== 'href') return m;
    let next;
    if (key === 'style') {
      const decoded = decodeEntities(value);
      const css = cssUrls(decoded, prefix);
      if (css === decoded) return m;
      const q = quote || '"';
      return `${space}${name}${eq}${q}${encodeAttr(css, q)}${q}`;
    }
    if (key === 'srcset' || key === 'imagesrcset') next = rewriteSrcset(value, prefix);
    else if (URL_ATTRS.has(key) || (key === 'data' && tag === 'object') || (key === 'background' && LEGACY_BACKGROUND.has(tag))) next = prefixed(value, prefix);
    else return m;
    if (next === value) return m;
    const q = quote || '"';
    return `${space}${name}${eq}${q}${next}${q}`;
  });
}

export function rewriteRelativeUrls(html, prefix = '../') {
  const hasBase = [...html.matchAll(TOKEN)].some((m) => m.groups.name?.toLowerCase() === 'base' && /\shref\s*=/i.test(m.groups.attrs));
  return html.replace(TOKEN, (m, ...rest) => {
    const g = rest.at(-1);
    if (g.comment !== undefined) return m;
    if (g.raw !== undefined) {
      if (hasBase) return m;
      const tag = g.raw.toLowerCase();
      const open = `<${g.raw}${rewriteAttributes(tag, g.rattrs, prefix)}>`;
      return `${open}${tag === 'style' ? cssUrls(g.body, prefix) : g.body}${g.close}`;
    }
    const isBase = g.name.toLowerCase() === 'base';
    if (hasBase && !isBase) return m;
    return `<${g.name}${rewriteAttributes(g.name, g.attrs, prefix, { onlyHref: hasBase })}>`;
  });
}

function savedHtml(source, layer) {
  const html = rewriteRelativeUrls(source, '../');
  return layer ? injectWatermark(html, layer) : html;
}

// Lazy images below the fold never load on their own, and a stalled one would stall the export for good.
async function waitForAssets(page, timeoutMs) {
  const { done, pending } = await page.evaluate(async (ms) => {
    document.querySelectorAll('img[loading]').forEach((i) => { i.loading = 'eager'; });
    const loaded = Promise.all([document.fonts?.ready, ...[...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; })))]).then(() => true);
    const ok = await Promise.race([loaded, new Promise((r) => setTimeout(() => r(false), ms))]);
    return { done: ok, pending: ok ? [] : [...document.images].filter((i) => !i.complete).map((i) => i.currentSrc || i.src) };
  }, timeoutMs);
  if (!done) throw new Error(`export: ${pending.length ? `${pending.length} image(s)` : 'fonts'} did not load within ${timeoutMs}ms${pending.length ? `: ${pending.join(', ')}` : ''}`);
}

async function openPage(browser, url, { width = SLIDE.width, height = SLIDE.height, scale = 1, layer, slidesOnly = false, artboard = false, imageTimeoutMs = 15000 } = {}) {
  // slidesOnly is the PDF render: print repeats a fixed layer on every page, so it keeps the saved fixed layer.
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, reducedMotion: 'reduce' });
  context.setDefaultTimeout(ACTION_TIMEOUT_MS);
  try {
    // The slideshow runtime (templates/slideshow.js) must not start: every section stays laid out at rest for capture.
    await context.addInitScript(() => { window.__DF_EXPORT__ = true; });
    return await prepare(context, url, { layer, slidesOnly, artboard, imageTimeoutMs });
  } catch (err) {
    await context.close();
    throw err;
  }
}

async function prepare(context, url, { layer, slidesOnly, artboard, imageTimeoutMs }) {
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.addStyleTag({ content: artboard ? EXPORT_CSS : EXPORT_CSS + HIDE_INNER_ARTBOARDS_CSS });
  await waitForAssets(page, imageTimeoutMs);
  // `load` also waits for CSS backgrounds, stylesheets and frames, which the image and font waits above do not see.
  await page.waitForLoadState('load', { timeout: imageTimeoutMs }).catch(() => fail(`the page did not finish loading within ${imageTimeoutMs}ms; a stylesheet, script, frame or CSS background is still pending`));
  if (slidesOnly) {
    // Hide each artboard outside the slides together with the wrapper that exists only to hold it, so no extra page is printed.
    await page.evaluate(() => {
      for (const el of document.querySelectorAll('[data-social]')) {
        if (el.closest('section[data-section]')) continue;
        let n = el;
        while (n.parentElement && n.parentElement !== document.body && !n.parentElement.querySelector('section[data-section]')) n = n.parentElement;
        n.style.display = 'none';
      }
      // A page break after the last slide would push whatever follows (the watermark layer) onto an extra page.
      const all = document.querySelectorAll('section[data-section]');
      if (all.length) all[all.length - 1].style.setProperty('break-after', 'auto', 'important');
    });
  }
  if (layer) {
    // The saved HTML keeps the layer fixed to the viewport. Element screenshots can be larger than the viewport,
    // so for those the same layer is stretched over the whole document instead.
    await page.evaluate(([html, stretch]) => {
      const w = document.documentElement.scrollWidth;
      const h = document.documentElement.scrollHeight;
      document.body.insertAdjacentHTML('beforeend', html);
      const el = document.querySelector('[data-df-watermark]');
      if (!stretch) return;
      el.style.position = 'absolute';
      el.style.inset = '0 auto auto 0';
      el.style.width = `${w}px`;
      el.style.height = `${h}px`;
    }, [layer, !slidesOnly]);
  }
  return { page, context };
}

// An element screenshot grows the box to whole pixels, so an element at x=10.4 comes out a pixel or two too large, and a clip
// with a fractional size is cut down to whole CSS pixels before the scale is applied. So the clip is a whole number of CSS
// pixels (the nearest to the element's own size) starting at the element's exact corner; whole sizes times the scale are exact.
async function shootBox(page, locator) {
  const box = await locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return { x: r.x + window.scrollX, y: r.y + window.scrollY, width: Math.round(r.width), height: Math.round(r.height) };
  });
  return page.screenshot({ clip: box, fullPage: true, animations: 'disabled' });
}

async function renderAll({ browser, url, outDir, layer, imageTimeoutMs }) {
  const written = [];
  const out = (...p) => path.join(outDir, ...p);
  const put = (file, buf) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, buf); written.push(file); };

  // Slides, social artboards, and the element boxes mockups need.
  const main = await openPage(browser, url, { layer, imageTimeoutMs });
  const { sections, social } = await main.page.evaluate(() => ({
    sections: [...document.querySelectorAll('section[data-section]')].map((s) => s.dataset.section),
    social: ['square', 'story'].filter((k) => document.querySelector(`[data-social="${k}"]`)),
  }));
  // Mockups are measured with inner artboards shown: a mockup inside an artboard inside a slide is still a mockup.
  const measure = await openPage(browser, url, { artboard: true, imageTimeoutMs });
  let mockups;
  try {
    mockups = await measure.page.evaluate(() => [...document.querySelectorAll('[data-mockup]')].map((e, i) => {
      const r = e.getBoundingClientRect();
      return { label: e.dataset.mockup || `#${i + 1}`, name: e.dataset.mockup || `mockup-${i + 1}`, long: Math.max(Math.round(r.width), Math.round(r.height)), box: `${r.width}×${r.height}`, inArtboard: !!e.closest('[data-social]') };
    }));
  } finally {
    await measure.context.close();
  }
  try {
    // Fail before writing anything when a mockup cannot be exported or two would overwrite each other.
    const files = new Map();
    for (const [i, m] of mockups.entries()) {
      if (!(m.long > 0)) fail(`[data-mockup="${m.label}"] has no visible size (${m.box}); a hidden or empty mockup cannot be exported`);
      m.file = `${safeName(m.name) || `mockup-${i + 1}`}.png`;
      if (files.has(m.file)) fail(`more than one [data-mockup] would write mockups/${m.file} ("${files.get(m.file)}" and "${m.label}"); give each a unique name`);
      files.set(m.file, m.label);
    }
    for (const [i, name] of sections.entries()) {
      put(out('slides', `${pad(i + 1)}-${safeName(name)}.png`), await shootBox(main.page, main.page.locator('section[data-section]').nth(i)));
    }
  } finally {
    await main.context.close();
  }

  for (const kind of social) {
    const shot = await openPage(browser, url, { layer, artboard: true, imageTimeoutMs });
    try {
      const art = shot.page.locator(`[data-social="${kind}"]`);
      await art.evaluate((el) => {
        el.setAttribute('data-df-art', '');
        for (let n = el.parentElement; n && n !== document.documentElement; n = n.parentElement) n.setAttribute('data-df-anc', '');
      });
      await shot.page.addStyleTag({ content: ARTBOARD_SHOT_CSS });
      put(out('social', `${kind}.png`), await shootBox(shot.page, art));
    } finally {
      await shot.context.close();
    }
  }

  // Each mockup in its own context: deviceScaleFactor makes its long side 3000px.
  for (const [i, m] of mockups.entries()) {
    const shot = await openPage(browser, url, { scale: MOCKUP_LONG_SIDE / m.long, layer, artboard: true, imageTimeoutMs });
    try {
      const el = shot.page.locator('[data-mockup]').nth(i);
      // The mockup alone: its ancestors stop clipping and painting (it may be bigger than the slide that holds it), the rest is hidden.
      await el.evaluate((e) => {
        e.setAttribute('data-df-art', '');
        for (let n = e.parentElement; n && n !== document.documentElement; n = n.parentElement) n.setAttribute('data-df-anc', '');
      });
      await shot.page.addStyleTag({ content: MOCKUP_SHOT_CSS });
      put(out('mockups', m.file), await shootBox(shot.page, el));
    } finally {
      await shot.context.close();
    }
  }

  const doc = await openPage(browser, url, { layer, slidesOnly: true, imageTimeoutMs });
  put(out('presentation.pdf'), await doc.page.pdf({ width: `${SLIDE.width}px`, height: `${SLIDE.height}px`, printBackground: true, preferCSSPageSize: true }));
  await doc.context.close();
  return written;
}

export async function exportPresentation(dir, spec, { browser, imageTimeoutMs = 15000 }) {
  const parsed = parseWatermarkSpec(spec);
  const file = path.resolve(dir, 'presentation.html');
  const source = fs.readFileSync(file, 'utf8');
  const url = pathToFileURL(file).href;
  const layer = parsed ? watermarkLayer(parsed, parsed.type === 'image+text' ? { imageDataUri: imageDataUri(parsed.image, dir) } : {}) : null;

  const outputs = [];
  // A later export without a watermark must not leave an older preview/ behind.
  if (!parsed) fs.rmSync(path.resolve(dir, 'preview'), { recursive: true, force: true });
  for (const mode of parsed ? ['final', 'preview'] : ['final']) {
    const outDir = path.resolve(dir, mode);
    fs.rmSync(outDir, { recursive: true, force: true });
    fs.mkdirSync(outDir, { recursive: true });
    const withLayer = mode === 'preview' ? layer : null;
    const html = path.join(outDir, 'presentation.html');
    fs.writeFileSync(html, savedHtml(source, withLayer));
    outputs.push(html, ...(await renderAll({ browser, url, outDir, layer: withLayer, imageTimeoutMs })));
  }
  return { outputs };
}
