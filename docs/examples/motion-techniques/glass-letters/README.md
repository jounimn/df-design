# Glass letters example

The example page for `references/techniques/high.md`, Glass letters. It is not part of the test suite (the suite is offline). Content is original and neutral; the technique was read from
preview recordings of a component catalogue on 2026-11-08 (`references/yolo-references.md`), and nothing of that
catalogue is used here: no code, picture, text or name.

The page's own headline, read from the page (font, size, box), drawn into a texture as a blurred height and a sharp mask; one pass bends the section's photograph through the slope of the letters, with a slight colour split, dark steep edges and a glint that follows the pointer (idle: a slow path, `recipes-motion.md` §28). The HTML headline turns clear once the glass has drawn and comes back if the drawing fails.

Serve the folder over http with any static server that compresses (the measurements used a 30-line Node server
with gzip, `docs/examples/motion-techniques` as the root), then:

```
node scripts/check-motion.mjs http://127.0.0.1:8775/glass-letters/page.html --tier high
PASS   canvas is alive  — changing on screen (1 canvas checked)
PASS   canvas honours reduced motion  — still under reduced motion (1 canvas checked)
PASS   canvas pauses off-screen  — no draw calls off-screen (1 canvas checked)
PASS   fallback without WebGL  — a fallback shows without WebGL (1 WebGL canvas checked)
PASS   motion weight within tier  — motion JS is 11 KB, within the 340 KB ceiling of the high tier
REPORT works without JS  — 1 of 6 content items (17 %) missing, hidden or covered without JavaScript: img "Hand-laid limestone cobbles of a Lisbon square, seen from above" (covered). (only the fast and yolo tiers fail on this)
N/A    video honours reduced motion  — no video on the page
PASS   no audio before a gesture  — no sound file fetched before the visitor did anything
REPORT page weight by type  — first view 128 KB (images 120 KB, other 4 KB, script 3 KB); after a full scroll 128 KB (images 120 KB, other 4 KB, script 3 KB)
N/A    built at the chosen tier  — only the yolo tier sets an ambition floor

no check failed (tier: high)
```

Measured 2026-11-08 on Windows 11, headless Chrome through Playwright (`scripts/lib/browser.mjs`) at 1440 x 900,
the page served compressed over http. The GPU figures are `node scripts/probe.mjs` (canvas pages) or the
interval between animation frames over 4 s (pages without a canvas) on an Intel UHD GPU through ANGLE (Direct3D11);
they are capped at the 60 Hz frame, so they say "smooth" or "not". The software figure is frames drawn in 4 s with
Chrome forced onto SwiftShader (`--use-angle=swiftshader`), a stand-in for a device with no usable graphics chip.

Median frame 16.6 ms, slowest 5 % 17.7 ms (probe); software renderer 24 frames in 4 s. Motion code 11 KB, 127 KB in all (the photograph 120 KB). Wheel recording: reached the end, no stalls. Without JavaScript check-motion reports the photograph "covered": it is the hero's background, under the headline and its paragraph, which is what this page means it to be (a REPORT, not a failure, on the high tier). The canvas starts `hidden` and the script shows it, so without JavaScript nothing but the photograph and the type is drawn.
