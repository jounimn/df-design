// Turns probe records (with canvases, see canvas-trace.mjs) into the numbers the technique cards quote and the
// tier ceilings check-motion enforces. Pure functions: no browser, no file writes.
//
// cohort: { [technique]: { tier: 'fast' | 'medium' | 'high', sites: string[] } }, sites as the record's `site`.
//
// summariseCanvases(records, cohort) returns { techniques, tiers }:
//   techniques[name] = 'not measured' (no usable record), or
//     { tier, sites, canvases, weight, frameMs, reducedMotionShare, offscreenPauseShare, fallbackShare } where
//       sites   = distinct sites measured (page weight known or an animating canvas), latest probe per site;
//       canvases = animating canvases among them (0 for a CSS/DOM-only technique: the canvas metrics are then
//                  empty/null and render as "not measured", while weight is still filled from the page field);
//       weight  = { min, median, max } of motionJsBytes, or null;
//       frameMs = [{ renderer, n, p50: {min, median, max}, p95: {min, median, max} }], one entry per renderer, n =
//                  distinct frame-time windows (never compared across renderers);
//       *Share  = fraction 0..1 of the canvases that could be judged, or null when none could.
//   tiers[tier] = { p75, n } of motionJsBytes over the distinct sites of that tier (absent without data).
// ceilingsFrom(summary) = { [tier]: p75 bytes }; renderBenchmarkSection(summary, date) = the markdown section.

const TIERS = ['fast', 'medium', 'high'];

const sorted = (values) => [...values].sort((a, b) => a - b);

function median(values) {
  const s = sorted(values);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

// Nearest rank: the smallest value with at least 75 % of the data at or below it.
const p75 = (values) => sorted(values)[Math.ceil(0.75 * values.length) - 1];

const spread = (values) => ({ min: Math.min(...values), median: median(values), max: Math.max(...values) });

// The share of canvases for which `judge` says yes, among those it could judge (true/false, not null).
function share(canvases, judge) {
  const judged = canvases.map(judge).filter((v) => v !== null);
  return judged.length ? judged.filter(Boolean).length / judged.length : null;
}

// A record from before canvas tracing has no canvases; a failed trace has null. Neither is evidence of anything.
const usable = (record) => Array.isArray(record.canvases);
const weightOf = (record) => (typeof record.canvasJsBytes?.motionJsBytes === 'number' ? record.canvasJsBytes.motionJsBytes : null);

// One record per site, the most recent (measured_at, then later in the list) when a site was probed more than once.
function latestPerSite(records) {
  const latest = new Map();
  for (const r of records) {
    const kept = latest.get(r.site);
    if (!kept || String(r.measured_at ?? '') >= String(kept.measured_at ?? '')) latest.set(r.site, r);
  }
  return [...latest.values()];
}

// Frame time is measured per window, so canvases that shared a window carry the same numbers: each distinct
// (renderer, p50, p95) of a page counts once, and a canvas that never got a frame (rafPerSec 0) has none to report.
function frameTimes(measured) {
  const byRenderer = new Map();
  for (const m of measured) {
    const seen = new Set();
    for (const c of m.animating) {
      if (c.rafPerSec === 0 || !c.frameMs) continue;
      const label = c.renderer ?? (c.context === '2d' ? '2d (no GPU renderer)' : 'unknown renderer');
      const key = `${label}|${c.frameMs.p50}|${c.frameMs.p95}`;
      if (seen.has(key)) continue;
      seen.add(key);
      if (!byRenderer.has(label)) byRenderer.set(label, []);
      byRenderer.get(label).push(c);
    }
  }
  return [...byRenderer.entries()].map(([renderer, list]) => ({
    renderer,
    n: list.length,
    p50: spread(list.map((c) => c.frameMs.p50)),
    p95: spread(list.map((c) => c.frameMs.p95)),
  }));
}

export function summariseCanvases(records, cohort) {
  const techniques = {};
  const tierSites = Object.fromEntries(TIERS.map((t) => [t, new Map()]));

  for (const [name, { tier, sites }] of Object.entries(cohort)) {
    // A site counts for a technique when its page weight is known or a canvas of it animates; the weight is a page
    // field (spec 3.1), so a CSS/DOM-only technique has one although it has no canvas to measure.
    const measured = latestPerSite(records.filter((r) => sites.includes(r.site) && usable(r)))
      .map((r) => ({ record: r, weight: weightOf(r), animating: r.canvases.filter((c) => c.animating === true) }))
      .filter((m) => m.weight !== null || m.animating.length > 0);
    if (!measured.length) { techniques[name] = 'not measured'; continue; }

    const canvases = measured.flatMap((m) => m.animating);
    const weights = measured.map((m) => m.weight).filter((w) => w !== null);

    techniques[name] = {
      tier,
      sites: measured.length,
      canvases: canvases.length,
      weight: weights.length ? spread(weights) : null,
      frameMs: frameTimes(measured),
      reducedMotionShare: share(canvases, (c) => (c.reducedMotionAnimating === null || c.reducedMotionAnimating === undefined ? null : c.reducedMotionAnimating === false)),
      offscreenPauseShare: share(canvases, (c) => (c.drawCallsOffscreen === null || c.drawCallsOffscreen === undefined ? null : c.drawCallsOffscreen === 0)),
      fallbackShare: share(canvases, (c) => (c.fallbackVisible === null || c.fallbackVisible === undefined ? null : c.fallbackVisible === true)),
    };

    // A site feeds its tier once, however many techniques cite it.
    for (const m of measured) if (m.weight !== null && tierSites[tier]) tierSites[tier].set(m.record.site, m.weight);
  }

  const tiers = {};
  for (const tier of TIERS) {
    const weights = [...tierSites[tier].values()];
    if (weights.length) tiers[tier] = { p75: p75(weights), n: weights.length };
  }
  return { techniques, tiers };
}

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;
const pct = (v) => (v === null ? 'n/a' : `${Math.round(v * 100)} %`);
const range = (s, fmt) => `${fmt(s.min)} / ${fmt(s.median)} / ${fmt(s.max)}`;

export function renderBenchmarkSection(summary, date) {
  const lines = [
    `## Canvas and WebGL, measured ${date}`,
    '',
    'Production sites probed one at a time in headless Chromium. Frame times are only comparable within one renderer:',
    'software rendering (SwiftShader) is several times slower than a GPU, so every number names its renderer.',
    '',
    '### Per technique',
    '',
    '| Technique | Tier | Sites | Canvases | Motion JS (min / median / max) | Reduced motion honoured | Pauses off-screen | Fallback without WebGL |',
    '|---|---|---|---|---|---|---|---|',
  ];
  for (const [name, t] of Object.entries(summary.techniques)) {
    if (t === 'not measured') { lines.push(`| ${name} | | not measured | | | | | |`); continue; }
    const weight = t.weight ? range(t.weight, kb) : 'n/a';
    // No animating canvas: the weight is still real, the canvas columns are not measured.
    if (!t.canvases) { lines.push(`| ${name} | ${t.tier} | ${t.sites} | not measured | ${weight} | not measured | not measured | not measured |`); continue; }
    lines.push(`| ${name} | ${t.tier} | ${t.sites} | ${t.canvases} | ${weight} | ${pct(t.reducedMotionShare)} | ${pct(t.offscreenPauseShare)} | ${pct(t.fallbackShare)} |`);
  }
  lines.push('', '### Frame time by renderer', '', '| Technique | Renderer | Canvases | p50 ms (min / median / max) | p95 ms (min / median / max) |', '|---|---|---|---|---|');
  for (const [name, t] of Object.entries(summary.techniques)) {
    if (t === 'not measured') continue;
    for (const r of t.frameMs) lines.push(`| ${name} | ${r.renderer} | ${r.n} | ${range(r.p50, (v) => v)} | ${range(r.p95, (v) => v)} |`);
  }
  lines.push('', '### Tier ceilings (p75 of motion JS)', '', '| Tier | Sites | p75 |', '|---|---|---|');
  for (const tier of TIERS) {
    const t = summary.tiers[tier];
    lines.push(t ? `| ${tier} | ${t.n} | ${kb(t.p75)} |` : `| ${tier} | not measured | |`);
  }
  return `${lines.join('\n')}\n`;
}

// The ceilings check-motion enforces, in bytes, only for tiers that have data.
export function ceilingsFrom(summary) {
  return Object.fromEntries(Object.entries(summary.tiers).map(([tier, t]) => [tier, t.p75]));
}
