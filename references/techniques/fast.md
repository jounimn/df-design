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

- **Poster frame:** the row at its start position.
- **Reduced motion:** the blanket rule in `recipes-motion.md` §14 stops the slide; the row stays readable at rest.
- **Checks:** there is no canvas, so `check-motion.mjs` reports not applicable; look at the rendered page with and without the reduced-motion setting (`verification.md`, "Probe, do not squint").

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- hex.tech, probed 2026-10-15: where the recipe was read. Motion code of the page 70 KB, no canvas listed; the weight is the page's, not the marquee's.

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

- **Poster frame:** the finished state, which is also the default.
- **Reduced motion:** the recipe only animates under `no-preference`; every entrance also needs its resting state (`recipes-motion.md` §14).
- **Checks:** there is no canvas, so `check-motion.mjs` reports not applicable; scroll the rendered page with and without the reduced-motion setting (`verification.md`, "Probe, do not squint").

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

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

- **Poster frame:** the stage at its first position.
- **Reduced motion:** show the stage at rest, or stack the pieces in reading order (`recipes-motion.md` §14).
- **Checks:** there is no canvas, so `check-motion.mjs` reports not applicable; scroll the rendered page with and without the reduced-motion setting (`verification.md`, "Probe, do not squint").

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- Antigravity and Observable (27 sticky elements): where the pattern was read. Named without a URL, so not probed on 2026-10-15. Cost not measured.

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

- **Poster frame:** the final number.
- **Reduced motion:** the hook sets the target at once.
- **Checks:** there is no canvas, so `check-motion.mjs` reports not applicable; look at the rendered page with and without the reduced-motion setting (`verification.md`, "Probe, do not squint").

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- No site is cited by the recipe, so none was probed on 2026-10-15. Cost not measured.

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

- **Poster frame:** the headline settled.
- **Reduced motion:** the letters appear in place at once (`recipes-motion.md` §14).
- **Checks:** there is no canvas, so `check-motion.mjs` reports not applicable; look at the rendered page with and without the reduced-motion setting (`verification.md`, "Probe, do not squint").

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- No site is cited by the recipe, so none was probed on 2026-10-15. Cost not measured.

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
