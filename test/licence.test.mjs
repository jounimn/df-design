import test from 'node:test';
import assert from 'node:assert/strict';
import { licenceNeedsCredit } from '../scripts/lib/licence.mjs';

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
