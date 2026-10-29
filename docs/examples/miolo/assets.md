# Miolo: asset record

Stock images approved by the author for the "O pão" band only (README). Nothing was downloaded in the 2026-10-29 rebuild: the three photographs below are reused, and the icon set gained one glyph fetched from the same package.

## Images

| File | Source page | Licence (as shown on the page) | Downloaded | Treatment | Pages |
|---|---|---|---|---|---|
| img/massa.jpg | https://burst.shopify.com/photos/baker-kneading-out-dough | Burst Some Rights Reserved ("Photo License: Burst"): free for commercial and noncommercial use, no attribution required | 2026-10-05 | Original 6000x4000 cropped 4:5 to hands and dough (face excluded), greyscale, 800x1000 JPEG 81 KB; duotone ink/paper in CSS | landing, "Três pães, mais nenhum" (the "O pão" band) |
| img/forma.jpg | https://burst.shopify.com/photos/close-up-of-fresh-bread | Burst Some Rights Reserved ("Photo License: Burst"): free for commercial and noncommercial use, no attribution required | 2026-10-05 | Original 5760x3840 cropped 4:5 to the loaf, greyscale, 800x1000 JPEG 106 KB; duotone ink/paper in CSS | landing, same band |
| img/miolo.jpg | https://burst.shopify.com/photos/sliced-rye-bread | Burst Some Rights Reserved ("Photo License: Burst"): free for commercial and noncommercial use, no attribution required | 2026-10-05 | Original 5760x3840 cropped 4:5 to the cut slices, greyscale, 800x1000 JPEG 100 KB; duotone ink/paper in CSS | landing, same band |

Licence text checked on https://www.shopify.com/stock-photos/licenses/shopify-some-rights-reserved on 2026-10-05.
Restrictions: do not sell the photos as files, do not claim authorship, do not use in a logo.
Watermark check: each original opened at 100% (four corners and centre); no watermark or overlay.
Pixel size matches a full original (5760-6000 px wide), not a preview.

Treatment (images.md §4): one duotone in ink #22211C and paper #E5E8D5. The image is greyscale and multiplied onto the paper; an ink layer in `lighten` turns its shadows into ink. Static, no reveal (design mode). All three are below the fold and `loading="lazy"`; the page has no hero image, so no `fetchpriority`.

## Icons

| Set | Version | Licence | Glyphs used |
|---|---|---|---|
| Phosphor Icons, Light weight (`@phosphor-icons/core`, fetched from unpkg) | 2.1.1 | MIT, no attribution required | basket (order button, form submit), clock (collection hours in the order aside), x-circle (ESGOTADA stamp, slip and form), check-circle (PAGO stamp), map-pin (address, aside and colophon), warning-circle (form error line, fetched 2026-10-29) |

Paths inlined unmodified as `<symbol>`s, `fill="currentColor"`, `aria-hidden="true"` with a word beside each. The globe of the 2026-10-05 build left with the PT/EN switch (no English page exists; see `surfaces/home.md`, Later).

## Fonts

| Face | Role | Licence | Source |
|---|---|---|---|
| Routed Gothic (Darren Embry) | Lettering-guide caps: nameplate, headline, band heads, stamps, step numerals | SIL OFL 1.1, Reserved Font Name "Routed Gothic"; shipped unmodified as fonts/routed-gothic.ttf (57 KB) | https://github.com/dse/routed-gothic |
| Courier Prime | Typed body, lists, prices, table, form | SIL OFL 1.1 | Google Fonts |

## Presentation

The mockup photographs of `selling-positioning/` have their own record in `selling-positioning/assets.md` (nine Pexels photographs, Pexels License, read in the browser).
