# Stepped showcase example

The example page for `references/techniques/medium.md`, Stepped showcase. It is not part of the test suite (the suite is offline). Content is original and neutral; the technique was read from
preview recordings of a component catalogue on 2026-11-08 (`references/yolo-references.md`), and nothing of that
catalogue is used here: no code, picture, text or name.

Three exhibits on one pinned stage in a tall track of native scroll. A pure function of the scroll gives the step, its dwell and the move; the next exhibit opens as a ring grown from its object, with the page colour and a giant word changing. Previous, Next and the index links scroll to each step; the committed step is written to the address and announced once; hidden steps are `inert`; under reduced motion the steps cut. Below the stage the page scrolls as usual.

Serve the folder over http with any static server that compresses (the measurements used a 30-line Node server
with gzip, `docs/examples/motion-techniques` as the root), then:

```
node scripts/check-motion.mjs http://127.0.0.1:8775/stepped-showcase/page.html --tier medium
N/A    canvas is alive  — no canvas on the page
N/A    canvas honours reduced motion  — no canvas on the page
N/A    canvas pauses off-screen  — no canvas on the page
N/A    fallback without WebGL  — no canvas on the page
PASS   motion weight within tier  — motion JS is 0 KB, within the 139 KB ceiling of the medium tier
REPORT works without JS  — 5 of 13 content items (38 %) missing, hidden or covered without JavaScript: button "Previous" (hidden), a "Filings" (hidden), a "Prism" (hidden), a "Breadboard" (hidden), button "Next" (hidden). (only the fast and yolo tiers fail on this)
N/A    video honours reduced motion  — no video on the page
PASS   no audio before a gesture  — no sound file fetched before the visitor did anything
REPORT page weight by type  — first view 232 KB (images 228 KB, other 4 KB); after a full scroll 232 KB (images 228 KB, other 4 KB)
N/A    built at the chosen tier  — only the yolo tier sets an ambition floor

no check failed (tier: medium)
```

Measured 2026-11-08 on Windows 11, headless Chrome through Playwright (`scripts/lib/browser.mjs`) at 1440 x 900,
the page served compressed over http. The GPU figures are `node scripts/probe.mjs` (canvas pages) or the
interval between animation frames over 4 s (pages without a canvas) on an Intel UHD GPU through ANGLE (Direct3D11);
they are capped at the 60 Hz frame, so they say "smooth" or "not". The software figure is frames drawn in 4 s with
Chrome forced onto SwiftShader (`--use-angle=swiftshader`), a stand-in for a device with no usable graphics chip.

Scrolled end to end in 4 s: median frame 16.7 ms, slowest 5 % 16.8 ms on the GPU and on SwiftShader. Script about 4 KB inline (1.7 KB compressed), 232 KB in all (photographs 228 KB). Wheel recording: reached the end, no stalls; the `wheel-hijack` gate does not fire (the page scrolls). `check-slop` names `three-tiles` on the three exhibits; it is waived on the page with its reason.
