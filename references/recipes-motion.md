# Motion recipes

Working implementations, each traced to a site that ships it. Every value
here was read off a production page — see `benchmarks.md` for the method.

**The governing idea:** the sites that read as expensive are not running
more animations. They are compositing — masks, clip paths, blend modes and
one cheap ambient loop. Reach for those before reaching for a keyframe.

---

## 1. The signature curve

Do not default to Material's `cubic-bezier(0.4, 0, 0.2, 1)`. It is the most
common curve in design systems and the least characterful of those measured.

```css
:root {
  /* Stripe ships this 435 times. Arrives fast, settles long. */
  --ease-signature: cubic-bezier(0.25, 1, 0.5, 1);   /* easeOutQuart */
  /* Linear's own curve, 30 instances. Even harder deceleration. */
  --ease-weighted:  cubic-bezier(0.32, 0.72, 0, 1);
  /* Stripe, for the one showpiece moment. */
  --ease-dramatic:  cubic-bezier(0.16, 1, 0.3, 1);   /* easeOutExpo */

  --dur-feedback: 0.15s;   /* hover, press, focus */
  --dur-content:  0.3s;    /* reveals, menus, transitions */
  --dur-showpiece: 0.8s;   /* used once or twice per page */
}
```

Pick ONE of the three curves as the project's signature and use it for
roughly 80% of transitions. The other two are for exceptions you can name.

---

## 2. Ambient dot grid — Linear

Linear's hero sits on a grid of dots where individual dots step between
`opacity: 0.3` and `1` on a staggered schedule. It ships as dozens of
generated `@keyframes grid-dot-R-C-upDown` rules; one keyframe plus a
per-dot delay reads identically and is a fraction of the CSS.

This is the **ambient layer** — the thing a page without one is missing.
It costs one element and no JavaScript.

```css
.dot-grid {
  display: grid;
  grid-template-columns: repeat(var(--cols), 1fr);
  gap: 28px;
  /* Fade the field out at the edges so it never fights the content. */
  mask-image: radial-gradient(ellipse 80% 60% at 50% 40%, #000 30%, transparent 75%);
}
.dot-grid i {
  width: 3px; height: 3px; border-radius: 50%;
  background: rgb(var(--ink) / 1);
  opacity: 0.3;
  animation: dot-pulse 7s var(--ease-signature) infinite;
  animation-delay: var(--d);   /* set per dot, see below */
}
@keyframes dot-pulse {
  0%, 62%, 100% { opacity: 0.18; }
  70%           { opacity: 1; }
}
```

```tsx
// Delays are deliberately irregular: an even sweep reads as a loading bar,
// a scattered one reads as something alive.
const dots = Array.from({ length: cols * rows }, (_, i) => (
  <i key={i} style={{ "--d": `${(i * 977) % 7000}ms` } as React.CSSProperties} />
));
```

Under reduced motion, drop the animation and keep the field at its resting
opacity — the texture survives, the movement does not.

---

## 3. Corner glow — Linear

Linear's cards carry a soft highlight anchored at one corner. It is a mask,
not a gradient background, so the glow reveals whatever is underneath.

```css
/* Read verbatim off linear.app */
.card-glow::before {
  content: "";
  position: absolute; inset: 0;
  background: rgb(var(--brand));
  mask-image: radial-gradient(200px 200px at 0% 0%,
    #000 0%, rgb(0 0 0 / 0.6) 30%, rgb(0 0 0 / 0.2) 50%, transparent 70%);
  pointer-events: none;
}
```

Move the anchor (`at 0% 0%`, `at 8% 0%`, `at 100% 0%`) card by card so a row
of cards is not four copies of the same highlight. Linear ships all three.

---

## 4. Edge fade for anything that scrolls sideways

Marquees, logo rows and overflow tables all need their cut edges softened,
or they read as broken rather than continuing.

```css
/* linear.app: 80px. hex.tech uses 30px on a tighter component. */
.edge-fade {
  mask-image: linear-gradient(to right,
    transparent 0, #000 80px, #000 calc(100% - 80px), transparent 100%);
}
/* hex.tech, for a panel that should dissolve into the section below */
.bottom-fade { mask-image: linear-gradient(#000 0%, #000 90%, transparent 100%); }
```

---

## 5. Dot grid and hairlines as masks — Hex

Two of the most useful lines of CSS in the whole survey.

```css
/* A dot grid with no elements at all. */
.dotted {
  background: rgb(var(--ink) / 0.25);
  mask-image: radial-gradient(#fff, #fff 1px, transparent 1px, transparent);
  mask-size: 16px 16px;
}
/* A 1px hairline drawn by masking, so it can carry a gradient. */
.hairline-right {
  background: linear-gradient(to bottom, transparent, rgb(var(--brand)), transparent);
  mask-image: linear-gradient(to right,
    transparent, transparent calc(100% - 1px), #fff calc(100% - 1px), #fff);
}
```

---

## 6. Noise

Neon masks with a noise SVG; Hex animates the background position of one,
which is the cheapest possible film-grain.

```css
.grain::after {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.35'/%3E%3C/svg%3E");
  animation: grain-drift 8s steps(6) infinite;   /* hex.tech */
  opacity: 0.04;
}
@keyframes grain-drift { from { background-position: -1024px -1024px; } to { background-position: 0 0; } }
```

Keep it under `opacity: 0.05`. Above that it stops being texture and starts
being dirt.

---

## 7. Shimmer sweep — Neon

```css
/* neon.tech: @keyframes shimmer { 100% { transform: translate(100%) } } */
.shimmer { position: relative; overflow: hidden; }
.shimmer::after {
  content: ""; position: absolute; inset: 0; transform: translateX(-100%);
  background: linear-gradient(90deg, transparent, rgb(var(--brand) / 0.18), transparent);
  animation: shimmer 2.4s var(--ease-signature) infinite;
}
@keyframes shimmer { to { transform: translateX(100%); } }
```

Use for loading placeholders and for a single "this is live" cue. Not for
decoration on static content.

---

## 8. Marquee — Hex

```css
/* hex.tech: @keyframes ticker { 0% { translateX(0) } 100% { translateX(-20%) } }
   The -20% works because the list is rendered five times. */
.ticker { display: flex; width: max-content; animation: ticker 40s linear infinite; }
@keyframes ticker { to { transform: translateX(-20%); } }
```

`linear` is correct here — it is the one case where constant speed is right,
because any easing makes a continuous loop visibly stutter at the seam.
Pair with the edge fade from §4.

---

## 9. Additive blends on a dark ground — Linear

Linear's glowing hairlines and haloed panels are `mix-blend-mode`, measured
at `overlay` ×7, `lighten` ×6, `screen` ×5.

```css
.glow-line { mix-blend-mode: screen; }    /* light adds, dark disappears */
.tint-panel { mix-blend-mode: overlay; }  /* keeps the underlying texture */
```

Rule of thumb: `screen` / `lighten` on dark grounds, `multiply` on light
ones (Stripe ships `multiply` ×4). A blend mode on the wrong ground does
nothing at all, silently.

---

## 10. Scroll-linked, two ways

**Native CSS first.** Chrome/Edge 115+, Firefox 132+, Safari 18+, ~84%
global. It runs on the compositor, off the main thread. Write the finished
state as the default so unsupported browsers get a working page:

```css
.reveal { opacity: 1; transform: none; }          /* the finished state */

@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .reveal {
      animation: reveal-in linear both;
      animation-timeline: view();
      animation-range: entry 10% cover 35%;
    }
  }
}
@keyframes reveal-in {
  from { opacity: 0; transform: translateY(18px); }
  to   { opacity: 1; transform: none; }
}
```

**Motion (React) when the value must drive something JS owns.** Motion falls
back to native `ScrollTimeline` where it can and a pooled
`IntersectionObserver` for triggers.

```tsx
const ref = useRef<HTMLDivElement>(null);
const { scrollYProgress } = useScroll({
  target: ref,
  offset: ["start end", "end start"],   // enters bottom → leaves top
});
const y = useTransform(scrollYProgress, [0, 1], [0, -120]);
```

Know which one you need: **scroll-triggered** (fires on entry — use
`whileInView` / `useInView`) versus **scroll-linked** (bound to position —
use `useScroll`). Reaching for the second when you meant the first is how
pages end up with content that never appears.

---

## 11. Sticky narrative

The pattern behind Antigravity's and Observable's mid-page sections: the
copy holds still while the evidence moves past it. Observable ships 27
sticky elements.

```tsx
<div ref={containerRef} style={{ height: "300vh" }}>
  <div style={{ position: "sticky", top: 0, height: "100vh", overflow: "hidden" }}>
    <motion.div style={{ x }}>{/* the moving stage */}</motion.div>
  </div>
</div>
```

`x` comes from `useTransform(scrollYProgress, [0, 1], ["0%", "-75%"])`.
A taller outer container makes the horizontal travel feel slower.

---

## 12. Counters that mean something

A number that counts up from zero is decoration. A number that counts to a
value *and shows its direction* is information.

```tsx
function useCountUp(target: number, ms: number, run: boolean) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!run) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { setN(target); return; }
    let raf = 0; const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      setN(Math.round(target * (1 - Math.pow(1 - p, 4))));   // easeOutQuart
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms, run]);
  return n;
}
```

Always `font-variant-numeric: tabular-nums` on a counting figure, or the
whole row reflows on every frame.

---

## 13. Text that performs its sentence

Split-text is worth it only when the motion restates the meaning — letters
scattering and converging under a headline about consolidating scattered
things. Otherwise it is noise.

```tsx
const letters = [...text];
<h1 aria-label={text}>
  {letters.map((c, i) => (
    <motion.span
      key={i} aria-hidden
      initial={{ opacity: 0, x: (i * 53) % 90 - 45, y: (i * 31) % 60 - 30, rotate: (i % 7) - 3 }}
      animate={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
      transition={{ duration: 0.8, delay: i * 0.012, ease: [0.16, 1, 0.3, 1] }}
      style={{ display: "inline-block", whiteSpace: "pre" }}
    >{c}</motion.span>
  ))}
</h1>
```

`aria-label` on the heading and `aria-hidden` on the spans, or a screen
reader announces the text one letter at a time.

Total stagger must stay under ~500ms. At `i * 0.012` that is 40 characters.

---

## 14. The reduced-motion contract

WCAG 2.3.3 (Animation from Interactions). Vestibular reactions include
dizziness, migraine and nausea; the W3C notes users may need bed rest to
recover. Parallax is named explicitly as a trigger. 19 of 28 measured sites
handle this — Metabase with 27 separate rule blocks, Atlan 14.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

The blanket rule is the floor, not the ceiling. It stops motion but leaves
anything that *starts* at `opacity: 0` invisible forever. Every element with
an entrance must also be given its resting state:

```css
@media (prefers-reduced-motion: reduce) {
  .reveal, .animate-rise, .dot-grid i { opacity: 1 !important; transform: none !important; }
}
```

In React, branch on it rather than relying on CSS alone — `useReducedMotion()`
in Motion, or `matchMedia("(prefers-reduced-motion: reduce)")`. Linear ships
`use-reduced-motion` in its bundle; so should you.

---

## Checklist before calling motion done

- [ ] One signature curve, named, used for ~80% of transitions
- [ ] An ambient layer exists (§2) — a page with only entrance animations is flat
- [ ] Masks / blends / clips used somewhere (§3–9); zero means flat
- [ ] Entrances are scroll-*triggered*, not scroll-*linked*, unless bound to position on purpose
- [ ] Every entrance has a defined resting state under reduced motion
- [ ] Nothing important is gated behind a scroll the user may not perform
- [ ] Total stagger for any group under 500ms
- [ ] `tabular-nums` on any animating figure
- [ ] **The rendered page has been looked at** — see `verification.md`
