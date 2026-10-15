// Checks that the canvas of a page is alive, honours reduced motion, pauses off-screen, falls back without WebGL,
// and that the page's motion JS is within the ceiling of its tier.
// Usage: node scripts/check-motion.mjs <page.html|url> --tier <fast|medium|high|custom>
// Exit code 0 = no check failed (n/a and report lines do not fail); 1 = a check failed or the page would not open;
// 2 = bad command line.
import { launchBrowser } from './lib/browser.mjs';
import { UsageError, parseMotionArgs, resolveTarget, runMotionChecks } from './lib/motion-checks.mjs';

const USAGE = 'Usage: node scripts/check-motion.mjs <page.html|url> --tier <fast|medium|high|custom>';

let options;
try {
  options = parseMotionArgs(process.argv.slice(2));
  resolveTarget(options.target);
} catch (err) {
  if (!(err instanceof UsageError)) throw err;
  console.error(`${err.message}\n${USAGE}`);
  process.exit(2);
}

const browser = await launchBrowser();
let result;
try {
  result = await runMotionChecks(options.target, { tier: options.tier, browser });
} catch (err) {
  console.error(`could not check ${options.target}: ${err.message}`);
  process.exitCode = 1; // not process.exit: the finally below must still close the browser
} finally {
  await browser.close();
}
if (!result) process.exit(1);

const label = { pass: 'PASS  ', fail: 'FAIL  ', na: 'N/A   ', report: 'REPORT' };
for (const c of result.checks) console.log(`${label[c.status]} ${c.name}${c.detail ? '  — ' + c.detail : ''}`);
const failed = result.checks.filter((c) => c.status === 'fail').length;
console.log(`\n${failed ? `${failed} of ${result.checks.length} checks failed` : 'no check failed'} (tier: ${options.tier})`);
process.exit(result.ok ? 0 : 1);
