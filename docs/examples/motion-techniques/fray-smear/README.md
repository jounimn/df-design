# Images that fray and smear example

The example page for `references/techniques/high.md`, Images that fray and smear. It is not part of the test suite (the suite is offline). Content is original and neutral; the technique was read from
preview recordings of a component catalogue on 2026-11-08 (`references/yolo-references.md`), and nothing of that
catalogue is used here: no code, picture, text or name.

Three photographs laid once into one strip texture; one pass reads it with a moving offset, lets each 3-pixel row slide on its own near the edges (the threads) and, inside a circle at the eased pointer, samples it twelve times along the lens's velocity (the smear). The lens walks on its own until the hand arrives (`recipes-motion.md` §28); a button pauses the strip.

Serve the folder over http with any static server that compresses (the measurements used a 30-line Node server
with gzip, `docs/examples/motion-techniques` as the root), then:

```
node scripts/check-motion.mjs http://127.0.0.1:8775/fray-smear/page.html --tier high
PASS   canvas is alive  — changing on screen (1 canvas checked)
PASS   canvas honours reduced motion  — still under reduced motion (1 canvas checked)
PASS   canvas pauses off-screen  — no draw calls off-screen (1 canvas checked)
PASS   fallback without WebGL  — a fallback shows without WebGL (1 WebGL canvas checked)
PASS   motion weight within tier  — motion JS is 12 KB, within the 340 KB ceiling of the high tier
PASS   works without JS  — all 6 content items show without JavaScript
N/A    video honours reduced motion  — no video on the page
PASS   no audio before a gesture  — no sound file fetched before the visitor did anything
REPORT page weight by type  — first view 164 KB (images 156 KB, other 5 KB, script 3 KB); after a full scroll 164 KB (images 156 KB, other 5 KB, script 3 KB)
N/A    built at the chosen tier  — only the yolo tier sets an ambition floor

no check failed (tier: high)
```

Measured 2026-11-08 on Windows 11, headless Chrome through Playwright (`scripts/lib/browser.mjs`) at 1440 x 900,
the page served compressed over http. The GPU figures are `node scripts/probe.mjs` (canvas pages) or the
interval between animation frames over 4 s (pages without a canvas) on an Intel UHD GPU through ANGLE (Direct3D11);
they are capped at the 60 Hz frame, so they say "smooth" or "not". The software figure is frames drawn in 4 s with
Chrome forced onto SwiftShader (`--use-angle=swiftshader`), a stand-in for a device with no usable graphics chip.

Median frame 16.7 ms, slowest 5 % 16.8 ms (probe); software renderer 61 frames in 4 s. Motion code 11 KB, 164 KB in all (photographs 156 KB). Wheel recording: reached the end, no stalls. The first build pushed the page sideways at 320 to 1024 px (the hidden fallback row was still in the layout); the row is now clipped.
