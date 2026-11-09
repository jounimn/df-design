# Glass over moving light example

The example page for `references/techniques/medium.md`, Glass over moving light. It is not part of the test suite (the suite is offline). Content is original and neutral; the technique was read from
preview recordings of a component catalogue on 2026-11-08 (`references/yolo-references.md`), and nothing of that
catalogue is used here: no code, picture, text or name.

A field of thin light lines drifting behind a panel, drawn in one full-screen pass at three quarters of the pixels; the panel is reeded (half-cylinder ribs that sway as an S) or beaded (a hex grid of small spheres), switched by a button. The pointer carries a lamp; idle, the lamp walks a Lissajous path (`recipes-motion.md` §28). No image.

Serve the folder over http with any static server that compresses (the measurements used a 30-line Node server
with gzip, `docs/examples/motion-techniques` as the root), then:

```
node scripts/check-motion.mjs http://127.0.0.1:8775/glass-light/page.html --tier medium
PASS   canvas is alive  — changing on screen (1 canvas checked)
PASS   canvas honours reduced motion  — still under reduced motion (1 canvas checked)
PASS   canvas pauses off-screen  — no draw calls off-screen (1 canvas checked)
PASS   fallback without WebGL  — a fallback shows without WebGL (1 WebGL canvas checked)
PASS   motion weight within tier  — motion JS is 10 KB, within the 139 KB ceiling of the medium tier
PASS   works without JS  — all 6 content items show without JavaScript
N/A    video honours reduced motion  — no video on the page
PASS   no audio before a gesture  — no sound file fetched before the visitor did anything
REPORT page weight by type  — first view 8 KB (other 5 KB, script 3 KB, images 0 KB); after a full scroll 8 KB (other 5 KB, script 3 KB, images 0 KB)
N/A    built at the chosen tier  — only the yolo tier sets an ambition floor

no check failed (tier: medium)
```

Measured 2026-11-08 on Windows 11, headless Chrome through Playwright (`scripts/lib/browser.mjs`) at 1440 x 900,
the page served compressed over http. The GPU figures are `node scripts/probe.mjs` (canvas pages) or the
interval between animation frames over 4 s (pages without a canvas) on an Intel UHD GPU through ANGLE (Direct3D11);
they are capped at the 60 Hz frame, so they say "smooth" or "not". The software figure is frames drawn in 4 s with
Chrome forced onto SwiftShader (`--use-angle=swiftshader`), a stand-in for a device with no usable graphics chip.

Median frame 16.7 ms, slowest 5 % 16.8 ms (probe); software renderer 46 frames in 4 s. Motion code 10 KB, 8 KB in all. Wheel recording: reached the end, no stalls. At full resolution with the colour split the software renderer drew 22 frames in 4 s; three quarters of the pixels is the value kept.
