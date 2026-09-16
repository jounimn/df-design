const TRACKED = ['transform', 'opacity', 'filter', 'clipPath', 'backgroundPosition', 'maskPosition'];

export async function runPropertyTrace(page, { selectors, samples = 60, durationMs = 2000 } = {}) {
  return page.evaluate(
    async ({ selectors, samples, durationMs, TRACKED }) => {
      const interval = durationMs / samples;
      const targets = selectors
        .map((sel) => {
          let el = null;
          try { el = document.querySelector(sel); } catch { el = null; }
          return { sel, el };
        })
        .filter((t) => t.el);

      const series = new Map(targets.map((t) => [t.sel, []]));
      const start = performance.now();

      for (let i = 0; i < samples; i += 1) {
        const t = performance.now() - start;
        for (const { sel, el } of targets) {
          const cs = getComputedStyle(el);
          const frame = { t: Math.round(t) };
          for (const prop of TRACKED) frame[prop] = cs[prop];
          series.get(sel).push(frame);
        }
        await new Promise((r) => setTimeout(r, interval));
      }

      const elements = [...series.entries()].map(([selector, frames]) => {
        const moved = TRACKED.some((prop) => new Set(frames.map((f) => f[prop])).size > 1);
        return { selector, series: frames, moved };
      });

      return { samples, intervalMs: interval, elements };
    },
    { selectors, samples, durationMs, TRACKED },
  );
}
