// The static tier of check-slop: reads HTML and CSS and names the mechanical tells of a generated page.
// Zero dependencies. The gate list and its tiers live in references/gates.md, which wins on any disagreement.
//
// The gate list adapts Hallmark's (github.com/nutlope/hallmark, MIT, Copyright (c) 2026 Hallmark contributors),
// reconciled with df-design's measured data: house rules the field breaks on purpose (the eyebrow, the tracked label,
// the word budget) are Reflex here, not Floor, because production sites in references/benchmarks.md ship them.
import fs from 'node:fs';
import path from 'node:path';

// ---------------------------------------------------------------------------------------------------------------------
// The gates. tier: floor (FAIL, never waived) · reflex (REFLEX, waivable on the record) · finish (NOTE, never blocks).
// hallmark: the gate it descends from, for anyone reading both lists.
export const GATES = {
  // Floor
  'transition-all': { tier: 'floor', hallmark: '10a', tell: '`transition: all`, or `transition-property: all`', fix: 'List the transitioned properties; transform and opacity are the cheap ones' },
  'animates-layout': { tier: 'floor', hallmark: '10a', tell: 'A keyframe or transition on width, height, top or left', fix: 'Animate transform or opacity instead' },
  'overflow-hidden': { tier: 'floor', hallmark: '34', tell: '`overflow-x: hidden` on html or body (breaks sticky), or a `100vw` width (scrollbar overflow)', fix: '`overflow-x: clip` on both html and body; `width: 100%`' },
  'literal-colour': { tier: 'floor', hallmark: '48', tell: 'A colour literal outside the token block', fix: 'Lift it into the tokens (recipes-design.md §2)' },
  'literal-font': { tier: 'floor', hallmark: '48', tell: 'A font-family literal outside the token block', fix: 'Lift it into the tokens' },
  'gradient-ai': { tier: 'floor', hallmark: '2a', tell: 'A purple-to-blue or purple-to-pink gradient anywhere, gradient text included', fix: 'One anchor hue, solid ink' },
  'italic-word': { tier: 'floor', hallmark: '38i', tell: 'One italic word inside an otherwise roman heading', fix: 'A line break, or the whole head set one way' },
  'card-in-card': { tier: 'floor', hallmark: '4', tell: 'A card inside a card', fix: 'One containment layer' },
  'emoji-icon': { tier: 'floor', hallmark: '30a', tell: 'An emoji standing in for an icon', fix: 'The one icon set the identity chose (icons-and-assets.md), or the word alone' },
  'focus-visible': { tier: 'floor', hallmark: '26a', tell: 'No `:focus-visible` styling anywhere, or an outline removed with nothing in its place', fix: 'A ring at 3:1 or better on every interactive element, instant' },
  'focus-fades': { tier: 'floor', hallmark: '15', tell: 'A focus ring that transitions in', fix: 'Instant: no transition on outline or box-shadow in :focus-visible' },
  'reduced-motion': { tier: 'floor', hallmark: '27', tell: 'Motion present and no `prefers-reduced-motion: reduce` fallback (WCAG 2.3.3)', fix: 'Add the fallback (recipes-motion.md, the reduced-motion contract)' },
  'hidden-at-rest': { tier: 'floor', hallmark: '62', tell: 'Content hidden at rest (opacity 0 or visibility hidden) that depends on a script to appear', fix: 'Visible by default; hide only under a `.js` class the script adds, or animate from visible with @starting-style' },
  'decorative-svg': { tier: 'floor', hallmark: '33', tell: 'An inline <svg> with neither aria-hidden="true" nor a label', fix: 'Hide it or name it' },
  'img-alt': { tier: 'floor', hallmark: '76', tell: 'An <img> without alt, or without a source', fix: 'alt="" when decorative, a description otherwise; a real file' },
  'autoplay-unmuted': { tier: 'floor', hallmark: '28a', tell: 'A video autoplaying without muted', fix: '`autoplay muted loop playsinline`' },
  'placeholder-copy': { tier: 'floor', hallmark: '19', tell: 'Lorem ipsum, a placeholder person (Jane Doe) or a placeholder company (Acme)', fix: "The brief's real content, or plausible specific copy for this subject (recipes-design.md §9)" },
  // Reflex
  'eyebrow': { tier: 'reflex', hallmark: '54', tell: 'Short inert type before a heading that announces it', fix: 'Open the section another way; keep it only where it carries a fact, a destination or a real sequence' },
  'tracked-caps': { tier: 'reflex', hallmark: '67', tell: 'A small label set in tracked capitals or small caps', fix: 'The body face, a step smaller, sentence case, untracked' },
  'mono-costume': { tier: 'reflex', hallmark: '64', tell: 'A mono face on labels or meta that may carry no data', fix: 'Mono labels real data (figures, code, units, timestamps), or nothing (recipes-design.md §1)' },
  'safe-display-face': { tier: 'reflex', hallmark: '1', tell: 'Inter, Roboto, Open Sans, Poppins, Lato, Space Grotesk or a system face as the display', fix: 'A display face from the identity; 4 of 28 measured sites use Inter for display' },
  'one-face': { tier: 'reflex', hallmark: '37', tell: 'The display role is not filled: headings inherit the body face', fix: 'Three roles, display clearly distinct from text (recipes-design.md §1)' },
  'gradient-text': { tier: 'reflex', hallmark: '2b', tell: 'Gradient text in any hue', fix: 'Solid ink; weight or a display face' },
  'accented-word': { tier: 'reflex', hallmark: '38iii', tell: 'One word in a heading set apart by colour, weight or a highlight', fix: 'The whole head one way; a line break; a second line at a second size' },
  'named-look': { tier: 'reflex', hallmark: '65', tell: 'Cream paper, a high-contrast serif display and a terracotta accent', fix: 'Move one axis: the accent first, the paper second, the display last (recipes-design.md §7)' },
  'middle-dots': { tier: 'reflex', hallmark: '63', tell: 'A meta string joined with middle dots (A · B · C)', fix: 'Line breaks, columns or hairlines; one dot in a byline at most' },
  'arrow-glued': { tier: 'reflex', hallmark: '63', tell: 'An arrow glued to link or button text', fix: 'A verb as the label; the link already says it goes somewhere' },
  'word-dash-label': { tier: 'reflex', hallmark: '63', tell: 'A `WORD — fragment` label', fix: 'Say the thing as a sentence or a heading' },
  'numbered-markers': { tier: 'reflex', hallmark: '66', tell: 'Ordinal markers (01 / 02 / 03) on content that is not an ordered list', fix: 'A real <ol> when the sequence is genuine; nothing when it is not (recipes-design.md §4)' },
  'stock-second-action': { tier: 'reflex', hallmark: '19', tell: 'A stock action label (Learn more, Get started, Book a demo)', fix: 'The button says exactly what happens (recipes-design.md §9)' },
  'buzzwords': { tier: 'reflex', hallmark: '19', tell: 'Marketing buzzwords (seamless, robust, empower, world-class…)', fix: 'Say what the product does, in its own nouns' },
  'invented-proof': { tier: 'reflex', hallmark: '46a', tell: 'A metric that reads as proof (Trusted by 50,000+ teams, 10x faster)', fix: "The author's own number with its source, or nothing; confirm it on the record" },
  'uniform-radius': { tier: 'reflex', hallmark: 'F7', tell: 'One large radius on everything', fix: 'Median measured CTA radius is 6px; one radius per nesting level, sharp where the identity is sharp' },
  'glow': { tier: 'reflex', hallmark: '29', tell: 'A zero-offset chromatic glow, or a blurred colour blob', fix: 'Elevation by lightness; shadows with offset and blur' },
  'sticky-collision': { tier: 'reflex', hallmark: '56', tell: 'Two `position: sticky; top: 0` rules', fix: '`top: var(--nav-height)` on the second, or one sticky element' },
  'vh-hero': { tier: 'reflex', hallmark: '6a', tell: 'A height in vh', fix: 'dvh or svh, so the phone address bar does not cut the hero' },
  'bare-1fr-image-track': { tier: 'reflex', hallmark: '50', tell: 'An image-bearing grid track on bare 1fr', fix: '`minmax(0, 1fr)`' },
  'three-tiles': { tier: 'reflex', hallmark: '3', tell: 'Three equal icon-above-heading tiles', fix: 'None of the thirty measured sites do it: vary widths and heights, inline the icons' },
  // Render tier (scripts/lib/slop-render.mjs): only a browser can settle these
  'fold': { tier: 'floor', hallmark: '44b', render: true, tell: "The hero's headline or primary action is not visible at 1280 x 800 without scrolling", fix: 'Pull the display clamp down, tighten leading, trim padding; the hero is the first screen' },
  'horizontal-scroll': { tier: 'floor', hallmark: '34', render: true, tell: 'The page scrolls sideways at some width between 320 and 1920', fix: '`overflow-x: clip` on html and body; tables, code and diagrams in their own `overflow-x: auto` container (recipes-design.md §6)' },
  'focus-ring': { tier: 'floor', hallmark: '26a', render: true, tell: 'Tabbing reaches an element with no visible focus state', fix: 'A `:focus-visible` ring at 3:1 or better, instant' },
  'broken-image': { tier: 'floor', hallmark: '76', render: true, tell: 'An image that does not load', fix: 'The real file, at the path the page uses' },
  'hidden-without-script': { tier: 'floor', hallmark: '62', render: true, tell: 'With scripting off, headings, text or images stay invisible', fix: 'Visible by default; hide only under a `.js` class the script adds' },
  'measure': { tier: 'floor', hallmark: '25', render: true, tell: 'Running text wider than 90 characters a line', fix: '`max-width: 65ch`; 60–70ch sans, 75ch serif at most (recipes-design.md §1)' },
  'container-cap': { tier: 'reflex', hallmark: '44d', render: true, tell: 'At 1920 the gutters stay under 120px: the container is not capped and centred', fix: 'Cap the container (1360 to 1520) and centre it; at 1920 the gutters grow, the measure does not' },
  'dead-half': { tier: 'reflex', hallmark: '44c', render: true, tell: 'A hero whose content stops in the left half of a 1440 canvas with nothing on the right', fix: 'Fill it with the product, centre the composition, or frame the column in a band (recipes-design.md §6)' },
  'text-strain': { tier: 'reflex', hallmark: '75', render: true, tell: 'Running text rendered under 12px', fix: 'Body 16px at 1.5 to 1.65; labels one step smaller' },
  'word-budget': { tier: 'finish', hallmark: '58', render: true, tell: 'A 900px window at 1440 holding more than about 120 words', fix: 'One idea per screen; sections become objects, not paragraphs' },
  // Finish
  'doc-basics': { tier: 'finish', hallmark: 'F23', tell: 'A document without lang, a title, a viewport meta or a description', fix: 'Add them' },
  'heading-skip': { tier: 'finish', hallmark: 'F21', tell: 'A heading level skipped', fix: 'One level at a time' },
  'em-dash': { tier: 'finish', hallmark: '19', tell: 'Em or en dashes in the page copy, the punctuation of generated text', fix: 'A comma, a colon, a full stop or parentheses' },
  'overflow-undeclared': { tier: 'finish', hallmark: '34', tell: 'Neither html nor body declares overflow-x', fix: '`overflow-x: clip` on both; the render tier measures the real scroll width' },
};

const GRADE_RANK = { FAIL: 0, REFLEX: 1, WAIVER: 2, WAIVED: 3, NOTE: 4 };
const APP_SKIP = new Set(['three-tiles', 'vh-hero', 'stock-second-action', 'invented-proof', 'one-face', 'safe-display-face', 'named-look']);
const COMPONENT_SKIP = new Set(['three-tiles', 'vh-hero', 'doc-basics', 'one-face', 'named-look', 'heading-skip']);
const PER_GATE_CAP = 12;

// ---------------------------------------------------------------------------------------------------------------------
// Files

const SKIP_DIRS = new Set(['node_modules', 'dist', 'build', 'coverage', 'captures']);
export function collectFiles(paths) {
  const out = [];
  const seen = new Set();
  const visit = (p, top) => {
    const abs = path.resolve(p);
    if (seen.has(abs)) return;
    let st;
    try { st = fs.statSync(abs); } catch { if (top) throw new Error(`cannot read ${p}`); return; }
    if (st.isDirectory()) {
      const base = path.basename(abs);
      if (!top && (SKIP_DIRS.has(base) || base.startsWith('.'))) return;
      for (const e of fs.readdirSync(abs).sort()) visit(path.join(abs, e), false);
      return;
    }
    const ext = path.extname(abs).toLowerCase();
    if (ext === '.html' || ext === '.htm' || ext === '.css') { seen.add(abs); out.push({ file: abs, text: fs.readFileSync(abs, 'utf8') }); }
  };
  for (const p of paths) visit(p, true);
  return out;
}

// ---------------------------------------------------------------------------------------------------------------------
// Lines

function lineIndex(text) {
  const nl = [];
  for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) === 10) nl.push(i);
  return (pos) => {
    let lo = 0, hi = nl.length;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (nl[mid] < pos) lo = mid + 1; else hi = mid; }
    return lo + 1;
  };
}

// ---------------------------------------------------------------------------------------------------------------------
// CSS

const WAIVER_RE = /df-design\s*[·:-]\s*waive\s+([a-z][a-z0-9-]*)\s*[·:-]\s*([^*\n]*?)\s*(?:\*\/|-->|$)/gi;

function readWaivers(text, file, lineOf, sink) {
  for (const m of text.matchAll(WAIVER_RE)) sink.push({ gate: m[1].toLowerCase(), reason: m[2].trim(), file, line: lineOf(m.index) });
}

// Replace comments with spaces (newlines kept) so positions still map to lines.
function blankComments(src) {
  let out = '';
  let i = 0;
  while (i < src.length) {
    if (src[i] === '/' && src[i + 1] === '*') {
      const end = src.indexOf('*/', i + 2);
      const stop = end === -1 ? src.length : end + 2;
      out += src.slice(i, stop).replace(/[^\n]/g, ' ');
      i = stop;
    } else if (src[i] === '"' || src[i] === "'") {
      const q = src[i]; let j = i + 1;
      while (j < src.length && src[j] !== q && src[j] !== '\n') { if (src[j] === '\\') j++; j++; }
      out += src.slice(i, Math.min(j + 1, src.length)); i = j + 1;
    } else { out += src[i]; i++; }
  }
  return out;
}

function splitTop(s, sep) {
  const parts = [];
  let depth = 0, q = null, start = 0;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === '\\') i++; else if (c === q) q = null; continue; }
    if (c === '"' || c === "'") q = c;
    else if (c === '(') depth++;
    else if (c === ')') depth = Math.max(0, depth - 1);
    else if (c === sep && depth === 0) { parts.push(s.slice(start, i)); start = i + 1; }
  }
  parts.push(s.slice(start));
  return parts;
}

// rules: { selector, decls: [{prop, value, line}], line, media: [], keyframes: name|null, file, atRule }
function parseCss(source, file, lineOffset = 0) {
  const src = blankComments(source);
  const lineOf0 = lineIndex(src);
  const lineOf = (pos) => lineOf0(pos) + lineOffset;
  const rules = [];
  const closeOf = (s, open) => {
    let depth = 0, q = null;
    for (let i = open; i < s.length; i++) {
      const c = s[i];
      if (q) { if (c === '\\') i++; else if (c === q) q = null; continue; }
      if (c === '"' || c === "'") q = c;
      else if (c === '{') depth++;
      else if (c === '}') { depth--; if (depth === 0) return i; }
    }
    return s.length;
  };
  const decls = (body, bodyStart) => {
    const out = [];
    let off = 0;
    for (const part of splitTop(body, ';')) {
      const idx = part.indexOf(':');
      if (idx > 0 && !part.includes('{')) {
        const prop = part.slice(0, idx).trim().toLowerCase();
        const value = part.slice(idx + 1).replace(/!important/i, '').trim();
        if (prop && value) out.push({ prop, value, line: lineOf(bodyStart + off + part.search(/\S|$/)) });
      }
      off += part.length + 1;
    }
    return out;
  };
  const walk = (start, end, ctx) => {
    let i = start;
    while (i < end) {
      const open = src.indexOf('{', i);
      const semi = src.indexOf(';', i);
      if (open === -1 || open >= end) break;
      if (semi !== -1 && semi < open) { i = semi + 1; continue; } // @import, @charset
      const head = src.slice(i, open).trim();
      const close = Math.min(closeOf(src, open), end);
      const bodyStart = open + 1;
      if (!head) { i = close + 1; continue; }
      if (head.startsWith('@')) {
        const name = head.slice(1).split(/\s/)[0].toLowerCase();
        if (/^(media|supports|layer|container|scope|starting-style)$/.test(name)) {
          walk(bodyStart, close, { ...ctx, media: [...ctx.media, head], starting: ctx.starting || name === 'starting-style' });
        } else if (/^(-webkit-)?keyframes$/.test(name)) {
          const kf = head.replace(/^@(-webkit-)?keyframes\s+/i, '').trim();
          walk(bodyStart, close, { ...ctx, keyframes: kf });
        } else if (name === 'font-face' || name === 'page' || name === 'property' || name === 'counter-style') {
          rules.push({ selector: head, decls: decls(src.slice(bodyStart, close), bodyStart), line: lineOf(i + src.slice(i, open).search(/\S/)), media: ctx.media, keyframes: null, file, atRule: name });
        }
        i = close + 1; continue;
      }
      const body = src.slice(bodyStart, close);
      const selector = ctx.parent ? nestSelector(head, ctx.parent) : head.replace(/\s+/g, ' ');
      const rule = { selector, decls: decls(body, bodyStart), line: lineOf(i + src.slice(i, open).search(/\S/)), media: ctx.media, keyframes: ctx.keyframes, file, atRule: null, starting: !!ctx.starting };
      rules.push(rule);
      if (body.includes('{')) walk(bodyStart, close, { ...ctx, parent: selector }); // nested CSS
      i = close + 1;
    }
  };
  walk(0, src.length, { media: [], keyframes: null, parent: null });
  return rules;
}

function nestSelector(sel, parent) {
  const p = parent.includes(',') ? `:is(${parent})` : parent;
  return sel.split(/,(?![^(]*\))/).map((part) => (part.includes('&') ? part.trim().replace(/&/g, p) : `${p} ${part.trim()}`)).join(', ');
}

// ---------------------------------------------------------------------------------------------------------------------
// HTML

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
const RAW = new Set(['script', 'style']);
const TAG_RE = /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<!doctype[^>]*>|<\/([a-zA-Z][\w:-]*)\s*>|<([a-zA-Z][\w:-]*)((?:\s+[^\s"'>\/=]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s"'>]+))?)*)\s*(\/?)>/gi;
const ATTR_RE = /([^\s"'>\/=]+)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;

function parseHtml(text, file) {
  const lineOf = lineIndex(text);
  const root = { name: '#root', attrs: {}, classes: [], children: [], parent: null, text: '', line: 1 };
  const styles = [];
  const comments = [];
  let cur = root;
  let last = 0;
  const addText = (s, pos) => { if (!s.trim()) return; cur.text += (cur.text ? ' ' : '') + s.replace(/\s+/g, ' ').trim(); cur.children.push({ name: '#text', text: s.replace(/\s+/g, ' ').trim(), line: lineOf(pos), parent: cur, children: [], attrs: {}, classes: [] }); };
  TAG_RE.lastIndex = 0;
  let m;
  while ((m = TAG_RE.exec(text))) {
    addText(text.slice(last, m.index), last);
    last = TAG_RE.lastIndex;
    const tok = m[0];
    if (tok.startsWith('<!--')) { comments.push({ text: tok, line: lineOf(m.index) }); continue; }
    if (tok.startsWith('<!')) continue;
    if (m[1]) { // close
      const name = m[1].toLowerCase();
      let n = cur;
      while (n && n !== root && n.name !== name) n = n.parent;
      if (n && n !== root) cur = n.parent;
      continue;
    }
    const name = m[2].toLowerCase();
    const attrs = {};
    for (const a of (m[3] || '').matchAll(ATTR_RE)) attrs[a[1].toLowerCase()] = a[3] ?? a[4] ?? a[5] ?? '';
    const node = { name, attrs, classes: (attrs.class || '').split(/\s+/).filter(Boolean), children: [], parent: cur, text: '', line: lineOf(m.index), pos: m.index };
    cur.children.push(node);
    if (RAW.has(name)) {
      const close = text.slice(last).search(new RegExp(`</${name}\\s*>`, 'i'));
      const endPos = close === -1 ? text.length : last + close;
      node.raw = text.slice(last, endPos);
      if (name === 'style') styles.push({ text: node.raw, lineOffset: lineOf(last) - 1 });
      last = endPos;
      TAG_RE.lastIndex = endPos;
      continue;
    }
    if (VOID.has(name) || m[4] === '/') continue;
    cur = node;
  }
  addText(text.slice(last), last);
  const all = [];
  (function flat(n) { for (const c of n.children) { if (c.name !== '#text') { all.push(c); flat(c); } } })(root);
  return { root, all, styles, comments, lineOf, file, text };
}

const allText = (n) => (n.name === '#text' ? n.text : n.children.map(allText).filter(Boolean).join(' ')).replace(/\s+/g, ' ').trim();
const ownText = (n) => n.children.filter((c) => c.name === '#text').map((c) => c.text).join(' ').replace(/\s+/g, ' ').trim();
const elementChildren = (n) => n.children.filter((c) => c.name !== '#text');
const closest = (n, pred) => { for (let p = n; p; p = p.parent) if (pred(p)) return p; return null; };
const descendants = (n, maxDepth = Infinity) => { const out = []; (function go(x, d) { if (d > maxDepth) return; for (const c of elementChildren(x)) { out.push(c); go(c, d + 1); } })(n, 1); return out; };
const isHeading = (n) => /^h[1-6]$/.test(n.name);

// ---------------------------------------------------------------------------------------------------------------------
// Colour

const NAMED = { white: '#ffffff', black: '#000000', red: '#ff0000', blue: '#0000ff', green: '#008000', gray: '#808080', grey: '#808080', orange: '#ffa500', purple: '#800080', pink: '#ffc0cb', yellow: '#ffff00', navy: '#000080', teal: '#008080', silver: '#c0c0c0', maroon: '#800000', olive: '#808000', lime: '#00ff00', aqua: '#00ffff', cyan: '#00ffff', fuchsia: '#ff00ff', magenta: '#ff00ff', brown: '#a52a2a', beige: '#f5f5dc', ivory: '#fffff0', gold: '#ffd700', tan: '#d2b48c', coral: '#ff7f50', salmon: '#fa8072', crimson: '#dc143c', indigo: '#4b0082', violet: '#ee82ee', lavender: '#e6e6fa', khaki: '#f0e68c', plum: '#dda0dd', tomato: '#ff6347', turquoise: '#40e0d0', wheat: '#f5deb3', snow: '#fffafa', whitesmoke: '#f5f5f5', gainsboro: '#dcdcdc', lightgray: '#d3d3d3', lightgrey: '#d3d3d3', darkgray: '#a9a9a9', dimgray: '#696969', slategray: '#708090', slateblue: '#6a5acd', rebeccapurple: '#663399', orchid: '#da70d6', hotpink: '#ff69b4', deeppink: '#ff1493', skyblue: '#87ceeb', royalblue: '#4169e1', steelblue: '#4682b4', firebrick: '#b22222', chocolate: '#d2691e', sienna: '#a0522d', peru: '#cd853f', linen: '#faf0e6', cornsilk: '#fff8dc', seashell: '#fff5ee', mintcream: '#f5fffa', honeydew: '#f0fff0', azure: '#f0ffff', aliceblue: '#f0f8ff', ghostwhite: '#f8f8ff', floralwhite: '#fffaf0', oldlace: '#fdf5e6', antiquewhite: '#faebd7', papayawhip: '#ffefd5', blanchedalmond: '#ffebcd', bisque: '#ffe4c4', moccasin: '#ffe4b5', navajowhite: '#ffdead', peachpuff: '#ffdab9', mistyrose: '#ffe4e1', lavenderblush: '#fff0f5' };
const NAMED_RE = new RegExp(`(^|[\\s,(])(${Object.keys(NAMED).join('|')})(?=$|[\\s,)])`, 'i');
const COLOR_FN_RE = /\b(rgba?|hsla?|oklch|oklab|lab|lch|hwb|color)\(/i;
const HEX_RE = /#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})\b/i;

export function parseColor(raw) {
  if (!raw) return null;
  let s = raw.trim().toLowerCase();
  if (s === 'transparent') return { r: 0, g: 0, b: 0, a: 0 };
  if (NAMED[s]) s = NAMED[s];
  let m;
  if ((m = /^#([0-9a-f]{3,8})$/.exec(s))) {
    let h = m[1];
    if (h.length === 3 || h.length === 4) h = [...h].map((c) => c + c).join('');
    if (h.length !== 6 && h.length !== 8) return null;
    const n = parseInt(h.slice(0, 6), 16);
    return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255, a: h.length === 8 ? parseInt(h.slice(6), 16) / 255 : 1 };
  }
  if ((m = /^rgba?\((.+)\)$/.exec(s))) {
    const parts = m[1].replace(/\//g, ' ').split(/[\s,]+/).filter(Boolean);
    if (parts.length < 3) return null;
    const ch = parts.slice(0, 3).map((p) => (p.endsWith('%') ? parseFloat(p) / 100 : parseFloat(p) / 255));
    if (ch.some((v) => Number.isNaN(v))) return null;
    const a = parts[3] == null ? 1 : parts[3].endsWith('%') ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);
    return { r: ch[0], g: ch[1], b: ch[2], a: Number.isNaN(a) ? 1 : a };
  }
  if ((m = /^hsla?\((.+)\)$/.exec(s))) {
    const parts = m[1].replace(/\//g, ' ').split(/[\s,]+/).filter(Boolean);
    if (parts.length < 3) return null;
    const h = parseFloat(parts[0]), sat = parseFloat(parts[1]) / 100, l = parseFloat(parts[2]) / 100;
    if ([h, sat, l].some(Number.isNaN)) return null;
    const f = (n) => { const k = (n + h / 30) % 12; const a = sat * Math.min(l, 1 - l); return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); };
    const a = parts[3] == null ? 1 : parts[3].endsWith('%') ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);
    return { r: f(0), g: f(8), b: f(4), a: Number.isNaN(a) ? 1 : a };
  }
  if ((m = /^oklch\((.+)\)$/.exec(s))) {
    const parts = m[1].replace(/\//g, ' ').split(/[\s,]+/).filter(Boolean);
    if (parts.length < 3) return null;
    const L = parts[0].endsWith('%') ? parseFloat(parts[0]) / 100 : parseFloat(parts[0]);
    const C = parts[1].endsWith('%') ? parseFloat(parts[1]) * 0.004 : parseFloat(parts[1]);
    const H = parts[2] === 'none' ? 0 : parseFloat(parts[2]);
    if ([L, C, H].some(Number.isNaN)) return null;
    const a = parts[3] == null ? 1 : parts[3].endsWith('%') ? parseFloat(parts[3]) / 100 : parseFloat(parts[3]);
    const rgb = oklchToSrgb(L, C, H);
    return { ...rgb, a: Number.isNaN(a) ? 1 : a, oklch: { L, C, H } };
  }
  return null;
}

function oklchToSrgb(L, C, H) {
  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h), b = C * Math.sin(h);
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  const lin = [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s];
  const gam = (c) => { c = Math.max(0, Math.min(1, c)); return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; };
  return { r: gam(lin[0]), g: gam(lin[1]), b: gam(lin[2]) };
}

export function toOklch(col) {
  if (!col) return null;
  if (col.oklch) return col.oklch;
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const r = lin(col.r), g = lin(col.g), b = lin(col.b);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const C = Math.hypot(A, B);
  let H = (Math.atan2(B, A) * 180) / Math.PI;
  if (H < 0) H += 360;
  return { L, C, H: C < 1e-4 ? 0 : H };
}

// Every colour literal in a value, ignoring var() fallbacks and functions fed by var().
function colorLiterals(value) {
  const out = [];
  const v = stripVarFallbacks(value);
  for (const m of v.matchAll(/#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})\b/gi)) out.push(m[0]);
  for (const m of v.matchAll(/\b(rgba?|hsla?|oklch|oklab|lab|lch|hwb|color)\(([^()]*(?:\([^()]*\)[^()]*)*)\)/gi)) if (!/var\(/i.test(m[0])) out.push(m[0]);
  for (const m of v.matchAll(new RegExp(`(?:^|[\\s,(])(${Object.keys(NAMED).join('|')})(?=$|[\\s,)])`, 'gi'))) out.push(m[1]);
  return out;
}

function stripVarFallbacks(value) {
  return value.replace(/var\((--[\w-]+)\s*,\s*((?:[^()]|\([^()]*\))*)\)/g, 'var($1)').replace(/url\([^)]*\)/gi, 'url()');
}

// ---------------------------------------------------------------------------------------------------------------------
// Tokens and style lookup

const TOKEN_SEL = /^(:root|html|:host|body)?(\[data-[\w-]+(=[^\]]*)?\]|\.theme[\w-]*|\.dark|\.light|:root|:not\([^)]*\))*$/i;
const isTokenRule = (r) => !r.keyframes && !r.atRule && r.selector.split(',').every((s) => TOKEN_SEL.test(s.trim()));

function buildTokens(rules) {
  const tokens = new Map();
  for (const r of rules) for (const d of r.decls) if (d.prop.startsWith('--') && !tokens.has(d.prop)) tokens.set(d.prop, d.value);
  return tokens;
}

function resolveVars(value, tokens, depth = 0) {
  if (!value || depth > 8 || !/var\(/.test(value)) return value || '';
  return resolveVars(value.replace(/var\((--[\w-]+)\s*(?:,\s*((?:[^()]|\([^()]*\))*))?\)/g, (_, name, fb) => tokens.get(name) ?? fb ?? ''), tokens, depth + 1);
}

const PSEUDO_RE = /::?[a-z-]+(\([^)]*\))?/gi;
const lastCompound = (sel) => sel.trim().split(/\s*[>+~]\s*|\s+/).pop() || '';
function compoundMatches(compound, node) {
  const c = compound.replace(PSEUDO_RE, '');
  if (!c || c === '*') return !!c || compound === '*';
  const tag = /^[a-zA-Z][\w-]*/.exec(c)?.[0];
  if (tag && tag.toLowerCase() !== node.name) return false;
  for (const cls of c.matchAll(/\.([\w-]+)/g)) if (!node.classes.includes(cls[1])) return false;
  for (const id of c.matchAll(/#([\w-]+)/g)) if (node.attrs.id !== id[1]) return false;
  for (const at of c.matchAll(/\[([\w-]+)(?:[~|^$*]?=\s*["']?([^"'\]]*)["']?)?\]/g)) { if (!(at[1] in node.attrs)) return false; if (at[2] != null && node.attrs[at[1]] !== at[2]) return false; }
  return true;
}
const hasPseudoClass = (sel) => /:(hover|focus|active|disabled|checked|visited|focus-visible|focus-within|target|placeholder-shown|invalid|valid)\b/.test(sel);
const hasPseudoElement = (sel) => /::|:(before|after|placeholder|marker|selection)\b/.test(sel);
const mediaAtRest = (media) => media.every((m) => !/^@media/i.test(m) || /\(min-width:\s*(\d+)(px|rem)/.test(m) === false && /\(max-width:\s*(\d+)(px|rem)/.test(m) === false ? !/prefers-reduced-motion|prefers-color-scheme:\s*dark|print/.test(m) : minMaxOk(m));
const minMaxOk = (m) => { const min = /\(min-width:\s*(\d+)(px|rem)/.exec(m); const max = /\(max-width:\s*(\d+)(px|rem)/.exec(m); const px = (x) => (x ? parseFloat(x[1]) * (x[2] === 'rem' ? 16 : 1) : null); return (!min || px(min) <= 1440) && (!max || px(max) >= 1440); };

// Resting declarations that reach this element (own compound of the selector only; ancestors not checked).
function styleFor(ctx, node) {
  const decls = new Map();
  for (const r of ctx.rules) {
    if (r.keyframes || r.atRule || r.starting || hasPseudoClass(r.selector) || hasPseudoElement(r.selector) || !mediaAtRest(r.media)) continue;
    for (const sel of splitTop(r.selector, ',')) if (compoundMatches(lastCompound(sel), node)) for (const d of r.decls) decls.set(d.prop, d.value);
  }
  return decls;
}

export function pxOf(value, base = 16) {
  if (!value) return null;
  const v = value.trim().toLowerCase();
  const m = /^(-?[\d.]+)(px|rem|em|pt)?$/.exec(v.replace(/^clamp\(\s*([^,]+),.*$/, '$1').trim());
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (!m[2]) return n === 0 ? 0 : null; // only a bare zero is a length
  return m[2] === 'px' ? n : m[2] === 'pt' ? n * 1.333 : n * base;
}
const emOf = (value) => { if (!value) return null; const v = value.trim().toLowerCase(); let m; if ((m = /^(-?[\d.]+)em$/.exec(v))) return parseFloat(m[1]); if ((m = /^(-?[\d.]+)px$/.exec(v))) return parseFloat(m[1]) / 16; if ((m = /^(-?[\d.]+)rem$/.exec(v))) return parseFloat(m[1]); return null; };

const firstFamily = (value) => (value || '').split(',')[0].replace(/["']/g, '').trim();
const GENERIC = new Set(['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy', 'system-ui', 'ui-sans-serif', 'ui-serif', 'ui-monospace', 'ui-rounded', 'math', 'emoji', 'inherit', 'initial', 'unset', 'revert']);
const isMonoFamily = (value) => /mono|code|courier|consolas|menlo|monaco|fira code|jetbrains|berkeley|hack\b|inconsolata|plex mono|geist mono|space mono|roboto mono|source code/i.test(value || '');
const isSerifFamily = (value) => { const f = firstFamily(value); return /serif|playfair|fraunces|cormorant|caslon|garamond|lora|newsreader|domaine|tiempos|canela|freight|baskerville|georgia|times|didot|bodoni|editorial|spectral|crimson|literata|merriweather|source serif|pt serif|dm serif|instrument serif/i.test(f) && !/sans/i.test(f); };

// ---------------------------------------------------------------------------------------------------------------------
// Findings

function makeReporter(ctx) {
  const counts = new Map();
  return (gate, grade, file, line, evidence, fixOverride) => {
    const g = GATES[gate];
    if (!g) throw new Error(`unknown gate ${gate}`);
    if (ctx.skip.has(gate)) return;
    const n = (counts.get(gate) || 0) + 1;
    counts.set(gate, n);
    if (n > PER_GATE_CAP) { if (n === PER_GATE_CAP + 1) ctx.findings.push({ gate, grade, tier: g.tier, file: rel(file), line, evidence: `… more ${gate} findings not listed (cap ${PER_GATE_CAP})`, fix: g.fix }); return; }
    ctx.findings.push({ gate, grade, tier: g.tier, file: rel(file), line: line || 1, evidence: trunc(evidence, 110), fix: fixOverride || g.fix });
  };
}
const rel = (f) => (f && f.startsWith(process.cwd()) ? f.slice(process.cwd().length + 1) : f);
const trunc = (s, n) => (s && s.length > n ? s.slice(0, n - 1) + '…' : s);

// ---------------------------------------------------------------------------------------------------------------------
// The lint

export function lintStatic(files, { scope = 'page' } = {}) {
  const contexts = buildContexts(files);
  const findings = [];
  for (const ctx of contexts) {
    ctx.findings = findings;
    ctx.skip = scope === 'app' ? APP_SKIP : scope === 'component' ? COMPONENT_SKIP : new Set();
    runChecks(ctx);
  }
  // Waivers: accepted ones suppress their Reflex gate and show as WAIVED; bad ones report as WAIVER and suppress nothing.
  const accepted = new Set();
  const waiverFindings = [];
  for (const ctx of contexts) {
    for (const w of ctx.waivers) {
      const g = GATES[w.gate];
      let bad = null;
      if (!g) bad = `unknown gate "${w.gate}"`;
      else if (g.tier === 'floor') bad = `${w.gate} is Floor and cannot be waived`;
      else if (g.tier === 'finish') bad = `${w.gate} is a Finish check: answer it, it never blocks`;
      else if (w.reason.length < 24) bad = `reason under 24 characters ("${w.reason}")`;
      if (bad) waiverFindings.push({ gate: g ? w.gate : 'eyebrow', grade: 'WAIVER', tier: g ? g.tier : 'reflex', file: rel(w.file), line: w.line, evidence: `waiver REJECTED: ${bad}`, fix: 'Three · separated fields: df-design · waive <reflex gate> · <a reason about this page, 24 characters or more>' });
      else { accepted.add(w.gate); waiverFindings.push({ gate: w.gate, grade: 'WAIVED', tier: g.tier, file: rel(w.file), line: w.line, evidence: w.reason, fix: '' }); }
    }
  }
  const kept = findings.filter((f) => !(f.grade === 'REFLEX' && accepted.has(f.gate)));
  const all = [...kept, ...waiverFindings].sort((a, b) => GRADE_RANK[a.grade] - GRADE_RANK[b.grade] || a.gate.localeCompare(b.gate) || (a.file || '').localeCompare(b.file || '') || a.line - b.line);
  const count = (grade) => all.filter((f) => f.grade === grade).length;
  const counts = { FAIL: count('FAIL'), REFLEX: count('REFLEX'), WAIVED: count('WAIVED'), WAIVER: count('WAIVER'), NOTE: count('NOTE') };
  return { findings: all, counts, ok: counts.FAIL === 0 && counts.REFLEX === 0 && counts.WAIVER === 0, pages: contexts.map((c) => c.docs.map((d) => rel(d.file))).flat() };
}

// One context per HTML page (its inline styles and linked local stylesheets); loose CSS files form one more.
function buildContexts(files) {
  const byPath = new Map(files.map((f) => [path.resolve(f.file), f]));
  const usedCss = new Set();
  const contexts = [];
  for (const f of files) {
    if (!/\.html?$/i.test(f.file)) continue;
    const doc = parseHtml(f.text, f.file);
    const waivers = [];
    const lineOf = lineIndex(f.text);
    readWaivers(f.text.replace(/<style[\s\S]*?<\/style>/gi, (m) => m.replace(/[^\n]/g, ' ')), f.file, lineOf, waivers);
    const rules = [];
    const cssFiles = [];
    for (const s of doc.styles) { readWaivers(s.text, f.file, (p) => lineIndex(s.text)(p) + s.lineOffset, waivers); rules.push(...parseCss(s.text, f.file, s.lineOffset)); }
    for (const link of doc.all.filter((n) => n.name === 'link' && /stylesheet/i.test(n.attrs.rel || '') && n.attrs.href && !/^(https?:)?\/\//i.test(n.attrs.href))) {
      const target = path.resolve(path.dirname(f.file), link.attrs.href.split(/[?#]/)[0]);
      let css = byPath.get(target);
      if (!css && fs.existsSync(target)) css = { file: target, text: fs.readFileSync(target, 'utf8') };
      if (!css) continue;
      usedCss.add(target);
      readWaivers(css.text, css.file, lineIndex(css.text), waivers);
      rules.push(...parseCss(css.text, css.file));
      cssFiles.push(css.file);
    }
    contexts.push({ docs: [doc], rules, cssFiles, tokens: buildTokens(rules), waivers, inlineOnly: cssFiles.length === 0 });
  }
  const loose = files.filter((f) => /\.css$/i.test(f.file) && !usedCss.has(path.resolve(f.file)));
  if (loose.length) {
    const waivers = [];
    const rules = [];
    for (const css of loose) { readWaivers(css.text, css.file, lineIndex(css.text), waivers); rules.push(...parseCss(css.text, css.file)); }
    contexts.push({ docs: [], rules, cssFiles: loose.map((c) => c.file), tokens: buildTokens(rules), waivers });
  }
  return contexts;
}

const COLOR_PROPS = /^(color|background|background-color|background-image|border(-\w+)?(-color)?|outline|outline-color|fill|stroke|box-shadow|text-shadow|caret-color|accent-color|text-decoration-color|column-rule(-color)?|scrollbar-color|--[\w-]+)$/;
const INTERACTIVE_SEL = /(^|[\s,>+~(])(a|button|input|select|textarea|summary)\b|\.(btn|button|cta|link|tab|chip|toggle|switch)\b|\[href\]|\[role=["']?(button|link|tab)/i;
const LABELLY = /label|eyebrow|meta|caption|tag\b|chip|kicker|overline|nav\b|hour|time|date|price|stat|figure|badge|pill|category|small/i;
const WORDMARK = /logo|wordmark|brand\b|masthead|h1|display|hero__(title|head)|title/i;
const BUZZ = /\b(seamless(ly)?|robust|empower(s|ing)?|supercharge[sd]?|elevate[sd]?|effortless(ly)?|unlock(s|ing)?|unleash(es|ing)?|next-generation|world-class|best-in-class|industry-leading|mission-critical|future-proof|game-?changer|cutting-edge|leverage|synerg(y|ies)|revolutioni[sz]e[sd]?|reimagine[sd]?)\b/gi;
const STOCK_ACTIONS = /^(learn more|get started|book a demo|request a demo|discover more|read more|explore|find out more|sign up|click here)$/i;
const EMOJI_RE = /\p{Extended_Pictographic}/u;

function runChecks(ctx) {
  const report = makeReporter(ctx);
  const { rules, tokens, docs } = ctx;
  const res = (v) => resolveVars(v, tokens);
  const where = ctx.cssFiles[0] || docs[0]?.file || 'css';

  // --- CSS: motion -----------------------------------------------------------------------------------------------------
  let motion = false, reduced = false, keyframesLine = null;
  for (const r of rules) {
    if (r.media.some((m) => /prefers-reduced-motion/i.test(m))) reduced = true;
    if (r.keyframes) { motion = true; keyframesLine ??= { file: r.file, line: r.line }; }
    for (const d of r.decls) {
      const v = d.value.toLowerCase();
      if (d.prop === 'transition' && /(^|[\s,])all(\s|,|$)/.test(v)) report('transition-all', 'FAIL', r.file, d.line, `transition: all on ${r.selector}`);
      if (d.prop === 'transition-property' && /(^|[\s,])all(\s|,|$)/.test(v)) report('transition-all', 'FAIL', r.file, d.line, `transition-property: all on ${r.selector}`);
      if (r.keyframes && /^(width|height|top|left)$/.test(d.prop)) report('animates-layout', 'FAIL', r.file, d.line, `@keyframes ${r.keyframes} animates ${d.prop}`);
      if (/^transition(-property)?$/.test(d.prop)) { const hard = /(^|[\s,])(width|height|top|left)(\s|,|$)/.exec(v); if (hard) report('animates-layout', 'FAIL', r.file, d.line, `transitioning ${hard[2]} on ${r.selector}`); }
      if (d.prop === 'animation' || d.prop === 'animation-name') motion = true;
      if (/^transition(-property)?$/.test(d.prop) && /transform|opacity|all/.test(v)) motion = true;
      if (/^transition/.test(d.prop) && /:focus(-visible)?/.test(r.selector) && /outline|box-shadow|all/.test(v)) report('focus-fades', 'FAIL', r.file, d.line, `${r.selector} transitions ${/outline/.test(v) ? 'the outline' : /box-shadow/.test(v) ? 'the box-shadow' : 'all'}`);
    }
  }
  if (motion && !reduced) report('reduced-motion', 'FAIL', keyframesLine?.file || where, keyframesLine?.line || 1, 'motion present, no prefers-reduced-motion block');

  // --- CSS: overflow, vh, sticky ----------------------------------------------------------------------------------------
  let declaresOverflow = false, stickyTop = [];
  for (const r of rules) {
    if (r.keyframes || r.atRule) continue;
    const onRoot = /(^|,)\s*(html|body)\s*(,|$)/.test(r.selector.replace(/\s+/g, ' '));
    let pos = null, top = null;
    for (const d of r.decls) {
      const v = d.value.toLowerCase();
      if (onRoot && /^overflow(-x)?$/.test(d.prop)) { declaresOverflow = true; if (/^hidden\b/.test(v)) report('overflow-hidden', 'FAIL', r.file, d.line, `${d.prop}: ${v} on ${r.selector} (breaks sticky)`); }
      if (/^(width|min-width|max-width|inline-size)$/.test(d.prop) && /\b100vw\b/.test(v)) report('overflow-hidden', 'FAIL', r.file, d.line, `${d.prop}: ${d.value} on ${r.selector} (scrollbar overflow)`);
      if (/^(height|min-height|block-size|min-block-size)$/.test(d.prop) && /\b\d+(\.\d+)?vh\b/.test(v)) report('vh-hero', 'REFLEX', r.file, d.line, `${d.prop}: ${d.value} on ${r.selector}`);
      if (d.prop === 'position' && v === 'sticky') pos = d;
      if (d.prop === 'top' && /^0(px|rem|em)?$/.test(v)) top = d;
    }
    if (pos && top) stickyTop.push({ sel: r.selector, file: r.file, line: pos.line });
  }
  if (!declaresOverflow && rules.length) report('overflow-undeclared', 'NOTE', where, 1, 'neither html nor body declares overflow-x');
  if (stickyTop.length >= 2) report('sticky-collision', 'REFLEX', stickyTop[1].file, stickyTop[1].line, `${stickyTop.length} rules at position: sticky; top: 0 (${stickyTop.map((s) => s.sel).join(', ')})`);

  // --- CSS: literals, gradients, glow, radius ---------------------------------------------------------------------------
  const radii = new Map();
  for (const r of rules) {
    if (r.atRule === 'font-face' || r.atRule === 'property') continue;
    const tokenRule = isTokenRule(r);
    for (const d of r.decls) {
      const v = d.value;
      if (d.prop.startsWith('--')) { if (/^--(font|type|face)/.test(d.prop) === false && /gradient\(/i.test(v)) checkGradient(v, r, d); continue; }
      if (!tokenRule && COLOR_PROPS.test(d.prop)) {
        for (const lit of colorLiterals(v)) report('literal-colour', 'FAIL', r.file, d.line, `${d.prop}: ${lit} on ${r.selector}`);
      }
      if (!tokenRule && (d.prop === 'font-family' || d.prop === 'font') && !/var\(/.test(v)) {
        const fam = d.prop === 'font' ? /(?:^|\/|\s)([\d.]+(?:px|rem|em|%)?(?:\s*\/\s*[\d.]+\w*)?)\s+(.+)$/.exec(v)?.[2] : v;
        if (fam && !/^(inherit|initial|unset|revert)$/i.test(fam.trim())) report('literal-font', 'FAIL', r.file, d.line, `${d.prop}: ${trunc(fam.trim(), 40)} on ${r.selector}`);
      }
      if (/gradient\(/i.test(v)) checkGradient(res(v), r, d);
      if (/^(box-shadow|text-shadow)$/.test(d.prop)) {
        for (const shadow of splitTop(res(v), ',')) {
          const parts = shadow.trim().replace(/\binset\b/, '').trim().split(/\s+(?![^(]*\))/);
          const nums = parts.filter((p) => /^-?[\d.]+(px|rem|em)?$/.test(p));
          const col = parts.find((p) => parseColor(p));
          if (nums.length >= 3 && pxOf(nums[0]) === 0 && pxOf(nums[1]) === 0 && (pxOf(nums[2]) || 0) >= 24 && col) {
            const lch = toOklch(parseColor(col));
            if (lch && lch.C > 0.05) report('glow', 'REFLEX', r.file, d.line, `${d.prop}: zero-offset ${Math.round(pxOf(nums[2]))}px chromatic glow on ${r.selector}`);
          }
        }
      }
      if (d.prop === 'filter' && /blur\(\s*([\d.]+)px/.test(v) && parseFloat(/blur\(\s*([\d.]+)px/.exec(v)[1]) >= 40) report('glow', 'REFLEX', r.file, d.line, `filter: ${trunc(v, 30)} on ${r.selector} (a blurred blob)`);
      if (d.prop === 'border-radius' && !r.keyframes) {
        const px = pxOf(res(v).split(/\s+/)[0]);
        if (px != null && px > 0 && px < 100) { const k = Math.round(px); if (!radii.has(k)) radii.set(k, []); radii.get(k).push({ sel: r.selector, file: r.file, line: d.line }); }
      }
    }
  }
  if (radii.size === 1) { const [[px, uses]] = radii; if (px >= 12 && uses.length >= 4) report('uniform-radius', 'REFLEX', uses[0].file, uses[0].line, `one radius (${px}px) on ${uses.length} selectors and no other`); }

  function checkGradient(value, r, d) {
    for (const g of value.matchAll(/(linear|radial|conic)-gradient\(((?:[^()]|\([^()]*\))*)\)/gi)) {
      const hues = colorLiterals(g[2]).map((c) => toOklch(parseColor(c))).filter((x) => x && x.C > 0.06).map((x) => x.H);
      const has = (lo, hi) => hues.some((h) => (lo <= hi ? h >= lo && h <= hi : h >= lo || h <= hi));
      const purple = has(280, 335), blue = has(225, 280), pink = has(335, 20);
      const textClip = r.decls.some((x) => /background-clip/.test(x.prop) && /text/.test(x.value));
      if (purple && (blue || pink)) report('gradient-ai', 'FAIL', r.file, d.line, `${purple && blue ? 'purple-to-blue' : 'purple-to-pink'} ${g[1]} gradient${textClip ? ' as text' : ''} on ${r.selector}`);
      else if (textClip && hues.length) report('gradient-text', 'REFLEX', r.file, d.line, `gradient text on ${r.selector}`);
    }
  }

  // --- CSS: focus -------------------------------------------------------------------------------------------------------
  const focusVisibleSels = rules.filter((r) => /:focus-visible/.test(r.selector)).flatMap((r) => splitTop(r.selector, ',').map((s) => s.replace(/:focus-visible.*$/, '').trim()));
  const hasInteractive = rules.some((r) => INTERACTIVE_SEL.test(r.selector)) || docs.some((d) => d.all.some((n) => /^(a|button|input|select|textarea)$/.test(n.name)));
  if (hasInteractive && focusVisibleSels.length === 0) report('focus-visible', 'FAIL', where, 1, 'no :focus-visible styling anywhere');
  for (const r of rules) {
    if (!/:focus\b(?!-)/.test(r.selector)) continue;
    const kill = r.decls.find((d) => /^outline(-style|-width)?$/.test(d.prop) && /^(none|0|0px)$/.test(d.value.trim().toLowerCase()));
    if (!kill) continue;
    const base = splitTop(r.selector, ',')[0].replace(/:focus.*$/, '').trim();
    const replaced = focusVisibleSels.some((s) => s === base || s === '' || base.endsWith(s) || s.endsWith(base)) || r.decls.some((d) => d.prop === 'box-shadow' && d.value !== 'none');
    if (!replaced) report('focus-visible', 'FAIL', r.file, kill.line, `${r.selector} removes the outline with nothing in its place`);
  }

  // --- CSS: type roles --------------------------------------------------------------------------------------------------
  const bodyRule = rules.filter((r) => /(^|,)\s*body\s*(,|$)/.test(r.selector) && !r.keyframes);
  const bodyFont = res(bodyRule.flatMap((r) => r.decls).filter((d) => d.prop === 'font-family' || d.prop === 'font').map((d) => (d.prop === 'font' ? d.value.split(/\s+(?![^(]*\))/).slice(-1).join('') : d.value)).pop() || tokens.get('--font-body') || '');
  const displayToken = tokens.get('--font-display') || tokens.get('--font-heading') || tokens.get('--font-title') || tokens.get('--display');
  const h1Rules = rules.filter((r) => /(^|[\s,>])h1\b/.test(r.selector) && !r.keyframes);
  const h1Font = res(h1Rules.flatMap((r) => r.decls).filter((d) => d.prop === 'font-family' || d.prop === 'font').map((d) => d.value).pop() || displayToken || '');
  const displayFamily = firstFamily(h1Font || displayToken || '');
  const bodyFamily = firstFamily(bodyFont);
  const hasHeadings = docs.some((d) => d.all.some(isHeading));
  if (displayFamily && /^(inter|roboto|open sans|poppins|lato|space grotesk|arial|helvetica( neue)?|system-ui|ui-sans-serif|-apple-system)$/i.test(displayFamily)) {
    report('safe-display-face', 'REFLEX', h1Rules[0]?.file || where, h1Rules[0]?.line || 1, `display face: ${displayFamily}`);
  } else if (hasHeadings && rules.length && (!displayFamily || (bodyFamily && displayFamily.toLowerCase() === bodyFamily.toLowerCase()))) {
    report('one-face', 'REFLEX', h1Rules[0]?.file || where, h1Rules[0]?.line || 1, displayFamily ? `display and body are both ${displayFamily}` : 'no display face declared: headings inherit the body face');
  }
  const monoMaterial = isMonoFamily(displayFamily) || isMonoFamily(bodyFamily);
  for (const r of rules) {
    if (r.keyframes || r.atRule || hasPseudoElement(r.selector)) continue;
    const ff = r.decls.find((d) => d.prop === 'font-family');
    if (!ff || monoMaterial) continue;
    if (isMonoFamily(res(ff.value)) && LABELLY.test(r.selector) && !/code|pre|kbd|samp|figure|stat|price|number|digit|tabular/i.test(r.selector)) report('mono-costume', 'REFLEX', r.file, ff.line, `${r.selector}: ${firstFamily(res(ff.value))}`);
  }
  for (const r of rules) {
    if (r.keyframes || r.atRule) continue;
    const tt = r.decls.find((d) => d.prop === 'text-transform' && /uppercase/i.test(d.value));
    const sc = r.decls.find((d) => /^font-variant(-caps)?$/.test(d.prop) && /small-caps/i.test(d.value));
    if (!tt && !sc) continue;
    if (WORDMARK.test(r.selector) || /(^|[\s,>])h[1-3]\b/.test(r.selector)) continue;
    const ls = emOf(res(r.decls.find((d) => d.prop === 'letter-spacing')?.value || ''));
    const fs_ = pxOf(res(r.decls.find((d) => d.prop === 'font-size')?.value || ''));
    if ((ls != null && ls > 0.03) || (fs_ != null && fs_ <= 15)) report('tracked-caps', 'REFLEX', r.file, (tt || sc).line, `${r.selector}: ${sc ? 'small caps' : 'uppercase'}${ls != null ? ` tracked ${ls}em` : ''}${fs_ != null ? ` at ${Math.round(fs_)}px` : ''}`);
  }

  // --- CSS: hidden at rest, grid tracks ----------------------------------------------------------------------------------
  const hasScript = docs.some((d) => d.all.some((n) => n.name === 'script'));
  for (const r of rules) {
    if (r.keyframes || r.atRule || r.starting || hasPseudoClass(r.selector) || hasPseudoElement(r.selector) || !mediaAtRest(r.media)) continue;
    const hidden = r.decls.find((d) => (d.prop === 'opacity' && /^0(\.0+)?$/.test(d.value.trim())) || (d.prop === 'visibility' && /hidden/.test(d.value)));
    if (!hidden) continue;
    if (/(^|\s)(html)?\.(js|has-js|wf-active)\b|\[data-js|\.no-js|\[hidden\]|\.hidden\b|sr-only|visually-hidden|skip|\.is-|\.was-|:not\(/.test(r.selector)) continue;
    if (r.decls.some((d) => /^animation(-name)?$/.test(d.prop) && !/none/.test(d.value))) continue;
    if (!hasScript) continue;
    const used = docs.some((d) => d.all.some((n) => splitTop(r.selector, ',').some((s) => compoundMatches(lastCompound(s), n)) && allText(n).length > 0));
    if (used) report('hidden-at-rest', 'FAIL', r.file, hidden.line, `${r.selector} is hidden at rest (${hidden.prop}: ${hidden.value}) and depends on a script to appear`);
  }
  for (const r of rules) {
    if (r.keyframes || r.atRule) continue;
    const gtc = r.decls.find((d) => d.prop === 'grid-template-columns');
    if (!gtc) continue;
    const bare = /(^|\s)([\d.]*fr)(\s|$)/.exec(gtc.value.replace(/minmax\([^)]*\)|repeat\([^)]*\)|\([^)]*\)/g, 'X'));
    if (!bare) continue;
    for (const doc of docs) for (const n of doc.all) {
      if (!splitTop(r.selector, ',').some((s) => compoundMatches(lastCompound(s), n))) continue;
      if (descendants(n, 3).some((c) => c.name === 'img' || c.name === 'picture' || c.name === 'video')) { report('bare-1fr-image-track', 'REFLEX', r.file, gtc.line, `bare ${bare[2]} track holds images (${r.selector})`); break; }
    }
  }

  // --- CSS: the named look -------------------------------------------------------------------------------------------------
  const bodyBg = res(bodyRule.flatMap((r) => r.decls).filter((d) => /^background(-color)?$/.test(d.prop)).map((d) => d.value).pop() || tokens.get('--canvas') || tokens.get('--paper') || tokens.get('--bg') || tokens.get('--background') || '');
  const paper = toOklch(parseColor(colorLiterals(bodyBg)[0] || bodyBg));
  const accentRaw = [...tokens.entries()].filter(([k]) => /^--(brand|accent|primary|color-accent|color-brand|color-primary)$/.test(k)).map(([, v]) => res(v));
  const accents = accentRaw.map((v) => toOklch(parseColor(colorLiterals(v)[0] || v))).filter(Boolean);
  if (paper && paper.L >= 0.88 && paper.C >= 0.006 && paper.H >= 55 && paper.H <= 105 && isSerifFamily(h1Font || displayToken) && accents.some((a) => a.C >= 0.08 && a.H >= 15 && a.H <= 60)) {
    report('named-look', 'REFLEX', where, 1, `cream paper (L ${Math.round(paper.L * 100)}, hue ${Math.round(paper.H)}) + ${displayFamily} + a terracotta accent`);
  }

  // --- HTML --------------------------------------------------------------------------------------------------------------
  for (const doc of docs) {
    const { all, file } = doc;
    const html = all.find((n) => n.name === 'html');
    const basics = [];
    if (!html?.attrs.lang) basics.push('no lang on <html>');
    if (!all.some((n) => n.name === 'title')) basics.push('no <title>');
    if (!all.some((n) => n.name === 'meta' && n.attrs.name === 'viewport')) basics.push('no viewport meta');
    if (!all.some((n) => n.name === 'meta' && n.attrs.name === 'description')) basics.push('no meta description');
    if (basics.length) report('doc-basics', 'NOTE', file, 1, basics.join(', '));

    let lastLevel = 0;
    for (const n of all) {
      if (isHeading(n)) { const lvl = +n.name[1]; if (lastLevel && lvl > lastLevel + 1) report('heading-skip', 'NOTE', file, n.line, `<${n.name}> after <h${lastLevel}>`); lastLevel = lvl; }
    }

    // headings: italic word, accented word
    for (const h of all.filter(isHeading)) {
      const whole = allText(h);
      for (const em of elementChildren(h)) {
        const t = allText(em);
        if (!t || t === whole) continue;
        if (em.name === 'em' || em.name === 'i') report('italic-word', 'FAIL', file, em.line, `<${em.name}> inside <${h.name}>: "${t}" in "${trunc(whole, 40)}"`);
        else if (em.name === 'span' || em.name === 'mark' || em.name === 'strong' || em.name === 'b') {
          const st = styleFor(ctx, em);
          const styled = em.name === 'mark' || em.name === 'strong' || em.name === 'b' || st.has('color') || st.has('background') || st.has('background-color') || st.has('font-weight') || st.has('font-style') || st.has('text-decoration') || /accent|highlight|italic|color|mark|gradient|emph/i.test(em.classes.join(' '));
          if (styled && t.split(' ').length <= 3) report('accented-word', 'REFLEX', file, em.line, `"${t}" set apart inside <${h.name}> "${trunc(whole, 40)}"`);
        }
      }
    }

    // card in card
    const isCard = (n) => n.classes.some((c) => /(^|[-_])card([-_]|$)/i.test(c));
    for (const n of all.filter(isCard)) {
      const inner = descendants(n).find(isCard);
      if (inner) report('card-in-card', 'FAIL', file, inner.line, `card nested in card: .${inner.classes.join('.')} inside .${n.classes.join('.')}`);
    }

    // emoji icons
    for (const n of all) {
      if (/^(script|style|title|meta|p|blockquote|td)$/.test(n.name)) continue;
      const t = ownText(n);
      if (t && [...t].length <= 4 && EMOJI_RE.test(t)) report('emoji-icon', 'FAIL', file, n.line, `emoji icon "${t}" in <${n.name}${n.classes.length ? ` class="${trunc(n.classes.join(' '), 24)}"` : ''}>`);
      else if (t && /^(h[1-6]|li|button|a|dt|th|summary)$/.test(n.name) && EMOJI_RE.test([...t][0])) report('emoji-icon', 'FAIL', file, n.line, `emoji marker "${[...t][0]}" opening <${n.name}> "${trunc(t, 32)}"`);
    }

    // svg, img, video
    for (const n of all) {
      if (n.name === 'svg') {
        const labelled = n.attrs['aria-hidden'] === 'true' || n.attrs['aria-label'] || n.attrs['aria-labelledby'] || n.attrs.role === 'img' || elementChildren(n).some((c) => c.name === 'title');
        if (!labelled) report('decorative-svg', 'FAIL', file, n.line, `<svg${n.attrs.class ? ` class="${trunc(n.attrs.class, 24)}"` : ''}> with neither aria-hidden="true" nor a label`);
      }
      if (n.name === 'img') {
        if (!('alt' in n.attrs)) report('img-alt', 'FAIL', file, n.line, `<img src="${trunc(n.attrs.src || '', 40)}"> without alt`);
        if (!n.attrs.src && !n.attrs.srcset && !closest(n, (p) => p.name === 'picture')) report('img-alt', 'FAIL', file, n.line, '<img> without a source');
      }
      if (n.name === 'video' && 'autoplay' in n.attrs && !('muted' in n.attrs)) report('autoplay-unmuted', 'FAIL', file, n.line, '<video autoplay> without muted');
      if (n.attrs.style) {
        for (const lit of colorLiterals(n.attrs.style)) report('literal-colour', 'FAIL', file, n.line, `style="…${lit}…" on <${n.name}>`);
        if (/font-family\s*:\s*(?!var\()/i.test(n.attrs.style)) report('literal-font', 'FAIL', file, n.line, `font-family literal in style="" on <${n.name}>`);
      }
    }

    // eyebrows
    for (const h of all.filter((n) => /^h[1-4]$/.test(n.name))) {
      const sib = elementChildren(h.parent || { children: [] });
      const prev = sib[sib.indexOf(h) - 1];
      if (!prev || !/^(span|p|div|small|strong|b|em|label)$/.test(prev.name)) continue;
      if (descendants(prev).some((c) => c.name === 'a' || c.name === 'time' || c.name === 'img')) continue;
      const t = allText(prev);
      if (!t || t.length > 48 || t.length < 2) continue;
      const st = styleFor(ctx, prev);
      const upper = /uppercase/i.test(res(st.get('text-transform') || '')) || (/^[A-Z0-9\s\/.·:—–-]+$/.test(t) && /[A-Z]{3}/.test(t));
      const tracked = (emOf(res(st.get('letter-spacing') || '')) || 0) > 0.03;
      const named = /eyebrow|overline|kicker|tagline|label|category|pre-?title|supertitle|subtitle|section-?label/i.test(prev.classes.join(' '));
      if (upper || tracked || named) report('eyebrow', 'REFLEX', file, prev.line, `"${trunc(t, 40)}" before <${h.name}> "${trunc(allText(h), 30)}"`);
    }

    // punctuation and copy
    const seen = new Set();
    for (const n of all) {
      const t = ownText(n);
      if (!t) continue;
      if (!seen.has(n.line) && (t.match(/\s[·•]\s/g) || []).length >= 2) { seen.add(n.line); report('middle-dots', 'REFLEX', file, n.line, `middle-dot meta string "${trunc(t, 50)}"`); }
      if (/^[A-Z]{3,}\s+[—–-]\s+\S/.test(t) && t.length < 60) report('word-dash-label', 'REFLEX', file, n.line, `"${trunc(t, 40)}"`);
    }
    for (const n of all.filter((x) => x.name === 'a' || x.name === 'button' || /btn|button|cta/i.test(x.classes.join(' ')))) {
      const t = allText(n);
      if (/(→|->|›|»|⟶|➔|⟩)\s*$/.test(t)) report('arrow-glued', 'REFLEX', file, n.line, `"${trunc(t, 40)}" (<${n.name}>)`);
      if (STOCK_ACTIONS.test(t.replace(/\s*(→|->|›|»)\s*$/, '').trim())) report('stock-second-action', 'REFLEX', file, n.line, `"${t}" (<${n.name}>)`);
    }
    const ordinals = all.filter((n) => !closest(n, (p) => p.name === 'ol') && /^(0\d|\d{2})\s*[\/.]?$/.test(ownText(n)) && !isHeading(n) && n.name !== 'td' && n.name !== 'th');
    if (ordinals.length >= 3) report('numbered-markers', 'REFLEX', file, ordinals[0].line, `${ordinals.length} ordinal markers (${ordinals.slice(0, 3).map((o) => ownText(o)).join(', ')}) outside an <ol>`);

    const body = all.find((n) => n.name === 'body') || doc.root;
    const prose = allText(body);
    if (/lorem ipsum/i.test(prose)) report('placeholder-copy', 'FAIL', file, findLine(doc, /lorem ipsum/i), 'lorem ipsum');
    const person = /\b(jane|john)\s+(doe|smith)\b|\bjohn appleseed\b/i.exec(prose);
    if (person) report('placeholder-copy', 'FAIL', file, findLine(doc, person[0]), `placeholder person "${person[0]}"`);
    const company = /\bacme(\s+(corp|inc|co|industries))?\b|\bexample (company|corp)\b/i.exec(prose);
    if (company) report('placeholder-copy', 'FAIL', file, findLine(doc, company[0]), `placeholder company "${company[0]}"`);
    const buzz = new Map();
    for (const m of prose.matchAll(BUZZ)) { const k = m[1].toLowerCase(); buzz.set(k, (buzz.get(k) || 0) + 1); }
    if (buzz.size) report('buzzwords', 'REFLEX', file, findLine(doc, new RegExp([...buzz.keys()][0], 'i')), [...buzz.entries()].slice(0, 5).map(([w, n]) => (n > 1 ? `${w} ×${n}` : w)).join(', '));
    const proof = /trusted by\s+[\d,.]+\+?\s*\w*|\b\d[\d,.]*\+?\s*(teams|customers|users|companies|developers|countries|businesses)\b|\b\d+x\s+(faster|more|better)\b|\b\d{2,3}%\s+(of|faster|more)\b/i.exec(prose);
    if (proof) report('invented-proof', 'REFLEX', file, findLine(doc, proof[0]), `"${trunc(proof[0], 48)}": a figure that reads as proof`);
    const dashes = (prose.match(/\s[—–]\s|—/g) || []).length;
    if (dashes) report('em-dash', 'NOTE', file, findLine(doc, /—|\s–\s/), `${dashes} em or en dash${dashes > 1 ? 'es' : ''} in the copy`);

    // three tiles
    for (const parent of all) {
      const kids = elementChildren(parent);
      if (kids.length < 3) continue;
      const sig = (k) => `${k.name}.${k.classes[0] || ''}`;
      const groups = new Map();
      for (const k of kids) { const s = sig(k); if (!groups.has(s)) groups.set(s, []); groups.get(s).push(k); }
      for (const [, g] of groups) {
        if (g.length !== 3) continue;
        const tile = (k) => { const d = descendants(k, 3); return d.some((c) => c.name === 'svg' || c.name === 'img' || /icon/i.test(c.classes.join(' '))) && d.some((c) => /^h[2-5]$/.test(c.name)); };
        if (g.every(tile)) { report('three-tiles', 'REFLEX', file, g[0].line, `three ${sig(g[0])} tiles, each an icon above a heading`); break; }
      }
    }
  }
}

function findLine(doc, needle) {
  const re = needle instanceof RegExp ? needle : new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const m = re.exec(doc.text);
  return m ? doc.lineOf(m.index) : 1;
}

export const _internals = { parseCss, parseHtml, resolveVars, colorLiterals };
