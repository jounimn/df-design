---
name: df-design
description: Use when designing, rebranding, auditioning or animating any web UI - landing pages, marketing sites, product surfaces, dashboards, admin and error pages - or when choosing a visual identity or style direction, comparing design directions, or turning reference sites, screenshots or videos into a design. Measures the work against benchmarks from 30 probed production sites and will not let it be called done until someone has looked at the rendered page.
---

# df-design

Design and motion for the web, built from measurements of real production
sites rather than from taste assertions, and built around a **deliberate
identity** rather than a generic template.

## MANDATORY: open with two answers

**This skill does not begin until both are settled**: answered by the
author or obvious from the request, before reading files, before research,
before a single rule of CSS.

**1. Path: audition or design?** Ask the author unless they have already
said:

| Path | Means |
|---|---|
| `audition` | Find the identity first: build candidate directions as small HTML pages, let the author compare and choose, then implement. |
| `design` | Go straight to implementation. **The identity is still established first**: stated, researched and written down. It is just not auditioned. |

**2. Mode: what kind of work?**

| Mode | Means | Do NOT |
|---|---|---|
| `motion` | Animation, transitions, choreography. Identity is already settled. Read it from the existing site; do not change it. | Touch palette, type scale, or layout structure. |
| `design` | Identity and structure: type, colour, layout, spacing, composition. | Add or change animation. A static page must be finished as a static page. |
| `both` | A rebrand. Identity and motion together. | Start with motion. Identity first, always. |

Once both are known, record them as one status line:

`df-design: path=<audition|design> mode=<motion|design|both> — <one line on what that covers here>`

The status line is for the record and for developers. **Ask the author in
their own words.** A bakery owner gets "Would you like to see three short
sample pages in different styles before I build, or should I go straight to
building?", not `path=?`.

**If the request does not make either answer obvious, ask.** Do not guess.
The most expensive failure this skill prevents is delivering a finish-level
change when a design-level one was asked for: polished tokens and type on an
untouched layout, handed over as "a rebrand".

**In the same first message, ask what the build needs that the brief did not
say.** Identity questions do not replace these, and every surface depends on
the answers. Ask only about what is missing:

- **Content and assets:** logo, photography, copy, menu or catalogue, prices
- **Language(s)** and locale: currency, date formats, legal notices
- **Flows:** how ordering, booking or sign-up actually works, payment methods, cut-offs, stock limits
- **Users and devices** for each surface: who uses the admin, on a phone or a counter tablet
- **Constraints:** existing brand, hosting, accessibility needs, deadline

Keep it to one short list the author can answer in a minute, and offer to
proceed on stated assumptions if they would rather not answer.

## The workflow

The path and mode are not switches that pick a generator. They set which
stages of one workflow run:

```
Author intent  →  Identity definition  →  Reference & identity research
      →  [Playwright decision]  →  Design direction  →  HTML audition*
      →  Author selection*  →  Identity brief  →  Implementation
      →  Consistency validation  →  Verification gate
                                         * audition path only
```

| Stage | Read |
|---|---|
| Intent, references, identity, research, identity brief, multi-surface consistency | `references/identity.md` |
| Candidate identities, the search engine of every direction | `references/identity-library.md` |
| Playwright decision, HTML auditions, loading-cost tiers | `references/audition.md` |
| Building it | `references/recipes-design.md` / `references/recipes-motion.md` (`both`: design first) |
| Icons, illustration, textures | `references/icons-and-assets.md` |
| Looking at it | `references/verification.md` |

In `motion` mode the identity stages shrink to one: read the identity the
site already has and keep to it.

The rules that govern every stage:

- **A reference is not an identity.** A supplied site, screenshot or video
  shows what the project *could* be. Classify what it demonstrates; never
  copy it wholesale. The author's intent outranks any single reference.
- **The library expands; the author directs.** Propose candidates the
  author would not have reached, but never override a stated direction.
- **Do not stop at the first good reference.** Research until the
  direction is backed by the strongest material available, and log what
  you rejected.
- **The approved identity is binding** on every surface: landing, app,
  admin, DevOps, docs, 404. Expression adapts per surface. The identity
  does not.
- **Cheapest viable loading tier first.** Heavy libraries need a reason in
  the brief.

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

These numbers describe one niche and one identity family (dark product
precision). They are the benchmark for that family. For an identity from
elsewhere in the library (newsprint bakery, Victorian course, wabi-sabi
ceramics), the identity's own grammar wins where the two disagree. The
craft findings below hold for every identity.

**The most load-bearing finding:** premium pages are not built from more
keyframes. They are built from **masks, clip paths and blend modes**.
Measured element counts using each: PostHog 164, Stripe 99, Fibery 94,
Cerebrium 85, Linear 54. A page with zero masks and zero blend modes will
read as flat no matter how carefully its fade durations are tuned.

Every recipe in the recipe files is working code traced to a named site
that ships it. Do not substitute a parameter table for an implementation:
"Premium = 400ms, ease-out, no overshoot" is what produces `opacity: 0 → 1`
plus an 8px rise, and calling that a motion identity is the failure mode
this skill was written against.

## The verification gate — not optional

**Work is not done until the rendered page has been looked at.** Not the
test suite, not the type-checker, not the build. The page. Every surface
of it, auditions included.

Tests pass on code that renders nothing. CSS classes that do not exist
compile silently to nothing. A virtualizer measuring an unbounded
container reports every row visible and every assertion still passes.
Each of those shipped, green, in a real project — and each was caught in
the first thirty seconds of looking at the page.

`references/verification.md` has the procedure, including how to capture a
page *at rest* so scroll-triggered content is not photographed at
`opacity: 0`. If Playwright is not allowed, the author does the looking;
tell them exactly what to check.

Then run the consistency check in `identity.md` §10 across every surface.

Report honestly what the look showed. "I could not verify this visually"
is an acceptable sentence. "Done" without having looked is not.

## Red flags

| Thought | Reality |
|---|---|
| "I'll pick the mode as I go" | Path and mode are the first thing said, every time. They scope everything after. |
| "I'll send the author the `path=` line" | That line is for the record. Ask the author in plain words. |
| "Identity first; the practical details can wait" | Payment, languages, stock and devices shape every surface. Ask in the first message. |
| "They sent a link, so make it look like that" | A reference is a signal, not the identity. Classify what it demonstrates. `identity.md` §1–2. |
| "This reference is good enough" | The first acceptable reference is where research starts. Find the strongest and log the rejects. |
| "It's a SaaS-ish product, so the SaaS look" | The identity comes from the subject and the author's intent. Check the library for what else it could be. |
| "One direction is obviously right; skip the alternatives" | Three candidates, one from the subject's own world, one the author would not have reached. |
| "The audition should be production-ready" | An audition answers "is this the identity?" Small, same content in each, no backend. |
| "The admin and 404 are just utility pages" | Same product, same identity, adapted density. A stock admin panel is a different product. |
| "Three.js will make it feel premium" | Cheapest viable tier first. Masks and blends are CSS. |
| "They said rebrand, so tokens and type" | A rebrand changes structure. Swapping tokens on an unchanged layout is a reskin — name it that, or do the real thing. |
| "The motion spec says 400ms ease-out, so I'm done" | Parameters are not a design. What *moves*, and why, is the design. |
| "The plan is obvious, I'll go straight to code" | Write the plan, then ask what you'd have made for a similar brief. Whatever comes out the same is a default. `recipes-design.md` §8. |
| "25 of 28 ship mono, so mono on every label" | Mono labels real data. On every eyebrow and meta line it is template chrome. `recipes-design.md` §1, §7. |
| "Inter is clean and safe" | 4 of 28 sites use it for display. Safe is the diagnosis, not the defence. |
| "More animation will make it feel premium" | The measured answer is masks and blends, not more keyframes. |
| "Big hero, then five short sections" | The median reference page is 9,329px over 8–16 bands. Thin pages read as unfinished. |
| "Tests pass, so it works" | Tests passed on a dead virtualizer and 41 CSS classes that compiled to nothing. Look at the page. |
| "It animates on scroll, I'll screenshot it" | A full-page capture never scrolls; your content is photographed at `opacity: 0`. See `verification.md`. |
| "Reduced motion is an edge case" | WCAG 2.3.3. Vestibular reactions include migraine and nausea. 19 of 28 production sites handle it. |
| "The icons are free, I downloaded them" | Free download, attribution-required and non-commercial are three different things. `icons-and-assets.md`. |
| "An icon per feature item will carry the section" | Three columns, three circled icons, three paragraphs is the template tell. None of the thirty measured sites do it. |
