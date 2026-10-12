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

test('a Creative Commons BY licence page needs credit even though URLs are otherwise ignored', () => {
  for (const u of ['https://creativecommons.org/licenses/by/4.0/', 'https://creativecommons.org/licenses/by-sa/3.0', 'http://creativecommons.org/licenses/by-nc-nd/2.0/deed.en']) {
    assert.equal(licenceNeedsCredit(`| a.jpg | https://x.example/a | ${u} |`), true, u);
  }
  assert.equal(licenceNeedsCredit('| a.jpg | https://creativecommons.org/publicdomain/zero/1.0/ | CC0 |'), false);
});

test('more ways to say credit is owed', () => {
  for (const l of ['Creative Commons BY 4.0', 'Attribution', 'Attribution needed', 'attribution appreciated', 'Free with attribution', 'Free to use, credit the photographer', 'photographer credit', 'credit to the author required', 'Credit required']) {
    assert.equal(licenceNeedsCredit(`| a.jpg | https://x | ${l} |`), true, l);
  }
});

test('phrases that say no credit is owed stay clear', () => {
  for (const l of ['CC0', 'Pexels License, attribution optional', 'Unsplash, no attribution needed', 'credit not necessary', 'without attribution', 'Public domain, credit unnecessary']) {
    assert.equal(licenceNeedsCredit(`| a.jpg | https://x | ${l} |`), false, l);
  }
});

test('more placeholders: None, TBD., N.A., tbc', () => {
  for (const l of ['None', 'none.', 'TBD.', 'T.B.D.', 'N.A.', 'n.a', 'tbc', 'TBC', '???']) assert.equal(licenceIsPlaceholder(l), true, l);
  for (const l of ['CC0', 'Pexels License', 'Unsplash License', 'Public Domain']) assert.equal(licenceIsPlaceholder(l), false, l);
});

test('any mention of credit needs credit, once negations are gone', () => {
  for (const l of ['Free to use with credit', 'Credit: Jane Doe', 'Must credit author', 'Give credit', 'Credit line required', 'Requires crediting the author', 'credits to the studio', 'Mario Bruno credit required']) {
    assert.equal(licenceNeedsCredit(`| a.jpg | https://x | ${l} |`), true, l);
  }
  for (const l of ['no credit required', 'No credit', 'does not require credit', "doesn't require credit", 'credit not needed', 'credit required: no', 'without credit']) {
    assert.equal(licenceNeedsCredit(`| a.jpg | https://x | Pexels License, ${l} |`), false, l);
  }
});
