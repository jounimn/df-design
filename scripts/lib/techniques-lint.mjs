// Lint for the technique cards in references/techniques/{fast,medium,high}.md. Pure text: no browser.
//
// root is a repository root: it holds references/techniques/*.md and references/recipes-motion.md.
// Card format (the good fixture in test/fixtures/techniques/good is the template):
//
//   ## Particles                            one card per h2, in the file of its tier
//   ### What it is
//   ### Where it comes from                 optional; if present it carries a source link (no source, no claim)
//   ### Suits
//   ### What it costs the visitor           a measured number with its unit, or "not measured" (and then no number)
//   ### Lighter version                     Medium and High only: a link to the card one tier down
//   ### For the builder
//   #### Where the cost was measured        followed by the fixed line (MEASURED_LINE)
import fs from 'node:fs';
import path from 'node:path';

export const TIERS = ['fast', 'medium', 'high'];
export const MEASURED_TITLE = 'Where the cost was measured';
export const MEASURED_LINE = "Fixed measurement examples; the project's references come from research (`identity.md` §6).";

const L = { what: 'What it is', history: 'Where it comes from', suits: 'Suits', cost: 'What it costs the visitor', lighter: 'Lighter version', builder: 'For the builder' };

// Words that belong to the builder, not to a reader who has not met the technique yet. Layers 1-5 may not use them.
// "Three" and "Spline" are also ordinary words at the start of a sentence; "three.js" never is.
const API_WORDS = [
  /WebGL/i, /WebGPU/i, /shader/i, /\b(?:uniform|vertex|fragment)\s+shader/i, /canvas/i, /GLSL/i,
  /\bthree\.js\b/i, /(?<!^|[.!?]\s)\bThree\b/m, /\bogl\b/i,
  /\bGSAP\b/i, /Lottie/i, /ScrollTrigger/i, /(?<!^|[.!?]\s)\bSpline\b/m,
  /requestAnimationFrame/i, /getContext/i,
  /backdrop-filter/i, /clip-path/i, /mix-blend-mode/i, /mask-image/i, /@keyframes/i, /@property/i, /animation-timeline/i,
];

const slug = (title) => title.toLowerCase().trim().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s/g, '-');

// Headings with their line numbers, ignoring anything inside a fenced code block.
function headings(text) {
  const out = [];
  let fenced = false;
  text.split('\n').forEach((line, i) => {
    if (/^\s*```/.test(line)) { fenced = !fenced; return; }
    if (fenced) return;
    const m = line.match(/^(#{1,6})\s+(.*?)\s*#*\s*$/);
    if (m) out.push({ level: m[1].length, title: m[2], slug: slug(m[2]), line: i });
  });
  return out;
}

const withoutFences = (text) => text.replace(/^\s*```[\s\S]*?^\s*```/gm, '');

// Every [text](target) in a text, without the fenced code.
function linksIn(text) {
  return [...withoutFences(text).matchAll(/\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)].map((m) => m[1]);
}

// A card is the lines from its h2 to the next h2; a layer is the lines from its h3 to the next h3 or h2.
function parseCards(text) {
  const lines = text.split('\n');
  const hs = headings(text);
  const cards = [];
  hs.forEach((h, idx) => {
    if (h.level !== 2) return;
    const end = hs.slice(idx + 1).find((n) => n.level <= 2)?.line ?? lines.length;
    const layers = [];
    hs.slice(idx + 1).filter((n) => n.line < end && n.level === 3).forEach((l3, k, all) => {
      const layerEnd = all[k + 1]?.line ?? end;
      layers.push({ title: l3.title, text: lines.slice(l3.line + 1, layerEnd).join('\n'), line: l3.line });
    });
    const builderStart = layers.find((l) => l.title === L.builder)?.line;
    // The card's title is a name, not prose: the API check starts on the line after it.
    cards.push({ name: h.title, slug: h.slug, text: lines.slice(h.line, end).join('\n'), top: lines.slice(h.line + 1, builderStart ?? end).join('\n'), layers, builderStart });
  });
  return cards;
}

const stripLinkTargets = (text) => text.replace(/\]\([^)]*\)/g, ']');
const NUMBER = /\d+(?:[.,]\d+)?\s*(?:KB|MB|ms|s|%|fps)\b/i;

export function lintTechniques(root) {
  const errors = [];
  const add = (file, card, rule, message) => errors.push({ file, card, rule, message });
  const techniquesDir = path.join(root, 'references', 'techniques');
  const read = (file) => (fs.existsSync(file) && fs.statSync(file).isFile() ? fs.readFileSync(file, 'utf8').replace(/\r\n/g, '\n') : null);
  const rel = (file) => path.relative(root, file).split(path.sep).join('/');

  const files = {};
  for (const tier of TIERS) {
    const file = path.join(techniquesDir, `${tier}.md`);
    const text = read(file);
    if (text === null) { add(rel(file), null, 'files', `references/techniques/${tier}.md does not exist`); continue; }
    files[tier] = { file, text, cards: parseCards(text), headings: headings(text) };
  }

  const anchorsOf = new Map(); // file -> Set of heading slugs, for links into other files
  const slugsOf = (file) => {
    if (!anchorsOf.has(file)) {
      const text = read(file);
      anchorsOf.set(file, text === null ? null : new Set(headings(text).map((h) => h.slug)));
    }
    return anchorsOf.get(file);
  };

  for (const [tier, f] of Object.entries(files)) {
    const fileLabel = rel(f.file);
    const below = TIERS[TIERS.indexOf(tier) - 1];
    const lower = TIERS.slice(0, TIERS.indexOf(tier)); // the lighter version may sit in any lower tier

    for (const card of f.cards) {
      const at = (rule, message) => add(fileLabel, card.name, rule, message);
      const titles = card.layers.map((l) => l.title);
      const layer = (title) => card.layers.find((l) => l.title === title);

      // layers: the six headings in order; history optional; the lighter version only above Fast.
      const required = [L.what, L.suits, L.cost, ...(below ? [L.lighter] : []), L.builder];
      const present = titles.filter((t) => t !== L.history);
      if (JSON.stringify(present) !== JSON.stringify(required)
        || (titles.includes(L.history) && titles.indexOf(L.history) !== titles.indexOf(L.what) + 1)) {
        at('layers', `layers should be ${[L.what, `[${L.history}]`, ...required.slice(1)].join(' > ')}; found ${titles.join(' > ') || 'none'}`);
      }

      // no-api-in-top-layers: everything before "For the builder".
      const topText = stripLinkTargets(card.top);
      for (const word of API_WORDS) {
        const hit = topText.match(word);
        if (hit) at('no-api-in-top-layers', `"${hit[0]}" belongs in "${L.builder}", not in layers 1-5`);
      }

      // history-has-source
      const history = layer(L.history);
      if (history && !/\]\(https?:\/\/[^)\s]+\)/.test(history.text)) at('history-has-source', `"${L.history}" has no source link: no source, no claim (drop the layer)`);

      // cost-number-or-not-measured
      const cost = layer(L.cost);
      if (cost) {
        const notMeasured = /not measured/i.test(cost.text);
        const numbered = NUMBER.test(cost.text);
        if (notMeasured && numbered) at('cost-number-or-not-measured', 'says "not measured" and shows a number');
        else if (!notMeasured && !numbered) at('cost-number-or-not-measured', 'needs a measured number with its unit (KB, ms, %) or "not measured"');
      }

      // lighter-resolves
      const lighter = layer(L.lighter);
      // "No lighter version:" is allowed only with a reason, so a missing fallback is a decision someone wrote down.
      if (below && lighter && !/^No lighter version:\s*\S.{9,}/.test(lighter.text.trim())) {
        const target = linksIn(lighter.text).find((l) => !/^(https?:|mailto:)/i.test(l));
        if (!target) at('lighter-resolves', `"${L.lighter}" needs a link to the same technique in a lower tier (${lower.map((x) => `${x}.md`).join(' or ')})`);
        else {
          const [p, anchor] = target.split('#');
          const resolved = path.resolve(path.dirname(f.file), p);
          const lowerTier = lower.find((x) => resolved === path.join(techniquesDir, `${x}.md`));
          if (!lowerTier) at('lighter-resolves', `"${L.lighter}" must link to ${lower.map((x) => `${x}.md`).join(' or ')}, a tier below ${tier} (found ${target})`);
          else if (anchor !== card.slug) at('lighter-resolves', `"${L.lighter}" must be the same technique in a lower tier (card "${card.name}"), not "${anchor ?? ''}"`);
          else if (!files[lowerTier]?.cards.some((c) => c.slug === anchor)) at('lighter-resolves', `${lowerTier}.md has no card "${card.name}"`);
        }
      }

      // measured-heading: the title and the fixed line inside "For the builder".
      const builder = layer(L.builder);
      if (builder) {
        const lines = builder.text.split('\n');
        const at4 = lines.findIndex((l) => new RegExp(`^#{4,6}\\s+${MEASURED_TITLE}\\s*$`).test(l));
        if (at4 < 0) at('measured-heading', `"${L.builder}" needs a heading "${MEASURED_TITLE}"`);
        else if (lines.slice(at4 + 1).find((l) => l.trim() !== '')?.trim() !== MEASURED_LINE) at('measured-heading', `"${MEASURED_TITLE}" must be followed at once by the line: ${MEASURED_LINE}`);
        // The sites are cost examples, never "references" or "inspiration" (that would stand in for the project's research).
        for (const l of lines) {
          const h = l.match(/^#{4,6}\s+(.*?)\s*$/);
          if (h && /references?|inspiration/i.test(h[1])) at('measured-heading', `the heading "${h[1]}" calls cost examples references or inspiration; use "${MEASURED_TITLE}"`);
        }
      }
    }

    // links-resolve: every relative link of the file points at something that exists, anchors included.
    for (const link of linksIn(f.text)) {
      if (/^(https?:|mailto:)/i.test(link)) continue;
      const [p, anchor] = link.split('#');
      const target = p === '' ? f.file : path.resolve(path.dirname(f.file), p);
      const slugs = fs.existsSync(target) ? (target.endsWith('.md') ? slugsOf(target) : new Set()) : null;
      if (slugs === null) add(fileLabel, null, 'links-resolve', `${link}: no such file`);
      else if (anchor && target.endsWith('.md') && !slugs.has(anchor)) add(fileLabel, null, 'links-resolve', `${link}: no heading "${anchor}"`);
    }
  }

  errors.push(...sectionRefErrors(root, read, rel));
  return { errors };
}

const SKIP_DIRS = new Set(['node_modules', '.git', '.cog', '.claude-flow', 'docs', 'captures', 'test']);
function markdownFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.isDirectory()) return SKIP_DIRS.has(e.name) ? [] : markdownFiles(path.join(dir, e.name));
    return e.name.endsWith('.md') ? [path.join(dir, e.name)] : [];
  });
}

// recipes-motion-section-refs-resolve: every "recipes-motion.md §N" in the repository's Markdown has an "N." heading
// (a kept section or a one-line stub) in references/recipes-motion.md.
function sectionRefErrors(root, read, rel) {
  const recipes = read(path.join(root, 'references', 'recipes-motion.md'));
  const known = new Set(recipes === null ? [] : headings(recipes).map((h) => h.title.match(/^(\d+)\./)?.[1]).filter(Boolean));
  const errors = [];
  for (const file of markdownFiles(root)) {
    const text = read(file);
    for (const m of text.matchAll(/recipes-motion(?:\.md)?`?\s*§\s*(\d+)/g)) {
      if (!known.has(m[1])) errors.push({ file: rel(file), card: null, rule: 'recipes-section-refs-resolve', message: `recipes-motion.md §${m[1]} has no heading "${m[1]}."` });
    }
  }
  return errors;
}
