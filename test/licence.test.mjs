import test from 'node:test';
import assert from 'node:assert/strict';
import { licenceNeedsCredit, licenceIsPlaceholder } from '../scripts/lib/licence.mjs';

test('CC BY needs credit', () => assert.equal(licenceNeedsCredit('| a.jpg | CC BY 4.0 |'), true));
test('CC0 does not', () => assert.equal(licenceNeedsCredit('| a.jpg | CC0 |'), false));
test('negated phrase does not', () => assert.equal(licenceNeedsCredit('Unsplash License, no attribution required'), false));
test('requires credit does', () => assert.equal(licenceNeedsCredit('free, requires credit'), true));
test('URL containing cc-by does not count', () => assert.equal(licenceNeedsCredit('| a.jpg | https://x.com/cc-by/a.jpg | Pexels |'), false));
test('URL ignored but a real CC BY next to it still counts', () => assert.equal(licenceNeedsCredit('| a.jpg | https://x.com/a.jpg | CC BY 4.0 |'), true));
test('"does not require attribution" does not count', () => assert.equal(licenceNeedsCredit('Pexels License, does not require attribution'), false));
test('"attribution required: no" does not count', () => assert.equal(licenceNeedsCredit('Free licence; attribution required: no'), false));
test('"credit required: no" does not count', () => assert.equal(licenceNeedsCredit('credit required: no'), false));
test('CC BY with "attribution not required" still counts', () => assert.equal(licenceNeedsCredit('CC BY 4.0, attribution not required'), true));
test('a URL between pipes does not swallow the licence column', () => assert.equal(licenceNeedsCredit('|a.jpg|https://x.com/a.jpg|CC BY 4.0|'), true));
test('"doesn\'t require attribution" does not count', () => assert.equal(licenceNeedsCredit("Pexels License, doesn't require attribution"), false));
test('"don\'t require credit" does not count', () => assert.equal(licenceNeedsCredit("terms don't require credit"), false));
test('"Attribution 4.0 International" is CC BY and needs credit', () => {
  for (const l of ['Attribution 4.0 International', 'Licence: attribution 3.0 unported', 'CC Attribution 2.0 Generic']) assert.equal(licenceNeedsCredit(`| a.jpg | ${l} |`), true, l);
  assert.equal(licenceNeedsCredit('| a.jpg | Attribution not required, 2024 |'), false);
});

test('placeholder licences are not a recorded licence', () => {
  for (const l of ['', ' ', 'TBD', 'tba', 'TODO', '-', '--', '—', 'n/a', 'N/A', 'na', '?', '??', '...', 'unknown', 'pending']) assert.equal(licenceIsPlaceholder(l), true, JSON.stringify(l));
  for (const l of ['CC0', 'Pexels License', 'Public Domain', 'Unsplash License']) assert.equal(licenceIsPlaceholder(l), false, l);
});
