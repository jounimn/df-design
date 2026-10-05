# Design recipes

Identity and structure. Numbers come from `benchmarks.md` — 30 production
sites measured, not asserted.

The anti-slop clusters (§7), the plan-and-review pass (§8), the guidance on
words (§9) and the measure rules (§1) adapt guidance from Anthropic's
`frontend-design` skill (Apache-2.0), reconciled here with the measured
data.

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

**Roles, not a family count.** The three roles must be filled, and the
display and text roles must be clearly distinct. How many families do it
depends on the identity. The dark-product sites above use three to five.
Identities whose grammar is a single family (Swiss design, Book-like long
read, Luxury typography) fill the roles with one or two families through
size, weight and width. Two families that are only slightly different read
as a mistake, not a pairing.

**Mono labels real data, or nothing.** A mono face on figures, units,
timestamps, code and status is the instrument role doing its job. A mono
face on every eyebrow and meta line, when there is no data behind it, is
template chrome and one of the commonest tells of a generated page (§7).

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
--text-label:   0.6875rem;   /* data labels only; see "Labels" below */

/* Tracking tightens as size grows. This is most of the difference between
   "a big heading" and a designed one. Median -0.025em; WorkOS -0.07em. */
.display { letter-spacing: -0.03em; line-height: 1.02; text-wrap: balance; }
.title   { letter-spacing: -0.02em; line-height: 1.12; }
.body    { letter-spacing: -0.011em; line-height: 1.55; max-width: 65ch; }
```

Dovetail sets `112px` type on `80px` leading — line-height *below* 1. At
display size, leading under 1.05 is normal and above 1.2 looks unset.

The values above are the measured benchmark for product sites. **Do not
paste them into a different identity.** A newsletter, a menu card or a
Victorian page takes its scale from its own grammar: the masthead size, the
ratio and the tracking of its period and medium. Use the benchmark to check
that a hero reads as a hero, not as the answer.

### Measure: how long a line runs

Long lines lose the reader on the jump back to the next line. Short lines
chop the sentence. Set the measure on the text block, never on the page.

| Text | Measure | Leading |
|---|---|---|
| Sans body (default) | **60–70ch**, never over 80 | 1.5–1.6 |
| Serif body | up to ~75ch | +0.05–0.1 over the sans (1.6–1.7) |
| Multi-column (newsprint, editorial, almanac) | **35–45ch** per column | 1.4–1.5, set tighter to hold the column |
| Captions, sidenotes, admin cells | 30–50ch | 1.4 |
| Display and titles | no `ch` cap; break by sense with `text-wrap: balance` | see above |

```css
.body        { max-width: 65ch; line-height: 1.55; }
.body.serif  { max-width: 72ch; line-height: 1.65; }
.columns     { columns: 3 22rem; column-gap: 2rem; column-rule: 1px solid rgb(var(--line)); }
.columns p   { line-height: 1.45; hyphens: auto; }   /* set lang on <html> or hyphens does nothing */
p            { text-wrap: pretty; }                   /* no single-word last lines */
```

The identity can set a different measure. A book-like long read sits at
60–70, while a broadsheet runs narrow columns. Write it into the identity
brief when it departs from the default.

### Labels

Uppercase with wide tracking is right for a **short label of real
categorical data**: a table header, a unit, a status, a column head in a
newspaper. On an eyebrow above every heading it is template chrome (§7).
Default labels to sentence case, and earn the caps.

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

**These numbers are the benchmark for product sites with a lot to explain**,
the niche that was measured. They are not a quota. Scale the page to the
subject: a software platform argues across 8–16 bands, while a small shop,
a menu or a personal page may be complete in four or five. **Never add a band
to reach a count.** Every band answers a question the reader actually has.
If a band exists because the checklist said "8+", cut it. The failure the
benchmark guards against is thin bands, not few bands.

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
hexagonal buttons. None of it is expensive. Its mono eyebrows work because
the steps really are a sequence; the same device on unordered sections is
the template tell in §7.

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
brief or the approved identity pins a direction, follow it. It always wins,
including when it asks for one of these looks ("old neighbourhood
newsletter" legitimately means a broadsheet). Where an axis is left free, do
not spend the freedom on these:

**Whole looks**

- Warm cream `#F4F1EA` + serif display + terracotta accent (near `#D97757`)
- Near-black + a lone acid-green or vermilion pop
- A broadsheet: hairline rules, zero radius, dense newspaper columns, when nothing in the brief is a newspaper
- Purple-to-blue gradient hero on white
- The SaaS card kit: content chopped into identical rounded cards, one radius on everything, the same soft grey shadow under each, gradient washes as decoration

**Type and chrome**

- Inter or Space Grotesk as the "safe" face
- One word in the headline set apart in italic, bold or the accent colour
- A tracked-out ALL-CAPS eyebrow above every heading
- A mono face on small labels that carry no data
- Meta strings joined with middle dots (`A · B · C`); labels built as `WORD — fragment`
- `→` appended to every link and button
- Tinted near-black (`#0B0B0B`, `#111`) standing in for black with no reason
- Emoji as section markers

**Structure**

- Everything centred, `rounded-lg` everywhere
- An accent bar or rail on every rounded card
- Numbered `01 / 02 / 03` markers on content that is not a sequence
- A big number with a small label, supporting stats and a gradient accent as the hero, by default
- Fade-and-slide-up on every section, hover lift on every card

Each one is legitimate for some brief. The problem is reaching for it on
every brief. That makes it a default, not a choice.

**When the brief points at one of these looks, take its most specific
reading.** "Old newsletter" can be a generic broadsheet, or a duplicated
stencil sheet, a parish bulletin or a typed notice on the shop door. The
generic broadsheet is the one every generator produces. Recommend a
specific variant first, one with its own medium, era and place, and keep
the generic version only when the author asked for exactly that.

---

## 8. Plan, review, then build

Work in two passes. Most generic pages come from skipping the second.

**1. Plan.** Before any code, write a compact plan derived from the
identity brief (`identity.md` §8):

- **Colour:** the core palette as 4–6 named hex values, with each one's role
- **Type:** faces, the role each fills, the scale and the measure
- **Layout:** a one-sentence concept per band, with alignment (left, centre, justified) and the grid
- **Principles:** the two or three rules that make this page unlike any other

**2. Review the plan against the generic.** Ask what you would have produced
for a *similar* brief with a different subject. Every part of the plan that
would come out the same is a default, not a choice. Revise it, and say what
changed and why. Check the §7 list. Only then write code.

**Spend boldness in one place, and count it.** One element is the memorable
thing (a type treatment, an image, an interaction, a colour field), and
everything around it is quiet and disciplined. Two loud ideas cancel each
other. In the review, list every element on the page that competes for the
first look: an oversized nameplate, a full-bleed colour band, a coloured
box, a large image, an animated moment. **The list must have one entry.**
Name the one, and turn the rest down until they no longer compete. Then
remove one accessory: the decoration that serves nothing in the brief.

**Open with the subject's most characteristic thing.** The hero is the
first thing anyone sees. Choose its form deliberately (a headline, an image,
a live demo, an interactive moment, today's figures), not by habit.

**Watch selector specificity.** A type selector (`.section`) and an element
selector (`.cta`) setting the same padding or margin silently cancel each
other. Spacing between bands is where this bites. Give spacing one owner,
the layout wrapper (§6), and keep components free of outer margins.

---

## 9. Words are design

Copy can make a page as templated as its layout. Words are there to make the
interface easier to understand and use; they are content, not decoration.
Before writing anything, ask what this spot needs to say.

- **Name things in the user's words,** not the system's. People "manage
  notifications", not "configure webhooks".
- **Say what it is or does,** plainly. Specific and legible beats clever.
- **Buttons say exactly what happens:** "Save changes", not "Submit". An
  action keeps its name through the flow. The button says "Publish" and
  the confirmation says "Published".
- **Errors direct, they do not apologise.** Say what went wrong and how to
  fix it, in the interface's voice. Never vague.
- **Empty states invite action.** An empty screen says what to do first.
- **Tone:** plain verbs, sentence case, no filler, matched to the identity
  and the audience. One job per piece of text.
- **Use the brief's real content.** When there is none, write plausible,
  specific copy for this subject, never lorem ipsum and never generic
  marketing filler.

The identity sets the voice. An archival newsletter, a dark developer tool
and a kawaii shop say the same thing in three different registers, and the
microcopy on every surface (admin and 404 included) uses the same one.

---

## 10. Checklist before calling design done

- [ ] Plan written and reviewed against the generic before any code (§8)
- [ ] Three type roles filled, by as many families as the identity needs; a mono only where there is real data
- [ ] Display face is not the body face
- [ ] Body text within its measure (60–70ch sans, ≤75ch serif, 35–45ch per column)
- [ ] Hero at or above ~56px with tracking at or tighter than -0.02em (the measured benchmark; an identity's own grammar can override it)
- [ ] One loud colour; everything else quiet; semantic colours separate from it
- [ ] Neutrals deliberately biased, not pure grey
- [ ] Page length fits the subject: every band answers a real question, none is thin, none was added to reach a count (§3)
- [ ] No dead half at 1440px
- [ ] At least one device drawn from the subject's own world
- [ ] Every structural device encodes something true
- [ ] One memorable element; one accessory removed
- [ ] Nothing from the §7 list that the brief or identity did not ask for
- [ ] Copy in the user's words; buttons name the action; errors direct
- [ ] Both themes defined at token level; `body` has an explicit background
- [ ] Works at 400px wide with no horizontal scroll
- [ ] **The rendered page has been looked at** — see `verification.md`
