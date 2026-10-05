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

Every run opens with two answers, declared before anything else happens:

```
path:  audition   # compare candidate identities as small HTML pages, choose, then build
       design     # build directly; the identity is still defined and written down first

mode:  motion     # animation only — identity is settled, not yours to change
       design     # identity and structure — no animation
       both       # a rebrand — identity first, then structure, then motion
```

That is not ceremony. The failure this skill exists to prevent is delivering a
finish-level change when someone asked for a structural one — new tokens and
type on the same layout, handed over as "a rebrand". If the request does not
make either answer obvious, Claude asks instead of guessing.

Path and mode are not generator switches. They select stages of one workflow:

```
Author intent → Identity definition → Reference & identity research
  → Playwright decision → Design direction → HTML audition → Author selection
  → Identity brief → Implementation → Consistency validation → Verification
```

A few rules run through all of it:

- **A reference is not an identity.** A link, a screenshot or a video shows
  what the project *could* be. Claude classifies what each reference
  demonstrates (layout, typography, interaction, an alternative presentation,
  and so on) and weighs it below the author's stated intent.
- **The identity library is the search engine.** `references/identity-library.md`
  indexes a gallery of named visual identities. Each has its grammar, what it
  says, fit, trap, loading cost, live sites that ship it, and search leads.
  Claude uses it to propose directions the author would not have reached, then
  researches past the first acceptable reference.
- **The approved identity binds every surface.** Landing, app, admin, DevOps,
  docs and 404 are one product. Density adapts; identity does not.
- **Cheapest viable loading tier first.** Fast (CSS/SVG), medium (fonts,
  small motion libs, heavy imagery), high (WebGL, 3D, video). A heavier tier
  has to be justified.

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
| `SKILL.md` | The instruction payload: path and mode gate, workflow, headline numbers, verification gate, red flags. |
| `references/identity.md` | Author intent, reference classification and weighting, research depth, the identity brief, cross-surface consistency. |
| `references/identity-library.md` | Index of the identity gallery: the search engine for candidate directions. |
| `references/identities/` | The gallery itself, one file per family. |
| `references/audition.md` | The Playwright decision, HTML auditions, loading-cost tiers. |
| `references/icons-and-assets.md` | Commercially safe icon and asset sets, licence traps, sizing icons against type. |
| `references/benchmarks.md` | The measurements. Aggregates, per-site data, easing curves and durations actually shipped. |
| `references/recipes-design.md` | Ten sections: type roles and measure, colour ladders, page structure, chrome vocabulary, subject-derived identity, layout, anti-slop, the plan-and-review pass, words as design, and the checklist. |
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

`references/verification.md` has the procedure: how to capture a page *at
rest* so scroll-triggered content is not photographed at `opacity: 0`, and
how to probe the page for what a screenshot cannot tell you — whether a theme
resolved, whether a virtualizer virtualized, whether a library's classes
compiled at all.

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

**Adding identities.** They go in the right family file under
`references/identities/` and get a row in the index. Each one needs a
grammar, a fit/misfit, a trap, a loading tier and at least one **live site that
ships it**. A style name with no grammar and no example is a mood word, and
mood words are what generic pages are built from.

**Adding to `verification.md`.** Each entry should have cost something to
learn. Every row in that file is a real failure that shipped past a green
suite; that is what makes it persuasive rather than preachy.

Design specs and implementation plans are gitignored on purpose — they are
working documents for whoever is driving a build, not part of the shipped
skill.
