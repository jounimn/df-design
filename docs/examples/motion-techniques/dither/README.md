# Dither examples

The example page for `references/techniques/fast.md` and `medium.md`, Dither. It is not part of the test suite (the suite is offline). Content is original and neutral; the technique was read from
preview recordings of a component catalogue on 2026-11-08 (`references/yolo-references.md`), and nothing of that
catalogue is used here: no code, picture, text or name.

`still.html` (Fast): one photograph printed in two inks by an SVG filter (grey, a lift of the shadows, a tiled 4 x 4 Bayer screen, a two-step transfer); no script. `page.html` (Medium): a fog of value noise computed at one cell per seven pixels into a small buffer, thresholded through the same screen and drawn up with hard pixels; a lamp under the pointer clears it, and walks on its own when idle (`recipes-motion.md` §28).

Serve the folder over http with any static server that compresses (the measurements used a 30-line Node server
with gzip, `docs/examples/motion-techniques` as the root), then:

```
node scripts/check-motion.mjs http://127.0.0.1:8775/dither/still.html --tier fast
N/A    canvas is alive  — no canvas on the page
N/A    canvas honours reduced motion  — no canvas on the page
N/A    canvas pauses off-screen  — no canvas on the page
N/A    fallback without WebGL  — no canvas on the page
REPORT motion weight within tier  — motion JS is 0 KB; the fast tier has no weight ceiling; it is checked by the works-without-JS rule
PASS   works without JS  — all 7 content items show without JavaScript
N/A    video honours reduced motion  — no video on the page
PASS   no audio before a gesture  — no sound file fetched before the visitor did anything
REPORT page weight by type  — first view 7 KB (images 5 KB, other 2 KB); after a full scroll 7 KB (images 5 KB, other 2 KB)
N/A    built at the chosen tier  — only the yolo tier sets an ambition floor

no check failed (tier: fast)
```

```
node scripts/check-motion.mjs http://127.0.0.1:8775/dither/page.html --tier medium
PASS   canvas is alive  — changing on screen (1 canvas checked)
PASS   canvas honours reduced motion  — still under reduced motion (1 canvas checked)
PASS   canvas pauses off-screen  — no draw calls off-screen (1 canvas checked)
N/A    fallback without WebGL  — no WebGL canvas to compare without WebGL
PASS   motion weight within tier  — motion JS is 8 KB, within the 139 KB ceiling of the medium tier
PASS   works without JS  — all 5 content items show without JavaScript
N/A    video honours reduced motion  — no video on the page
PASS   no audio before a gesture  — no sound file fetched before the visitor did anything
REPORT page weight by type  — first view 7 KB (script 3 KB, other 3 KB, images 0 KB); after a full scroll 7 KB (script 3 KB, other 3 KB, images 0 KB)
N/A    built at the chosen tier  — only the yolo tier sets an ambition floor

no check failed (tier: medium)
```

Measured 2026-11-08 on Windows 11, headless Chrome through Playwright (`scripts/lib/browser.mjs`) at 1440 x 900,
the page served compressed over http. The GPU figures are `node scripts/probe.mjs` (canvas pages) or the
interval between animation frames over 4 s (pages without a canvas) on an Intel UHD GPU through ANGLE (Direct3D11);
they are capped at the 60 Hz frame, so they say "smooth" or "not". The software figure is frames drawn in 4 s with
Chrome forced onto SwiftShader (`--use-angle=swiftshader`), a stand-in for a device with no usable graphics chip.

`still.html`: no script, 7 KB in all; 16.7 / 16.8 ms. `page.html`: median frame 16.7 ms, slowest 5 % 16.8 ms (probe); software renderer 107 frames in 4 s; motion code 7 KB, 7 KB in all; wheel recording reached the end, no stalls. The first build hashed every noise sample with `sin()` over two fields and ran at a 66.7 ms median on the Intel GPU with 44 long tasks in 4 s; a 256-value table and one field kept it at 16.7 ms.
