export async function runInventory(page) {
  return page.evaluate(() => {
    const selectorFor = (el) => {
      if (!el || !el.tagName) return 'unknown';
      if (el.id) return `#${el.id}`;
      const cls = (el.className && typeof el.className === 'string')
        ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
      return `${el.tagName.toLowerCase()}${cls}`;
    };

    // Commas inside cubic-bezier(...) are not list separators.
    const splitList = (value) => (value ?? '').split(/,(?![^(]*\))/).map((s) => s.trim());

    // effect.getTiming().easing is the EFFECT-level easing, which for a CSS
    // animation is 'linear' — the curve an author actually wrote lives in
    // animation-timing-function (and transition-timing-function). Reading the
    // effect channel here would have rebuilt the skill's entire easing table as
    // a column of 'linear'. Prefer the computed style; keep the effect value
    // alongside it so the two channels stay distinguishable.
    const shippedEasing = (a, target, timing, isTransition) => {
      if (!target) return timing.easing ?? null;
      const cs = getComputedStyle(target);
      if (a.animationName) {
        const i = splitList(cs.animationName).indexOf(a.animationName);
        const fns = splitList(cs.animationTimingFunction);
        if (i >= 0 && fns[i]) return fns[i];
      } else if (isTransition) {
        const i = splitList(cs.transitionProperty).indexOf(a.transitionProperty);
        const fns = splitList(cs.transitionTimingFunction);
        if (i >= 0 && fns[i]) return fns[i];
        if (fns.length === 1 && fns[0]) return fns[0];
      }
      return timing.easing ?? null;
    };

    const animations = [];
    for (const a of document.getAnimations()) {
      const t = a.effect?.getTiming?.() ?? {};
      const target = a.effect?.target;
      const isTransition = typeof a.transitionProperty === 'string';
      animations.push({
        selector: selectorFor(target),
        kind: isTransition ? 'transition' : (a.animationName ? 'css' : 'waapi'),
        name: a.animationName ?? a.transitionProperty ?? null,
        durationMs: typeof t.duration === 'number' ? t.duration : null,
        delayMs: t.delay ?? 0,
        easing: shippedEasing(a, target, t, isTransition),
        effectEasing: t.easing ?? null,
        // Infinity does not survive JSON. null means "runs forever".
        iterations: t.iterations === Infinity ? null : (t.iterations ?? 1),
        playState: a.playState,
      });
    }

    const keyframes = {};
    let blockedSheets = 0;
    for (const sheet of document.styleSheets) {
      let rules;
      try { rules = sheet.cssRules; } catch { blockedSheets += 1; continue; }
      for (const rule of rules) {
        const isKeyframes = (typeof CSSKeyframesRule !== 'undefined' && rule instanceof CSSKeyframesRule)
          || rule.type === 7;
        if (!isKeyframes) continue;
        keyframes[rule.name] = [...rule.cssRules].map((kf) => {
          const properties = {};
          for (const prop of kf.style) properties[prop] = kf.style.getPropertyValue(prop).trim();
          return { offset: kf.keyText, properties };
        });
      }
    }

    return { animations, keyframes, blockedSheets };
  });
}
