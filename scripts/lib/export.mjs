// Renders a presentation.html into slides, mockups, social artboards and a PDF.
// final/ is always written; preview/ (same files, watermark layer on top) only when a watermark is requested.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseWatermarkSpec, watermarkLayer, injectWatermark } from './watermark.mjs';

const SLIDE = { width: 1920, height: 1080 };
const MOCKUP_LONG_SIDE = 3000;
const IMAGE_MIME = { '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' };

// Injected at render time; the author's file is never edited.
// Social artboards keep their size even inside a flex row; they are not slides, so they stay out of the PDF.
const EXPORT_CSS = `
section[data-section] { width: ${SLIDE.width}px; height: ${SLIDE.height}px; overflow: hidden; box-sizing: border-box; break-after: page; page-break-after: always; }
[data-social="square"] { flex: none; width: 1080px; height: 1080px; overflow: hidden; box-sizing: border-box; }
[data-social="story"] { flex: none; width: 1080px; height: 1920px; overflow: hidden; box-sizing: border-box; }
@page { size: ${SLIDE.width}px ${SLIDE.height}px; margin: 0; }
@media print { html, body { margin: 0 !important; } }
`;

const pad = (n) => String(n).padStart(2, '0');
const safeName = (s) => String(s).trim().replace(/[^\p{L}\p{N}._-]+/gu, '-').replace(/^-+|-+$/g, '');

function imageDataUri(file, dir) {
  const found = [path.resolve(file), path.resolve(dir, file)].find((p) => fs.existsSync(p));
  if (!found) throw new Error(`watermark image not found: ${file}`);
  const mime = IMAGE_MIME[path.extname(found).toLowerCase()];
  if (!mime) throw new Error(`watermark image type not supported: ${found}`);
  return `data:${mime};base64,${fs.readFileSync(found).toString('base64')}`;
}

// The saved HTML lives one folder down (final/ or preview/), so it needs <base href="../"> to find the author's assets.
function savedHtml(source, layer) {
  let html = source;
  if (!/<base[\s>]/i.test(html)) {
    html = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => `${m}<base href="../">`) : `<base href="../">${html}`;
  }
  return layer ? injectWatermark(html, layer) : html;
}

async function openPage(browser, url, { width = SLIDE.width, height = SLIDE.height, scale = 1, layer, slidesOnly = false } = {}) {
  // slidesOnly is the PDF render: print repeats a fixed layer on every page, so it keeps the saved fixed layer.
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: scale, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'load' });
  await page.addStyleTag({ content: EXPORT_CSS });
  await page.evaluate(() => document.fonts?.ready);
  await page.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; })))));
  if (slidesOnly) {
    // Hide each social artboard together with the wrapper that exists only to hold it, so no extra page is printed.
    await page.evaluate(() => {
      for (const el of document.querySelectorAll('[data-social]')) {
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

async function renderAll({ browser, url, outDir, layer }) {
  const written = [];
  const out = (...p) => path.join(outDir, ...p);
  const put = (file, buf) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, buf); written.push(file); };

  // Slides, social artboards, and the element boxes mockups need.
  const main = await openPage(browser, url, { layer });
  const { sections, mockups, social } = await main.page.evaluate(() => ({
    sections: [...document.querySelectorAll('section[data-section]')].map((s) => s.dataset.section),
    mockups: [...document.querySelectorAll('[data-mockup]')].map((e, i) => {
      const r = e.getBoundingClientRect();
      return { name: e.dataset.mockup || `mockup-${i + 1}`, long: Math.max(r.width, r.height) };
    }),
    social: ['square', 'story'].filter((k) => document.querySelector(`[data-social="${k}"]`)),
  }));
  for (const [i, name] of sections.entries()) {
    put(out('slides', `${pad(i + 1)}-${safeName(name)}.png`), await main.page.locator('section[data-section]').nth(i).screenshot({ animations: 'disabled' }));
  }
  for (const kind of social) {
    put(out('social', `${kind}.png`), await main.page.locator(`[data-social="${kind}"]`).screenshot({ animations: 'disabled' }));
  }
  await main.context.close();

  // Each mockup in its own context: deviceScaleFactor makes its long side 3000px.
  for (const [i, m] of mockups.entries()) {
    const shot = await openPage(browser, url, { scale: MOCKUP_LONG_SIDE / m.long, layer });
    put(out('mockups', `${safeName(m.name) || `mockup-${i + 1}`}.png`), await shot.page.locator('[data-mockup]').nth(i).screenshot({ animations: 'disabled' }));
    await shot.context.close();
  }

  const doc = await openPage(browser, url, { layer, slidesOnly: true });
  put(out('presentation.pdf'), await doc.page.pdf({ width: `${SLIDE.width}px`, height: `${SLIDE.height}px`, printBackground: true, preferCSSPageSize: true }));
  await doc.context.close();
  return written;
}

export async function exportPresentation(dir, spec, { browser }) {
  const parsed = parseWatermarkSpec(spec);
  const file = path.resolve(dir, 'presentation.html');
  const source = fs.readFileSync(file, 'utf8');
  const url = pathToFileURL(file).href;
  const layer = parsed ? watermarkLayer(parsed, parsed.type === 'image+text' ? { imageDataUri: imageDataUri(parsed.image, dir) } : {}) : null;

  const outputs = [];
  for (const mode of parsed ? ['final', 'preview'] : ['final']) {
    const outDir = path.resolve(dir, mode);
    fs.rmSync(outDir, { recursive: true, force: true });
    fs.mkdirSync(outDir, { recursive: true });
    const withLayer = mode === 'preview' ? layer : null;
    const html = path.join(outDir, 'presentation.html');
    fs.writeFileSync(html, savedHtml(source, withLayer));
    outputs.push(html, ...(await renderAll({ browser, url, outDir, layer: withLayer })));
  }
  return { outputs };
}
