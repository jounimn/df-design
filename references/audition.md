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
- the colour system in use (not a swatch sheet): the base pair, and the candidate's design hint spent in its places (`recipes-design.md` §2)
- two or three example components: a button, a card or list row, an input
- mock content and data
- imagery: the author's own, or stock images that pass `images.md` **if the author said yes**, treated the identity's way; otherwise honest labelled placeholders
- icons from the set that fits this candidate, in the nav and the components (icons are mandatory)
- a glimpse of the identity's interaction or motion, if it has one

```
auditions/
├── index.html      links or iframes every candidate, with the identity name, one line of intent and its design hint
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

Each candidate gets two captures side by side. `<name>.jpg` is the full
page at 1440 under reduced motion: the layout at rest. `<name>-motion.png`
is the first contact sheet of the motion capture, taken with motion allowed
and driven to the end of the page by the wheel, with the video, every sheet
and the stills in `<name>-motion/` (`verification.md`, "Looking at a page
that moves"). The still never shows what moves, and an audition that
proposes motion is chosen partly on it. The author and the reviewer look at
both: the still for the layout, the sheets in order for the motion.

Then the gates, on every candidate:

```bash
node scripts/check-slop.mjs auditions/ --render --out auditions/captures/slop
```

A candidate with a Floor finding (a purple-to-blue gradient, `transition:
all`, no focus ring, motion with no reduced-motion fallback, an emoji icon)
is fixed before the author sees it; a Reflex finding (an eyebrow, tracked
caps, Inter as the display) is fixed or waived on the record with the
reason the identity gives it (`gates.md` §2). A choice made between pages
that read as generated is a choice between defaults, and the author will
pick the least generic one instead of the right identity.

### On the YOLO tier: three prototypes before production

When the author chooses `yolo` in the tier message, production does not
start yet, on either path. First build **three light prototypes of the
experience**, and let the author pick one. A YOLO build costs days of drawing,
rendering and recording; the choice has to be made while it still costs an
afternoon.

- **What varies.** On the audition path, the three are the candidate
  identities, each at the YOLO tier. On the design path, where the author
  already gave the identity, the three keep that identity and vary the
  experience: the scenes, the transition between each pair of scenes, and how
  the characters or the product are made (drawn, 3D, hybrid).
- **What each one is.** One light HTML file with 4 to 6 key beats of the same
  story or content, and the transitions between them actually working. The art
  is rough on purpose; no mass production, no final renders.
- **What it says.** A short cost note under each: the time, the tools
  (Blender, an image model, a 3D scene), and the weight full production would
  take.
- **How it is judged.** Record each one in motion (`scripts/capture-motion.mjs`)
  and show the contact sheets beside the files, so the author judges the
  transitions and the timing, not stills.

Production of the chosen prototype starts only after the author picks it.
Record the choice and the two that were dropped in the identity brief.

### After the author chooses

The author selects, combines, rejects or redirects (`identity.md` §5).
Record the result as the identity brief (`identity.md` §8). From then on,
implementation is checked against the brief, not against the audition
file. The audition is evidence, not spec.

Before the assets stage, offer the optional brand presentation: now, at the
end, or skip. The prompt, the time warning and the Playwright question are
in `selling-positioning.md` §1.

---

## 4. Loading cost: cheapest viable option first

Every library and heavy resource has a loading and runtime cost. Expensive
is not automatically bad: a costly library is right when it materially
serves the identity. Unnecessary cost is always wrong.

| Tier | Typically | Budget sense |
|---|---|---|
| **[Fast expensive loading](techniques/fast.md)** | CSS only (gradients, masks, clip-path, blend modes, `@keyframes`, scroll-driven animations), SVG, system fonts or one or two subset webfonts, small vanilla JS | Adds roughly nothing past the fonts; works without JS |
| **[Medium expensive loading](techniques/medium.md)** | Several webfonts, a small motion library (GSAP core, Motion One, Lenis), Lottie for a few illustrations, heavy optimised imagery, `backdrop-filter` across panels | Tens of KB of JS, or noticeable image weight and GPU work |
| **[High expensive loading](techniques/high.md)** | WebGL / Three.js / shader scenes, 3D models rendered live or offline in Blender, physics, background video, large Lottie or Rive sets, canvas particle systems | 100+ KB JS and/or MBs of media; main-thread and GPU cost; needs a fallback |
| **[YOLO](techniques/yolo.md)** | Real-time 3D worlds, pre-rendered 3D films, scroll-scrubbed image sequences, illustrated scroll stories, sound, physics | No ceiling. Measured on eight flagship sites: 5.6 to 26.7 MB of transfer after a full scroll (median 13.8 MB), 376 to 976 KB of script. Still owes the Floor: reduced motion, a lighter path, the content readable without it, no sound before the visitor asks; `check-motion --tier yolo` proves it |

The measured finding (`benchmarks.md`) supports starting cheap: premium
pages are built mostly from **masks, clip paths and blend modes**, which
are fast-tier CSS, not from heavy libraries.

### What each tier holds

The technique cards are the way in from this table: plain words first, the code behind. Each tier has its own file of cards, with what the visitor sees, which identities it suits, what it costs and the recipe. This is a menu for the tier message; the author still chooses only a tier.

The number beside a technique is the motion code of a production page that shows it, probed in headless Chromium (`benchmarks.md`). For a CSS or SVG technique it is the weight of the whole page, not of the effect, so a large number there does not make the effect expensive. The High ceiling is 340 KB.

**[Fast](techniques/fast.md), 23 techniques:** CSS or SVG, no script the effect depends on.

- [Ambient dot grid](techniques/fast.md#ambient-dot-grid): 0 KB
- [Corner glow](techniques/fast.md#corner-glow): 0 KB
- [Edge fade](techniques/fast.md#edge-fade): 0 to 70 KB
- [Dot grid and hairlines as masks](techniques/fast.md#dot-grid-and-hairlines-as-masks): 70 KB
- [Noise](techniques/fast.md#noise): 70 to 99 KB
- [Shimmer sweep](techniques/fast.md#shimmer-sweep): 99 KB
- [Marquee](techniques/fast.md#marquee): 70 KB
- [Additive blends on a dark ground](techniques/fast.md#additive-blends-on-a-dark-ground): 0 to 315 KB
- [Glassmorphism](techniques/fast.md#glassmorphism): 0 KB
- Not measured yet: [Scroll-linked](techniques/fast.md#scroll-linked), [Sticky narrative](techniques/fast.md#sticky-narrative), [Counters that mean something](techniques/fast.md#counters-that-mean-something), [Text that performs its sentence](techniques/fast.md#text-that-performs-its-sentence), [Image reveal through the identity's device](techniques/fast.md#image-reveal-through-the-identitys-device), [Particles](techniques/fast.md#particles), [Liquid morph](techniques/fast.md#liquid-morph), [Holographic](techniques/fast.md#holographic), [Neon glow](techniques/fast.md#neon-glow), [Wireframe 3D](techniques/fast.md#wireframe-3d), [Gradient mesh](techniques/fast.md#gradient-mesh), [Split-flap](techniques/fast.md#split-flap), [Retro VHS](techniques/fast.md#retro-vhs), [Halftone](techniques/fast.md#halftone)

**[Medium](techniques/medium.md), 4 techniques:** a small script, a drawing area or GPU work. Each links the lighter Fast version, which is its fallback, or says why there is none.

- [Particles](techniques/medium.md#particles): 139 KB
- [ASCII art](techniques/medium.md#ascii-art): 0 KB (built from page text, with no drawing)
- [Halftone](techniques/medium.md#halftone): 7 KB
- [Glassmorphism](techniques/medium.md#glassmorphism): 0 to 282 KB

**[High](techniques/high.md), 8 techniques:** lit 3D, per-pixel drawing and heavy script. Each names its lighter version (a Fast card or the Medium card of the same name), except Clay 3D and Rendered 3D, which say why there is none. Each ends with its weight against the ceiling where it was measured; Liquid morph, Rendered 3D and Halftone say "not measured".

- [Particles](techniques/high.md#particles): 340 KB, the ceiling itself
- [Holographic](techniques/high.md#holographic): 340 KB, the ceiling itself
- [Wireframe 3D](techniques/high.md#wireframe-3d): 180 KB
- [Gradient mesh](techniques/high.md#gradient-mesh): 282 to 315 KB
- [Clay 3D](techniques/high.md#clay-3d): 180 to 640 KB, the heavier above the ceiling
- Not measured yet: [Liquid morph](techniques/high.md#liquid-morph), [Rendered 3D](techniques/high.md#rendered-3d) (Blender, offline), [Halftone](techniques/high.md#halftone)

**[YOLO](techniques/yolo.md), 6 techniques:** no ceiling, priced in MB of transfer, not in motion code (`benchmarks.md`, "YOLO, measured"). Each names its Floor fallback and links the nearest lower card where one exists. The number is the whole page after a full scroll.

- [Scroll-scrubbed image sequence](techniques/yolo.md#scroll-scrubbed-image-sequence): 26.7 MB, 25.1 MB of it before the first view
- [Pre-rendered 3D film](techniques/yolo.md#pre-rendered-3d-film): 17.7 to 23.1 MB, 1.3 to 8.3 MB before the first view
- [Real-time 3D world](techniques/yolo.md#real-time-3d-world): 5.6 to 14.6 MB
- [Illustrated scroll story](techniques/yolo.md#illustrated-scroll-story): 9.7 MB at the age gate
- [Sound design](techniques/yolo.md#sound-design): 1.2 to 8.5 MB of sound
- [Physics and drag](techniques/yolo.md#physics-and-drag): 13.0 MB (one site, the page as a whole)

### The tier is the author's choice, not yours

You recommend; **the author decides**. Deciding the tier silently, even
correctly, skips the author's choice. Never write a tier into the identity
brief that the author has not picked.

**When.** The tier message is sent at two fixed points. The first is
never skipped, whatever the tier of the material:

- **With the candidates.** On the audition path, the tier message goes in
  the **same message that presents the auditions**, before the author
  chooses, so the identity is chosen with its cost in view. Label each
  audition with the tier it needs on the index page ("B: fast tier, CSS
  and SVG only"); the label is a pointer, not the question. On the design
  path, send it together with the identity direction. In motion mode, send
  it before choosing any motion library.
- **After Assets.** Confirm the chosen tier with the images priced
  (`images.md` §1), in one line when nothing changed ("Fast, as you chose;
  with the four photos the first load is ~210 KB"). Re-send the full
  message when the price changed: the author combined candidates, asked
  for a technique from a heavier tier, or the images weigh more than the
  first message assumed.

**Always asked.** "Every candidate is fast" is not a reason to leave the
message out. Fast is then the recommendation, and the medium and high
lines say what each would add for this project, or "nothing this identity
needs". The author still answers; the answer goes in the status line as
`load=` (`SKILL.md`) and later in the brief. A run that ends before the
author chooses an identity has still asked the tier.

**Price per candidate.** When the message accompanies several candidates,
fill the slots for each one where they differ ("A and C: fast does
everything. B: fast gives the dot field and the sticker drop; medium adds
a true halftone drawn from the photo, +7 KB of script"). One shared line
is enough where the candidates cost the same.

**Combining techniques.** The author may combine candidates ("A's type
with B's stickers") or ask for techniques from different tiers. Then the
message is re-sent as a list: each technique, the tier of its card, and
its cost for this project, with the lighter version named where the card
has one. The author keeps or drops each technique, and the project tier is
the heaviest technique kept. Never pick the heavier tier on the author's
behalf because they asked for one effect from it, and never drop the
effect silently to stay within a tier they chose earlier: show the
conflict and let them decide.

**Price the images.** Images are usually most of a page's weight. The
tier message sent with the candidates estimates them from what each
candidate implies (how many, at what size, with what treatment). The
Assets stage (`images.md`) then fixes the actual files, and the tier
confirmation carries their real weight.

**The tier message.** Keep the tier names exactly as written. Fill in
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
4. YOLO, the no-savings tier for flagship sites: <what it adds, e.g. "the
   bakery as a 3D world you scroll through, with the oven's sound on a tap">.
   Cost: <the weight in MB, e.g. "about 10 to 15 MB after a full scroll,
   4 MB before the first view; flagship sites measured 5.6 to 26.7 MB">.
   No ceiling, but the Floor still applies: <the fallback for this project,
   e.g. "a still of the oven for phones that cannot run it and under reduced
   motion, the menu and hours as plain text, no sound until they tap it">.

<If the cheapest tier cannot fully deliver the identity: say exactly what
it cannot do and which tier can. Otherwise: "Fast does everything this
identity needs.">
```

The YOLO line is always offered and never the recommendation. Its cost is
the transfer in MB for this project, with the first view stated apart, not
a motion-code figure: on that tier media is what weighs. If YOLO would add
nothing this identity needs, say so in its line. If the author chooses it,
the Floor fallback named in the line is part of the build, and
`check-motion --tier yolo` checks it.

YOLO also sets an ambition floor. Choosing it commits the build to at least
one of the `techniques/yolo.md` techniques built at flagship scale:
authored media (a pre-rendered film, an image sequence, an illustrated
story in layers) or a real-time 3D scene. One WebGL panel on a page under
the High ceiling is a high build with a yolo label: either build the yolo
techniques or re-send the tier message. `check-motion --tier yolo` reports
such a page as "built below the chosen tier"; it is a report, not a Floor
failure.

Only when the author declines the recommendation, offer the last choice
explicitly:

```
5. Custom / unrestricted: no limit. Tell me which effects you want, and I'll tell you
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
and a no-JS-legible baseline still apply. YOLO removes the ceiling, never
the Floor.
