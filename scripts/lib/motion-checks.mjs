// The five canvas checks of check-motion, run on one page. A page with no canvas has nothing to judge: the four
// canvas checks are 'na' and only the weight is reported.
// status: 'pass' | 'fail' | 'na' (nothing to judge) | 'report' (a number with no ceiling to hold it to).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { newPage, settle } from './browser.mjs';
import { installCanvasTrace, runCanvasTrace } from './canvas-trace.mjs';

export class UsageError extends Error {}

export const TIERS = ['fast', 'medium', 'high', 'custom'];
export const CHECK_NAMES = [
  'canvas is alive',
  'canvas honours reduced motion',
  'canvas pauses off-screen',
  'fallback without WebGL',
  'motion weight within tier',
];

const CEILINGS_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'motion-ceilings.json');

// { fast?, medium?, high? } in bytes. Absent file, or a tier missing from it: the weight is reported, not judged.
// Only a missing file means "no ceilings yet": an unreadable or malformed one is a mistake to see, not to hide, and a
// value that is not a number of bytes is dropped (that tier is then reported, not judged).
export function loadCeilings(file = CEILINGS_FILE) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') return {};
    throw err;
  }
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (err) {
    throw new Error(`${path.basename(file)} is not valid JSON: ${err.message}`);
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(`${path.basename(file)} must be an object of tier: bytes`);
  return Object.fromEntries(Object.entries(parsed).filter(([tier, bytes]) => TIERS.includes(tier) && tier !== 'custom' && Number.isFinite(bytes) && bytes >= 0));
}

export function parseMotionArgs(argv) {
  let target;
  let tier;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--tier' || a.startsWith('--tier=')) {
      if (tier !== undefined) throw new UsageError('--tier was given twice');
      tier = a === '--tier' ? argv[++i] : a.slice('--tier='.length);
      if (!TIERS.includes(tier)) throw new UsageError(`--tier needs one of ${TIERS.join(', ')} (got ${tier === undefined ? 'nothing' : `"${tier}"`})`);
    } else if (a.startsWith('-')) {
      throw new UsageError(`unknown option ${a} (known: --tier <${TIERS.join('|')}>)`);
    } else if (target === undefined) target = a;
    else throw new UsageError(`unexpected extra argument: ${a}`);
  }
  if (target === undefined) throw new UsageError('missing <page.html|url>');
  if (tier === undefined) throw new UsageError(`missing --tier <${TIERS.join('|')}>`);
  return { target, tier };
}

// An http(s) URL as given, or an existing file as a file:// URL; anything else is a usage error.
export function resolveTarget(target) {
  if (/^https?:\/\//i.test(target)) return target;
  const file = path.resolve(target);
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) throw new UsageError(`${target} is neither an http(s) URL nor an existing file`);
  return pathToFileURL(file).href;
}

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

// Turns the per-canvas findings of one check into a result: any failure fails, nothing judged is 'na'.
function verdict(name, canvases, judge, { naDetail, passDetail }) {
  const judged = [];
  const failures = [];
  for (const c of canvases) {
    const r = judge(c);
    if (r === null) continue;
    judged.push(c);
    if (r !== true) failures.push(r);
  }
  if (failures.length) return { name, status: 'fail', detail: failures.join(' ') };
  if (!judged.length) return { name, status: 'na', detail: naDetail };
  return { name, status: 'pass', detail: passDetail(judged.length) };
}

export function evaluateMotion(trace, { tier, ceilings }) {
  const { canvases } = trace;
  const none = 'no canvas on the page';
  const checks = [];

  // Only a canvas that draws on rAF has something to keep alive; a canvas drawn once (a chart, a poster) does not,
  // and one whose box keeps changing size cannot be judged by pixels.
  checks.push(verdict(CHECK_NAMES[0], canvases, (c) => {
    if (!(c.drawCalls > 0) || c.resized) return null;
    if (c.blank) return `${c.selector} is blank: the page draws into it every frame but nothing shows.`;
    if (!c.animating) return `${c.selector} is frozen: it draws every frame but the picture never changes.`;
    return true;
  }, {
    naDetail: canvases.length ? 'no canvas draws on a loop, so none can be dead' : none,
    passDetail: (n) => `changing on screen (${plural(n, 'canvas')} checked)`,
  }));

  checks.push(verdict(CHECK_NAMES[1], canvases, (c) => {
    // A canvas that does not move in the normal run has nothing to hold still: that is the alive check's business.
    if (!c.animating || c.reducedMotionAnimating === null || c.reducedMotionAnimating === undefined) return null;
    return c.reducedMotionAnimating === false ? true : `${c.selector} keeps moving when the visitor asks for reduced motion.`;
  }, {
    naDetail: canvases.length ? 'could not compare the canvas under reduced motion' : none,
    passDetail: (n) => `still under reduced motion (${plural(n, 'canvas')} checked)`,
  }));

  checks.push(verdict(CHECK_NAMES[2], canvases, (c) => {
    if (!c.animating || c.drawCallsOffscreen === null || c.drawCallsOffscreen === undefined) return null;
    return c.drawCallsOffscreen === 0 ? true : `${c.selector} keeps drawing (${plural(c.drawCallsOffscreen, 'draw call')}) while scrolled out of view.`;
  }, {
    naDetail: canvases.length ? 'could not scroll the canvas out of view to compare' : none,
    passDetail: (n) => `no draw calls off-screen (${plural(n, 'canvas')} checked)`,
  }));

  checks.push(verdict(CHECK_NAMES[3], canvases, (c) => {
    if (c.fallbackVisible === null || c.fallbackVisible === undefined) return null;
    if (c.fallbackErrors?.length) return `${c.selector}: the page threw without WebGL (${c.fallbackErrors[0]}).`;
    return c.fallbackVisible ? true : `${c.selector} is blank when WebGL is missing: show a fallback image or style instead.`;
  }, {
    naDetail: canvases.length ? 'no WebGL canvas to compare without WebGL' : none,
    passDetail: (n) => `a fallback shows without WebGL (${plural(n, 'WebGL canvas')} checked)`,
  }));

  const ceiling = tier === 'custom' ? undefined : ceilings?.[tier];
  const bytes = trace.motionJsBytes;
  if (typeof ceiling !== 'number') {
    checks.push({
      name: CHECK_NAMES[4],
      status: 'report',
      detail: `motion JS is ${kb(bytes)}; ${tier === 'custom' ? 'the custom tier has no ceiling' : `there is no measured ceiling for the ${tier} tier yet`}`,
    });
  } else if (bytes > ceiling) {
    checks.push({ name: CHECK_NAMES[4], status: 'fail', detail: `motion JS is ${kb(bytes)}, over the ${kb(ceiling)} ceiling of the ${tier} tier.` });
  } else {
    checks.push({ name: CHECK_NAMES[4], status: 'pass', detail: `motion JS is ${kb(bytes)}, within the ${kb(ceiling)} ceiling of the ${tier} tier` });
  }

  return { checks, ok: checks.every((c) => c.status !== 'fail') };
}

// Loads the page with its loop running (no __DF_EXPORT__: the export freezes it) and judges the trace.
export async function runMotionChecks(target, { tier, browser, ceilings = loadCeilings() }) {
  if (!TIERS.includes(tier)) throw new UsageError(`unknown tier "${tier}"`);
  const url = resolveTarget(target);
  const { page, context } = await newPage(browser, { reducedMotion: 'no-preference' });
  try {
    await installCanvasTrace(context);
    await page.goto(url, { waitUntil: 'load' });
    await settle(page);
    const trace = await runCanvasTrace(page);
    return evaluateMotion(trace, { tier, ceilings });
  } finally {
    await context.close();
  }
}
