// The migration map of a new identity applied to an existing project (references/redesign.md §4).
// parseMap reads the map table out of the migration file; checkMap holds it against the source:
// every row decided, every KEEP with a reason the author approved, no REPLACE or REMOVE literal left
// in the code, and no custom property defined in the source that the map never names.
import fs from 'node:fs';
import path from 'node:path';

const DECISIONS = ['REPLACE', 'REMOVE', 'KEEP'];
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'out', '.next', 'coverage', 'captures']);
const SOURCE_EXT = new Set(['.css', '.scss', '.sass', '.less', '.html', '.htm', '.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.vue', '.svelte', '.astro', '.json']);

const cells = (line) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim());
const ticks = (cell) => [...String(cell).matchAll(/`([^`]+)`/g)].map((m) => m[1]);

// The map is the first markdown table whose header has a Legacy and a Decision column.
export function parseMap(markdown) {
  const lines = String(markdown).split(/\r?\n/);
  for (let i = 0; i < lines.length - 1; i++) {
    if (!lines[i].trim().startsWith('|')) continue;
    const head = cells(lines[i]).map((h) => h.toLowerCase());
    const col = (name) => head.findIndex((h) => h.startsWith(name));
    const at = { legacy: col('legacy'), decision: col('decision'), now: col('new'), reason: col('reason'), where: col('where') };
    if (at.legacy < 0 || at.decision < 0 || !/^\|?\s*:?-{3,}/.test(lines[i + 1].trim())) continue;
    const rows = [];
    for (let j = i + 2; j < lines.length && lines[j].trim().startsWith('|'); j++) {
      const c = cells(lines[j]);
      const get = (k) => (at[k] >= 0 ? c[at[k]] || '' : '');
      rows.push({ line: j + 1, legacy: get('legacy'), where: get('where'), decision: get('decision').replace(/[`*]/g, '').trim().toUpperCase(), now: get('now'), reason: get('reason') });
    }
    return rows;
  }
  return null;
}

function walk(target, out) {
  const st = fs.statSync(target);
  if (st.isFile()) { out.push(target); return out; }
  for (const name of fs.readdirSync(target)) {
    if (SKIP_DIRS.has(name)) continue;
    const p = path.join(target, name);
    const s = fs.statSync(p);
    if (s.isDirectory()) walk(p, out);
    else if (SOURCE_EXT.has(path.extname(name).toLowerCase())) out.push(p);
  }
  return out;
}

export function checkMap(rows, targets, { mapFile } = {}) {
  const findings = [];
  const report = (grade, what, items, fix) => { if (items.length) findings.push({ grade, what, items, fix }); };
  const undecided = rows.filter((r) => !DECISIONS.includes(r.decision));
  report('FAIL', 'undecided rows', undecided.map((r) => `line ${r.line}: ${r.legacy || '(empty)'} → "${r.decision || ''}"`),
    'every legacy item is REPLACE, REMOVE or KEEP; nothing stays by omission');
  const keeps = rows.filter((r) => r.decision === 'KEEP');
  report('FAIL', 'KEEP without an approved reason', keeps.filter((r) => r.reason.replace(/approved.*/i, '').trim().length < 12 || !/approved/i.test(r.reason)).map((r) => `line ${r.line}: ${r.legacy}`),
    'a KEEP carries a reason (a clause, 12 characters or more) and the author\'s approval ("approved 2026-11-09")');
  const replaced = rows.filter((r) => r.decision === 'REPLACE');
  report('FAIL', 'REPLACE without its new equivalent', replaced.filter((r) => !r.now.replace(/[—–-]/g, '').trim()).map((r) => `line ${r.line}: ${r.legacy}`),
    'a REPLACE names what takes its place');
  report('WARN', 'rows with no literal to look for', rows.filter((r) => r.decision !== 'KEEP' && DECISIONS.includes(r.decision) && !ticks(r.legacy).length).map((r) => `line ${r.line}: ${r.legacy}`),
    'put in backticks the literal a search finds: the old value, class, selector or font name');

  const files = targets.flatMap((t) => walk(t, [])).filter((f) => !mapFile || path.resolve(f) !== path.resolve(mapFile));
  // Bounded, so `Inter` does not find IntersectionObserver and `--brand` does not find --brand-blue.
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const gone = rows.filter((r) => r.decision === 'REPLACE' || r.decision === 'REMOVE')
    .flatMap((r) => ticks(r.legacy).map((needle) => ({ needle, row: r, re: new RegExp(`(?<![\\w-])${esc(needle)}(?![\\w-])`) })));
  const left = [];
  const defined = new Map();
  for (const f of files) {
    const text = fs.readFileSync(f, 'utf8');
    const lines = text.split(/\r?\n/);
    lines.forEach((ln, i) => {
      for (const { needle, row, re } of gone) if (re.test(ln)) left.push(`${f}:${i + 1}: \`${needle}\` (map line ${row.line}, ${row.decision})`);
    });
    if (/\.(css|scss|sass|less|html?|vue|svelte|astro)$/i.test(f)) {
      for (const m of text.matchAll(/(?<![\w-])(--[A-Za-z][\w-]*)\s*:/g)) if (!m[1].startsWith('--tw-') && !defined.has(m[1])) defined.set(m[1], f);
    }
  }
  report('FAIL', 'legacy left in the code', left, 'finish the step that replaces or removes it, or change the row to KEEP with the author\'s approval');
  const named = rows.map((r) => `${r.legacy} ${r.now}`).join(' ');
  const unmapped = [...defined].filter(([name]) => !new RegExp(`${name.replace(/[-]/g, '\\-')}(?![\\w-])`).test(named)).map(([name, f]) => `${name} (${f})`);
  report('FAIL', 'custom properties the map never names', unmapped, 'add a row for each: REPLACE, REMOVE, or KEEP with the reason; a new token goes in the New column of the row it replaces');

  const count = (d) => rows.filter((r) => r.decision === d).length;
  const summary = `Map ${rows.length} rows · ${count('REPLACE')} replace · ${count('REMOVE')} remove · ${count('KEEP')} keep · ${undecided.length} undecided · ${files.length} source files read`;
  return { ok: !findings.some((f) => f.grade === 'FAIL'), findings, summary };
}
