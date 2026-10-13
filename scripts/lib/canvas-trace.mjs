// Measures every visible <canvas> on a page: is it alive, blank, how fast, which context.
// Pixels come from element screenshots (the compositor), never readPixels, so a WebGL canvas created with
// preserveDrawingBuffer:false is not misread as blank.
import { settle } from './browser.mjs';

export const CHANGED_SHARE_MIN = 0.0005;
const CHANNEL_DELTA_MIN = 2;

// Must run before navigation: hooks getContext, requestAnimationFrame and long tasks on every document.
export async function installCanvasTrace(context) {
  await context.addInitScript(() => {
    if (window.__dfTrace) return;
    const state = { rafTimes: [], longTasks: 0 };
    Object.defineProperty(window, '__dfTrace', { value: state });

    const nativeRaf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (cb) => nativeRaf((ts) => { state.rafTimes.push(ts); cb(ts); });

    const nativeGet = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function getContext(type, ...rest) {
      const ctx = nativeGet.call(this, type, ...rest);
      if (!this.__dfRequested) this.__dfRequested = type;
      if (ctx && !this.__dfType) this.__dfType = type;
      return ctx;
    };

    try {
      new PerformanceObserver((list) => { state.longTasks += list.getEntries().length; }).observe({ entryTypes: ['longtask'] });
    } catch { /* not supported: longTasks stays 0 */ }
  });
}

// Lists the canvases a visitor could see, with a selector that survives a second run.
async function listCanvases(page) {
  return page.evaluate(() => {
    const esc = (s) => CSS.escape(s);
    const selectorFor = (el) => {
      if (el.id && document.querySelectorAll(`#${esc(el.id)}`).length === 1) return `${el.localName}#${esc(el.id)}`;
      const parts = [];
      for (let n = el; n && n.nodeType === 1 && n !== document.documentElement; n = n.parentElement) {
        if (n.id && document.querySelectorAll(`#${esc(n.id)}`).length === 1) { parts.unshift(`#${esc(n.id)}`); break; }
        const same = [...n.parentElement.children].filter((s) => s.localName === n.localName);
        parts.unshift(same.length > 1 ? `${n.localName}:nth-of-type(${same.indexOf(n) + 1})` : n.localName);
      }
      return parts.join(' > ');
    };
    return [...document.querySelectorAll('canvas')]
      .filter((el) => {
        const r = el.getBoundingClientRect();
        if (r.width < 1 || r.height < 1) return false;
        if (el.closest('[inert]')) return false;
        return el.checkVisibility({ checkVisibilityCSS: true });
      })
      .map((el) => ({
        selector: selectorFor(el),
        context: el.__dfType === 'webgl2' || el.__dfType === 'webgl' || el.__dfType === '2d' ? el.__dfType : 'none',
        requested: el.__dfRequested ?? null,
      }));
  });
}

async function rendererOf(page, selector, context) {
  if (context !== 'webgl' && context !== 'webgl2') return null;
  return page.evaluate(({ selector, context }) => {
    const gl = document.querySelector(selector)?.getContext(context);
    const ext = gl?.getExtension('WEBGL_debug_renderer_info');
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : null;
  }, { selector, context });
}

// Decodes PNG buffers on a throwaway page of the same context and reports, for consecutive frames, the share of
// pixels whose channels differ by more than CHANNEL_DELTA_MIN; and whether every frame is one colour.
async function compareFrames(page, buffers) {
  const scratch = await page.context().newPage();
  try {
    return await scratch.evaluate(async ({ uris, minDelta }) => {
      const load = async (src) => {
        const img = new Image(); img.src = src; await img.decode();
        const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
        const g = c.getContext('2d'); g.drawImage(img, 0, 0);
        return g.getImageData(0, 0, img.width, img.height).data;
      };
      const frames = [];
      for (const u of uris) frames.push(await load(u));
      let maxShare = 0;
      for (let i = 1; i < frames.length; i += 1) {
        const a = frames[i - 1]; const b = frames[i];
        if (a.length !== b.length) { maxShare = 1; continue; }
        let changed = 0;
        for (let k = 0; k < a.length; k += 4) {
          if (Math.abs(a[k] - b[k]) > minDelta || Math.abs(a[k + 1] - b[k + 1]) > minDelta || Math.abs(a[k + 2] - b[k + 2]) > minDelta) changed += 1;
        }
        maxShare = Math.max(maxShare, changed / (a.length / 4));
      }
      const oneColour = frames.every((d) => {
        for (let k = 4; k < d.length; k += 4) if (d[k] !== d[0] || d[k + 1] !== d[1] || d[k + 2] !== d[2]) return false;
        return true;
      });
      return { changedShare: maxShare, blank: oneColour };
    }, { uris: buffers.map((b) => `data:image/png;base64,${b.toString('base64')}`), minDelta: CHANNEL_DELTA_MIN });
  } finally {
    await scratch.close();
  }
}

const quantile = (sorted, q) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] : 0);

export async function runCanvasTrace(page, { frames = 8, durationMs = 2000, settleMs = 1800 } = {}) {
  await settle(page, { quiet: settleMs });
  const found = await listCanvases(page);
  const records = [];
  for (const { selector, context, requested } of found) {
    const locator = page.locator(selector).first();
    await page.evaluate(() => { window.__dfTrace.rafTimes.length = 0; window.__dfTrace.longTasks = 0; });
    const buffers = [];
    const started = Date.now();
    for (let i = 0; i < frames; i += 1) {
      buffers.push(await locator.screenshot());
      const wait = (durationMs / frames) * (i + 1) - (Date.now() - started);
      if (wait > 0) await page.waitForTimeout(wait);
    }
    const elapsed = (Date.now() - started) / 1000;
    const { rafTimes, longTasks } = await page.evaluate(() => ({ rafTimes: [...window.__dfTrace.rafTimes], longTasks: window.__dfTrace.longTasks }));
    const deltas = rafTimes.slice(1).map((t, i) => t - rafTimes[i]).sort((a, b) => a - b);
    const { changedShare, blank } = await compareFrames(page, buffers);
    records.push({
      selector,
      context,
      requested,
      renderer: await rendererOf(page, selector, context),
      animating: changedShare > CHANGED_SHARE_MIN,
      blank,
      changedShare,
      rafPerSec: Math.round((rafTimes.length / elapsed) * 10) / 10,
      frameMs: { p50: Math.round(quantile(deltas, 0.5) * 10) / 10, p95: Math.round(quantile(deltas, 0.95) * 10) / 10 },
      longTasks,
      drawCallsOffscreen: null,
      reducedMotionAnimating: null,
      fallbackVisible: null,
      fallbackErrors: [],
    });
  }
  return { canvases: records, jsBytes: 0, motionJsBytes: 0, libraries: [] };
}
