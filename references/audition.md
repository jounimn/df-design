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

Do not ask before the research stage. The question is about how to look at
things, and only matters once there is something to look at.

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
- imagery or honest placeholders (a labelled box, not a stock photo pretending to be final)
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
content differs, the author compares copy instead of identities.

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

### How to present it

1. **Recommend the cheapest tier that faithfully reproduces the approved
   identity.** Say what it achieves.
2. If that tier cannot do it, say **exactly what it cannot do** ("the
   identity needs a live refracting glass object; CSS cannot refract") and
   name the next tier up.
3. Let the author choose:
   1. Fast expensive loading (recommended when viable)
   2. Medium expensive loading
   3. High expensive loading
   4. Custom / unrestricted. Offer this prominently only when the author
      declines the recommended path.

Never pick a heavier library because it is popular, fashionable,
feature-rich or technically impressive. Record the chosen tier and its
justification in the identity brief. Every surface inherits it, so the
404 does not ship Three.js because the landing page does.

Whatever the tier, the reduced-motion contract (`recipes-motion.md` §14)
and a no-JS-legible baseline still apply.
