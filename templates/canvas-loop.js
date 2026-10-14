// df-design canvas loop. One call makes a canvas animation pass every check-motion check by construction.
//
//   const loop = dfCanvasLoop(canvas, {
//     context: '2d' | 'webgl' | 'webgl2',
//     draw(t, ctx) {},      // one frame; t is the rAF timestamp in ms
//     poster(ctx) {},       // one still frame: reduced motion, export and the first paint of a paused loop
//     fallback: '#selector' // shown when the canvas cannot be drawn (no context, a lost context, a draw that throws)
//     maxDpr: 2,            // the canvas is never sized past clientWidth × maxDpr
//     restore(ctx) {},      // optional: after a lost WebGL context comes back, rebuild its programs and buffers
//   });
//   loop.stop();
//
//   Runs         only while the canvas is on screen, the tab is visible and, in a slideshow, its slide is the one in
//                focus; draw stops within a frame or two otherwise. A canvas that is not running shows its poster, so
//                a canvas below the fold, or on a slide that has not come in yet, is never blank.
//   Reduced      prefers-reduced-motion: reduce draws the poster once and never calls draw (and follows the setting if
//   motion       it changes while the page is open). So does window.__DF_EXPORT__ === true, the export's still render.
//   Size         the backing store follows the element's size, capped by maxDpr, so a 3x screen does not draw 9x pixels.
//   Fallback     no context, a lost one, a draw that throws, or a browser too old to start the loop: the loop stops,
//                the canvas is hidden and the fallback element is shown (the error is logged once). A restored
//                context hides the fallback again and draw resumes. A fallback selector that matches nothing logs one
//                console warning and the page carries on.
//   Old          without IntersectionObserver the canvas counts as always in view; without ResizeObserver its size
//   browsers     is read once; MediaQueryList.addListener stands in for addEventListener.
//   State        canvas.dataset.dfLoop = 'running' | 'paused' | 'poster' | 'fallback'; canvas.dataset.dfPoster = 'done'
//                once a poster has actually been drawn.
(() => {
  'use strict';

  window.dfCanvasLoop = function dfCanvasLoop(canvas, options) {
    const { draw, poster, restore, fallback, context = '2d', maxDpr = 2 } = options;
    // In a slideshow (templates/slideshow.js) a canvas on a slide that is not in focus does not run.
    const slide = canvas.closest('section[data-section]');

    let motion = null;
    let ctx = null;
    let inView = typeof IntersectionObserver === 'undefined'; // no observer: assume it is in view
    let slideActive = true;
    let stopped = false;
    let lost = false; // nothing to draw into or draw failed: the fallback is showing
    let frame = 0;
    let posterDrawn = false;
    let warned = false;
    let reported = false;
    let savedDisplay = null;
    let savedFallback = null; // the fallback element's own inline display, kept while it is shown
    let resize = null;
    let view = null;
    const undo = [];

    const still = () => Boolean(motion && motion.matches) || window.__DF_EXPORT__ === true;
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
      posterDrawn = true;
      if (typeof poster !== 'function' || !ctx) return;
      poster(ctx);
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

    // The fallback may be hidden by an inline display:none rather than the hidden attribute, and an inline display
    // wins over [hidden]: its own inline display is kept while it shows and put back when it goes away.
    const showFallback = (on) => {
      const el = fallbackElement();
      if (on) {
        if (savedDisplay === null) savedDisplay = canvas.style.display;
        canvas.style.display = 'none';
        if (el) {
          if (savedFallback === null) savedFallback = el.style.display;
          el.hidden = false;
          if (el.style.display === 'none') el.style.display = '';
          if (getComputedStyle(el).display === 'none') el.style.display = 'block';
        }
      } else {
        if (savedDisplay !== null) canvas.style.display = savedDisplay;
        savedDisplay = null;
        if (el) {
          el.hidden = true;
          if (savedFallback !== null) el.style.display = savedFallback;
          if (getComputedStyle(el).display !== 'none') el.style.display = 'none';
        }
        savedFallback = null;
      }
    };

    const fail = (reason, err) => {
      if (!reported) {
        reported = true;
        console.error(`dfCanvasLoop: ${reason}; showing the fallback.`, err ?? '');
      }
      lost = true;
      showFallback(true);
      update();
    };

    const tick = (t) => {
      frame = 0;
      if (!shouldRun()) return;
      try {
        draw(t, ctx);
      } catch (err) {
        fail('draw threw', err);
        return;
      }
      frame = requestAnimationFrame(tick);
    };

    const cancel = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };

    function update() {
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
        // Not running (below the fold, another slide, a hidden tab): the poster is what the canvas shows meanwhile.
        if (!posterDrawn) drawPoster();
        canvas.dataset.dfLoop = 'paused';
      }
    }

    const listen = (target, type, fn) => {
      target.addEventListener(type, fn);
      undo.push(() => target.removeEventListener(type, fn));
    };

    try {
      motion = window.matchMedia('(prefers-reduced-motion: reduce)');
      ctx = canvas.getContext(context);
      size();
      if (!ctx) lost = true;

      if (typeof ResizeObserver !== 'undefined') {
        resize = new ResizeObserver(() => {
          // Resizing wiped the picture: a poster has to be drawn again to still be there, unless frames are coming.
          if (size() && !lost && posterDrawn && canvas.dataset.dfLoop !== 'running') { posterDrawn = false; update(); }
        });
        resize.observe(canvas);
      }

      if (typeof IntersectionObserver !== 'undefined') {
        view = new IntersectionObserver((entries) => {
          inView = entries[entries.length - 1].isIntersecting;
          update();
        });
        view.observe(canvas);
      }

      listen(document, 'visibilitychange', update);
      // The slideshow dispatches df:slidechange after it has moved: detail.slide is the slide now in focus.
      listen(document, 'df:slidechange', (e) => {
        slideActive = !slide || e.detail?.slide === slide;
        update();
      });
      listen(canvas, 'webglcontextlost', (e) => { e.preventDefault(); fail('the WebGL context was lost'); });
      listen(canvas, 'webglcontextrestored', () => {
        ctx = canvas.getContext(context);
        if (!ctx) return;
        lost = false;
        reported = false;
        showFallback(false);
        size();
        if (typeof restore === 'function') restore(ctx);
        posterDrawn = false;
        update();
      });
      if (typeof motion.addEventListener === 'function') {
        motion.addEventListener('change', update);
        undo.push(() => motion.removeEventListener('change', update));
      } else if (typeof motion.addListener === 'function') {
        motion.addListener(update);
        undo.push(() => motion.removeListener(update));
      }

      // A slideshow that started before this script has already marked its slide in focus.
      if (slide && document.documentElement.classList.contains('df-slideshow')) slideActive = slide.classList.contains('df-active');

      if (lost) showFallback(true);
      update();
    } catch (err) {
      // Whatever the browser lacks, the visitor gets the fallback and the page gets a log line, not a blank canvas.
      lost = true;
      showFallback(true);
      if (!reported) { reported = true; console.error('dfCanvasLoop: could not start; showing the fallback.', err); }
      update();
    }

    return {
      stop() {
        stopped = true;
        cancel();
        resize?.disconnect();
        view?.disconnect();
        undo.forEach((fn) => fn());
        canvas.dataset.dfLoop = 'paused';
      },
    };
  };
})();
