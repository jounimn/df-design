// Checks that a selling-positioning presentation "landed": markup contract, research counts, licence rows,
// preview/final split, export sizes, and a clean render.
// Usage: node scripts/check-presentation.mjs <presentation-dir> [--offline] [--after-gate] [--watermark <spec|none>] [--tier <fast|medium|high|custom>]
// --offline skips the source-URL fetch. --after-gate also fails a site section still marked data-pending.
// --watermark says what the export was run with (also --watermark=<spec|none>): 'none' fails a leftover preview/,
// a spec fails a missing one. --tier is the author's tier: needed when a slide has a canvas, which then also gets the
// check-motion canvas checks (named "motion: ..."); a presentation without a canvas gets none.
// Exit code 0 = every check passed; 2 = bad command line.
import { launchBrowser } from './lib/browser.mjs';
import { parseCheckArgs, runChecks } from './lib/presentation-checks.mjs';
import { UsageError } from './lib/motion-checks.mjs';

const USAGE = 'Usage: node scripts/check-presentation.mjs <presentation-dir> [--offline] [--after-gate] [--watermark <spec|none>] [--tier <fast|medium|high|custom>]';

let options;
try {
  options = parseCheckArgs(process.argv.slice(2));
} catch (err) {
  console.error(`${err.message}\n${USAGE}`);
  process.exit(2);
}

const browser = await launchBrowser();
let results;
try {
  results = await runChecks(options.dir, { offline: options.offline, afterGate: options.afterGate, browser, watermark: options.watermark, tier: options.tier });
} catch (err) {
  if (!(err instanceof UsageError)) throw err;
  console.error(`${err.message}\n${USAGE}`);
  process.exitCode = 2; // not process.exit: the finally below closes the browser
} finally {
  await browser.close();
}
if (!results) process.exit(2);

const failed = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? '  — ' + r.detail : ''}`);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
process.exit(failed.length ? 1 : 0);
