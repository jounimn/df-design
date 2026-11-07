# Page-layer recipes example

The example page for `references/techniques/fast.md` (Text that performs its sentence, Counters that mean something, Scroll-linked, Sticky narrative, Marquee) and `references/recipes-motion.md` §16 and §27. It is not part of the test suite (the suite is offline, and some of these pages load
three.js or Lenis from a CDN). Content is original and neutral; the technique was read from preview recordings of a
WebGL template catalogue on 2026-11-07 (`references/yolo-references.md`), and nothing of that catalogue is used here.

Blur to focus, the reading fill, a scramble label and an odometer, the wordmark between two planes (the loaf cut out with `scripts/cutout.mjs`), a sticky stack, a pixel-block cut and a ring carousel with drag, inertia and a pause, on Lenis smooth scroll that is skipped under reduced motion. No canvas.

Serve the folder over http with any static server that compresses (a module next to a `file://` page is blocked;
the measurements used a 30-line Node server with gzip), then:

```
node scripts/check-motion.mjs http://127.0.0.1:8765/dom-recipes/page.html --tier fast
N/A    canvas is alive  — no canvas on the page
N/A    canvas honours reduced motion  — no canvas on the page
N/A    canvas pauses off-screen  — no canvas on the page
N/A    fallback without WebGL  — no canvas on the page
REPORT motion weight within tier  — motion JS is 0 KB; the fast tier has no weight ceiling; it is checked by the works-without-JS rule
PASS   works without JS  — 1 of 29 content items (3 %) missing, hidden or covered without JavaScript (within the 5 % allowed): button "Stop the turning" (hidden).
N/A    video honours reduced motion  — no video on the page
PASS   no audio before a gesture  — no sound file fetched before the visitor did anything
REPORT page weight by type  — first view 107 KB (images 97 KB, other 6 KB, script 4 KB); after a full scroll 107 KB (images 97 KB, other 6 KB, script 4 KB)
N/A    built at the chosen tier  — only the yolo tier sets an ambition floor
no check failed (tier: fast)
```

Measured 2026-11-07 on Windows 11, headless Chrome through Playwright (`scripts/lib/browser.mjs`), the page served
compressed over http from a local static server (`docs/examples/motion-techniques` as the root). The 3D library, where
there is one, is three.js r170 from jsDelivr, compressed. The probe's renderer was an Intel UHD GPU through ANGLE
(Direct3D11); its frame times are capped at the 60 Hz frame, so they say "smooth" or "not", not how much headroom is
left. The software-renderer figure is frames drawn in 4 seconds with Chrome forced onto SwiftShader
(`--use-angle=swiftshader`), a stand-in for a device with no usable graphics chip.

`check-slop --render`: 0 FAIL, 0 Reflex after four fixes (font and shadow literals lifted into tokens, the ring stage
clipped and its radius capped on a phone: the first build scrolled 549 px wide at 390, and a mono label that was not
data). The wheel recording reached the end with no stalls. 107 KB in all, 97 KB of it the cut-out loaf; Lenis 1.1.13 is
3.8 KB compressed from jsDelivr. The ring turned by itself with no pause control at first, which the loop gate in
`gates.md` forbids; it now stops under the hand, on focus and with a button.
