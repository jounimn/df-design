# Cursor-painted reveal example

The example page for `references/techniques/medium.md`, Cursor-painted reveal. It is not part of the test suite (the suite is offline, and some of these pages load
three.js or Lenis from a CDN). Content is original and neutral; the technique was read from preview recordings of a
WebGL template catalogue on 2026-11-07 (`references/yolo-references.md`), and nothing of that catalogue is used here.

An engraving computed from a photograph's tone; where the pointer passes, a trail buffer at a quarter of the size (8-bit, decaying 0.975 a frame) opens the photograph with a torn, noisy edge. After three idle seconds a slow brush draws a loop.

Serve the folder over http with any static server that compresses (a module next to a `file://` page is blocked;
the measurements used a 30-line Node server with gzip), then:

```
node scripts/check-motion.mjs http://127.0.0.1:8765/cursor-reveal/page.html --tier medium
PASS   canvas is alive  — changing on screen (1 canvas checked)
PASS   canvas honours reduced motion  — still under reduced motion (1 canvas checked)
PASS   canvas pauses off-screen  — no draw calls off-screen (1 canvas checked)
PASS   fallback without WebGL  — a fallback shows without WebGL (1 WebGL canvas checked)
PASS   motion weight within tier  — motion JS is 11 KB, within the 139 KB ceiling of the medium tier
PASS   works without JS  — all 6 content items show without JavaScript
N/A    video honours reduced motion  — no video on the page
PASS   no audio before a gesture  — no sound file fetched before the visitor did anything
REPORT page weight by type  — first view 87 KB (images 79 KB, other 4 KB, script 3 KB); after a full scroll 87 KB (images 79 KB, other 4 KB, script 3 KB)
N/A    built at the chosen tier  — only the yolo tier sets an ambition floor
no check failed (tier: medium)
```

Measured 2026-11-07 on Windows 11, headless Chrome through Playwright (`scripts/lib/browser.mjs`), the page served
compressed over http from a local static server (`docs/examples/motion-techniques` as the root). The 3D library, where
there is one, is three.js r170 from jsDelivr, compressed. The probe's renderer was an Intel UHD GPU through ANGLE
(Direct3D11); its frame times are capped at the 60 Hz frame, so they say "smooth" or "not", not how much headroom is
left. The software-renderer figure is frames drawn in 4 seconds with Chrome forced onto SwiftShader
(`--use-angle=swiftshader`), a stand-in for a device with no usable graphics chip.

Median frame 16.7 ms, slowest 5 % 16.8 ms; software renderer 190 frames in 4 s (about 47 a second). Motion code
11 KB, 89 KB in all (the photograph 79 KB). Wheel recording: reached the end, no stalls. At a decay of 0.955 the hole
closed before the eye found it; 0.975 is the value kept.
