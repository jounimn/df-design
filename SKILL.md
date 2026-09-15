---
name: df-design
description: Use when designing, rebranding, or animating any web UI - landing pages, marketing sites, product surfaces, dashboards. Requires declaring a mode (motion / design / both), measures the work against benchmarks from 30 probed production sites, supplies working implementations rather than parameter tables, and will not let the work be called done until someone has looked at the rendered page.
---

# df-design

Design and motion for the web, built from measurements of real production
sites rather than from taste assertions.

## MANDATORY: declare the mode first

**This skill does not begin until you have declared a mode.** State it out
loud, in one line, before any other action — before reading files, before
asking questions, before writing a single rule of CSS:

| Mode | Means | Do NOT |
|---|---|---|
| `motion` | Animation, transitions, choreography. Identity is already settled and is not yours to change. | Touch palette, type scale, or layout structure. |
| `design` | Identity and structure: type, colour, layout, spacing, composition. | Add or change animation. A static page must be finished as a static page. |
| `both` | A rebrand. Identity and motion together. | Start with motion — identity first, always. See "Order of operations". |

Format: `df-design: mode=<motion|design|both> — <one line on what that covers here>`

**If the request does not make the mode obvious, ask.** Do not guess. The
most expensive failure this skill exists to prevent is delivering a
finish-level change when someone asked for a design-level one — polished
tokens and type on an untouched layout, handed over as "a rebrand". They
will tell you nothing changed, and they will be right.

### Order of operations in `both`

Identity → structure → motion. Never the reverse. Motion applied to a
generic layout makes a generic layout that moves. If you find yourself
reaching for an entrance animation to make a section interesting, the
section is the problem.

## The evidence this skill is built on

Thirty production sites were loaded in a real browser and measured:
computed type metrics, loaded font faces, palette, animation libraries,
canvas/WebGL usage, sticky counts, mask/blend/clip usage, and whether they
honour `prefers-reduced-motion`. The niche skewed to data, analytics and
developer tools — Stripe, Linear, Vercel, ClickHouse, Hex, MotherDuck,
Atlan, Datafold, Neon, Supabase, Warp, Resend, Observable, PostHog, dbt,
Grafana, Metabase, Tinybird, Monte Carlo, Cube, WorkOS, VoidZero, Railway,
Cerebrium, Fibery, Dovetail, Lovable, Cosmos, Trionn, Infinite Machine.

Full numbers: `references/benchmarks.md`. The headline findings:

| Measure | Production median | Common failure |
|---|---|---|
| Hero type size | **64px** (range 44–112) | 32–48px "large" heading |
| Hero tracking | **-0.025em**, down to -0.07em | `normal`, or a timid -0.01em |
| Page height | **9,329px** | Under 3,000px — six thin bands |
| Distinct font faces | **5** | One neutral sans for everything |
| Ships a monospace face | **25 of 28** | No mono anywhere |
| Uses Inter as the *display* face | **4 of 28** | Inter for display |
| CTA corner radius | **6px** | 12–16px, uniformly |
| Honours `prefers-reduced-motion` | 19 of 28 | Never tested |

**The most load-bearing finding:** premium pages are not built from more
keyframes. They are built from **masks, clip paths and blend modes**.
Measured element counts using each: PostHog 164, Stripe 99, Fibery 94,
Cerebrium 85, Linear 54. A page with zero masks and zero blend modes will
read as flat no matter how carefully its fade durations are tuned.

## Read the mode's reference file, then work

- `motion` → `references/recipes-motion.md`
- `design` → `references/recipes-design.md`
- `both` → both, design first

Every recipe there is working code traced to a named site that ships it.
Do not substitute a parameter table for an implementation: "Premium =
400ms, ease-out, no overshoot" is what produces `opacity: 0 → 1` plus an
8px rise, and calling that a motion identity is the failure mode this
skill was written against.

## The verification gate — not optional

**Work is not done until the rendered page has been looked at.** Not the
test suite, not the type-checker, not the build. The page.

Tests pass on code that renders nothing. CSS classes that do not exist
compile silently to nothing. A virtualizer measuring an unbounded
container reports every row visible and every assertion still passes.
Each of those shipped, green, in a real project — and each was caught in
the first thirty seconds of looking at the page.

`references/verification.md` has the procedure, including how to capture a
page *at rest* so scroll-triggered content is not photographed at
`opacity: 0`.

Report honestly what the look showed. "I could not verify this visually"
is an acceptable sentence. "Done" without having looked is not.

## Red flags

| Thought | Reality |
|---|---|
| "I'll pick the mode as I go" | The mode is the first thing said, every time. It scopes everything after it. |
| "They said rebrand, so tokens and type" | A rebrand changes structure. Swapping tokens on an unchanged layout is a reskin — name it that, or do the real thing. |
| "The motion spec says 400ms ease-out, so I'm done" | Parameters are not a design. What *moves*, and why, is the design. |
| "Inter is clean and safe" | 4 of 28 sites use it for display. Safe is the diagnosis, not the defence. |
| "More animation will make it feel premium" | The measured answer is masks and blends, not more keyframes. |
| "Big hero, then five short sections" | The median reference page is 9,329px over 8–16 bands. Thin pages read as unfinished. |
| "Tests pass, so it works" | Tests passed on a dead virtualizer and 41 CSS classes that compiled to nothing. Look at the page. |
| "It animates on scroll, I'll screenshot it" | A full-page capture never scrolls; your content is photographed at `opacity: 0`. See `verification.md`. |
| "Reduced motion is an edge case" | WCAG 2.3.3. Vestibular reactions include migraine and nausea. 19 of 28 production sites handle it. |
