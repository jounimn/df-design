// Records what a page says and does before a redesign, and checks the redesign against the record (references/redesign.md).
// Usage: node scripts/check-kept.mjs record <page.html|url> [--dir captures/kept]
//        node scripts/check-kept.mjs check  <page.html|url> [--dir captures/kept] [--json]
// record writes <dir>/before.json and <dir>/before-1440.png. check writes <dir>/after-1440.png and <dir>/compare.html,
// then prints what is gone: FAIL for a link, a field, a form, a handler, a test hook, a script or a selector a script still
// queries; WARN for a heading, a figure, an image or an id. Something dropped on purpose goes on the record in the page:
//   <!-- df-design · dropped mailto:desk@example.com, #team · the desk address is retired and the team section with it -->
//   <!-- df-design · reworded "Rates" to "What it costs" · the plain label is the heading now -->
//        node scripts/check-kept.mjs map <migration.md> <src dir|file>... [--json]
// map holds a new identity's migration map against the source, no browser: FAIL for a row with no decision, a KEEP
// without a reason the author approved, a REPLACE with no new equivalent, a REPLACE or REMOVE literal still in the code,
// or a custom property the source defines and the map never names.
// Exit code 0 = nothing lost that is not on the record; 1 = a FAIL; 2 = bad command line or no record.
import fs from 'node:fs';
import path from 'node:path';
import { launchBrowser } from './lib/browser.mjs';
import { recordPage, comparePages, compareHtml } from './lib/page-record.mjs';
import { parseMap, checkMap } from './lib/migration-map.mjs';

const USAGE = 'Usage: node scripts/check-kept.mjs record|check <page.html|url> [--dir captures/kept] [--json]\n       node scripts/check-kept.mjs map <migration.md> <src dir|file>... [--json]';
const args = process.argv.slice(2);
const verb = args.shift();
if (verb === 'map') {
  const json = args.includes('--json');
  const [mapFile, ...targets] = args.filter((a) => a !== '--json');
  if (!mapFile || !targets.length) { console.error(USAGE); process.exit(2); }
  for (const p of [mapFile, ...targets]) if (!fs.existsSync(p)) { console.error(`no such file: ${p}`); process.exit(2); }
  const rows = parseMap(fs.readFileSync(mapFile, 'utf8'));
  if (!rows || !rows.length) { console.error(`no map in ${mapFile}: a table with Legacy, Where, Decision, New and Reason columns`); process.exit(2); }
  const result = checkMap(rows, targets, { mapFile });
  if (json) console.log(JSON.stringify(result, null, 1));
  else {
    for (const f of result.findings) { for (const item of f.items) console.log(`${f.grade.padEnd(5)} map · ${f.what}: ${item}`); console.log(`      → ${f.fix}`); }
    console.log(`\n${result.summary}\n${result.ok ? 'every legacy item decided, nothing replaced is left' : `${result.findings.filter((f) => f.grade === 'FAIL').reduce((n, f) => n + f.items.length, 0)} FAIL map`}`);
  }
  process.exit(result.ok ? 0 : 1);
}
const opts = { target: null, dir: path.join('captures', 'kept'), json: false };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--dir') opts.dir = args[++i];
  else if (a === '--json') opts.json = true;
  else if (a.startsWith('--')) { console.error(`unknown flag ${a}\n${USAGE}`); process.exit(2); }
  else opts.target = a;
}
if (!['record', 'check'].includes(verb) || !opts.target) { console.error(USAGE); process.exit(2); }
if (!/^https?:\/\//i.test(opts.target) && !fs.existsSync(opts.target)) { console.error(`no such file: ${opts.target}`); process.exit(2); }
fs.mkdirSync(opts.dir, { recursive: true });
const recordFile = path.join(opts.dir, 'before.json');

const browser = await launchBrowser();
let code = 0;
try {
  if (verb === 'record') {
    const shot = path.join(opts.dir, 'before-1440.png');
    const record = await recordPage(browser, opts.target, { screenshot: shot });
    fs.writeFileSync(recordFile, JSON.stringify(record, null, 1));
    if (opts.json) console.log(JSON.stringify(record, null, 1));
    else console.log(`recorded ${opts.target}: ${record.links.length} links · ${record.fields.length} fields · ${record.forms.length} forms · ${record.handlers.length} handlers · ${record.hooks.length} test hooks · ${record.scripts.length} scripts · ${record.headings.length} headings · ${record.figures.length} figures · ${record.images.length} images\n${recordFile}\n${shot}`);
  } else {
    if (!fs.existsSync(recordFile)) { console.error(`no record at ${recordFile}: run record first`); process.exit(2); }
    const before = JSON.parse(fs.readFileSync(recordFile, 'utf8'));
    const shot = path.join(opts.dir, 'after-1440.png');
    const after = await recordPage(browser, opts.target, { screenshot: shot });
    const result = comparePages(before, after);
    const k = result.kept;
    const summary = `Kept ${k.links.kept}/${k.links.before} links · ${k.fields.kept}/${k.fields.before} fields · ${k.handlers.kept}/${k.handlers.before} handlers · ${k.hooks.kept}/${k.hooks.before} test hooks · ${k.scripts.kept}/${k.scripts.before} scripts · ${k.headings.kept}/${k.headings.before} headings · ${k.figures.kept}/${k.figures.before} figures · ${k.images.kept}/${k.images.before} images`;
    const compare = path.join(opts.dir, 'compare.html');
    fs.writeFileSync(compare, compareHtml({ before: before.target, after: opts.target, beforeShot: path.basename(before.screenshot || 'before-1440.png'), afterShot: path.basename(shot), summary }));
    if (opts.json) console.log(JSON.stringify({ ...result, summary, compare }, null, 1));
    else {
      for (const f of result.findings) { for (const item of f.items) console.log(`${f.grade.padEnd(5)} kept · ${f.what}: ${item}`); console.log(`      → ${f.fix}`); }
      if (result.dropped.length) console.log(`on the record: dropped ${result.dropped.map((d) => d.item).join(', ')}`);
      if (result.reworded.length) console.log(`on the record: reworded ${result.reworded.map((r) => `"${r.old}"`).join(', ')}`);
      console.log(`\n${summary}\n${result.ok ? 'nothing lost that is not on the record' : `${result.findings.filter((f) => f.grade === 'FAIL').reduce((n, f) => n + f.items.length, 0)} FAIL kept`}\ncompare: ${compare}`);
    }
    code = result.ok ? 0 : 1;
  }
} catch (err) {
  console.error(`could not open ${opts.target}: ${err.message}`);
  code = 1;
} finally {
  await browser.close();
}
process.exit(code);
