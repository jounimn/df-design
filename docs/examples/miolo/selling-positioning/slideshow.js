// df-design presentation slideshow runtime. Structure only: the identity styles the slides.
//
// Slides are the page's section[data-section] elements, one in focus at a time, 16:9 (1920×1080) scaled to fit the viewport.
//   Keys        ←/→, PageUp/PageDown, Home/End
//   Pointer     on-screen previous/next buttons; touch swipe
//   Counter     "03 / 10"
//   URL hash    #slide-N tracks the slide, so a slide can be linked, and back/forward work; #some-id opens the slide holding it
//   Motion      fast tier, CSS only: slide/fade transitions and clip-path reveals on [data-reveal] (see slideshow.css).
//               prefers-reduced-motion switches both off.
//   Events      document 'df:slidechange', detail { from, to, slide } (1-based; from is null on the first show), so a
//               medium or high tier (GSAP, Motion One, WebGL) can hook in.
//   API         window.__DF_SLIDESHOW__ = { go(n), next(), prev(), get current(), get count() }
//
// window.__DF_EXPORT__ === true (set by the export and the checker before this script runs) turns everything off:
// every section stays in the normal flow and every [data-reveal] is at rest.
(() => {
  'use strict';
  if (window.__DF_EXPORT__ === true || window.__DF_SLIDESHOW_BOOT__) return;
  window.__DF_SLIDESHOW_BOOT__ = true; // a second <script> tag must not start a second slideshow

  const SLIDE = { width: 1920, height: 1080 };
  const SWIPE = { distance: 50, ratio: 1.5 };
  const LEAVE_MS = 700; // how long a slide that was left keeps its reveals, so they do not snap shut mid-fade
  const root = document.documentElement;
  const pad = (n) => String(n).padStart(2, '0');
  const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function start() {
    const slides = [...document.querySelectorAll('section[data-section]')];
    if (!slides.length) return;
    let current = 0;
    let shown = false;

    // The first layout is set without a transition, so the slides do not animate in from an unscaled state.
    root.classList.add('df-resizing', 'df-slideshow');
    hideEverythingElse(slides);

    // On-screen controls
    const ui = document.createElement('nav');
    ui.className = 'df-ui';
    ui.setAttribute('aria-label', 'Slideshow');
    ui.innerHTML = '<button type="button" class="df-nav df-prev" aria-label="Previous slide">&#8249;</button>'
      + '<button type="button" class="df-nav df-next" aria-label="Next slide">&#8250;</button>'
      + '<div class="df-counter" role="status" aria-live="polite"></div>';
    document.body.appendChild(ui);
    const prevButton = ui.querySelector('.df-prev');
    const nextButton = ui.querySelector('.df-next');
    const counter = ui.querySelector('.df-counter');
    prevButton.addEventListener('click', () => go(current - 1));
    nextButton.addEventListener('click', () => go(current + 1));

    function fit() {
      root.style.setProperty('--df-scale', String(Math.min(window.innerWidth / SLIDE.width, window.innerHeight / SLIDE.height)));
    }
    let resizing;
    window.addEventListener('resize', () => {
      root.classList.add('df-resizing'); // no transition while the viewport changes
      clearTimeout(resizing);
      resizing = setTimeout(() => root.classList.remove('df-resizing'), 150);
      fit();
    });
    fit();

    function reveal(slide) {
      const targets = slide.querySelectorAll('[data-reveal]');
      if (reducedMotion()) { targets.forEach((el) => el.classList.add('df-revealed')); return; }
      requestAnimationFrame(() => requestAnimationFrame(() => targets.forEach((el) => el.classList.add('df-revealed'))));
    }

    function render(from) {
      slides.forEach((slide, i) => {
        slide.classList.toggle('df-active', i === current);
        slide.classList.toggle('df-before', i < current);
        slide.classList.toggle('df-after', i > current);
        slide.setAttribute('aria-label', `Slide ${i + 1} of ${slides.length}`);
      });
      counter.textContent = `${pad(current + 1)} / ${pad(slides.length)}`;
      prevButton.setAttribute('aria-disabled', String(current === 0));
      nextButton.setAttribute('aria-disabled', String(current === slides.length - 1));
      reveal(slides[current]);
      setTimeout(() => slides.forEach((slide, i) => {
        if (i !== current) slide.querySelectorAll('.df-revealed').forEach((el) => el.classList.remove('df-revealed'));
      }), LEAVE_MS);
      document.dispatchEvent(new CustomEvent('df:slidechange', {
        bubbles: true,
        detail: { from: from === null ? null : from + 1, to: current + 1, slide: slides[current] },
      }));
    }

    // go() moves and records the slide in the hash; the hashchange it triggers finds nothing left to do.
    function go(n, { fromHash = false } = {}) {
      const next = Math.max(0, Math.min(slides.length - 1, Math.round(n)));
      if (shown && next === current) return;
      const from = shown ? current : null;
      current = next;
      shown = true;
      render(from);
      if (!fromHash) window.location.hash = `slide-${current + 1}`;
    }

    function fromHash() {
      const hash = decodeURIComponent(window.location.hash.slice(1));
      const numbered = hash.match(/^slide-(\d+)$/);
      if (numbered) return Number(numbered[1]) - 1;
      const holder = hash && document.getElementById(hash)?.closest('section[data-section]');
      return holder ? slides.indexOf(holder) : 0;
    }
    window.addEventListener('hashchange', () => go(fromHash(), { fromHash: true }));

    // Keys
    document.addEventListener('keydown', (e) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (e.target.closest?.('input, textarea, select, [contenteditable=""], [contenteditable="true"]')) return;
      const target = { ArrowRight: current + 1, PageDown: current + 1, ArrowLeft: current - 1, PageUp: current - 1, Home: 0, End: slides.length - 1 }[e.key];
      if (target === undefined) return;
      e.preventDefault();
      go(target);
    });

    // Swipe
    let touch = null;
    document.addEventListener('touchstart', (e) => {
      touch = e.touches.length === 1 && !e.target.closest?.('[data-no-swipe], input, textarea, select, iframe')
        ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null;
    }, { passive: true });
    document.addEventListener('touchend', (e) => {
      if (!touch) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touch.x;
      const dy = t.clientY - touch.y;
      touch = null;
      if (Math.abs(dx) >= SWIPE.distance && Math.abs(dx) > Math.abs(dy) * SWIPE.ratio) go(current + (dx < 0 ? 1 : -1));
    }, { passive: true });

    window.__DF_SLIDESHOW__ = {
      go: (n) => go(n - 1),
      next: () => go(current + 1),
      prev: () => go(current - 1),
      get current() { return current + 1; },
      get count() { return slides.length; },
    };
    go(fromHash(), { fromHash: true });
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('df-resizing')));
  }

  // Only the slides, the elements that hold them, and the controls stay visible: artboards ([data-social]), stray
  // wrappers and the like never become slides. The watermark layer, when present, is left alone.
  function hideEverythingElse(slides) {
    const keep = new Set();
    slides.forEach((slide) => { for (let n = slide; n && n !== document.body; n = n.parentElement) keep.add(n); });
    const walk = (parent) => {
      for (const child of parent.children) {
        if (/^(SCRIPT|STYLE|LINK|META|TEMPLATE|NOSCRIPT)$/.test(child.tagName) || child.hasAttribute('data-df-watermark')) continue;
        if (!keep.has(child)) child.classList.add('df-off');
        else if (!slides.includes(child)) walk(child);
      }
    };
    walk(document.body);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once: true });
  else start();
})();
