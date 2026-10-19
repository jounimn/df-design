---
name: df-design
description: Use when designing, rebranding, auditioning or animating any web UI - landing pages, marketing sites, product surfaces, dashboards, admin and error pages - or when choosing a visual identity or style direction, comparing design directions, or turning reference sites, screenshots or videos into a design. Measures the work against benchmarks from 30 probed production sites and will not let it be called done until someone has looked at the rendered page.
---

# df-design

Design and motion for the web, built from measurements of real production
sites rather than from taste assertions, and built around a **deliberate
identity** rather than a generic template.

## Step 0: the invocation note binds the whole run

Anything the author writes when calling the skill (`/df-design <text>`, or
the sentence that triggered it) is a **standing condition**, not a passing
comment. Read it before anything else and record it as **Conditions**:

- **Scope:** which surfaces are in play. "Only rework the main page" means
  the main page and nothing else.
- **Constraints:** what must not change ("keep the logo", "no new fonts",
  "stay on Tailwind").
- **Answers given early:** a path, a mode, a reference, a deadline. Do not
  ask again what the note already settled. The same holds for any answer
  the author gives before its stage ("no browser tools" in their first
  reply): it is settled, and the later question is skipped.
- **Notes and preferences:** taste, tone and worries ("it feels dead",
  "the client hates purple"). These feed the author's intent (`identity.md` §3).

**A scope condition binds every stage of the workflow** for this run:

| Stage | Bound to the scope |
|---|---|
| Requirements | Ask only what the scoped surfaces need |
| Research and library search | Candidates for the scoped surfaces only |
| Auditions | Show the scoped page only |
| Assets | Icons and images for the scoped surfaces only; the stock-image question covers only them |
| Loading tier | Priced for the scoped surfaces only |
| Identity brief | `Surfaces:` lists only the scope; out-of-scope surfaces are named as untouched |
| Build | Touch nothing outside the scope: no shared token, component or global stylesheet change that would alter another surface, unless the author agrees |
| Selling-positioning | Logo system and mockups are brand-wide; the site section shows the scoped surfaces only |
| Consistency check | Run on the scoped surfaces. Where the new page now clashes with an untouched surface, **report it as a note** for the author ("the 404 still uses the old navy; out of scope") and do not fix it |

Conditions outrank the skill's defaults. If a condition conflicts with a
rule here (for example "no icons"), say so once, plainly, and follow the
author. The one exception is the four image rules in `images.md` (free,
commercial, no credit, no watermark): those protect the author legally and
are not waived by a preference. These forbid third-party watermarks in what
ships; the author's own protective watermark (`watermark.md`) is a different
thing.

In the first message, restate the conditions in one line so the author can
correct a misreading: "I'll rework only the homepage and leave every other
page as it is."

## MANDATORY: open with two answers

**This skill does not begin until both are settled**: answered by the
author, by the invocation note, or obvious from the request, before reading
files, before research, before a single rule of CSS. A third question, the
watermark, is asked in the same message but does not block the start
(question 3, below).

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

**3. Watermark: will the work be sold?** Ask in plain words, in the same
first message, on both paths. Skip it if step 0 already settled it. Unlike
path and mode, it **does not block the start**: if the author leaves it
unanswered, record `watermark=none` and do not ask again.

> Will this work be sold to a client? If you like, I can put a watermark on
> everything I show you — a text pattern, or your image/logo with a text
> pattern — repeated across the whole screen at low opacity, and keep a
> clean copy separately for delivery after payment.

If yes, ask for the text (default: the author's studio or name) and, for the
image variant, the file or permission to use the author's logo. Types,
opacity, scope and the preview/final split: `references/watermark.md`.

Once path and mode are known (and the watermark answered or defaulted to
none), record them as one status line:

`df-design: path=<audition|design> mode=<motion|design|both> scope=<surfaces in play> watermark=<none|text:"…"|image+text:"…"> load=<fast|medium|high|custom> selling=<now|end|skip> tier=<fast|medium|high> — <conditions from step 0, one line>`

`load=` is the site's loading tier, the author's answer to the tier
message (`audition.md` §4). The message is asked with the candidates (on
the audition path, in the same message as the auditions); `load=` is
filled when the author answers it, and never by you. `selling=` and `tier=` are filled when the detour is
offered (`selling-positioning.md` §1). `tier=` is the presentation's motion
tier, the author's choice, and is left out when `selling=skip`. Until the
detour is offered, leave both out.

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
- **Stock images, always asked:** "May I use free stock images (free for
  commercial use, no credit line, no watermark) where you have no photos of
  your own?" Yes, no, or only for some pages. Icons are not asked about;
  they are always used (`icons-and-assets.md` §0).
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
Step 0 conditions  →  Author intent  →  Identity definition  →  Reference & identity research
      →  [Playwright decision]  →  Design direction  →  HTML audition*
      →  Tier message (with the auditions; on the design path, with the direction)
      →  Author selection*  →  [selling-positioning: now / end / skip]**
      →  Assets (icon set + approved images)
      →  Loading tier confirmed (images priced; combinations re-priced)  →  Identity brief
      →  Implementation, one surface at a time:
           [surface spec → author approves → build → verify] → next surface
      →  Consistency validation  →  Verification gate  →  [selling-positioning: end]**
                                         * audition path only
                                        ** optional detour, see below
```

`selling-positioning` is not a third path. It is an optional detour,
recorded as `selling=<now|end|skip> tier=<fast|medium|high>`. It has no
market research: positioning comes from the identity and the author's
intent. In the `audition` path the offer
follows Author selection. In the `design` path it follows the approval of
the identity brief. On `end`, the path runs after the verification gate.
Everything about it: `references/selling-positioning.md`.

Assets are split across three points. **Ask** about stock images in the
first message. **Shortlist** image sources and icon sets that fit each
candidate during research. **Pick** the actual images and the one icon set
in the Assets stage, after the identity is chosen and before the loading
tier is confirmed, because images are most of a page's weight and the
tier confirmation has to price them.

The loading tier is asked at two fixed points, and the first one is never
skipped. **With the candidates:** the tier message (`audition.md` §4) goes
in the same message as the auditions (audition path) or the design
direction (design path), priced for each candidate, so the author chooses
the identity with its cost in view. Every candidate being fast is not a
reason to leave it out; the message then says what medium and high would
add, or that they add nothing. **After Assets:** the chosen tier is
confirmed with the images priced, and re-sent in full whenever the price
changed: the author combined candidates, asked for a technique from a
heavier tier, or the images weigh more than the first message assumed.

| Stage | Read |
|---|---|
| Intent, references, identity, research, identity brief, multi-surface consistency | `references/identity.md` |
| Candidate identities, the search engine of every direction | `references/identity-library.md` |
| Playwright decision, HTML auditions, the loading-tier message to the author | `references/audition.md` |
| Building it | `references/recipes-design.md` / `references/recipes-motion.md` (`both`: design first) |
| Icons (mandatory), illustration, textures | `references/icons-and-assets.md` |
| Stock photographs: asking, sources, search, treatment, weight | `references/images.md` |
| Looking at it | `references/verification.md` |
| Watermark: question, layer, preview and final | `references/watermark.md` |
| Selling-positioning: logo, positioning, mockups, slideshow, export | `references/selling-positioning.md` |

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
- **The approved identity is binding** on every surface in scope: landing,
  app, admin, DevOps, docs, 404, unless step 0 narrowed the scope.
  Expression adapts per surface. The identity does not.
- **The author picks the loading tier.** Recommend the cheapest tier that
  fully delivers the identity, then send the tier message
  (`audition.md` §4): fast, medium and high expensive loading, each costed
  for this project, with custom offered if the author declines. It is sent
  with the candidates, every run, even when every candidate is fast, and
  confirmed after Assets. When the author combines candidates or
  techniques across tiers, each technique is listed with its own tier and
  cost, the author keeps or drops each one, and the project tier is the
  heaviest technique kept. Heavy libraries need a reason in the brief.
- **Icons always; stock images only with the author's yes.** Every image
  must be free for commercial use, need no credit line, and carry no
  watermark in the file that ships. In `motion` and `both`, icons and
  approved images are part of the motion plan (`recipes-motion.md` §15).

## MANDATORY: one surface at a time

When the work covers more than one surface (landing, app, admin, ops,
docs, 404), **work on one surface at a time, and move to the next only when
the current surface's spec has been approved by the author and
implemented.** Approved and not built is not done. Built and not approved
is not done. Ideas, sketches and plans for other surfaces do not count as
progress on them.

**Which surface is current.** The author names it, or it is read from the
project: the route, file or component being edited, the branch, the last
surface the author discussed. The author's word wins over the worktree. If
the two disagree, or neither makes it clear, ask before writing anything.

**The loop, per surface:**

1. **Surface spec.** Write a short spec for this surface only: who uses it,
   on what device, its content and flows, its density, and how it carries
   the identity (`identity.md` §9). Keep it in its own place (e.g.
   `docs/surfaces/<surface>.md`, or a clearly titled message).
2. **Author approves it.** An explicit yes on *this* spec. Approval of the
   identity brief is not approval of a surface spec, and silence is not
   approval.
3. **Build it.** Only what the approved spec says.
4. **Verify it.** Look at the rendered surface (the verification gate) and
   report what the look showed.
5. **Mark it done** in the surface ledger (`identity.md` §8). Only then
   start the next surface's spec.

**Never mix premises between surfaces.** Each spec holds only its own
surface's assumptions. The admin's "counter tablet, dense table" is not the
landing page's premise, and the landing page's "first-time visitor on a
phone" is not the admin's. Anything that truly applies to every surface
(type, colour tokens, icon set, voice) belongs in the identity brief, where
the author approves it once. Never carry it over from one surface spec into
another.

**Ideas for other surfaces go on a "Later" list** at the end of the current
spec, and nothing is built from them until that surface's own turn. If
working on one surface shows that a shared token or component must change,
stop, tell the author, and change it through the brief, not quietly from
inside the current surface.

**Exception, only on the author's word.** If the author explicitly asks
for several surfaces at once (a step 0 condition), do it, but still keep a
separate spec and a separate ledger row for each. A loose phrase ("start
with the landing, and do the admin while you're at it") is an **order**,
not a request for parallel work: say back the order you will follow, offer
the parallel option in one line, and work one at a time unless the author
confirms it. A condition the author gives mid-run binds the same way as a
step 0 note.

What this rule does **not** forbid:

- **Asking every surface's practical questions in the first message**
  (users, devices, flows). That is gathering facts, not working on those
  surfaces. The facts go in the brief's Practical line; what they mean for
  a surface's design is decided only in that surface's spec.
- **Creating the shared token file and component vocabulary** while
  building the first surface, **as long as they come only from the identity
  brief**. Anything a surface needs beyond the brief is a brief change,
  asked of the author, not a token added along the way.
- **A consistency check per surface.** After each surface is verified,
  check it against the brief and the surfaces already built. The full
  `identity.md` §10 check runs once, after the last surface.

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
| "They said 'just the homepage', but the shared header needs the new tokens too" | Step 0 scope binds the run. Changing shared tokens changes other pages. Ask first, or scope the change to the page. |
| "Their note was just a comment" | What the author writes when calling the skill is a condition for the whole run. Record it in step 0. |
| "While I'm here, I'll sketch the admin too" | One surface at a time. Note it on the Later list; build nothing for another surface until its own spec is approved. |
| "The brief was approved, so the surface specs are too" | Approval of the identity brief is not approval of a surface spec. Ask for a yes on each. |
| "The landing's assumptions obviously hold for the admin" | Each surface has its own premises. Shared ones belong in the brief, approved there. |
| "The 404 spec is approved, so I can start the next page" | Approved is not implemented. Build and verify it first, then move on. |
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
| "Fast tier obviously fits; I'll just use it" | Recommending is yours, choosing is the author's. Send the tier message. |
| "Every candidate is fast, so there is nothing to ask" | The question is asked every run, with the candidates. Fast is the recommendation, not the answer. The message says what medium and high would add, or that they add nothing. |
| "The index page says 'tier fast' next to each audition" | A label is not the tier message. The author answers the tier message, priced for this project, sent in the same message as the auditions. |
| "They combined A's type with B's canvas; I'll take the heavier tier" | Re-send the tier message with every technique listed, each with its own tier and cost. The author keeps or drops each one; the project tier follows what they keep. |
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
| "No photos yet, so I'll drop in some stock" | Ask first. Then only images that are free for commercial use, need no credit and ship with no watermark. `images.md`. |
| "It was on a free stock site, so it's free" | Paid, watermarked results are mixed into free stock searches. Check the item, not the site. `images.md`. |
| "Typographic identity, so no icons" | Icons are mandatory in controls, forms, status and admin. Pick a set that fits the identity. |
| "Motion is for the layout; the images just sit there" | In `motion` and `both`, icons and images are in the motion plan. `recipes-motion.md` §15. |
| "The icons are free, I downloaded them" | Free download, attribution-required and non-commercial are three different things. `icons-and-assets.md`. |
| "The images rule says no watermark, so I can't add one" | That rule is about third-party marks in what ships. The author's protective watermark is separate. `watermark.md`. |
| "They chose an audition, so go straight to assets" | Offer `selling-positioning` first: now, at the end, or skip. `selling-positioning.md` §1. |
| "An icon per feature item will carry the section" | Three columns, three circled icons, three paragraphs is the template tell. None of the thirty measured sites do it. |
