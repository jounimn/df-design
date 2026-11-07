# Reflective water floor example

The example page for `references/techniques/high.md`, Reflective water floor. It is not part of the test suite (the suite is offline, and some of these pages load
three.js or Lenis from a CDN). Content is original and neutral; the technique was read from preview recordings of a
WebGL template catalogue on 2026-11-07 (`references/yolo-references.md`), and nothing of that catalogue is used here.

Ten panels on a slowly turning ring over a three.js `Reflector` at half size, whose shader is replaced: up to six drops (from the pointer, or one every 1.6 s when idle) spread rings that bend the reflection, and the water fades into the ground with distance.

Serve the folder over http with any static server that compresses (a module next to a `file://` page is blocked;
the measurements used a 30-line Node server with gzip), then:

```
node scripts/check-motion.mjs http://127.0.0.1:8765/water-floor/page.html --tier high
PASS   canvas is alive  — changing on screen (1 canvas checked)
PASS   canvas honours reduced motion  — still under reduced motion (1 canvas checked)
PASS   canvas pauses off-screen  — no draw calls off-screen (1 canvas checked)
PASS   fallback without WebGL  — a fallback shows without WebGL (1 WebGL canvas checked)
PASS   motion weight within tier  — motion JS is 148 KB, within the 340 KB ceiling of the high tier
PASS   works without JS  — all 5 content items show without JavaScript
N/A    video honours reduced motion  — no video on the page
PASS   no audio before a gesture  — no sound file fetched before the visitor did anything
REPORT page weight by type  — first view 192 KB (script 142 KB, images 46 KB, other 4 KB); after a full scroll 192 KB (script 142 KB, images 46 KB, other 4 KB)
N/A    built at the chosen tier  — only the yolo tier sets an ambition floor
no check failed (tier: high)
```

Measured 2026-11-07 on Windows 11, headless Chrome through Playwright (`scripts/lib/browser.mjs`), the page served
compressed over http from a local static server (`docs/examples/motion-techniques` as the root). The 3D library, where
there is one, is three.js r170 from jsDelivr, compressed. The probe's renderer was an Intel UHD GPU through ANGLE
(Direct3D11); its frame times are capped at the 60 Hz frame, so they say "smooth" or "not", not how much headroom is
left. The software-renderer figure is frames drawn in 4 seconds with Chrome forced onto SwiftShader
(`--use-angle=swiftshader`), a stand-in for a device with no usable graphics chip.

Median frame 16.7 ms, slowest 5 % 16.7 ms; software renderer 45 frames in 4 s (about 11 a second). Motion code 151 KB,
196 KB in all with the 46 KB poster. Wheel recording: reached the end, no stalls.

Found while building: the material clones the uniforms it is given, so drops written into the original array never
reached the shader; and a displacement of `slope * 0.6` turned the pool into marbling, `0.1` reads as water.
