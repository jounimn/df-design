// Drawn assets: the doodles, spot illustrations and custom icons an identity draws for itself
// (references/drawn-assets.md). Three pure pieces the CLI (scripts/draw.mjs) puts together:
//   lintSet       reads a set of SVG sources and reports what breaks the set's one line and one palette
//   roughenPoints moves sampled points along their normals by seeded, smoothed noise: the hand, repeatable
//   pointsToPath  turns the moved points back into a smooth path (Catmull-Rom as cubic Béziers)

const MAX_WARN_BYTES = 16 * 1024;
const MAX_FAIL_BYTES = 64 * 1024;

const attrValues = (svg, name) => {
  const out = [];
  const attr = new RegExp(`\\s${name}\\s*=\\s*["']([^"']*)["']`, 'gi');
  for (const m of svg.matchAll(attr)) out.push(m[1].trim());
  const style = new RegExp(`(?:^|[;{\\s"'])${name}\\s*:\\s*([^;"'}]+)`, 'gi');
  for (const s of svg.matchAll(/style\s*=\s*["']([^"']*)["']/gi)) for (const m of (' ' + s[1]).matchAll(style)) out.push(m[1].trim());
  for (const s of svg.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)) for (const m of s[1].matchAll(style)) out.push(m[1].trim());
  return out;
};

const normColour = (c) => c.trim().toLowerCase().replace(/\s+/g, '');
const isFreeColour = (c) => /^(none|currentcolor|transparent|inherit)$/i.test(c) || /^var\(--[\w-]+(,[^)]*)?\)$/i.test(c.replace(/\s+/g, '')) || /^url\(#/.test(c);

// files: [{ name, svg }]; opts.stroke: the set's stroke width; opts.palette: colours allowed besides currentColor and var(--…)
export function lintSet(files, { stroke = null, palette = [] } = {}) {
  const findings = [];
  const report = (level, rule, file, detail) => findings.push({ level, rule, file, detail });
  const allowed = new Set(palette.map(normColour));
  const viewBoxes = new Map();
  const widths = new Map();
  const caps = new Map();

  for (const { name, svg } of files) {
    const bytes = Buffer.byteLength(svg, 'utf8');
    if (!/<svg[\s>]/i.test(svg)) { report('FAIL', 'not-svg', name, 'no <svg> element'); continue; }
    if (/<image[\s>]/i.test(svg) || /data:image\//i.test(svg)) report('FAIL', 'raster', name, 'a raster image inside the drawing; draw it or use a photograph in the page');
    if (/<text[\s>]/i.test(svg)) report('FAIL', 'text', name, 'live <text> inside the drawing; set words in the page, or outline the lettering');
    if (/<script[\s>]/i.test(svg) || /\son\w+\s*=/i.test(svg)) report('FAIL', 'script', name, 'script or an event handler inside the drawing');
    const vb = (svg.match(/<svg[^>]*\sviewBox\s*=\s*["']([^"']+)["']/i) || [])[1];
    if (!vb) report('FAIL', 'viewbox', name, 'no viewBox, so the drawing cannot scale');
    else viewBoxes.set(name, vb.trim().split(/[\s,]+/).map(Number).join(' '));
    for (const c of [...attrValues(svg, 'fill'), ...attrValues(svg, 'stroke')]) {
      if (!isFreeColour(c) && !allowed.has(normColour(c))) report('FAIL', 'colour', name, `${c} is not currentColor, a var(--token) or a palette colour`);
    }
    const ws = attrValues(svg, 'stroke-width').map((w) => parseFloat(w)).filter(Number.isFinite);
    widths.set(name, [...new Set(ws)]);
    if (stroke != null) for (const w of new Set(ws)) if (Math.abs(w - stroke) > 0.01) report('FAIL', 'stroke-width', name, `stroke-width ${w}; the set draws at ${stroke}`);
    caps.set(name, [...new Set(attrValues(svg, 'stroke-linecap').map((c) => c.toLowerCase()))]);
    if (bytes > MAX_FAIL_BYTES) report('FAIL', 'weight', name, `${Math.round(bytes / 1024)} KB; a drawing this heavy is an illustration file, not a doodle`);
    else if (bytes > MAX_WARN_BYTES) report('WARN', 'weight', name, `${Math.round(bytes / 1024)} KB; simplify the paths (roughen --step larger)`);
  }

  const distinctVb = new Set(viewBoxes.values());
  if (distinctVb.size > 1) {
    const counts = {}; for (const v of viewBoxes.values()) counts[v] = (counts[v] || 0) + 1;
    const common = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    for (const [name, v] of viewBoxes) if (v !== common) report('WARN', 'viewbox', name, `viewBox ${v}; most of the set is ${common}, so it will draw at another scale`);
  }
  if (stroke == null) {
    const all = new Set([...widths.values()].flat());
    if (all.size > 1) report('WARN', 'stroke-width', '(set)', `the set draws at ${[...all].sort((a, b) => a - b).join(', ')}; one line is one width`);
  }
  const allCaps = new Set([...caps.values()].flat());
  if (allCaps.size > 1) report('WARN', 'linecap', '(set)', `line caps ${[...allCaps].join(' and ')} in one set`);
  return findings;
}

// Seeded generator (mulberry32): the same seed draws the same hand every time.
export function rng(seed) {
  let a = (seed >>> 0) || 1;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// points: [[x, y], ...] sampled along one stroke. Moves each point along the local normal by noise in
// [-amount, amount], smoothed over `smooth` neighbours so the line wavers instead of jittering.
// The ends of an open stroke move by half, so joins between strokes still meet.
export function roughenPoints(points, { seed = 1, amount = 0.8, smooth = 3, closed = false } = {}) {
  const n = points.length;
  if (n < 3 || amount <= 0) return points.map((p) => [...p]);
  const r = rng(seed);
  const raw = Array.from({ length: n }, () => r() * 2 - 1);
  const off = raw.map((_, i) => {
    let s = 0, c = 0;
    for (let k = -smooth; k <= smooth; k++) {
      let j = i + k;
      if (closed) j = (j + n) % n; else if (j < 0 || j >= n) continue;
      s += raw[j]; c++;
    }
    return (s / c) * amount * Math.sqrt(smooth + 1);
  });
  return points.map((p, i) => {
    const a = points[closed ? (i - 1 + n) % n : Math.max(0, i - 1)];
    const b = points[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0], dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
    const end = !closed && (i === 0 || i === n - 1) ? 0.5 : 1;
    const d = Math.max(-amount, Math.min(amount, off[i])) * end;
    return [p[0] - dy * d, p[1] + dx * d];
  });
}

const f = (v) => (Math.round(v * 100) / 100).toString();

// Catmull-Rom through the points, written as cubic Béziers.
export function pointsToPath(points, { closed = false } = {}) {
  const n = points.length;
  if (n === 0) return '';
  if (n === 1) return `M${f(points[0][0])} ${f(points[0][1])}`;
  const at = (i) => points[closed ? (i + n) % n : Math.max(0, Math.min(n - 1, i))];
  let d = `M${f(points[0][0])} ${f(points[0][1])}`;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += `C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  return closed ? d + 'Z' : d;
}
