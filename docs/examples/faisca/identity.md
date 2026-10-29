# Identity: Manual de Experiências (Faísca)

`df-design: path=audition mode=both scope=home, booking, schools, front-desk, 404 (this example builds home) watermark=none load=fast selling=now tier=fast — brief as the README records it; the author is absent, so every answer the workflow asks is read from the README section and the existing folder and recorded here as "proceeding on stated assumptions"`

Proceeding on stated assumptions: Playwright allowed; watermark none (not answered, so `none`); stock images yes (three Wikimedia Commons files already in `img/`, reused, nothing new downloaded); loading tier fast (the chosen audition is CSS and SVG only, and the README records no heavier technique); presentation now, at the site tier; the surface spec approved as written; the auditions held and B chosen.

```markdown
# Identity: Manual de Experiências
Conditions:    Rebrand with motion for a hands-on science museum for children 6 to 12 in Coimbra. Surfaces named in the brief: homepage, ticket booking, a schools page, an internal front-desk bookings page, 404. Path audition, mode both. Reference: a video of a toy brand's bouncy site, "I love the energy". Copy in Portuguese; the three-word head "Toca. Testa. Descobre." is the author's.
Intent:        Kids curious, parents feel it is worth the money, teachers trust it. Energy without the toy-shop palette: the motion answers the hand, the page stays calm enough for a parent to read the hours and a teacher to read the terms.
Practical:     Language pt-PT with an EN switch on the page (sample translations). Currency EUR, 24-hour times. Flows: tickets bought on the site (the booking page is a later surface; on home the ticket button points at the prices); school visits booked by email on weekday mornings. Users and devices: home is a parent on a phone and a teacher at a desk; the front-desk page is staff on a counter screen, desktop density. Facts the brief did not give (hours, prices, address, phone, group sizes) are samples the author replaces, marked in the surface spec and in the page footer.
Grammar:       Type: Lexend 800 for display (tight, -0.045em in the hero), Atkinson Hyperlegible Next for text, Atkinson Hyperlegible Mono only for data (times, prices, sheet numbers, booking refs). Colour: manual paper #ECEFEA biased green-grey, ink #161F1D, one signal colour, Faísca yellow #FFC21A, spent on the ticket button, the pendulum bob and the step ticks; a dark ink chapter for schools; both themes at token level. Geometry: 4px radius, 1 to 2px ink rules, hard 3px offset shadow on the one filled button, the ticket stub punched with a mask. Surface: paper; photographs as duotone plates (grayscale, multiply onto paper, ink lightened), each with a line-art inset diagram. Motion: physics you could name in class. One spring (damped, zeta 0.6, overshoots about 9.5% once, 600 ms) for presses and hovers; cards that tip 1.6 degrees on a fulcrum; the steps reveal in order with a drawn tick; a slow pendulum at the real period of a 2 m string (T = 2.84 s) that can be dragged and released, and paused. The plate wipe and the diagram pen do not bounce: ink does not overshoot.
Origin:        The author's video, classed INTERACTION plus INSPIRATION: taken, spring overshoot and motion that answers the pointer; left, the toy-shop palette and motion that never stops. Library: Instruction manual (IKEA / Braun / TE) as the main entry (wordless numbered steps, callout circles, exploded line art, one signal colour); Field guide / almanac for the numbered entries with their own data; Halftone / duotone for the plate treatment. The library's seen-at sites (teenage.engineering/guides, c82.net/euclid, solar.lowtechmagazine.com) were not probed in this run. Sector default escaped: kids and family as rainbow cartoon clutter. Auditions held: A "Oficina Riso" (Risograph spot inks, draggable exhibits), B "Manual de Experiências" (chosen), C "Padrão Faísca" (Bauhaus grid with pattern bands from field lines and crystals).
Never:         Rainbow or cartoon clutter; a second loud colour; motion that never stops or that is not named after a thing in physics; bounce on the ink (plate wipes, drawn diagrams); a feature grid of icons; a photograph in its own colour (every plate is duotone); a 404 or front desk that drops the manual grammar.
Icons:         Tabler Icons 3.49.0 outline, MIT, 2px stroke at 1.15em, sized to the cap height, inlined with stroke="currentColor". Fits the manual's ruled line: the same stroke as the diagrams. Used in controls, the language switch, the facts list, the hours and the pause control; never one per feature.
Images:        Author said yes to stock (assumed from the folder). Three Wikimedia Commons files, CC0 or public domain, no credit line, opened at 100% with no watermark: iron filings over magnets, a prism spectrum, a breadboard. Treated as duotone plates with a printed top-to-bottom reveal, on home only. Record: docs/examples/faisca/assets.md.
Loading tier:  fast, as the README records for the chosen audition: CSS, SVG and about 3 KB of plain script; three fonts from Google Fonts; the three photographs weigh 227 KB together. Medium and high would add nothing this identity needs.
Surfaces:      home (built here); booking, schools, front-desk and 404 in scope and not started. The front desk keeps the manual grammar at desktop density with no bounce; the 404 is "Experiência falhada", a manual page with a part missing from step 4.
```

## Surface ledger

| Surface | Spec | Approved by author | Implemented | Verified |
|---|---|---|---|---|
| home | docs/examples/faisca/surfaces/home.md | assumed, 2026-10-29 (author absent; proceeding on stated assumptions) | yes | yes: check-slop Floor 0 FAIL · Reflex 0 (1 waived: three-tiles) · Finish 1 note answered · check-motion fast: no check failed · hero-review: subagent · fix · 5 findings · 5 resolved · finish-review: subagent · fix · 7 findings · 6 resolved 1 unresolved (section heads kept as chapter titles) · gap: plate 07 too heavy, resolved · looked at 1280 + 1440 + 390 + the motion frame (verification.md) |
| booking | not started | no | no | no |
| schools | not started | no | no | no |
| front-desk | not started | no | no | no |
| 404 | not started | no | no | no |

## Presentation (selling=now, tier=fast)

Three logo proposals in `selling-positioning/logo-proposals/` (A Centelha, B Pêndulo, C Folha); combining parts was open. Proceeding on stated assumptions, A was chosen because the site's header already carries the spark, and the system was built from it (`selling-positioning/logo-system/`). The new logo changes no surface: the page keeps the mark it had.

## Consistency check (identity.md §10)

Run on home only, the one surface built. Identity, type, colour, components, icons, images, motion, density and loading all hold to the brief above. The clash to report when the other surfaces are built: none yet, since none exists; the brief's Surfaces line says how each keeps the grammar.
