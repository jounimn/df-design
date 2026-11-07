# Fluid ink example

The example page for `references/techniques/high.md`, Fluid ink. It is not part of the test suite (the suite is offline, and some of these pages load
three.js or Lenis from a CDN). Content is original and neutral; the technique was read from preview recordings of a
WebGL template catalogue on 2026-11-07 (`references/yolo-references.md`), and nothing of that catalogue is used here.

A stable-fluids solver (velocity and dye on half-float textures, vorticity, 20 Jacobi pressure steps) over a photograph; the dye is the photograph's own colour under the pointer, and after two idle seconds a slow figure eight lays a faint ink. Adapted from Pavel Dobryakov's WebGL-Fluid-Simulation (MIT, `licenses/PavelDoGreat-WebGL-Fluid-Simulation-LICENSE`).

Serve the folder over http with any static server that compresses (a module next to a `file://` page is blocked;
the measurements used a 30-line Node server with gzip), then:

```
node scripts/check-motion.mjs http://127.0.0.1:8765/fluid-ink/page.html --tier high
PASS   canvas is alive  — changing on screen (1 canvas checked)
PASS   canvas honours reduced motion  — still under reduced motion (1 canvas checked)
PASS   canvas pauses off-screen  — no draw calls off-screen (1 canvas checked)
PASS   fallback without WebGL  — a fallback shows without WebGL (1 WebGL canvas checked)
PASS   motion weight within tier  — motion JS is 15 KB, within the 340 KB ceiling of the high tier
PASS   works without JS  — all 6 content items show without JavaScript
N/A    video honours reduced motion  — no video on the page
PASS   no audio before a gesture  — no sound file fetched before the visitor did anything
REPORT page weight by type  — first view 50 KB (images 41 KB, other 5 KB, script 3 KB); after a full scroll 50 KB (images 41 KB, other 5 KB, script 3 KB)
N/A    built at the chosen tier  — only the yolo tier sets an ambition floor
no check failed (tier: high)
```

Measured 2026-11-07 on Windows 11, headless Chrome through Playwright (`scripts/lib/browser.mjs`), the page served
compressed over http from a local static server (`docs/examples/motion-techniques` as the root). The 3D library, where
there is one, is three.js r170 from jsDelivr, compressed. The probe's renderer was an Intel UHD GPU through ANGLE
(Direct3D11); its frame times are capped at the 60 Hz frame, so they say "smooth" or "not", not how much headroom is
left. The software-renderer figure is frames drawn in 4 seconds with Chrome forced onto SwiftShader
(`--use-angle=swiftshader`), a stand-in for a device with no usable graphics chip.

Median frame 16.7 ms, slowest 5 % 16.8 ms; software renderer 49 frames in 4 s (about 12 a second). Motion code
15 KB, 51 KB in all (the photograph 41 KB). Wheel recording: reached the end, no stalls.

Found while building: a 2D canvas is 300 px wide before anything sets it, so a `!canvas.width` test never ran the
sampling and every ink was black; and a page exactly two screens tall left the hero's bottom edge on the viewport's top
edge, which still counts as on screen (the off-screen check failed until the page was taller).
