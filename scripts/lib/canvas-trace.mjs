// Measures every visible <canvas> on a page: is it alive, blank, how fast, which context, whether it pauses
// off-screen, honours reduced motion and survives without WebGL, and what motion JS it costs.
// Pixels come from screenshots (the compositor), never readPixels, so a WebGL canvas created with
// preserveDrawingBuffer:false is not misread as blank.
//
// Known limits: canvases inside iframes are not listed; DOM overlays above a canvas are part of what its area shows.
import { launchBrowser, settle } from './browser.mjs';

export const VARIANT_SETTLE_MS = 1800;
const CHANGED_SHARE_MIN = 0.0005;
const CHANNEL_DELTA_MIN = 2;
const OFFSCREEN_GRACE_MS = 400;
const OFFSCREEN_COUNT_MS = 1000;
const RAF_WINDOW_MS = 800;

export const LIBRARY_PATTERNS = {
  three: /(^|[/@.-])three(\.module)?(\.min)?\.js|\/three@|three\/build\//i,
  ogl: /(^|[/@])ogl([@/.]|$)/i,
  pixi: /pixi(\.min)?\.js|\/pixi\.js|pixi@/i,
  regl: /(^|[/@.-])regl(\.min)?\.js|\/regl@/i,
  babylon: /babylon(\.min)?\.js|babylonjs/i,
  p5: /(^|[/@.-])p5(\.min)?\.js|\/p5@/i,
  gsap: /gsap(\.min)?\.js|\/gsap@|gsap\/dist/i,
  lottie: /lottie|bodymovin/i,
  // A word boundary before "rive": drive.js and derive.js are not Rive.
  rive: /(^|[/@._-])rive(-canvas)?(\.min)?\.js|@rive-app/i,
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
      // A probe running through page.evaluate (the static pass asks every canvas for webgl2) must not create a
      // context the page has not asked for: that would claim the canvas and break the page's own getContext('2d').
      if (/UtilityScript/.test(String(new Error().stack))) return this.__dfType === type ? nativeGet.call(this, type, ...rest) : null;
      const ctx = nativeGet.call(this, type, ...rest);
      const kind = type === 'experimental-webgl' ? 'webgl' : type;
      if (!this.__dfRequested) this.__dfRequested = kind;
      if (ctx && !this.__dfType) this.__dfType = kind;
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

// Lists the canvases a visitor could see (open shadow roots included) and keeps the elements in
// window.__dfCanvases, so later steps address them by id instead of by a selector that cannot cross a shadow root.
// The selector is for the record and for Playwright, whose CSS engine does pierce open shadow roots.
async function listCanvases(page) {
  return page.evaluate(() => {
    const esc = (s) => CSS.escape(s);
    const parentOf = (n) => n.parentElement ?? (n.parentNode instanceof ShadowRoot ? n.parentNode.host : null);
    const selectorFor = (el) => {
      const root = el.getRootNode();
      if (el.id && root.querySelectorAll(`#${esc(el.id)}`).length === 1 && root === document) return `${el.localName}#${esc(el.id)}`;
      const parts = [];
      for (let n = el; n && n.nodeType === 1 && n !== document.documentElement; n = parentOf(n)) {
        if (n.id && n.getRootNode().querySelectorAll(`#${esc(n.id)}`).length === 1) { parts.unshift(`${n.localName}#${esc(n.id)}`); break; }
        const siblings = n.parentElement ? [...n.parentElement.children] : n.parentNode ? [...n.parentNode.children] : [n];
        const same = siblings.filter((s) => s.localName === n.localName);
        parts.unshift(same.length > 1 ? `${n.localName}:nth-of-type(${same.indexOf(n) + 1})` : n.localName);
      }
      // Descendant combinators, not ">": across a shadow boundary the host is not the canvas's parent.
      return parts.join(' ');
    };
    const all = [];
    const walk = (root) => {
      for (const el of root.querySelectorAll('*')) {
        if (el.localName === 'canvas') all.push(el);
        if (el.shadowRoot) walk(el.shadowRoot);
      }
    };
    walk(document);
    const invisible = (el) => {
      if (el.closest('[inert]')) return true;
      for (let n = el; n; n = parentOf(n)) if (getComputedStyle(n).opacity === '0') return true;
      return !el.checkVisibility({ checkVisibilityCSS: true });
    };
    window.__dfCanvases = [];
    const out = [];
    all.forEach((el, domIndex) => {
      const r = el.getBoundingClientRect();
      if (r.width < 1 || r.height < 1 || invisible(el)) return;
      window.__dfCanvases.push(el);
      out.push({
        id: window.__dfCanvases.length - 1,
        selector: selectorFor(el),
        domIndex,
        topPx: Math.round(r.top + window.scrollY),
        context: el.__dfType === 'webgl2' || el.__dfType === 'webgl' || el.__dfType === '2d' ? el.__dfType : 'none',
        requested: el.__dfRequested ?? null,
        area: r.width * r.height,
        box: { left: r.left + window.scrollX, top: r.top + window.scrollY, width: r.width, height: r.height },
      });
    });
    return out;
  });
}

async function rendererOf(page, id, context) {
  if (context !== 'webgl' && context !== 'webgl2') return null;
  return page.evaluate(({ id, context }) => {
    const gl = window.__dfCanvases[id]?.getContext(context);
    const ext = gl?.getExtension('WEBGL_debug_renderer_info');
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : null;
  }, { id, context });
}

// Decodes PNG buffers on a throwaway page of the same context and reports, for consecutive frames, the largest
// share of pixels whose channels differ by more than CHANNEL_DELTA_MIN; and whether every frame is one colour.
// Frames of different sizes are compared on their common top-left area and flagged `resized`: a canvas whose
// box changes size is being laid out, not (necessarily) animating.
async function compareFrames(page, buffers) {
  const scratch = await page.context().newPage();
  try {
    return await scratch.evaluate(async ({ uris, minDelta }) => {
      const load = async (src) => {
        const img = new Image(); img.src = src; await img.decode();
        const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
        const g = c.getContext('2d'); g.drawImage(img, 0, 0);
        return { w: img.width, h: img.height, d: g.getImageData(0, 0, img.width, img.height).data };
      };
      const frames = [];
      for (const u of uris) frames.push(await load(u));
      let maxShare = 0;
      let resized = false;
      for (let i = 1; i < frames.length; i += 1) {
        const a = frames[i - 1]; const b = frames[i];
        const w = Math.min(a.w, b.w); const h = Math.min(a.h, b.h);
        if (a.w !== b.w || a.h !== b.h) resized = true;
        let changed = 0;
        for (let y = 0; y < h; y += 1) {
          for (let x = 0; x < w; x += 1) {
            const p = (y * a.w + x) * 4; const q = (y * b.w + x) * 4;
            if (Math.abs(a.d[p] - b.d[q]) > minDelta || Math.abs(a.d[p + 1] - b.d[q + 1]) > minDelta || Math.abs(a.d[p + 2] - b.d[q + 2]) > minDelta) changed += 1;
          }
        }
        maxShare = Math.max(maxShare, changed / (w * h));
      }
      const oneColour = frames.length > 0 && frames.every(({ d }) => {
        for (let k = 4; k < d.length; k += 4) if (d[k] !== d[0] || d[k + 1] !== d[1] || d[k + 2] !== d[2]) return false;
        return true;
      });
      return { changedShare: maxShare, blank: oneColour, resized };
    }, { uris: buffers.map((b) => `data:image/png;base64,${b.toString('base64')}`), minDelta: CHANNEL_DELTA_MIN });
  } finally {
    await scratch.close();
  }
}

const quantile = (sorted, q) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))] : 0);
const round1 = (n) => Math.round(n * 10) / 10;

// Samples many canvases in as few windows as the page allows. A canvas that pauses outside the viewport can only
// be judged while it is inside it, so canvases are not all measured "at once" wherever they are: they are grouped by
// what fits in the viewport together. From the topmost unmeasured canvas the page is scrolled to it, and every
// unmeasured canvas that then lies fully inside the viewport joins the same window of screenshots. A canvas larger
// than the viewport gets a window of its own (element screenshot). Each window ends with a quiet stretch, with no
// screenshots in it, from which rAF timing and long tasks are read (screenshots stall the frames they measure).
// items: [{ id, selector, box }]. Returns Map(id -> sample).
async function sampleAll(page, items, frames, durationMs, { timing = true } = {}) {
  const result = new Map();
  const bySel = new Map(items.map((i) => [i.id, i]));
  let pending = [...items].sort((a, b) => a.box.top - b.box.top).map((i) => i.id);
  const viewport = page.viewportSize() ?? { width: 1440, height: 900 };

  while (pending.length) {
    await page.evaluate((id) => window.__dfCanvases[id].scrollIntoView({ block: 'start', inline: 'nearest' }), pending[0]);
    await page.waitForTimeout(120);
    const boxes = await page.evaluate((ids) => ids.map((id) => {
      const r = window.__dfCanvases[id].getBoundingClientRect();
      return { id, x: r.left, y: r.top, right: r.right, bottom: r.bottom };
    }), pending);
    const fits = (b) => b.x >= 0 && b.y >= 0 && b.right <= viewport.width && b.bottom <= viewport.height;
    const solo = !fits(boxes[0]);
    const group = solo ? [boxes[0]] : boxes.filter(fits);
    const ids = group.map((b) => b.id);

    await page.evaluate((list) => { for (const id of list) window.__dfCanvases[id].__dfDraws = 0; }, ids);
    const shots = new Map(ids.map((id) => [id, []]));
    const unstable = new Set();
    const started = Date.now();
    for (let i = 0; i < frames; i += 1) {
      // The box is read again for every frame, so a canvas that changes size (or moves) is seen doing so.
      const now = solo ? group : await page.evaluate((list) => list.map((id) => {
        const r = window.__dfCanvases[id].getBoundingClientRect();
        return { id, x: r.left, y: r.top, right: r.right, bottom: r.bottom };
      }), ids);
      for (const b of now) {
        // Whole CSS pixels strictly inside the canvas: a fractional clip is floored by Chromium and would pull
        // in the neighbouring page, which breaks the single-colour test.
        const x = Math.max(0, Math.ceil(b.x));
        const y = Math.max(0, Math.ceil(b.y));
        const width = Math.min(viewport.width, Math.floor(b.right)) - x;
        const height = Math.min(viewport.height, Math.floor(b.bottom)) - y;
        if (!solo && (width < 1 || height < 1)) continue;
        const buffer = solo
          ? await page.locator(bySel.get(b.id).selector).first().screenshot()
          : await page.screenshot({ clip: { x, y, width, height } });
        // A box that moved or resized while the screenshot was taken makes a frame that is part canvas, part page:
        // drop it and say so, rather than read the page behind the canvas as animation.
        const after = solo ? b : await page.evaluate((id) => {
          const r = window.__dfCanvases[id].getBoundingClientRect();
          return { x: r.left, y: r.top, right: r.right, bottom: r.bottom };
        }, b.id);
        if (Math.abs(after.x - b.x) > 0.5 || Math.abs(after.y - b.y) > 0.5 || Math.abs(after.right - b.right) > 0.5 || Math.abs(after.bottom - b.bottom) > 0.5) {
          unstable.add(b.id);
          continue;
        }
        shots.get(b.id).push(buffer);
      }
      const wait = (durationMs / frames) * (i + 1) - (Date.now() - started);
      if (wait > 0) await page.waitForTimeout(wait);
    }
    const draws = await page.evaluate((list) => Object.fromEntries(list.map((id) => [id, window.__dfCanvases[id].__dfDraws || 0])), ids);

    let rafPerSec = 0;
    let frameMs = { p50: 0, p95: 0 };
    let longTasks = 0;
    if (timing) {
      await page.evaluate(() => { window.__dfTrace.rafTimes.length = 0; window.__dfTrace.longTasks = 0; });
      await page.waitForTimeout(RAF_WINDOW_MS);
      const quiet = await page.evaluate(() => ({ rafTimes: [...window.__dfTrace.rafTimes], longTasks: window.__dfTrace.longTasks }));
      // Every rAF callback of one frame receives the same timestamp: only distinct ones are frames.
      const stamps = [...new Set(quiet.rafTimes)].sort((a, b) => a - b);
      const deltas = stamps.slice(1).map((t, i) => t - stamps[i]).sort((a, b) => a - b);
      rafPerSec = stamps.length > 1 ? round1((stamps.length - 1) / ((stamps[stamps.length - 1] - stamps[0]) / 1000)) : 0;
      frameMs = { p50: round1(quantile(deltas, 0.5)), p95: round1(quantile(deltas, 0.95)) };
      longTasks = quiet.longTasks;
    }
    for (const id of ids) {
      const compared = await compareFrames(page, shots.get(id));
      result.set(id, { ...compared, resized: compared.resized || unstable.has(id), drawCalls: draws[id], rafPerSec, frameMs, longTasks });
    }
    pending = pending.filter((id) => !ids.includes(id));
  }
  return result;
}

// Off-screen is measured by scrolling the page until the canvas leaves the viewport, the way a visitor would move
// it out. Every canvas that is out of view at the same scroll position is counted in one window. A canvas that
// cannot leave the viewport at any scroll position (position:fixed, a page shorter than the viewport) gets null.
// Returns Map(id -> draw calls made while out of view | null).
async function offscreenCounts(page, ids) {
  const counts = new Map(ids.map((id) => [id, null]));
  const startY = await page.evaluate(() => window.scrollY);
  const outOf = (list) => page.evaluate((l) => l.filter((id) => {
    const r = window.__dfCanvases[id].getBoundingClientRect();
    return r.bottom <= 0 || r.top >= innerHeight || r.right <= 0 || r.left >= innerWidth;
  }), list);
  const countAt = async (y, list) => {
    await page.evaluate((to) => window.scrollTo(0, to), y);
    await page.waitForTimeout(150);
    const out = await outOf(list);
    if (!out.length) return [];
    await page.waitForTimeout(OFFSCREEN_GRACE_MS);
    await page.evaluate((l) => { for (const id of l) window.__dfCanvases[id].__dfOffDraws = 0; window.__dfTrace.counting = true; }, out);
    await page.waitForTimeout(OFFSCREEN_COUNT_MS);
    const got = await page.evaluate((l) => { window.__dfTrace.counting = false; return l.map((id) => [id, window.__dfCanvases[id].__dfOffDraws || 0]); }, out);
    for (const [id, n] of got) counts.set(id, n);
    return out;
  };
  try {
    const maxY = await page.evaluate(() => Math.max(0, document.documentElement.scrollHeight - innerHeight));
    let remaining = [...ids];
    for (const y of [...new Set([0, maxY])]) {
      if (!remaining.length) break;
      const done = await countAt(y, remaining);
      remaining = remaining.filter((id) => !done.includes(id));
    }
    for (const id of remaining) {
      const rect = await page.evaluate((i) => {
        const r = window.__dfCanvases[i].getBoundingClientRect();
        return { top: r.top + window.scrollY, bottom: r.bottom + window.scrollY, vh: innerHeight };
      }, id);
      for (const y of [Math.min(maxY, rect.bottom + 4), Math.max(0, rect.top - rect.vh - 4)]) {
        if ((await countAt(y, [id])).length) break;
      }
    }
  } finally {
    await page.evaluate((y) => { window.__dfTrace.counting = false; window.scrollTo(0, y); }, startY).catch(() => {});
  }
  return counts;
}

// Judges the area a canvas occupied when the element itself is gone or hidden: scroll it into view and ask whether
// one colour fills it.
async function areaIsBlank(page, box) {
  const viewport = page.viewportSize() ?? { width: 1440, height: 900 };
  await page.evaluate((y) => window.scrollTo(0, y), Math.max(0, Math.floor(box.top)));
  const scrollY = await page.evaluate(() => window.scrollY);
  const x = Math.max(0, Math.ceil(box.left));
  const y = Math.max(0, Math.ceil(box.top - scrollY));
  const width = Math.max(1, Math.min(Math.floor(box.width), viewport.width - x));
  const height = Math.max(1, Math.min(Math.floor(box.height), viewport.height - y));
  const buffer = await page.screenshot({ clip: { x, y, width, height } });
  return (await compareFrames(page, [buffer])).blank;
}

async function reducedMotionRun(browser, url, viewport, targets, settleMs) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  try {
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'load' });
    await settle(page, { quiet: settleMs });
    const here = new Map((await listCanvases(page)).map((c) => [c.selector, c]));
    // Hidden or removed under reduce: nothing is moving there (and a screenshot of a hidden element waits 30 s).
    const present = targets.filter((t) => here.has(t.selector)).map((t) => ({ ...here.get(t.selector) }));
    const samples = await sampleAll(page, present, 4, 900, { timing: false });
    return new Map(targets.map((t) => {
      const mine = here.get(t.selector);
      // Not found under reduce (hidden, removed, or renamed): the page's answer is unknown, not "honoured".
      return [t.selector, mine ? samples.get(mine.id).changedShare > CHANGED_SHARE_MIN : null];
    }));
  } finally {
    await context.close();
  }
}

// A browser launched with --disable-webgl: the page must still show something and must not throw.
async function noWebglRun(url, viewport, targets, settleMs) {
  const browser = await launchBrowser({ args: ['--disable-webgl'] });
  try {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e.message ?? e)));
    await page.goto(url, { waitUntil: 'load' });
    await settle(page, { quiet: settleMs });
    const here = new Map((await listCanvases(page)).map((c) => [c.selector, c]));
    const present = targets.filter((t) => here.has(t.selector)).map((t) => ({ ...here.get(t.selector) }));
    const samples = await sampleAll(page, present, 2, 200, { timing: false });
    const out = new Map();
    for (const t of targets) {
      const mine = here.get(t.selector);
      // The page may swap the canvas for its fallback (display:none, replaceWith): then the element is gone but
      // the fallback occupies its area, so the area is what gets judged.
      const blank = mine ? samples.get(mine.id).blank : await areaIsBlank(page, t.box);
      out.set(t.selector, { visible: !blank, errors });
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
    // Only scripts that run: JSON data blocks (ld+json, importmap, speculationrules) are not motion JS.
    inlineBytes: [...document.scripts].filter((s) => !s.src && (!s.type || /javascript|ecmascript|module/i.test(s.type))).map((s) => s.textContent.length),
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

// Every visible canvas is measured, wherever it sits on the page: a hero, a middle section and a footer canvas
// are all in the record. `maxCanvases` exists for tests only; what it leaves out is counted in skippedCanvases.
export async function runCanvasTrace(page, { frames = 8, durationMs = 2000, settleMs = 1800, variants = true, maxCanvases = Infinity } = {}) {
  await settle(page, { quiet: settleMs });
  const url = page.url();
  const viewport = page.viewportSize() ?? { width: 1440, height: 900 };
  const startScroll = await page.evaluate(() => window.scrollY);
  const listed = await listCanvases(page);
  const found = maxCanvases < listed.length
    ? [...listed].sort((a, b) => b.area - a.area).slice(0, maxCanvases).sort((a, b) => a.domIndex - b.domIndex)
    : listed;

  let samples;
  let offscreen;
  try {
    samples = await sampleAll(page, found, frames, durationMs);
    // A canvas that made no draw call in view (an OffscreenCanvas drawn from a worker, say) cannot be judged here.
    const drawing = found.filter((f) => samples.get(f.id).drawCalls > 0).map((f) => f.id);
    offscreen = drawing.length ? await offscreenCounts(page, drawing) : new Map();
  } finally {
    await page.evaluate((y) => window.scrollTo(0, y), startScroll).catch(() => {});
  }

  const records = [];
  for (const f of found) {
    const s = samples.get(f.id);
    records.push({
      selector: f.selector,
      domIndex: f.domIndex,
      topPx: f.topPx,
      context: f.context,
      requested: f.requested,
      renderer: await rendererOf(page, f.id, f.context),
      animating: s.changedShare > CHANGED_SHARE_MIN,
      blank: s.blank,
      resized: s.resized,
      changedShare: s.changedShare,
      rafPerSec: s.rafPerSec,
      frameMs: s.frameMs,
      longTasks: s.longTasks,
      drawCalls: s.drawCalls,
      drawCallsOffscreen: offscreen.get(f.id) ?? null,
      reducedMotionAnimating: null,
      fallbackVisible: null,
      fallbackErrors: [],
    });
  }

  const weight = await pageWeight(page);

  // The variants reload the page from zero, so they wait as long as a first visit needs, whatever the caller's
  // settleMs (probe passes 300 for a page that has already been loaded for a while).
  const variantSettleMs = Math.max(settleMs, VARIANT_SETTLE_MS);
  const browser = page.context().browser();
  if (variants && records.length && browser && url && !url.startsWith('about:')) {
    const targets = found.map((f) => ({ selector: f.selector, box: f.box }));
    const reduced = await reducedMotionRun(browser, url, viewport, targets, variantSettleMs);
    for (const r of records) r.reducedMotionAnimating = reduced.get(r.selector);
    const webglOnes = found.filter((f) => f.requested === 'webgl' || f.requested === 'webgl2').map((f) => ({ selector: f.selector, box: f.box }));
    if (webglOnes.length) {
      const bare = await noWebglRun(url, viewport, webglOnes, variantSettleMs);
      for (const r of records) {
        const got = bare.get(r.selector);
        if (!got) continue;
        r.fallbackVisible = got.visible;
        r.fallbackErrors = got.errors;
      }
    }
  }
  return { canvases: records, skippedCanvases: listed.length - found.length, ...weight };
}
