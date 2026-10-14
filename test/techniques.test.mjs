import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { lintTechniques, MEASURED_LINE } from '../scripts/lib/techniques-lint.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const GOOD = path.join(HERE, 'fixtures', 'techniques', 'good');
const REPO = path.join(HERE, '..');

// The good card set is the template. Each bad case is that set with one thing broken, in a temporary copy.
function broken(edits = {}, { remove = [] } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cartões teste '));
  fs.cpSync(GOOD, root, { recursive: true });
  // A Windows checkout (core.autocrlf) turns the fixture's line ends into CRLF; the edits below are written with LF.
  for (const file of fs.readdirSync(root, { recursive: true })) {
    const full = path.join(root, file);
    if (full.endsWith('.md')) fs.writeFileSync(full, fs.readFileSync(full, 'utf8').replace(/\r\n/g, '\n'));
  }
  for (const [file, pairs] of Object.entries(edits)) {
    const target = path.join(root, 'references', file);
    let text = fs.readFileSync(target, 'utf8');
    for (const [from, to] of pairs) {
      assert.ok(text.includes(from), `fixture edit: "${from}" is not in ${file}`);
      text = text.replace(from, () => to);
    }
    fs.writeFileSync(target, text);
  }
  for (const file of remove) fs.rmSync(path.join(root, 'references', file));
  return { root, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) };
}
const lint = (edits, options) => {
  const fx = broken(edits, options);
  try { return lintTechniques(fx.root).errors; } finally { fx.cleanup(); }
};
const rules = (errors) => [...new Set(errors.map((e) => e.rule))];

// A second Medium card, so a link can point at a card that exists but is another technique.
const HALFTONE = [
  '## Halftone', '', '### What it is', '', 'A screen of dots that makes a picture.', '',
  '### Suits', '', 'Print-minded brands.', '',
  '### What it costs the visitor', '', 'not measured', '',
  '### Lighter version', '', '[Halftone](fast.md#particles)', '',
  '### For the builder', '', 'A loop with a poster.', '',
  '#### Where the cost was measured', '', MEASURED_LINE, '', '- Not measured.', '',
].join('\n');

test('the good card set passes every rule', () => {
  assert.deepEqual(lintTechniques(GOOD).errors, []);
});

const CASES = [
  ['layers: a missing layer', { 'techniques/fast.md': [['### Suits', '### Fits']] }, 'layers'],
  ['layers: the lighter version is required above Fast', { 'techniques/medium.md': [['### Lighter version', '### A simpler one']] }, 'layers'],
  ['layers: Fast has no lighter version', { 'techniques/fast.md': [['### For the builder', '### Lighter version\n\n[x](fast.md#particles)\n\n### For the builder']] }, 'layers'],
  ['no-api-in-top-layers: WebGL in layer 1', { 'techniques/fast.md': [['small dots', 'small WebGL dots']] }, 'no-api-in-top-layers'],
  ['no-api-in-top-layers: a library name in layer 4', { 'techniques/high.md': [['About 340 KB', 'About 340 KB with Three']] }, 'no-api-in-top-layers'],
  ['history-has-source: layer 2 without a link', { 'techniques/fast.md': [['([Wikipedia, Screensaver](https://en.wikipedia.org/wiki/Screensaver))', '(Wikipedia)']] }, 'history-has-source'],
  ['cost-number-or-not-measured: neither', { 'techniques/fast.md': [['About 4 KB, appears with the first paint (median of 2 sites).', 'Light and quick.']] }, 'cost-number-or-not-measured'],
  ['cost-number-or-not-measured: both', { 'techniques/medium.md': [['not measured\n', 'not measured, about 20 KB\n']] }, 'cost-number-or-not-measured'],
  ['lighter-resolves: a link into the same tier', { 'techniques/medium.md': [['(fast.md#particles)', '(medium.md#particles)']] }, 'lighter-resolves'],
  ['lighter-resolves: another technique, not the same one a tier down', {
    'techniques/high.md': [['(medium.md#particles)', '(medium.md#halftone)']],
    'techniques/medium.md': [['- Not measured.\n', `- Not measured.\n\n${HALFTONE}`]],
  }, 'lighter-resolves'],
  ['links-resolve: an anchor that is not there', { 'techniques/fast.md': [['identity-library.md#blueprint', 'identity-library.md#nothing']] }, 'links-resolve'],
  ['links-resolve: a file that is not there', { 'techniques/fast.md': [['../identity-library.md#blueprint', '../identities.md#blueprint']] }, 'links-resolve'],
  ['recipes-section-refs-resolve: a section that does not exist', { 'techniques/fast.md': [['`recipes-motion.md` §14', '`recipes-motion.md` §99']] }, 'recipes-section-refs-resolve'],
  ['measured-heading: layer 6 without the title', { 'techniques/fast.md': [['#### Where the cost was measured\n', '#### Sites\n']] }, 'measured-heading'],
  ['measured-heading: the title without the fixed line', { 'techniques/high.md': [[MEASURED_LINE, 'References for this technique.']] }, 'measured-heading'],
];
for (const [name, edits, rule] of CASES) {
  test(`${name} fails only ${rule}`, () => {
    const errors = lint(edits);
    assert.deepEqual(rules(errors), [rule], JSON.stringify(errors));
    for (const e of errors) {
      assert.equal(typeof e.file, 'string');
      assert.equal(typeof e.message, 'string');
      assert.ok(e.message.length > 10);
    }
  });
}

test('files: a missing tier file fails only files', () => {
  assert.deepEqual(rules(lint({}, { remove: ['techniques/high.md'] })), ['files']);
});

test('an error names the card it is about', () => {
  const [e] = lint({ 'techniques/fast.md': [['small dots', 'small WebGL dots']] });
  assert.equal(e.card, 'Particles');
  assert.equal(e.file, 'references/techniques/fast.md');
});

test('Three at the start of a sentence is a number, not a library; "no lighter version" is allowed with a reason', () => {
  assert.deepEqual(lint({ 'techniques/fast.md': [['A handful of small dots that drift slowly behind the headline.', 'Three small dots drift slowly behind the headline.']] }), []);
  assert.deepEqual(lint({ 'techniques/high.md': [['[Particles](medium.md#particles): the same idea with hundreds of dots.', 'No lighter version: the effect is the technique itself.']] }), []);
});

// Until the cards are written (Tasks 11-14) the real references do not pass; Task 15 turns this on.
test('the real references/techniques/*.md pass', { todo: 'until the cards land (Tasks 11-15)' }, () => {
  assert.deepEqual(lintTechniques(REPO).errors, []);
});
