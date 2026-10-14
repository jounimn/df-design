// Turns probe records (with canvases, see canvas-trace.mjs) into the numbers the technique cards quote and the
// tier ceilings check-motion enforces. Pure functions: no browser, no file writes.
//
// cohort: { [technique]: { tier: 'fast' | 'medium' | 'high', sites: string[] } }, sites as the record's `site`.

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

export function summariseCanvases(records, cohort) {
  const techniques = {};
  const tierSites = Object.fromEntries(TIERS.map((t) => [t, new Map()]));

  for (const [name, { tier, sites }] of Object.entries(cohort)) {
    const measured = records
      .filter((r) => sites.includes(r.site) && usable(r))
      .map((r) => ({ record: r, animating: r.canvases.filter((c) => c.animating === true) }))
      .filter((m) => m.animating.length > 0);
    if (!measured.length) { techniques[name] = 'not measured'; continue; }

    const canvases = measured.flatMap((m) => m.animating);
    const weights = measured.map((m) => m.record.canvasJsBytes?.motionJsBytes).filter((w) => typeof w === 'number');

    const byRenderer = new Map();
    for (const c of canvases) {
      const label = c.renderer ?? `${c.context} (no GPU renderer)`;
      if (!byRenderer.has(label)) byRenderer.set(label, []);
      byRenderer.get(label).push(c);
    }

    techniques[name] = {
      tier,
      sites: measured.length,
      canvases: canvases.length,
      weight: weights.length ? spread(weights) : null,
      frameMs: [...byRenderer.entries()].map(([renderer, list]) => ({
        renderer,
        n: list.length,
        p50: spread(list.map((c) => c.frameMs.p50)),
        p95: spread(list.map((c) => c.frameMs.p95)),
      })),
      reducedMotionShare: share(canvases, (c) => (c.reducedMotionAnimating === null || c.reducedMotionAnimating === undefined ? null : c.reducedMotionAnimating === false)),
      offscreenPauseShare: share(canvases, (c) => (c.drawCallsOffscreen === null || c.drawCallsOffscreen === undefined ? null : c.drawCallsOffscreen === 0)),
      fallbackShare: share(canvases, (c) => (c.fallbackVisible === null || c.fallbackVisible === undefined ? null : c.fallbackVisible === true)),
    };

    // A site feeds its tier once, however many techniques cite it.
    for (const m of measured) {
      const w = m.record.canvasJsBytes?.motionJsBytes;
      if (typeof w === 'number' && tierSites[tier]) tierSites[tier].set(m.record.site, w);
    }
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
    lines.push(`| ${name} | ${t.tier} | ${t.sites} | ${t.canvases} | ${t.weight ? range(t.weight, kb) : 'n/a'} | ${pct(t.reducedMotionShare)} | ${pct(t.offscreenPauseShare)} | ${pct(t.fallbackShare)} |`);
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
