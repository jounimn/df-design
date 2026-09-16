import test from 'node:test';
import assert from 'node:assert/strict';
import { classifyArchetype } from '../scripts/lib/archetype.mjs';

const base = {
  hero: null, canvasAreaRatio: 0, webgl: false, videoAreaRatio: 0,
  firstViewportTextLength: 200, sectionCount: 6, animatedElementCount: 0,
};

test('a large heading is typographic', () => {
  const r = classifyArchetype({ ...base, hero: { fontSizePx: 72, tag: 'h1', textLength: 24 } });
  assert.equal(r.archetype, 'typographic');
});

test('a dominant canvas wins over a heading', () => {
  const r = classifyArchetype({
    ...base, canvasAreaRatio: 0.7, webgl: true,
    hero: { fontSizePx: 64, tag: 'h1', textLength: 20 },
  });
  assert.equal(r.archetype, 'canvas');
});

test('a heroless animated page is canvas, not a dropped record', () => {
  const r = classifyArchetype({
    ...base, hero: null, canvasAreaRatio: 0.9, webgl: true,
    firstViewportTextLength: 30, animatedElementCount: 40,
  });
  assert.equal(r.archetype, 'canvas');
  assert.ok(r.reason.length > 0);
});

test('a dominant video with a small heading is a media stage', () => {
  const r = classifyArchetype({
    ...base, videoAreaRatio: 0.55,
    hero: { fontSizePx: 32, tag: 'h1', textLength: 40 },
  });
  assert.equal(r.archetype, 'media-stage');
});

test('heavy motion with little text is an interactive demo', () => {
  const r = classifyArchetype({
    ...base, hero: null, firstViewportTextLength: 40, animatedElementCount: 60,
  });
  assert.equal(r.archetype, 'interactive-demo');
});

test('long text across many sections with a small heading is editorial', () => {
  const r = classifyArchetype({
    ...base, hero: { fontSizePx: 30, tag: 'h1', textLength: 60 },
    firstViewportTextLength: 1800, sectionCount: 14,
  });
  assert.equal(r.archetype, 'editorial');
});

test('a plain page with no opening statement is none, not novel', () => {
  const r = classifyArchetype({ ...base, hero: null, firstViewportTextLength: 300 });
  assert.equal(r.archetype, 'none');
});

test('nothing measurable at all is novel', () => {
  const r = classifyArchetype({
    ...base, hero: null, firstViewportTextLength: 0, sectionCount: 0,
  });
  assert.equal(r.archetype, 'novel');
});
