// Names the mechanical tells of a generated page: the gates in references/gates.md that a script can settle.
// Usage: node scripts/check-slop.mjs <file-or-dir ...> [--render] [--url http://localhost:3000/route ...]
//                                   [--scope page|component|app] [--tier floor] [--json] [--out <dir>]
// Static tier reads .html and .css (inline <style> and linked local stylesheets). --render opens each page in
// Playwright and adds the gates only a browser can judge (the fold, horizontal scroll, focus rings, the 1920 cap,
// images that load, content with scripting off). --url renders a route of a running dev server (render tier only).
// Exit code 0 = no FAIL, no open REFLEX and no rejected waiver; 1 = something to fix or waive; 2 = bad command line.
// --tier floor: exit 1 on FAIL only, for a quick gate while building.
import path from 'node:path';
import { lintStatic, collectFiles, GATES } from './lib/slop-static.mjs';

const USAGE = 'Usage: node scripts/check-slop.mjs <file-or-dir ...> [--render] [--url <http://…> ...] [--scope page|component|app] [--tier floor] [--json] [--out <dir>]';
const args = process.argv.slice(2);
const opts = { paths: [], urls: [], render: false, scope: 'page', tier: null, json: false, out: null };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--render') opts.render = true;
  else if (a === '--url') { opts.urls.push(args[++i]); opts.render = true; }
  else if (a === '--scope') opts.scope = args[++i];
  else if (a === '--tier') opts.tier = args[++i];
  else if (a === '--json') opts.json = true;
  else if (a === '--out') opts.out = args[++i];
  else if (a === '--help' || a === '-h') { console.log(USAGE); process.exit(0); }
  else if (a.startsWith('--')) { console.error(`unknown flag ${a}\n${USAGE}`); process.exit(2); }
  else opts.paths.push(a);
}
if (!opts.paths.length && !opts.urls.length) { console.error(USAGE); process.exit(2); }
if (!['page', 'component', 'app'].includes(opts.scope)) { console.error(`--scope must be page, component or app\n${USAGE}`); process.exit(2); }
if (opts.tier && opts.tier !== 'floor') { console.error(`--tier takes floor\n${USAGE}`); process.exit(2); }
if (opts.urls.some((u) => !/^https?:\/\//.test(u || ''))) { console.error(`--url takes an http or https address\n${USAGE}`); process.exit(2); }

let files = [];
try { files = collectFiles(opts.paths); } catch (err) { console.error(err.message); process.exit(2); }
if (!files.length && !opts.urls.length) { console.error('no .html or .css under the paths given'); process.exit(2); }

let result = lintStatic(files, { scope: opts.scope });

if (opts.render) {
  const { renderCheck } = await import('./lib/slop-render.mjs');
  const pages = files.filter((f) => /\.html?$/i.test(f.file)).map((f) => path.resolve(f.file));
  const rendered = await renderCheck({ pages, urls: opts.urls, scope: opts.scope, out: opts.out });
  result = merge(result, rendered);
}

if (opts.json) { console.log(JSON.stringify({ ...result, gates: GATES }, null, 1)); }
else {
  const pad = (s, n) => String(s).padEnd(n);
  for (const f of result.findings) {
    console.log(`${pad(f.grade, 7)} ${pad(f.gate, 22)} ${f.file || ''}${f.line ? `:${f.line}` : ''}  ${f.evidence}`);
    if (f.fix && f.grade !== 'WAIVED') console.log(`        → ${f.fix}`);
  }
  const c = result.counts;
  console.log(`\nFloor ${c.FAIL} FAIL · Reflex ${c.REFLEX} (${c.WAIVED} waived${c.WAIVER ? `, ${c.WAIVER} waiver${c.WAIVER > 1 ? 's' : ''} rejected` : ''}) · Finish ${c.NOTE} note${c.NOTE === 1 ? '' : 's'}${result.rendered ? ` · rendered ${result.rendered}` : ' · static only (add --render)'}`);
  if (result.screenshots?.length) console.log(`screenshots: ${result.screenshots.join(', ')}`);
}

const failing = opts.tier === 'floor' ? result.counts.FAIL > 0 : !result.ok;
process.exit(failing ? 1 : 0);

function merge(a, b) {
  const findings = [...a.findings, ...b.findings].sort((x, y) => rank(x.grade) - rank(y.grade) || x.gate.localeCompare(y.gate) || (x.file || '').localeCompare(y.file || '') || (x.line || 0) - (y.line || 0));
  const count = (g) => findings.filter((f) => f.grade === g).length;
  const counts = { FAIL: count('FAIL'), REFLEX: count('REFLEX'), WAIVED: count('WAIVED'), WAIVER: count('WAIVER'), NOTE: count('NOTE') };
  return { ...a, findings, counts, ok: counts.FAIL === 0 && counts.REFLEX === 0 && counts.WAIVER === 0, rendered: b.rendered, screenshots: b.screenshots, notRun: b.notRun };
}
function rank(g) { return { FAIL: 0, REFLEX: 1, WAIVER: 2, WAIVED: 3, NOTE: 4 }[g] ?? 9; }
