# df-design

A Claude Code skill for web design and motion, plus the measurement rig that
built it.

Most design guidance is taste asserted confidently. This is thirty production
sites loaded in a real browser and measured — and the prober that did the
measuring ships with it, so every number is reproducible and every claim is
checkable against a site you choose.

`SKILL.md` is the payload Claude loads. This README is for the human reading
the directory.

---

## Use the skill

```
/df-design motion     # animation only — identity is settled, not yours to change
/df-design design     # identity and structure — no animation
/df-design both       # a rebrand — identity first, then structure, then motion
```

The mode is **mandatory** and declared before anything else happens. That is
not ceremony. The failure this skill exists to prevent is delivering a
finish-level change when someone asked for a structural one — new tokens and
type on the same layout, handed over as "a rebrand". If the request does not
make the mode obvious, Claude asks instead of guessing.

In `both`, the order is fixed: **identity → structure → motion.** Motion
applied to a generic layout produces a generic layout that moves.

---

## Run the prober

```
npm install
node scripts/probe.mjs https://linear.app --cohort analytics
```

Two passes over the page, and the second is the interesting one:

| Pass | `prefers-reduced-motion` | What it is for |
|---|---|---|
| Motion | `no-preference` | Static metrics, motion inventory, property trace, scroll trace, six scroll frames |
| Contract | `reduce` | Re-inventory and re-trace, to see what *actually* stopped moving |

That second pass is why the reduced-motion number in the benchmarks means
something. Grepping a stylesheet for `@media (prefers-reduced-motion)` tells
you a rule exists; re-running the property trace under `reduce` and counting
how many elements still move tells you whether it works. A site can ship the
media query and animate anyway.

Output lands in `captures/<site>/<date>/` — the validated record, the raw
capture, the motion traces, the frames, and a `contact.png` thumbnail grid
rendered by the browser that is already open.

### It quarantines rather than deletes

`scripts/lib/validate.mjs` separates suspect fields into a `quarantine` list
with a reason and keeps the raw capture as the authority. Nothing is silently
dropped, and nothing implausible is silently published:

- A page height under 1.5× the viewport on a site showing lazy-loading
  sentinels — measured too early, needs a scroll-to-bottom settle.
- A fully transparent accent or ground. `rgba(0,0,0,0)` is what you read off
  an element that never painted; publishing it as "the brand colour" is how a
  palette table fills up with black.
- Zero font faces on a page that rendered text.
- An absurd corner radius, unless it resolves to a pill — then it is
  normalised, not rejected.

An absent hero is legal and never quarantined. Some pages genuinely have no
`h1`, and a rig that treats that as an error cannot measure a canvas-first
site.

### Archetypes

`classifyArchetype()` sorts a page into `typographic`, `media-stage`,
`canvas`, `interactive-demo`, `editorial`, `none`, or `novel`. Order matters
in the classifier: a dominant visual stage outranks whatever type sits on top
of it. This keeps the aggregates honest — a 112px hero on a WebGL stage is
not evidence about typographic heroes.

```
npm test        # 36 tests, node:test, no network — a local fixture server
```

---

## What is in here

| Path | What it is |
|---|---|
| `SKILL.md` | The instruction payload: mode gate, headline numbers, verification gate, red flags. |
| `references/benchmarks.md` | The measurements. Aggregates, per-site data, easing curves and durations actually shipped. |
| `references/recipes-design.md` | Eight sections of working code: type roles, colour ladders, page structure, chrome vocabulary, anti-slop. |
| `references/recipes-motion.md` | Fourteen implementations, each traced to the site that ships it, ending in the reduced-motion contract. |
| `references/verification.md` | How to confirm the work is real. Read this one even if you skip the rest. |
| `scripts/probe.mjs` | The prober CLI. |
| `scripts/lib/` | Browser launch, static pass, motion inventory, property trace, scroll trace, archetype, validate, bundle. |
| `test/` | 36 tests and the HTML fixtures they run against. |

Claude reads the mode's recipe file and works from it; `benchmarks.md` and
`verification.md` are pulled in as needed.

---

## What the measurements say

The sample skews to data, analytics and developer tools: Stripe, Linear,
Vercel, ClickHouse, Hex, MotherDuck, Atlan, Datafold, Neon, Supabase, Warp,
Resend, Observable, PostHog, dbt, Grafana, Metabase, Tinybird, Monte Carlo,
Cube, WorkOS, VoidZero, Railway, Cerebrium, Fibery, Dovetail, Lovable,
Cosmos, Trionn, Infinite Machine.

| Measure | Production median | What gets shipped instead |
|---|---|---|
| Hero type size | **64px** | a 32–48px "large" heading |
| Hero tracking | **-0.025em** | `normal`, or a timid -0.01em |
| Page height | **9,329px** | under 3,000px — six thin bands |
| Distinct font faces | **5** | one neutral sans for everything |
| Ships a monospace face | **25 of 28** | none anywhere |
| Inter as the *display* face | **4 of 28** | Inter, because it is safe |
| CTA corner radius | **6px** | 12–16px, uniformly |

The most load-bearing finding is not in that table. Premium pages are not
built from more keyframes — they are built from **masks, clip paths and blend
modes**. Element counts using each: PostHog 164, Stripe 99, Fibery 94,
Cerebrium 85, Linear 54. A page with zero masks and zero blend modes reads as
flat no matter how carefully its fade durations are tuned.

---

## The verification gate

The skill will not call work done until the rendered page has been looked
at — not the test suite, not the type-checker, not the build. The page.

This is the part that earns its keep, because **absence is silent**. A class
that does not exist, a rule that never matches, a container that never
bounds: none of them raise anything. All of the following shipped green:

- A virtualized table that rendered all 1,386 rows, because the shell used
  `min-h-screen` and the scroll container never engaged. Three tests passed —
  they stubbed a 400px viewport.
- Five custom `fontSize` tokens that `tailwind-merge` deleted on sight,
  because it classifies unrecognised `text-*` as *colours*. The whole type
  scale was inert.
- 41 Tremor classes compiled to nothing, because the `tremor-*` namespace was
  never defined in the host Tailwind config. Every axis label fell back to
  Recharts grey — invisible on a dark canvas.
- A "rebrand" with 183 tests green in which not one structural decision had
  changed.

Screenshots get their own warning, because `page.screenshot()` has no failure
mode: it writes a valid PNG of whatever was on screen, so a capture of the
login page looks exactly as much like a result as a capture of the dashboard.
One eight-page capture run took three passes, each producing eight plausible
and wrong files — shot mid-fetch, shot logged out, then shot with the wrong
theme because `addInitScript` accumulates across navigations on a shared
page. `references/verification.md` carries the rig that fails loudly instead.

Note the inversion between the two halves of this repo. `verification.md`
emulates reduced motion to *suppress* animation, so a page can be
photographed at rest. The prober's first pass disables that emulation,
because there the animation is the measurement.

---

## Extending it

**Adding sites.** Run the prober; do not hand-edit a number into
`references/benchmarks.md`. When a capture contradicts the table, the capture
is the authority and the table is what needs editing — and `SKILL.md` repeats
several of these aggregates, so a median that no longer matches its source
table has to be updated in both places.

**Adding recipes.** They go in the mode's recipe file and must be **working
code traced to a named site that ships it**. A parameter table is not a
recipe. "Premium = 400ms, ease-out, no overshoot" is what produces
`opacity: 0 → 1` plus an 8px rise and a straight face — that is the failure
this skill was written against, and it creeps back every time a recipe gets
summarised instead of written out.

**Adding to `verification.md`.** Each entry should have cost something to
learn. Every row in that file is a real failure that shipped past a green
suite; that is what makes it persuasive rather than preachy.

Design specs and implementation plans are gitignored on purpose — they are
working documents for whoever is driving a build, not part of the shipped
skill.
