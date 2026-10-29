# Verification: Miolo, home

Run on 2026-10-29 with Playwright (system Chrome), author absent, on stated assumptions. Everything below was looked at; what was not is listed at the end.

## The gates

`node scripts/check-slop.mjs docs/examples/miolo/index.html --render --out docs/examples/miolo/captures-slop`

Final summary line: `Floor 0 FAIL · Reflex 0 (1 waived) · Finish 1 note · rendered 1`

Waivers in the page (gates.md §2):

- `tracked-caps`: the lettering-guide caps and the violet stamp are the stencil's own letterforms, tracked as the tool cuts them; the stamp names a change of state. Capitals here are the display voice of the identity (gates.md §5, "Tracked caps").

Waivers dropped during the run: `eyebrow` ("Folha do dia" was deleted after the hero review found it a label with no job); `one-face` (the earlier build waived a gate that two loaded families did not deserve; the display face is now declared on `h1, h2` and in `--font-display`, and the gate is quiet).

Finish note read and answered: `word-budget`, 189 words in the hero's 900px window at 1440. The words are the slip's three rows (loaf, weight, price, count, when the broa returns) and the cut-off line; the slip is the product working, and the count is the reason the first screen exists, so the words stay.

Fixed on the way, so the record shows them: `horizontal-scroll` at every width (the typed hyphen rules are `white-space: nowrap` pseudo-content and widened a grid column and later a table cell; fixed with `min-width: 0` on the grid items and an absolutely positioned rule row in the table); `measure` and `container-cap`, both symptoms of the same overflow.

## The two reviews (reviews.md)

**Hero review:** subagent, fresh context, inputs `fold-1280.png`, `hero-1440.png`, the Intent and Grammar lines, the spec's job and content lines. First word `fix`, 5 findings: (1) the slip was the smaller half of the hero: resolved, the slip takes the wider column and stretches to the row, the headline clamp came down; (2) the "Folha do dia" eyebrow: resolved, deleted with its waiver; (3) CSS hairlines between the slip's rows: resolved, typed hyphen rules; (4) weights only on the wheat loaf and a leader collapsing to one dot at 1280: partial, the brief gives one weight and none was invented, the leader keeps five dots and the name may wrap; (5) the nav button doubling the hero action and two untypeable glyphs: partial, the nav action is now a typed underlined link (the job's action word stays in the nav, anatomy.md), the clock left the cut-off sentence, the basket stays on the two buttons as a control affordance. Outcome: `hero-review: subagent · fix · 5 findings · 3 resolved 2 partial`.

**Finish review:** subagent, fresh context, inputs the four screenshots, the page, the brief, the spec, the hero findings with their settlement, gates.md §3 and §5. First word `fix`, 8 findings: (1) thin section, the form's lower 600px beside an empty half: resolved, the collection and payment notes are a second slip pinned to the form (`position: sticky`); (2) CSS hairlines over the steps, in the week table and above the total: resolved, typed `=` runs over the steps, a typed rule row in the table, a typed rule above the total; (3) the week table cut at 390 with the six bake days off-screen: resolved, Monday (oven off) moved to the footnote and six day columns fit the phone; (4) the echo of 18h00 and of the hours sentence: resolved, the cut-off stays in the hero, step 1 (once) and the form, the hours are said once in the order aside and the colophon points to it; (5) the cramped broa row at 390: resolved, the quantity control drops under the loaf name on the phone; (6) "fechado" at the wrong size and dotted abbr underlines: resolved, the column is gone and the underline removed (titles kept); (7) "O pão" would pass on any bakery's page: resolved, the head now carries the band's first fact, "Três pães, mais nenhum"; (8) a stray clock on step 1 only: resolved, dropped. The review's two lines: a Porto sourdough bakery that prints tomorrow's bake, the counts and the 18h00 cut-off; the thing remembered, the raised slip with RESTAM 12 DE 40 and ESGOTADA. Largest gap named: the middle bands were drawn, not typed; closed by finding 2. Seen before (the four-column "how it works" grid): kept as a real `<ol>` of the four steps, the rule above each now typed. Do not dilute: the hero slip. Outcome: `finish-review: subagent · fix · 8 findings · 8 resolved · gap: closed`.

## What the look showed

- 1280 x 800 fold: nameplate, issue line, the "Encomendar" link, the four-line headline, the cut-off, the filled button and the whole slip with its three rows and three stamps, all above the fold. Routed Gothic loaded (the open monoline caps, not Courier fallback); Courier Prime loaded.
- 1440 hero: the slip holds the wider column and about 74% of the viewport height; violet appears only on RESTAM 12 DE 40, ESGOTADA and RESTAM 7.
- 1440 full page, 4,707px, seven blocks: masthead, Folha do dia, Três pães mais nenhum (prose, the three loaves, the three duotone photographs at 4:5), A semana da fornada (typed table of six oven days), Como se encomenda (four numbered steps with the ticket and the PAGO stamp), Encomendar para amanhã (the form slip and the pinned facts slip), colophon. The grounds alternate paper and slip; every rule on the page is typed.
- 390 full page, 7,761px: one column throughout; the slip's prices wrap under the loaf names; the six day columns fit at 390 with the row heads wrapping; the quantity fields sit under their loaf names; the segmented collection times wrap to two lines; nothing scrolls sideways (the render tier measured 320 to 1920).
- All three photographs loaded in every capture (`images missing: 0` in the screenshot run); the duotone reads as print, not as pasted photographs.
- The form, by hand in the rendered page: with scripting on, the total follows the quantities; submitting with nothing chosen says "Escolha pelo menos um pão"; an empty name is marked `aria-invalid` with a directed message; a valid form says "Nada foi enviado: este formulário ainda não está ligado ao balcão." and prints no success. With scripting off the form is fully visible and the submit does nothing (`data-endpoint=""`), which the render tier confirmed (nothing hidden without script).
- Focus, probed by tabbing with Playwright: skip link, nav link, hero button, the two enabled quantity fields (the sold-out broa is disabled and skipped), name, telephone, the collection radio (ring drawn on its label), the note and the submit, each with a 2px solid ring; the render tier found no element without a visible focus state.
- Form states, probed with scripting on: total `0,00 €` at rest and `12,10 €` after 2 wheat + 1 rye; submit with nothing chosen says "Escolha pelo menos um pão antes de guardar a encomenda."; a missing name marks `#nome` `aria-invalid="true"` and says "Falta o nome: escreva-o como quer que fique no talão."; a missing telephone is directed the same way; a valid form with the empty `data-endpoint` says "Nada foi enviado: este formulário ainda não está ligado ao balcão." and prints no success. The broa field is disabled.
- Contrast, computed colours probed: muted ink on paper 7.10:1, ink on paper 12.93:1, muted on slip 8.08:1, violet stamp on slip 9.49:1, button text on ink 14.71:1; every pair above 4.5:1.

## Not verified

- The author's facts: sheet number, date, counts, prices, order number, street, hours and the bake calendar are the README's sample values; none was checked against a real bakery.
- Payment methods and the telephone number are slots (`.fill`), not values.
- The page was not opened in Safari or Firefox; Chrome (Playwright, system channel) only.
- Contrast was probed on ten representative pairs, not on every element.

## The presentation (selling-positioning/)

Kept from the 2026-10-10 run, as the brief asked: the three logo proposals, the combined lockup (symbol C, wordmark A), the logo system, the positioning copy, the nine licensed Pexels mockup photographs and the research log (30 identity cases viewed, 45 mockup candidates screened). Changed in this run: `slideshow.js` and `slideshow.css` replaced by the current `templates/` copies (the newer runtime adds the slide regions, the live counter and the portrait phone bar); the site section refreshed with the rebuilt page (`site/` copy, `site-shots/` recaptured at 2x: viewport and full page at 1440 and 390, scrolled through first so the lazy photographs load; the first full capture by `capture.mjs --full` had them blank and was replaced); the excerpt's alt text updated to the new band names; the stale `preview/` export and a stray `.claude-flow/` state folder removed.

`node scripts/export-presentation.mjs docs/examples/miolo/selling-positioning none`: 20 files written to `final/` (9 slides 1920x1080, 7 mockups at 3000px, `social/square.png` 1080x1080, `social/story.png` 1080x1920, `presentation.pdf` with 9 pages, `presentation.html`).

`node scripts/check-presentation.mjs docs/examples/miolo/selling-positioning --offline --tier fast --watermark none --after-gate`: 43/43 checks passed (nine sections in order, no slide overflow, research counts 30 and 45, every mockup photo local and recorded with a credit-free licence, no errors and no horizontal scroll at 1440 and 390, slideshow works at both widths, every export size right, PDF one page per slide, no `preview/` leftover). `--offline`: the Pexels and BP&O source URLs were not re-fetched in this run (Pexels answers 403 to scripts in any case; the licences were read in the browser on 2026-10-10).

The look, every PNG in `final/` opened: the logo sits on each surface with the texture through it (kraft bag, cards on wood, chalkboard in paper ink, apron, storefront sign band, bread wrap, letterhead), legible at thumbnail size on the mockups slide; `18h00` and the prices are set in Courier, so the figures read as figures; the site slide shows the rebuilt hero at 1440 and 390 and the full-page excerpt with the three photographs loaded; no watermark in any photograph; no backstage note on a slide; no slide cut off. Not re-verified by hand this run: the slideshow controls in a portrait phone (the checker drove arrows, hash and buttons at 390, not a device).

One thing the look found that the 2026-10-10 screening missed: `final/mockups/apron.png` shows, at the top edge of the photograph, a faint embossed leather label with another bakery's name on the apron strap, above the printed area. The licence passes; the third-party text does not (selling-positioning.md §5, "fails the look"). It is left in place because the brief keeps the recorded photographs, and it is reported here for the author: drop the apron application, crop the strap out of the frame, or replace the photograph.

Left open in the presentation, not fixed because the brief keeps the recorded direction: the Concept and Logo-system slides draw their rules as CSS hairlines rather than typed runs (the site's finish review moved the page to typed rules; the slides were not re-judged); the social square's byline uses one middle dot, which gates.md allows in a byline.
