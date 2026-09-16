export async function runStaticPass(page) {
  return page.evaluate(() => {
    const vw = innerWidth, vh = innerHeight;

    const inFirstViewport = (el) => {
      const r = el.getBoundingClientRect();
      return r.top < vh && r.bottom > 0 && r.width > 0 && r.height > 0;
    };

    // Largest RENDERED text in the first viewport, whatever element holds it.
    // Never "the h1" — that assumption dropped two sites from the original corpus.
    let hero = null;
    let best = 0;
    for (const el of document.body.querySelectorAll('*')) {
      const text = (el.textContent ?? '').trim();
      if (!text || el.children.length > 0) continue;
      if (!inFirstViewport(el)) continue;
      const cs = getComputedStyle(el);
      const size = parseFloat(cs.fontSize) || 0;
      if (size > best) {
        best = size;
        const ls = cs.letterSpacing;
        const r = el.getBoundingClientRect();
        hero = {
          fontSizePx: size,
          letterSpacingEm: ls === 'normal' ? 0 : (parseFloat(ls) || 0) / size,
          tag: el.tagName.toLowerCase(),
          textLength: text.length,
          centred: Math.abs((r.left + r.right) / 2 - vw / 2) < vw * 0.06,
        };
      }
    }
    // Below a plain paragraph size there is no "opening statement" to speak of.
    if (hero && hero.fontSizePx < 20) hero = null;

    // Walk to the first painted ancestor. Sampling the element itself is what
    // produced the transparent grounds in the original corpus.
    const paintedGround = (start) => {
      let el = start;
      while (el) {
        const bg = getComputedStyle(el).backgroundColor;
        const m = bg.match(/rgba?\(([^)]+)\)/i);
        if (m) {
          const p = m[1].split(',').map((x) => parseFloat(x));
          if (!(p.length === 4 && p[3] === 0)) return bg;
        }
        el = el.parentElement;
      }
      return getComputedStyle(document.documentElement).backgroundColor;
    };

    const areaRatio = (sel) => {
      let max = 0;
      for (const el of document.querySelectorAll(sel)) {
        const r = el.getBoundingClientRect();
        max = Math.max(max, (r.width * r.height) / (vw * vh));
      }
      return Math.min(max, 1);
    };

    const countBy = (fn) => [...document.querySelectorAll('body *')].filter(fn).length;
    const cs = (el) => getComputedStyle(el);

    const sections = [...document.querySelectorAll('section, main > div, body > div')]
      .filter((el) => el.getBoundingClientRect().height > vh * 0.25);
    const grounds = sections.map((el) => paintedGround(el));
    const groundChanges = grounds.filter((g, i) => i > 0 && g !== grounds[i - 1]).length;

    // Picking the first button in DOM order finds nav icon toggles, not the
    // page's call to action. On a real site that produced a 32px transparent
    // pill, and its colour was published as the accent — the same
    // transparent-sample-as-fact failure the painted-ancestor walk above exists
    // to prevent. Require an actually painted background, a plausible control
    // size, and prefer the largest such control in the first viewport.
    const isPainted = (bg) => {
      const m = bg.match(/rgba?\(([^)]+)\)/i);
      if (!m) return false;
      const p = m[1].split(',').map((x) => parseFloat(x));
      return !(p.length === 4 && p[3] === 0);
    };

    const ctaCandidates = [...document.querySelectorAll(
      'button, a[role="button"], [class*="cta"], [class*="btn"], [class*="Button"], a',
    )]
      .filter((el) => inFirstViewport(el))
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { el, rect: r, area: r.width * r.height, painted: isPainted(getComputedStyle(el).backgroundColor) };
      })
      .filter((c) => c.painted && c.area >= 600 && c.area <= vw * vh * 0.06)
      .sort((a, b) => b.area - a.area);

    const ctaPick = ctaCandidates[0] ?? null;
    const cta = ctaPick?.el ?? null;
    const ctaRect = ctaPick?.rect ?? null;

    let webgl = false;
    for (const c of document.querySelectorAll('canvas')) {
      try {
        if (c.getContext('webgl2') || c.getContext('webgl')) webgl = true;
      } catch { /* context already claimed with different attrs */ }
    }

    // Cross-origin sheets throw on cssRules. Record 'unknown', never 0 — a floor
    // published as a count is how the original corpus understated this. Spec §6.5.
    let reducedMotionRules = 0;
    let sheetBlocked = false;
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.media?.mediaText?.includes('prefers-reduced-motion')) reducedMotionRules += 1;
        }
      } catch { sheetBlocked = true; }
    }

    const families = new Set();
    for (const f of document.fonts) families.add(f.family);

    const bodyText = (document.body.innerText ?? '');
    const firstViewportText = [...document.body.querySelectorAll('*')]
      .filter((el) => el.children.length === 0 && inFirstViewport(el))
      .map((el) => (el.textContent ?? '').trim()).join(' ');

    return {
      hero,
      firstViewportTextLength: firstViewportText.length,
      groundColor: paintedGround(document.body),
      accentColor: cta ? cs(cta).backgroundColor : 'unknown',
      ctaRadiusPx: cta ? parseFloat(cs(cta).borderTopLeftRadius) || 0 : null,
      ctaSmallerDimPx: ctaRect ? Math.min(ctaRect.width, ctaRect.height) : null,
      fontFaceCount: families.size,
      fontFamilies: [...families],
      renderedTextLength: bodyText.length,
      pageHeightPx: document.documentElement.scrollHeight,
      viewportHeightPx: vh,
      lazySignals: /lazy|IntersectionObserver|data-src/i.test(
        document.documentElement.outerHTML.slice(0, 200000),
      ),
      sectionCount: sections.length,
      groundChanges,
      stickyCount: countBy((el) => cs(el).position === 'sticky'),
      features: {
        mask: countBy((el) => cs(el).maskImage !== 'none' && cs(el).maskImage !== ''),
        clip: countBy((el) => cs(el).clipPath !== 'none'),
        blend: countBy((el) => cs(el).mixBlendMode !== 'normal'),
        canvas: document.querySelectorAll('canvas').length,
        video: document.querySelectorAll('video').length,
        webgl,
      },
      canvasAreaRatio: areaRatio('canvas'),
      videoAreaRatio: areaRatio('video'),
      reducedMotionRules: sheetBlocked ? 'unknown' : reducedMotionRules,
    };
  });
}
