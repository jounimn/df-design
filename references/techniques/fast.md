# Fast techniques

Fast expensive loading: the page arrives at once and moves with CSS or SVG only, with no script that the effect depends on. The tier is described in [audition.md §4](../audition.md#4-loading-cost-cheapest-viable-option-first); this file does not restate it.

| Technique | What the visitor sees | Suits |
|---|---|---|
| [Ambient dot grid](#ambient-dot-grid) | A field of dots whose brightness rises and falls one by one | Product and developer brands |
| [Corner glow](#corner-glow) | A soft light in the corner of a card | Dark product interfaces |
| [Edge fade](#edge-fade) | A row or panel that dissolves at its cut edges | Any row that runs past the page edge |
| [Dot grid and hairlines as masks](#dot-grid-and-hairlines-as-masks) | A dotted field or a fine line that fades along its length | Technical, plan-like and Swiss brands |
| [Noise](#noise) | A fine grain over a flat colour | Print, paper and zine brands |
| [Shimmer sweep](#shimmer-sweep) | A band of light that crosses a placeholder | Live products, loading states |
| [Marquee](#marquee) | A line of logos or words that never stops sliding | Labels, publishers, sponsor rows |
| [Additive blends on a dark ground](#additive-blends-on-a-dark-ground) | Lines and panels that glow against a dark page | Neon, night and dashboard brands |
| [Scroll-linked](#scroll-linked) | Things that arrive as the visitor scrolls | Editorial and long-read brands |
| [Sticky narrative](#sticky-narrative) | Text that holds still while the evidence moves past | Explainers and data stories |
| [Counters that mean something](#counters-that-mean-something) | A number that counts to its value and shows its direction | Finance, climate and data brands |
| [Text that performs its sentence](#text-that-performs-its-sentence) | Letters that act out what the headline says | Expressive type and music brands |
| [Image reveal through the identity's device](#image-reveal-through-the-identitys-device) | A picture that enters the way its medium would | Print, photography and halftone brands |
| [Particles](#particles) | A few dozen points that drift and fade behind the content | Generative, AI and night-time brands |
| [Liquid morph](#liquid-morph) | Soft shapes that stretch toward each other and merge like drops | Calm, friendly and organic brands |
| [Holographic](#holographic) | A surface whose rainbow sheen turns as if tilted in the light | Collectibles, beauty and music |
| [Neon glow](#neon-glow) | Letters or lines that glow like a tube sign in the dark | Night, nightlife and arcade brands |
| [Wireframe 3D](#wireframe-3d) | A solid drawn as bare edges that turns in space | Technical, plan-like and sci-fi brands |
| [Glassmorphism](#glassmorphism) | A frosted panel through which the colours behind it blur | OS-like products, dashboards over imagery |
| [Gradient mesh](#gradient-mesh) | Large soft pools of colour that slowly trade places | Fintech, AI and launch pages |
| [Split-flap](#split-flap) | Letters that flip into place like an airport board | Travel, timetables and retro hardware |
| [Retro VHS](#retro-vhs) | A picture that looks played from an old tape | Nostalgia, music and game brands |
| [Halftone](#halftone) | A picture or field built from dots that grow and shrink with tone | Print, music and campaign brands |
| [CSS 3D objects](#css-3d-objects) | A coin, a box or a ring of words turning in real depth | Objects with a front, a back and an edge |
| [Dither](#dither) | A photograph printed in two inks through a screen of dots | Low-tech, zine and newsprint brands |

## Ambient dot grid

### What it is

A field of small dots behind the hero, where each dot brightens and dims on its own schedule so the whole field looks alive.

### Where it comes from

A dot matrix is a two-dimensional array of dots that stands for characters and images; one woven example dates from 1858, made on a loom steered by punched cards ([Wikipedia, Dot matrix](https://en.wikipedia.org/wiki/Dot_matrix)).

### Suits

Product and developer brands that want a quiet sign of life: [Monochrome mono-type dev sites](../identities/digital.md#monochrome-mono-type-dev-sites), [AI lab](../identities/industry.md#ai-lab), [Data-viz-as-hero](../identities/digital.md#data-viz-as-hero).

### What it costs the visitor

On one site (linear.app, measured 2026-10-15) the page's motion code weighed 0 KB: the dot grid is only CSS and adds no script ([benchmarks](../benchmarks.md#canvas-and-webgl-measured-2026-10-15)).

### For the builder

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

- **Poster frame:** the resting opacity of the dots; nothing to draw.
- **Reduced motion:** the contract in `recipes-motion.md` §14; `.dot-grid i` is already in its resting-state rule.
- **Checks:** there is no canvas, so `check-motion.mjs` reports not applicable; look at the rendered page with and without the reduced-motion setting (`verification.md`, "Probe, do not squint").

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- linear.app, probed 2026-10-15: where the recipe was read. Motion code of the page 0 KB, no canvas and no named animation library.

## Corner glow

### What it is

A soft highlight that sits in one corner of a card and lights what lies underneath it.

### Where it comes from

A related effect, bloom (also called glow), imitates how a camera blurs bright light; it spread widely in games and high-contrast rendering after the authors of Tron 2.0 published on it in 2004 ([Wikipedia, Bloom](https://en.wikipedia.org/wiki/Bloom_(shader_effect))).

### Suits

Dark product interfaces with a few cards in a row: [Dark mode neon dashboard](../identities/digital.md#dark-mode-neon-dashboard), [AI lab](../identities/industry.md#ai-lab).

### What it costs the visitor

On one site (linear.app, measured 2026-10-15) the page's motion code weighed 0 KB: the glow is only CSS and adds no script ([benchmarks](../benchmarks.md#canvas-and-webgl-measured-2026-10-15)).

### For the builder

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

- **Poster frame:** the glow is static; it is its own poster.
- **Reduced motion:** nothing moves, so nothing changes.
- **Checks:** there is no canvas, so `check-motion.mjs` reports not applicable; look at the rendered page (`verification.md`, "Probe, do not squint").

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- linear.app, probed 2026-10-15: where the recipe was read ("Read verbatim off linear.app"). Motion code of the page 0 KB, no canvas and no named animation library.

## Edge fade

### What it is

The cut edges of a row, logo strip or table soften into the page, so the row reads as continuing rather than as broken.

### Where it comes from

Vignetting is a fall-off of brightness toward the edge of an image, which photographers sometimes choose on purpose ([Wikipedia, Vignetting](https://en.wikipedia.org/wiki/Vignetting)). The alpha channel that makes soft-edged masks possible was introduced by Alvy Ray Smith and Ed Catmull in the late 1970s ([Wikipedia, Alpha compositing](https://en.wikipedia.org/wiki/Alpha_compositing)).

### Suits

Any row that runs past the edge of the page: [Editorial design](../identities/print-craft.md#editorial-design), [Fintech trust](../identities/industry.md#fintech-trust).

### What it costs the visitor

On two sites (linear.app and hex.tech, measured 2026-10-15) the page's motion code weighed 0 KB and 70 KB, median 35 KB. The 70 KB is hex.tech's page, not the fade, which is only CSS ([benchmarks](../benchmarks.md#canvas-and-webgl-measured-2026-10-15)).

### For the builder

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

- **Poster frame:** the mask is static; it is its own poster.
- **Reduced motion:** nothing moves, so nothing changes.
- **Checks:** there is no canvas, so `check-motion.mjs` reports not applicable; look at the rendered page (`verification.md`, "Probe, do not squint").

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- linear.app (80px), probed 2026-10-15: where the recipe was read. Motion code of the page 0 KB.
- hex.tech (30px), probed 2026-10-15: where the recipe was read. Motion code of the page 70 KB, no canvas listed; that weight is the page's, not the fade's.

## Dot grid and hairlines as masks

### What it is

A dotted field or a one-pixel line drawn with no extra elements, and the line can fade along its length.

### Where it comes from

Squared paper is usually credited to Dr. Buxton of England, who patented paper printed with a rectangular grid in 1794 ([Wikipedia, Graph paper](https://en.wikipedia.org/wiki/Graph_paper)).

### Suits

Plan-like, technical and Swiss brands: [Blueprint / cyanotype](../identities/print-craft.md#blueprint--cyanotype), [Swiss design](../identities/historical.md#swiss-design), [Academic / research lab](../identities/industry.md#academic--research-lab).

### What it costs the visitor

On one site (hex.tech, measured 2026-10-15) the page's motion code weighed 70 KB. That weight is the page's, not the technique's: the masks are only CSS and add no script ([benchmarks](../benchmarks.md#canvas-and-webgl-measured-2026-10-15)).

### For the builder

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

- **Poster frame:** the mask is static; it is its own poster.
- **Reduced motion:** nothing moves, so nothing changes.
- **Checks:** there is no canvas, so `check-motion.mjs` reports not applicable; look at the rendered page (`verification.md`, "Probe, do not squint").

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- hex.tech, probed 2026-10-15: where the recipe was read. Motion code of the page 70 KB, no canvas listed; that weight is the page's, not the masks'.

## Noise

### What it is

A fine grain laid over a flat colour, like the tooth of paper or the speckle of film.

### Where it comes from

Film grain comes from small particles of metallic silver or clouds of dye left in developed film ([Wikipedia, Film grain](https://en.wikipedia.org/wiki/Film_grain)). Ken Perlin developed Perlin noise in 1982 because computer-made images looked machine-like, and described it in a 1985 paper ([Wikipedia, Perlin noise](https://en.wikipedia.org/wiki/Perlin_noise)).

### Suits

Print, paper and zine brands: [Archival newsprint](../identities/print-craft.md#archival-newsprint), [Halftone / duotone](../identities/print-craft.md#halftone--duotone), [Art-school indie (zine and riso)](../identities/cultural.md#art-school-indie-zine-and-riso).

### What it costs the visitor

On two sites (neon.tech and hex.tech, measured 2026-10-15) the page's motion code weighed 99 KB and 70 KB, median 84 KB. That weight belongs to other parts of those pages (neon.tech also runs animated drawings of its own), not to the grain, which is only CSS ([benchmarks](../benchmarks.md#canvas-and-webgl-measured-2026-10-15)).

### For the builder

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

- **Poster frame:** the grain at rest, without the drift.
- **Reduced motion:** the blanket rule in `recipes-motion.md` §14 stops the drift and leaves the still grain.
- **Checks:** there is no canvas, so `check-motion.mjs` reports not applicable; look at the rendered page with and without the reduced-motion setting (`verification.md`, "Probe, do not squint").

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- neon.tech (the noise mask), probed 2026-10-15: where the recipe was read. Motion code of the page 99 KB, with four animating 2D canvases that are not part of the recipe.
- hex.tech (the animated background position), probed 2026-10-15: where the recipe was read. Motion code of the page 70 KB, no canvas listed. In both, the weight is the page's, not the noise's.

## Shimmer sweep

### What it is

A band of light that slides across a placeholder or a single cue to say "this is live".

### Where it comes from

Facebook released Shimmer for iOS about a year before March 2015, then a similar Android component; the iOS one showed loading status in Paper and the Android one in Home. It works by moving a soft mask across a view drawn twice, once faint and once through the mask ([Facebook Engineering, Shimmer for Android](https://engineering.fb.com/2015/03/05/android/shimmer-for-android/)).

### Suits

Live products and loading states: [Fintech trust](../identities/industry.md#fintech-trust), [Dark mode neon dashboard](../identities/digital.md#dark-mode-neon-dashboard).

### What it costs the visitor

On one site (neon.tech, measured 2026-10-15) the page's motion code weighed 99 KB. That weight is the page's (it also runs animated drawings of its own), not the sweep's, which is only CSS ([benchmarks](../benchmarks.md#canvas-and-webgl-measured-2026-10-15)).

### For the builder

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

- **Poster frame:** the placeholder without the band.
- **Reduced motion:** the blanket rule in `recipes-motion.md` §14 stops the sweep.
- **Checks:** there is no canvas, so `check-motion.mjs` reports not applicable; look at the rendered page with and without the reduced-motion setting (`verification.md`, "Probe, do not squint").

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- neon.tech, probed 2026-10-15: where the recipe was read. Motion code of the page 99 KB, with four animating 2D canvases that are not part of the recipe; the weight is the page's, not the sweep's.

## Marquee

### What it is

A line of logos or words that slides sideways without end, at one constant speed.

### Where it comes from

The marquee element was first introduced in early versions of Microsoft's Internet Explorer as a non-standard extension ([Wikipedia, Marquee element](https://en.wikipedia.org/wiki/Marquee_element)). Its older cousin, ticker tape, carried stock prices over telegraph lines from about 1870 to 1970, and was invented in 1867 by Edward A. Calahan ([Wikipedia, Ticker tape](https://en.wikipedia.org/wiki/Ticker_tape)).

### Suits

Labels, publishers and sponsor rows: [Record label / musician](../identities/industry.md#record-label--musician), [Publishing / newsletter](../identities/industry.md#publishing--newsletter), [Y2K aesthetic](../identities/digital.md#y2k-aesthetic).

### What it costs the visitor

On one site (hex.tech, measured 2026-10-15) the page's motion code weighed 70 KB. That weight is the page's, not the marquee's, which is only CSS ([benchmarks](../benchmarks.md#canvas-and-webgl-measured-2026-10-15)).

### For the builder

```css
/* hex.tech: @keyframes ticker { 0% { translateX(0) } 100% { translateX(-20%) } }
   The -20% works because the list is rendered five times. */
.ticker { display: flex; width: max-content; animation: ticker 40s linear infinite; }
@keyframes ticker { to { transform: translateX(-20%); } }
```

`linear` is correct here — it is the one case where constant speed is right,
because any easing makes a continuous loop visibly stutter at the seam.
Pair with the [Edge fade](#edge-fade) card.

**The ring.** The same endless row bent into a cylinder: panels stand on a
ring (`rotateY(i * 360/n deg) translateZ(r)` inside a `preserve-3d` parent),
it turns slowly by itself, and the visitor can drag it and let go, so it
keeps the speed of the throw and slows by friction. Without the script it is
a plain row that scrolls sideways, so every panel can still be read; the 3D
and the drag are added only when the script runs.

```css
.ring { display: flex; gap: 12px; overflow-x: auto; }            /* without the script: a row */
.js .ring-stage { overflow: clip; perspective: 1400px; height: 420px; display: grid; place-items: center; touch-action: pan-y; }
.js .ring { display: block; overflow: visible; position: relative; width: 200px; height: 280px; transform-style: preserve-3d; }
.js .ring figure { position: absolute; inset: 0; backface-visibility: hidden;
  transform: rotateY(calc(var(--i) * 36deg)) translateZ(min(340px, 62vw)); }
```

```js
// Drag sets the angle; release keeps the speed and friction stops it; with no hand on it, it turns slowly.
stage.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; lastT = e.timeStamp; speed = 0; stage.setPointerCapture(e.pointerId); });
stage.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  const dx = e.clientX - lastX, dt = Math.max(1, e.timeStamp - lastT);
  angle += dx * 0.25; speed = (dx * 0.25) / dt * 1000; lastX = e.clientX; lastT = e.timeStamp;
});
stage.addEventListener('pointerup', () => { dragging = false; if (reduce) speed = 0; });
stage.addEventListener('keydown', (e) => {                        // the arrow keys turn it one panel
  if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { angle += e.key === 'ArrowLeft' ? 36 : -36; speed = 0; e.preventDefault(); }
});
function spin(t) {                                                // runs only while the ring is on screen and the tab is visible
  const dt = last ? Math.min(0.05, (t - last) / 1000) : 0; last = t;
  if (!dragging) {
    speed *= Math.exp(-2.2 * dt);                                 // friction
    if (!stopped && !held && Math.abs(speed) < 6) speed += (6 - Math.abs(speed)) * Math.sign(speed || -1) * dt;   // the idle turn
    angle += speed * dt;
  }
  ring.style.transform = `rotateY(${angle}deg)`;
  if (visible && !document.hidden) requestAnimationFrame(spin); else last = 0;
}
```

A ring that turns by itself is a loop, so it owes a pause (`gates.md`, the
loop; `patterns.md`, "A loop that can pause"): `held` is true while the
pointer is over the stage or focus is inside it, and `stopped` is a visible
button, "Stop the turning", with `aria-pressed`, and starts true under reduced
motion. The stage is focusable with a label that says how to turn it. Clip the stage
(`overflow: clip`) and cap the radius on a phone, or the panels at the sides
push the page sideways: the first build scrolled 549 px wide at 390. Under
reduced motion the ring does not turn by itself and a throw stops where it is
let go. A mirror under the ring is the [Reflective water
floor](high.md#reflective-water-floor) card. Built in
`docs/examples/motion-techniques/dom-recipes/page.html`.

**The ring as a sphere, and the drum you walk into.** Stand the panels on a
sphere instead of a circle (spread by the golden angle) and light each by how
much it faces you, or hang them inside a ring and move the camera from outside
to the middle as the page scrolls: both need a few lines of script and are the
Medium [CSS 3D objects](medium.md#css-3d-objects) card, measured on
`docs/examples/motion-techniques/css-3d/sphere.html`.

- **Poster frame:** the row at its start position.
- **Reduced motion:** the blanket rule in `recipes-motion.md` §14 stops the slide; the row stays readable at rest.
- **Checks:** there is no canvas, so `check-motion.mjs` reports not applicable; look at the rendered page with and without the reduced-motion setting (`verification.md`, "Probe, do not squint").

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- hex.tech, probed 2026-10-15: where the recipe was read. Motion code of the page 70 KB, no canvas listed; the weight is the page's, not the marquee's.
- docs/examples/motion-techniques/dom-recipes/page.html, the ring, served over http on 2026-11-07: readable without scripts as a row, `check-slop --render` 0 FAIL after the stage was clipped; a few hundred bytes of script, no library.

## Additive blends on a dark ground

### What it is

Lines and panels that glow against a dark page, because light adds to light and dark disappears.

### Where it comes from

Screen and Multiply are the basic lightening and darkening blend modes of graphics editors, and the names used on the web follow the W3C Compositing and Blending specification ([Wikipedia, Blend modes](https://en.wikipedia.org/wiki/Blend_modes)).

### Suits

Neon, night and dashboard brands: [Dark mode neon dashboard](../identities/digital.md#dark-mode-neon-dashboard), [Synthwave](../identities/digital.md#synthwave), [Cyberpunk](../identities/digital.md#cyberpunk).

### What it costs the visitor

On two sites (linear.app, measured 2026-10-15, and stripe.com, measured 2026-10-14) the page's motion code weighed 0 KB and 315 KB, median 157 KB. The 315 KB is the animated gradient in stripe.com's hero, not the blends the card cites, which are only CSS ([benchmarks](../benchmarks.md#canvas-and-webgl-measured-2026-10-15)).

### For the builder

Linear's glowing hairlines and haloed panels are `mix-blend-mode`, measured
at `overlay` ×7, `lighten` ×6, `screen` ×5.

```css
.glow-line { mix-blend-mode: screen; }    /* light adds, dark disappears */
.tint-panel { mix-blend-mode: overlay; }  /* keeps the underlying texture */
```

Rule of thumb: `screen` / `lighten` on dark grounds, `multiply` on light
ones (Stripe ships `multiply` ×4). A blend mode on the wrong ground does
nothing at all, silently.

- **Poster frame:** the blend is static; it is its own poster.
- **Reduced motion:** nothing moves, so nothing changes.
- **Checks:** there is no canvas, so `check-motion.mjs` reports not applicable; look at the rendered page on the real ground (`verification.md`, "Probe, do not squint"), since a wrong ground shows nothing.

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- linear.app (`overlay` ×7, `lighten` ×6, `screen` ×5), probed 2026-10-15: where the counts were read. Motion code of the page 0 KB.
- stripe.com (`multiply` ×4), probed 2026-10-14: where the count was read. Motion code of the page 315 KB, which is the WebGL gradient in its hero (the High "Gradient mesh" row), not the blends; its canvases are left out of this row.

## Scroll-linked

### What it is

Things that arrive or shift as the visitor scrolls, so the page seems to answer the hand.

### Where it comes from

Moon Patrol (1982) implemented a full form of parallax scrolling, with three background layers moving at different speeds, and is often credited with popularising it ([Wikipedia, Parallax scrolling](https://en.wikipedia.org/wiki/Parallax_scrolling)).

### Suits

Editorial and long-read brands: [Editorial design](../identities/print-craft.md#editorial-design), [Book-like long read](../identities/print-craft.md#book-like-long-read), [Publishing / newsletter](../identities/industry.md#publishing--newsletter).

### What it costs the visitor

not measured: the recipe cites no production site that can be probed.

### For the builder

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

**The wordmark between two planes.** Three planes, the type in the middle
one: the ground (a colour or a photograph), the giant wordmark, and the
subject cut out of its photograph in front, so the letters pass behind the
loaf, the house or the person. On scroll the letters spread. It is the
depth-plane idea of `recipes-motion.md` §17 with type as one of the planes,
and it costs one cut-out picture and no script. Cut the subject out with
the skill's own tool (`node scripts/cutout.mjs remove-bg photo.jpg
--quality high`, `images.md`), look at the edge at 100 %, then save it as
WebP: the example's PNG was 623 KB and its WebP 99 KB.
When the planes are a modelled scene rather than photographs (a hill in
front of the letters, a temple behind them, both lit), the wordmark stands at a
depth inside the scene: that is the [Real-time 3D world](yolo.md#real-time-3d-world)
card's job, not a page-layer recipe.

```html
<section class="sandwich" aria-label="The word Forno behind a loaf">
  <p class="word" aria-hidden="true">Forno</p>
  <img src="loaf.webp" alt="A round loaf of bread, cut out from its photograph" width="800" height="765">
</section>
```

```css
.sandwich { position: relative; height: 120svh; overflow: clip; background: var(--ground-deep); }
.sandwich .word { position: absolute; inset: 18svh 0 auto; text-align: center; color: var(--paper);
  font: 700 clamp(90px, 22vw, 340px)/0.8 var(--face-display); letter-spacing: -0.04em; margin: 0; }
.sandwich img { position: absolute; left: 50%; bottom: 0; width: min(80vw, 800px); translate: -50% 18%; }
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .sandwich .word { animation: spread linear both; animation-timeline: view(); animation-range: cover 0% cover 60%; }
  }
}
@keyframes spread { from { letter-spacing: -0.04em; } to { letter-spacing: 0.06em; } }
```

The word is `aria-hidden`, because the section's label already says it, and
the picture keeps its alt text. Put the word's top edge where the subject's
silhouette is lowest, so the letters read before they disappear behind it.
Built and checked in `docs/examples/motion-techniques/dom-recipes/page.html`.

- **Poster frame:** the finished state, which is also the default.
- **Reduced motion:** the recipe only animates under `no-preference`; every entrance also needs its resting state (`recipes-motion.md` §14).
- **Checks:** there is no canvas, so `check-motion.mjs` reports not applicable; scroll the rendered page with and without the reduced-motion setting (`verification.md`, "Probe, do not squint").

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- docs/examples/motion-techniques/dom-recipes/page.html, the example page for the wordmark between two planes and the other recipes added on 2026-11-07, served over http: `check-motion` passes the fast tier (all 28 content items readable without scripts), `check-slop --render` 0 FAIL and 0 Reflex, the wheel recording reached the end with no stalls; 107 KB in all, 97 KB of it the cut-out picture.

- No site is cited by the recipe, so none was probed on 2026-10-15; the support figure (~84% global) is the recipe's own. Cost not measured.

## Sticky narrative

### What it is

The copy holds still while the evidence moves past it, so the reader keeps the claim in view while the proof goes by.

### Where it comes from

The style is often called "snowfall" after The New York Times piece "Snow Fall", published online in December 2012. Creative Bloq describes it as editorial layout joined to parallax scrolling and web video, as the BBC brought it into the mainstream ([Creative Bloq, Snowfall](https://www.creativebloq.com/web-design/snowfall-51411702)).

### Suits

Explainers and data stories: [Editorial design](../identities/print-craft.md#editorial-design), [Data-viz-as-hero](../identities/digital.md#data-viz-as-hero), [Book-like long read](../identities/print-craft.md#book-like-long-read).

### What it costs the visitor

not measured: the sites it names (Antigravity and Observable) have no address that can be probed.

### For the builder

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

**The sticky stack.** The same hold, turned into cards: each card sticks at
the top a few pixels below the last, the next one rides up over it, and the
held card shrinks back a little as it is covered, so the steps of a process
pile up instead of scrolling away. CSS only: `position: sticky` and a scroll
timeline on each card's own exit.

```css
.card { position: sticky; top: 12vh; height: 60svh; transform-origin: 50% 0; }
.card:nth-child(2) { top: calc(12vh + 18px); }
.card:nth-child(3) { top: calc(12vh + 36px); }      /* each one stops a little lower: the pile shows its edges */
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .card { animation: settle linear both; animation-timeline: view(); animation-range: exit-crossing 0% exit-crossing 100%; }
  }
}
@keyframes settle { to { scale: 0.92; filter: brightness(0.9); } }
```

Three to five cards; past that the pile is a slide deck. Without scroll
timelines the cards still stack, they only do not shrink. Built in
`docs/examples/motion-techniques/dom-recipes/page.html`.

- **Poster frame:** the stage at its first position.
- **Reduced motion:** show the stage at rest, or stack the pieces in reading order (`recipes-motion.md` §14).
- **Checks:** there is no canvas, so `check-motion.mjs` reports not applicable; scroll the rendered page with and without the reduced-motion setting (`verification.md`, "Probe, do not squint").

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- Antigravity and Observable (27 sticky elements): where the pattern was read. Named without a URL, so not probed on 2026-10-15. Cost not measured.
- docs/examples/motion-techniques/dom-recipes/page.html, served over http on 2026-11-07: the sticky stack; `check-motion --tier fast` passes (readable without scripts), `check-slop --render` 0 FAIL and 0 Reflex, the wheel recording reached the end with no stalls. A few hundred bytes of script and CSS each; the page is 107 KB in all, 97 KB of it one picture.

## Counters that mean something

### What it is

A number that counts to its value and shows its direction, so the count is information and not decoration.

### Where it comes from

Odometers, which count distance travelled, existed in the ancient Greco-Roman world and in ancient China ([Wikipedia, Odometer](https://en.wikipedia.org/wiki/Odometer)).

### Suits

Finance, climate and data brands: [Fintech trust](../identities/industry.md#fintech-trust), [Climate tech](../identities/industry.md#climate-tech), [Data-viz-as-hero](../identities/digital.md#data-viz-as-hero).

### What it costs the visitor

not measured: the recipe cites no production site that can be probed.

### For the builder

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

**The odometer.** The same number rolled instead of counted: each digit is a
column of 0 to 9 in a window one figure tall, moved up by its value, the
columns starting a beat apart from the right like a mechanical counter. The
browser animates a transform, so no frame is computed in script, and the
figure is the real number in the HTML until the script splits it.

```html
<div class="odo" data-odo="4817" aria-label="4817">4817</div>
```

```css
.odo { font-variant-numeric: tabular-nums; display: inline-flex; overflow: hidden; height: 1em; line-height: 1; }
.odo .col { display: flex; flex-direction: column; transition: transform 1.6s var(--ease-signature); transition-delay: calc(var(--k) * 90ms); }
.odo .col span { height: 1em; }
@media (prefers-reduced-motion: reduce) { .odo .col { transition: none; } }
```

```js
for (const el of document.querySelectorAll('[data-odo]')) {
  const digits = el.dataset.odo.split('');
  el.innerHTML = digits.map((d, k) => `<span class="col" aria-hidden="true" style="--k:${digits.length - 1 - k}">${
    [...'0123456789'].map((n) => `<span>${n}</span>`).join('')}</span>`).join('');
}
// when the figure is half on screen (an IntersectionObserver, once):
el.querySelectorAll('.col').forEach((col, k) => { col.style.transform = `translateY(-${digits[k]}em)`; });
```

A preloader that counts from 0 to 100 % is this card only when the number is
the real progress of real loading (`recipes-motion.md` §24); a counter that
runs on a timer over a page that is already there is the most repeated tell of
the template catalogue read on 2026-11-07 (eleven of its 59 pages). No
script gate catches it; it is for the finish review to judge (`reviews.md`). Built in
`docs/examples/motion-techniques/dom-recipes/page.html`.

- **Poster frame:** the final number.
- **Reduced motion:** the hook sets the target at once.
- **Checks:** there is no canvas, so `check-motion.mjs` reports not applicable; look at the rendered page with and without the reduced-motion setting (`verification.md`, "Probe, do not squint").

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- No site is cited by the recipe, so none was probed on 2026-10-15. Cost not measured.
- docs/examples/motion-techniques/dom-recipes/page.html, served over http on 2026-11-07: the odometer; `check-motion --tier fast` passes (readable without scripts), `check-slop --render` 0 FAIL and 0 Reflex, the wheel recording reached the end with no stalls. A few hundred bytes of script and CSS each; the page is 107 KB in all, 97 KB of it one picture.

## Text that performs its sentence

### What it is

Letters that act out what the headline says: scattered things that converge under a line about bringing things together.

### Where it comes from

Scholars recognise Alfred Hitchcock's *North by Northwest* (1959) as the first feature film to use kinetic typography widely; Saul Bass's title sequence had the credits fly in from off-screen, and he used a similar technique in *Psycho* (1960) ([Wikipedia, Kinetic typography](https://en.wikipedia.org/wiki/Kinetic_typography)).

### Suits

Expressive type and music brands: [Grid-breaking experimental typography](../identities/print-craft.md#grid-breaking-experimental-typography), [Swiss Punk / New Wave typography](../identities/historical.md#swiss-punk--new-wave-typography), [Record label / musician](../identities/industry.md#record-label--musician).

### What it costs the visitor

not measured: the recipe cites no production site that can be probed.

### For the builder

Split-text is worth it only when the motion restates the meaning — letters
scattering and converging under a headline about consolidating scattered
things. Otherwise it is noise. This card absorbs the former kinetic type recipe.

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

Three named variants, read from a catalogue of WebGL template pages on
2026-11-07 and built in `docs/examples/motion-techniques/dom-recipes/page.html`.
Each splits the text into words with a small script and keeps the sentence in
`aria-label`; each is visible when the script never runs.

**Blur to focus.** Words arrive out of focus and sharpen, one after another.
Blur words, never the block: a blur filter on a 100 px heading repaints the
whole box every frame. About 1.1 s on the dramatic curve, a 40 ms stagger,
10 px of blur (the `cinematic-gsap-lenis-motion-system` skill, Meng To, MIT,
gives 8 to 10 px and a 35 to 70 ms word stagger).

```css
.js .focus-in .w { display: inline-block; filter: blur(10px); opacity: 0; transform: translateY(0.25em);
  transition: filter 1.1s var(--ease-dramatic), opacity 1.1s var(--ease-dramatic), transform 1.1s var(--ease-dramatic);
  transition-delay: calc(var(--i) * 40ms); }
.js .focus-in.in .w { filter: none; opacity: 1; transform: none; }       /* .in is added once, on entry */
@media (prefers-reduced-motion: reduce) {
  .js .focus-in .w { filter: none; transform: none; transition: opacity 0.4s linear; }   /* opacity only */
}
```

It is the entrance twelve of the 59 template pages give every heading. Used
once, on the line that is about focus or arrival, it says something; on every
heading it is the generated-page tell this skill exists to catch. No script
gate measures it yet, so the finish review judges it (`reviews.md`).

**Reading fill.** Every word starts pale and takes the ink as the paragraph
crosses the middle of the screen, so the bright edge of the colour is the
reader's place. Pure CSS on a scroll timeline; where scroll timelines are
missing, or under reduced motion, the words are simply ink.

```css
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    .fill .w { animation: ink linear both; animation-timeline: view(); animation-range: cover 25% cover 50%; }
  }
}
@keyframes ink { from { opacity: 0.18; } to { opacity: 1; } }
```

Each word has its own view timeline, so the fill runs line by line down the
paragraph without a script driving it. Keep it to one paragraph that is worth
reading slowly; a page of it is homework.

**Scramble.** A label decodes: each letter cycles through random glyphs and
locks into place from left to right in about 0.7 s. Labels and figures only,
never a sentence someone has to read, and not at all under reduced motion.

```js
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function scramble(el, dur = 700) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const text = el.textContent; el.setAttribute('aria-label', text);
  const t0 = performance.now();
  const tick = (t) => {
    const p = Math.min(1, (t - t0) / dur), locked = Math.floor(p * text.length);
    el.textContent = [...text].map((c, i) => (i < locked || c === ' ' ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join('');
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
```

GSAP's ScrambleTextPlugin does the same with more options; it is free, under
GreenSock's own standard licence, not MIT.

- **Poster frame:** the headline settled.
- **Reduced motion:** the letters appear in place at once (`recipes-motion.md` §14).
- **Checks:** there is no canvas, so `check-motion.mjs` reports not applicable; look at the rendered page with and without the reduced-motion setting (`verification.md`, "Probe, do not squint").

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- No site is cited by the recipe, so none was probed on 2026-10-15. Cost not measured.
- docs/examples/motion-techniques/dom-recipes/page.html, served over http on 2026-11-07: the blur to focus, the reading fill and the scramble; `check-motion --tier fast` passes (readable without scripts), `check-slop --render` 0 FAIL and 0 Reflex, the wheel recording reached the end with no stalls. A few hundred bytes of script and CSS each; the page is 107 KB in all, 97 KB of it one picture.

## Image reveal through the identity's device

### What it is

A picture that enters the way its medium would: inked in like a press pass, developed like a darkroom print, or built from growing dots.

### Where it comes from

A wipe is a film transition in which one shot replaces another by travelling across the screen; the next scene was optically printed onto a moving object so that it "wiped" the previous shot ([Wikipedia, Wipe (transition)](https://en.wikipedia.org/wiki/Wipe_(transition))).

### Suits

Print, photography and halftone brands: [Halftone / duotone](../identities/print-craft.md#halftone--duotone), [Archival newsprint](../identities/print-craft.md#archival-newsprint), [Editorial design](../identities/print-craft.md#editorial-design).

### What it costs the visitor

not measured: the recipe cites no production site that can be probed.

### For the builder

An image enters the way its medium would. A mask or clip does the work
(the measured finding: masks, not more keyframes):

```css
/* Print / newsletter: the image is inked in, top to bottom, like a press pass. */
.img-ink { clip-path: inset(0 0 100% 0); transition: clip-path 900ms var(--ease-weighted); }
.img-ink.in-view { clip-path: inset(0 0 0 0); }

/* Darkroom / photography: develops from paper white, contrast arriving last. */
.img-develop { filter: grayscale(1) contrast(.4) brightness(1.6); transition: filter 1400ms ease-out; }
.img-develop.in-view { filter: none; }

/* Halftone / technical: dots grow until they overlap and the photo is whole.
   At an 8px cell, a 6px radius covers the cell corners (5.66px). */
@property --dot { syntax: "<length>"; inherits: false; initial-value: 0px; }
.img-halftone {
  mask-image: radial-gradient(circle, #000 var(--dot), transparent calc(var(--dot) + .5px));
  mask-size: 8px 8px;
  transition: --dot 900ms var(--ease-weighted);
}
.img-halftone.in-view { --dot: 6px; }

/* One treatment, every image: a duotone in the identity's ink and paper, applied in CSS
   so a new photo joins the set without an editing pass.
   Multiply onto the paper turns highlights into paper; lighten with the ink turns
   shadows into ink. The ink must be darker than the paper in every channel. */
.img-duotone { position: relative; isolation: isolate; background: rgb(var(--canvas)); }
.img-duotone img { display: block; filter: grayscale(1) contrast(1.1); mix-blend-mode: multiply; }
.img-duotone::after { content: ""; position: absolute; inset: 0; background: rgb(var(--brand)); mix-blend-mode: lighten; pointer-events: none; }
```

Trigger reveals on entering the viewport (`IntersectionObserver` adding
`.in-view`, or `animation-timeline: view()` as in the [Scroll-linked](#scroll-linked) card). They play
**once**, never again on every scroll back.

Rules:

- **Transform, opacity, filter, clip-path and mask only.** Never animate
  `width`, `height` or `top` on an image; it reflows the page. Set `width`
  and `height` attributes so nothing jumps when the image loads.
- **No continuous zoom or pan on content images.** A slow ambient move is
  allowed on at most one hero image, and only when the identity calls for it.
- **Never put `loading="lazy"` on an image that starts fully hidden by its
  own clip or mask.** Chromium can treat a fully clipped image as never
  visible, so it never loads, and the reveal waits forever. This shipped
  broken in the Faísca example build until it was looked at. Either load
  reveal images eagerly (`decoding="async"`), or put the clip on a wrapper,
  observe the wrapper, and only then set the image's `src`. Add `.in-view`
  after `img.decode()` resolves, or the mask opens onto an empty box:

```js
const io = new IntersectionObserver((entries) => entries.forEach(async (e) => {
  if (!e.isIntersecting) return;
  io.unobserve(e.target);
  const img = e.target.querySelector('img');
  if (img.dataset.src) img.src = img.dataset.src;   // wrapper pattern: load on approach
  try { await img.decode(); } catch {}                // reveal only a painted image
  e.target.classList.add('in-view');
}), { rootMargin: '200px 0px' });
document.querySelectorAll('.img-ink, .img-develop, .img-halftone').forEach((el) => io.observe(el));
```
- **Reduced motion:** images and icons show in their final state at once.
  Add them to the resting-state rule in `recipes-motion.md` §14:

```css
@media (prefers-reduced-motion: reduce) {
  .img-ink { clip-path: none !important; }
  .img-develop { filter: none !important; }
  .img-halftone { mask-image: none !important; }
  .icon-draw path { stroke-dashoffset: 0 !important; }
}
```

- **Poster frame:** the picture in its final state.
- **Checks:** there is no canvas, so `check-motion.mjs` reports not applicable; scroll the rendered page and confirm every image loads and ends up painted, with and without the reduced-motion setting (`verification.md`, "Probe, do not squint").

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- No site is cited by the recipe, so none was probed on 2026-10-15; the Faísca example build is the failure it was learned from. Cost not measured.

## Particles

### What it is

A few dozen small points that drift slowly behind the content, fading in and out like dust in a beam of light.

### Where it comes from

Particle systems were introduced in the 1982 film Star Trek II: The Wrath of Khan for the fictional Genesis effect, and in 1983 Reeves defined them as animated points used for sparks, rain, fire and similar phenomena ([Wikipedia, Particle system](https://en.wikipedia.org/wiki/Particle_system)).

### Suits

Brands that want a quiet sense of space or computation without a hero image: [Generative / creative-coding](../identities/digital.md#generative--creative-coding), [Cybercore](../identities/digital.md#cybercore), [AI lab](../identities/industry.md#ai-lab).

### What it costs the visitor

not measured

### For the builder

This is the Fast version: a hand-placed set of points in one SVG, moved by CSS, with no script. Write the points out (a short seeded list at build time is enough) and give each its own drift, duration and delay. Irregular timing is what separates dust from a loading pattern.

```html
<svg class="particles" viewBox="0 0 320 300" aria-hidden="true">
  <circle cx="40"  cy="60"  r="3" style="--t:7s;  --d:-1s; --dx:20px;  --dy:30px"/>
  <circle cx="120" cy="40"  r="2" style="--t:9s;  --d:-4s; --dx:-18px; --dy:26px"/>
  <circle cx="200" cy="90"  r="4" style="--t:8s;  --d:-2s; --dx:24px;  --dy:-14px"/>
  <!-- ...repeat with other positions and values -->
</svg>
```

```css
.particles { position: absolute; inset: 0; width: 100%; height: 100%; }
.particles circle {
  fill: rgb(var(--ink));
  opacity: 0.5;
  transform-box: fill-box;        /* the drift is measured from each point */
  transform-origin: center;
  animation: drift var(--t) var(--ease-signature) var(--d) infinite alternate;
}
@keyframes drift {
  from { transform: translate(0, 0); opacity: 0.2; }
  to   { transform: translate(var(--dx), var(--dy)); opacity: 0.9; }
}
@media (prefers-reduced-motion: reduce) {
  .particles circle { animation: none; opacity: 0.5; }
}
```

A negative delay starts every point mid-journey, so the field is already in motion on the first frame. If the idea needs thousands of points, or points that react to the pointer, it is a Medium or High technique (`audition.md` §4), not this one.

- **Poster frame:** the SVG as written, with every point at its resting position and opacity.
- **Reduced motion:** the contract in `recipes-motion.md` §14; the rule above drops the animation and keeps the field.
- **Checks:** there is no canvas, so `check-motion.mjs` reports not applicable; look at the rendered page with and without the reduced-motion setting (`verification.md`, "Probe, do not squint").

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- No site was measured at this tier. Cost not measured.

## Liquid morph

### What it is

Two or three soft shapes that stretch toward each other and merge, the way drops of liquid join when they touch.

### Where it comes from

The merging shapes come from metaballs, organic-looking forms that meld together when they come close; the technique was invented by Jim Blinn in the early 1980s to model atom interactions for Carl Sagan's 1980 series Cosmos ([Wikipedia, Metaballs](https://en.wikipedia.org/wiki/Metaballs)).

### Suits

Calm, friendly and soft-technology brands: [Blob / fluid organic shapes](../identities/digital.md#blob--fluid-organic-shapes), [Aurora / mesh gradients](../identities/digital.md#aurora--mesh-gradients), [Generative / creative-coding](../identities/digital.md#generative--creative-coding).

### What it costs the visitor

not measured

### For the builder

The Fast version is an SVG filter: blur the shapes, then raise the contrast of the alpha channel so the blurred edges snap back into a solid outline. Where two shapes overlap their blurs add up and the outline bridges the gap.

```html
<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <filter id="goo" x="-20%" y="-20%" width="140%" height="140%">
    <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="b"/>
    <feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"/>
  </filter>
</svg>
<div class="goo" aria-hidden="true"><i></i><i></i></div>
```

```css
.goo { position: absolute; inset: 0; filter: url(#goo); }
.goo i { position: absolute; top: 105px; width: 90px; height: 90px; border-radius: 50%; background: rgb(var(--ink)); }
.goo i:nth-child(1) { left: 60px;  animation: goo-a 5s var(--ease-signature) infinite alternate; }
.goo i:nth-child(2) { left: 170px; animation: goo-b 5s var(--ease-signature) infinite alternate; }
@keyframes goo-a { to { transform: translateX(45px); } }
@keyframes goo-b { to { transform: translateX(-45px); } }
@media (prefers-reduced-motion: reduce) {
  .goo i { animation: none; }
  .goo i:nth-child(1) { transform: translateX(30px); }    /* rest while already merged */
  .goo i:nth-child(2) { transform: translateX(-30px); }
}
```

The last two numbers of the matrix (`19 -9`) set how hard the edge snaps: a higher first number gives a sharper edge and a more negative second one eats more of the blur. Keep text outside the filtered group, because the blur softens anything inside it. The filter repaints its whole box on every frame, so keep the group to the size of the shapes, not of the section.

- **Poster frame:** the shapes at the reduced-motion rest positions above, already joined.
- **Reduced motion:** the contract in `recipes-motion.md` §14; the rule above stops the shapes at a merged rest.
- **Checks:** there is no canvas, so `check-motion.mjs` reports not applicable; look at the rendered page with and without the reduced-motion setting (`verification.md`, "Probe, do not squint").

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- No site was measured for this technique. Cost not measured.

## Holographic

### What it is

A surface whose rainbow sheen seems to turn as if the card were tilted in the light.

### Where it comes from

Dennis Gabor invented holography in 1948 while trying to sharpen electron microscope images, and won the Nobel Prize in Physics for it in 1971; holograms are now often used for security because they are hard to forge, which is why a shimmering foil on a card reads as genuine ([Wikipedia, Holography](https://en.wikipedia.org/wiki/Holography)).

### Suits

Collectible, beauty and music brands that sell novelty and premium: [Holographic / iridescent](../identities/digital.md#holographic--iridescent), [Y2K aesthetic](../identities/digital.md#y2k-aesthetic), [Cybercore](../identities/digital.md#cybercore).

### What it costs the visitor

not measured

### For the builder

This is the Fast version: a conic gradient that turns, with a fine diagonal pattern blended over it for the foil grain. The angle is a registered custom property, so the gradient itself can be animated.

```css
@property --a { syntax: '<angle>'; inherits: false; initial-value: 30deg; }

.holo {
  --a: 30deg;
  position: relative;
  border-radius: 16px;
  background: conic-gradient(from var(--a) at 50% 50%,
    #ff6ec7, #7873f5, #4adede, #7cf29a, #ffe66d, #ff6ec7);
  animation: holo-turn 8s linear infinite;
}
.holo::after {                       /* the foil grain */
  content: ''; position: absolute; inset: 0; border-radius: inherit;
  background: repeating-linear-gradient(115deg, rgb(255 255 255 / .35) 0 2px, transparent 2px 9px);
  mix-blend-mode: overlay;
}
@keyframes holo-turn { to { --a: 390deg; } }
@media (prefers-reduced-motion: reduce) { .holo { animation: none; } }
```

Animating a custom property repaints the gradient on every frame, so use it on one element of card size, not on a full-width section. A browser without the property registration shows the gradient at its starting angle, which is still a holographic surface. Put text on a solid chip, not directly on the gradient: a rainbow has no single contrast.

- **Poster frame:** the gradient at `--a: 30deg`.
- **Reduced motion:** the contract in `recipes-motion.md` §14; the rule above leaves the poster frame.
- **Checks:** there is no canvas, so `check-motion.mjs` reports not applicable; look at the rendered page with and without the reduced-motion setting (`verification.md`, "Probe, do not squint").

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- No site was measured at this tier. Cost not measured.

## Neon glow

### What it is

Letters or lines that glow with coloured light, like a tube sign in a dark street.

### Where it comes from

Georges Claude presented neon tube lighting in essentially its modern form at the Paris Motor Show in December 1910, and it became very popular for signs and displays between 1920 and 1940 ([Wikipedia, Neon lighting](https://en.wikipedia.org/wiki/Neon_lighting)).

### Suits

Night, nightlife and arcade brands: [Dark mode neon dashboard](../identities/digital.md#dark-mode-neon-dashboard), [Synthwave](../identities/digital.md#synthwave), [Cyberpunk](../identities/digital.md#cyberpunk).

### What it costs the visitor

not measured

### For the builder

A neon sign is a bright core and a coloured halo that falls off with distance, so stack the shadow from tight to wide. The text stays white and readable; the colour lives in the glow.

```css
.neon {
  --neon: #ff2bd6;
  color: #fff;
  text-shadow: 0 0 4px #fff, 0 0 12px var(--neon), 0 0 28px var(--neon), 0 0 56px var(--neon);
  animation: neon-hum 7s linear infinite;
}
.neon-icon { filter: drop-shadow(0 0 6px var(--neon)) drop-shadow(0 0 18px var(--neon)); }  /* shapes and icons */
@keyframes neon-hum {                 /* one slow dip, never a strobe */
  0%, 46%, 50%, 100% { opacity: 1; }
  48% { opacity: .55; }
}
@media (prefers-reduced-motion: reduce) { .neon { animation: none; } }
```

It only works on a dark ground; on a light page the halo has nothing to glow against. If the sign flickers, keep it to a single slow dip, and never more than three flashes in any one second (WCAG 2.3.1, three flashes or below threshold). A glow that spills over neighbouring text lowers its contrast, so give the sign room.

**A lightning edge.** The sign's tube as a crackling border: the perimeter of a card walked in short steps, each point pushed out along the normal by noise that changes a few times a second, stroked twice (wide and faint, then thin and bright) with `globalCompositeOperation = 'lighter'`. It needs a drawing loop, so it is Medium weight and not this tier; it was not measured here. Keep it to one element, never more than three flashes a second (WCAG 2.3.1), and still under reduced motion.

```js
function edge(ctx, w, h, t) {
  const pts = [], step = 6, per = 2 * (w + h), tick = Math.floor(t * 12);   // twelve new shapes a second
  for (let s = 0; s < per; s += step) {
    const [x, y, nx, ny] = s < w ? [s, 0, 0, -1] : s < w + h ? [w, s - w, 1, 0] : s < 2 * w + h ? [w - (s - w - h), h, 0, 1] : [0, h - (s - 2 * w - h), -1, 0];
    const k = (Math.sin(s * 0.13 + tick * 7.1) + Math.sin(s * 0.051 - tick * 3.3)) * 3;
    pts.push([x + nx * k, y + ny * k]);
  }
  ctx.globalCompositeOperation = 'lighter';
  for (const [width, alpha] of [[6, 0.25], [1.5, 1]]) {
    ctx.lineWidth = width; ctx.globalAlpha = alpha; ctx.beginPath();
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath(); ctx.stroke();
  }
}
```

- **Poster frame:** the glowing text at full opacity.
- **Reduced motion:** the contract in `recipes-motion.md` §14; the rule above removes the dip and keeps the glow.
- **Checks:** there is no canvas, so `check-motion.mjs` reports not applicable; look at the rendered page on the real dark ground (`verification.md`, "Probe, do not squint"), since the same shadow shows nothing on a light one.

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- No site was measured for this technique. Cost not measured.

## Wireframe 3D

### What it is

A solid drawn as bare edges, with nothing between them, turning slowly in space.

### Where it comes from

The term wire frame comes from designers using metal wire to represent the three-dimensional shape of solid objects; the computer model draws only the edges where surfaces meet ([Wikipedia, Wire-frame model](https://en.wikipedia.org/wiki/Wire-frame_model)).

### Suits

Technical, plan-like and sci-fi brands: [Blueprint / cyanotype](../identities/print-craft.md#blueprint--cyanotype), [Retro CRT phosphor (amber / green)](../identities/digital.md#retro-crt-phosphor-amber--green), [Cyberpunk](../identities/digital.md#cyberpunk).

### What it costs the visitor

not measured

### For the builder

This is the Fast version: six faces, each a bordered box placed in 3D space by CSS, with no fill so only the edges show. Back faces stay visible, which is what makes it a wire model.

```html
<div class="scene" aria-hidden="true">
  <div class="cube"><b></b><b></b><b></b><b></b><b></b><b></b></div>
</div>
```

```css
.scene { perspective: 700px; display: grid; place-items: center; }
.cube {
  --s: 130px; --h: 65px;                       /* edge length and its half */
  width: var(--s); height: var(--s); position: relative;
  transform-style: preserve-3d;
  transform: rotateX(-20deg) rotateY(35deg);   /* the resting pose */
  animation: cube-turn 18s linear infinite;
}
.cube b { position: absolute; inset: 0; border: 1px solid rgb(var(--ink)); }
.cube b:nth-child(1) { transform: translateZ(var(--h)); }
.cube b:nth-child(2) { transform: rotateY(180deg) translateZ(var(--h)); }
.cube b:nth-child(3) { transform: rotateY(90deg)  translateZ(var(--h)); }
.cube b:nth-child(4) { transform: rotateY(-90deg) translateZ(var(--h)); }
.cube b:nth-child(5) { transform: rotateX(90deg)  translateZ(var(--h)); }
.cube b:nth-child(6) { transform: rotateX(-90deg) translateZ(var(--h)); }
@keyframes cube-turn {
  from { transform: rotateX(-20deg) rotateY(35deg); }
  to   { transform: rotateX(-20deg) rotateY(395deg); }
}
@media (prefers-reduced-motion: reduce) { .cube { animation: none; } }
```

The turn moves only a transform, so it stays off the main thread. Use it for boxes and flat plates; a curved or complex object needs real geometry, which is the High version's job (`audition.md` §4).

- **Poster frame:** the cube in its resting pose, `rotateX(-20deg) rotateY(35deg)`.
- **Reduced motion:** the contract in `recipes-motion.md` §14; the rule above holds the resting pose.
- **Checks:** there is no canvas, so `check-motion.mjs` reports not applicable; look at the rendered page with and without the reduced-motion setting (`verification.md`, "Probe, do not squint").

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- No site was measured at this tier. Cost not measured.

## Glassmorphism

### What it is

A frosted panel floating over colour, through which the shapes behind it show as a soft blur.

### Where it comes from

The term was coined by Michal Malewicz in 2020; Apple's macOS Big Sur, released that year, is an early example in an operating system, and Windows Vista and Windows 7, with their glass-like window borders, are named as precursors ([Wikipedia, Glassmorphism](https://en.wikipedia.org/wiki/Glassmorphism)).

### Suits

Dashboards over imagery, wellness and OS-like product shells: [Glassmorphism](../identities/digital.md#glassmorphism), [Liquid Glass (Apple 2025)](../identities/digital.md#liquid-glass-apple-2025), [Aurora / mesh gradients](../identities/digital.md#aurora--mesh-gradients).

### What it costs the visitor

On one site (apple.com, measured 2026-10-14) the page's motion code weighed 0 KB, so a still frosted panel needs no script to move. That figure is for the whole page, not for the panel, and the time the browser takes to paint the blur was never timed ([benchmarks](../benchmarks.md#canvas-and-webgl-measured-2026-10-15)).

### For the builder

This is the Fast version: one panel, or a very few, over a background that is already painted. The blur is applied to whatever sits behind the panel, so the panel needs a translucent fill and a thin light edge to read as glass.

```css
.glass {
  background: rgb(255 255 255 / .14);
  border: 1px solid rgb(255 255 255 / .3);
  border-radius: 18px;
  -webkit-backdrop-filter: blur(16px) saturate(140%);
  backdrop-filter: blur(16px) saturate(140%);
  box-shadow: 0 8px 32px rgb(0 0 0 / .18);
}
/* No blur available: give the panel an honest, nearly opaque fill. */
@supports not (backdrop-filter: blur(1px)) {
  .glass { background: rgb(40 30 90 / .72); }
}
/* The visitor asked for more contrast: drop the translucency. */
@media (prefers-contrast: more) {
  .glass { background: rgb(40 30 90 / .95); -webkit-backdrop-filter: none; backdrop-filter: none; }
}
```

The panel has something to blur only if the background has detail behind it (a gradient, a shape, a picture); over a flat colour it is just a tinted box. Check text contrast against the busiest part of the background that can sit behind it, not the calmest. Panels stacked across a page, or over video or a moving background, make the blur repaint continuously: that is the Medium version (`audition.md` §4), not this one.

- **Poster frame:** the panel as it is; nothing moves.
- **Reduced motion:** nothing moves, so nothing changes. If the background behind the panel moves, stop that movement under the contract in `recipes-motion.md` §14.
- **Checks:** there is no canvas, so `check-motion.mjs` reports not applicable; look at the rendered page and read the text on the glass at its lowest contrast (`verification.md`, "Probe, do not squint").

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- apple.com, probed 2026-10-14: motion code of the page 0 KB, DOM only, one site ([benchmarks](../benchmarks.md#canvas-and-webgl-measured-2026-10-15)). The weight is that of the whole page, so it shows the glass needs no script, not what the blur costs to paint.

## Gradient mesh

### What it is

Large, soft pools of colour that slowly trade places behind the content, with no visible edge between them.

### Where it comes from

In vector graphics a gradient can be spread over a mesh of points instead of along one line, and Adobe Illustrator supports such gradient meshes ([Wikipedia, Color gradient](https://en.wikipedia.org/wiki/Color_gradient)). The web version here imitates the look with blobs of colour rather than a true mesh.

### Suits

Fintech, AI and launch pages that want warmth and energy: [Aurora / mesh gradients](../identities/digital.md#aurora--mesh-gradients), [Gradient-grain](../identities/digital.md#gradient-grain), [Blob / fluid organic shapes](../identities/digital.md#blob--fluid-organic-shapes).

### What it costs the visitor

not measured

### For the builder

This is the Fast version: three or four large elements, each a radial gradient from a colour to transparent, drifting by a transform. Do not blur them with a filter: the gradient already fades to nothing at its edge, and a filter over a large area adds a rendering pass the gradient does not need.

```html
<div class="mesh" aria-hidden="true"><i></i><i></i><i></i></div>
```

```css
.mesh { position: absolute; inset: 0; overflow: hidden; background: #0f1020; }
.mesh i {
  position: absolute; width: 70%; aspect-ratio: 1; border-radius: 50%;
  background: radial-gradient(circle, var(--c) 0%, transparent 65%);
  opacity: .85;
  animation: mesh-float var(--t) var(--ease-signature) infinite alternate;
}
.mesh i:nth-child(1) { --c: #ff5f8f; --t: 11s; left: -15%; top: -20%; }
.mesh i:nth-child(2) { --c: #5f7bff; --t: 13s; right: -20%; top: 10%;   --dx: -12%; --dy: 8%; }
.mesh i:nth-child(3) { --c: #2ee6c4; --t: 15s; left: 10%;  bottom: -30%; --dx: 10%;  --dy: -6%; }
@keyframes mesh-float { to { transform: translate(var(--dx, 14%), var(--dy, 10%)); } }
@media (prefers-reduced-motion: reduce) { .mesh i { animation: none; } }
```

Long, different durations keep the pools from ever lining up in the same way twice. Sit text over the quietest region and check its contrast against the brightest pool that can move under it. A real mesh with controllable points, or colour that follows the pointer, is the High version.

- **Poster frame:** the pools at their starting positions, as the CSS places them.
- **Reduced motion:** the contract in `recipes-motion.md` §14; the rule above leaves the poster frame.
- **Checks:** there is no canvas, so `check-motion.mjs` reports not applicable; look at the rendered page with and without the reduced-motion setting (`verification.md`, "Probe, do not squint").

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- No site was measured at this tier. Cost not measured.

## Split-flap

### What it is

Letters that flip into place one by one, like the departures board in a station.

### Where it comes from

Split-flap displays were commonly used as timetables in airports and railway stations from the 1960s to the 1990s, and were often called Solari boards after the Italian maker Solari di Udine, or Pragotron in Central Europe after the Czech maker ([Wikipedia, Split-flap display](https://en.wikipedia.org/wiki/Split-flap_display)).

### Suits

Travel, timetables and retro hardware: [Skeuomorphism](../identities/digital.md#skeuomorphism), [Space Age / 60s retro-futurism](../identities/historical.md#space-age--60s-retro-futurism).

### What it costs the visitor

not measured

### For the builder

Each tile is four halves: the new top and the old bottom sit still, the old top falls forward, and the new bottom rises to meet it. One flip per tile, staggered by the tile's index, plays once on load. A board that keeps cycling through letters needs a script to set the next letter, which this tier does not have.

```html
<div class="board" role="img" aria-label="GATE">
  <span class="flap" style="--d:0s" aria-hidden="true"><i class="top">G</i><i class="bot">X</i><i class="fall">X</i><i class="rise">G</i></span>
  <span class="flap" style="--d:.15s" aria-hidden="true"><i class="top">A</i><i class="bot">X</i><i class="fall">X</i><i class="rise">A</i></span>
  <!-- one span per letter; --d grows by .15s each -->
</div>
```

```css
.board { display: flex; justify-content: center; font: 700 60px/1 ui-monospace, monospace; }
.flap {
  position: relative; display: inline-block; width: .75em; height: 1.25em; line-height: 1.25em;
  text-align: center; background: #16161a; color: #f2efe6; border-radius: .1em;
  perspective: 20em; margin: 0 .04em;
}
.flap i { position: absolute; inset: 0; background: inherit; border-radius: inherit; font-style: normal; backface-visibility: hidden; }
.flap .top,  .flap .fall { clip-path: inset(0 0 50% 0); }   /* upper half */
.flap .bot,  .flap .rise { clip-path: inset(50% 0 0 0); }   /* lower half */
.flap .fall { animation: flap-fall .3s ease-in var(--d) both; }
.flap .rise { transform: rotateX(90deg); animation: flap-rise .3s ease-out calc(var(--d) + .3s) both; }
.flap::after { content: ''; position: absolute; left: 0; right: 0; top: 50%; height: 2px; background: #000; z-index: 2; }  /* the hinge */
@keyframes flap-fall { to   { transform: rotateX(-90deg); } }
@keyframes flap-rise { from { transform: rotateX(90deg); } to { transform: rotateX(0); } }
@media (prefers-reduced-motion: reduce) {
  .flap .fall { display: none; }
  .flap .rise { animation: none; transform: none; }
}
```

The wrapper carries the readable label and the tiles are hidden from assistive technology, so a screen reader reads the word once, not letter by letter. The old letter can be anything; it only shows until its tile flips.

- **Poster frame:** every tile showing its new letter, which is what the reduced-motion rule leaves.
- **Reduced motion:** the contract in `recipes-motion.md` §14; the rule above skips the flip and shows the final letters.
- **Checks:** there is no canvas, so `check-motion.mjs` reports not applicable; look at the rendered page with and without the reduced-motion setting, and confirm the board ends on the new letters (`verification.md`, "Probe, do not squint").

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- No site was measured for this technique. Cost not measured.

## Retro VHS

### What it is

A picture that looks played from an old tape: faint horizontal lines, colour fringes on the edges of the letters and a pale band rolling slowly up the screen.

### Where it comes from

VHS (Video Home System) was a standard for consumer-level analogue video recording on tape cassettes, introduced on 9 September 1976 by the Victor Company of Japan (JVC) ([Wikipedia, VHS](https://en.wikipedia.org/wiki/VHS)).

### Suits

Nostalgia, music and game brands: [Vaporwave](../identities/digital.md#vaporwave), [Glitch art](../identities/digital.md#glitch-art), [Retro CRT phosphor (amber / green)](../identities/digital.md#retro-crt-phosphor-amber--green).

### What it costs the visitor

not measured

### For the builder

Three small layers over one hero: scan lines drawn as a repeating gradient, a red and cyan fringe on the headline made of two offset shadows, and a faint band that rolls down the frame. No script, no image.

```css
.vhs { position: relative; overflow: hidden; }
.vhs h2 { text-shadow: -2px 0 rgb(255 0 80 / .75), 2px 0 rgb(0 220 255 / .75); }   /* colour fringe */
.vhs::before {                                                                      /* scan lines */
  content: ''; position: absolute; inset: 0; z-index: 2; pointer-events: none;
  background: repeating-linear-gradient(to bottom, rgb(0 0 0 / .22) 0 1px, transparent 1px 3px);
}
.vhs::after {                                                                       /* rolling band */
  content: ''; position: absolute; left: 0; right: 0; height: 18%; top: -20%; z-index: 3; pointer-events: none;
  background: linear-gradient(to bottom, transparent, rgb(255 255 255 / .16), transparent);
  animation: vhs-roll 6s linear infinite;
}
@keyframes vhs-roll { to { top: 110%; } }
@media (prefers-reduced-motion: reduce) { .vhs::after { animation: none; top: 60%; } }
```

Keep it slow: a band that jumps or a picture that flashes can trigger photosensitive reactions, and VHS needs only the suggestion of tape. Limit the overlay to the hero; over a whole page the lines fight the reading of body text. The band is pure decoration and carries no meaning, so it must never hide content.

**Power-on.** The tube switched on: the picture arrives as a bright horizontal line that opens to full height, then settles in brightness. CSS only, played once on load; the catalogue's 404 page does it before its message.

```css
.crt { animation: crt-on 700ms steps(1, end) 1 both, crt-open 700ms cubic-bezier(0.2, 0.7, 0.2, 1) 1 both; }
@keyframes crt-open { 0% { transform: scale(1, 0.004); } 45% { transform: scale(1, 0.004); } 100% { transform: none; } }
@keyframes crt-on { 0% { filter: brightness(0); } 8% { filter: brightness(5); } 60% { filter: brightness(1.6); } 100% { filter: none; } }
@media (prefers-reduced-motion: reduce) { .crt { animation: none; } }
```

- **Poster frame:** the lines and the fringe, with the band parked at 60 % of the frame height.
- **Reduced motion:** the contract in `recipes-motion.md` §14; the rule above parks the band and keeps the rest.
- **Checks:** there is no canvas, so `check-motion.mjs` reports not applicable; look at the rendered page with and without the reduced-motion setting and read the headline through the fringe (`verification.md`, "Probe, do not squint").

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- No site was measured for this technique. Cost not measured.

## Halftone

### What it is

A field of dots that grow and shrink with the tone beneath them, so a plain gradient or a picture reads as printed.

### Where it comes from

William Fox Talbot is credited with the idea of halftone printing; the New York Daily Graphic published what is called the first newspaper reproduction of a photograph with a full range of tones on 4 March 1880, with a crude halftone screen, and Frederic Ives patented the first truly successful commercial method in 1881 ([Wikipedia, Halftone](https://en.wikipedia.org/wiki/Halftone)).

### Suits

Print, music and campaign brands: [Halftone / duotone](../identities/print-craft.md#halftone--duotone), [Risograph](../identities/print-craft.md#risograph), [Archival newsprint](../identities/print-craft.md#archival-newsprint).

### What it costs the visitor

not measured

### For the builder

This is the Fast version, in plain CSS and SVG: a dot grid blended with a tone layer, then thresholded by a very high contrast. Where the tone is dark the dots swell and touch, where it is light they shrink to nothing. The tone layer can be any gradient, which makes it a texture or a pattern; a photograph, a video or a 3D object needs the Medium or High version, chosen by the application.

```css
.halftone {
  position: relative;
  background: #fff;
  isolation: isolate;
  filter: contrast(30);              /* the threshold that turns blur into dots */
}
.halftone::before {
  content: ''; position: absolute; inset: 0;
  background:
    radial-gradient(circle at center, #000 0 0%, #fff 100%) 0 0 / 10px 10px,   /* the dot screen */
    radial-gradient(circle at 35% 40%, #fff 0, #888 35%, #000 75%);             /* the tone: swap in any gradient */
  background-blend-mode: screen;
}
```

The dot pitch is the `10px` of the screen layer: larger reads as coarse newsprint, smaller as a fine print. Colour comes from a coloured layer behind the dots, or from two coloured layers in place of black and white. The filter flattens everything inside the element, text included, so keep text in a sibling above it.

For a halftone that only fades (fixed dots over a flat colour), skip the contrast trick: a dot gradient with a gradient mask along its length stays crisp.

- **Poster frame:** the dots as drawn; nothing moves.
- **Reduced motion:** nothing moves, so nothing changes. If the tone layer is animated, stop it under the contract in `recipes-motion.md` §14.
- **Checks:** there is no canvas, so `check-motion.mjs` reports not applicable; look at the rendered page and confirm the dots stay round and separate at the real size (`verification.md`, "Probe, do not squint").

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- No site was measured at this tier. Cost not measured.

## CSS 3D objects

### What it is

A real object built from flat faces and turned in depth by the style sheet alone: a coin with a milled edge, and a ring of words that orbits through it, passing in front of the coin and behind it.

### Suits

Objects with a front, a back and an edge worth showing: [Stamps, seals & ephemera](../identities/print-craft.md#stamps-seals--ephemera), [Museum / white-cube gallery](../identities/print-craft.md#museum--white-cube-gallery), [Vintage packaging / label](../identities/print-craft.md#vintage-packaging--label), [Kinetic typography](../identities/digital.md#kinetic-typography) for the ring of words.

### What it costs the visitor

Measured on the example page built for this card (2026-11-08): no script and 3 KB in all. It held 60 frames a second (16.7 ms, 17.4 ms for the slowest 5 %) on an Intel UHD GPU, and 60 with no usable graphics chip: 42 flat layers turned by the compositor.

### For the builder

Faces are boxes in one 3D context (`transform-style: preserve-3d` on every level between the perspective and the faces). The coin is two discs and forty slices of edge, each slice stood round the circle and turned to face out; the ring is eight words stood round a circle in the same context, so the depth sorts them against the coin without a line of script.

```css
.scene { perspective: 1100px; }
.world, .coin, .ring { transform-style: preserve-3d; }
.face { position: absolute; inset: 0; border-radius: 50%; backface-visibility: hidden; }
.front { transform: translateZ(calc(var(--rim) / 2)); }
.back { transform: rotateY(180deg) translateZ(calc(var(--rim) / 2)); }
/* The milled edge: 40 slices, each as tall as a fortieth of the circumference (plus a hair, so no gap shows). */
.rim i { position: absolute; left: 50%; top: 50%; width: var(--rim); height: calc(var(--coin) * 0.0805);
  margin: calc(var(--coin) * -0.04025) 0 0 calc(var(--rim) / -2);
  transform: rotateZ(calc(var(--i) * 9deg)) translateY(calc(var(--coin) / -2)) rotateY(90deg); }
.ring span { position: absolute; left: 50%; top: 50%; transform: rotateY(calc(var(--i) * 45deg)) translateZ(230px); }
.coin { animation: turn 10s linear infinite; }
.ring { animation: orbit 22s linear infinite; }
@keyframes turn { to { transform: rotateY(360deg); } }
@keyframes orbit { from { transform: rotateY(0deg); } to { transform: rotateY(-360deg); } }
.hero:has(.still input:checked) :is(.coin, .ring), .scene:hover :is(.coin, .ring) { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) { .coin { animation: none; transform: rotateY(-32deg); } .ring { animation: none; } }
```

The page is `docs/examples/motion-techniques/css-3d/page.html`. The catalogue read on 2026-11-08 had 34 pieces built this way (a puzzle cube with real slice turns, blinds of coloured slats, a depth card, a coin) and no card here named them.

- **Shading is painted, not lit:** there is no light in CSS. Paint each face as it should look (a radial gradient on the coin's face, stripes on the edge); a script that sets a brightness per face from its angle is the Medium card.
- **A loop that can pause:** a checkbox "Hold the coin still" pauses both with `:has()`, and hover pauses them; past five seconds of motion the pause is owed (`patterns.md`, WCAG 2.2.2). The page needs no script for it.
- **Clip the stage** (`overflow: clip` on the section): the words at the sides of the ring pushed the first build 52 px past a 320 px screen. Clipping the section, not the 3D context, keeps the depth.
- **Words read backwards behind the object.** That is the ring's honesty; set `backface-visibility: hidden` on the words for a ring that only shows its front half.
- **Poster frame:** the coin at rest, turned to show its edge. **Reduced motion:** the rule above. **Checks:** there is no canvas, so `check-motion.mjs` reports not applicable; look at the rendered page at 320 and 1440, with and without the reduced-motion setting.

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- docs/examples/motion-techniques/css-3d/page.html, the example page built for this card, served compressed over http and probed 2026-11-08: no script, 3 KB in all; median frame 16.7 ms and slowest 5 % 17.4 ms on the Intel UHD GPU, 16.7 ms and 16.7 ms on SwiftShader; `check-motion --tier fast` passes (readable without JavaScript).

## Dither

### What it is

A photograph printed in two colours of ink through a regular screen of dots, so every grey becomes a pattern, as an old printer or a 1-bit screen would show it.

### Where it comes from

Ordered dithering thresholds each pixel against a fixed matrix; the 4 x 4 matrix used here is Bryce Bayer's, published in 1973 ([Wikipedia, Ordered dithering](https://en.wikipedia.org/wiki/Ordered_dithering)).

### Suits

[Dithered / 1-bit low-tech](../identities/digital.md#dithered--1-bit-low-tech), [Punk / DIY zine](../identities/print-craft.md#punk--diy-zine), [Risograph](../identities/print-craft.md#risograph), [Archival newsprint](../identities/print-craft.md#archival-newsprint).

### What it costs the visitor

Measured on the example page built for this card (2026-11-08): no script, a 5 KB photograph and 7 KB in all. The page held 60 frames a second (16.7 ms, 16.8 ms for the slowest 5 %) on an Intel UHD GPU and with no usable graphics chip; nothing on it moves.

### For the builder

An SVG filter does the whole print: grey, a lift of the shadows, the Bayer screen tiled from a 12 x 12 picture, tone plus screen minus a half, and a two-step transfer that writes ink or paper. The photograph is small (320 px) and drawn three times its size with hard pixels, so each dot is one of its pixels.

```html
<svg width="0" height="0" style="position: absolute" aria-hidden="true">
  <filter id="bayer" x="0" y="0" width="1" height="1" color-interpolation-filters="sRGB">
    <feColorMatrix type="saturate" values="0"/>
    <feComponentTransfer result="grey"><feFuncR type="gamma" exponent="0.55"/><feFuncG type="gamma" exponent="0.55"/><feFuncB type="gamma" exponent="0.55"/></feComponentTransfer>
    <feImage x="0" y="0" width="12" height="12" result="cell" href="data:image/svg+xml;utf8,…16 squares of 3 px, grey (n + 0.5) / 16…"/>
    <feTile in="cell" result="screen"/>
    <feComposite in="grey" in2="screen" operator="arithmetic" k2="1" k3="1" k4="-0.5" result="sum"/>
    <feComponentTransfer in="sum">
      <feFuncR type="discrete" tableValues="0.118 0.922"/><!-- ink, paper -->
      <feFuncG type="discrete" tableValues="0.165 0.894"/>
      <feFuncB type="discrete" tableValues="0.227 0.831"/>
    </feComponentTransfer>
  </filter>
</svg>
<img src="prism-small.jpg" width="320" height="213" style="width: 960px; max-width: 100%; image-rendering: pixelated; filter: url(#bayer)" alt="…">
```

The full screen, with the sixteen thresholds written out, is in `docs/examples/motion-techniques/dither/still.html`.

- **Lift the shadows first:** a dark photograph printed straight came out as a block of ink; a gamma of 0.55 before the screen gave it its greys back.
- **The two inks are numbers in the filter,** taken from the identity's ink and paper tokens; a token change must be copied there by hand.
- **Dots stay one photograph pixel** only at exactly three times the size; below it (a phone) the screen and the pixels drift apart into a fine moiré. Acceptable on a phone, visible on a desktop: keep the desktop width exact.
- **Moving fog, a lamp** that clears it: the Medium card, [Dither](medium.md#dither).
- **Poster frame:** the print itself. **Reduced motion:** nothing moves. **Checks:** there is no canvas, so `check-motion.mjs` reports not applicable; look at the rendered page at 100 %, where the screen must be visible from reading distance.

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- docs/examples/motion-techniques/dither/still.html, the example page built for this card, served compressed over http and probed 2026-11-08: no script, 7 KB in all (photograph 5 KB); median frame 16.7 ms and slowest 5 % 16.8 ms on the Intel UHD GPU and on SwiftShader; `check-motion --tier fast` passes.
