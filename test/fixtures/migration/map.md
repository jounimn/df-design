# Migration: Harbour

## Inventory and map

| Legacy | Where | Decision | New | Reason |
|---|---|---|---|---|
| `--brand: 174 177 255` | src/index.css:12 | REPLACE | `--brand: 1 7 176`, `--brand-blue` (new, for the solid button) | |
| `Inter` | src/index.css:3 | REPLACE | `Archivo` (display), `IBM Plex Mono` (figures) | |
| `[data-theme="cockpit"]` | src/index.css:18 | REMOVE | — | no block defines its tokens |
| `--canvas` | src/index.css:9 | KEEP | — | already the new palette's ground; approved 2026-11-09 |
| `.btn-legacy` | src/index.css:21 | REPLACE | `.btn` | |
