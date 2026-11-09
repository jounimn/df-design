# CSS 3D objects examples

The example page for `references/techniques/fast.md` and `medium.md`, CSS 3D objects. It is not part of the test suite (the suite is offline). Content is original and neutral; the technique was read from
preview recordings of a component catalogue on 2026-11-08 (`references/yolo-references.md`), and nothing of that
catalogue is used here: no code, picture, text or name.

`page.html` (Fast): a coin of two faces and forty edge slices turning in one 3D context, with a ring of eight words orbiting through it; no script, a checkbox and hover pause it. `sphere.html` (Medium): 24 slices of one contact sheet on a sphere, turned and lit by facing as the page scrolls, then a drum of 16 the camera dollies into; the script only writes transforms and a brightness. Without the script and under reduced motion, a flat contact sheet.

Serve the folder over http with any static server that compresses (the measurements used a 30-line Node server
with gzip, `docs/examples/motion-techniques` as the root), then:

```
node scripts/check-motion.mjs http://127.0.0.1:8775/css-3d/page.html --tier fast
N/A    canvas is alive  — no canvas on the page
N/A    canvas honours reduced motion  — no canvas on the page
N/A    canvas pauses off-screen  — no canvas on the page
N/A    fallback without WebGL  — no canvas on the page
REPORT motion weight within tier  — motion JS is 0 KB; the fast tier has no weight ceiling; it is checked by the works-without-JS rule
PASS   works without JS  — all 5 content items show without JavaScript
N/A    video honours reduced motion  — no video on the page
PASS   no audio before a gesture  — no sound file fetched before the visitor did anything
REPORT page weight by type  — first view 3 KB (other 2 KB, images 0 KB); after a full scroll 3 KB (other 2 KB, images 0 KB)
N/A    built at the chosen tier  — only the yolo tier sets an ambition floor

no check failed (tier: fast)
```

```
node scripts/check-motion.mjs http://127.0.0.1:8775/css-3d/sphere.html --tier medium
N/A    canvas is alive  — no canvas on the page
N/A    canvas honours reduced motion  — no canvas on the page
N/A    canvas pauses off-screen  — no canvas on the page
N/A    fallback without WebGL  — no canvas on the page
PASS   motion weight within tier  — motion JS is 0 KB, within the 139 KB ceiling of the medium tier
PASS   works without JS  — all 9 content items show without JavaScript
N/A    video honours reduced motion  — no video on the page
PASS   no audio before a gesture  — no sound file fetched before the visitor did anything
REPORT page weight by type  — first view 145 KB (images 142 KB, other 3 KB); after a full scroll 145 KB (images 142 KB, other 3 KB)
N/A    built at the chosen tier  — only the yolo tier sets an ambition floor

no check failed (tier: medium)
```

Measured 2026-11-08 on Windows 11, headless Chrome through Playwright (`scripts/lib/browser.mjs`) at 1440 x 900,
the page served compressed over http. The GPU figures are `node scripts/probe.mjs` (canvas pages) or the
interval between animation frames over 4 s (pages without a canvas) on an Intel UHD GPU through ANGLE (Direct3D11);
they are capped at the 60 Hz frame, so they say "smooth" or "not". The software figure is frames drawn in 4 s with
Chrome forced onto SwiftShader (`--use-angle=swiftshader`), a stand-in for a device with no usable graphics chip.

`page.html`: frames 16.7 ms median, 17.4 ms slowest 5 % on the GPU, 16.7 / 16.7 ms on SwiftShader; no script, 3 KB. `sphere.html`, scrolled end to end in 4 s: 16.7 / 16.8 ms on both; script about 3 KB inline (1.4 KB compressed), 145 KB in all. Wheel recording of the sphere: reached the end, no stalls. The first build of `page.html` scrolled 52 px sideways at 320 (the ring's side words); the section is now clipped.
