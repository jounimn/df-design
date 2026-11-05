#!/usr/bin/env node
import path from 'node:path';
import { launchBrowser, newPage, settle } from './lib/browser.mjs';
import { runStaticPass } from './lib/static-pass.mjs';
import { runInventory } from './lib/motion-inventory.mjs';
import { runPropertyTrace } from './lib/property-trace.mjs';
import { runScrollTrace } from './lib/scroll-trace.mjs';
import { installCanvasTrace, runCanvasTrace } from './lib/canvas-trace.mjs';
import { classifyArchetype } from './lib/archetype.mjs';
import { validateRecord } from './lib/validate.mjs';
import { bundleDir, writeBundle, renderContactSheet } from './lib/bundle.mjs';
import { kindOf, summarizeTransfer, watchTransfer } from './lib/transfer.mjs';

const today = () => new Date().toISOString().slice(0, 10);
// settle() waits for load and network idle up to 15 s, as before; a shorter --timeout shortens that wait too.
const settleTimeout = (timeout) => Math.min(timeout, 15000);

export const WAITS = ['domcontentloaded', 'load', 'networkidle'];
export const USAGE = 'usage: node scripts/probe.mjs <url> [--cohort <tag>] [--root <dir>] [--wait <domcontentloaded|load|networkidle>] [--timeout <ms>] [--click "<css>"]...';

// Splits "a, b" on the commas between selectors, not on those inside brackets, parentheses or quotes, so
// `:is(.yes, .ok)` stays one click and "#age-yes, #sound-off" is two.
export function splitClicks(value) {
  const out = [];
  let depth = 0;
  let quote = null;
  let current = '';
  for (const ch of value) {
    if (quote) { if (ch === quote) quote = null; current += ch; continue; }
    if (ch === '"' || ch === "'") quote = ch;
    else if (ch === '(' || ch === '[') depth += 1;
    else if (ch === ')' || ch === ']') depth -= 1;
    else if (ch === ',' && depth === 0) { out.push(current.trim()); current = ''; continue; }
    current += ch;
  }
  out.push(current.trim());
  return out.filter(Boolean);
}

// The command line. Without the new options the probe behaves as before: wait for "load", Playwright's 30 s, no click.
export function parseProbeArgs(argv) {
  const out = { url: undefined, cohort: null, root: 'captures', wait: 'load', timeout: 30000, clicks: [] };
  const value = (i, name) => {
    const v = argv[i + 1];
    if (v === undefined || v.startsWith('--')) throw new Error(`--${name} needs a value`);
    return v;
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === '--cohort') { out.cohort = value(i, 'cohort'); i += 1; }
    else if (a === '--root') { out.root = value(i, 'root'); i += 1; }
    else if (a === '--wait') {
      out.wait = value(i, 'wait'); i += 1;
      if (!WAITS.includes(out.wait)) throw new Error(`--wait needs one of ${WAITS.join(', ')} (got "${out.wait}")`);
    } else if (a === '--timeout') {
      const ms = Number(value(i, 'timeout')); i += 1;
      if (!Number.isInteger(ms) || ms <= 0) throw new Error(`--timeout needs a whole number of milliseconds (got "${argv[i]}")`);
      out.timeout = ms;
    } else if (a === '--click') { out.clicks.push(...splitClicks(value(i, 'click'))); i += 1; }
    else if (a.startsWith('--')) throw new Error(`unknown option ${a}`);
    else if (out.url === undefined) out.url = a;
    else throw new Error(`unexpected extra argument: ${a}`);
  }
  if (out.url === undefined) throw new Error('missing <url>');
  return out;
}

function tracked(staticResult, inventory) {
  const fromMotion = inventory.animations.map((a) => a.selector).filter((s) => s !== 'unknown');
  const structural = ['canvas', 'header', 'main', 'section', 'h1', '[class*="hero"]'];
  return [...new Set([...fromMotion, ...structural])].slice(0, 12);
}

// Passes the gate of a page already opened and settled (an age question, a "Begin", a sound prompt) by clicking each
// selector in turn. A click that fails is recorded, not thrown: the record then says the gate was not passed.
async function passGate(page, { timeout, clicks }) {
  const failed = [];
  for (const selector of clicks) {
    try {
      await page.locator(selector).first().click({ timeout: Math.min(timeout, 15000) });
      await page.waitForTimeout(1500);
    } catch (err) {
      failed.push({ selector, error: String(err?.message ?? err).split('\n')[0] });
    }
  }
  if (clicks.length) await settle(page, { timeout: settleTimeout(timeout), quiet: 600 });
  return failed;
}

export async function probe(url, { cohort = null, root = 'captures', date = today(), wait = 'load', timeout = 30000, clicks = [] } = {}) {
  if (!WAITS.includes(wait)) throw new Error(`wait must be one of ${WAITS.join(', ')}`);
  const site = new URL(url).hostname;
  const browser = await launchBrowser();

  try {
    // Motion pass — reduced motion OFF, because the point is to see the motion.
    // This is the inversion of verification.md, which emulates it to suppress motion.
    const { page, context } = await newPage(browser, { reducedMotion: 'no-preference' });
    await installCanvasTrace(context);
    const transfer = await watchTransfer(page);
    // The first view is weighed after the page settles and before any click: what arrived before the visitor did
    // anything, sound included.
    await page.goto(url, { waitUntil: wait, timeout });
    await settle(page, { timeout: settleTimeout(timeout) });
    const beforeGesture = transfer.entries();
    const gateFailed = await passGate(page, { timeout, clicks });

    const staticResult = await runStaticPass(page);
    const inventory = await runInventory(page);
    const selectors = tracked(staticResult, inventory);
    const trace = await runPropertyTrace(page, { selectors, samples: 40, durationMs: 1600 });
    const scroll = await runScrollTrace(page, { selectors, steps: 12 });

    const frames = [];
    // Last of the motion pass: it scrolls canvases into view and reopens the page twice (reduced motion,
    // no WebGL). A failure is kept as `canvasError` and the field quarantined, never silently an empty list.
    // The two reopened pages are not clicked through a gate.
    let canvasTrace = null;
    let canvasError = null;
    try {
      await page.evaluate(() => window.scrollTo(0, 0));
      canvasTrace = await runCanvasTrace(page, { frames: 6, durationMs: 1500, settleMs: 300 });
    } catch (err) {
      canvasError = String(err?.message ?? err);
    }
    // The trace may have left the page mid-scroll, or the page may have died; neither may take the probe down.
    await page.evaluate(() => window.scrollTo(0, 0)).catch(() => {});

    const maxScroll = Math.max(staticResult.pageHeightPx - staticResult.viewportHeightPx, 0);
    for (let i = 0; i < 6; i += 1) {
      await page.evaluate((y) => window.scrollTo(0, y), Math.round((maxScroll * i) / 5));
      await page.waitForTimeout(200);
      frames.push({ name: `scroll-${String(i).padStart(3, '0')}.png`, buffer: await page.screenshot() });
    }
    const afterScroll = transfer.entries();
    await transfer.stop();
    await context.close();

    // Contract pass — reduced motion ON. Behavioural, not a stylesheet grep.
    const { page: rmPage, context: rmContext } = await newPage(browser, { reducedMotion: 'reduce' });
    await rmPage.goto(url, { waitUntil: wait, timeout });
    await settle(rmPage, { timeout: settleTimeout(timeout), quiet: 600 });
    await passGate(rmPage, { timeout, clicks });
    const rmInventory = await runInventory(rmPage);
    const rmTrace = await runPropertyTrace(rmPage, { selectors, samples: 12, durationMs: 500 });
    frames.push({ name: 'reduced-motion.png', buffer: await rmPage.screenshot() });
    await rmContext.close();

    const movingNormally = trace.elements.filter((e) => e.moved).length;
    const movingReduced = rmTrace.elements.filter((e) => e.moved).length;

    const { archetype, reason } = classifyArchetype({
      hero: staticResult.hero,
      canvasAreaRatio: staticResult.canvasAreaRatio,
      webgl: staticResult.features.webgl,
      videoAreaRatio: staticResult.videoAreaRatio,
      firstViewportTextLength: staticResult.firstViewportTextLength,
      sectionCount: staticResult.sectionCount,
      animatedElementCount: inventory.animations.length + movingNormally,
    });

    const raw = {
      site, url, cohort, measured_at: date, probe_version: '1.1.0',
      ...staticResult,
      archetype, archetypeReason: reason,
      canvases: canvasTrace ? canvasTrace.canvases : null,
      canvasJsBytes: canvasTrace ? { jsBytes: canvasTrace.jsBytes, motionJsBytes: canvasTrace.motionJsBytes } : null,
      libraries: canvasTrace ? canvasTrace.libraries : null,
      ...(canvasError ? { canvasError } : {}),
      // Bytes on the wire by type (images, video, models, audio, script, other). firstView: settled, before any click;
      // full: after the gate and the six scroll frames. audioBeforeGesture: sound bytes fetched before any click.
      transfer: {
        firstView: summarizeTransfer(beforeGesture),
        full: summarizeTransfer(afterScroll),
        audioBeforeGesture: beforeGesture.filter((e) => kindOf(e) === 'audio').reduce((n, e) => n + (e.bytes > 0 ? e.bytes : 0), 0),
      },
      load: { wait, timeout, clicks, ...(gateFailed.length ? { clicksFailed: gateFailed } : {}) },
      reducedMotion: {
        cssRules: staticResult.reducedMotionRules,
        animationsNormally: inventory.animations.length,
        animationsReduced: rmInventory.animations.length,
        movingNormally,
        movingReduced,
        honoured: movingReduced < movingNormally || movingNormally === 0,
      },
    };

    const { record, quarantine } = validateRecord(raw);
    record.archetype = archetype;
    record.archetypeReason = reason;
    record.quarantined = quarantine.map((q) => q.field);

    const dir = bundleDir(root, site, date);
    await writeBundle(dir, {
      record,
      raw: { ...raw, quarantine },
      motion: { inventory, trace, scroll, reducedMotionTrace: rmTrace },
      frames,
    });
    await renderContactSheet(browser, frames, path.join(dir, 'contact.png'));

    return { dir, record, quarantine };
  } finally {
    await browser.close();
  }
}

if (process.argv[1]?.endsWith('probe.mjs')) {
  let options;
  try {
    options = parseProbeArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`${err.message}\n${USAGE}`);
    process.exit(1);
  }
  const { url, ...rest } = options;
  const { dir, record, quarantine } = await probe(url, rest);
  console.log(`${record.site} -> ${dir}`);
  console.log(`  archetype: ${record.archetype} (${record.archetypeReason})`);
  const t = record.transfer;
  const mb = (b) => `${(b / 1048576).toFixed(1)} MB`;
  console.log(`  transfer: first view ${mb(t.firstView.total)}, full ${mb(t.full.total)}${t.audioBeforeGesture ? `, ${mb(t.audioBeforeGesture)} of sound before any click` : ''}`);
  if (record.load.clicksFailed) console.log(`  gate not passed: ${record.load.clicksFailed.map((c) => c.selector).join(', ')}`);
  console.log(`  quarantined: ${quarantine.length ? quarantine.map((q) => q.field).join(', ') : 'none'}`);
}
