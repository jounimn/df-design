export const ARCHETYPES = [
  'typographic', 'media-stage', 'canvas', 'interactive-demo', 'editorial', 'none', 'novel',
];

const HERO_MIN_PX = 40;
const DOMINANT_AREA = 0.45;
const HEAVY_MOTION = 25;
const SPARSE_TEXT = 120;
const LONG_TEXT = 1200;
const MANY_SECTIONS = 10;

// Order matters: a dominant visual stage outranks whatever type sits on top of it.
export function classifyArchetype(s) {
  const hero = s.hero ?? null;

  if (s.webgl || s.canvasAreaRatio >= DOMINANT_AREA) {
    return {
      archetype: 'canvas',
      reason: s.webgl
        ? 'WebGL context present'
        : `canvas covers ${(s.canvasAreaRatio * 100).toFixed(0)}% of the first viewport`,
    };
  }

  if (s.videoAreaRatio >= DOMINANT_AREA && (!hero || hero.fontSizePx < HERO_MIN_PX)) {
    return { archetype: 'media-stage', reason: 'video dominates the opening, type is secondary' };
  }

  if (hero && hero.fontSizePx >= HERO_MIN_PX) {
    if (s.firstViewportTextLength >= LONG_TEXT && s.sectionCount >= MANY_SECTIONS) {
      return { archetype: 'editorial', reason: 'large type but long running text across many sections' };
    }
    return { archetype: 'typographic', reason: `opening statement at ${hero.fontSizePx}px` };
  }

  if (s.animatedElementCount >= HEAVY_MOTION && s.firstViewportTextLength < SPARSE_TEXT) {
    return { archetype: 'interactive-demo', reason: 'heavy motion, sparse text, no opening statement' };
  }

  if (s.firstViewportTextLength >= LONG_TEXT && s.sectionCount >= MANY_SECTIONS) {
    return { archetype: 'editorial', reason: 'long running text across many sections' };
  }

  if (s.firstViewportTextLength > 0 || s.sectionCount > 0) {
    return { archetype: 'none', reason: 'page renders, but has no identifiable opening statement' };
  }

  // Nothing matched and nothing measurable. This is the interesting case:
  // richer capture and the quarantine queue, never a deletion. Spec §8.
  return { archetype: 'novel', reason: 'no known archetype matched; capture retained for schema review' };
}
