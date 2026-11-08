# Type on geometry example

The example page for `references/techniques/high.md`, Type on geometry. It is not part of the test suite (the suite is offline). Content is original and neutral; the technique was read from
preview recordings of a component catalogue on 2026-11-08 (`references/yolo-references.md`), and nothing of that
catalogue is used here: no code, picture, text or name.

A ribbon along a trefoil knot, built in the page (parallel-transport frames, one twist per loop), carrying the names of four knots drawn once into a 2048 x 128 strip; the words slide along the rope and the far turns fade into the page. Raw WebGL 2, no library, no image. A button stops the rope.

Serve the folder over http with any static server that compresses (the measurements used a 30-line Node server
with gzip, `docs/examples/motion-techniques` as the root), then:

```
node scripts/check-motion.mjs http://127.0.0.1:8775/type-geometry/page.html --tier high
PASS   canvas is alive  — changing on screen (1 canvas checked)
PASS   canvas honours reduced motion  — still under reduced motion (1 canvas checked)
PASS   canvas pauses off-screen  — no draw calls off-screen (1 canvas checked)
PASS   fallback without WebGL  — a fallback shows without WebGL (1 WebGL canvas checked)
PASS   motion weight within tier  — motion JS is 11 KB, within the 340 KB ceiling of the high tier
PASS   works without JS  — all 6 content items show without JavaScript
N/A    video honours reduced motion  — no video on the page
PASS   no audio before a gesture  — no sound file fetched before the visitor did anything
REPORT page weight by type  — first view 8 KB (other 5 KB, script 3 KB, images 0 KB); after a full scroll 8 KB (other 5 KB, script 3 KB, images 0 KB)
N/A    built at the chosen tier  — only the yolo tier sets an ambition floor

no check failed (tier: high)
```

Measured 2026-11-08 on Windows 11, headless Chrome through Playwright (`scripts/lib/browser.mjs`) at 1440 x 900,
the page served compressed over http. The GPU figures are `node scripts/probe.mjs` (canvas pages) or the
interval between animation frames over 4 s (pages without a canvas) on an Intel UHD GPU through ANGLE (Direct3D11);
they are capped at the 60 Hz frame, so they say "smooth" or "not". The software figure is frames drawn in 4 s with
Chrome forced onto SwiftShader (`--use-angle=swiftshader`), a stand-in for a device with no usable graphics chip.

Median frame 16.7 ms, slowest 5 % 16.7 ms (probe); software renderer 71 frames in 4 s. Motion code 11 KB, 8 KB in all. Wheel recording: reached the end, no stalls. The first build read the colour tokens through a canvas every frame and showed a slowest 5 % of 34.9 ms with five long tasks; reading each token once fixed it.
