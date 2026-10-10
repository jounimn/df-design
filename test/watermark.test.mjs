import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  parseWatermarkSpec, textPatternSvg, watermarkLayer, injectWatermark, stripWatermark, hasWatermark,
} from '../scripts/lib/watermark.mjs';

const cli = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'scripts', 'watermark.mjs');
const html = '<html><body><h1>Oi</h1></body></html>';
const spec = parseWatermarkSpec('text:Miolo & Filhos — São "P" <x>');

test('round trip is byte-identical', () => {
  assert.equal(stripWatermark(injectWatermark(html, watermarkLayer(spec, {}))), html);
});
test('double injection leaves one layer', () => {
  const l = watermarkLayer(spec, {});
  const twice = injectWatermark(injectWatermark(html, l), l);
  assert.equal(twice.match(/data-df-watermark/g).length, 1);
});
test('uppercase BODY and missing body both work', () => {
  for (const h of ['<BODY>x</BODY>', '<p>x</p>']) {
    const out = injectWatermark(h, watermarkLayer(spec, {}));
    assert.ok(hasWatermark(out));
    assert.equal(stripWatermark(out), h);
  }
});
test('layer goes before the last closing body tag', () => {
  const out = injectWatermark('<body>a</BODY><!-- </body> --><body>b</Body>', watermarkLayer(spec, {}));
  assert.ok(out.endsWith('</Body>'));
  assert.ok(out.indexOf('<!--df-watermark-->') > out.lastIndexOf('<body>'));
});
test('special characters are escaped in the SVG', () => {
  const svg = textPatternSvg('A & <b> "c"', 0.12);
  assert.ok(svg.includes('A &amp; &lt;b&gt; &quot;c&quot;'));
});
test('special characters cannot break out of the style attribute', () => {
  const l = watermarkLayer(spec, {});
  const style = l.match(/style="([^"]*)"/);
  assert.ok(style, 'style attribute is one well-formed double-quoted value');
  assert.ok(l.endsWith('></div>') || l.endsWith('</div>'));
  const url = style[1].match(/url\('([^']*)'\)/);
  assert.ok(url, 'url() holds a single-quoted value with no raw quotes inside');
  const svg = decodeURIComponent(url[1].replace(/^data:image\/svg\+xml,/, ''));
  assert.ok(svg.includes('Miolo &amp; Filhos — São &quot;P&quot; &lt;x&gt;'));
});
test('layer is fixed, full viewport, click-through, top-most', () => {
  const l = watermarkLayer(spec, {});
  for (const s of ['position:fixed', 'inset:0', 'pointer-events:none', 'z-index:2147483647']) assert.ok(l.replace(/\s/g, '').includes(s), s);
});
test('opacity default 0.12; out of range throws', () => {
  assert.equal(spec.opacity, 0.12);
  assert.throws(() => parseWatermarkSpec('text:x@0.5'));
  assert.throws(() => parseWatermarkSpec('text:x@0.05'));
  assert.equal(parseWatermarkSpec('text:x@0.1').opacity, 0.1);
});
test('image+text puts the text pattern underneath', () => {
  const s = parseWatermarkSpec('image+text:logo.svg|Studio');
  assert.deepEqual([s.type, s.image, s.text], ['image+text', 'logo.svg', 'Studio']);
  const l = watermarkLayer(s, { imageDataUri: 'data:image/svg+xml;base64,AAAA' });
  assert.ok(l.indexOf('data:image/svg+xml;base64,AAAA') < l.lastIndexOf('data:image/svg+xml'));
  const urls = [...l.matchAll(/url\('([^']*)'\)/g)].map((m) => decodeURIComponent(m[1]));
  assert.equal(urls.length, 2);
  assert.ok(urls[0].includes('base64,AAAA'), 'image first (on top)');
  assert.ok(urls[1].includes('<text') && urls[1].includes('Studio'), 'text pattern last (underneath)');
});
test('image+text without an image data uri throws', () => {
  assert.throws(() => watermarkLayer(parseWatermarkSpec('image+text:logo.svg|Studio'), {}));
});
test('none parses to null', () => assert.equal(parseWatermarkSpec('none'), null));
test('unknown spec throws', () => assert.throws(() => parseWatermarkSpec('banana')));

test('CLI copies the tree and injects the layer into every html', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wm apresentação '));
  try {
    const src = path.join(tmp, 'src');
    const out = path.join(tmp, 'out');
    fs.mkdirSync(path.join(src, 'img'), { recursive: true });
    fs.writeFileSync(path.join(src, 'a.html'), html);
    fs.writeFileSync(path.join(src, 'img', 'x.png'), Buffer.from([1, 2, 3]));
    execFileSync(process.execPath, [cli, src, 'text:Studio X', out]);
    assert.ok(hasWatermark(fs.readFileSync(path.join(out, 'a.html'), 'utf8')));
    assert.ok(fs.existsSync(path.join(out, 'img', 'x.png')));
    assert.equal(fs.readFileSync(path.join(src, 'a.html'), 'utf8'), html);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
test('CLI embeds the image file as a data uri', () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'wm-img-'));
  try {
    const src = path.join(tmp, 'src');
    fs.mkdirSync(src);
    fs.writeFileSync(path.join(src, 'a.html'), html);
    fs.writeFileSync(path.join(tmp, 'logo.svg'), '<svg xmlns="http://www.w3.org/2000/svg"/>');
    execFileSync(process.execPath, [cli, src, `image+text:${path.join(tmp, 'logo.svg')}|Studio`, path.join(tmp, 'out')]);
    const out = fs.readFileSync(path.join(tmp, 'out', 'a.html'), 'utf8');
    assert.ok(decodeURIComponent(out).includes('data:image/svg+xml;base64,'));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});
