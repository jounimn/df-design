// Checks for a selling-positioning presentation folder: markup contract, research counts, licence rows,
// preview/final split, export sizes, and a clean render. Pure parsers first, then runChecks().
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { licenceNeedsCredit } from './licence.mjs';
import { hasWatermark } from './watermark.mjs';
import { pngSize, pdfPageCount } from './image-meta.mjs';
import { EXPORT_CSS } from './export.mjs';

export const REQUIRED_SECTIONS = ['opening', 'concept', 'market', 'audience', 'logo-construction', 'logo-system', 'colour-type', 'mockups', 'site', 'closing'];
const MIN_BASE = 30;
const MAP_RANGE = [8, 12];
const SLIDE = { width: 1920, height: 1080 };

const stripComments = (s) => s.replace(/<!--[\s\S]*?-->/g, '');

// ---- pure parsers ----

const sectionNames = (html) => [...stripComments(html).matchAll(/data-section\s*=\s*["']?([\w-]+)/g)].map((m) => m[1]);

export function missingSections(html) {
  const found = new Set(sectionNames(html));
  return REQUIRED_SECTIONS.filter((s) => !found.has(s));
}

export function sectionsInOrder(html) {
  const seen = sectionNames(html).filter((n) => REQUIRED_SECTIONS.includes(n));
  return seen.length === REQUIRED_SECTIONS.length && seen.every((n, i) => n === REQUIRED_SECTIONS[i]);
}

export function sitePending(html) {
  const tag = stripComments(html).match(/<section\b[^>]*data-section\s*=\s*["']?site["']?[^>]*>/i);
  return !!tag && /\sdata-pending\b/i.test(tag[0]);
}

const URL_RE = /https?:\/\/[^\s)>\]|"'<]+/i;
const normalUrl = (raw) => {
  const u = raw.replace(/[.,;:!?]+$/, '');
  try {
    const parsed = new URL(u);
    parsed.hash = '';
    return parsed.href.replace(/\/+$/, '');
  } catch {
    return u.replace(/\/+$/, '');
  }
};

// Level 1 and 2 headings split the log; deeper headings stay in their section's body.
function logSections(md) {
  const sections = {};
  let current = null;
  for (const line of stripComments(md).split(/\r?\n/)) {
    const h = line.match(/^#{1,2}\s+(.+?)\s*#*\s*$/);
    if (h) {
      current = h[1].trim().toLowerCase();
      sections[current] ??= [];
    } else if (current) {
      sections[current].push(line);
    }
  }
  return sections;
}

const listItems = (lines) => lines.map((l) => l.match(/^\s{0,3}[-*+]\s+(\S.*)$/)).filter(Boolean).map((m) => m[1]);
const uniqueUrls = (lines) => new Set(listItems(lines).map((i) => i.match(URL_RE)?.[0]).filter(Boolean).map(normalUrl)).size;

// Counts unique URLs in the three research bases, list items in the map, and whether a Shortfall states something.
// HTML comments are removed first, so the template's instructions never count as content.
export function parseResearchLog(md) {
  const s = logSections(md);
  return {
    behance: uniqueUrls(s['behance cases'] ?? []),
    market: uniqueUrls(s['market brands'] ?? []),
    mockups: uniqueUrls(s['mockup candidates'] ?? []),
    mapBrands: listItems(s['perceptual map'] ?? []).length,
    shortfall: (s.shortfall ?? []).join('\n').trim().length > 0,
  };
}

export function researchFailures(log) {
  const failures = [];
  for (const [key, label] of [['behance', 'Behance cases'], ['market', 'Market brands'], ['mockups', 'Mockup candidates']]) {
    if (log[key] < MIN_BASE && !log.shortfall) failures.push(`${label}: ${log[key]} unique URLs, ${MIN_BASE} needed (or a non-empty ## Shortfall)`);
  }
  if (log.mapBrands < MAP_RANGE[0] || log.mapBrands > MAP_RANGE[1]) failures.push(`Perceptual map: ${log.mapBrands} brands, ${MAP_RANGE[0]}–${MAP_RANGE[1]} needed`);
  return failures;
}

// ---- runChecks ----

const RASTER = /\.(jpe?g|png|webp|avif|gif)$/i;
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const relFiles = (d) => walk(d).map((f) => path.relative(d, f).split(path.sep).join('/')).sort();
const pad = (n) => String(n).padStart(2, '0');

async function renderRaw(browser, file, width, height) {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
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

export async function runChecks(dir, { offline = false, afterGate = false, browser, watermark } = {}) {
  const results = [];
  const check = (name, ok, detail = '') => results.push({ name, ok, detail });
  const file = path.resolve(dir, 'presentation.html');

  const exists = fs.existsSync(file);
  check('presentation.html exists', exists);
  if (!exists) return results;
  const html = fs.readFileSync(file, 'utf8');

  // Markup contract
  const missing = missingSections(html);
  check('ten sections present, in order', missing.length === 0 && sectionsInOrder(html),
    missing.length ? `missing: ${missing.join(', ')}` : sectionsInOrder(html) ? '' : `found: ${sectionNames(html).join(', ')}`);
  if (afterGate) check('site section is filled (not marked pending)', !sitePending(html));

  // Research log
  const logFile = path.join(dir, 'research-log.md');
  check('research-log.md exists', fs.existsSync(logFile));
  if (fs.existsSync(logFile)) {
    const log = parseResearchLog(fs.readFileSync(logFile, 'utf8'));
    const failures = researchFailures(log);
    check('research-log.md: bases of 30 (or a Shortfall) and a map of 8–12', failures.length === 0,
      failures.join(' | ') || `behance ${log.behance}, market ${log.market}, mockups ${log.mockups}, map ${log.mapBrands}${log.shortfall ? ', shortfall stated' : ''}`);
  }

  // Render: 1440 and 390 for errors, scroll and images; 1920 with the export CSS for slide overflow and what to expect from the export
  const used = new Set();
  for (const [w, h] of [[1440, 900], [390, 844]]) {
    const { page, context, errors } = await renderRaw(browser, file, w, h);
    const info = await page.evaluate(() => ({
      sw: document.documentElement.scrollWidth,
      imgs: [...document.images].map((i) => ({ src: i.currentSrc || i.src, ok: i.complete && i.naturalWidth > 0 })),
      bg: [...document.querySelectorAll('*')].map((e) => getComputedStyle(e).backgroundImage).filter((b) => b.includes('url(')),
    }));
    const label = `presentation.html @${w}`;
    check(`${label}: no page errors or failed requests`, errors.length === 0, errors.join(' | '));
    check(`${label}: no horizontal scroll`, info.sw <= w, `scrollWidth ${info.sw}`);
    check(`${label}: every image loaded`, info.imgs.every((i) => i.ok), info.imgs.filter((i) => !i.ok).map((i) => i.src).join(', '));
    const urls = [...info.imgs.map((i) => i.src), ...info.bg.flatMap((b) => [...b.matchAll(/url\("?([^")]+)"?\)/g)].map((m) => m[1]))];
    for (const u of urls) {
      if (!u.startsWith('file:')) continue;
      const local = fileURLToPath(u);
      const rel = path.relative(path.resolve(dir), local);
      if (!rel.startsWith('..') && !path.isAbsolute(rel) && !/^(final|preview)[\\/]/.test(rel) && RASTER.test(local)) used.add(local);
    }
    await context.close();
  }

  const slides = await renderRaw(browser, file, SLIDE.width, SLIDE.height);
  await slides.page.addStyleTag({ content: EXPORT_CSS });
  const expected = await slides.page.evaluate(({ sw, sh }) => ({
    sections: [...document.querySelectorAll('section[data-section]')].map((s) => ({ name: s.dataset.section, over: s.scrollHeight > sh || s.scrollWidth > sw, box: `${s.scrollWidth}×${s.scrollHeight}` })),
    mockups: document.querySelectorAll('[data-mockup]').length,
    social: ['square', 'story'].filter((k) => document.querySelector(`[data-social="${k}"]`)),
  }), { sw: SLIDE.width, sh: SLIDE.height });
  await slides.context.close();
  const overflowing = expected.sections.filter((s) => s.over);
  check('slide overflow: every section fits 1920×1080', overflowing.length === 0, overflowing.map((s) => `${s.name} is ${s.box}`).join(', '));

  // Mockup photos: recorded, with a source URL and a licence that needs no credit
  if (used.size) {
    const assetsFile = ['assets.md', 'asset.md'].map((f) => path.join(dir, f)).find((f) => fs.existsSync(f));
    check('assets.md exists', !!assetsFile);
    const records = assetsFile ? fs.readFileSync(assetsFile, 'utf8') : '';
    for (const local of used) {
      const base = path.basename(local);
      const row = records.split('\n').find((l) => l.includes(base)) || '';
      check(`${base}: recorded`, row.length > 0);
      const url = (row.match(/https?:\/\/[^\s|)>]+/) || [])[0];
      check(`${base}: source URL recorded`, !!url, url || '');
      check(`${base}: licence is not CC BY / credit-required`, row.length > 0 && !licenceNeedsCredit(row), row.slice(0, 160));
      if (url && !offline) {
        let code = 0;
        try { code = (await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'Mozilla/5.0 Chrome/130' }, signal: AbortSignal.timeout(20000) })).status; } catch { code = -1; }
        check(`${base}: source page answers`, code > 0 && (code < 400 || [401, 403, 429].includes(code)), `HTTP ${code}`);
      }
    }
  }

  // preview/ and final/
  const finalDir = path.join(dir, 'final');
  const previewDir = path.join(dir, 'preview');
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
    if (hasPreview || (watermark !== undefined && watermark !== 'none')) {
      check('final/: no html has the watermark layer', bad.length === 0, bad.map((f) => path.relative(dir, f)).join(', '));
    }
  }
  if (hasPreview && watermark !== 'none') {
    const pages = htmlIn(previewDir);
    const bare = pages.filter((f) => !hasWatermark(fs.readFileSync(f, 'utf8')));
    check('preview/: every html has the watermark layer', pages.length > 0 && bare.length === 0, bare.map((f) => path.relative(dir, f)).join(', ') || (pages.length ? '' : 'no html in preview/'));
    if (fs.existsSync(finalDir)) {
      const a = relFiles(previewDir);
      const b = relFiles(finalDir);
      const diff = [...a.filter((f) => !b.includes(f)).map((f) => `only in preview/: ${f}`), ...b.filter((f) => !a.includes(f)).map((f) => `only in final/: ${f}`)];
      check('preview/ and final/ hold the same file set', diff.length === 0, diff.join(', '));
    }
  }

  // Export sizes and PDF, per mode
  const names = expected.sections.map((s) => s.name);
  for (const [mode, d] of modes) {
    const sizeOf = (f) => { try { return pngSize(fs.readFileSync(f)); } catch { return null; } };
    const list = (sub) => (fs.existsSync(path.join(d, sub)) ? fs.readdirSync(path.join(d, sub)).filter((f) => f.endsWith('.png')).sort() : []);

    const wantSlides = names.map((n, i) => `${pad(i + 1)}-${n}.png`);
    const gotSlides = list('slides');
    const slideBad = wantSlides.filter((f) => !gotSlides.includes(f)).map((f) => `missing ${f}`)
      .concat(gotSlides.filter((f) => !wantSlides.includes(f)).map((f) => `unexpected ${f}`))
      .concat(gotSlides.filter((f) => wantSlides.includes(f)).filter((f) => { const s = sizeOf(path.join(d, 'slides', f)); return !s || s.width !== SLIDE.width || s.height !== SLIDE.height; }).map((f) => `${f} is not 1920×1080`));
    check(`${mode}/: every slide is 1920×1080, one per section`, slideBad.length === 0, slideBad.join(', '));

    const mockups = list('mockups');
    const mockBad = mockups.length === expected.mockups ? [] : [`${mockups.length} files for ${expected.mockups} [data-mockup] elements`];
    for (const f of mockups) {
      const s = sizeOf(path.join(d, 'mockups', f));
      if (!s || Math.abs(Math.max(s.width, s.height) - 3000) > 1) mockBad.push(`${f} is ${s ? `${s.width}×${s.height}` : 'not a PNG'}`);
    }
    check(`${mode}/: every mockup is 3000px on the long side`, mockBad.length === 0, mockBad.join(', '));

    const socialBad = [];
    for (const [kind, w, h] of [['square', 1080, 1080], ['story', 1080, 1920]]) {
      const present = expected.social.includes(kind);
      const f = path.join(d, 'social', `${kind}.png`);
      if (!present) continue;
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
