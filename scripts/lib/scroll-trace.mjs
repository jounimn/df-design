export async function runScrollTrace(page, { selectors, steps = 24 } = {}) {
  const max = await page.evaluate(
    () => document.documentElement.scrollHeight - innerHeight,
  );

  if (max <= 0) {
    return { available: false, reason: 'page is not scrollable', steps: 0, series: [] };
  }

  // Probe first: if driving scroll does not move the document, a smooth-scroll
  // library owns it. Emitting a flat series here would read as "no scroll-linked
  // motion", which is the opposite of the truth. Spec §6.5.
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(max / 2));
  await page.waitForTimeout(250);
  const moved = await page.evaluate(() => window.scrollY);
  if (moved < 1) {
    await page.evaluate(() => window.scrollTo(0, 0));
    return {
      available: false,
      reason: 'programmatic scroll did not move the document; a smooth-scroll library likely owns scrolling',
      steps: 0,
      series: [],
    };
  }

  const series = [];
  for (let i = 0; i < steps; i += 1) {
    const target = Math.round((max * i) / Math.max(steps - 1, 1));
    await page.evaluate((y) => window.scrollTo(0, y), target);
    await page.waitForTimeout(120);
    series.push(await page.evaluate((sels) => {
      const values = {};
      for (const sel of sels) {
        let el = null;
        try { el = document.querySelector(sel); } catch { el = null; }
        if (!el) continue;
        const cs = getComputedStyle(el);
        values[sel] = { transform: cs.transform, opacity: cs.opacity };
      }
      const denom = document.documentElement.scrollHeight - innerHeight;
      return { scrollY: window.scrollY, progress: denom > 0 ? window.scrollY / denom : 0, values };
    }, selectors));
  }

  await page.evaluate(() => window.scrollTo(0, 0));
  return { available: true, steps, series };
}
