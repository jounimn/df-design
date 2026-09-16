import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRecord } from '../scripts/lib/validate.mjs';

const ok = {
  site: 'example.com',
  pageHeightPx: 9329,
  viewportHeightPx: 900,
  lazySignals: false,
  ctaRadiusPx: 6,
  ctaSmallerDimPx: 44,
  groundColor: 'rgb(12, 14, 18)',
  fontFaceCount: 5,
  renderedTextLength: 4000,
  hero: { fontSizePx: 64, tag: 'h1', textLength: 20 },
};

test('a clean record passes with an empty quarantine', () => {
  const { record, quarantine } = validateRecord(ok);
  assert.equal(quarantine.length, 0);
  assert.equal(record.pageHeightPx, 9329);
});

test('a short page height on a lazy-loading site is quarantined', () => {
  const { record, quarantine } = validateRecord({ ...ok, pageHeightPx: 900, lazySignals: true });
  assert.equal(record.pageHeightPx, undefined);
  assert.equal(quarantine.length, 1);
  assert.equal(quarantine[0].field, 'pageHeightPx');
});

test('a short page height WITHOUT lazy signals is kept', () => {
  const { record, quarantine } = validateRecord({ ...ok, pageHeightPx: 900, lazySignals: false });
  assert.equal(record.pageHeightPx, 900);
  assert.equal(quarantine.length, 0);
});

test('an absurd radius that resolves to a pill is normalised, not rejected', () => {
  const { record, quarantine } = validateRecord({ ...ok, ctaRadiusPx: 33554432, ctaSmallerDimPx: 44 });
  assert.equal(record.ctaRadius, 'pill');
  assert.equal(quarantine.length, 0);
});

test('an absurd radius that is not a pill is quarantined', () => {
  const { record, quarantine } = validateRecord({ ...ok, ctaRadiusPx: 900, ctaSmallerDimPx: 4000 });
  assert.equal(record.ctaRadiusPx, undefined);
  assert.equal(quarantine[0].field, 'ctaRadiusPx');
});

test('a fully transparent ground is quarantined', () => {
  const { record, quarantine } = validateRecord({ ...ok, groundColor: 'rgba(0, 0, 0, 0)' });
  assert.equal(record.groundColor, undefined);
  assert.equal(quarantine[0].field, 'groundColor');
});

test('zero font faces on a page that rendered text is quarantined', () => {
  const { quarantine } = validateRecord({ ...ok, fontFaceCount: 0, renderedTextLength: 4000 });
  assert.equal(quarantine[0].field, 'fontFaceCount');
});

test('an absent hero is legal and never quarantined', () => {
  const { record, quarantine } = validateRecord({ ...ok, hero: null });
  assert.equal(quarantine.length, 0);
  assert.equal(record.hero, null);
});

test('quarantining never removes the record itself', () => {
  const { record } = validateRecord({
    ...ok, pageHeightPx: 100, lazySignals: true, groundColor: 'rgba(0, 0, 0, 0)', fontFaceCount: 0,
  });
  assert.equal(record.site, 'example.com');
});
