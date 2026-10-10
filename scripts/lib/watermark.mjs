// Protective watermark: a fixed, click-through layer injected into HTML, and stripped back out byte-for-byte.
// Spec strings: 'none' | 'text:Studio X' | 'image+text:path/logo.svg|Studio X', each with an optional '@0.1' opacity suffix.
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
  const suffix = raw.match(/@(\d*\.?\d+)$/);
  if (suffix) {
    opacity = Number(suffix[1]);
    body = raw.slice(0, suffix.index);
  }
  if (!(opacity >= MIN_OPACITY && opacity <= MAX_OPACITY)) {
    throw new Error(`watermark opacity ${opacity} is outside ${MIN_OPACITY}–${MAX_OPACITY}`);
  }
  if (body.startsWith('text:')) {
    const text = body.slice('text:'.length);
    if (!text.trim()) throw new Error('watermark text is empty');
    return { type: 'text', text, opacity };
  }
  if (body.startsWith('image+text:')) {
    const rest = body.slice('image+text:'.length);
    const bar = rest.lastIndexOf('|');
    const image = bar < 0 ? '' : rest.slice(0, bar).trim();
    const text = bar < 0 ? '' : rest.slice(bar + 1);
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

export const stripWatermark = (html) => html.replace(BLOCK, '');
export const hasWatermark = (html) => html.includes(OPEN);

export function injectWatermark(html, layer) {
  const clean = stripWatermark(html);
  const block = OPEN + layer + CLOSE;
  let at = -1;
  for (const m of clean.matchAll(/<\/body>/gi)) at = m.index;
  return at < 0 ? clean + block : clean.slice(0, at) + block + clean.slice(at);
}
