#!/usr/bin/env node
import path from 'node:path';
import { launchBrowser, newPage, settle } from './lib/browser.mjs';
import { runStaticPass } from './lib/static-pass.mjs';
import { runInventory } from './lib/motion-inventory.mjs';
import { runPropertyTrace } from './lib/property-trace.mjs';
import { runScrollTrace } from './lib/scroll-trace.mjs';
import { classifyArchetype } from './lib/archetype.mjs';
import { validateRecord } from './lib/validate.mjs';
import { bundleDir, writeBundle, renderContactSheet } from './lib/bundle.mjs';

const today = () => new Date().toISOString().slice(0, 10);

function tracked(staticResult, inventory) {
  const fromMotion = inventory.animations.map((a) => a.selector).filter((s) => s !== 'unknown');
  const structural = ['canvas', 'header', 'main', 'section', 'h1', '[class*="hero"]'];
  return [...new Set([...fromMotion, ...structural])].slice(0, 12);
}

export async function probe(url, { cohort = null, root = 'captures', date = today() } = {}) {
  const site = new URL(url).hostname;
  const browser = await launchBrowser();

  try {
    // Motion pass — reduced motion OFF, because the point is to see the motion.
    // This is the inversion of verification.md, which emulates it to suppress motion.
    const { page, context } = await newPage(browser, { reducedMotion: 'no-preference' });
    await page.goto(url, { waitUntil: 'load' });
    await settle(page);

    const staticResult = await runStaticPass(page);
    const inventory = await runInventory(page);
    const selectors = tracked(staticResult, inventory);
    const trace = await runPropertyTrace(page, { selectors, samples: 40, durationMs: 1600 });
    const scroll = await runScrollTrace(page, { selectors, steps: 12 });

    const frames = [];
    const maxScroll = Math.max(staticResult.pageHeightPx - staticResult.viewportHeightPx, 0);
    for (let i = 0; i < 6; i += 1) {
      await page.evaluate((y) => window.scrollTo(0, y), Math.round((maxScroll * i) / 5));
      await page.waitForTimeout(200);
      frames.push({ name: `scroll-${String(i).padStart(3, '0')}.png`, buffer: await page.screenshot() });
    }
    await context.close();

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
  const [url, ...rest] = process.argv.slice(2);
  if (!url) {
    console.error('usage: node scripts/probe.mjs <url> [--cohort <tag>] [--root <dir>]');
    process.exit(1);
  }
  const arg = (name, fallback) => {
    const i = rest.indexOf(`--${name}`);
    return i >= 0 ? rest[i + 1] : fallback;
  };
  const { dir, record, quarantine } = await probe(url, {
    cohort: arg('cohort', null),
    root: arg('root', 'captures'),
  });
  console.log(`${record.site} -> ${dir}`);
  console.log(`  archetype: ${record.archetype} (${record.archetypeReason})`);
  console.log(`  quarantined: ${quarantine.length ? quarantine.map((q) => q.field).join(', ') : 'none'}`);
}
