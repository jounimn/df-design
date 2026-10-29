# Tracewell: assets

The identity brief is `identity.md`; the surface spec is `surfaces/home.md`. This file records every icon and image
the landing page uses.

## Icon set: Lucide (lucide-static v1.52.0)

- **Licence:** ISC (permissive; commercial use, no attribution required). LICENSE checked at
  https://unpkg.com/lucide-static/LICENSE on 2026-10-05; the paths below were fetched again from
  https://unpkg.com/lucide-static@1.52.0/icons/ on 2026-10-29.
- **Why Lucide:** a dense developer tool wants Lucide or Tabler at 1.5px (`icons-and-assets.md` §0). Lucide's 24px
  grid and round joins sit closer to the grotesk's flat-terminal rhythm at 13 to 15px than Tabler's larger
  catalogue, and this page needs twelve glyphs, not five thousand.
- **Stroke:** 1.5 (overridden from the set's 2) to match regular-weight UI text; sized to cap height (13.5 to 20px),
  `currentColor`, `aria-hidden` when a label sits beside it, `aria-label` when it is the status.
- **Delivery:** SVG paths inlined. No dependency, no barrel import.

| Glyph | Where | Motion |
|---|---|---|
| `star` | Nav, the GitHub link with its star count (sample count) | none |
| `arrow-right` | "Start tracing" | nudges 3px on hover |
| `book-open` | "Read the docs", hero and close | none |
| `copy` to `check` | Every copy control: the install command (hero, close), the Compose and Helm commands | icon swap, rotated cross-fade, when the command is copied |
| `circle-check` | Waterfall, ok spans | stamps in after its bar draws |
| `triangle-alert` | Waterfall, the slow span and its caption | stamps in after its bar draws |
| `chevron-down` | Questions, each summary | turns 180 degrees when the row opens |
| `box` | Run it, Docker Compose | none |
| `server` | Run it, Kubernetes | none |
| `database` | Run it, the storage line | none |

**Not used:** a GitHub glyph. Lucide 1.x removed brand icons (`github.svg` returns 404), so the GitHub link uses
`star` beside the word. A brand mark could come from Simple Icons (CC0, trademark rules apply) if the author
wants it later.

## Type

- **Schibsted Grotesk** (Google Fonts, SIL OFL 1.1): stand-in for Söhne (commercial, the brand's real face).
  Chosen over Inter Tight and Geist for its Akzidenz-line grotesk character: closed apertures, flat terminals.
- **JetBrains Mono** (Google Fonts, SIL OFL 1.1): data only (service names, durations, trace ids, the install and
  run commands, the code sample, the p99 counter).

## Images

The author declined stock images. None used; the page carries no photography or illustration. The pictures are the
product's own screens, built in HTML as samples (the waterfall, the span detail, the compare table) with the
values marked as sample data. The hero is a CSS dot field and one masked hairline.

## Mark

The three-bar mark and the lowercase wordmark are the brand's own, carried over from the existing page unchanged
(motion mode). The presentation in `selling-positioning/` builds the logo system from it.
