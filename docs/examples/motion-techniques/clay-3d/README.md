# Clay 3D example

Acceptance run for the Clay 3D card (`references/techniques/high.md`), on a test page and on a slide. It is not part of
the test suite: the suite is offline and this loads three.js (pinned to r170) from
`https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js`.

- `page.html`: the recipe on a page. The recipe's module script is inline, because a module file next to a `file://`
  page is blocked by the browser; an inline module may import from https.
- `presentation.html`: the test presentation with the same stage on slide 2 (`canvas-loop.js`, `slideshow.js/css` are copies
  of `templates/`).
- `clay-poster.jpg`: the loop's own poster frame (reduced motion on, `dfPoster === 'done'`, screenshot of the stage); it is
  the fallback picture.

Results, 2026-10-16 (Intel UHD GPU, Chrome):

```
node scripts/check-motion.mjs docs/examples/motion-techniques/clay-3d/page.html --tier high
PASS   canvas is alive  — changing on screen (1 canvas checked)
PASS   canvas honours reduced motion  — still under reduced motion (1 canvas checked)
PASS   canvas pauses off-screen  — no draw calls off-screen (1 canvas checked)
PASS   fallback without WebGL  — a fallback shows without WebGL (1 WebGL canvas checked)
PASS   motion weight within tier  — motion JS is 182 KB, within the 340 KB ceiling of the high tier
PASS   works without JS  — all 4 content items show without JavaScript

node scripts/export-presentation.mjs docs/examples/motion-techniques/clay-3d none
node scripts/check-presentation.mjs docs/examples/motion-techniques/clay-3d --offline --watermark none --tier high
29/29 checks passed, including motion: alive, honours reduced motion, fallback without WebGL, weight 182 KB of 340 KB
```

On the slide the "pauses off-screen" check reports n/a (the slide has no scroll to take the canvas out of view); the
slideshow stops a canvas whose slide is not in focus, which `test/slideshow.test.mjs` and `test/canvas-loop.test.mjs` cover.

Export: slide 2 shows the three lumps (the poster frame), not a blank canvas. Two exports are byte for byte the same in
all 15 files except the PDF's `CreationDate` (6 bytes). The PDF holds the canvas as an extra image (2 more image objects
and 88 KB more than the same presentation without the canvas). The weight (182 KB) is the page as served compressed.
