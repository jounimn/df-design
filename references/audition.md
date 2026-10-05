# Audition

An audition answers one question: **"Is this the visual identity and
presentation I want?"** It shows the author several candidate identities
(`identity.md` §4) as real rendered pages, side by side, before anything
is built for real.

---

## 1. Ask about Playwright — after research, before auditioning

Once identity research is done, ask the author in one line:

> Playwright / browser inspection — allowed or not allowed?

**Allowed:** use it to inspect and probe reference sites
(`node scripts/probe.mjs <url>`), capture screenshots, test responsive
widths, compare implementations, exercise interaction states and motion, and
run the verification gate (`verification.md`).

**Not allowed:** work from what the author supplied and from non-browser
tooling: fetching HTML and CSS, reading supplied screenshots and video
frames, and the identity library. Research still happens. The verification
gate is still mandatory, but **the author** opens the files and reports
back; say exactly what to look at.

For auditions this means: build them anyway, then send them **marked
unverified**, with a short checklist, and ask the author to look **before
choosing**. A choice made between pages that render broken is a choice
between bugs. Put first on the checklist whatever the code cannot prove,
because these fail silently:

- **Decorations that carry meaning:** strike-throughs, underlines, stamps
  and highlights drawn with pseudo-elements or masks. If one fails to draw,
  the sentence can say the opposite. ("Do lado ~~da empresa~~ de quem
  trabalha" rendered without its strike reads "on the company's side".)
- **Fonts:** did the display face load, or did a fallback replace it?
- **The phone width:** anything cut off or overlapping at 390px?
- **Icons:** do they show, at the right size, beside their words?

If the author volunteered the answer earlier ("no browser tools" in their
first reply), it is settled. Do not ask again (`SKILL.md`, step 0).

Otherwise, do not ask before the research stage. The question is about how
to look at things, and only matters once there is something to look at.

---

## 2. What an audition is

One **small, self-contained HTML file per candidate identity**, plus an
index page that links them or shows them side by side.

Each audition contains, and only contains:

- navigation
- a hero
- representative type: display, text and the instrument/mono role if the identity has one
- the colour system in use (not a swatch sheet)
- two or three example components: a button, a card or list row, an input
- mock content and data
- imagery: the author's own, or stock images that pass `images.md` **if the author said yes**, treated the identity's way; otherwise honest labelled placeholders
- icons from the set that fits this candidate, in the nav and the components (icons are mandatory)
- a hint of the identity's interaction or motion, if it has one

```
auditions/
├── index.html      links or iframes every candidate, with the identity name and one line of intent
├── a-<name>.html
├── b-<name>.html
└── c-<name>.html
```

**Same content in every audition.** Use the same headline, the same nav
items and the same mock data, so the only variable is the identity. When
content differs, the author compares copy instead of identities. An
identity may add its own *devices* (a masthead line, a countdown band, a
stamp), but not new *content*: no extra claims, sections or products that
the other candidates lack.

**Unmistakably different.** If two candidates could be mistaken for each
other at a glance, one of them is not a candidate. Replace it.

Use HTML, never ASCII mockups or prose descriptions, for anything the
author is choosing between visually.

---

## 3. What an audition is not

Not a first draft of the site. Do not build:

- backend integration or business logic
- full production content
- routing, auth, data pipelines, build infrastructure
- every page

An audition that took as long as the real page has stopped being an
audition. Keep each file small enough to read in one sitting.

Verify each one anyway (`verification.md`). An audition that renders
broken misleads the choice.

Then run the audition check, with the author's answer to the stock-image
question:

```bash
node scripts/check-auditions.mjs auditions/ <yes|no> auditions/captures/
```

It confirms an index and at least two candidates exist, and that every
page renders at 1440 and 390 with no errors, no horizontal scroll and icons
present. If the author said **no**, it confirms no raster image appears.
If **yes**, it confirms every image shown is recorded with a source URL and
a licence that needs no credit, and that each source page answers. It
cannot see a watermark or a missing strike-through. Looking at the
captures is still yours.

### After the author chooses

The author selects, combines, rejects or redirects (`identity.md` §5).
Record the result as the identity brief (`identity.md` §8). From then on,
implementation is checked against the brief, not against the audition
file. The audition is evidence, not spec.

---

## 4. Loading cost: cheapest viable option first

Every library and heavy resource has a loading and runtime cost. Expensive
is not automatically bad: a costly library is right when it materially
serves the identity. Unnecessary cost is always wrong.

| Tier | Typically | Budget sense |
|---|---|---|
| **Fast expensive loading** | CSS only (gradients, masks, clip-path, blend modes, `@keyframes`, scroll-driven animations), SVG, system fonts or one or two subset webfonts, small vanilla JS | Adds roughly nothing past the fonts; works without JS |
| **Medium expensive loading** | Several webfonts, a small motion library (GSAP core, Motion One, Lenis), Lottie for a few illustrations, heavy optimised imagery, `backdrop-filter` across panels | Tens of KB of JS, or noticeable image weight and GPU work |
| **High expensive loading** | WebGL / Three.js / shader scenes, 3D models, physics, background video, large Lottie or Rive sets, canvas particle systems | 100+ KB JS and/or MBs of media; main-thread and GPU cost; needs a fallback |

The measured finding (`benchmarks.md`) supports starting cheap: premium
pages are built mostly from **masks, clip paths and blend modes**, which
are fast-tier CSS, not from heavy libraries.

### The tier is the author's choice, not yours

You recommend; **the author decides**. Deciding the tier silently, even
correctly, skips the author's choice. Never write a tier into the identity
brief that the author has not picked.

**When:**

- **Audition path:** label each audition with the tier it needs, one line
  on the index page ("B: fast tier, CSS and SVG only"). After the author
  picks an identity, send the tier message below before writing the brief.
- **Design path:** send the tier message together with the identity
  direction, before implementation.
- **Motion mode:** send it before choosing any motion library.

**Price the images.** Images are usually most of a page's weight, so the
Assets stage (`images.md`) comes first, and each tier's cost line includes
the images it implies.

**The tier message.** Keep the four tier names exactly as written. Fill in
every slot for *this* project. A generic
description of the tiers is not a filled slot.

```
Loading cost: how heavy the site is to load. Pick one:

1. Fast expensive loading (recommended): <what this identity looks and does at this tier,
   concretely, e.g. "the newsprint layout, live loaf counts and the
   countdown, all in CSS and a little plain JavaScript">.
   Cost: <rough weight, e.g. "~150 KB first load, works without JavaScript">.
2. Medium expensive loading: <what it adds for this project, e.g. "a page-turn animation
   between sections and photo-heavy loaf pages">.
   Cost: <e.g. "+40 KB of script, heavier images">.
3. High expensive loading: <what it adds, e.g. "a 3D loaf you can turn">.
   Cost: <e.g. "+300 KB of script, needs a fallback on older phones">.

<If the cheapest tier cannot fully deliver the identity: say exactly what
it cannot do and which tier can. Otherwise: "Fast does everything this
identity needs.">
```

Only when the author declines the recommendation, offer the fourth choice
explicitly:

```
4. Custom / unrestricted: no limit. Tell me which effects you want, and I'll tell you
   what each one costs.
```

If an option would add nothing for this identity, say so in its line
("Medium: nothing this identity needs"). Do not invent features to fill a
tier.

Never pick a heavier library because it is popular, fashionable,
feature-rich or technically impressive. Record **the author's choice** and
its justification in the identity brief. Every surface inherits it, so the
404 does not ship Three.js because the landing page does.

Whatever the tier, the reduced-motion contract (`recipes-motion.md` §14)
and a no-JS-legible baseline still apply.
