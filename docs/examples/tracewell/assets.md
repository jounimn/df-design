# Tracewell — assets

## Icon set: Lucide (lucide-static v1.52.0)

- **Licence:** ISC (permissive; commercial use, no attribution required). LICENSE checked at https://unpkg.com/lucide-static/LICENSE on 2026-10-05.
- **Why Lucide:** a dense developer tool wants Lucide or Tabler at 1.5px (`icons-and-assets.md` §0). Lucide's 24px grid and round joins sit closer to the grotesk's flat-terminal rhythm at 13–15px than Tabler's larger catalogue, and this page needs eight glyphs, not five thousand.
- **Stroke:** 1.5 (overridden from the set's 2) to match regular-weight UI text; sized to cap height (13.5–15px), `currentColor`, `aria-hidden` when a label sits beside it.
- **Delivery:** SVG paths fetched from `https://unpkg.com/lucide-static/icons/<name>.svg` and inlined. No dependency, no barrel import.

| Glyph | Where | Motion |
|---|---|---|
| `star` | Nav "Star 4.2k" button | none |
| `arrow-right` | "Start tracing" | nudges 3px on hover |
| `book-open` | "Read the docs" | none |
| `copy` → `check` | Install command `npm i @tracewell/sdk` | icon-swap, rotated cross-fade (§15) |
| `circle-check` | Waterfall, ok spans | stamps in after its bar draws |
| `triangle-alert` | Waterfall, slow span + caption | stamps in after its bar draws |

**Not used:** a GitHub glyph. Lucide 1.x removed brand icons (`github.svg` returns 404), so the GitHub button uses `star`. A brand mark could come from Simple Icons (CC0, trademark rules apply) if the author wants it later.

## Type

- **Schibsted Grotesk** (Google Fonts, SIL OFL 1.1): stand-in for Söhne (commercial). Chosen over Inter Tight / Geist for its Akzidenz-line grotesk character.
- **JetBrains Mono** (Google Fonts, SIL OFL 1.1): data only (service names, durations, trace ids, the p99 counter).

## Images

Images: author declined stock images. None used; the page carries no photography or illustration. The hero is a CSS dot field and one masked hairline.
