// Renders a presentation.html into slides, mockups, social artboards and a PDF.
// final/ is always written; preview/ (same files, watermark layer on top) only when a watermark is requested.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseWatermarkSpec, watermarkLayer, injectWatermark, imageDataUri } from './watermark.mjs';

const SLIDE = { width: 1920, height: 1080 };
const MOCKUP_LONG_SIDE = 3000;

// Injected at render time; the author's file is never edited.
// Social artboards keep their size even inside a flex row; they are not slides, so they stay out of the PDF.
export const EXPORT_CSS = `
section[data-section] { width: ${SLIDE.width}px !important; height: ${SLIDE.height}px !important; overflow: hidden !important; box-sizing: border-box; break-after: page; page-break-after: always; }
[data-social="square"] { flex: none; width: 1080px !important; height: 1080px !important; overflow: hidden !important; box-sizing: border-box; }
[data-social="story"] { flex: none; width: 1080px !important; height: 1920px !important; overflow: hidden !important; box-sizing: border-box; }
@page { size: ${SLIDE.width}px ${SLIDE.height}px; margin: 0; }
@media print { html, body { margin: 0 !important; } }
`;

const fail = (message) => { throw new Error(`export: ${message}`); };
const pad = (n) => String(n).padStart(2, '0');
const safeName = (s) => String(s).trim().replace(/[^\p{L}\p{N}._-]+/gu, '-').replace(/^-+|-+$/g, '');

// The saved HTML lives one folder down (final/ or preview/), so its relative urls get a '../' prefix.
// A <base href="../"> would do it in one line but also sends every #anchor to the folder above.
const INERT = /<!--[\s\S]*?-->|<script\b[\s\S]*?<\/script\s*>|<style\b[^>]*>[\s\S]*?<\/style\s*>/gi;
const isRelative = (u) => {
  const v = u.trim();
  return v !== '' && !/^([#?/]|[a-z][a-z0-9+.-]*:)/i.test(v) && !v.includes('{{');
};
const withPrefix = (u, prefix) => prefix + u.trim().replace(/^\.\//, '');
const prefixed = (u, prefix) => (isRelative(u) ? withPrefix(u, prefix) : u);
const cssUrls = (css, prefix) => css.replace(/url\(\s*(["']?)([^"')]+)\1\s*\)/gi, (m, q, u) => (isRelative(u) ? `url(${q}${withPrefix(u, prefix)}${q})` : m));
const ATTR = /(\s)(src|href|poster|data|action|formaction|xlink:href|srcset|imagesrcset|style)(\s*=\s*)("([^"]*)"|'([^']*)'|([^\s"'>]+))/gi;

function rewriteAttributes(markup, prefix) {
  return markup.replace(ATTR, (m, sp, name, eq, raw, dq, sq, bare) => {
    const value = dq ?? sq ?? bare;
    const quote = dq !== undefined ? '"' : sq !== undefined ? "'" : '';
    const key = name.toLowerCase();
    const next = key === 'style' ? cssUrls(value, prefix)
      : key.endsWith('srcset') ? value.split(',').map((c) => c.replace(/^(\s*)(\S+)/, (_, ws, u) => ws + prefixed(u, prefix))).join(',')
        : prefixed(value, prefix);
    return `${sp}${name}${eq}${quote}${next}${quote}`;
  });
}

export function rewriteRelativeUrls(html, prefix = '../') {
  let out = '';
  let last = 0;
  for (const m of html.matchAll(INERT)) {
    out += rewriteAttributes(html.slice(last, m.index), prefix);
    const seg = m[0];
    if (seg.startsWith('<!--')) out += seg;
    else if (/^<script/i.test(seg)) { // the tag's own attributes (src) change; the script text never does
      const end = seg.indexOf('>') + 1;
      out += rewriteAttributes(seg.slice(0, end), prefix) + seg.slice(end);
    } else {
      const end = seg.indexOf('>') + 1;
      out += seg.slice(0, end) + cssUrls(seg.slice(end), prefix);
    }
    last = m.index + seg.length;
  }
  return out + rewriteAttributes(html.slice(last), prefix);
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

async function openPage(browser, url, { width = SLIDE.width, height = SLIDE.height, scale = 1, layer, slidesOnly = false, imageTimeoutMs = 15000 } = {}) {
  // slidesOnly is the PDF render: print repeats a fixed layer on every page, so it keeps the saved fixed layer.
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, reducedMotion: 'reduce' });
  try {
    return await prepare(context, url, { layer, slidesOnly, imageTimeoutMs });
  } catch (err) {
    await context.close();
    throw err;
  }
}

async function prepare(context, url, { layer, slidesOnly, imageTimeoutMs }) {
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.addStyleTag({ content: EXPORT_CSS });
  await waitForAssets(page, imageTimeoutMs);
  if (slidesOnly) {
    // Hide each social artboard (together with the wrapper that exists only to hold it) so no extra page is printed.
    // An artboard inside a slide is hidden alone: climbing would hide the slide.
    await page.evaluate(() => {
      for (const el of document.querySelectorAll('[data-social]')) {
        if (el.closest('section[data-section]')) { el.style.display = 'none'; continue; }
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

async function renderAll({ browser, url, outDir, layer, imageTimeoutMs }) {
  const written = [];
  const out = (...p) => path.join(outDir, ...p);
  const put = (file, buf) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, buf); written.push(file); };

  // Slides, social artboards, and the element boxes mockups need.
  const main = await openPage(browser, url, { layer, imageTimeoutMs });
  const { sections, mockups, social } = await main.page.evaluate(() => ({
    sections: [...document.querySelectorAll('section[data-section]')].map((s) => s.dataset.section),
    mockups: [...document.querySelectorAll('[data-mockup]')].map((e, i) => {
      const r = e.getBoundingClientRect();
      return { label: e.dataset.mockup || `#${i + 1}`, name: e.dataset.mockup || `mockup-${i + 1}`, long: Math.max(r.width, r.height), box: `${r.width}×${r.height}` };
    }),
    social: ['square', 'story'].filter((k) => document.querySelector(`[data-social="${k}"]`)),
  }));
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
      put(out('slides', `${pad(i + 1)}-${safeName(name)}.png`), await main.page.locator('section[data-section]').nth(i).screenshot({ animations: 'disabled' }));
    }
    for (const kind of social) {
      put(out('social', `${kind}.png`), await main.page.locator(`[data-social="${kind}"]`).screenshot({ animations: 'disabled' }));
    }
  } finally {
    await main.context.close();
  }

  // Each mockup in its own context: deviceScaleFactor makes its long side 3000px.
  for (const [i, m] of mockups.entries()) {
    const shot = await openPage(browser, url, { scale: MOCKUP_LONG_SIDE / m.long, layer, imageTimeoutMs });
    put(out('mockups', m.file), await shot.page.locator('[data-mockup]').nth(i).screenshot({ animations: 'disabled' }));
    await shot.context.close();
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
