import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { launchBrowser } from '../scripts/lib/browser.mjs';
import { exportPresentation } from '../scripts/lib/export.mjs';
import { pngSize, pdfPageCount } from '../scripts/lib/image-meta.mjs';
import { hasWatermark } from '../scripts/lib/watermark.mjs';
import { copyPresentationFixture } from './helpers/presentation-fixture.mjs';

const SECTIONS = ['opening', 'concept', 'market', 'audience', 'logo-construction', 'logo-system', 'colour-type', 'mockups', 'site', 'closing'];
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const rel = (d) => walk(d).map((f) => path.relative(d, f).split(path.sep).join('/')).sort();
const png = (...p) => pngSize(fs.readFileSync(path.join(...p)));

let browser, marked, plain;
before(async () => {
  browser = await launchBrowser();
  marked = copyPresentationFixture();
  plain = copyPresentationFixture();
  await exportPresentation(marked.dir, 'text:Miolo & Filhos — São Paulo', { browser });
  await exportPresentation(plain.dir, 'none', { browser });
});
after(async () => {
  await browser?.close();
  marked?.cleanup();
  plain?.cleanup();
});

test('pngSize reads the IHDR chunk', () => {
  const buf = Buffer.alloc(33);
  Buffer.from('89504e470d0a1a0a', 'hex').copy(buf);
  buf.write('IHDR', 12, 'latin1');
  buf.writeUInt32BE(1920, 16);
  buf.writeUInt32BE(1080, 20);
  assert.deepEqual(pngSize(buf), { width: 1920, height: 1080 });
  assert.throws(() => pngSize(Buffer.from('not a png at all, not a png at all')));
});

test('pdfPageCount counts page objects, not the page tree', () => {
  const pdf = Buffer.from('<< /Type /Pages /Count 2 >> << /Type /Page >> << /Type /Page /Parent 1 0 R >>', 'latin1');
  assert.equal(pdfPageCount(pdf), 2);
});

test('final only when spec is none', () => {
  assert.ok(fs.existsSync(path.join(plain.dir, 'final', 'presentation.pdf')));
  assert.ok(!fs.existsSync(path.join(plain.dir, 'preview')));
  assert.ok(fs.existsSync(path.join(marked.dir, 'preview')));
});

test('slides are 1920x1080, one per section, named in order', () => {
  for (const mode of ['final', 'preview']) {
    const files = fs.readdirSync(path.join(marked.dir, mode, 'slides')).sort();
    assert.deepEqual(files, SECTIONS.map((s, i) => `${String(i + 1).padStart(2, '0')}-${s}.png`));
    for (const f of files) assert.deepEqual(png(marked.dir, mode, 'slides', f), { width: 1920, height: 1080 }, f);
  }
});

test('mockups are 3000px on the long side', () => {
  for (const mode of ['final', 'preview']) {
    const files = fs.readdirSync(path.join(marked.dir, mode, 'mockups')).sort();
    assert.deepEqual(files, ['card.png', 'poster.png']);
    for (const f of files) {
      const { width, height } = png(marked.dir, mode, 'mockups', f);
      assert.ok(Math.abs(Math.max(width, height) - 3000) <= 1, `${f}: ${width}x${height}`);
    }
  }
});

test('social sizes', () => {
  for (const mode of ['final', 'preview']) {
    assert.deepEqual(png(marked.dir, mode, 'social', 'square.png'), { width: 1080, height: 1080 });
    assert.deepEqual(png(marked.dir, mode, 'social', 'story.png'), { width: 1080, height: 1920 });
  }
});

test('PDF has one page per slide', () => {
  for (const mode of ['final', 'preview']) {
    assert.equal(pdfPageCount(fs.readFileSync(path.join(marked.dir, mode, 'presentation.pdf'))), SECTIONS.length, mode);
  }
});

test('preview has the layer, final does not, same file set', () => {
  const read = (m) => fs.readFileSync(path.join(marked.dir, m, 'presentation.html'), 'utf8');
  assert.ok(hasWatermark(read('preview')));
  assert.ok(!hasWatermark(read('final')));
  assert.deepEqual(rel(path.join(marked.dir, 'preview')), rel(path.join(marked.dir, 'final')));
});

test('exported html resolves relative assets through <base href="../">', () => {
  for (const mode of ['final', 'preview']) {
    const html = fs.readFileSync(path.join(marked.dir, mode, 'presentation.html'), 'utf8');
    assert.ok(html.includes('<base href="../">'), mode);
  }
});

test('the watermark is actually drawn into the preview slides, not the final ones', () => {
  const a = fs.readFileSync(path.join(marked.dir, 'preview', 'slides', '01-opening.png'));
  const b = fs.readFileSync(path.join(marked.dir, 'final', 'slides', '01-opening.png'));
  assert.notDeepEqual(a, b);
});

test('the author files are not modified', () => {
  assert.ok(!hasWatermark(fs.readFileSync(path.join(marked.dir, 'presentation.html'), 'utf8')));
});

test('a later export with spec none removes the stale preview/', async () => {
  const f = copyPresentationFixture();
  try {
    await exportPresentation(f.dir, 'text:Teste', { browser });
    assert.ok(fs.existsSync(path.join(f.dir, 'preview')));
    await exportPresentation(f.dir, 'none', { browser });
    assert.ok(!fs.existsSync(path.join(f.dir, 'preview')));
    assert.ok(fs.existsSync(path.join(f.dir, 'final', 'presentation.pdf')));
  } finally {
    f.cleanup();
  }
});

test('a section with its own inline height is still forced to 1080 (the checker, not the export, reports the overflow)', async () => {
  const f = copyPresentationFixture();
  try {
    const file = path.join(f.dir, 'presentation.html');
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace('<section data-section="opening">', '<section data-section="opening" style="height:1400px">'));
    await exportPresentation(f.dir, 'none', { browser });
    assert.deepEqual(png(f.dir, 'final', 'slides', '01-opening.png'), { width: 1920, height: 1080 });
  } finally {
    f.cleanup();
  }
});
