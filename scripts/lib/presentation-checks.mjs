// Checks for a selling-positioning presentation folder: markup contract, research counts, licence rows,
// preview/final split, export sizes, and a clean render. Pure parsers first, then runChecks().
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { licenceNeedsCredit } from './licence.mjs';
import { hasWatermark } from './watermark.mjs';
import { pngSize, pdfPageCount } from './image-meta.mjs';
import { EXPORT_CSS, HIDE_INNER_ARTBOARDS_CSS } from './export.mjs';

export const REQUIRED_SECTIONS = ['opening', 'concept', 'audience', 'logo-construction', 'logo-system', 'colour-type', 'mockups', 'site', 'closing'];
const MIN_BASE = 30;
const SLIDE = { width: 1920, height: 1080 };

// An unclosed comment runs to the end of the text, as it does in a browser and in Markdown renderers.
const stripComments = (s) => s.replace(/<!--[\s\S]*?(?:-->|$)/g, '');

// ---- HTML parsers (runChecks reads the rendered DOM; these are for plain strings) ----

// Only real <section> tags count: CSS selectors, script text and comments that mention data-section do not.
const sectionTags = (html) => [...stripComments(html)
  .replace(/<script\b[\s\S]*?<\/script\s*>/gi, '')
  .replace(/<style\b[\s\S]*?<\/style\s*>/gi, '')
  .matchAll(/<section\b[^>]*>/gi)].map((m) => m[0]);
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}(?:\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+)))?(?=[\\s/>])`, 'i'));
  return m ? (m[1] ?? m[2] ?? m[3] ?? '') : null;
};

const sectionNames = (html) => sectionTags(html).map((t) => attr(t, 'data-section')).filter((n) => n !== null);

export const missingFrom = (names) => REQUIRED_SECTIONS.filter((s) => !names.includes(s));
export const inOrder = (names) => {
  const seen = names.filter((n) => REQUIRED_SECTIONS.includes(n));
  return seen.length === REQUIRED_SECTIONS.length && seen.every((n, i) => n === REQUIRED_SECTIONS[i]);
};
export const missingSections = (html) => missingFrom(sectionNames(html));
export const sectionsInOrder = (html) => inOrder(sectionNames(html));

const isPending = (value) => value !== null && !/^(false|0)$/i.test(value);
export function sitePending(html) {
  const tag = sectionTags(html).find((t) => attr(t, 'data-section') === 'site');
  return !!tag && isPending(attr(tag, 'data-pending'));
}

// ---- research log ----

const URL_RE = /https?:\/\/[^\s)>\]|"'<]+/i;
const TRACKING = /^(utm_.*|fbclid|gclid|ref|ref_src|mc_.*)$/i;

// One page, one key: scheme, www, host case, tracking parameters, query order, fragment and trailing slash do not matter.
function normalUrl(raw) {
  const u = raw.replace(/[.,;:!?]+$/, '');
  try {
    const p = new URL(u);
    const params = [...p.searchParams].filter(([k]) => !TRACKING.test(k)).sort(([a, av], [b, bv]) => a.localeCompare(b) || av.localeCompare(bv));
    const query = new URLSearchParams(params).toString();
    return `${p.hostname.toLowerCase().replace(/^www\./, '')}${p.port ? `:${p.port}` : ''}${p.pathname.replace(/\/+$/, '')}${query ? `?${query}` : ''}`;
  } catch {
    return u.replace(/\/+$/, '');
  }
}

const headingKey = (text) => text.toLowerCase().replace(/[*_`]/g, '')
  .replace(/\s*[([][^)\]]*[)\]]\s*$/, '')
  .replace(/\s*[-–—:]\s*\d+\s*$/, '')
  .replace(/\s+/g, ' ').trim();

// ## and ### headings split the log. Code fences are skipped whole, so an example inside one is never read as content.
function logSections(md) {
  const sections = {};
  let current = null;
  let fence = false;
  for (const line of stripComments(md).split(/\r?\n/)) {
    if (/^\s{0,3}(```|~~~)/.test(line)) { fence = !fence; continue; }
    if (fence) continue;
    const h = line.match(/^ {0,3}#{1,3}\s+(.+?)\s*#*\s*$/);
    if (h) {
      current = headingKey(h[1]);
      sections[current] ??= [];
    } else if (current) {
      sections[current].push(line);
    }
  }
  return sections;
}

// Top-level items only: 0–1 spaces of indent, `-`, `*`, `+`, `1.` or `1)`. Nested bullets are details, not entries.
const listItems = (lines) => lines.map((l) => l.match(/^ {0,1}(?:[-*+]|\d{1,3}[.)])\s+(\S.*)$/)).filter(Boolean).map((m) => m[1]);
const uniqueUrls = (lines) => new Set(listItems(lines).map((i) => i.match(URL_RE)?.[0]).filter(Boolean).map(normalUrl)).size;

const BASES = [['behance', 'Behance cases'], ['mockups', 'Mockup candidates']];

// `- <Base name>: <N> — <reason>`: one line per short base, the reason at least three words.
function parseShortfalls(lines) {
  const found = {};
  for (const item of listItems(lines)) {
    const m = item.replace(/[*_`]/g, '').match(/^(behance cases|mockup candidates)\s*:\s*(\d+)\s*[—–:-]\s*(.+)$/i);
    if (!m || m[3].split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length < 3) continue;
    const key = BASES.find(([, label]) => label.toLowerCase() === m[1].toLowerCase())[0];
    found[key] = { count: Number(m[2]), reason: m[3].trim() };
  }
  return found;
}

// Counts unique URLs in the two research bases and reads the Shortfall lines. Market research is not asked for any more:
// a ## Market brands or ## Perceptual map section, if one is there, is ignored.
// HTML comments are removed first, so the template's instructions never count as content.
export function parseResearchLog(md) {
  const s = logSections(md);
  const shortfalls = parseShortfalls(s.shortfall ?? []);
  return {
    behance: uniqueUrls(s['behance cases'] ?? []),
    mockups: uniqueUrls(s['mockup candidates'] ?? []),
    shortfall: Object.keys(shortfalls).length > 0,
    shortfalls,
  };
}

export function researchFailures(log) {
  const failures = [];
  for (const [key, label] of BASES) {
    if (log[key] >= MIN_BASE) continue;
    const sf = log.shortfalls?.[key];
    if (!sf) failures.push(`${label}: ${log[key]} unique URLs, ${MIN_BASE} needed; or add "- ${label}: ${log[key]} — <reason>" under ## Shortfall`);
    else if (sf.count !== log[key]) failures.push(`${label}: Shortfall says ${sf.count} but the log has ${log[key]} unique URLs`);
  }
  return failures;
}

// ---- assets.md ----

// A table `| file | source URL | licence | … |`. The file cell is a path relative to the presentation folder.
const normalFileCell = (cell) => {
  const c = cell.replace(/[`<>]/g, '').replace(/\\/g, '/').replace(/^\.\//, '').trim();
  try { return decodeURI(c); } catch { return c; }
};
export function parseAssetRows(md) {
  return stripComments(md).split(/\r?\n/)
    .filter((l) => /^\s*\|/.test(l))
    .map((l) => l.trim().replace(/^\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.trim()))
    .filter((cells) => !cells.every((c) => /^:?-{2,}:?$/.test(c)))
    .map((cells) => ({ file: normalFileCell(cells[0] ?? ''), source: cells[1] ?? '', licence: cells[2] ?? '' }));
}

// ---- command line ----

const FLAGS = ['--offline', '--after-gate'];
export function parseCheckArgs(argv) {
  const out = { dir: undefined, offline: false, afterGate: false, watermark: undefined };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--offline') out.offline = true;
    else if (a === '--after-gate') out.afterGate = true;
    else if (a === '--watermark' || a.startsWith('--watermark=')) {
      const value = a === '--watermark' ? argv[++i] : a.slice('--watermark='.length);
      if (!value || value.startsWith('--')) throw new Error('--watermark needs a value: none or a watermark spec');
      out.watermark = value;
    } else if (a.startsWith('--')) {
      throw new Error(`unknown option ${a} (known: ${[...FLAGS, '--watermark <spec|none>'].join(', ')})`);
    } else if (out.dir === undefined) out.dir = a;
    else throw new Error(`unexpected extra argument: ${a}`);
  }
  if (out.dir === undefined) throw new Error('missing <presentation-dir>');
  return out;
}

// ---- runChecks ----

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const relFiles = (d) => walk(d).map((f) => path.relative(d, f).split(path.sep).join('/')).sort();
const pad = (n) => String(n).padStart(2, '0');
const posix = (p) => p.split(path.sep).join('/');

const ACTION_TIMEOUT_MS = 120000; // a busy machine is slow, not wrong

// Layout, overflow and captures are judged at rest, as the export sees the page: window.__DF_EXPORT__ keeps the
// slideshow runtime off. checkSlideshow() below is the one place that runs without it.
async function renderRaw(browser, file, width, height) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
  context.setDefaultTimeout(ACTION_TIMEOUT_MS);
  await context.addInitScript(() => { window.__DF_EXPORT__ = true; });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('requestfailed', (r) => errors.push(`failed: ${r.url()}`));
  await page.goto(pathToFileURL(file).href, { waitUntil: 'load' });
  await page.evaluate(() => document.querySelectorAll('img[loading]').forEach((i) => { i.loading = 'eager'; }));
  await page.evaluate(() => Promise.race([
    Promise.all([document.fonts?.ready, ...[...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; })))]),
    new Promise((r) => setTimeout(r, 8000)),
  ]));
  return { page, context, errors };
}

// Every raster a [data-mockup] shows: <img>, SVG <image>, and the background of the element, its descendants and their
// ::before / ::after. Computed styles serialise a background as url("…") with the address already resolved.
function collectMockupSources() {
  const out = [];
  document.querySelectorAll('[data-mockup]').forEach((m, i) => {
    const sources = [];
    for (const n of [m, ...m.querySelectorAll('*')]) {
      if (n instanceof HTMLImageElement) sources.push(n.currentSrc || n.src);
      if (n instanceof SVGImageElement && n.href?.baseVal) sources.push(new URL(n.href.baseVal, document.baseURI).href);
      for (const pseudo of [null, '::before', '::after']) {
        for (const mm of getComputedStyle(n, pseudo).backgroundImage.matchAll(/url\("((?:[^"\\]|\\.)*)"\)/g)) sources.push(mm[1].replace(/\\(.)/g, '$1'));
      }
    }
    out.push({ label: m.dataset.mockup || `#${i + 1}`, sources: sources.filter(Boolean) });
  });
  return out;
}

// The slideshow as a viewer gets it: no export flag. Exactly one slide in focus; the arrow keys, the hash and the next
// button move it; with reduced motion every [data-reveal] is open at once.
async function checkSlideshow(browser, file, width, height) {
  const url = pathToFileURL(file).href;
  const visible = (page) => page.evaluate(() => [...document.querySelectorAll('section[data-section]')]
    .map((s, i) => [i + 1, getComputedStyle(s)]).filter(([, st]) => st.visibility === 'visible' && Number(st.opacity) > 0.99).map(([n]) => n));
  const settle = async (page, expected, step) => {
    try {
      await page.waitForFunction((want) => {
        const shown = [...document.querySelectorAll('section[data-section]')]
          .map((s, i) => [i + 1, getComputedStyle(s)]).filter(([, st]) => st.visibility === 'visible' && Number(st.opacity) > 0.99).map(([n]) => n);
        return shown.length === 1 && shown[0] === want;
      }, expected, { timeout: 15000 });
    } catch {
      throw new Error(`${step}: expected only slide ${expected} in view, got [${(await visible(page)).join(', ')}]`);
    }
  };
  const open = async (context, hash = '') => {
    const page = await context.newPage();
    await page.goto(url + hash, { waitUntil: 'load' });
    if (!(await page.evaluate(() => !!window.__DF_SLIDESHOW__ && document.documentElement.classList.contains('df-slideshow')))) {
      throw new Error('the slideshow runtime did not start (copy templates/slideshow.js and slideshow.css next to presentation.html and link them)');
    }
    return page;
  };
  const context = await browser.newContext({ viewport: { width, height } });
  const reduced = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
  context.setDefaultTimeout(ACTION_TIMEOUT_MS);
  reduced.setDefaultTimeout(ACTION_TIMEOUT_MS);
  try {
    const page = await open(context);
    await settle(page, 1, 'at load');
    await page.keyboard.press('ArrowRight');
    await settle(page, 2, 'ArrowRight');
    if (!(await page.evaluate(() => window.location.hash)).endsWith('#slide-2')) throw new Error('ArrowRight did not set #slide-2');
    await page.keyboard.press('ArrowLeft');
    await settle(page, 1, 'ArrowLeft');
    await page.click('.df-next');
    await settle(page, 2, 'the next button');
    const count = await page.evaluate(() => window.__DF_SLIDESHOW__.count);
    const last = await open(context, `#slide-${count}`);
    await settle(last, count, `#slide-${count}`);
    const quick = await open(reduced);
    const shut = await quick.evaluate(() => [...document.querySelectorAll('[data-reveal]')].filter((el) => getComputedStyle(el).clipPath !== 'none').length);
    if (shut) throw new Error(`reduced motion: ${shut} [data-reveal] element(s) still masked`);
    await settle(quick, 1, 'reduced motion');
    return '';
  } catch (err) {
    return err.message;
  } finally {
    await context.close();
    await reduced.close();
  }
}

const isVector = (src) => /^data:image\/svg/i.test(src) || /\.svg([?#]|$)/i.test(src);

export async function runChecks(dir, { offline = false, afterGate = false, browser, watermark } = {}) {
  const results = [];
  const check = (name, ok, detail = '') => results.push({ name, ok, detail });
  const root = path.resolve(dir);
  const file = path.join(root, 'presentation.html');

  const exists = fs.existsSync(file);
  check('presentation.html exists', exists);
  if (!exists) return results;

  // 1920 with the export CSS: the sections and artboards as the export will see them, and slide overflow.
  const slides = await renderRaw(browser, file, SLIDE.width, SLIDE.height);
  await slides.page.addStyleTag({ content: EXPORT_CSS + HIDE_INNER_ARTBOARDS_CSS });
  const expected = await slides.page.evaluate(({ sw, sh }) => {
    const site = document.querySelector('section[data-section="site"]');
    return {
      sections: [...document.querySelectorAll('section[data-section]')].map((s) => ({ name: s.dataset.section, over: s.scrollHeight > sh || s.scrollWidth > sw, box: `${s.scrollWidth}×${s.scrollHeight}` })),
      sitePending: site ? site.getAttribute('data-pending') : null,
      mockups: document.querySelectorAll('[data-mockup]').length,
      social: ['square', 'story'].filter((k) => document.querySelector(`[data-social="${k}"]`)),
    };
  }, { sw: SLIDE.width, sh: SLIDE.height });
  await slides.context.close();

  // Markup contract, read from the rendered DOM
  const names = expected.sections.map((s) => s.name);
  const missing = missingFrom(names);
  check('nine sections present, in order', missing.length === 0 && inOrder(names),
    missing.length ? `missing: ${missing.join(', ')}` : inOrder(names) ? '' : `found: ${names.join(', ')}`);
  if (afterGate) check('site section is filled (not marked pending)', !isPending(expected.sitePending));
  const overflowing = expected.sections.filter((s) => s.over);
  check('slide overflow: every section fits 1920×1080', overflowing.length === 0, overflowing.map((s) => `${s.name} is ${s.box}`).join(', '));

  // Research log
  const logFile = path.join(root, 'research-log.md');
  check('research-log.md exists', fs.existsSync(logFile));
  if (fs.existsSync(logFile)) {
    const log = parseResearchLog(fs.readFileSync(logFile, 'utf8'));
    const failures = researchFailures(log);
    check('research-log.md: Behance cases and Mockup candidates, 30 each (or a Shortfall)', failures.length === 0,
      failures.join(' | ') || `behance ${log.behance}, mockups ${log.mockups}${log.shortfall ? ', shortfall stated' : ''}`);
  }

  // Render at 1440 and 390: errors, scroll, images; at 1440 also the photos inside the mockups
  let mockups = [];
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const { page, context, errors } = await renderRaw(browser, file, w, h);
    const info = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      imgs: [...document.images].map((i) => ({ src: i.currentSrc || i.src, ok: i.complete && i.naturalWidth > 0 })),
    }));
    if (w === 1440) mockups = await page.evaluate(collectMockupSources);
    const label = `presentation.html @${w}`;
    check(`${label}: no page errors or failed requests`, errors.length === 0, errors.join(' | '));
    check(`${label}: no horizontal scroll`, info.sw <= w, `scrollWidth ${info.sw}`);
    check(`${label}: every image loaded`, info.imgs.every((i) => i.ok), info.imgs.filter((i) => !i.ok).map((i) => i.src.slice(0, 120)).join(', '));
    await context.close();
    const problem = await checkSlideshow(browser, file, w, h);
    check(`${label}: slideshow works`, problem === '', problem);
  }

  // Mockup photos must be local files in this folder; each is recorded with a source URL and a licence that needs no credit.
  const used = new Map(); // relative path -> label
  const notLocal = [];
  for (const m of mockups) {
    for (const src of m.sources.filter((s) => !isVector(s))) {
      const rel = src.startsWith('file:') ? posix(path.relative(root, fileURLToPath(src))) : null;
      if (rel === null) notLocal.push(`[data-mockup="${m.label}"]: ${src.startsWith('data:') ? 'data: URI' : src.slice(0, 80)}`);
      else if (rel.startsWith('..') || path.isAbsolute(rel)) notLocal.push(`[data-mockup="${m.label}"]: ${rel} is outside the presentation folder`);
      else if (/^(final|preview)\//.test(rel)) notLocal.push(`[data-mockup="${m.label}"]: ${rel} is inside the export folder`);
      else used.set(rel, m.label);
    }
  }
  if (mockups.length) check('mockup photo must be a local file in the presentation folder', notLocal.length === 0, notLocal.join(' | '));

  if (used.size) {
    const assetsFile = ['assets.md', 'asset.md'].map((f) => path.join(root, f)).find((f) => fs.existsSync(f));
    check('assets.md exists', !!assetsFile);
    const rows = assetsFile ? parseAssetRows(fs.readFileSync(assetsFile, 'utf8')) : [];
    for (const rel of used.keys()) {
      const row = rows.find((r) => r.file === rel);
      check(`${rel}: recorded in assets.md`, !!row);
      const url = (row?.source.match(/https?:\/\/[^\s|)>]+/) || [])[0];
      check(`${rel}: source URL recorded`, !!url, url || '');
      check(`${rel}: licence recorded and needs no credit`, !!row && row.licence.trim() !== '' && !licenceNeedsCredit(row.licence), row?.licence.slice(0, 160) ?? '');
      if (url && !offline) {
        let code = 0;
        try { code = (await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 Chrome/130' }, signal: AbortSignal.timeout(20000) })).status; } catch { code = -1; }
        check(`${rel}: source page answers`, code > 0 && (code < 400 || [401, 403, 429].includes(code)), `HTTP ${code}`);
      }
    }
  }

  // preview/ and final/
  const finalDir = path.join(root, 'final');
  const previewDir = path.join(root, 'preview');
  const hasPreview = fs.existsSync(previewDir);
  if (watermark === 'none') check('no preview/ when watermark=none', !hasPreview);
  else if (watermark !== undefined) check('preview/ exists (watermark requested)', hasPreview);

  const htmlIn = (d) => (fs.existsSync(d) ? walk(d).filter((f) => /\.html?$/i.test(f)) : []);
  const modes = [];
  if (!fs.existsSync(finalDir)) check('final/ exists (run export-presentation.mjs)', false);
  else modes.push(['final', finalDir]);
  if (hasPreview && watermark !== 'none') modes.push(['preview', previewDir]);

  if (fs.existsSync(finalDir)) {
    const bad = htmlIn(finalDir).filter((f) => hasWatermark(fs.readFileSync(f, 'utf8')));
    check('final/: no html has the watermark layer', bad.length === 0, bad.map((f) => path.relative(root, f)).join(', '));
  }
  if (hasPreview && watermark !== 'none') {
    const pages = htmlIn(previewDir);
    const bare = pages.filter((f) => !hasWatermark(fs.readFileSync(f, 'utf8')));
    check('preview/: every html has the watermark layer', pages.length > 0 && bare.length === 0, bare.map((f) => path.relative(root, f)).join(', ') || (pages.length ? '' : 'no html in preview/'));
    if (fs.existsSync(finalDir)) {
      const a = relFiles(previewDir);
      const b = relFiles(finalDir);
      const diff = [...a.filter((f) => !b.includes(f)).map((f) => `only in preview/: ${f}`), ...b.filter((f) => !a.includes(f)).map((f) => `only in final/: ${f}`)];
      check('preview/ and final/ hold the same file set', diff.length === 0, diff.join(', '));
    }
  }

  // Export sizes and PDF, per mode
  for (const [mode, d] of modes) {
    const sizeOf = (f) => { try { return pngSize(fs.readFileSync(f)); } catch { return null; } };
    const list = (sub) => (fs.existsSync(path.join(d, sub)) ? fs.readdirSync(path.join(d, sub)).filter((f) => f.endsWith('.png')).sort() : []);

    const wantSlides = names.map((n, i) => `${pad(i + 1)}-${n}.png`);
    const gotSlides = list('slides');
    const slideBad = wantSlides.filter((f) => !gotSlides.includes(f)).map((f) => `missing ${f}`)
      .concat(gotSlides.filter((f) => !wantSlides.includes(f)).map((f) => `unexpected ${f}`))
      .concat(gotSlides.filter((f) => wantSlides.includes(f)).filter((f) => { const s = sizeOf(path.join(d, 'slides', f)); return !s || s.width !== SLIDE.width || s.height !== SLIDE.height; }).map((f) => `${f} is not 1920×1080`));
    check(`${mode}/: every slide is 1920×1080, one per section`, slideBad.length === 0, slideBad.join(', '));

    const files = list('mockups');
    const mockBad = files.length === expected.mockups ? [] : [`${files.length} files for ${expected.mockups} [data-mockup] elements`];
    for (const f of files) {
      const s = sizeOf(path.join(d, 'mockups', f));
      if (!s || Math.abs(Math.max(s.width, s.height) - 3000) > 1) mockBad.push(`${f} is ${s ? `${s.width}×${s.height}` : 'not a PNG'}`);
    }
    check(`${mode}/: every mockup is 3000px on the long side`, mockBad.length === 0, mockBad.join(', '));

    const socialBad = [];
    for (const [kind, w, h] of [['square', 1080, 1080], ['story', 1080, 1920]]) {
      if (!expected.social.includes(kind)) continue;
      const f = path.join(d, 'social', `${kind}.png`);
      const s = fs.existsSync(f) ? sizeOf(f) : null;
      if (!s || s.width !== w || s.height !== h) socialBad.push(`${kind}.png is ${s ? `${s.width}×${s.height}` : 'missing'}, expected ${w}×${h}`);
    }
    check(`${mode}/: social posts are 1080×1080 and 1080×1920`, socialBad.length === 0, socialBad.join(', '));

    const pdf = path.join(d, 'presentation.pdf');
    const pages = fs.existsSync(pdf) ? pdfPageCount(fs.readFileSync(pdf)) : 0;
    check(`${mode}/: PDF has one page per slide`, pages === names.length && names.length > 0, `${pages} pages for ${names.length} sections`);
  }
  return results;
}
