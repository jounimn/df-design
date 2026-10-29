# Verification: Moreira & Vaz, home

Run on 2026-10-29 on branch `feat/examples-regen`, Playwright (Chromium) allowed. The author was absent: every answer was read from README.md and the folder and recorded as "proceeding on stated assumptions" (`identity.md`).

## check-slop

`node scripts/check-slop.mjs docs/examples/moreira-vaz/index.html --render --out docs/examples/moreira-vaz/captures-slop`

Final summary line: `Floor 0 FAIL · Reflex 0 (0 waived) · Finish 1 note · rendered 1`

- The one Finish note is `word-budget`: 188 words in one 900px window at 1440 (the hero, whose five index entries each carry a deadline and an article). Read and answered: the index is the page's signature and every line in it is a fact a visitor came for; nothing was removed.
- Earlier runs on the way: the nav-and-hero build passed clean; the first full build failed `hidden-without-script` (a gov.uk-style error summary shipped in the markup with `hidden`, which counts as a heading invisible with scripting off). Fixed by building the error summary and the inline errors from the script (messages live in `data-error` on the controls), so nothing on the page is hidden at rest.
- The static tier's `overflow-undeclared` note from the old page was settled with `overflow-x: clip` on html and body.

## Waivers

None. No Reflex gate fired on the final page, so nothing was waived.

## Reviews (`reviews.md`, both as fresh-context subagents)

- **Hero review:** `fix`, 4 findings, 4 resolved. (1) The lede stated a headcount while the phone was a slot: the count left the lede and stays once in the facts list, where it is the brief's own figure (a 12-lawyer firm). (2) The type did not fill the first screen: a fifth index entry (acidente de trabalho), every row at one two-line height, the statement centred against the index, the headline at 72px; the index now reaches about 810 of 900 at 1440 and runs past the fold at 1280. (3) The lede ran three lines with a short tail: rewritten to two. (4) The third entry wrapped to three lines: shortened to "Sou assediado(a) no trabalho" and every row given the same height.
- **Finish review:** `fix`, 7 findings, 7 resolved. (1) Four index entries linked to the top of the table: each now anchors to its own row (`#p-salarios`, `#p-assedio`, `#p-horario`, `#p-acidente`), which marks itself with the accent rule when targeted. (2) `mono-costume` in the margins ("Registe datas já", "Ilicitude", "Guarde", the verbete folio): words are now set in Atkinson; mono stays on deadlines and article numbers only. (3) The samples disclaimer was printed four times: kept in the hero note and the table caption, cut from the footer, the verbete note shortened to "Verbete de exemplo, o primeiro do guia." (4) Quem somos was the one generic screen (photo left, statement right, stat rows, the stance said three times): the figure now takes the column's height, the h2 extends the stance ("Quando um patrão nos telefona, a resposta é não.") instead of repeating it, and the facts list lost the "0 empresas" echo. (5) "Como funciona" would pass on any firm's page: the head now carries the two facts the steps hold (two working days, the price before booking) and the step titles no longer repeat them. (6) Four dashed slots in the first 700px: one phone slot in the nav, one with the address in the footer office block, none in the hero or the facts. (7) The verbete section talked about itself: the h2 is now the entry ("Fui despedido(a): o que a lei diz, o que fazer hoje, o prazo") and the intro names the articles.
- The reviewer's answer to the question no gate can: the brief describes the page, almost entirely; the largest gap was the Quem somos band, fixed as above. What must not be diluted: the ruled situation index with real deadlines and articles beside the one-line stance, and the rule that mono means data.

## What the look showed

Looked at `fold-1280.png`, `hero-1440.png`, `full-1440.png` (4,904px tall) and `full-390.png` (7,584px tall) after the last fix batch, plus the README captures at rest.

- All three faces load (Source Serif 4, Atkinson Hyperlegible Next, IBM Plex Mono); no fallback face anywhere.
- The fold at 1280x800 holds the headline, the nav action and the first four index entries; at 1440x900 the index runs to about 810px and the headline block sits centred against it.
- Grounds alternate paper, white, paper, white, paper; the 2px rule opens the index, the verbete, the table, the steps and the footer; 1px rules divide rows.
- The duotone calçada loads (AVIF) and fills its column to the facts list; no empty slot anywhere; no watermark at 100%.
- The table stacks to entries at 390 with the column heads hidden; nothing scrolls sideways at 390 or 1440 (the render tier measured 320 to 1920).
- Focus rings: tabbing reaches the skip link, the nav button, the five index entries, the quiet button, the three fields, the submit and the footer links, each with the 3px green ring (the render tier's `focus-ring` gate passed).
- With scripting off every heading, paragraph and image is visible (render tier `hidden-without-script` passed on the final page); the form is then a plain form that posts nowhere and shows no success.
- With scripting on: submitting the empty form prepends the error summary, focuses it, marks the three fields and links each error to its field; filling a field clears its error; submitting a complete form prints "Nada foi enviado: este formulário ainda não está ligado ao escritório" because `data-endpoint` is empty. No success state exists.
- Headline tracking -0.025em at 72px, section heads 41.6px, body 19px at a 60 to 62ch measure; mono only on "60 dias", "1 ano", "7 dias", the article numbers and the table's deadline and law columns.

## Not verified

- The deadlines and article numbers are samples from the README and were not checked against the Código do Trabalho or Lei 98/2009; the page says so twice and the author must confirm each before publishing.
- The phone number, the street address and the Ordem dos Advogados registration number are not known; the page carries two dashed slots and no registration line.
- Real-device testing (iOS Safari, Android Chrome) was not done; only Chromium at 390 and 1440 was looked at.
- Contrast was read from the token values (ink on paper 13.9:1, muted on paper 6.1:1, white on accent 5.6:1, muted on white 6.6:1), not probed per element in the browser.
- The language switch and the EN page the README mentioned in passing were not built (Later list).

## check-motion

`node scripts/check-motion.mjs docs/examples/moreira-vaz/index.html --tier fast`: no check failed. Canvas checks N/A (no canvas), motion JS 0 KB, works without JS (69 of 69 content items shown). Design mode: the only motion is a 150ms arrow shift on index hover, off under reduced motion.

## Presentation (`selling-positioning/`)

- `node scripts/check-presentation.mjs docs/examples/moreira-vaz/selling-positioning --offline --tier fast --watermark none`: 39/39 passed. Online with `--after-gate` (source pages fetched): 46/46 passed, including "site section is filled" and "PDF has one page per slide, 9 pages for 9 sections".
- `node scripts/export-presentation.mjs docs/examples/moreira-vaz/selling-positioning none`: 19 files in `final/` (9 slides, 6 mockups, 2 social posts, the PDF, the rewritten `presentation.html`); no `preview/` (watermark none). `final/mockups/` (about 21 MB) is gitignored and regenerated by the export.
- Research base: 59 viewed identity cases (Fonts In Use, BP&O, Pentagram, studio sites; Behance answered 403 and its two URLs sit under "Not viewed"); 66 screened Pexels mockup candidates, licence read on browser captures of each item page (Pexels answers 403 to scripted fetches).
- Six mockup photos used (booklet, business card, kraft folder, tote, poster on tiles, letterhead), each Pexels License, downloaded at 1800 px, looked at in full: no watermark, no faces. Recorded in `selling-positioning/assets.md`.
- Looked at every slide PNG, both social posts and the folder mockup at 3000 px: the marks sit on their surfaces with the texture coming through (multiply), legible at the slide's thumbnail size; no slide is cut off; no backstage note on a slide; numbers read as numbers (Plex Mono). The letterhead's address line is a placeholder ("Rua por confirmar"), as on the site.
- Not verified: the slideshow on a real phone (portrait hint and control bar were checked only by the checker's Chromium run); the other five 3000 px mockups were not opened individually beyond the slide that holds them.

`captures-slop/` was deleted after the last run; the README screenshots (`hero.jpg`, `full.jpg`, `mobile.jpg`) are the kept captures.
