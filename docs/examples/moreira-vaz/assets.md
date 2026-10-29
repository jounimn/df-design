# Assets: Moreira & Vaz

## Images

The author approved stock for the "Quem somos" band only (README). One image is used; nothing new was downloaded for the site in the 2026-10-29 rebuild.

| File | Source page | Licence (as shown on the page) | Downloaded | Treatment | Pages |
|---|---|---|---|---|---|
| img/calcada-rossio.avif (1000x651, 172 KB) + img/calcada-rossio.jpg (760x495, 154 KB, fallback) | https://www.pexels.com/photo/photo-of-cobblestone-floor-2566380/ (Magda Ehlers, Lisbon) | Pexels License: free to use, attribution not required | 2026-10-05 | Static CSS duotone in ink #1D2420 on paper #F4F5F0 (grayscale + multiply onto paper, ink layer with lighten), 3:2 crop, `loading="lazy"` (below the fold) | home, "Quem somos" band |

Sized variants from the Pexels CDN (`?auto=compress&cs=tinysrgb&w=1000&fm=avif` and `w=760&fm=jpg`), not the 5472px original. No watermark seen at 100% in either file. No people, faces, logos or brands (one distant pigeon).

Every other band is type, a table or a form by design: no image slot is empty and no second photograph was wanted.

The presentation's mockup photographs have their own record: `selling-positioning/assets.md`.

## Icons

| Set | Licence | Glyphs used | Delivery |
|---|---|---|---|
| Phosphor Icons, Regular weight (@phosphor-icons/core 2.1.1) | MIT, no attribution required | phone (header and hero, beside the phone slot), arrow-right (situation index only), warning-circle (form error summary and inline errors, built by the script), check (kept in the sprite for a valid-field state once the endpoint exists), arrow-square-out (Livro de Reclamações), map-pin (address, facts list and footer), book-open ("Ler um verbete do guia") | Inline SVG `<symbol>` sprite, `fill="currentColor"`, 1em, `aria-hidden="true"` beside text labels |

Source: https://unpkg.com/@phosphor-icons/core@2/assets/regular/

Dropped in the rebuild: translate (the language switch was removed; EN is on the surface spec's Later list).

## Fonts

Google Fonts, loaded as the page always has: Source Serif 4 (SIL OFL), Atkinson Hyperlegible Next (SIL OFL), IBM Plex Mono (SIL OFL). Subset by Google; no local font files.
