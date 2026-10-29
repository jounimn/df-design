// Audits the skill's accumulating stores as a whole and reports; it never mutates anything.
// Usage: node scripts/audit-store.mjs [root] [--json] [--strict]
// A write-time gate judges each record on its own; drift is a property of the collection: an index row with no
// entry, two identities with one name, a "Seen at" with no site, a median that no longer matches its table, a
// section reference that points at nothing, a measurement older than its shelf life. This reads every store and
// names what it finds, with the evidence. Exit code 0 always, unless --strict, which exits 1 when an error is found.
import fs from 'node:fs';
import path from 'node:path';
import { auditStore } from './lib/store-audit.mjs';

const args = process.argv.slice(2);
const opts = { root: process.cwd(), json: false, strict: false };
for (const a of args) {
  if (a === '--json') opts.json = true;
  else if (a === '--strict') opts.strict = true;
  else if (a === '--help' || a === '-h') { console.log('Usage: node scripts/audit-store.mjs [root] [--json] [--strict]'); process.exit(0); }
  else if (a.startsWith('--')) { console.error(`unknown flag ${a}`); process.exit(2); }
  else opts.root = path.resolve(a);
}
if (!fs.existsSync(path.join(opts.root, 'references'))) { console.error(`no references/ under ${opts.root}`); process.exit(2); }

const result = auditStore(opts.root);
if (opts.json) console.log(JSON.stringify(result, null, 1));
else {
  const order = { error: 0, warn: 1, note: 2 };
  for (const f of [...result.findings].sort((a, b) => order[a.level] - order[b.level] || a.area.localeCompare(b.area))) {
    console.log(`${f.level.toUpperCase().padEnd(5)} ${f.area.padEnd(16)} ${f.message}`);
  }
  const c = result.counts;
  console.log(`\n${c.error} error${c.error === 1 ? '' : 's'} · ${c.warn} warning${c.warn === 1 ? '' : 's'} · ${c.note} note${c.note === 1 ? '' : 's'} · ${result.stats.identities} identities in ${result.stats.families} families · ${result.stats.sites} sites in the per-site table · ${result.stats.references} section references checked`);
  console.log('This audit reports and never mutates: correct the store deliberately, in a commit that says why.');
}
process.exit(opts.strict && result.counts.error > 0 ? 1 : 0);
