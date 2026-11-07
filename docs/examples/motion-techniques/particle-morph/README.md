# Particle morph by scroll example

The example page for `references/techniques/high.md`, Particles, "Re-forming by scroll". It is not part of the test suite (the suite is offline, and some of these pages load
three.js or Lenis from a CDN). Content is original and neutral; the technique was read from preview recordings of a
WebGL template catalogue on 2026-11-07 (`references/yolo-references.md`), and nothing of that catalogue is used here.

One cloud of points (60,000 by default; `?n=` sets the count) re-forms from a shell to a ring, a double helix and a disc as the section scrolls. Raw WebGL 2, no library: the four shapes are computed once into one buffer, the vertex shader mixes them with a per-point delay and adds a sine-curl turbulence, and a damped spring carries the drawn morph to the scroll's target.

Serve the folder over http with any static server that compresses (a module next to a `file://` page is blocked;
the measurements used a 30-line Node server with gzip), then:

```
node scripts/check-motion.mjs http://127.0.0.1:8765/particle-morph/page.html --tier high
PASS   canvas is alive  — changing on screen (1 canvas checked)
PASS   canvas honours reduced motion  — still under reduced motion (1 canvas checked)
PASS   canvas pauses off-screen  — no draw calls off-screen (1 canvas checked)
PASS   fallback without WebGL  — a fallback shows without WebGL (1 WebGL canvas checked)
PASS   motion weight within tier  — motion JS is 11 KB, within the 340 KB ceiling of the high tier
PASS   works without JS  — all 12 content items show without JavaScript
N/A    video honours reduced motion  — no video on the page
PASS   no audio before a gesture  — no sound file fetched before the visitor did anything
REPORT page weight by type  — first view 9 KB (other 5 KB, script 3 KB, images 0 KB); after a full scroll 9 KB (other 5 KB, script 3 KB, images 0 KB)
N/A    built at the chosen tier  — only the yolo tier sets an ambition floor
no check failed (tier: high)
```

Measured 2026-11-07 on Windows 11, headless Chrome through Playwright (`scripts/lib/browser.mjs`), the page served
compressed over http from a local static server (`docs/examples/motion-techniques` as the root). The 3D library, where
there is one, is three.js r170 from jsDelivr, compressed. The probe's renderer was an Intel UHD GPU through ANGLE
(Direct3D11); its frame times are capped at the 60 Hz frame, so they say "smooth" or "not", not how much headroom is
left. The software-renderer figure is frames drawn in 4 seconds with Chrome forced onto SwiftShader
(`--use-angle=swiftshader`), a stand-in for a device with no usable graphics chip.

| Points | Median frame | Slowest 5 % | Software renderer |
|---|---|---|---|
| 60,000 | 16.7 ms | 16.7 ms | 49 frames in 4 s (about 12 a second) |
| 200,000 | 16.7 ms | 16.8 ms | 36 frames in 4 s (about 9 a second) |
| 400,000 | 16.7 ms | 16.8 ms | not run |

Motion code 11 KB, 9 KB transferred in all. Wheel recording (`probe --motion`): reached the end, no stalls; the sheets
show the shell turning, then flattening into the ring as the first chapter passes.
