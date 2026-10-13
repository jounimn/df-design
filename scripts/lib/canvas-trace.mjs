// Measures every visible <canvas> on a page: is it alive, blank, how fast, which context, whether it pauses
// off-screen, honours reduced motion and survives without WebGL, and what motion JS it costs.
// Pixels come from element screenshots (the compositor), never readPixels, so a WebGL canvas created with
// preserveDrawingBuffer:false is not misread as blank.
import { launchBrowser, settle } from './browser.mjs';

export const CHANGED_SHARE_MIN = 0.0005;
const CHANNEL_DELTA_MIN = 2;
const OFFSCREEN_GRACE_MS = 400;
const OFFSCREEN_COUNT_MS = 1000;

export const LIBRARY_PATTERNS = {
  three: /(^|[/@.-])three(\.module)?(\.min)?\.js|\/three@|three\/build\//i,
  ogl: /(^|[/@])ogl([@/.]|$)/i,
  pixi: /pixi(\.min)?\.js|\/pixi\.js|pixi@/i,
  regl: /(^|[/@.-])regl(\.min)?\.js|\/regl@/i,
  babylon: /babylon(\.min)?\.js|babylonjs/i,
  p5: /(^|[/@.-])p5(\.min)?\.js|\/p5@/i,
  gsap: /gsap(\.min)?\.js|\/gsap@|gsap\/dist/i,
  lottie: /lottie|bodymovin/i,
  rive: /rive(-canvas)?(\.min)?\.js|@rive-app/i,
  spline: /splinetool|spline-viewer|runtime\.spline/i,
};
const LIBRARY_GLOBALS = { three: 'THREE', pixi: 'PIXI', regl: 'createREGL', babylon: 'BABYLON', p5: 'p5', gsap: 'gsap', lottie: 'lottie', rive: 'rive', ogl: 'ogl' };

// context -> { sizes: Map(url -> transferred bytes), pending: Promise[] }
const SCRIPTS = new WeakMap();

// Must run before navigation: hooks getContext, the draw calls, requestAnimationFrame and long tasks on every
// document, and records the transferred size of every script the context loads.
export async function installCanvasTrace(context) {
  const seen = { sizes: new Map(), pending: [] };
  SCRIPTS.set(context, seen);
  context.on('response', (response) => {
    const request = response.request();
    if (request.resourceType() !== 'script') return;
    seen.pending.push((async () => {
      let bytes = 0;
      try { bytes = (await request.sizes()).responseBodySize; } catch { /* fall through to the body */ }
      if (!bytes) { try { bytes = (await response.body()).length; } catch { bytes = 0; } }
      seen.sizes.set(response.url(), bytes);
    })());
  });

  await context.addInitScript(() => {
    if (window.__dfTrace) return;
    const state = { rafTimes: [], longTasks: 0, counting: false, scriptUrls: new Set() };
    Object.defineProperty(window, '__dfTrace', { value: state });

    const nativeRaf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (cb) => nativeRaf((ts) => { state.rafTimes.push(ts); cb(ts); });

    const urlOfCaller = () => {
      const lines = String(new Error().stack).split('\n').slice(1);
      for (const line of lines) {
        const m = line.match(/((?:https?|file|blob):[^\s)]+?)(?::\d+){1,2}\)?\s*$/);
        if (m) return m[1];
      }
      return null;
    };

    const nativeGet = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function getContext(type, ...rest) {
      const ctx = nativeGet.call(this, type, ...rest);
      if (!this.__dfRequested) this.__dfRequested = type;
      if (ctx && !this.__dfType) this.__dfType = type;
      const url = urlOfCaller();
      if (url) state.scriptUrls.add(url);
      return ctx;
    };

    const outsideViewport = (canvas) => {
      const r = canvas.getBoundingClientRect();
      return r.bottom <= 0 || r.top >= innerHeight || r.right <= 0 || r.left >= innerWidth;
    };
    const wrap = (proto, names) => {
      if (!proto) return;
      for (const name of names) {
        const native = proto[name];
        if (typeof native !== 'function') continue;
        proto[name] = function wrapped(...args) {
          const canvas = this.canvas;
          if (canvas) {
            canvas.__dfDraws = (canvas.__dfDraws || 0) + 1;
            if (state.counting && outsideViewport(canvas)) canvas.__dfOffDraws = (canvas.__dfOffDraws || 0) + 1;
          }
          return native.apply(this, args);
        };
      }
    };
    const gl = ['drawArrays', 'drawElements', 'drawArraysInstanced', 'drawElementsInstanced'];
    wrap(window.WebGLRenderingContext?.prototype, gl);
    wrap(window.WebGL2RenderingContext?.prototype, gl);
    wrap(window.CanvasRenderingContext2D?.prototype, ['fillRect', 'drawImage', 'fill', 'stroke', 'putImageData']);

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

// Decodes PNG buffers on a throwaway page of the same context and reports, for consecutive frames, the largest
// share of pixels whose channels differ by more than CHANNEL_DELTA_MIN; and whether every frame is one colour.
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

// Element screenshots spaced over durationMs, compared.
async function sampleCanvas(page, selector, frames, durationMs) {
  const locator = page.locator(selector).first();
  const buffers = [];
  const started = Date.now();
  for (let i = 0; i < frames; i += 1) {
    buffers.push(await locator.screenshot());
    const wait = (durationMs / frames) * (i + 1) - (Date.now() - started);
    if (wait > 0) await page.waitForTimeout(wait);
  }
  return { ...(await compareFrames(page, buffers)), elapsedSec: (Date.now() - started) / 1000 };
}

// Moves the canvas far below the viewport with the individual `translate` property (it composes with any
// transform and with IntersectionObserver), waits for the grace period, then counts draw calls made while out.
async function countOffscreenDraws(page, selector) {
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    el.__dfPrevTranslate = el.style.translate;
    el.style.translate = '0 40000px';
  }, selector);
  await page.waitForTimeout(OFFSCREEN_GRACE_MS);
  await page.evaluate((sel) => { const el = document.querySelector(sel); el.__dfOffDraws = 0; window.__dfTrace.counting = true; }, selector);
  await page.waitForTimeout(OFFSCREEN_COUNT_MS);
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    window.__dfTrace.counting = false;
    const n = el.__dfOffDraws || 0;
    el.style.translate = el.__dfPrevTranslate;
    return n;
  }, selector);
}

const quantile = (sorted, q) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] : 0);
const round1 = (n) => Math.round(n * 10) / 10;

async function reducedMotionRun(browser, url, viewport, selectors, settleMs) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  try {
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'load' });
    await settle(page, { quiet: settleMs });
    const out = new Map();
    for (const selector of selectors) {
      if (!(await page.locator(selector).count())) { out.set(selector, null); continue; }
      const s = await sampleCanvas(page, selector, 4, 900);
      out.set(selector, s.changedShare > CHANGED_SHARE_MIN);
    }
    return out;
  } finally {
    await context.close();
  }
}

// A browser launched with --disable-webgl: the page must still show something and must not throw.
async function noWebglRun(url, viewport, selectors, settleMs) {
  const browser = await launchBrowser({ args: ['--disable-webgl'] });
  try {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e.message ?? e)));
    await page.goto(url, { waitUntil: 'load' });
    await settle(page, { quiet: settleMs });
    const out = new Map();
    for (const selector of selectors) {
      if (!(await page.locator(selector).count())) { out.set(selector, { visible: false, errors }); continue; }
      const s = await sampleCanvas(page, selector, 2, 200);
      out.set(selector, { visible: !s.blank, errors });
    }
    return out;
  } finally {
    await browser.close();
  }
}

async function pageWeight(page) {
  const seen = SCRIPTS.get(page.context());
  if (seen) await Promise.all(seen.pending);
  const sizes = seen?.sizes ?? new Map();
  const info = await page.evaluate(() => ({
    scriptUrls: [...window.__dfTrace.scriptUrls],
    inlineBytes: [...document.scripts].filter((s) => !s.src).map((s) => s.textContent.length),
    here: location.href.split('#')[0],
    globals: Object.keys(window),
  }));
  const libraries = new Set();
  for (const url of sizes.keys()) for (const [name, re] of Object.entries(LIBRARY_PATTERNS)) if (re.test(url)) libraries.add(name);
  for (const [name, global] of Object.entries(LIBRARY_GLOBALS)) if (info.globals.includes(global)) libraries.add(name);

  const motion = new Set();
  for (const url of sizes.keys()) if ([...libraries].some((n) => LIBRARY_PATTERNS[n]?.test(url))) motion.add(url);
  let inline = 0;
  for (const url of info.scriptUrls) {
    if (url.split('#')[0] === info.here) inline = info.inlineBytes.reduce((a, b) => a + b, 0);
    else motion.add(url);
  }
  const bytesOf = (set) => [...set].reduce((total, url) => total + (sizes.get(url) ?? 0), 0);
  return {
    jsBytes: [...sizes.values()].reduce((a, b) => a + b, 0),
    motionJsBytes: bytesOf(motion) + inline,
    libraries: [...libraries].sort(),
  };
}

export async function runCanvasTrace(page, { frames = 8, durationMs = 2000, settleMs = 1800, variants = true } = {}) {
  await settle(page, { quiet: settleMs });
  const url = page.url();
  const viewport = page.viewportSize() ?? { width: 1440, height: 900 };
  const found = await listCanvases(page);
  const records = [];
  for (const { selector, context, requested } of found) {
    await page.evaluate((sel) => {
      window.__dfTrace.rafTimes.length = 0; window.__dfTrace.longTasks = 0;
      document.querySelector(sel).__dfDraws = 0;
    }, selector);
    const sample = await sampleCanvas(page, selector, frames, durationMs);
    const { rafTimes, longTasks, drawCalls } = await page.evaluate((sel) => ({
      rafTimes: [...window.__dfTrace.rafTimes], longTasks: window.__dfTrace.longTasks, drawCalls: document.querySelector(sel).__dfDraws || 0,
    }), selector);
    const deltas = rafTimes.slice(1).map((t, i) => t - rafTimes[i]).sort((a, b) => a - b);
    records.push({
      selector,
      context,
      requested,
      renderer: await rendererOf(page, selector, context),
      animating: sample.changedShare > CHANGED_SHARE_MIN,
      blank: sample.blank,
      changedShare: sample.changedShare,
      rafPerSec: round1(rafTimes.length / sample.elapsedSec),
      frameMs: { p50: round1(quantile(deltas, 0.5)), p95: round1(quantile(deltas, 0.95)) },
      longTasks,
      drawCalls,
      drawCallsOffscreen: await countOffscreenDraws(page, selector),
      reducedMotionAnimating: null,
      fallbackVisible: null,
      fallbackErrors: [],
    });
  }

  const weight = await pageWeight(page);

  const browser = page.context().browser();
  if (variants && records.length && browser && url && !url.startsWith('about:')) {
    const selectors = records.map((r) => r.selector);
    const reduced = await reducedMotionRun(browser, url, viewport, selectors, Math.min(settleMs, 1500));
    for (const r of records) r.reducedMotionAnimating = reduced.get(r.selector);
    const webglOnes = records.filter((r) => r.requested === 'webgl' || r.requested === 'webgl2');
    if (webglOnes.length) {
      const bare = await noWebglRun(url, viewport, webglOnes.map((r) => r.selector), Math.min(settleMs, 1500));
      for (const r of webglOnes) {
        const got = bare.get(r.selector);
        r.fallbackVisible = got.visible;
        r.fallbackErrors = got.errors;
      }
    }
  }
  return { canvases: records, ...weight };
}
