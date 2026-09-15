# Design recipes

Identity and structure. Numbers come from `benchmarks.md` — 30 production
sites measured, not asserted.

---

## 1. Type: three roles, never one face

The median measured site loads **five** faces. Only 4 of 28 use Inter for
display. One neutral sans doing every job is the clearest single tell of a
generic page.

| Role | Job | Observed |
|---|---|---|
| **Display** | Hero, section openers. Carries the personality. | Aeonik Fono, PP Formula SemiExtended, Söhne, Untitled Sans, Domaine, APK Protocol, Suisse Intl, basier, Aspekta, IBM Plex Serif |
| **Text** | Running prose and UI. Invisible by design. | Inter, IBM Plex Sans, Geist, Roboto, Lato |
| **Mono** | Labels, eyebrows, figures, code. | IBM Plex Mono, Geist Mono, JetBrains Mono, Berkeley Mono, Source Code Pro |

**The mono is not optional in a data or developer product** — 25 of 28 ship
one. It is what tells a reader there are real values behind the page.

### The instrument face

The cheapest strong identity device in the whole survey: one face that
evokes measurement hardware, used for exactly one small element.

- Tinybird — `sevenSegment` (LCD seven-segment)
- WorkOS — `Enhanced dot digital 7` (dot-matrix)
- Vercel — `GeistPixel`
- Dovetail — `PP Mondwest` (bitmap serif)

Apply it to a single figure, a status readout or a ticker. Never to running
text. It is a signature, not a typeface choice.

### Scale and tracking

```css
/* Median hero is 64px. Below ~56px a hero does not read as a hero. */
--text-display: clamp(2.75rem, 6vw, 4.5rem);   /* 44 → 72px  */
--text-title:   clamp(1.75rem, 3vw, 2.5rem);   /* 28 → 40px  */
--text-heading: 1.375rem;
--text-body:    0.9375rem;
--text-label:   0.6875rem;   /* mono, uppercase, +0.08em */

/* Tracking tightens as size grows. This is most of the difference between
   "a big heading" and a designed one. Median -0.025em; WorkOS -0.07em. */
.display { letter-spacing: -0.03em; line-height: 1.02; text-wrap: balance; }
.title   { letter-spacing: -0.02em; line-height: 1.12; }
.body    { letter-spacing: -0.011em; line-height: 1.55; max-width: 65ch; }
```

Dovetail sets `112px` type on `80px` leading — line-height *below* 1. At
display size, leading under 1.05 is normal and above 1.2 looks unset.

---

## 2. Colour: a ground, an ink ladder, one accent

```css
:root {
  --canvas: ...;         /* page ground */
  --surface: ...;        /* raised */
  --surface-muted: ...;  /* inset, hover */
  --line: ...;           /* hairline */
  --line-strong: ...;

  --ink: ...;            /* headings */
  --ink-muted: ...;      /* body */
  --ink-subtle: ...;     /* meta */

  --brand: ...;          /* ONE accent */
  --accent: ...;         /* a second, for charts only */

  --success: ...; --warning: ...; --danger: ...;   /* semantic, never the accent */
}
```

Store as space-separated RGB channels (`--brand: 94 106 210`) so Tailwind's
`<alpha-value>` works: `rgb(var(--brand) / 0.1)`.

**Spend boldness once.** Every measured site has exactly one loud colour:
Tinybird acid green `rgb(39 247 149)` on `rgb(10 10 10)`, Monte Carlo orange
`rgb(255 87 0)` on `rgb(0 17 29)`, Cerebrium pink on off-white, Stripe
`rgb(83 58 253)`. Everything else in the palette is quiet.

**Neutrals are chosen, not inherited.** A pure mid-grey reads as
unconsidered. Bias the neutral slightly toward the accent's hue.

**Radius: median 6px.** Observed 0, 2, 4, 6, 7, 8, 12, 14, 100. Sharp
corners are normal in the data niche — ClickHouse and Tinybird ship 0px.
A uniform 12–16px on everything is a template tell.

---

## 3. Structure: the page is longer than you think

| | Median measured | Common failure |
|---|---|---|
| Scroll height | **9,329px** | under 3,000px |
| Bands | **8–16** | 5–6 |
| Distinct section grounds | 2–4 | 1 |

A short page is not restraint, it is an unfinished argument. If there are
six bands of three lines each, the problem is that the page has nothing to
say yet — not that it needs a bigger hero.

**Switch the ground between chapters.** ClickHouse uses 3 distinct section
backgrounds, Cube 4, Stripe 4, dbt 3. Greptile drops from warm gray to dark
violet-slate for its "how it works" band, and that colour change alone is
what makes the band read as a separate chapter.

**Give the scroll a spine.** Sticky panels are how the best pages hold an
idea still while evidence moves past it: Observable 27 sticky elements,
ClickHouse 3, Metabase 3, Cosmos 3.

---

## 4. Chrome vocabulary: drafting, not decoration

Greptile's identity is not its colour, it is its *instrumentation*: ruler
tick-rules along band edges, registration crosshairs on a faint grid,
hatched borders around media wells, mono eyebrows (`STEP 01`), chamfered
hexagonal buttons. None of it is expensive.

```css
/* Ruler rule — a measured edge instead of a plain border */
.rule-ticks {
  height: 12px;
  background-image: linear-gradient(to right, rgb(var(--line-strong)) 1px, transparent 1px);
  background-size: 8px 100%;
  mask-image: linear-gradient(to bottom, #000 0 4px, transparent 4px);
}
/* Registration crosshair grid */
.crosshairs {
  background-image:
    linear-gradient(rgb(var(--line)) 1px, transparent 1px),
    linear-gradient(90deg, rgb(var(--line)) 1px, transparent 1px);
  background-size: 120px 120px;
  mask-image: radial-gradient(ellipse at 50% 30%, #000 20%, transparent 70%);
}
/* Chamfered corners — an identity device that costs one property */
.chamfer { clip-path: polygon(10px 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%, 0 10px); }
/* Hatched well */
.hatched {
  background-image: repeating-linear-gradient(45deg,
    rgb(var(--line)) 0 1px, transparent 1px 6px);
}
```

**Structure must encode something true.** Numbered markers (`01 / 02 / 03`)
are right when the content genuinely is a sequence and wrong when they are
applied to four unordered features. Ask what each device claims before
using it.

---

## 5. Derive the identity from the subject

The strongest pages in the survey take their visual language from what the
product actually *is*, not from a mood board:

- **Teamwork Graph** builds its letterforms out of a node graph — the `O` in
  TEAMWORK is a marker scribble, the `A` in GRAPH is drawn from nodes and
  edges. The product is a graph; the type is a graph.
- **Greptile** is a code *reviewer*, so the page is a drafting document —
  measured, registered, annotated.
- **Tinybird** is about real-time figures, so it ships a seven-segment face.

Ask: what does this product's own world look like? Its instruments, its
units, its document conventions, its vocabulary. Carry at least one detail
that only this subject would have, as content rather than ornament.

A generic page is usually a page whose designer never asked this question.

---

## 6. Layout

- **No dead half.** A left-aligned column of text on a 1440px canvas with an
  empty right side is the single most common failure. Either fill it with
  the product, or centre the composition (13 of 28 measured heroes are
  centred), or make the column deliberately narrow inside a framed band.
- **Gutters:** one side padding on `body` or one wrapper, never per-element
  margins; at least 16px at every width. Use `padding-block` for vertical so
  the shorthand never zeroes the sides.
- **Gap, not margin,** for sibling groups. Flex/grid with `gap` cannot
  collapse or double.
- **Repeated things are one object:** same edges, baselines and inner
  padding; a recurring element in the same place on each card.
- **Not everything is a card.** Border, fill, radius and shadow each say
  "separate object". Spending all four on every block flattens the
  hierarchy. Lift the one thing that deserves lifting.
- **Tables, code and diagrams** may exceed the gutter, each in its own
  `overflow-x: auto` container. The page body never scrolls sideways.

---

## 7. Anti-slop

Current AI-generated design clusters hard around a few looks. Where the
brief pins a direction, follow the brief — it always wins. Where nothing is
specified, do not spend the freedom on these:

- Warm cream `#F4F1EA` + serif display + terracotta accent
- Near-black + a lone acid-green or vermilion pop
- Purple-to-blue gradient hero on white
- Inter or Space Grotesk as the "safe" face
- Emoji as section markers
- Everything centred, `rounded-lg` everywhere
- An accent bar or rail on every rounded card
- Numbered `01 / 02 / 03` markers on content that is not a sequence

---

## 8. Checklist before calling design done

- [ ] Three type roles filled; a mono present if the product is about data
- [ ] Display face is not the body face
- [ ] Hero at or above ~56px with tracking at or tighter than -0.02em
- [ ] One loud colour; everything else quiet; semantic colours separate from it
- [ ] Neutrals deliberately biased, not pure grey
- [ ] Page has 8+ bands and switches ground at least once
- [ ] No dead half at 1440px
- [ ] At least one device drawn from the subject's own world
- [ ] Every structural device encodes something true
- [ ] Both themes defined at token level; `body` has an explicit background
- [ ] Works at 400px wide with no horizontal scroll
- [ ] **The rendered page has been looked at** — see `verification.md`
