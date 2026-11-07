// df-design scroll story kit. The parts of a drawn scroll story (recipes-motion.md §17-§26) that every build
// rewrites, written once so they pass the Floor by construction. No dependencies; works beside GSAP or Motion.
//
//   dfStory.reduced()                        true under prefers-reduced-motion: reduce (or window.__DF_EXPORT__)
//   dfStory.progress(section, {onUpdate})    writes --p (0..1, the section's progress through its scroll span) on
//                                            the section; CSS reads it, so everything bound to it is reversible.
//                                            Reduced motion: --p is 1 (the resting state) and never changes.
//   dfStory.parallax(stage, {strength, lambda, drift})
//                                            every [data-depth] child is its own layer: the pointer moves it by
//                                            depth x strength px, damped (frame-rate independent), and a small
//                                            ambient drift keeps it alive. Runs only on screen and in a visible tab.
//                                            Reduced motion: nothing moves and no loop runs.
//   dfStory.hold(button, {duration, tap, decay, onProgress, onDone})
//                                            a beat the visitor performs: pointer or Space/Enter held for
//                                            `duration` ms completes it; a tap advances it by `tap`; releasing
//                                            lets it fall back. hold.complete() is for scrolling past it.
//                                            Reduced motion: one press completes it.
//   dfStory.flipbook(el, {frames, cols, fps, poster})
//                                            a drawn effect (water, smoke, sparks) played frame by frame from a
//                                            sprite sheet set as the element's background, on twos by default.
//                                            Reduced motion: the poster frame, still.
//   dfStory.hatchField(w, h, {seed, stroke}) a vertical hatching field (0..1 per pixel), the texture of an ink cut
//   dfStory.ink(canvas, {field, color, planes, lag, scale})
//                                            the ink-out: ink rises through the field from the bottom in `planes`
//                                            depth planes, each lagging and offset, so the cut carries depth.
//                                            ink.draw(p, px, py) with p 0..1 (and the pointer, -1..1, for depth).
//                                            Reduced motion: p snaps to 0 or 1 (an instant cut, never a slow one).
//   dfStory.preload(items, {onProgress, upload, compile})
//                                            fetch and decode every image, hand each to `upload` (GPU), then await
//                                            `compile` (shaders), with one honest progress figure over all three.
//                                            Resolves {images, failed}; progress reaches 1 only when compile is done.
//
//   Every controller returns stop(); each writes its state on the element (data-df-*) for tests and reviews.
(() => {
  'use strict';

  const media = (q) => (typeof matchMedia === 'function' ? matchMedia(q) : { matches: false, addEventListener() {} });
  const reducedQuery = media('(prefers-reduced-motion: reduce)');
  const reduced = () => reducedQuery.matches || window.__DF_EXPORT__ === true;
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);

  // Runs `tick(dt)` on rAF only while the element is on screen and the tab is visible; `state(s)` reports it.
  function visibleLoop(el, tick, state) {
    let inView = typeof IntersectionObserver === 'undefined';
    let frame = 0, last = 0, stopped = false;
    const run = (t) => {
      const dt = last ? Math.min(0.1, (t - last) / 1000) : 1 / 60;
      last = t;
      tick(dt, t);
      frame = requestAnimationFrame(run);
    };
    const sync = () => {
      const go = !stopped && inView && !document.hidden;
      if (go && !frame) { last = 0; frame = requestAnimationFrame(run); state('running'); }
      if (!go && frame) { cancelAnimationFrame(frame); frame = 0; state(stopped ? 'stopped' : 'paused'); }
      if (!go && !frame && !stopped) state('paused');
    };
    const io = typeof IntersectionObserver === 'undefined' ? null
      : new IntersectionObserver((es) => { inView = es[es.length - 1].isIntersecting; sync(); });
    io?.observe(el);
    document.addEventListener('visibilitychange', sync);
    sync();
    return () => { stopped = true; io?.disconnect(); document.removeEventListener('visibilitychange', sync); sync(); state('stopped'); };
  }

  function progress(section, { onUpdate } = {}) {
    const set = (p) => { section.style.setProperty('--p', p.toFixed(4)); onUpdate?.(p); };
    if (reduced()) { set(1); section.dataset.dfProgress = 'still'; return { stop() {} }; }
    let queued = 0;
    const read = () => {
      queued = 0;
      const r = section.getBoundingClientRect();
      const span = Math.max(1, r.height - innerHeight);
      set(clamp01(-r.top / span));
    };
    const ask = () => { if (!queued) queued = requestAnimationFrame(read); };
    addEventListener('scroll', ask, { passive: true });
    addEventListener('resize', ask);
    read();
    section.dataset.dfProgress = 'live';
    return { stop() { removeEventListener('scroll', ask); removeEventListener('resize', ask); cancelAnimationFrame(queued); } };
  }

  function parallax(stage, { strength = 24, lambda = 6, drift = 0.15 } = {}) {
    const layers = [...stage.querySelectorAll('[data-depth]')].map((el, i) => ({
      el, depth: parseFloat(el.dataset.depth) || 0, phase: i * 2.094, x: 0, y: 0,
    }));
    const state = (s) => { stage.dataset.dfParallax = s; };
    if (reduced()) { layers.forEach((l) => { l.el.style.transform = ''; }); state('still'); return { stop() {} }; }
    let px = 0, py = 0;
    const move = (e) => { px = (e.clientX / innerWidth) * 2 - 1; py = (e.clientY / innerHeight) * 2 - 1; };
    addEventListener('pointermove', move, { passive: true });
    const stopLoop = visibleLoop(stage, (dt, t) => {
      const k = 1 - Math.exp(-lambda * dt); // damping that does not depend on the frame rate
      for (const l of layers) {
        // The ambient drift is a moving hold: a scene never freezes, even when the pointer and the scroll rest.
        const dx = Math.sin(t / 1000 * 0.7 + l.phase) * drift * l.depth * strength;
        const dy = Math.cos(t / 1000 * 0.5 + l.phase) * drift * l.depth * strength * 0.6;
        l.x += (px * l.depth * strength + dx - l.x) * k;
        l.y += (py * l.depth * strength * 0.6 + dy - l.y) * k;
        l.el.style.transform = `translate3d(${l.x.toFixed(2)}px, ${l.y.toFixed(2)}px, 0)`;
      }
    }, state);
    return { stop() { removeEventListener('pointermove', move); stopLoop(); } };
  }

  function hold(button, { duration = 1400, tap = 0.15, decay = 0.6, onProgress, onDone } = {}) {
    let p = 0, holding = false, done = false, frame = 0, last = 0;
    const write = () => {
      button.style.setProperty('--hold', p.toFixed(3));
      button.setAttribute('aria-valuenow', String(Math.round(p * 100)));
      onProgress?.(p);
    };
    const finish = () => {
      if (done) return;
      done = true; p = 1; holding = false; write();
      button.dataset.dfHold = 'done';
      cancelAnimationFrame(frame); frame = 0;
      onDone?.();
    };
    const tick = (t) => {
      const dt = last ? (t - last) / 1000 : 0;
      last = t;
      p = clamp01(p + (holding ? dt * 1000 / duration : -dt * decay));
      write();
      if (p >= 1) return finish();
      if (holding || p > 0) frame = requestAnimationFrame(tick);
      else { frame = 0; button.dataset.dfHold = 'idle'; }
    };
    const start = () => {
      if (done) return;
      if (reduced()) return finish();
      holding = true; button.dataset.dfHold = 'holding';
      if (!frame) { last = 0; frame = requestAnimationFrame(tick); }
    };
    const end = (advance) => {
      if (done || !holding) return;
      holding = false;
      if (advance) p = clamp01(p + tap);
      if (p >= 1) return finish();
      button.dataset.dfHold = 'falling';
      if (!frame) { last = 0; frame = requestAnimationFrame(tick); }
    };
    let downAt = 0;
    const down = (e) => { if (e.button !== undefined && e.button !== 0) return; downAt = performance.now(); button.setPointerCapture?.(e.pointerId); start(); };
    const up = () => end(performance.now() - downAt < 250); // a short press is a tap: it advances a little
    const key = (e) => {
      if (e.key !== ' ' && e.key !== 'Enter') return;
      e.preventDefault();
      if (e.type === 'keydown' && !e.repeat) { downAt = performance.now(); start(); }
      if (e.type === 'keyup') up();
    };
    button.setAttribute('role', button.getAttribute('role') || 'button');
    button.setAttribute('aria-valuemin', '0');
    button.setAttribute('aria-valuemax', '100');
    button.dataset.dfHold = 'idle';
    button.addEventListener('pointerdown', down);
    button.addEventListener('pointerup', up);
    button.addEventListener('pointercancel', up);
    button.addEventListener('keydown', key);
    button.addEventListener('keyup', key);
    button.addEventListener('contextmenu', (e) => e.preventDefault()); // a long touch must not open the menu
    write();
    return {
      complete: finish,
      get progress() { return p; },
      stop() {
        cancelAnimationFrame(frame);
        for (const [n, f] of [['pointerdown', down], ['pointerup', up], ['pointercancel', up], ['keydown', key], ['keyup', key]]) button.removeEventListener(n, f);
      },
    };
  }

  function flipbook(el, { frames, cols, fps = 12, poster = 0 } = {}) {
    const rows = Math.ceil(frames / cols);
    el.style.backgroundSize = `${cols * 100}% ${rows * 100}%`;
    const show = (i) => {
      const c = i % cols, r = Math.floor(i / cols);
      el.style.backgroundPosition = `${cols > 1 ? (c / (cols - 1)) * 100 : 0}% ${rows > 1 ? (r / (rows - 1)) * 100 : 0}%`;
      el.dataset.dfFrame = String(i);
    };
    const state = (s) => { el.dataset.dfFlipbook = s; };
    show(poster);
    if (reduced()) { state('poster'); return { stop() {} }; }
    let acc = 0, i = poster;
    const stop = visibleLoop(el, (dt) => {
      acc += dt;
      const step = 1 / fps;
      if (acc < step) return;
      i = (i + Math.floor(acc / step)) % frames; // drop frames, never slow down: the loop keeps its time
      acc %= step;
      show(i);
    }, state);
    return { stop };
  }

  // A deterministic hatching field: vertical strokes of varying length and weight, darker in clumps, like the
  // etched ink-out of the reference. Values 0..1; the ink covers a pixel when the field there is under the level.
  function hatchField(w, h, { seed = 7, stroke = 3 } = {}) {
    let s = seed >>> 0 || 1;
    const rnd = () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
    const field = new Float32Array(w * h);
    const cols = Math.ceil(w / stroke);
    const colBias = Array.from({ length: cols }, () => rnd());
    const clumps = Array.from({ length: 6 }, () => ({ x: rnd() * w, y: rnd() * h, r: (0.08 + rnd() * 0.2) * w }));
    for (let x = 0; x < w; x++) {
      const b = colBias[Math.floor(x / stroke)];
      for (let y = 0; y < h; y++) {
        let clump = 0;
        for (const c of clumps) { const d = Math.hypot(x - c.x, (y - c.y) * 0.5) / c.r; if (d < 1) clump = Math.max(clump, 1 - d); }
        const streak = 0.5 + 0.5 * Math.sin(y / h * (4 + b * 9) + b * 6.283); // long vertical strokes
        field[y * w + x] = clamp01(0.55 * b + 0.3 * streak - 0.35 * clump + 0.1 * rnd());
      }
    }
    return { w, h, data: field };
  }

  function ink(canvas, { field, color = '#141019', planes = 3, lag = 0.12, scale = 0.5, maxWidth = 960 } = {}) {
    const ctx = canvas.getContext('2d');
    const rgb = (() => { const m = color.replace('#', '').match(/../g).map((v) => parseInt(v, 16)); return m; })();
    let img = null, fieldUsed = field;
    const size = () => {
      const w = Math.min(maxWidth, Math.max(2, Math.round(canvas.clientWidth * scale)));
      const h = Math.max(2, Math.round(w * (canvas.clientHeight || 1) / (canvas.clientWidth || 1)));
      if (canvas.width !== w || canvas.height !== h || !img) {
        canvas.width = w; canvas.height = h;
        img = ctx.createImageData(w, h);
        if (!field) fieldUsed = hatchField(w, h);
      }
    };
    function draw(p, px = 0, py = 0) {
      size();
      if (reduced()) p = p < 0.5 ? 0 : 1; // an instant cut under reduced motion, never a slow one
      const { width: w, height: h } = canvas, d = img.data, F = fieldUsed;
      d.fill(0);
      let covered = 0;
      for (let k = 0; k < planes; k++) {
        // Far planes lag behind and move less; the near plane leads, is drawn largest and moves most.
        const depth = (k + 1) / planes;
        const level = clamp01((p - (planes - 1 - k) * lag) / (1 - (planes - 1) * lag)) * 1.6;
        if (level <= 0) continue;
        const zoom = 1 + depth * 0.25, ox = px * depth * 0.04 * w, oy = py * depth * 0.03 * h;
        const alpha = Math.round(255 * (0.55 + 0.45 * depth));
        for (let y = 0; y < h; y++) {
          const rise = 1 - y / h; // 0 at the bottom: the ink rises from below
          const fy = Math.min(F.h - 1, Math.max(0, Math.floor(((y - h / 2 + oy) / zoom + h / 2) * F.h / h)));
          for (let x = 0; x < w; x++) {
            const fx = Math.min(F.w - 1, Math.max(0, Math.floor(((x - w / 2 + ox) / zoom + w / 2) * F.w / w)));
            if (0.6 * rise + 0.4 * F.data[fy * F.w + fx] >= level) continue;
            const i = (y * w + x) * 4;
            if (d[i + 3] < alpha) { if (!d[i + 3]) covered++; d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2]; d[i + 3] = alpha; }
          }
        }
      }
      ctx.putImageData(img, 0, 0);
      canvas.dataset.dfInk = (covered / (w * h)).toFixed(3);
      return covered / (w * h);
    }
    return { draw };
  }

  async function preload(items, { onProgress, upload, compile, compileWeight = 0.15 } = {}) {
    // Honest progress: each image counts its weight twice (fetched and decoded, then uploaded), and the shader
    // compile counts as a fixed share. The figure only moves when work is actually finished, and never backwards.
    const list = items.map((it) => (typeof it === 'string' ? { src: it, weight: 1 } : { weight: 1, ...it }));
    const total = list.reduce((a, b) => a + b.weight * (upload ? 2 : 1), 0) || 1;
    const share = compile ? compileWeight : 0;
    let done = 0, shown = 0;
    const report = () => {
      const p = Math.min(compile ? 1 - share : 1, (done / total) * (1 - share));
      if (p > shown) { shown = p; onProgress?.(shown); }
    };
    const images = [], failed = [];
    await Promise.all(list.map(async (it, i) => {
      const img = new Image();
      img.decoding = 'async';
      img.src = it.src;
      try {
        await img.decode(); // decoded off the main thread, so the first draw does not decode it
        images[i] = img;
      } catch {
        failed.push(it.src);
      }
      done += it.weight; report();
      if (upload && images[i]) await upload(images[i], it); // e.g. renderer.initTexture(texture)
      if (upload) { done += it.weight; report(); }
    }));
    if (compile) await compile(); // e.g. renderer.compileAsync(scene, camera)
    shown = 1; onProgress?.(1);
    return { images, failed };
  }

  window.dfStory = { reduced, progress, parallax, hold, flipbook, hatchField, ink, preload };
})();
