# df-design: the learning loop

**Date:** 2026-09-16
**Status:** design approved, pending spec review
**Scope:** turn df-design from a frozen measurement into a skill that acquires,
validates and accumulates design and motion patterns from live pages.

---

## 1. The problem

df-design's authority rests on a single sentence: *thirty production sites were
loaded in a real browser and measured*. That measurement happened once, on
2026-09-15. The script that performed it was never committed — the published
skill is five Markdown files. The consequences compound:

- **The corpus cannot be reproduced, audited, extended or refreshed.** Not by a
  user, not by the skill itself. Every number decays from the day it shipped and
  nothing can renew it.
- **There is no runtime probe path.** When a brief names a reference the corpus
  has never seen, the skill silently falls back on a median that may be exactly
  wrong for that brief.
- **Rigour is asymmetric.** The skill has two excellent structural gates, both on
  the output side — declare the mode before acting, look at the rendered page
  before claiming done. On the input side there is nothing. It is rigorous about
  what it produced and credulous about what it modelled on.
- **One genre is published as "production."** All thirty sites are B2B
  data/dev-tool. The skill admits this once, then says "production median"
  everywhere else and lists deviation as failure.
- **It measures a dynamic medium with static instruments.** The skill declares
  that compositing and motion are what separate premium pages from flat ones,
  then measures only computed styles and element counts. It asserts its thesis
  with instruments that cannot see it.
- **Measurement artifacts shipped as facts.** No validation gate, so a
  lazy-loading site's page height was recorded as 900px — in the same table that
  claims a ~9,300px median, and the 900px figure is cited in the reasoning
  against short pages. A pill radius was recorded as 3.35e+07px. Several ground
  colours read as fully transparent because the probe sampled the wrong element.
  Roughly one row in seven carries a junk field.
- **Novelty is discarded.** The probe assumed every page has an `h1` to measure.
  Two sites did not, and were dropped from the results. The pages that refuse the
  expected structure are the most informative ones available, and the schema
  converted them into missing data.
- **Nothing flows back.** The recipe layer is fixed at 22 hand-authored entries
  with no schema and no write path. The verification gate produces exactly the
  judgement signal a learning loop needs, and throws it away.

The skill *has learned*, past tense, once. This spec makes it learn.

## 2. Goals

1. Ship the apparatus, not only its conclusions: a re-runnable prober.
2. Capture motion, not just static style — the part the skill's own thesis rests on.
3. Make the corpus structured, cohort-tagged, dated and validated; make
   `benchmarks.md` a rendered view of it rather than the only copy.
4. Give patterns a schema and a write path so new findings have somewhere to go.
5. Probe live references at design time, on demand, via one command argument.
6. Accumulate without drifting: staged write-back with explicit promotion.
7. Close the loop: the verification gate's judgement feeds promotion and demotion.
8. Audit the accumulated knowledge for internal consistency on a schedule, not
   only at write time.

## 3. Non-goals

- A general web scraper or crawler.
- WebGL shader extraction.
- Video semantics. We capture frames; we do not attempt to understand video.
- Replacing the human judgement in the recipe layer. The prober proposes;
  promotion to `core` stays deliberate.

## 4. Command interface

A single entry point. The mode gate and the evidence gate collapse into the
invocation rather than becoming two separate rituals:

```
/df-design <mode> [playwright]
/df-design audit [corpus | design <path-or-url>]
```

| Argument | Values | Meaning |
|---|---|---|
| `<mode>` | `motion` \| `design` \| `both` | Unchanged semantics. Required. |
| `[playwright]` | present / absent | Absent: offline. Present: live evidence pass. |
| `audit` | `corpus` (default) \| `design <target>` | The consistency job (§11.2). Runs against the accumulated knowledge, or against a produced design. |

The skill still echoes the resolved gate in one line before any other action, but
now sources it from the arguments instead of asking for a second declaration:

```
df-design: mode=both, evidence=corpus:dev-tools (n=26 validated, measured 2026-09-15)
df-design: mode=both, evidence=probed:3 — antigravity.google, linear.app, warp.dev (today) + corpus:dev-tools
```

If `<mode>` is absent or ambiguous, ask. Never guess — that failure (delivering a
finish-level change when someone asked for a design-level one) is the most
expensive one the skill exists to prevent, and it predates this work.

### 4.1 Path A — offline (`/df-design both`)

Designs against the accumulated knowledge base, in two halves:

- **the websites** — everything already recorded from real pages:
  `corpus/sites.json` and the `captures/` bundles behind it, including their
  frames and motion traces
- **the specs derived from them** — `patterns/` records with their working code
  (`core` and `observed` tiers only), and the cohort-conditioned aggregates
  rendered into `references/benchmarks.md`

No browser, deterministic, fast. This is what the skill does today, plus real
cohort conditioning, tier labelling and validated numbers. Falling back on the
corpus is legitimate — it must simply be **said out loud, with its cohort and
age**, so nobody mistakes a dev-tool median for a universal one.

### 4.2 Path B — live (`/df-design both playwright`)

Everything in Path A, plus:

1. **Resolve references.** In priority order: URLs given in the invocation or the
   brief; sites named in the brief; `discover.mjs` proposals (§10) — which are
   presented before probing, never probed unannounced.
2. **Probe and record** each reference (§6, §7).
3. **Classify and validate** (§8). Anything unparseable is quarantined with its
   raw capture attached, never dropped.
4. **Emit new pattern records** into `candidates/` with full provenance (§9).
5. **Design against the fresh evidence plus the kit.**

The existing specs inform what the probe measures; the probe produces additional
specs. The flag is the learning trigger.

### 4.3 The run, end to end

What actually happens between the command and the delivered page:

```
1  gate         echo mode + evidence (§4)
2  probe        playwright only — capture bundles per reference (§6, §7)
3  look         contact sheet first, then at most three full frames (§7.8)
4  extract      pattern candidates -> candidates/, with provenance (§9)
5  synthesise   DECLARE the design direction, every decision traced
6  build
7  verify       references/verification.md — look at the rendered page
8  audit        /df-design audit design <target> (§11.2)
9  feedback     patterns used + pass/fail -> usage stats (§11.1)
```

**Step 5 is the one that is easy to skip and must not be.** A prober that hands
the agent three beautiful reference captures and then goes straight to build will
produce a pastiche of those three references. The skill's own best idea —
*derive the identity from the subject*, in `recipes-design.md` §5 — is precisely
what gets lost, and the result is generic in the way that matters most: it has no
relationship to the product it is for. Without synthesis, the live path is worse
than the offline one.

Step 5 therefore declares, in a short block before any code:

- **the direction**, in one sentence: what this page is, in its own world
- **each identity, structure and motion decision**, carrying its trace —
  `evidence:<capture or pattern id>` for something measured, or `subject:<what
  about this product demands it>`
- **what was measured and deliberately not taken**, and why

A decision with no trace is one the agent invented, and it says so. A page whose
every decision traces to `evidence` is a copy, and fails the copying line (§12.1).

**Approval.** In `both` — a rebrand — step 5 is presented and waits. This is the
mode gate's failure one level up: the mode gate stops the skill delivering the
wrong *level* of change; this stops it delivering the right level of change
against the wrong *evidence*. In `design` and `motion` the block is stated but
does not block, unless the brief named references that could not be probed.

### 4.4 Degradation

If Playwright cannot launch, the skill degrades in a stated order and **says which
rung it landed on** — it never silently becomes Path A:

1. Playwright headless (primary)
2. Playwright headed
3. The harness's Chrome tools — open the page, screenshot, probe computed styles
   via injected script. Lower fidelity: no reliable property trace, no video.
4. Path A, announced as a fallback with the reason.

## 5. Repository layout

```
SKILL.md                      mode + evidence gate, thesis, red flags
commands/df-design.md         the slash command
scripts/
  probe.mjs                   the prober (§6, §7)
  validate.mjs                range checks, quarantine (§8)
  audit.mjs                   consistency job, corpus and design targets (§11.2)
  render-benchmarks.mjs       corpus -> references/benchmarks.md
  discover.mjs                candidate URL proposals (§10)
  lib/browser.mjs             launch hardening, ported from impeccable
corpus/
  sites.json                  validated records, one per site per probe date
  quarantine.json             rejected fields with their raw capture pointer
patterns/
  <slug>.md                   pattern records: frontmatter + prose + code
candidates/                   runtime-probed patterns awaiting validation
captures/
  <domain>/<date>/            capture bundles (§6.3)
references/
  benchmarks.md               GENERATED — do not hand-edit
  recipes-design.md           seed core patterns (retrofitted, §9.1)
  recipes-motion.md           seed core patterns (retrofitted, §9.1)
  verification.md             unchanged output gate
docs/superpowers/specs/       this document
```

## 6. The prober

`scripts/probe.mjs <url> [--cohort <tag>] [--budget <s>]`

### 6.1 Launch

Port the launch hardening from the `impeccable` skill's browser detector rather
than rediscovering it: on Windows, try the system Chrome channel first, because
the bundled browser launches from a user-writable cache directory whose GPU
process can be denied by security software, producing a crash-loop and visible
window flashes. Fall back to the bundled build, and if that also fails, surface
the original channel error as the cause so the real failure is not lost.

**Decision: Playwright, not Puppeteer.** `references/verification.md` already
imports `@playwright/test`, so the dependency exists. Playwright provides
`recordVideo`, first-class `reducedMotion` emulation and better settling. What we
take from `impeccable` is the hard-won logic, not the literal module.

### 6.2 Passes

Every probe runs the page **twice**:

| Pass | `reducedMotion` | Purpose |
|---|---|---|
| Motion pass | `no-preference` | See the motion. This is the inversion of `verification.md`, which emulates reduced motion precisely to suppress it. |
| Contract pass | `reduce` | Record whether the site honours the contract, and capture the resting state. |

Recording both also turns the existing "19 of 28 honour `prefers-reduced-motion`"
figure from a stylesheet-grep floor into a behavioural measurement.

### 6.3 Capture bundle

```
captures/<domain>/<YYYY-MM-DD>/
  record.json      validated measurements + provenance
  raw.json         everything captured, including quarantined fields
  motion.json      animation inventory + property traces + scroll trace
  frames/          load-*.png, scroll-*.png, hover-*.png, canvas-*.png
  contact.png      thumbnail grid of all frames (the agent's overview image)
  page.webm        optional full-session video
  notes.md         written by the agent AFTER looking at the frames
```

### 6.4 Static measurements

Today's measurements, with the known bugs fixed:

- **Type — archetype-aware.** Measure the largest rendered text in the first
  viewport, whatever element it is. Never require an `h1`. Record the element's
  tag and role alongside the metrics so "this page's opening statement is a
  `<span>` inside a canvas overlay" is itself data.
- **Palette — sampled from painted ancestors.** Walk up from the sampled element
  until a non-transparent background is found. This is the fix for the
  `rgba(0, 0, 0, 0)` grounds in the current corpus.
- **Fonts — with provenance.** Collect from `@font-face` rules in accessible
  stylesheets *and* from network requests matching font extensions. Record the
  source host so commercial faces can be flagged (§12.2). `document.fonts` alone
  does not expose `src` for CSS-declared faces.
- **Structure.** Section boundaries, band heights, ground-colour changes, sticky
  element count and what each sticky element contains.
- **Feature counts.** `mask-image`, `clip-path`, `mix-blend-mode`, `<canvas>`,
  WebGL context, `<video>`, radius distribution, spacing scale.

### 6.5 Known extraction limits — record them, do not paper over them

- **Cross-origin stylesheets throw on `cssRules`.** Same-origin only via the DOM;
  supplement by fetching stylesheet URLs over the network and parsing them, which
  covers CORS-enabled CDNs. Anything still unreachable is recorded as *unknown*,
  not as *absent*. The current corpus already makes this mistake in the other
  direction by publishing a floor as a count.
- **WebGL canvases cannot be read with `toDataURL()`** without
  `preserveDrawingBuffer`. Capture the canvas by screenshotting its bounding box
  instead.
- **Smooth-scroll libraries hijack scrolling.** On a Lenis/Locomotive page,
  `window.scrollTo` may not drive the page. Detect the library and drive scroll
  through wheel events or the library's own API; if scroll cannot be driven,
  record the scroll trace as unavailable rather than emitting a flat trace that
  looks like "no scroll-linked motion."

## 7. Motion capture

The requirement is to capture what the page *does*, in motion, well enough to
copy it. A headless browser cannot record the felt quality of 60fps motion. It
can capture three channels whose combination is sufficient to reconstruct it —
and the spec is explicit that the output is a **reconstruction, not a recording
of the experience**.

### 7.1 Animation inventory

`document.getAnimations()` for every animation and transition: the target's
selector and role, `effect.getTiming()` (duration, delay, easing, iterations,
direction, fill), `playState`, and the animation or transition name. This is
ground truth for CSS and Web Animations API motion — no inference.

### 7.2 Keyframe extraction

Walk accessible stylesheets for `CSSKeyframesRule` and capture the keyframe
bodies, so an inventory entry naming `grid-dot-3-7-upDown` can be resolved to
what it actually animates. Subject to §6.5's cross-origin limits.

### 7.3 Property trace — the channel that catches library motion

**This is the one the inventory cannot replace.** GSAP writes inline styles from
its own ticker and creates no WAAPI animations, so `getAnimations()` returns
nothing for a GSAP-driven page. Framer Motion is mixed: simple transform and
opacity animations may use a WAAPI backend, while springs and layout animations
fall back to rAF and inline styles. A skill that measured only the inventory
would conclude that some of the most motion-rich pages on the web have no motion.

So: select tracked elements — every target in the inventory, plus the opening
composition and the first N section roots — and sample their computed
`transform`, `opacity`, `filter`, `clip-path`, `background-position` and
`mask-position` at a fixed interval (default ~60 samples over 2s) with the page
at rest. Emit per-element property timelines.

### 7.4 Scroll trace

Step scroll from 0 to 100% in N steps (default 24). At each step record scroll
position, the tracked elements' properties, and a frame. This reconstructs the
scroll-to-property mapping directly, which is what makes a scroll-linked effect
copyable instead of guessable. Sticky elements are traced across their whole
sticky range.

### 7.5 Interaction states

Hover and focus on the primary CTA, the nav, and the first card-like repeated
element. Capture before/after frames and the transitions fired.

### 7.6 Library fingerprint

Network requests **and** live globals: `window.gsap`, `window.ScrollTrigger`,
`window.Lenis`, `window.THREE`, `window.Rive`, `window.lottie`, Framer markers,
framework markers. Globals catch bundled copies that the network filenames hide.

### 7.7 Canvas and WebGL

Record presence, drawing-buffer size, context type, and observed rAF cadence.
Capture frames by screenshotting the element's box. Do not attempt shader
extraction (§3).

### 7.8 Frame budget

A twenty-four frame filmstrip at 1440x900 is far too heavy to put in front of a
model wholesale. The bundle therefore always writes `contact.png` — a thumbnail
grid of every frame — as the overview image. The agent looks at the contact sheet
first and pulls **at most three** full-resolution frames. This is a hard budget in
the command's procedure, not a suggestion.

## 8. Validation and quarantine

`scripts/validate.mjs` runs on every record before it reaches the corpus.

**Range checks** with quarantine on failure, never publication:

| Field | Rule |
|---|---|
| page height | reject < 1.5x viewport when the page reports lazy-loading or IO sentinels; re-probe with a scroll-to-bottom settle |
| radius | reject > 200px unless it resolves to a pill (>= half the element's smaller dimension) — normalise pills to `pill` |
| ground colour | reject fully transparent; the sampler must have walked to a painted ancestor |
| font count | reject 0 loaded faces on a page that rendered text |
| hero metrics | absent is legal — record `archetype: none`, do not drop the site |

**Archetype is a measured field, not a precondition.** The classifier assigns one
of `typographic`, `media-stage`, `canvas`, `interactive-demo`, `editorial`,
`none`, or `novel`. A `novel` classification triggers *richer* capture — more
frames, fuller DOM and style dumps — and lands in the quarantine queue for review
as a source of new archetypes.

**A parse failure produces a quarantined record with its raw capture attached.
It never produces a deletion.** Dropped records leave no trace but a smaller `n`,
which makes the resulting bias invisible in the output.

**Aggregates are computed from validated records only**, and carry `n` and
dispersion through to the guidance layer rather than collapsing to a single
number. `references/benchmarks.md` reports medians **per cohort and overall**.

## 9. Pattern records and write-back

### 9.1 The record

`patterns/<slug>.md`:

```yaml
---
id: edge-fade-mask
archetype: chrome
mechanism: mask-image
sources:
  - site: hex.tech
    measured_at: 2026-09-15
    capture: captures/hex.tech/2026-09-15
cohort: [dev-tools]
tier: core            # core | observed | candidate
confidence: n=3
---
```

Body keeps the existing recipes' voice exactly: what it does, why it reads the
way it does, working code, when to use it, when not to. **The 22 existing recipes
become the seed `core` tier**, retrofitted with this frontmatter. Nothing about
their content changes.

### 9.2 Tiers and promotion

```
runtime probe -> candidates/ -> [validation] -> observed/ -> [promotion] -> core/
```

- `candidate` — probed, unvalidated. Usable, but always labelled as such in
  guidance.
- `observed` — passed validation and archetype classification. Automatic.
- `core` — promoted deliberately: by a human, or by the rule *the same mechanism
  observed on two or more independent sites*.

**Guidance always cites the tier of what it is citing.** This is the anti-drift
mechanism, and it is the difference between a skill that learns and one that
rots: a system that writes its own output back into its evidence base without a
promotion gate degrades toward its own priors.

## 10. Discovery

`scripts/discover.mjs --cohort <tag> | --query <text>` proposes new URLs to
probe, from an explicit user list, a per-cohort seed list, or agent web search.

- Proposals are **shown before probing**, never probed unannounced.
- Everything discovered enters as `candidate` and earns its way up.
- Politeness is built in: respect `robots.txt`, one page per site per run by
  default, no authentication walls, modest rate limit, identifying user agent.

## 11. Keeping the knowledge honest

### 11.1 Feedback hook

After the existing verification gate, one line is recorded per job: which pattern
ids were used, and whether the rendered page passed the look. Appended to the
pattern's usage stats. Patterns that are repeatedly used and pass accumulate
evidence for promotion; patterns that are repeatedly abandoned surface for
review. Today this signal is generated and discarded.

### 11.2 Consistency audit

The promotion gate (§9.2) is **prevention at write time**. It judges each new
record in isolation, which is exactly what it cannot see: slow, distributed
degradation. A cohort quietly fills with contaminated sources. Two patterns, each
sound when written, come to contradict each other. A median moves because five
sites redesigned, not because anything was learned. Every individual write passes
its gate and the store still rots.

So detection is a separate, periodic job, with two targets.

**`/df-design audit corpus`** — the accumulated knowledge against itself:

| Check | Fails when |
|---|---|
| Contradiction | Two `core` or `observed` patterns give incompatible guidance for the same archetype and mechanism |
| Duplication | Two records describe one mechanism under different slugs — a merge candidate |
| Cohort contamination | A pattern carries a cohort tag that none of its sources belong to |
| Provenance integrity | `sources[].capture` points at a bundle that no longer exists, or `measured_at` is missing |
| Staleness | A record is older than the freshness threshold (default 180 days) — flagged for re-probe |
| Drift | An aggregate moved more than a threshold since the last audit. The report attributes the move to *new sites*, *re-probed sites* or *quarantine changes*, so a real trend is distinguishable from a data-quality event |
| Tier integrity | A `core` pattern whose confidence no longer meets the promotion rule, or whose sources have all gone stale |
| Citation integrity | A pattern or reference quotes a number that no longer matches the rendered corpus |
| Orphan | A capture bundle no record references; a record whose sources were all quarantined |

Output: `corpus/audit-<date>.md`, findings by severity, each carrying the record
and the evidence. **The audit never mutates the corpus.** It reports; demotion,
merge and re-probe are separate deliberate acts — the same principle as
quarantine, that the job which detects is not the job which destroys.

**`/df-design audit design <path-or-url>`** — a produced design for internal
coherence, and against the evidence it claimed:

| Check | Fails when |
|---|---|
| One type system | More than three type roles in play; display face equals body face; tracking fails to tighten as size grows |
| One motion vocabulary | More than one signature curve doing the main work; durations outside the observed bands; transitions that contradict one another |
| One palette logic | The accent carries more than one semantic job; ground changes that do not align with section boundaries |
| Structural coherence | Repeated elements with inconsistent edges, baselines or inner padding |
| Reduced-motion contract | Motion present with no `prefers-reduced-motion` handling |
| **Evidence match** | The declared `evidence=` does not show up in the work — `evidence=probed:3` was stated, but the output sits on the corpus median and none of the probed patterns appear |

That last row is what closes the loop with §4. Declaring the evidence is cheap,
and without a check the declaration decays into a ritual. `audit design` makes
the evidence gate falsifiable.

`audit design` runs against the rendered page through the same browser plumbing
as the prober — **it is the prober pointed at your own output** — so it inherits
the motion capture and can audit the motion vocabulary rather than only the
static CSS.

## 12. Guardrails

### 12.1 The copying line

The skill's purpose is to learn **techniques and proportions**, not to reproduce
**identities**.

- Permitted: mechanisms (a mask-based edge fade, a scroll-linked transform curve),
  measured proportions, type scale and tracking relationships, easing and duration
  bands, compositional archetypes.
- Not permitted: lifting palette, typeface and illustration language as a *set*
  from one named source; reproducing marks, wordmarks, mascots or proprietary
  illustration; cloning a competitor's page one-for-one.

State this in `SKILL.md`, not only here.

### 12.2 Font licensing

The prober records font source hosts and flags commercial faces. The skill
currently tells people to drop Inter in favour of Söhne, Untitled Sans and ABC
Favorit — all commercial, and the corpus literally contains the string
`ABC Favorit Trial`. Every named-face recommendation must carry a licensing note
and a licensed-alternative path.

### 12.3 Probing conduct

Public pages only, no authentication walls, no bulk crawling, robots-aware, rate
limited. Probing is for design analysis of publicly published pages.

## 13. Changes to existing files

| File | Change |
|---|---|
| `SKILL.md` | command interface; evidence gate sourced from args; tier-citing rule; copying line; licensing note; cohort honesty in the headline table |
| `references/benchmarks.md` | becomes generated output; hand edits forbidden |
| `references/recipes-*.md` | retrofitted with pattern frontmatter as seed `core` tier |
| `references/verification.md` | unchanged, plus the feedback-hook line (§11.1) and a pointer to `audit design` as the mechanical companion to looking at the page (§11.2) |
| `commands/df-design.md` | **new** — the slash command: argument parsing, the echoed gate line, the contact-sheet-then-three-frames procedure (§7.8), the synthesis block (§4.3), the degradation ladder (§4.4) |

## 14. Acceptance tests

1. **Fixture with CSS animations** — inventory finds them with correct timings.
2. **GSAP fixture** — `getAnimations()` returns nothing; the **property trace
   still catches the motion**. This test is the reason §7.3 exists.
3. **Smooth-scroll fixture** — scroll trace either drives correctly or records
   itself as unavailable; it never emits a flat trace.
4. **Known-bad values** — a lazy-loading page reporting 900px height, and a
   3.35e+07px radius, both quarantine rather than publish.
5. **Cross-origin stylesheet** — unreachable rules record as *unknown*, not
   *absent*.
6. **The Antigravity test** — probe a heroless, mostly-animated page. Must
   produce a usable record with `archetype` in `{canvas, novel}`, a non-empty
   `motion.json`, and zero dropped-record behaviour. **If the prober cannot do
   this, it is not finished.**
7. **Regeneration** — re-running the prober across the original site list
   regenerates `benchmarks.md` with the artifact rows quarantined and per-cohort
   medians present.
8. **Audit catches seeded rot** — a corpus with a deliberately planted
   contradiction, a cohort-contaminated pattern, a dangling capture reference and
   a stale `core` record must produce one finding each, and must leave the corpus
   unmodified.
9. **Audit catches a false evidence claim** — a design declaring
   `evidence=probed:3` whose output matches the corpus median and cites none of
   the probed patterns must fail the evidence-match check.
10. **Synthesis is not skippable** — a live run must emit the §4.3 step-5 block
    before any code, with every decision carrying an `evidence:` or `subject:`
    trace. A block in which *every* decision traces to `evidence` is reported as
    a copy risk against the copying line (§12.1), not silently accepted.

## 15. Risks

| Risk | Mitigation |
|---|---|
| Write-back degrades the corpus | Tiers + explicit promotion (§9.2) at write time, plus the periodic consistency audit (§11.2) for the slow drift that no single write gate can see |
| The audit itself becomes a ritual nobody reads | It emits findings by severity with evidence attached, and never mutates — so acting on it is a deliberate, visible act rather than a silent background correction |
| Probing is slow, blowing the job's time budget | `--budget` cap; contact sheet + 3-frame rule (§7.8); Path A always available |
| Sites change or block automation | Per-record `measured_at`; graceful degradation ladder (§4.4); unknown vs absent (§6.5) |
| Frames overwhelm the context window | Hard 3-frame budget in the command procedure, contact sheet first |
| Novel archetypes keep breaking the classifier | That is the designed outcome — quarantine surfaces them for schema revision rather than hiding them |

## 16. Sequencing

1. `lib/browser.mjs` + `probe.mjs` static pass + capture bundle
2. Motion pass (§7) — inventory, keyframes, property trace, scroll trace
3. `validate.mjs` + quarantine + archetype classifier
4. Corpus + `render-benchmarks.mjs`; regenerate from a re-probe of the original list
5. Pattern schema; retrofit the 22 existing recipes as seed `core`
6. `commands/df-design.md` + `SKILL.md` rewrite (gate, tiers, guardrails)
7. Write-back, tiers, promotion
8. `audit.mjs` — `corpus` target first, then `design` (which reuses the prober)
9. `discover.mjs`
10. Feedback hook

Each step is independently useful; the skill stays shippable between steps.
