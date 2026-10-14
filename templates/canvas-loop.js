// df-design canvas loop. One call makes a canvas animation pass every check-motion check by construction.
//
//   const loop = dfCanvasLoop(canvas, {
//     context: '2d' | 'webgl' | 'webgl2',
//     draw(t, ctx) {},      // one frame; t is the rAF timestamp in ms
//     poster(ctx) {},       // one still frame: reduced motion, export and the first paint of a paused loop
//     fallback: '#selector' // shown when the canvas cannot be drawn (no context)
//     maxDpr: 2,            // the canvas is never sized past clientWidth × maxDpr
//   });
//   loop.stop();
//
//   Runs         only while the canvas is on screen and the tab is visible; draw stops within a frame or two otherwise.
//   Reduced      prefers-reduced-motion: reduce draws the poster once and never calls draw (and follows the setting if
//   motion       it changes while the page is open).
//   Size         the backing store follows the element's size, capped by maxDpr, so a 3x screen does not draw 9x pixels.
//   State        canvas.dataset.dfLoop = 'running' | 'paused' | 'poster' | 'fallback'; canvas.dataset.dfPoster = 'done'
//                once a poster has been drawn.
(() => {
  'use strict';

  window.dfCanvasLoop = function dfCanvasLoop(canvas, options) {
    const { draw, poster, context = '2d', maxDpr = 2 } = options;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');

    let ctx = null;
    let inView = false;
    let stopped = false;
    let frame = 0;
    let posterDrawn = false;

    const reduced = () => motion.matches;
    const tabVisible = () => !document.hidden;
    const shouldRun = () => !stopped && !reduced() && inView && tabVisible();

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

    const tick = (t) => {
      frame = 0;
      if (!shouldRun()) return;
      draw(t, ctx);
      frame = requestAnimationFrame(tick);
    };

    const update = () => {
      if (stopped) return;
      if (reduced()) {
        if (frame) { cancelAnimationFrame(frame); frame = 0; }
        if (!posterDrawn) drawPoster();
        canvas.dataset.dfLoop = 'poster';
        return;
      }
      if (shouldRun()) {
        canvas.dataset.dfLoop = 'running';
        if (!frame) frame = requestAnimationFrame(tick);
      } else {
        if (frame) { cancelAnimationFrame(frame); frame = 0; }
        canvas.dataset.dfLoop = 'paused';
      }
    };

    ctx = canvas.getContext(context);
    size();

    const resize = new ResizeObserver(() => {
      // Resizing wiped the picture: a poster has to be drawn again to still be there.
      if (size() && reduced() && posterDrawn) drawPoster();
    });
    resize.observe(canvas);

    const view = new IntersectionObserver((entries) => {
      inView = entries[entries.length - 1].isIntersecting;
      update();
    });
    view.observe(canvas);

    const onVisibility = () => update();
    document.addEventListener('visibilitychange', onVisibility);
    motion.addEventListener('change', update);

    update();

    return {
      stop() {
        stopped = true;
        if (frame) cancelAnimationFrame(frame);
        frame = 0;
        resize.disconnect();
        view.disconnect();
        document.removeEventListener('visibilitychange', onVisibility);
        motion.removeEventListener('change', update);
        canvas.dataset.dfLoop = 'paused';
      },
    };
  };
})();
