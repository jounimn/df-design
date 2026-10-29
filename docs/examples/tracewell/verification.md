# Verification: Tracewell home

Run 2026-10-29, author absent: every answer is the README's or the folder's, proceeding on stated assumptions
(`identity.md`). Playwright headless Chromium 153.

## Gates

`node scripts/check-slop.mjs docs/examples/tracewell/index.html --render`, final run:

`Floor 0 FAIL · Reflex 0 (1 waived) · Finish 1 note · rendered 1`

- **Waived, `invented-proof`:** every figure on the page (212 ms, 96 ms, 2.1x, 45%, 38 ms, the 41 ms delta, the
  compare table) is sample data inside the built trace, captioned "Sample trace" or "(sample)" where it appears;
  none is a claim about the product. The earlier `eyebrow` waiver is gone: the pill above the headline and the
  "How it works" kicker were removed rather than waived.
- **Finish note, `word-budget`:** 276 words in one 900px window at 1440, in the "Where the time went" band (two built
  screens of attributes and a compare table). Answered: the words are the product's data, set in mono inside the
  panels, not paragraphs; kept.
- Fixed along the way: horizontal scroll at 320 and 390 (the Compose and Helm command lines and the nav), the UA grey
  background on the Pause button.

`node scripts/check-motion.mjs docs/examples/tracewell/index.html --tier fast`: no check failed. No canvas (four
canvas checks N/A); motion JS 0 KB; works without JS: 1 of 73 content items hidden without JavaScript, the Pause
control, which only exists to stop the script-driven loop (within the 5% allowed).

## The loop (the marquee flag)

The coordinator relayed a hook flag about an auto-scrolling marquee. The page has no marquee; the moving content
past 5 seconds is the hero's two ambient loops (the firing dot field and the request hairline with its hops), which
is what `gates.md` "the loop" governs. **Chosen: a loop that can pause** (`patterns.md`, "A loop that can pause"),
not a static row, because the request crossing five services is the motion plan's signature and the brief keeps it.
The hero carries `data-loop`: the loops are paused until the script runs, paused off-screen (IntersectionObserver),
on pointer hover and on focus within the hero, and under reduced motion; a visible Pause / Play button sits at the
hero's lower right and hides without script and under reduced motion. The added script is about 0.6 KB, keeping the
page inside the fast tier's ~1 KB. Under reduced motion the pulse rests past the third hop with the three passed
hops lit; the dots rest as a still field.

## Reviews (fresh context, subagents)

- **Hero review: `fix`, 5 findings, 5 resolved.** (1) the hairline sat on the fold edge and read as a footer rule:
  moved into the hero's flow, hops labelled with service and span time, resolved; (2) the headline broke into three
  lines with "request," orphaned: now two lines across the container, resolved; (3) the centred dev-tool stack:
  split composition, headline full width, lede left, actions and install right, resolved; (4) stray lit dots at
  rest: field uniform at rest, resolved; (5) two filled orange buttons and a "self-/hosted" break: nav action quiet,
  non-breaking hyphen, resolved.
- **Finish review: `fix`, 8 findings, 7 resolved, 1 partial.** (1) phone hairline lost its service names: names kept
  at 390, only the span times drop, resolved; (2) the nav "4.2k" stars read as unsourced proof: removed, the link
  says GitHub, resolved; (3) p99 rail labels clipped: rail given room, labels on one line, resolved; (4) empty half
  under the waterfall and a small 38 ms: the figure moved into a full-width row at 80px with its direction and a
  note, resolved; (5) scrolled commands read as broken: commands wrap inside a 44px-minimum box with the copy control
  kept, resolved; (6) two heads that would pass on any competitor: "Your spans never leave your network." and
  "Sampling, retention, overhead, the licence.", resolved; (7) "Instrument once" thin screen and template SDK block:
  code full width at a shared panel height with the wrapped libraries in a row under it, **partial** (the section is
  still the head-plus-code shape a dev tool uses; it is the brief's integration section and stays); (8) compare-table
  head wrapping at 390: route on its own line, deploy pair and total under it, resolved. Its "Clean" note (glyphs on
  the hero buttons) was also acted on: the arrow and the book were removed. Its largest gap (the phone signature) is
  finding 1.

## What the look showed

Looked at after the last change: `hero.jpg` (1440 x 900 at rest), `full.jpg` (1440 full page), `mobile.jpg` (390
full page), `motion.jpg` (mid-motion: dots lit, the waterfall half drawn by `view()` with the bars at partial scale
and the status icons not yet stamped, the Pause control visible). The display face renders as Schibsted Grotesk,
not a fallback; the mono is JetBrains Mono. The accent appears on the primary action, the hairline and passed hops,
the slow span, the deltas and the focus ring only. Every section has mass at 1440; nothing hidden at rest; no
horizontal scroll at 320 to 1920 (measured by the gate).

Presentation: every PNG in `selling-positioning/final/` opened (9 slides, 6 mockups, 2 posts). Two defects found and
fixed before the final export: the mark rendered black on every slide (class fills do not reach a `<use>` shadow
tree; now custom properties), and on slide 08 the laptop overlapped the phone. No backstage note on a slide; no
photograph, so no watermark to look for.

## Not verified

- Real Söhne: the brand face is commercial and not loaded; Schibsted Grotesk stands in (recorded in `assets.md`).
- Safari and Firefox were not opened; the `view()` waterfall falls back to the IntersectionObserver path there, which
  was not exercised in a browser without `animation-timeline` support.
- The Pause control's hover and focus pausing was read from the code and not driven by a pointer in a test.
- Contrast was computed from the tokens, not probed per element. Ink 3 was `#6B737E`, about 4.06:1 on the
  ground (`#0B0D10`), under the 4.5:1 the contrast gate (Floor) asks of the 11 to 12.5px meta text set in it. The
  author approved the brief change on 2026-10-29: ink 3 is now `#7A828D` (5.0:1 on the ground, 4.8:1 on the panel,
  4.5:1 on the code ground), in the page, the deck and the logo system. Ink 2 (`#A3AAB4`, about 8.3:1) and ink pass.
- The slideshow on a real portrait phone (the checker ran it at 390 headless only).
