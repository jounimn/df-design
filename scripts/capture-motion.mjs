#!/usr/bin/env node
// The motion capture of one page: a video driven by real input to the true end, contact sheets of the whole run,
// stills where the picture settled, and capture.json. See scripts/lib/motion-capture.mjs and
// references/verification.md ("Looking at a page that moves").
//
//   node scripts/capture-motion.mjs <url | file.html> [--out <dir>] [--size 1440x900] [--click "<css>"]...
//                                   [--max-steps N] [--step-px 120] [--interval 70] [--pause 1200]
//
// --click passes a gate first (a cookie banner, an "enter" button, a sound prompt), in the order given.
// Exit code 0 = sheets written; 1 = the page would not open or nothing was written; 2 = bad command line.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { launchBrowser } from './lib/browser.mjs';
import { captureMotion, MOTION_DEFAULTS } from './lib/motion-capture.mjs';

const USAGE = 'Usage: node scripts/capture-motion.mjs <url | file.html> [--out <dir>] [--size 1440x900] [--click "<css>"]... [--max-steps N] [--step-px 120] [--interval 70] [--pause 1200]';
const args = process.argv.slice(2);
const opts = { clicks: [] };
let target = null;
const num = (flag, v) => { const n = Number(v); if (!Number.isFinite(n) || n <= 0) { console.error(`${flag} takes a positive number\n${USAGE}`); process.exit(2); } return n; };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--help' || a === '-h') { console.log(USAGE); process.exit(0); }
  else if (a === '--out') opts.out = args[++i];
  else if (a === '--click') opts.clicks.push(args[++i]);
  else if (a === '--size') {
    const m = /^(\d+)x(\d+)$/.exec(args[++i] || '');
    if (!m) { console.error(`--size takes WIDTHxHEIGHT, like 1440x900\n${USAGE}`); process.exit(2); }
    opts.size = { width: Number(m[1]), height: Number(m[2]) };
  }
  else if (a === '--max-steps') opts.maxSteps = num(a, args[++i]);
  else if (a === '--step-px') opts.stepPx = num(a, args[++i]);
  else if (a === '--interval') opts.interval = num(a, args[++i]);
  else if (a === '--pause') opts.pause = num(a, args[++i]);
  else if (a.startsWith('--')) { console.error(`unknown flag ${a}\n${USAGE}`); process.exit(2); }
  else if (!target) target = a;
  else { console.error(`one page at a time\n${USAGE}`); process.exit(2); }
}
if (!target) { console.error(USAGE); process.exit(2); }

let url = target;
if (!/^(https?|file):/i.test(target)) {
  if (!fs.existsSync(target)) { console.error(`no such file: ${target}`); process.exit(2); }
  url = pathToFileURL(path.resolve(target)).href;
}
const slug = url.replace(/^\w+:\/+/, '').replace(/\.html?$/i, '').replace(/[^\w-]+/g, '-').replace(/^-+|-+$/g, '').slice(-60) || 'page';
opts.out = path.resolve(opts.out || path.join('captures', 'motion', slug));

const browser = await launchBrowser();
let cap;
try {
  cap = await captureMotion(browser, url, opts);
} finally {
  await browser.close();
}

const rel = (f) => path.relative(process.cwd(), f) || '.';
console.log(`${url} -> ${rel(cap.dir)}`);
console.log(`  steps: ${cap.steps} (wheel ${cap.inputs.wheel}, keys ${cap.inputs.keys}; moved by ${cap.movedBy})`);
console.log(`  end: ${cap.reachedEnd ? 'reached' : 'NOT reached'} - ${cap.endReason}`);
for (const c of cap.clicks) console.log(`  click ${c.selector}: ${c.ok ? 'ok' : `failed (${c.error})`}`);
console.log(`  video: ${cap.video ? rel(path.join(cap.dir, cap.video)) : 'none'} (${cap.durations.videoSeconds}s)`);
console.log(`  sheets (${cap.sheetsFrom}): ${cap.sheets.map((s) => rel(path.join(cap.dir, s))).join(', ') || 'none'}`);
console.log(`  stills: ${cap.stills.length} in ${rel(path.join(cap.dir, 'stills'))}`);
if (cap.stalls.length) console.log(`  stalls: ${cap.stalls.map((x) => `steps ${x.fromStep}-${x.toStep}`).join(', ')}: input that moved nothing before the page moved again (a stop, unless it is a hold the visitor performs)`);
for (const e of cap.errors) console.log(`  note: ${e}`);
if (cap.maxStepsHit) console.log(`  the safety cap of ${opts.maxSteps ?? MOTION_DEFAULTS.maxSteps} steps was hit: raise --max-steps to see the rest`);
process.exit(cap.sheets.length ? 0 : 1);
