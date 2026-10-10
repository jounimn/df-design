// Checks that a selling-positioning presentation "landed": markup contract, research counts, licence rows,
// preview/final split, export sizes, and a clean render.
// Usage: node scripts/check-presentation.mjs <presentation-dir> [--offline] [--after-gate] [--watermark <spec|none>]
// --offline skips the source-URL fetch. --after-gate also fails a site section still marked data-pending.
// --watermark says what the export was run with: 'none' fails a leftover preview/, a spec fails a missing one.
// Exit code 0 = every check passed.
import { launchBrowser } from './lib/browser.mjs';
import { runChecks } from './lib/presentation-checks.mjs';

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const wmAt = args.indexOf('--watermark');
const watermark = wmAt >= 0 ? args[wmAt + 1] : undefined;
const dir = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--watermark');
if (!dir || (wmAt >= 0 && !watermark)) {
  console.error('Usage: node scripts/check-presentation.mjs <presentation-dir> [--offline] [--after-gate] [--watermark <spec|none>]');
  process.exit(2);
}

const browser = await launchBrowser();
let results;
try {
  results = await runChecks(dir, { offline: flag('--offline'), afterGate: flag('--after-gate'), browser, watermark });
} finally {
  await browser.close();
}

const failed = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? '  — ' + r.detail : ''}`);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
