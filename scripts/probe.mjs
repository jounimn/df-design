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
import { captureMotion, movingSignals } from './lib/motion-capture.mjs';

// The words scroll-trace uses when window.scrollTo did not move the page: a smooth-scroll library owns it.
const SCROLL_OWNED = /programmatic scroll did not move the document/;

const today = () => new Date().toISOString().slice(0, 10);

function tracked(staticResult, inventory) {
  const fromMotion = inventory.animations.map((a) => a.selector).filter((s) => s !== 'unknown');
  const structural = ['canvas', 'header', 'main', 'section', 'h1', '[class*="hero"]'];
  return [...new Set([...fromMotion, ...structural])].slice(0, 12);
}

export async function probe(url, { cohort = null, root = 'captures', date = today(), motion = false } = {}) {
  const site = new URL(url).hostname;
  const browser = await launchBrowser();

  try {
    // Motion pass — reduced motion OFF, because the point is to see the motion.
    // This is the inversion of verification.md, which emulates it to suppress motion.
    const { page, context } = await newPage(browser, { reducedMotion: 'no-preference' });
    await installCanvasTrace(context);
    await page.goto(url, { waitUntil: 'load' });
    await settle(page);

    const staticResult = await runStaticPass(page);
    const inventory = await runInventory(page);
    const selectors = tracked(staticResult, inventory);
    const trace = await runPropertyTrace(page, { selectors, samples: 40, durationMs: 1600 });
    const scroll = await runScrollTrace(page, { selectors, steps: 12 });
    // A virtual scroller leaves the document one screen tall, so scroll-trace reads it as not scrollable at all.
    const virtualScroll = !scroll.available && (await movingSignals(page)).includes('virtual scroll');

    const frames = [];
    // Last of the motion pass: it scrolls canvases into view and reopens the page twice (reduced motion,
    // no WebGL). A failure is kept as `canvasError` and the field quarantined, never silently an empty list.
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
    await context.close();

    // When scrollTo did not move the page (or there is no document scroll and a virtual scroller holds the content),
    // the six frames above all show the first screen. Drive it with real input
    // instead and keep the video and its contact sheets in the bundle (motion/). --motion asks for it on any page.
    const dir = bundleDir(root, site, date);
    let motionCapture = null;
    const scrollOwned = !scroll.available && SCROLL_OWNED.test(scroll.reason || '');
    if (motion || scrollOwned || virtualScroll) {
      const cap = await captureMotion(browser, url, { out: path.join(dir, 'motion') });
      motionCapture = {
        why: motion ? 'asked (--motion)' : scrollOwned ? 'programmatic scroll did not move the document' : 'virtual scroll: the document does not scroll, a taller layer holds the content',
        dir: 'motion', reachedEnd: cap.reachedEnd, endReason: cap.endReason, movedBy: cap.movedBy, steps: cap.steps,
        sheets: cap.sheets.map((s) => `motion/${s}`), sheetsFrom: cap.sheetsFrom, video: cap.video ? `motion/${cap.video}` : null,
        stills: cap.stills.length, errors: cap.errors,
      };
    }

    // Contract pass — reduced motion ON. Behavioural, not a stylesheet grep.
    const { page: rmPage, context: rmContext } = await newPage(browser, { reducedMotion: 'reduce' });
    await rmPage.goto(url, { waitUntil: 'load' });
    await settle(rmPage, { quiet: 600 });
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
      site, url, cohort, measured_at: date, probe_version: '1.0.0',
      ...staticResult,
      archetype, archetypeReason: reason,
      canvases: canvasTrace ? canvasTrace.canvases : null,
      canvasJsBytes: canvasTrace ? { jsBytes: canvasTrace.jsBytes, motionJsBytes: canvasTrace.motionJsBytes } : null,
      libraries: canvasTrace ? canvasTrace.libraries : null,
      ...(canvasError ? { canvasError } : {}),
      ...(motionCapture ? { motionCapture } : {}),
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

    await writeBundle(dir, {
      record,
      raw: { ...raw, quarantine },
      motion: { inventory, trace, scroll, reducedMotionTrace: rmTrace, ...(motionCapture ? { capture: motionCapture } : {}) },
      frames,
    });
    await renderContactSheet(browser, frames, path.join(dir, 'contact.png'));

    return { dir, record, quarantine, motionCapture };
  } finally {
    await browser.close();
  }
}

if (process.argv[1]?.endsWith('probe.mjs')) {
  const [url, ...rest] = process.argv.slice(2);
  if (!url) {
    console.error('usage: node scripts/probe.mjs <url> [--cohort <tag>] [--root <dir>] [--motion]');
    process.exit(1);
  }
  const arg = (name, fallback) => {
    const i = rest.indexOf(`--${name}`);
    return i >= 0 ? rest[i + 1] : fallback;
  };
  const { dir, record, quarantine, motionCapture } = await probe(url, {
    cohort: arg('cohort', null),
    root: arg('root', 'captures'),
    motion: rest.includes('--motion'),
  });
  console.log(`${record.site} -> ${dir}`);
  console.log(`  archetype: ${record.archetype} (${record.archetypeReason})`);
  console.log(`  quarantined: ${quarantine.length ? quarantine.map((q) => q.field).join(', ') : 'none'}`);
  if (motionCapture) console.log(`  motion capture (${motionCapture.why}): ${motionCapture.reachedEnd ? 'reached the end' : 'did NOT reach the end'}, moved by ${motionCapture.movedBy}; sheets in ${path.join(dir, 'motion')}`);
}
