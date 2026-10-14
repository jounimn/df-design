// df-design canvas loop. One call makes a canvas animation pass every check-motion check by construction.
//
//   const loop = dfCanvasLoop(canvas, {
//     context: '2d' | 'webgl' | 'webgl2',
//     draw(t, ctx) {},      // one frame; t is the rAF timestamp in ms
//     poster(ctx) {},       // one still frame: reduced motion, export and the first paint of a paused loop
//     fallback: '#selector' // shown when the canvas cannot be drawn (no context, or the context is lost)
//     maxDpr: 2,            // the canvas is never sized past clientWidth × maxDpr
//     restore(ctx) {},      // optional: after a lost WebGL context comes back, rebuild its programs and buffers
//   });
//   loop.stop();
//
//   Runs         only while the canvas is on screen, the tab is visible and, in a slideshow, its slide is the one in
//                focus; draw stops within a frame or two otherwise.
//   Reduced      prefers-reduced-motion: reduce draws the poster once and never calls draw (and follows the setting if
//   motion       it changes while the page is open). So does window.__DF_EXPORT__ === true, the export's still render.
//   Size         the backing store follows the element's size, capped by maxDpr, so a 3x screen does not draw 9x pixels.
//   Fallback     no context, or a lost one: the loop stops, the canvas is hidden and the fallback element is shown;
//                a restored context hides it again and draw resumes. A fallback selector that matches nothing logs one
//                console warning and the page carries on.
//   State        canvas.dataset.dfLoop = 'running' | 'paused' | 'poster' | 'fallback'; canvas.dataset.dfPoster = 'done'
//                once a poster has been drawn.
(() => {
  'use strict';

  window.dfCanvasLoop = function dfCanvasLoop(canvas, options) {
    const { draw, poster, restore, fallback, context = '2d', maxDpr = 2 } = options;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    // In a slideshow (templates/slideshow.js) a canvas on a slide that is not in focus does not run.
    const slide = canvas.closest('section[data-section]');

    let ctx = null;
    let inView = false;
    let slideActive = true;
    let stopped = false;
    let lost = false; // no context to draw into: the fallback is showing
    let frame = 0;
    let posterDrawn = false;
    let warned = false;
    let savedDisplay = null;

    const still = () => motion.matches || window.__DF_EXPORT__ === true;
    const tabVisible = () => !document.hidden;
    const shouldRun = () => !stopped && !lost && !still() && inView && tabVisible() && slideActive;

    const size = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
      const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
      // Assigning width or height clears the canvas, so only touch them when they change.
      const changed = canvas.width !== w || canvas.height !== h;
      if (canvas.width !== w) canvas.width = w;
      if (canvas.height !== h) canvas.height = h;
      return changed;
    };

    const drawPoster = () => {
      if (typeof poster === 'function' && ctx) poster(ctx);
      posterDrawn = true;
      canvas.dataset.dfPoster = 'done';
    };

    const fallbackElement = () => {
      if (!fallback) return null;
      let el = null;
      try { el = document.querySelector(fallback); } catch { /* an invalid selector is a missing one */ }
      if (!el && !warned) {
        warned = true;
        console.warn(`dfCanvasLoop: fallback "${fallback}" matches no element; the canvas will be hidden without a replacement.`);
      }
      return el;
    };

    const showFallback = (on) => {
      const el = fallbackElement();
      if (on) {
        if (savedDisplay === null) savedDisplay = canvas.style.display;
        canvas.style.display = 'none';
        if (el) {
          el.hidden = false;
          if (getComputedStyle(el).display === 'none') el.style.display = 'block';
        }
      } else {
        if (savedDisplay !== null) canvas.style.display = savedDisplay;
        savedDisplay = null;
        if (el) el.hidden = true;
      }
    };

    const tick = (t) => {
      frame = 0;
      if (!shouldRun()) return;
      draw(t, ctx);
      frame = requestAnimationFrame(tick);
    };

    const cancel = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };

    const update = () => {
      if (stopped) return;
      if (lost) { cancel(); canvas.dataset.dfLoop = 'fallback'; return; }
      if (still()) {
        cancel();
        if (!posterDrawn) drawPoster();
        canvas.dataset.dfLoop = 'poster';
        return;
      }
      if (shouldRun()) {
        canvas.dataset.dfLoop = 'running';
        if (!frame) frame = requestAnimationFrame(tick);
      } else {
        cancel();
        canvas.dataset.dfLoop = 'paused';
      }
    };

    const lose = () => {
      lost = true;
      showFallback(true);
      update();
    };

    ctx = canvas.getContext(context);
    size();
    if (!ctx) lost = true;

    const resize = new ResizeObserver(() => {
      // Resizing wiped the picture: a poster has to be drawn again to still be there.
      if (size() && still() && posterDrawn && !lost) drawPoster();
    });
    resize.observe(canvas);

    const view = new IntersectionObserver((entries) => {
      inView = entries[entries.length - 1].isIntersecting;
      update();
    });
    view.observe(canvas);

    const onVisibility = () => update();
    // The slideshow dispatches df:slidechange after it has moved: detail.slide is the slide now in focus.
    const onSlide = (e) => {
      slideActive = !slide || e.detail?.slide === slide;
      update();
    };
    const onLost = (e) => { e.preventDefault(); lose(); };
    const onRestored = () => {
      ctx = canvas.getContext(context);
      if (!ctx) return;
      lost = false;
      showFallback(false);
      size();
      if (typeof restore === 'function') restore(ctx);
      posterDrawn = false;
      update();
    };

    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('df:slidechange', onSlide);
    canvas.addEventListener('webglcontextlost', onLost);
    canvas.addEventListener('webglcontextrestored', onRestored);
    motion.addEventListener('change', update);

    // A slideshow that started before this script has already marked its slide in focus.
    if (slide && document.documentElement.classList.contains('df-slideshow')) slideActive = slide.classList.contains('df-active');

    if (lost) showFallback(true);
    update();

    return {
      stop() {
        stopped = true;
        cancel();
        resize.disconnect();
        view.disconnect();
        document.removeEventListener('visibilitychange', onVisibility);
        document.removeEventListener('df:slidechange', onSlide);
        canvas.removeEventListener('webglcontextlost', onLost);
        canvas.removeEventListener('webglcontextrestored', onRestored);
        motion.removeEventListener('change', update);
        canvas.dataset.dfLoop = 'paused';
      },
    };
  };
})();
