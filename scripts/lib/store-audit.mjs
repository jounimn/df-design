// The whole-store audit behind scripts/audit-store.mjs. Pure text: no browser, no network, no writes.
//
// Stores it reads: references/identity-library.md (the index) against references/identities/*.md (the entries);
// references/benchmarks.md (the aggregate against its own per-site table, and against the headline numbers that
// SKILL.md repeats); every `file.md §N` reference across SKILL.md and references/; every references/ and scripts/
// path a document names; the dates the stores say they were measured or checked on.
import fs from 'node:fs';
import path from 'node:path';

export const STALE_DAYS = 180;
const REQUIRED_FIELDS = ['Grammar', 'Says', 'Fits', 'Trap', 'Load', 'Seen at', 'Search'];
const DOMAIN = /\b[a-z0-9][a-z0-9-]*(\.[a-z0-9-]+)*\.[a-z]{2,}\b/i;

const read = (p) => fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const median = (xs) => { const a = xs.filter((x) => Number.isFinite(x)).sort((p, q) => p - q); if (!a.length) return null; const m = a.length >> 1; return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; };
const daysSince = (iso, today) => Math.round((today - new Date(iso)) / 86400000);

export function auditStore(root, { today = new Date() } = {}) {
  const findings = [];
  const add = (level, area, message) => findings.push({ level, area, message });
  const stats = { identities: 0, families: 0, sites: 0, references: 0 };
  const refs = path.join(root, 'references');

  // 1. The identity index against the entries -------------------------------------------------------------------
  const indexPath = path.join(refs, 'identity-library.md');
  const entriesByFile = new Map();
  if (fs.existsSync(indexPath)) {
    const index = read(indexPath);
    const families = [];
    let current = null;
    for (const line of index.split('\n')) {
      const fam = /^### (.+?) — `identities\/([\w-]+\.md)` \((\d+)\)\s*$/.exec(line);
      if (fam) { current = { title: fam[1], file: fam[2], declared: +fam[3], rows: [] }; families.push(current); continue; }
      if (/^## /.test(line)) current = null;
      if (!current) continue;
      const row = /^\| (.+?) \| .+ \|\s*$/.exec(line);
      if (row && !/^Identity$|^---/.test(row[1].trim()) && !/^-+$/.test(row[1].trim())) current.rows.push(row[1].trim().replace(/\*\*/g, ''));
    }
    stats.families = families.length;
    const seen = new Map();
    for (const fam of families) {
      const file = path.join(refs, 'identities', fam.file);
      if (!fs.existsSync(file)) { add('error', 'identities', `index names ${fam.file} but the file does not exist`); continue; }
      const entries = parseEntries(read(file));
      entriesByFile.set(fam.file, entries);
      stats.identities += entries.length;
      if (fam.declared !== fam.rows.length) add('warn', 'identities', `${fam.file}: the index heading says ${fam.declared}, the index lists ${fam.rows.length}`);
      if (fam.declared !== entries.length) add('warn', 'identities', `${fam.file}: the index heading says ${fam.declared}, the file holds ${entries.length} entries`);
      const names = new Set(entries.map((e) => e.name));
      for (const r of fam.rows) if (!names.has(r)) add('error', 'identities', `index row "${r}" has no entry in ${fam.file}`);
      const rowSet = new Set(fam.rows);
      for (const e of entries) {
        if (!rowSet.has(e.name)) add('error', 'identities', `${fam.file}: entry "${e.name}" has no row in the index`);
        if (seen.has(e.name)) add('error', 'identities', `"${e.name}" appears in both ${seen.get(e.name)} and ${fam.file}`);
        seen.set(e.name, fam.file);
        for (const f of REQUIRED_FIELDS) if (!(f in e.fields)) add('error', 'identities', `${fam.file} › ${e.name}: no ${f} line`);
        if (e.fields.Fits && !/misfits/i.test(e.fields.Fits)) add('warn', 'identities', `${fam.file} › ${e.name}: Fits names no Misfits`);
        if ('Seen at' in e.fields && !DOMAIN.test(e.fields['Seen at'])) add('error', 'identities', `${fam.file} › ${e.name}: Seen at names no site`);
        if (e.fields.Load && !/fast|medium|high/i.test(e.fields.Load)) add('warn', 'identities', `${fam.file} › ${e.name}: Load is "${e.fields.Load.slice(0, 30)}", not a tier`);
      }
    }
    for (const f of fs.existsSync(path.join(refs, 'identities')) ? fs.readdirSync(path.join(refs, 'identities')).filter((x) => x.endsWith('.md')) : []) {
      if (!families.some((fam) => fam.file === f)) add('warn', 'identities', `identities/${f} is not in the index`);
    }
    for (const [file, text] of fs.existsSync(path.join(refs, 'identities')) ? fs.readdirSync(path.join(refs, 'identities')).filter((x) => x.endsWith('.md')).map((x) => [x, read(path.join(refs, 'identities', x))]) : []) {
      const checked = /checked live on (\d{4}-\d{2}-\d{2})/i.exec(text);
      if (checked) { const d = daysSince(checked[1], today); add(d > STALE_DAYS ? 'warn' : 'note', 'identities', `identities/${file}: Seen-at URLs last checked ${checked[1]} (${d} days ago)`); }
      else add('note', 'identities', `identities/${file}: no "checked live on" date`);
    }
  } else add('warn', 'identities', 'no references/identity-library.md');

  // 2. Benchmarks: the aggregate against its own table, and the headline numbers SKILL.md repeats -------------------
  const benchPath = path.join(refs, 'benchmarks.md');
  if (fs.existsSync(benchPath)) {
    const bench = read(benchPath);
    const measured = /Measured (\d{4}-\d{2}-\d{2})/i.exec(bench);
    if (measured) { const d = daysSince(measured[1], today); add(d > STALE_DAYS ? 'warn' : 'note', 'benchmarks', `main table measured ${measured[1]} (${d} days ago)`); }
    const rows = parsePerSite(bench);
    stats.sites = rows.length;
    if (rows.length) {
      const stated = parseAggregate(bench);
      const got = {
        'Hero font-size': median(rows.map((r) => r.heroPx).filter((x) => x >= 40)),
        'Hero letter-spacing': median(rows.map((r) => r.tracking)),
        'Page scroll height': median(rows.map((r) => r.height).filter((x) => x > 1000)),
        'Distinct loaded faces': median(rows.map((r) => r.faces)),
        'CTA corner radius': median(rows.map((r) => r.radius).filter((x) => x <= 200)),
      };
      for (const [k, v] of Object.entries(got)) {
        if (v == null || !(k in stated)) continue;
        const tol = k === 'Hero letter-spacing' ? 0.006 : k === 'Page scroll height' ? 400 : k === 'CTA corner radius' ? 1 : 2;
        if (Math.abs(v - stated[k]) > tol) add('warn', 'benchmarks', `${k}: the Aggregate table says ${stated[k]}, the per-site rows give ${round(v)} (${rows.length} rows)`);
      }
      const n = rows.length;
      const counts = { mono: rows.filter((r) => r.mono).length, interDisplay: rows.filter((r) => /\binter\b/i.test(r.face)).length, rm: rows.filter((r) => r.rm > 0).length };
      for (const [label, re, mine] of [['monospace face', /monospace or instrument face \| \*\*(\d+) \/ (\d+)/i, counts.mono], ['Inter as display', /display\*\* face \| \*\*(\d+) \/ (\d+)/i, counts.interDisplay], ['reduced-motion rules', /prefers-reduced-motion` in CSS \| (\d+) \/ (\d+)/i, counts.rm]]) {
        const m = re.exec(bench);
        if (!m) continue;
        if (+m[1] !== mine || +m[2] !== n) add('warn', 'benchmarks', `${label}: the proportion table says ${m[1]} / ${m[2]}, the per-site rows give ${mine} / ${n}`);
      }
      const skillPath = path.join(root, 'SKILL.md');
      if (fs.existsSync(skillPath)) {
        const skill = read(skillPath);
        const head = (re) => { const m = re.exec(skill); return m ? m[1] : null; };
        const pairs = [['Hero type size', /Hero type size \| \*\*(\d+)px/, got['Hero font-size']], ['Page height', /Page height \| \*\*([\d,]+)px/, got['Page scroll height']], ['Distinct font faces', /Distinct font faces \| \*\*(\d+)\*\*/, got['Distinct loaded faces']], ['CTA corner radius', /CTA corner radius \| \*\*(\d+)px/, got['CTA corner radius']]];
        for (const [label, re, v] of pairs) {
          const s = head(re);
          if (s == null || v == null) continue;
          const sv = +s.replace(/,/g, '');
          const tol = label === 'Page height' ? 400 : 2;
          if (Math.abs(sv - v) > tol) add('warn', 'benchmarks', `SKILL.md headline "${label}" says ${s}, the per-site rows give ${round(v)}`);
        }
        const sites = /^(The niche skewed to [^\n]+(?:\n[^\n]+)*?)\n\n/m.exec(skill)?.[1] || '';
        const named = (sites.match(/[A-Z][\w& ]+(?:,|\.)/g) || []).length;
        if (named && Math.abs(named - n) > 3) add('note', 'benchmarks', `SKILL.md names about ${named} sites in the cohort; the per-site table has ${n} rows`);
      }
    } else add('warn', 'benchmarks', 'no per-site table found (header "| Site | Display face |")');
  } else add('warn', 'benchmarks', 'no references/benchmarks.md');

  // 3. Section references and paths ---------------------------------------------------------------------------------
  const docs = [path.join(root, 'SKILL.md'), path.join(root, 'README.md'), ...fs.existsSync(refs) ? fs.readdirSync(refs).filter((f) => f.endsWith('.md')).map((f) => path.join(refs, f)) : []].filter((p) => fs.existsSync(p));
  const sectionsOf = new Map();
  const sections = (file) => {
    if (!sectionsOf.has(file)) {
      const text = fs.existsSync(file) ? read(file) : null;
      sectionsOf.set(file, text == null ? null : new Set([...text.matchAll(/^#{2,3} (\d+)[.\s]/gm)].map((m) => m[1])));
    }
    return sectionsOf.get(file);
  };
  for (const doc of docs) {
    const text = read(doc);
    const rel = path.relative(root, doc).replace(/\\/g, '/');
    for (const m of text.matchAll(/`?([a-z][\w-]*\.md)`?\s*§\s*(\d+)/g)) {
      stats.references++;
      const target = m[1] === 'SKILL.md' ? path.join(root, 'SKILL.md') : path.join(refs, m[1]);
      const secs = sections(target);
      const line = text.slice(0, m.index).split('\n').length;
      if (secs == null) add('error', 'references', `${rel}:${line} cites ${m[1]} §${m[2]} but the file does not exist`);
      else if (!secs.has(m[2])) add('warn', 'references', `${rel}:${line} cites ${m[1]} §${m[2]} but the file has no section ${m[2]}`);
    }
    // docs/ is left out on purpose: the skill names docs/identity.md and docs/assets.md as places in the author's project.
    for (const m of text.matchAll(/`((?:references|scripts|templates)\/[\w./-]+)`/g)) {
      const p = path.join(root, m[1]);
      if (!fs.existsSync(p) && !fs.existsSync(p.replace(/\/$/, ''))) {
        const line = text.slice(0, m.index).split('\n').length;
        add('error', 'references', `${rel}:${line} names ${m[1]}, which does not exist`);
      }
    }
  }

  const counts = { error: 0, warn: 0, note: 0 };
  for (const f of findings) counts[f.level]++;
  return { findings, counts, stats, ok: counts.error === 0 };
}

function parseEntries(text) {
  const out = [];
  let cur = null;
  for (const line of text.split('\n')) {
    const h = /^### (.+?)\s*$/.exec(line);
    if (h) { cur = { name: h[1].trim(), fields: {} }; out.push(cur); continue; }
    if (!cur) continue;
    const f = /^- \*\*([A-Za-z ]+?):\*\*\s*(.*)$/.exec(line);
    if (f) cur.fields[f[1].trim()] = f[2].trim();
  }
  return out;
}

const px = (s) => { const m = /(-?[\d.]+(?:e[+-]?\d+)?)\s*px/i.exec(s || ''); return m ? parseFloat(m[1]) : NaN; };
const em = (s) => { const m = /(-?[\d.]+)\s*em/i.exec(s || ''); return m ? parseFloat(m[1]) : NaN; };
const round = (v) => (Math.abs(v) < 1 ? +v.toFixed(3) : Math.round(v));

function parsePerSite(text) {
  const rows = [];
  const lines = text.split('\n');
  const start = lines.findIndex((l) => /^\| Site \| Display face \|/.test(l));
  if (start === -1) return rows;
  for (let i = start + 2; i < lines.length; i++) {
    const l = lines[i];
    if (!l.startsWith('|')) break;
    const c = l.split('|').slice(1, -1).map((x) => x.trim());
    if (c.length < 13) continue;
    rows.push({ site: c[0], face: c[1], heroPx: parseFloat(c[2]), tracking: em(c[3]), faces: parseInt(c[4], 10), mono: /yes/i.test(c[5]), radius: px(c[8]), masks: parseInt(c[9], 10), sticky: parseInt(c[10], 10), rm: parseInt(c[11], 10), height: parseInt(c[12], 10) });
  }
  return rows;
}

function parseAggregate(text) {
  const out = {};
  for (const m of text.matchAll(/^\| (Hero font-size|Hero letter-spacing|Page scroll height|Distinct loaded faces|CTA corner radius) \| [^|]+ \| \*\*([^*]+)\*\* \|/gm)) {
    const v = parseFloat(m[2].replace(/,/g, ''));
    if (Number.isFinite(v)) out[m[1]] = v;
  }
  return out;
}
