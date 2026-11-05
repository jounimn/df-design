// The motion capture: a video of the page driven by real input, from the first screen to the true end, and the
// contact sheets that let a reader see the whole run in order. Stills taken with window.scrollTo miss what moves:
// on a page whose scrolling a library owns (Lenis, a virtual scroller, a canvas scene) scrollTo does nothing and
// every still shows the first screen, and a still never shows choreography, a transition or its timing.
//
// It records a Playwright context, passes any gate with the clicks given, then turns the wheel in small steps,
// falling back to PageDown and Space when the wheel changes nothing. It stops when the page truly ends: the scroll
// position, a downscaled picture of the viewport and the canvas pixels all unchanged for several steps in a row,
// or a safety cap on the steps, which is reported. Where the picture settles it pauses and keeps a still.
// The sheets come from the video through ffmpeg when one is found (FFMPEG, imageio_ffmpeg in a Python on PATH,
// or ffmpeg on PATH); without one the browser decodes the video itself, and if that fails the sheets are built
// from the stills. Nothing here is a hard dependency.
// Used by scripts/capture-motion.mjs, probe.mjs (--motion), check-auditions.mjs and check-slop --render.
import fs from 'node:fs';
import zlib from 'node:zlib';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { newPage, settle } from './browser.mjs';

export const MOTION_DEFAULTS = {
  size: { width: 1440, height: 900 },
  clicks: [],
  maxSteps: 300,
  stepPx: 120,
  interval: 70,
  pause: 1200,
  endSteps: 6,
  perSheet: 24,
  maxFrames: 96,
};

// Playwright encodes the video while it records; at full laptop size the encoder falls behind and closing the
// page waits for it. Half size is plenty for sheets whose frames are 480 pixels wide.
const videoSize = ({ width, height }) => { const k = Math.min(1, 800 / width); return { width: Math.round(width * k / 2) * 2, height: Math.round(height * k / 2) * 2 }; };

// One ffmpeg, looked up once per process. Returns { path, via } or null.
let ffmpegCache;
export function findFfmpeg() {
  if (ffmpegCache !== undefined) return ffmpegCache;
  ffmpegCache = null;
  const works = (bin) => {
    try { return spawnSync(bin, ['-hide_banner', '-version'], { timeout: 15000, windowsHide: true }).status === 0; } catch { return false; }
  };
  if (process.env.FFMPEG && works(process.env.FFMPEG)) return (ffmpegCache = { path: process.env.FFMPEG, via: 'FFMPEG' });
  for (const py of ['python', 'python3', 'py']) {
    try {
      const r = spawnSync(py, ['-c', 'import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())'], { encoding: 'utf8', timeout: 20000, windowsHide: true });
      const exe = r.status === 0 ? r.stdout.trim().split(/\r?\n/).pop() : '';
      if (exe && works(exe)) return (ffmpegCache = { path: exe, via: `imageio_ffmpeg (${py})` });
    } catch { /* next */ }
  }
  if (works('ffmpeg')) return (ffmpegCache = { path: 'ffmpeg', via: 'PATH' });
  return ffmpegCache;
}

// Where the page is: the document's scroll, plus every element that scrolls on its own (a virtual scroller's box).
async function position(page) {
  return page.evaluate(() => {
    if (!window.__dfdScrollers || window.__dfdScrollers.stamp !== document.querySelectorAll('*').length) {
      const els = [...document.querySelectorAll('body *')].filter((el) => {
        const cs = getComputedStyle(el);
        return /(auto|scroll)/.test(cs.overflowY + cs.overflowX) && (el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1);
      }).slice(0, 20);
      window.__dfdScrollers = { els, stamp: document.querySelectorAll('*').length };
    }
    const se = document.scrollingElement || document.documentElement;
    return {
      y: Math.round(window.scrollY),
      x: Math.round(window.scrollX),
      max: Math.max(se.scrollHeight - innerHeight, 0),
      inner: window.__dfdScrollers.els.map((el) => `${Math.round(el.scrollTop)},${Math.round(el.scrollLeft)}`).join(';'),
      canvas: [...document.querySelectorAll('canvas')].slice(0, 4).map((c) => {
        try {
          const r = c.getBoundingClientRect();
          if (r.width < 8 || r.height < 8 || r.bottom < 0 || r.top > innerHeight) return '-';
          const o = document.createElement('canvas'); o.width = 12; o.height = 12;
          const g = o.getContext('2d'); g.drawImage(c, 0, 0, 12, 12);
          const d = g.getImageData(0, 0, 12, 12).data;
          let s = ''; for (let i = 0; i < d.length; i += 4) s += ((d[i] >> 5) * 64 + (d[i + 1] >> 5) * 8 + (d[i + 2] >> 5)).toString(36);
          return s;
        } catch { return 'x'; }
      }).join('|'),
    };
  });
}

// Decodes an 8-bit, non-interlaced PNG (what Chromium writes) into { width, height, channels, pixels }.
// Node's zlib is enough; a second page to decode in would compete with the recorded one for frames.
export function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
  let off = 8; let width = 0; let height = 0; let depth = 0; let colour = 0; let interlace = 0; const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off); const type = buf.toString('latin1', off + 4, off + 8); const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') { width = data.readUInt32BE(0); height = data.readUInt32BE(4); depth = data[8]; colour = data[9]; interlace = data[12]; }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[colour];
  if (depth !== 8 || !channels || interlace) throw new Error(`unsupported PNG (depth ${depth}, colour ${colour}, interlace ${interlace})`);
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels; const pixels = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)]; const src = y * (stride + 1) + 1; const dst = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? pixels[dst + x - channels] : 0; const b = y ? pixels[dst - stride + x] : 0; const c = x >= channels && y ? pixels[dst - stride + x - channels] : 0;
      let v = raw[src + x];
      if (filter === 1) v += a; else if (filter === 2) v += b; else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) { const p = a + b - c; const pa = Math.abs(p - a); const pb = Math.abs(p - b); const pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      pixels[dst + x] = v & 255;
    }
  }
  return { width, height, channels, pixels };
}

// A picture of the viewport shrunk to 32 x 20 cells (each the mean of its pixels) and quantised, so the same
// scene gives the same string. A plain CDP screenshot is used because it is fast and leaves the recording alone:
// a scaled clip changes the device metrics for a moment and Playwright's video records those frames grey.
async function fingerprint(page, fp) {
  let buf = null;
  if (fp.cdp) {
    try {
      const { data } = await fp.cdp.send('Page.captureScreenshot', { format: 'png', optimizeForSpeed: true });
      buf = Buffer.from(data, 'base64');
    } catch { fp.cdp = null; }
  }
  if (!buf) buf = await page.screenshot({ type: 'png' });
  const { width, height, channels, pixels } = decodePng(buf);
  let s = '';
  const g = channels >= 3 ? 1 : 0;
  const b = channels >= 3 ? 2 : 0;
  for (let cy = 0; cy < 20; cy++) {
    const y0 = Math.floor((cy * height) / 20); const y1 = Math.max(y0 + 1, Math.floor(((cy + 1) * height) / 20));
    for (let cx = 0; cx < 32; cx++) {
      const x0 = Math.floor((cx * width) / 32); const x1 = Math.max(x0 + 1, Math.floor(((cx + 1) * width) / 32));
      let sr = 0; let sg = 0; let sb = 0; let n = 0;
      for (let y = y0; y < y1; y += 2) {
        for (let x = x0; x < x1; x += 2) {
          const i = (y * width + x) * channels;
          sr += pixels[i]; sg += pixels[i + g]; sb += pixels[i + b]; n += 1;
        }
      }
      s += (((sr / n) >> 4) * 256 + ((sg / n) >> 4) * 16 + ((sb / n) >> 4)).toString(36).padStart(3, '0');
    }
  }
  return s;
}

async function state(page, fp) {
  const pos = await position(page);
  return { ...pos, picture: await fingerprint(page, fp), key: `${pos.y},${pos.x}|${pos.inner}` };
}

// The frames of a sheet, captioned, rendered as one image per `perSheet` frames.
async function renderSheets(browser, frames, out, { perSheet, columns }) {
  const sheets = [];
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  try {
    const page = await ctx.newPage();
    for (let i = 0; i < frames.length; i += perSheet) {
      const cells = frames.slice(i, i + perSheet).map((f) => `<figure><img src="data:${f.type};base64,${f.buffer.toString('base64')}"><figcaption>${f.label}</figcaption></figure>`).join('');
      await page.setContent(`<!doctype html><meta charset="utf-8"><style>
        body{margin:0;background:#111;color:#bbb;font:12px ui-monospace,monospace}
        .g{display:grid;grid-template-columns:repeat(${columns},1fr);gap:6px;padding:6px}
        figure{margin:0}img{width:100%;display:block;border:1px solid #333}figcaption{padding:2px 0}
      </style><div class="g">${cells}</div>`, { waitUntil: 'load' });
      const file = path.join(out, `sheet-${String(sheets.length + 1).padStart(2, '0')}.png`);
      await page.screenshot({ path: file, fullPage: true });
      sheets.push(path.basename(file));
    }
  } finally {
    await ctx.close();
  }
  return sheets;
}

const sampleTimes = (seconds, maxFrames) => {
  const n = Math.max(6, Math.min(maxFrames, Math.ceil(seconds / 0.5)));
  return Array.from({ length: n }, (_, i) => Math.min(seconds - 0.05, (seconds * (i + 0.5)) / n)).map((t) => Math.max(0, t));
};

function framesWithFfmpeg(ffmpeg, video, seconds, maxFrames, tmp) {
  fs.mkdirSync(tmp, { recursive: true });
  const times = sampleTimes(seconds, maxFrames);
  const fps = times.length / seconds;
  const r = spawnSync(ffmpeg.path, ['-hide_banner', '-loglevel', 'error', '-y', '-i', video, '-vf', `fps=${fps.toFixed(4)},scale=480:-2`, path.join(tmp, 'f-%04d.png')], { timeout: 180000, windowsHide: true });
  if (r.status !== 0) throw new Error(`ffmpeg exited ${r.status}: ${String(r.stderr || '').slice(0, 200)}`);
  return fs.readdirSync(tmp).filter((f) => f.endsWith('.png')).sort().map((f, i) => ({
    buffer: fs.readFileSync(path.join(tmp, f)), type: 'image/png', label: `${(i / fps).toFixed(1)}s`,
  }));
}

// No ffmpeg: Chromium plays the WebM it recorded. The sheet is laid out in the page that plays it, each sampled
// moment drawn into its own captioned canvas, and screenshotted once per sheet. (The file: page cannot read the
// pixels back, a tainted canvas still paints.)
async function sheetsInBrowser(browser, video, seconds, out, { maxFrames, perSheet, columns }) {
  const times = sampleTimes(seconds, maxFrames);
  const html = path.join(path.dirname(video), '.frames.html');
  fs.writeFileSync(html, `<!doctype html><meta charset="utf-8"><style>
    body{margin:0;background:#111;color:#bbb;font:12px ui-monospace,monospace}
    .g{display:grid;grid-template-columns:repeat(${columns},1fr);gap:6px;padding:6px}
    figure{margin:0}canvas{width:100%;display:block;border:1px solid #333}figcaption{padding:2px 0}
  </style><video id="v" muted preload="auto" style="display:none" src="${path.basename(video)}"></video><div class="g" id="g"></div>`);
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
  const sheets = [];
  try {
    const page = await ctx.newPage();
    await page.goto(pathToFileURL(html).href, { waitUntil: 'load' });
    const ok = await page.evaluate(() => new Promise((r) => {
      const v = document.getElementById('v');
      if (v.readyState >= 1) return r(true);
      v.onloadedmetadata = () => r(true); v.onerror = () => r(false); setTimeout(() => r(false), 10000);
    }));
    if (!ok) throw new Error('the browser could not open the recording');
    for (let i = 0; i < times.length; i += perSheet) {
      const drawn = await page.evaluate(async (batch) => {
        const v = document.getElementById('v');
        const g = document.getElementById('g');
        g.textContent = '';
        for (const t of batch) {
          const seeked = await new Promise((r) => {
            const timer = setTimeout(() => r(false), 5000);
            v.onseeked = () => { clearTimeout(timer); r(true); };
            v.currentTime = t;
          });
          if (!seeked) return `the browser could not seek the recording to ${t.toFixed(1)}s`;
          const fig = document.createElement('figure');
          const c = document.createElement('canvas');
          c.width = 480; c.height = Math.round(480 * (v.videoHeight / v.videoWidth || 0.625));
          c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
          const cap = document.createElement('figcaption'); cap.textContent = `${t.toFixed(1)}s`;
          fig.append(c, cap); g.append(fig);
        }
        return true;
      }, times.slice(i, i + perSheet));
      if (drawn !== true) throw new Error(drawn);
      const file = path.join(out, `sheet-${String(sheets.length + 1).padStart(2, '0')}.png`);
      await page.screenshot({ path: file, fullPage: true });
      sheets.push(path.basename(file));
    }
    return sheets;
  } catch (e) {
    for (const s of sheets) fs.rmSync(path.join(out, s), { force: true });
    throw e;
  } finally {
    await ctx.close();
    fs.rmSync(html, { force: true });
  }
}

/**
 * Records `url` driven by real input and writes, into `out`:
 *   video.webm, sheet-01.png…, stills/still-NN.png and capture.json.
 * Returns the capture record (the content of capture.json, with `dir` added).
 */
export async function captureMotion(browser, url, options = {}) {
  const o = { ...MOTION_DEFAULTS, ...options };
  const out = path.resolve(o.out || path.join('captures', 'motion'));
  const stillsDir = path.join(out, 'stills');
  const videoTmp = path.join(out, '.video');
  fs.mkdirSync(stillsDir, { recursive: true });
  for (const f of fs.readdirSync(out)) if (/^sheet-\d+\.png$/.test(f)) fs.rmSync(path.join(out, f), { force: true });
  for (const f of fs.readdirSync(stillsDir)) fs.rmSync(path.join(stillsDir, f), { force: true });

  const t0 = Date.now();
  const { page, context } = await newPage(browser, { reducedMotion: 'no-preference', viewport: o.size, recordVideoDir: videoTmp, recordVideoSize: videoSize(o.size) });
  const fp = { cdp: await context.newCDPSession(page).catch(() => null) };
  const record = {
    url, size: o.size, capturedAt: new Date().toISOString(),
    settings: { maxSteps: o.maxSteps, stepPx: o.stepPx, interval: o.interval, pause: o.pause, endSteps: o.endSteps },
    clicks: [], steps: 0, inputs: { wheel: 0, keys: 0 }, movedBy: 'none', nativeScroll: false,
    reachedEnd: false, endReason: null, maxStepsHit: false, stills: [], sheets: [], sheetsFrom: null, ffmpeg: null,
    video: null, durations: {}, errors: [],
  };
  let videoPath = null;

  try {
    const res = await page.goto(url, { waitUntil: 'load', timeout: 45000 }).catch((e) => ({ failed: e.message }));
    if (res && res.failed) throw new Error(res.failed);
    await settle(page, { quiet: 800 });
    record.durations.loadMs = Date.now() - t0;

    for (const sel of o.clicks) {
      try { await page.click(sel, { timeout: 5000 }); await page.waitForTimeout(800); record.clicks.push({ selector: sel, ok: true }); }
      catch (e) { record.clicks.push({ selector: sel, ok: false, error: String(e.message || e).split('\n')[0] }); }
    }

    const driveStart = Date.now();
    await page.mouse.move(Math.round(o.size.width / 2), Math.round(o.size.height / 2));

    const keepStill = async (step, s) => {
      const file = `still-${String(record.stills.length + 1).padStart(2, '0')}.png`;
      await page.screenshot({ path: path.join(stillsDir, file) });
      record.stills.push({ file: `stills/${file}`, step, scrollY: s.y, atMs: Date.now() - driveStart });
    };
    // Wait, at most `pause`, until two pictures in a row agree.
    const settleHere = async () => {
      const until = Date.now() + o.pause;
      let last = await fingerprint(page, fp);
      await page.waitForTimeout(150);
      while (Date.now() < until) {
        const now = await fingerprint(page, fp);
        if (now === last) break;
        last = now;
        await page.waitForTimeout(150);
      }
      return state(page, fp);
    };

    let prev = await settleHere();
    await keepStill(0, prev);
    const startY = prev.y;
    let mode = 'wheel';
    let unchanged = 0;
    let travelled = 0;
    const travelPerStill = Math.round(o.size.height * 0.9);
    const changed = (a, b) => a.key !== b.key || a.picture !== b.picture || a.canvas !== b.canvas;

    const inputs = {
      wheel: async () => { await page.mouse.wheel(0, o.stepPx); return o.stepPx; },
      PageDown: async () => { await page.keyboard.press('PageDown'); return o.size.height; },
      Space: async () => { await page.keyboard.press('Space'); return o.size.height; },
    };

    while (record.steps < o.maxSteps) {
      record.steps += 1;
      const order = mode === 'wheel' ? ['wheel', 'PageDown', 'Space'] : ['PageDown', 'Space', 'wheel'];
      let moved = null;
      let next = prev;
      for (const how of order) {
        const dist = await inputs[how]();
        await page.waitForTimeout(o.interval);
        next = await state(page, fp);
        if (changed(prev, next)) { moved = { how, dist }; break; }
      }
      if (next.y !== startY) record.nativeScroll = true;

      if (moved) {
        if (moved.how === 'wheel') record.inputs.wheel += 1; else record.inputs.keys += 1;
        mode = moved.how === 'wheel' ? 'wheel' : 'keys';
        travelled += moved.dist;
        // The document scrolls and sits at its bottom, and only the picture changes: an ambient loop, not progress.
        const atBottom = record.nativeScroll && next.max > 0 && next.y >= next.max - 1 && next.key === prev.key;
        unchanged = atBottom ? unchanged + 1 : 0;
        if (!atBottom && travelled >= travelPerStill) {
          travelled = 0;
          next = await settleHere();
          await keepStill(record.steps, next);
        }
      } else {
        unchanged += 1;
      }
      prev = next;
      if (unchanged >= o.endSteps) {
        // Inertia may still be carrying the page: give it a pause and look once more before calling the end.
        const after = await settleHere();
        if (changed(prev, after) && !(record.nativeScroll && after.key === prev.key)) { prev = after; unchanged = 0; continue; }
        record.reachedEnd = true;
        record.endReason = record.inputs.wheel + record.inputs.keys === 0
          ? 'nothing moved: wheel, PageDown and Space changed neither the scroll position nor the picture'
          : `scroll position, picture and canvas pixels unchanged for ${o.endSteps} steps`;
        break;
      }
    }
    if (!record.reachedEnd) {
      record.maxStepsHit = true;
      record.endReason = `stopped at the safety cap of ${o.maxSteps} steps before the page ended`;
    }
    const end = await settleHere();
    await keepStill(record.steps, end);
    record.movedBy = record.inputs.wheel && record.inputs.keys ? 'both' : record.inputs.wheel ? 'wheel' : record.inputs.keys ? 'keys' : 'none';
    record.durations.driveMs = Date.now() - driveStart;
  } catch (e) {
    record.errors.push(String(e.message || e).split('\n')[0]);
  } finally {
    const video = page.video();
    record.durations.videoSeconds = Math.round((Date.now() - t0) / 100) / 10;
    await context.close().catch(() => {});
    if (video) {
      try { videoPath = path.join(out, 'video.webm'); await video.saveAs(videoPath); record.video = 'video.webm'; }
      catch (e) { videoPath = null; record.errors.push(`video: ${String(e.message || e).split('\n')[0]}`); }
    }
    fs.rmSync(videoTmp, { recursive: true, force: true });
  }

  // The sheets: from the video when anything can read it, else from the stills.
  record.durations.saveMs = Date.now() - t0 - Math.round(record.durations.videoSeconds * 1000);
  const sheetsStart = Date.now();
  const seconds = Math.max(record.durations.videoSeconds, 1);
  const layout = { maxFrames: o.maxFrames, perSheet: o.perSheet, columns: 6 };
  if (videoPath && o.ffmpeg !== false) {
    const ff = findFfmpeg();
    if (ff) {
      try {
        const frames = framesWithFfmpeg(ff, videoPath, seconds, o.maxFrames, path.join(out, '.frames'));
        if (frames.length) { record.sheets = await renderSheets(browser, frames, out, layout); record.sheetsFrom = 'video (ffmpeg)'; record.ffmpeg = ff.via; }
      } catch (e) { record.errors.push(`ffmpeg: ${e.message}`); }
      fs.rmSync(path.join(out, '.frames'), { recursive: true, force: true });
    }
  }
  if (!record.sheets.length && videoPath && o.browserDecode !== false) {
    try { record.sheets = await sheetsInBrowser(browser, videoPath, seconds, out, layout); record.sheetsFrom = 'video (browser)'; }
    catch (e) { record.errors.push(`browser decode: ${e.message}`); }
  }
  if (!record.sheets.length && record.stills.length) {
    const frames = record.stills.map((s) => ({ buffer: fs.readFileSync(path.join(out, s.file)), type: 'image/png', label: `step ${s.step} · y ${s.scrollY}` }));
    record.sheets = await renderSheets(browser, frames, out, { perSheet: 12, columns: 4 });
    record.sheetsFrom = 'stills';
  }
  record.durations.sheetsMs = Date.now() - sheetsStart;
  record.durations.totalMs = Date.now() - t0;

  fs.writeFileSync(path.join(out, 'capture.json'), JSON.stringify(record, null, 2));
  return { ...record, dir: out };
}

// What makes a page one whose look a full-page still cannot show, named so the reason travels with the capture.
// check-slop --render captures on any of them; probe.mjs on 'virtual scroll' (the document does not scroll at all).
export async function movingSignals(page) {
  return page.evaluate(() => {
    const why = [];
    const big = (el) => { const r = el.getBoundingClientRect(); return r.width * r.height >= 0.1 * innerWidth * innerHeight; };
    if ([...document.querySelectorAll('canvas')].some(big)) why.push('canvas');
    const pinned = document.querySelector('.pin-spacer') || [...document.querySelectorAll('body *')].find((el) => {
      if (getComputedStyle(el).position !== 'sticky' || !el.parentElement) return false;
      const h = el.getBoundingClientRect().height;
      return h >= innerHeight * 0.5 && el.parentElement.getBoundingClientRect().height - h >= innerHeight * 0.5;
    });
    if (pinned) why.push('pinned section');
    const scrollTimeline = document.getAnimations().some((a) => a.timeline && a.timeline !== document.timeline)
      || [...document.querySelectorAll('body *')].some((el) => { const t = getComputedStyle(el).animationTimeline; return t && t !== 'auto' && t !== 'none'; });
    if (scrollTimeline) why.push('scroll-driven animation');
    const se = document.scrollingElement || document.documentElement;
    if (se.scrollHeight <= innerHeight + 1 && [...document.querySelectorAll('body *')].some((el) => /fixed|absolute/.test(getComputedStyle(el).position) && el.getBoundingClientRect().height > innerHeight * 1.5)) why.push('virtual scroll');
    return why;
  }).catch(() => []);
}

