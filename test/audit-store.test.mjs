import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { auditStore } from '../scripts/lib/store-audit.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.join(HERE, '..');
const CLI = path.join(REPO, 'scripts', 'audit-store.mjs');
const TODAY = new Date('2026-10-29');

// A tiny store: one family, two identities, a per-site table of four rows whose medians the aggregate states.
function store(edits = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'df-store-'));
  fs.mkdirSync(path.join(root, 'references', 'identities'), { recursive: true });
  const files = {
    'SKILL.md': `# s\n\n| Measure | Production median | Common failure |\n|---|---|---|\n| Hero type size | **64px** (range 44–112) | x |\n| Page height | **9,000px** | x |\n| Distinct font faces | **5** | x |\n| CTA corner radius | **6px** | x |\n\nSee \`identity.md\` §1 and \`identity.md\` §2 and \`references/identity.md\`.\n`,
    'references/identity.md': `# i\n\n## 1. One\n\n## 2. Two\n`,
    'references/identity-library.md': `# lib\n\n## Index\n\n### Fam — \`identities/fam.md\` (2)\n\n| Identity | Says | Fits | Load |\n|---|---|---|---|\n| Alpha | a | b | fast |\n| Beta | a | b | medium |\n`,
    'references/identities/fam.md': `# fam\n\nURLs were checked live on 2026-10-05.\n\n### Alpha\n- **Grammar:** g\n- **Says:** s\n- **Fits:** f. **Misfits:** m\n- **Trap:** t\n- **Load:** fast\n- **Seen at:** alpha.example — a site\n- **Search:** q\n\n### Beta\n- **Grammar:** g\n- **Says:** s\n- **Fits:** f. **Misfits:** m\n- **Trap:** t\n- **Load:** medium\n- **Seen at:** beta.example — a site\n- **Search:** q\n`,
    'references/benchmarks.md': `# b\n\nMeasured 2026-09-15.\n\n## Aggregate\n\n| Measure | Min | Median | Max |\n|---|---|---|---|\n| Hero font-size | 44px | **64px** | 112px |\n| Hero letter-spacing | -0.07em | **-0.025em** | ~0 |\n| Page scroll height | 4,000px | **9,000px** | 12,000px |\n| Distinct loaded faces | 2 | **5** | 8 |\n| CTA corner radius | 0px | **6px** | 100px (pill) |\n\n| Proportion | Count |\n|---|---|\n| Ships a monospace or instrument face | **3 / 4 (75%)** |\n| Uses Inter (or Inter Variable) as the **display** face | **1 / 4 (25%)** |\n| Honours \`prefers-reduced-motion\` in CSS | 2 / 4 (50%) |\n\n## Per-site data\n\n| Site | Display face | Hero px | Tracking | Faces | Mono | Ground | Accent | Radius | Masks+blend+clip | Sticky | RM rules | Height |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|\n| a.com | Inter | 44 | -0.070em | 2 | yes | x | y | 0px | 1 | 0 | 0 | 4000 |\n| b.com | Söhne | 60 | -0.030em | 5 | yes | x | y | 6px | 1 | 0 | 3 | 8000 |\n| c.com | Domaine | 68 | -0.020em | 5 | yes | x | y | 6px | 1 | 0 | 2 | 10000 |\n| d.com | Geist | 112 | -0.010em | 8 | — | x | y | 100px | 1 | 0 | 0 | 12000 |\n`,
  };
  for (const [f, text] of Object.entries(files)) fs.writeFileSync(path.join(root, f), edits[f] ? edits[f](text) : text);
  return { root, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) };
}
const run = (edits) => { const s = store(edits); try { return auditStore(s.root, { today: TODAY }); } finally { s.cleanup(); } };
const msgs = (r, level) => r.findings.filter((f) => !level || f.level === level).map((f) => f.message);

test('a consistent store has no errors and no warnings, only the dates as notes', () => {
  const r = run();
  assert.deepEqual(msgs(r, 'error'), []);
  assert.deepEqual(msgs(r, 'warn'), []);
  assert.ok(msgs(r, 'note').some((m) => /checked 2026-10-05 \(24 days ago\)/.test(m)));
  assert.equal(r.stats.identities, 2);
  assert.equal(r.stats.sites, 4);
  assert.equal(r.stats.references, 2);
  assert.equal(r.ok, true);
});

test('an index row with no entry, an entry with no row, and a duplicate name are errors', () => {
  const r = run({ 'references/identities/fam.md': (t) => t.replace('### Beta', '### Gamma') });
  assert.ok(msgs(r, 'error').some((m) => /row "Beta" has no entry/.test(m)));
  assert.ok(msgs(r, 'error').some((m) => /entry "Gamma" has no row/.test(m)));
  const d = run({ 'references/identities/fam.md': (t) => t.replace('### Beta', '### Alpha') });
  assert.ok(msgs(d, 'error').some((m) => /"Alpha" appears/.test(m)) || msgs(d, 'error').some((m) => /row "Beta" has no entry/.test(m)));
});

test('a missing field, a Seen at with no site, and a Fits without Misfits are named', () => {
  const r = run({ 'references/identities/fam.md': (t) => t.replace('- **Seen at:** beta.example — a site', '- **Seen at:** nowhere in particular').replace('- **Trap:** t\n- **Load:** fast', '- **Load:** fast').replace('f. **Misfits:** m\n- **Trap:** t\n- **Load:** medium', 'f\n- **Trap:** t\n- **Load:** medium') });
  assert.ok(msgs(r, 'error').some((m) => /Beta: Seen at names no site/.test(m)));
  assert.ok(msgs(r, 'error').some((m) => /Alpha: no Trap line/.test(m)));
  assert.ok(msgs(r, 'warn').some((m) => /Beta: Fits names no Misfits/.test(m)));
});

test('a median the table no longer supports, and a proportion that drifted, are warnings', () => {
  const r = run({ 'references/benchmarks.md': (t) => t.replace('| **64px** |', '| **80px** |').replace('**3 / 4 (75%)**', '**4 / 4 (100%)**') });
  assert.ok(msgs(r, 'warn').some((m) => /Hero font-size: the Aggregate table says 80, the per-site rows give 64/.test(m)));
  assert.ok(msgs(r, 'warn').some((m) => /monospace face: the proportion table says 4 \/ 4, the per-site rows give 3 \/ 4/.test(m)));
  const s = run({ 'SKILL.md': (t) => t.replace('**64px**', '**72px**') });
  assert.ok(msgs(s, 'warn').some((m) => /SKILL.md headline "Hero type size" says 72/.test(m)));
});

test('a section reference to a missing section or file, and a named path that does not exist, are found', () => {
  const r = run({ 'SKILL.md': (t) => t.replace('`identity.md` §2', '`identity.md` §9 and `audition.md` §1 and `scripts/nothing.mjs`') });
  assert.ok(msgs(r, 'warn').some((m) => /SKILL.md:\d+ cites identity.md §9 but the file has no section 9/.test(m)));
  assert.ok(msgs(r, 'error').some((m) => /cites audition.md §1 but the file does not exist/.test(m)));
  assert.ok(msgs(r, 'error').some((m) => /names scripts\/nothing.mjs, which does not exist/.test(m)));
});

test('a measurement past its shelf life is a warning, not an error', () => {
  const r = run({ 'references/benchmarks.md': (t) => t.replace('Measured 2026-09-15', 'Measured 2026-01-15') });
  assert.ok(msgs(r, 'warn').some((m) => /main table measured 2026-01-15/.test(m)));
  assert.equal(r.ok, true, 'staleness never fails the audit');
});

test('the CLI runs on this repository, reports, and exits 0 unless --strict finds an error', () => {
  const r = spawnSync(process.execPath, [CLI, REPO], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.match(r.stdout, /\d+ errors? · \d+ warnings? · \d+ notes? · \d+ identities in \d+ families/);
  assert.match(r.stdout, /never mutates/);
  const j = spawnSync(process.execPath, [CLI, REPO, '--json'], { encoding: 'utf8' });
  const parsed = JSON.parse(j.stdout);
  assert.ok(parsed.stats.identities > 100, 'the real library has more than a hundred identities');
  const bad = spawnSync(process.execPath, [CLI, path.join(os.tmpdir(), 'no-such-dir-df')], { encoding: 'utf8' });
  assert.equal(bad.status, 2);
});
