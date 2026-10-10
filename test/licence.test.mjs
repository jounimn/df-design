import test from 'node:test';
import assert from 'node:assert/strict';
import { licenceNeedsCredit } from '../scripts/lib/licence.mjs';

test('CC BY needs credit', () => assert.equal(licenceNeedsCredit('| a.jpg | CC BY 4.0 |'), true));
test('CC0 does not', () => assert.equal(licenceNeedsCredit('| a.jpg | CC0 |'), false));
test('negated phrase does not', () => assert.equal(licenceNeedsCredit('Unsplash License, no attribution required'), false));
test('requires credit does', () => assert.equal(licenceNeedsCredit('free, requires credit'), true));
