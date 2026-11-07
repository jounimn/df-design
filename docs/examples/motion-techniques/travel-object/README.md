# Object that travels between sections example

The example page for `references/techniques/high.md`, Object that travels between sections, and `recipes-motion.md` §18. It is not part of the test suite (the suite is offline, and some of these pages load
three.js or Lenis from a CDN). Content is original and neutral; the technique was read from preview recordings of a
WebGL template catalogue on 2026-11-07 (`references/yolo-references.md`), and nothing of that catalogue is used here.

One faceted stone in a canvas fixed behind the page; each of four sections keeps an empty slot of the stone's size, and the scroll mixes the pose between the two nearest slots (unprojected into the scene), followed with `1 - exp(-7·dt)` and lifted towards the viewer mid-move. Under reduced motion it is drawn once, still, in the first slot.

Serve the folder over http with any static server that compresses (a module next to a `file://` page is blocked;
the measurements used a 30-line Node server with gzip), then:

```
node scripts/check-motion.mjs http://127.0.0.1:8765/travel-object/page.html --tier high
PASS   canvas is alive  — changing on screen (1 canvas checked)
PASS   canvas honours reduced motion  — still under reduced motion (1 canvas checked)
N/A    canvas pauses off-screen  — could not scroll the canvas out of view to compare
PASS   fallback without WebGL  — a fallback shows without WebGL (1 WebGL canvas checked)
PASS   motion weight within tier  — motion JS is 173 KB, within the 340 KB ceiling of the high tier
PASS   works without JS  — all 10 content items show without JavaScript
N/A    video honours reduced motion  — no video on the page
PASS   no audio before a gesture  — no sound file fetched before the visitor did anything
REPORT page weight by type  — first view 185 KB (script 173 KB, images 9 KB, other 3 KB); after a full scroll 185 KB (script 173 KB, images 9 KB, other 3 KB)
N/A    built at the chosen tier  — only the yolo tier sets an ambition floor
no check failed (tier: high)
```

Measured 2026-11-07 on Windows 11, headless Chrome through Playwright (`scripts/lib/browser.mjs`), the page served
compressed over http from a local static server (`docs/examples/motion-techniques` as the root). The 3D library, where
there is one, is three.js r170 from jsDelivr, compressed. The probe's renderer was an Intel UHD GPU through ANGLE
(Direct3D11); its frame times are capped at the 60 Hz frame, so they say "smooth" or "not", not how much headroom is
left. The software-renderer figure is frames drawn in 4 seconds with Chrome forced onto SwiftShader
(`--use-angle=swiftshader`), a stand-in for a device with no usable graphics chip.

Median frame 16.7 ms, slowest 5 % 16.8 ms; software renderer 93 frames in 4 s (about 23 a second). Motion code
144 KB as the probe counts it, 173 KB as `check-motion` does; 157 KB in all (185 KB with the poster). Wheel recording: reached the end, no stalls.

Built as a YOLO card first; `check-motion --tier yolo` answered:

```
REPORT built at the chosen tier  — built below the chosen tier: 185 KB in all, under the 340 KB High ceiling. Seen: a real-time 3D scene (1 WebGL canvas). That is a high build with a yolo label: build the yolo techniques at flagship scale (techniques/yolo.md), or re-send the tier message.
```

so the card went to High. Found while building: the poster was drawn off to the side because the camera's world
matrix is only updated by the first render; `camera.updateMatrixWorld()` before the first unprojection fixed it.
