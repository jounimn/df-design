# Verification: Faísca, home (Folha 01)

Run on 2026-10-29, branch `feat/examples-regen`, Playwright with the system Chrome. Proceeding on stated assumptions: the author is absent, so the surface spec counts as approved as written (`identity.md`, status line).

## Gates

- **check-slop --render:** `Floor 0 FAIL · Reflex 0 (1 waived) · Finish 1 note · rendered 1`.
  - The run before the last fix failed `horizontal-scroll` at 768 px: the ticket stub's side column (150 px) held "1 h antes de fechar" with `white-space: nowrap` and reached 788 px. The side values now wrap; the rerun is clean at all six widths.
- **check-motion --tier fast:** no check failed. The page has no canvas (four canvas checks N/A); motion JS 0 KB, reported; works without JS passes with 1 of 66 items hidden, the pendulum's pause button, which is hidden on purpose when no script can drive it.
- **Waivers on the record:**
  - `three-tiles`: the three entries are the catalogue's numbered rooms, each a plate with its own data (number, room, photograph, inset diagram, age, time), not feature tiles.
- **Finish note answered:** `word-budget`, 218 words in one 900 px window at 1440. The window that crosses the exhibits holds three wall labels of two sentences each; they are the exhibits themselves, so they stay, and every other screen is under the budget.

## Reviews (fresh-context subagents, `reviews.md`)

- **Hero review: `fix`, 5 findings, 5 resolved.**
  1. Two filled yellow ticket buttons in the fold: the nav one became the quiet recipe ("Bilhetes"). Resolved.
  2. The pendulum drawn slight, under half the screen: redrawn to fill its half (longer string, 60 px bob, heavier beam, dimension line), hero padding trimmed. Resolved.
  3. Callout 2's leader stopped short of the string: every leader now starts on the part it names. Resolved.
  4. The descriptor beside "Folha 01" read as an eyebrow: it moved into the opening sentence; the sheet number stands alone on a folio rule. Resolved.
  5. A stray θ tick at rest: removed. Resolved.
- **Finish review: `fix`, 7 findings, 6 resolved, 1 unresolved. Gap: small (finding 7, the first plate too heavy), now resolved.**
  1. All four steps showed a yellow tick at rest, a finished checklist: the tick now exists only in the reveal; at rest, without script and under reduced motion the step is the ink circle. Resolved.
  2. A booking reference nobody issued on the price stub: replaced by "Última entrada, 1 h antes de fechar", a fact the page already had. Resolved.
  3. A yellow ring on the stub's button at 1440: it was the focus ring caught by the capture's tabbing; the ring is now ink (3 px, 15.6 : 1 on paper) so it never reads as a second button recipe. Resolved.
  4. Three fulcrum triangles standing at rest: the fulcrum is drawn only while the card tips. Resolved.
  5. The phone nav showed the ticket glyph alone: the ticket control is dropped from the phone bar; the hero's labelled button is one screen below. Resolved.
  6. Section heads ("Experiências", "Como é a visita", "Para escolas", "Preços e horário") would pass on another museum's page: **unresolved by choice**. They are the nav's destinations, set as the manual's chapter titles; the specific lines sit directly beside them in each lede.
  7. Plate N.º 07 printed near solid black and white: that plate takes less ink (`.tone-soft`). Resolved; at 1440 the three plates now share one weight.

## What the look showed

Looked at `fold-1280`, `hero-1440`, `full-1440` and `full-390` after the last run, and at the mid-motion frame:

- Lexend, Atkinson Hyperlegible Next and Mono all loaded (no fallback faces); numbers read as numbers in the mono face (`10:00 às 18:00`, `2,84 s`).
- The hero holds the head and the ticket button at 1280 x 800; the figure fills the right half; the yellow is spent on the ticket button and the bob only.
- The three photographs load, decode and sit as duotone plates with their insets; no watermark visible in any of them.
- The schools chapter is on the ink ground with its figures in yellow; the page has its two papers.
- At 390 nothing is cut or overlaps; the steps run as a vertical sequence; the stub stacks its side under the prices.
- `motion.jpg`: the pendulum caught off its rest line, mid-swing, with the "Parar" control visible under the figure.

## What I could not verify

- Dragging the bob by touch on a real phone; it was exercised only through the code path, not by hand.
- The EN strings are samples, not checked by a native speaker.
- Hours, prices, the address and the phone are samples (the footer says so; the phone is a fill slot).
- The library's seen-at reference sites for the identity were not probed in this run.

## Presentation (`selling-positioning/`)

- `node scripts/export-presentation.mjs docs/examples/faisca/selling-positioning none`: 17 files written to `final/` (9 slides, 4 mockups, 2 social posts, PDF, presentation.html).
- `node scripts/check-presentation.mjs docs/examples/faisca/selling-positioning --offline --after-gate --tier fast --watermark none`: **34/34 passed** (research log: 39 viewed cases, 59 unique mockup candidates).
- Looked at every PNG in `final/`: the logo sits on each surface with the texture showing through (multiply); the mug mark is the smallest and still reads at thumbnail size; no watermark in any photo; no slide cut off; no backstage note on a slide. The first export put "Usos incorretos" on a third row of the logo-system slide; the grid was made eight equal cells and re-exported.
- Not verified by hand: swipe on a real phone and the portrait hint (the checker exercised arrows, hash and buttons).
