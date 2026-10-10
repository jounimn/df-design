// Protective watermark: a fixed, click-through layer injected into HTML, and stripped back out byte-for-byte.
// Spec strings: 'none' | 'text:Studio X' | 'image+text:path/logo.svg|Studio X', each with an optional '@0.1' opacity suffix.
import fs from 'node:fs';
import path from 'node:path';

export const DEFAULT_OPACITY = 0.12;
export const MIN_OPACITY = 0.08;
export const MAX_OPACITY = 0.15;

const OPEN = '<!--df-watermark-->';
const CLOSE = '<!--/df-watermark-->';
const BLOCK = /<!--df-watermark-->[\s\S]*?<!--\/df-watermark-->/g;

export function parseWatermarkSpec(s) {
  const raw = String(s).trim();
  if (raw === 'none') return null;
  let opacity = DEFAULT_OPACITY;
  let body = raw;
  // Only a number shaped like an opacity (0.1, .1, 0, 1) after the last @ is a suffix; "Room@2" stays text.
  const suffix = raw.match(/@(0?\.\d+|[01](?:\.\d+)?)$/);
  if (suffix) {
    opacity = Number(suffix[1]);
    body = raw.slice(0, suffix.index).trimEnd();
  }
  if (!(opacity >= MIN_OPACITY && opacity <= MAX_OPACITY)) {
    throw new Error(`watermark opacity ${opacity} (read from the trailing "@${suffix[1]}") is outside ${MIN_OPACITY}–${MAX_OPACITY}; if "@${suffix[1]}" is part of the text, add a character after it`);
  }
  if (body.startsWith('text:')) {
    const text = body.slice('text:'.length).trim();
    if (!text.trim()) throw new Error('watermark text is empty');
    return { type: 'text', text, opacity };
  }
  if (body.startsWith('image+text:')) {
    const rest = body.slice('image+text:'.length);
    // First |, because Windows paths cannot contain one and the text may.
    const bar = rest.indexOf('|');
    const image = bar < 0 ? '' : rest.slice(0, bar).trim();
    const text = bar < 0 ? '' : rest.slice(bar + 1).trim();
    if (!image || !text.trim()) throw new Error('image+text needs <image>|<text>');
    return { type: 'image+text', image, text, opacity };
  }
  throw new Error(`unknown watermark spec: ${raw}`);
}

const xmlEscape = (t) => String(t)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&apos;');

export function textPatternSvg(text, opacity) {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="240" viewBox="0 0 360 240">'
    + `<text x="180" y="120" text-anchor="middle" dominant-baseline="middle" transform="rotate(-30 180 120)" `
    + `font-family="Helvetica, Arial, sans-serif" font-size="22" font-weight="600" fill="#808080" fill-opacity="${opacity}">`
    + `${xmlEscape(text)}</text></svg>`;
}

// CSS backgrounds have no per-layer opacity, so the image carries it on the <image> element.
function imageTileSvg(dataUri, opacity) {
  return '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">'
    + `<image href="${xmlEscape(dataUri)}" x="0" y="0" width="240" height="240" opacity="${opacity}" preserveAspectRatio="xMidYMid meet"/></svg>`;
}

// encodeURIComponent leaves ' ( ) unescaped; the url('…') wrapper and style="…" attribute need no raw quotes inside.
const svgUrl = (svg) => `url('data:image/svg+xml,${encodeURIComponent(svg).replace(/'/g, '%27')}')`;

export function watermarkLayer(spec, { imageDataUri } = {}) {
  if (!spec) throw new Error('no watermark spec');
  const layers = [];
  const sizes = [];
  if (spec.type === 'image+text') {
    if (!imageDataUri) throw new Error('image+text needs imageDataUri');
    layers.push(svgUrl(imageTileSvg(imageDataUri, spec.opacity)));
    sizes.push('240px 240px');
  }
  layers.push(svgUrl(textPatternSvg(spec.text, spec.opacity)));
  sizes.push('360px 240px');
  const style = 'position:fixed;inset:0;z-index:2147483647;pointer-events:none;background-repeat:repeat;'
    + `background-image:${layers.join(',')};background-size:${sizes.join(',')};`;
  return `<div data-df-watermark aria-hidden="true" style="${style}"></div>`;
}

const IMAGE_MIME = { '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' };

// Reads the spec's image as a data URI. Looks relative to the current directory first, then to baseDir.
export function imageDataUri(file, baseDir = '.') {
  const found = [path.resolve(file), path.resolve(baseDir, file)].find((p) => fs.existsSync(p));
  if (!found) throw new Error(`watermark image not found: ${file}`);
  const mime = IMAGE_MIME[path.extname(found).toLowerCase()];
  if (!mime) throw new Error(`watermark image type not supported: ${found}`);
  return `data:${mime};base64,${fs.readFileSync(found).toString('base64')}`;
}

export const stripWatermark = (html) => html.replace(BLOCK, '');
export const hasWatermark = (html) => html.includes(OPEN);

// Comments, scripts and styles can hold a literal "</body>" that is not the document's. Matching them in one
// left-to-right pass lets whichever starts first win, so a comment inside a script (or the reverse) is handled.
const INERT = /<!--[\s\S]*?-->|<script\b[^>]*>[\s\S]*?<\/script\s*>|<style\b[^>]*>[\s\S]*?<\/style\s*>/gi;

function lastBodyClose(html) {
  const inert = [...html.matchAll(INERT)].map((m) => [m.index, m.index + m[0].length]);
  let at = -1;
  for (const m of html.matchAll(/<\/body\s*>/gi)) {
    if (!inert.some(([from, to]) => m.index >= from && m.index < to)) at = m.index;
  }
  return at;
}

export function injectWatermark(html, layer) {
  const clean = stripWatermark(html);
  const block = OPEN + layer + CLOSE;
  const at = lastBodyClose(clean);
  return at < 0 ? clean + block : clean.slice(0, at) + block + clean.slice(at);
}
