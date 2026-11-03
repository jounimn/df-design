// The checks of check-motion, run on one page. A page with no canvas has nothing to judge on the canvas: the four
// canvas checks are 'na' and only the weight is reported. The page checks after them (works without JS, video under
// reduced motion, audio before a gesture, weight by type) are the Floor that the yolo tier still owes.
// status: 'pass' | 'fail' | 'na' (nothing to judge) | 'report' (a number with no ceiling to hold it to).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { newPage, settle } from './browser.mjs';
import { installCanvasTrace, runCanvasTrace } from './canvas-trace.mjs';
import { formatTransfer, kindOf, watchTransfer } from './transfer.mjs';

export class UsageError extends Error {}

export const TIERS = ['fast', 'medium', 'high', 'yolo', 'custom'];
// Tiers never judged by weight: fast is checked by rule (works without JS), yolo has no ceiling and is judged by the
// Floor, custom has no ceiling. A ceiling for any of them in motion-ceilings.json is dropped.
const UNWEIGHED = new Set(['fast', 'yolo', 'custom']);
// Tiers that fail when the content is not there without JavaScript: fast by its rule, yolo by the Floor.
const NO_JS_FAILS = new Set(['fast', 'yolo']);

export const CHECK_NAMES = [
  'canvas is alive',
  'canvas honours reduced motion',
  'canvas pauses off-screen',
  'fallback without WebGL',
  'motion weight within tier',
  'works without JS',
  'video honours reduced motion',
  'no audio before a gesture',
  'page weight by type',
];

const CEILINGS_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'motion-ceilings.json');

// { medium?, high? } in bytes. Absent file, or a tier missing from it: the weight is reported, not judged.
// Only a missing file means "no ceilings yet": an unreadable or malformed one is a mistake to see, not to hide, and a
// value that is not a number of bytes is dropped (that tier is then reported, not judged), as is a ceiling for a tier
// that is never weighed (fast, yolo, custom).
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
  return Object.fromEntries(Object.entries(parsed).filter(([tier, bytes]) => TIERS.includes(tier) && !['custom', 'yolo'].includes(tier) && Number.isFinite(bytes) && bytes >= 0));
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

// An http(s) or file:// URL as given, or an existing file as a file:// URL; anything else is a usage error.
export function resolveTarget(target) {
  if (/^(https?|file):\/\//i.test(target)) return target; // file:// with a #slide-N hash opens a presentation on that slide
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

// page: what the page checks need, read by runMotionChecks; null when they were not run (a presentation's slide).
//   { url, videos: { count, playing: [names] } | null, audio: [urls], transfer: { firstView, full } }
export function evaluateMotion(trace, { tier, ceilings, content = null, includeWithoutJs = true, page = null }) {
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

  // custom has no ceiling, and neither do fast (checked by rule: works without JS) and yolo (judged by the Floor).
  const ceiling = UNWEIGHED.has(tier) ? undefined : ceilings?.[tier];
  const bytes = trace.motionJsBytes;
  if (typeof ceiling !== 'number') {
    const why = {
      custom: 'the custom tier has no ceiling',
      fast: 'the fast tier has no weight ceiling; it is checked by the works-without-JS rule',
      yolo: 'the yolo tier has no ceiling; it is judged by the Floor checks below',
    }[tier] ?? `there is no measured ceiling for the ${tier} tier yet`;
    checks.push({ name: CHECK_NAMES[4], status: 'report', detail: `motion JS is ${kb(bytes)}; ${why}` });
  } else if (bytes > ceiling) {
    checks.push({ name: CHECK_NAMES[4], status: 'fail', detail: `motion JS is ${kb(bytes)}, over the ${kb(ceiling)} ceiling of the ${tier} tier.` });
  } else {
    checks.push({ name: CHECK_NAMES[4], status: 'pass', detail: `motion JS is ${kb(bytes)}, within the ${kb(ceiling)} ceiling of the ${tier} tier` });
  }

  // A presentation's slideshow needs its script by design, so check-presentation asks for the canvas checks only.
  if (includeWithoutJs) {
    checks.push(withoutJsCheck(content, tier));
    checks.push(videoCheck(page?.videos ?? null, tier));
    checks.push(audioCheck(page?.audio ?? null, tier));
    checks.push(weightCheck(page?.transfer ?? null, page?.url ?? '', tier));
  }

  return { checks, ok: checks.every((c) => c.status !== 'fail') };
}

// ---- The Floor of the page: video, sound, weight ----------------------------------------------------------------

// videos: { count, playing } read under reduced motion, or null when the page was not opened that way.
function videoCheck(videos, tier) {
  const name = CHECK_NAMES[6];
  if (!videos) return { name, status: 'na', detail: 'the page was not opened under reduced motion' };
  if (!videos.count) return { name, status: 'na', detail: 'no video on the page' };
  if (!videos.playing.length) return { name, status: 'pass', detail: `no video plays under reduced motion (${plural(videos.count, 'video')} on the page)` };
  const detail = `${plural(videos.playing.length, 'video')} still ${videos.playing.length === 1 ? 'plays' : 'play'} when the visitor asks for reduced motion: ${videos.playing.slice(0, 5).join(', ')}. Show the poster, or stop it until the visitor presses play.`;
  return tier === 'yolo' ? { name, status: 'fail', detail } : { name, status: 'report', detail: `${detail} (only the yolo tier fails on this)` };
}

// audio: the URLs of every sound file the page fetched while it was opened, scrolled and read. The check never
// clicks, taps or types, so any of them was fetched before the visitor did anything.
function audioCheck(audio, tier) {
  const name = CHECK_NAMES[7];
  if (!audio) return { name, status: 'na', detail: 'the page was not weighed' };
  if (!audio.length) return { name, status: 'pass', detail: 'no sound file fetched before the visitor did anything' };
  const files = audio.slice(0, 5).map((u) => u.split(/[?#]/)[0].split('/').pop() || u).join(', ');
  const detail = `${plural(audio.length, 'sound file')} fetched before any click or tap: ${files}${audio.length > 5 ? `, and ${audio.length - 5} more` : ''}. Fetch sound only after the visitor turns it on.`;
  return tier === 'yolo' ? { name, status: 'fail', detail } : { name, status: 'report', detail: `${detail} (only the yolo tier fails on this)` };
}

// transfer: { firstView, full } summaries (full is null when the page was not scrolled). Reported on every tier and
// never judged: for a yolo page the weight is the price the tier message names, not a limit.
function weightCheck(transfer, url, tier) {
  const name = CHECK_NAMES[8];
  if (!transfer?.firstView) return { name, status: 'na', detail: 'the page was not weighed' };
  const parts = [`first view ${formatTransfer(transfer.firstView)}`];
  if (transfer.full) parts.push(`after a full scroll ${formatTransfer(transfer.full)}`);
  const local = /^file:/i.test(url) ? '; a file:// page reports only the document and its scripts, so serve it over http(s) for the full weight' : '';
  const why = tier === 'yolo' ? '; the yolo tier has no weight ceiling: this is the price for the tier message' : '';
  return { name, status: 'report', detail: `${parts.join('; ')}${local}${why}` };
}

// ---- works without JS -----------------------------------------------------------------------------------------

const CONTENT_SELECTOR = 'h1,h2,h3,h4,h5,h6,p,li,img,a,button,figure,blockquote';
const MISSING_SHARE_MAX = 0.05; // more than this share of the content missing or hidden fails the fast and yolo tiers
const MAX_EXAMPLES = 5;

// Runs in the page: every content element with a key to find it by in the other render, and whether it can be seen.
// Seen = checkVisibility (display, visibility, content-visibility) plus no ancestor at opacity 0 and a box with area.
// With cover, also not covered: scrolled to the middle of the viewport, the element (or its own content) is what sits
// on top at its centre, not a loader or a curtain laid over the page. The text under an opaque loader is in the DOM,
// but nobody can read it.
function readContent({ selector, cover }) {
  const norm = (text) => (text || '').replace(/\s+/g, ' ').trim().slice(0, 100);
  const parentOf = (n) => n.parentElement ?? (n.parentNode instanceof ShadowRoot ? n.parentNode.host : null);
  const seen = (el) => {
    if (!el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) return false;
    for (let n = el; n; n = parentOf(n)) if (parseFloat(getComputedStyle(n).opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width >= 1 && r.height >= 1;
  };
  const covered = (el) => {
    el.scrollIntoView({ block: 'center', inline: 'nearest' });
    const r = el.getBoundingClientRect();
    const x = Math.min(Math.max(r.left + r.width / 2, 0), innerWidth - 1);
    const y = Math.min(Math.max(r.top + r.height / 2, 0), innerHeight - 1);
    const root = el.getRootNode();
    const top = (typeof root.elementFromPoint === 'function' ? root : document).elementFromPoint(x, y);
    if (!top) return false; // nothing at that point (outside the viewport): it cannot be said to be covered
    return !(top === el || el.contains(top) || top.contains(el));
  };
  const out = [];
  const walk = (root) => {
    for (const el of root.querySelectorAll('*')) {
      if (el.shadowRoot) walk(el.shadowRoot);
      if (!el.matches(selector)) continue;
      const tag = el.localName;
      const label = tag === 'img'
        ? `${(el.getAttribute('src') || '').split('/').pop()}|${norm(el.getAttribute('alt'))}`
        : norm(el.textContent) || norm(el.getAttribute('aria-label')) || (tag === 'a' ? norm(el.getAttribute('href')) : '');
      if (!label) continue;
      const visible = seen(el);
      const under = cover && visible ? covered(el) : false;
      out.push({ key: `${tag}|${label}`, tag, label, seen: visible && !under, covered: under });
    }
  };
  walk(document);
  if (cover) window.scrollTo(0, 0);
  return out;
}

// With scripts on, scroll the page once from top to bottom, so content a script reveals as it is reached is out, then
// read what can be seen. Anything seen here is what a visitor with JavaScript gets.
async function contentWithJs(page) {
  const viewport = page.viewportSize() ?? { width: 1440, height: 900 };
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0, steps = 0; y < height && steps < 60; y += Math.round(viewport.height * 0.8), steps += 1) {
    await page.evaluate((to) => window.scrollTo(0, to), y);
    await page.waitForTimeout(120);
  }
  await page.waitForTimeout(300);
  const items = await page.evaluate(readContent, { selector: CONTENT_SELECTOR, cover: false });
  await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});
  return items.filter((i) => i.seen);
}

// The same page in a context with JavaScript off: what exists there, and what can be seen (and is not covered).
async function contentWithoutJs(browser, url, viewport) {
  const context = await browser.newContext({ viewport, javaScriptEnabled: false, reducedMotion: 'no-preference' });
  try {
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForTimeout(1500); // a CSS entrance (fade, slide) has finished by now
    return await page.evaluate(readContent, { selector: CONTENT_SELECTOR, cover: true });
  } finally {
    await context.close();
  }
}

// content: { withJs, withoutJs } as read above, or null when it was not read.
function withoutJsCheck(content, tier) {
  const name = CHECK_NAMES[5];
  if (!content) return { name, status: 'na', detail: 'the page was not opened without JavaScript' };
  if (!content.withJs.length) return { name, status: 'na', detail: 'no headings, text, images or links to compare' };
  const available = new Map(); // key -> how many of that item exist, can be seen, and are covered, without JS
  for (const i of content.withoutJs) {
    const slot = available.get(i.key) ?? { seen: 0, any: 0, covered: 0 };
    slot.any += 1;
    if (i.seen) slot.seen += 1;
    if (i.covered) slot.covered += 1;
    available.set(i.key, slot);
  }
  const missing = [];
  for (const i of content.withJs) {
    const slot = available.get(i.key);
    if (slot?.seen) { slot.seen -= 1; slot.any -= 1; continue; }
    let why = 'absent';
    if (slot?.any) {
      slot.any -= 1;
      why = slot.covered > 0 ? 'covered' : 'hidden';
      if (slot.covered > 0) slot.covered -= 1;
    } else if (slot) why = 'hidden';
    missing.push({ ...i, why });
  }
  const total = content.withJs.length;
  const share = missing.length / total;
  const examples = missing.slice(0, MAX_EXAMPLES).map((m) => `${m.tag} "${m.label.replace(/^.*\|/, '') || m.label}" (${m.why})`);
  const more = missing.length > MAX_EXAMPLES ? `, and ${missing.length - MAX_EXAMPLES} more` : '';
  const summary = `${missing.length} of ${plural(total, 'content item')} (${Math.round(share * 100)} %) missing, hidden or covered without JavaScript`;
  if (!missing.length) return { name, status: 'pass', detail: `all ${plural(total, 'content item')} show without JavaScript` };
  const detail = `${summary}: ${examples.join(', ')}${more}.`;
  if (!NO_JS_FAILS.has(tier)) return { name, status: 'report', detail: `${detail} (only the fast and yolo tiers fail on this)` };
  const rule = tier === 'fast' ? 'The fast tier must work without JavaScript.' : 'The yolo tier owes the Floor: the content must be readable without the experience.';
  return share > MISSING_SHARE_MAX
    ? { name, status: 'fail', detail: `${detail} ${rule}` }
    : { name, status: 'pass', detail: `${summary} (within the ${Math.round(MISSING_SHARE_MAX * 100)} % allowed): ${examples.join(', ')}${more}.` };
}

// Runs in the page: how many videos there are, and which of them are playing (not paused, not ended) and visible.
function readVideos() {
  const videos = [...document.querySelectorAll('video')];
  const name = (v) => (v.id ? `video#${v.id}` : `video ${((v.currentSrc || v.src || '').split(/[?#]/)[0].split('/').pop()) || `#${videos.indexOf(v) + 1}`}`);
  return { count: videos.length, playing: videos.filter((v) => !v.paused && !v.ended && v.checkVisibility()).map(name) };
}

// The page again under reduced motion, only to see whether its videos still play. Opened only when it has a video.
async function videosUnderReducedMotion(browser, url, viewport) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  try {
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'load' });
    await settle(page);
    return await page.evaluate(readVideos);
  } finally {
    await context.close();
  }
}

// Loads the page with its loop running (no __DF_EXPORT__: the export freezes it) and judges the trace.
export async function runMotionChecks(target, { tier, browser, ceilings = loadCeilings(), includeWithoutJs = true }) {
  if (!TIERS.includes(tier)) throw new UsageError(`unknown tier "${tier}"`);
  const url = resolveTarget(target);
  const { page, context } = await newPage(browser, { reducedMotion: 'no-preference' });
  try {
    await installCanvasTrace(context);
    const transfer = includeWithoutJs ? await watchTransfer(page) : null;
    await page.goto(url, { waitUntil: 'load' });
    await settle(page);
    const firstView = transfer?.snapshot() ?? null;
    const trace = await runCanvasTrace(page);
    const viewport = page.viewportSize() ?? { width: 1440, height: 900 };
    if (!includeWithoutJs) return evaluateMotion(trace, { tier, ceilings, includeWithoutJs });
    const withJs = await contentWithJs(page);
    const full = transfer.snapshot();
    const audio = transfer.entries().filter((e) => kindOf(e) === 'audio').map((e) => e.url);
    const videoCount = await page.evaluate(() => document.querySelectorAll('video').length);
    const videos = videoCount ? await videosUnderReducedMotion(browser, url, viewport) : { count: 0, playing: [] };
    const withoutJs = await contentWithoutJs(browser, url, viewport);
    return evaluateMotion(trace, {
      tier,
      ceilings,
      content: { withJs, withoutJs },
      page: { url, videos, audio, transfer: { firstView, full } },
    });
  } finally {
    await context.close();
  }
}
