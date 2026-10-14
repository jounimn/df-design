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

## Ambient dot grid

### What it is

A field of small dots behind the hero, where each dot brightens and dims on its own schedule so the whole field looks alive.

### Where it comes from

A dot matrix is a two-dimensional array of dots that stands for characters and images; one woven example dates from 1858, made on a loom steered by punched cards ([Wikipedia, Dot matrix](https://en.wikipedia.org/wiki/Dot_matrix)).

### Suits

Product and developer brands that want a quiet sign of life: [Monochrome mono-type dev sites](../identities/digital.md#monochrome-mono-type-dev-sites), [AI lab](../identities/industry.md#ai-lab), [Data-viz-as-hero](../identities/digital.md#data-viz-as-hero).

### What it costs the visitor

not measured

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

- linear.app: where the recipe was read. Cost not measured.

## Corner glow

### What it is

A soft highlight that sits in one corner of a card and lights what lies underneath it.

### Where it comes from

A related effect, bloom (also called glow), imitates how a camera blurs bright light; it spread widely in games and high-contrast rendering after the authors of Tron 2.0 published on it in 2004 ([Wikipedia, Bloom](https://en.wikipedia.org/wiki/Bloom_(shader_effect))).

### Suits

Dark product interfaces with a few cards in a row: [Dark mode neon dashboard](../identities/digital.md#dark-mode-neon-dashboard), [AI lab](../identities/industry.md#ai-lab).

### What it costs the visitor

not measured

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

- linear.app: where the recipe was read ("Read verbatim off linear.app"). Cost not measured.

## Edge fade

### What it is

The cut edges of a row, logo strip or table soften into the page, so the row reads as continuing rather than as broken.

### Where it comes from

Vignetting is a fall-off of brightness toward the edge of an image, which photographers sometimes choose on purpose ([Wikipedia, Vignetting](https://en.wikipedia.org/wiki/Vignetting)). The alpha channel that makes soft-edged masks possible was introduced by Alvy Ray Smith and Ed Catmull in the late 1970s ([Wikipedia, Alpha compositing](https://en.wikipedia.org/wiki/Alpha_compositing)).

### Suits

Any row that runs past the edge of the page: [Editorial design](../identities/print-craft.md#editorial-design), [Fintech trust](../identities/industry.md#fintech-trust).

### What it costs the visitor

not measured

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

- linear.app (80px) and hex.tech (30px): where the recipe was read. Cost not measured.

## Dot grid and hairlines as masks

### What it is

A dotted field or a one-pixel line drawn with no extra elements, and the line can fade along its length.

### Where it comes from

Squared paper is usually credited to Dr. Buxton of England, who patented paper printed with a rectangular grid in 1794 ([Wikipedia, Graph paper](https://en.wikipedia.org/wiki/Graph_paper)).

### Suits

Plan-like, technical and Swiss brands: [Blueprint / cyanotype](../identities/print-craft.md#blueprint--cyanotype), [Swiss design](../identities/historical.md#swiss-design), [Academic / research lab](../identities/industry.md#academic--research-lab).

### What it costs the visitor

not measured

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

- hex.tech: where the recipe was read. Cost not measured.

## Noise

### What it is

A fine grain laid over a flat colour, like the tooth of paper or the speckle of film.

### Where it comes from

Film grain comes from small particles of metallic silver or clouds of dye left in developed film ([Wikipedia, Film grain](https://en.wikipedia.org/wiki/Film_grain)). Ken Perlin developed Perlin noise in 1982 because computer-made images looked machine-like, and described it in a 1985 paper ([Wikipedia, Perlin noise](https://en.wikipedia.org/wiki/Perlin_noise)).

### Suits

Print, paper and zine brands: [Archival newsprint](../identities/print-craft.md#archival-newsprint), [Halftone / duotone](../identities/print-craft.md#halftone--duotone), [Art-school indie (zine and riso)](../identities/cultural.md#art-school-indie-zine-and-riso).

### What it costs the visitor

not measured

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

- neon.tech (the noise mask) and hex.tech (the animated background position): where the recipe was read. Cost not measured.

## Shimmer sweep

### What it is

A band of light that slides across a placeholder or a single cue to say "this is live".

### Where it comes from

Facebook released Shimmer for iOS about a year before March 2015, then a similar Android component; the iOS one showed loading status in Paper and the Android one in Home. It works by moving a soft mask across a view drawn twice, once faint and once through the mask ([Facebook Engineering, Shimmer for Android](https://engineering.fb.com/2015/03/05/android/shimmer-for-android/)).

### Suits

Live products and loading states: [Fintech trust](../identities/industry.md#fintech-trust), [Dark mode neon dashboard](../identities/digital.md#dark-mode-neon-dashboard).

### What it costs the visitor

not measured

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

- neon.tech: where the recipe was read. Cost not measured.

## Marquee

### What it is

A line of logos or words that slides sideways without end, at one constant speed.

### Where it comes from

The marquee element was first introduced in early versions of Microsoft's Internet Explorer as a non-standard extension ([Wikipedia, Marquee element](https://en.wikipedia.org/wiki/Marquee_element)). Its older cousin, ticker tape, carried stock prices over telegraph lines from about 1870 to 1970, and was invented in 1867 by Edward A. Calahan ([Wikipedia, Ticker tape](https://en.wikipedia.org/wiki/Ticker_tape)).

### Suits

Labels, publishers and sponsor rows: [Record label / musician](../identities/industry.md#record-label--musician), [Publishing / newsletter](../identities/industry.md#publishing--newsletter), [Y2K aesthetic](../identities/digital.md#y2k-aesthetic).

### What it costs the visitor

not measured

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

- hex.tech: where the recipe was read. Cost not measured.

## Additive blends on a dark ground

### What it is

Lines and panels that glow against a dark page, because light adds to light and dark disappears.

### Where it comes from

Screen and Multiply are the basic lightening and darkening blend modes of graphics editors, and the names used on the web follow the W3C Compositing and Blending specification ([Wikipedia, Blend modes](https://en.wikipedia.org/wiki/Blend_modes)).

### Suits

Neon, night and dashboard brands: [Dark mode neon dashboard](../identities/digital.md#dark-mode-neon-dashboard), [Synthwave](../identities/digital.md#synthwave), [Cyberpunk](../identities/digital.md#cyberpunk).

### What it costs the visitor

not measured

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

- linear.app (`overlay` ×7, `lighten` ×6, `screen` ×5) and stripe.com (`multiply` ×4): where the counts were read. Cost not measured.

## Scroll-linked

### What it is

Things that arrive or shift as the visitor scrolls, so the page seems to answer the hand.

### Where it comes from

Moon Patrol (1982) implemented a full form of parallax scrolling, with three background layers moving at different speeds, and is often credited with popularising it ([Wikipedia, Parallax scrolling](https://en.wikipedia.org/wiki/Parallax_scrolling)).

### Suits

Editorial and long-read brands: [Editorial design](../identities/print-craft.md#editorial-design), [Book-like long read](../identities/print-craft.md#book-like-long-read), [Publishing / newsletter](../identities/industry.md#publishing--newsletter).

### What it costs the visitor

not measured

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

- No site is cited by the recipe; the support figure (~84% global) is the recipe's own. Cost not measured.

## Sticky narrative

### What it is

The copy holds still while the evidence moves past it, so the reader keeps the claim in view while the proof goes by.

### Where it comes from

The style is often called "snowfall" after The New York Times piece "Snow Fall", published online in December 2012. Creative Bloq describes it as editorial layout joined to parallax scrolling and web video, as the BBC brought it into the mainstream ([Creative Bloq, Snowfall](https://www.creativebloq.com/web-design/snowfall-51411702)).

### Suits

Explainers and data stories: [Editorial design](../identities/print-craft.md#editorial-design), [Data-viz-as-hero](../identities/digital.md#data-viz-as-hero), [Book-like long read](../identities/print-craft.md#book-like-long-read).

### What it costs the visitor

not measured

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

- Antigravity and Observable (27 sticky elements): where the pattern was read. Cost not measured.

## Counters that mean something

### What it is

A number that counts to its value and shows its direction, so the count is information and not decoration.

### Where it comes from

Odometers, which count distance travelled, existed in the ancient Greco-Roman world and in ancient China ([Wikipedia, Odometer](https://en.wikipedia.org/wiki/Odometer)).

### Suits

Finance, climate and data brands: [Fintech trust](../identities/industry.md#fintech-trust), [Climate tech](../identities/industry.md#climate-tech), [Data-viz-as-hero](../identities/digital.md#data-viz-as-hero).

### What it costs the visitor

not measured

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

- No site is cited by the recipe. Cost not measured.

## Text that performs its sentence

### What it is

Letters that act out what the headline says: scattered things that converge under a line about bringing things together.

### Where it comes from

Scholars recognise Alfred Hitchcock's *North by Northwest* (1959) as the first feature film to use kinetic typography widely; Saul Bass's title sequence had the credits fly in from off-screen, and he used a similar technique in *Psycho* (1960) ([Wikipedia, Kinetic typography](https://en.wikipedia.org/wiki/Kinetic_typography)).

### Suits

Expressive type and music brands: [Grid-breaking experimental typography](../identities/print-craft.md#grid-breaking-experimental-typography), [Swiss Punk / New Wave typography](../identities/historical.md#swiss-punk--new-wave-typography), [Record label / musician](../identities/industry.md#record-label--musician).

### What it costs the visitor

not measured

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

- No site is cited by the recipe. Cost not measured.

## Image reveal through the identity's device

### What it is

A picture that enters the way its medium would: inked in like a press pass, developed like a darkroom print, or built from growing dots.

### Where it comes from

A wipe is a film transition in which one shot replaces another by travelling across the screen; the next scene was optically printed onto a moving object so that it "wiped" the previous shot ([Wikipedia, Wipe (transition)](https://en.wikipedia.org/wiki/Wipe_(transition))).

### Suits

Print, photography and halftone brands: [Halftone / duotone](../identities/print-craft.md#halftone--duotone), [Archival newsprint](../identities/print-craft.md#archival-newsprint), [Editorial design](../identities/print-craft.md#editorial-design).

### What it costs the visitor

not measured

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

- No site is cited by the recipe; the Faísca example build is the failure it was learned from. Cost not measured.
