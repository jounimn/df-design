# Motion recipes

Working implementations, each traced to a site that ships it. Every value
here was read off a production page — see `benchmarks.md` for the method.
The techniques themselves are cards, one file per tier: [fast](techniques/fast.md) (23 cards),
[medium](techniques/medium.md) (5), [high](techniques/high.md) (12) and [yolo](techniques/yolo.md) (6). Open the file of the tier the
author chose, then the card for the effect. Each card says what it is, which identities it suits, what it
costs the visitor and how to build it. This file keeps the rules that apply to all of them.

**The governing idea:** the sites that read as expensive are not running
more animations. They are compositing — masks, clip paths, blend modes and
one cheap ambient loop. Reach for those before reaching for a keyframe.

---

## 1. The signature curve

Do not default to Material's `cubic-bezier(0.4, 0, 0.2, 1)`. It is the most
common curve in design systems and the least characterful of those measured.

```css
:root {
  /* Stripe ships this 435 times. Arrives fast, settles long. */
  --ease-signature: cubic-bezier(0.25, 1, 0.5, 1);   /* easeOutQuart */
  /* Linear's own curve, 30 instances. Even harder deceleration. */
  --ease-weighted:  cubic-bezier(0.32, 0.72, 0, 1);
  /* Stripe, for the one showpiece moment. */
  --ease-dramatic:  cubic-bezier(0.16, 1, 0.3, 1);   /* easeOutExpo */

  --dur-feedback: 0.15s;   /* hover, press, focus */
  --dur-content:  0.3s;    /* reveals, menus, transitions */
  --dur-showpiece: 0.8s;   /* used once or twice per page */
}
```

Pick ONE of the three curves as the project's signature and use it for
roughly 80% of transitions. The other two are for exceptions you can name.

---

## 2. Ambient dot grid → references/techniques/fast.md

Moved to [its card](techniques/fast.md#ambient-dot-grid).

---

## 3. Corner glow → references/techniques/fast.md

Moved to [its card](techniques/fast.md#corner-glow).

---

## 4. Edge fade → references/techniques/fast.md

Moved to [its card](techniques/fast.md#edge-fade).

---

## 5. Dot grid and hairlines as masks → references/techniques/fast.md

Moved to [its card](techniques/fast.md#dot-grid-and-hairlines-as-masks).

---

## 6. Noise → references/techniques/fast.md

Moved to [its card](techniques/fast.md#noise).

---

## 7. Shimmer sweep → references/techniques/fast.md

Moved to [its card](techniques/fast.md#shimmer-sweep).

---

## 8. Marquee → references/techniques/fast.md

Moved to [its card](techniques/fast.md#marquee).

---

## 9. Additive blends on a dark ground → references/techniques/fast.md

Moved to [its card](techniques/fast.md#additive-blends-on-a-dark-ground).

---

## 10. Scroll-linked → references/techniques/fast.md

Moved to [its card](techniques/fast.md#scroll-linked).

---

## 11. Sticky narrative → references/techniques/fast.md

Moved to [its card](techniques/fast.md#sticky-narrative).

---

## 12. Counters that mean something → references/techniques/fast.md

Moved to [its card](techniques/fast.md#counters-that-mean-something).

---

## 13. Text that performs its sentence → references/techniques/fast.md

Moved to [its card](techniques/fast.md#text-that-performs-its-sentence).

---

## 14. The reduced-motion contract

WCAG 2.3.3 (Animation from Interactions). Vestibular reactions include
dizziness, migraine and nausea; the W3C notes users may need bed rest to
recover. Parallax is named explicitly as a trigger. 19 of 28 measured sites
handle this — Metabase with 27 separate rule blocks, Atlan 14.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

The blanket rule is the floor, not the ceiling. It stops motion but leaves
anything that *starts* at `opacity: 0` invisible forever. Every element with
an entrance must also be given its resting state:

```css
@media (prefers-reduced-motion: reduce) {
  .reveal, .animate-rise, .dot-grid i { opacity: 1 !important; transform: none !important; }
}
```

In React, branch on it rather than relying on CSS alone — `useReducedMotion()`
in Motion, or `matchMedia("(prefers-reduced-motion: reduce)")`. Linear ships
`use-reduced-motion` in its bundle; so should you.

A canvas follows the same contract. `templates/canvas-loop.js` draws the
poster (one still frame) once under `reduce` and never calls the draw
function, and does the same when `window.__DF_EXPORT__ === true`; it also
stops drawing off screen and in a hidden tab, and shows the fallback when
the context is missing or lost. `check-motion.mjs` fails a canvas that keeps
changing under `reduce`.

---

## 15. Assets in motion: icons and images are part of the choreography

In `motion` and `both` modes, the motion plan **must include the project's
assets**: the icon set always, since icons are mandatory
(`icons-and-assets.md`), and the images when the author approved them
(`images.md`). A page where the type and layout move but the icons and
photographs sit dead looks unfinished. The opposite failure is worse: a
stock Ken Burns zoom on every photo is decoration, not identity.

Choose the asset motion during research, the same way as the identity.
What does this subject's world do with its images and symbols? A newsletter
stamps; a lab diagram draws itself; a darkroom print develops; a shop sign
flips. Then pick from the moves below the one or two that say it. Each move
must answer "what does this restate?", like §13.

### Icons: state, not decoration

Icons move when **their meaning changes**. They never loop for attention.

```css
/* Draw-on: a check that is written, not faded. Lucide/Phosphor paths are strokes. */
.icon-draw path {
  stroke-dasharray: var(--len, 24);
  stroke-dashoffset: var(--len, 24);
  transition: stroke-dashoffset 420ms var(--ease-weighted);
}
.is-done .icon-draw path { stroke-dashoffset: 0; }

/* Morph between two states of one control (menu ↔ close, play ↔ pause):
   cross-fade two glyphs from the SAME set, rotated through the change. */
.icon-swap { display: grid; }
.icon-swap > svg { grid-area: 1 / 1; transition: opacity 180ms, transform 240ms var(--ease-weighted); }
.icon-swap > svg:last-child { opacity: 0; transform: rotate(-45deg) scale(.8); }
.is-open .icon-swap > svg:first-child { opacity: 0; transform: rotate(45deg) scale(.8); }
.is-open .icon-swap > svg:last-child  { opacity: 1; transform: none; }
```

```js
// Measure real path lengths once so the draw-on is exact for every glyph.
document.querySelectorAll('.icon-draw path').forEach((p) =>
  p.style.setProperty('--len', Math.ceil(p.getTotalLength())));
```

Good uses: a status icon drawing on when an order is confirmed, a nav icon
morphing on open, a stamp icon pressing in (`scale(1.15) → 1` with the
signature curve) when a state changes. Bad uses: bouncing arrows, spinning
decorative glyphs, an icon per feature that wiggles on scroll.

### Images: reveal through the identity's own device

Moved to the card [Image reveal through the identity's device](techniques/fast.md#image-reveal-through-the-identitys-device).
Its reduced-motion rule is added to the resting-state rule in §14 together
with the icon rule below.

```css
@media (prefers-reduced-motion: reduce) {
  .icon-draw path { stroke-dashoffset: 0 !important; }
}
```

---

## 16. Scene changes in a scroll story: designed, animated, continuous

On a page that tells a story by scroll (the YOLO [Illustrated scroll story](techniques/yolo.md#illustrated-scroll-story),
a [Real-time 3D world](techniques/yolo.md#real-time-3d-world), a long
[Sticky narrative](techniques/fast.md#sticky-narrative)), the cuts are the
storytelling. The reference: santionispirits.com, whose Notturno
Experience goes from scene to scene through drawn cuts (an ink wipe, a
portal that fills the frame, smoke of hatching) and never a fade, while the
camera keeps moving (`yolo-references.md`). Two failures this section is
written against, both seen in a build that passed every gate: transitions
that were a static zoom on a frozen picture and a hard swap at the half,
and a camera that eased into a full stop at every keyframe, so the episode
played as a slideshow with pauses.

**1. A transition list beside the scene list.** Every scene change gets one
designed cut, chosen for what the beat means, and the list says why:

| Cut | What happens | Use it when |
|---|---|---|
| Match cut on a shape | the last shape of one scene grows, turns and becomes the first shape of the next (a pencil stroke becomes a crack in the sky) | the two scenes are the same thing in two forms |
| Push through an object | the camera flies into a lens, a hole or a portal and comes out of it into the next scene | the next scene is inside, or beyond, the object |
| Ink wipe | a ragged blot grows from the scene's light or its subject and the next scene is inside it | something floods or takes over |
| Panel break | the frame cracks into panels that fly apart, each carrying a piece of the aftermath | an impact; the story breaks |
| Page turn | the page lifts and turns over onto the next scene | a decision; the story turns |
| Reveal | fog, smoke or darkness opens on what was hidden | a discovery |
| Pixel-block cut | the outgoing frame breaks into a grid of blocks that clear in a random order onto the next | a digital, screen or game world; a reset |

A fade between two pictures is not on the list. A cut used twice in a row
needs a reason.

The pixel-block cut is the one cut on the list that needs no drawing: a grid
of blocks in the outgoing section's colour over the incoming one, each block
cleared after its own random delay, in two steps so it reads as pixels and
not as a dissolve. It was read on four template pages of the 2026-11-07
catalogue and built in `docs/examples/motion-techniques/dom-recipes/page.html`:

```css
.blocks { position: absolute; inset: 0; display: grid; grid-template-columns: repeat(16, 1fr); grid-template-rows: repeat(8, 1fr); pointer-events: none; }
.blocks i { background: var(--paper); transition: opacity 0.18s steps(2, end), scale 0.18s steps(2, end); transition-delay: calc(var(--d) * 700ms); }
.cut.open .blocks i { opacity: 0; scale: 0.6; }
@media (prefers-reduced-motion: reduce) { .blocks i { transition: none; } }
```

```js
blocks.innerHTML = Array.from({ length: 128 }, () => `<i style="--d:${Math.random().toFixed(3)}"></i>`).join('');
// .open is added once, when the section is half on screen (an IntersectionObserver with threshold 0.5)
```

The blocks are made by the script, so without it there are none and the
section shows at once. Bound to the scroll instead (`--p` from
`dfStory.progress` against each block's delay) it plays backwards too, as
the other cuts do in a story.

**2. Continuous through the cut.** A cut is a span of the scroll, not a
point, and inside it both scenes are rendered and moving:

- the outgoing camera keeps its speed into the cut, and the incoming
  camera starts at that speed, not at rest;
- the characters and the ambient motion (fog, water, particles) keep moving
  in both scenes for the whole span;
- the outgoing and incoming scenes overlap in motion: no frame where one
  has stopped and the other has not started, no black hold, no zoom into a
  frozen frame;
- inside a scene the camera passes through its keys on one smooth curve; it
  does not ease out and back in at each one.

**3. Scroll is time, with eased velocity.** Map the scroll to one position
on the episode's timeline, and let the rendered position follow it with a
critically damped spring, so it eases but does not stop while the reader
scrolls. Pass the camera through its keys on a Catmull-Rom curve instead of
easing every segment.

```js
// One timeline for the whole episode: scroll sets the target, a damped spring carries the rendered time.
const story = document.querySelector('[data-story]');
let target = 0, time = 0, speed = 0;
const toTime = () => {
  const r = story.getBoundingClientRect();
  return Math.max(0, Math.min(1, -r.top / Math.max(1, r.height - innerHeight)));
};
addEventListener('scroll', () => { target = toTime(); }, { passive: true });

// Catmull-Rom through the keys: the camera passes each key without stopping on it.
function along(keys, t) {             // keys: [[t, value], ...] sorted by t, at least two
  let i = keys.findIndex((k) => k[0] > t);
  if (i === -1) return keys[keys.length - 1][1];
  if (i === 0) return keys[0][1];
  const k = (j) => keys[Math.max(0, Math.min(keys.length - 1, j))];
  const [t1, p1] = k(i - 1), [t2, p2] = k(i), p0 = k(i - 2)[1], p3 = k(i + 1)[1];
  const u = (t - t1) / (t2 - t1), u2 = u * u, u3 = u2 * u;
  return 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 + (-p0 + 3 * p1 - 3 * p2 + p3) * u3);
}

// Each cut owns a span [a, b] of the timeline; inside it both scenes draw, and the cut's own progress drives
// the mask (the blot, the shards, the fold), never a switch at the half.
function frame(dt) {
  const k = 60, d = 2 * Math.sqrt(k);  // stiffness and critical damping: no overshoot, no stop
  speed += (k * (target - time) - d * speed) * dt; time += speed * dt;
  for (const cut of cuts) {
    if (time < cut.a || time > cut.b) continue;
    const p = (time - cut.a) / (cut.b - cut.a);
    cut.from.draw(time);              // both scenes keep their own motion through the span
    cut.to.draw(time);
    cut.composite(p);                 // the designed transition, as a mask over the two renders
    return;
  }
  sceneAt(time).draw(time);
}
```

With `prefers-reduced-motion: reduce` none of this runs: each scene is its
resting still with its text in flow (§14). GSAP's ScrollTrigger with a
numeric `scrub` gives the same eased follow; so does Motion's `scroll()`
(motion.dev, MIT) fed into a spring.

**4. Characters that move through the cut.** A drawn character can hold a
pose; it cannot turn or walk through a cut without an animator's frames.
For fluid movement, the characters are 3D: an anatomical base mesh with a
rig and IK poses (`drawn-assets.md` §6), toon and ink shaded with a Line Art
contour so they carry the world's line, rendered in Blender 5.2 as image
sequences or drawn live in three.js, and composited into the drawn or
generated ink world. The key art stays for the sets and the close-ups; the
3D figures are what moves continuously across a cut. A figure that reads as
a mannequin beside the drawn sets goes back to modelling and shading; it
does not go on the page.

**5. The review watches the recording.** Record the page with
`scripts/capture-motion.mjs` and read `stalls` in `capture.json`: input
that moved nothing before the page moved again. On a scroll story every
stall is a finding unless it is a hold the visitor performs. Then look at
each cut on the contact sheets, three frames in: both scenes in motion, the
mask advancing, nothing frozen. Rebuild after every change to the camera or
the cuts and record again: a fix to one cut can stop the next one.

---

## The grammar of a drawn scroll story (§17–§26)

The sections below are the parts of santionispirits.com's Notturno Experience
(`yolo-references.md`, wheel-recorded 2026-11-05 and narrated by the author)
that a drawn story needs beyond its cuts (§16), each with working code. The
runtime pieces are one file, `templates/scroll-story.js` (`dfStory`), tested
in `test/scroll-story.test.mjs`: it has no dependencies and works beside GSAP
or Motion. Where a section uses GSAP, the patterns come from GreenSock's own
skills (`greensock/gsap-skills`, MIT); the timing figures come from
`dylantarre/animation-principles` (MIT); both are credited in the README. The
GSAP library itself is free for commercial use under GreenSock's own standard
licence, not MIT: read it before shipping (`gsap.com/standard-license`).

All of it is bound to the scroll and reversible: scrolling back plays every
move backwards, and nothing fires once and stays. Under reduced motion none
of it runs (§26).

---

## 17. Every background element is its own layer

In the reference no picture is flat. The sky, the far hills, the near rocks,
the clouds, the character and the floor are separate planes, and each one
answers the pointer by its depth: the near plane moves most, the far plane
hardly at all, so the drawn world has thickness. Each plane also keeps a small
motion of its own (cloud drift, a cloth edge, the floor texture sliding), so a
scene never freezes even when the reader stops scrolling: a moving hold, not a
dead stop.

- **Split every set into planes** when it is drawn or generated: the ink pass
  writes the figure and background planes (`drawn-assets.md` §8); a set gets
  three to six planes, each with a `data-depth` from 0 (fixed) to 1 (nearest).
- **Pointer by depth, damped.** Displacement = depth x strength, eased with a
  damping that does not depend on the frame rate (`1 - exp(-λ·dt)`), never a
  fixed lerp per frame. Strength 16 to 32 px at depth 1 on a 1440 px screen;
  vertical moves at about 60 % of horizontal.
- **Scroll by depth** through `--p`, the section's progress that
  `dfStory.progress` writes: far planes travel less of the scroll than near
  ones.
- **Ambient drift** of 10 to 20 % of the pointer amplitude, each plane out of
  phase with the next (a 120° offset reads as alive, not as one block
  swaying).
- **Overlap the planes,** and keep their edges from lining up: an edge of the
  near plane that sits exactly on an edge of the far one flattens the depth.

```html
<div class="stage" data-stage>
  <img data-depth="0"   style="--d:0"   src="sky.webp" alt="">
  <img data-depth="0.2" style="--d:0.2" src="hills.webp" alt="">
  <img data-depth="0.5" style="--d:0.5" src="rocks.webp" alt="">
  <img data-depth="0.8" style="--d:0.8" src="monk.webp" alt="A hooded monk crosses the plain">
  <img data-depth="1"   style="--d:1"   src="grass.webp" alt="">
</div>
<script src="scroll-story.js"></script>
<script>dfStory.parallax(document.querySelector('[data-stage]'), { strength: 24, lambda: 6, drift: 0.15 });</script>
```

```css
.stage { position: relative; overflow: clip; height: 100svh; }
.stage > [data-depth] {
  position: absolute; inset: -4%; width: 108%; height: 108%; object-fit: cover; will-change: transform;
  /* The scroll depth goes on `translate`, the pointer (written by the script) on `transform`: the two compose. */
  translate: 0 calc((1 - var(--p, 0)) * var(--d) * -12vh);
}
```

With GSAP the same rig is one `gsap.quickTo` per plane and axis: it reuses a
single tween instead of making one per pointer event.

```js
const planes = [...stage.querySelectorAll('[data-depth]')].map((el) => ({
  d: +el.dataset.depth,
  x: gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3' }),
  y: gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3' }),
}));
addEventListener('pointermove', (e) => {
  const px = e.clientX / innerWidth * 2 - 1, py = e.clientY / innerHeight * 2 - 1;
  for (const p of planes) { p.x(px * p.d * 24); p.y(py * p.d * 14); }
});
```

The loop runs only while the stage is on screen and the tab is visible
(`dfStory.parallax` does both). The `motion-sickness` advice to remove
multi-layer parallax is met by §26, not by flattening the experience: under
reduced motion the planes stand still.

---

## 18. One element across two scenes

The cuts the author singled out in the reference are the ones where something
in the outgoing scene **becomes** something in the incoming one: the edge of
the title card's cloud becomes the ground of the first set; a table becomes a
pillar of the colonnade; approaching the portal, the ground falls away and
backwards while the portal rises, with its own surge, like water. The reader
never loses their place because one shape carries them across.

- **Name the carrier in the beat table:** for every cut, the shape that
  survives it, and what it is on each side (`illustration-concept.md` §1).
- **One element, two roles.** The carrier is one element (or one plane)
  that lives above both scenes for the length of the cut, and is animated
  from its first role to its second while the sets change around it. It is
  not two pictures cross-faded.
- **Opposite motion makes the move:** the outgoing ground recedes and
  drops while the carrier rises; the eye follows what moves against the rest.
- **Shape before detail.** Match the silhouette first (the table top and the
  pillar capital share a width), then let the detail change inside it.

The whole span is one scroll-scrubbed timeline, so it plays backwards when
the reader scrolls back:

```js
gsap.registerPlugin(ScrollTrigger);
const cut = gsap.timeline({
  scrollTrigger: { trigger: '#cut-table-pillar', start: 'top top', end: '+=150%', scrub: 1, pin: true },
});
cut.addLabel('carry')
   .to('#hall .floor',   { yPercent: 30, scale: 0.85, ease: 'none' }, 'carry')        // the old ground recedes
   .to('#carrier',       { yPercent: -60, scaleY: 3.2, ease: 'power1.in' }, 'carry')  // the table rises into a pillar
   .to('#carrier .top',  { autoAlpha: 0 }, 'carry+=0.3')                              // its detail changes inside the shape
   .from('#colonnade',   { yPercent: 20, autoAlpha: 0, ease: 'none' }, 'carry+=0.2'); // the new set arrives around it
```

Animate the pinned section's children, never the pinned element itself, and
build the triggers top to bottom. When the carrier also changes its place in
the DOM (a card that becomes the header of the next view), GSAP's Flip
records its state before the change and animates from it (`Flip.getState`,
then `Flip.from(state, { absolute: true })`); for a drawn outline that turns
into another drawn outline, MorphSVG morphs one path into the other. Without
a library, the carrier reads `--p` from `dfStory.progress` and the CSS does
the rest:

```css
#carrier { transform: translateY(calc(var(--p) * -60%)) scaleY(calc(1 + var(--p) * 2.2)); transform-origin: 50% 100%; }
```

**A 3D carrier.** When the carrier must turn while it travels (a product that
shows a new face in each section), it is drawn in one canvas fixed behind the
page, and each section keeps an empty slot in its layout where it comes to
rest: the scroll picks the two slots it is between, their centres are
unprojected into the scene, and a frame-rate independent damping follows the
mixed pose. It lifts towards the viewer in the middle of the move, which is
the opposite motion this section asks for. The recipe, measured, is the High
card [Object that travels between sections](techniques/high.md#object-that-travels-between-sections);
with a modelled product of several megabytes it belongs to the
[Real-time 3D world](techniques/yolo.md#real-time-3d-world).

---

## 19. The ink-out: a cut that carries depth

The cut the author asked to keep for future work: at the end of the red
portal scene, ink rises from the bottom of the frame in vertical etched
strokes, thick clumps in front and thinner hatching behind, until the frame is
black, and then thins out again onto the next scene. It is not a wipe across a
flat picture: the ink comes in planes, the nearest leading and darkest, so the
cut has the same depth as the sets. The author's caveat stands: it suits an
etched or inked world; a cleaner, more commercial identity needs a cleaner cut
from the §16 list, and the beat table says which.

The mechanism is a threshold on a texture, the same idea as a shader
dissolve (discard the pixels whose noise is under the progress, colour a
narrow band at the edge): here the "noise" is a hatching field biased to rise
from the bottom, sampled in several planes at different scales and offsets.

```html
<canvas class="ink" data-ink aria-hidden="true"></canvas>
<script>
  const ink = dfStory.ink(document.querySelector('[data-ink]'), { color: '#141019', planes: 3, lag: 0.12 });
  let px = 0;
  addEventListener('pointermove', (e) => { px = e.clientX / innerWidth * 2 - 1; }, { passive: true });
  // p runs 0 → 1 over the first half of the cut (ink in) and 1 → 0 over the second (ink out onto the next set).
  dfStory.progress(document.querySelector('#cut-portal-hall'), {
    onUpdate: (t) => ink.draw(t < 0.5 ? t * 2 : (1 - t) * 2, px),
  });
</script>
```

```css
.ink { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 5; }
```

The scene under the ink swaps at the moment of full cover, so the reader
never sees a hard change. In a WebGL stage the same cut is a full-screen
plane whose fragment shader discards below the level:

```glsl
uniform float progress;      // 0..1 from the scroll
uniform sampler2D hatch;     // the hatching field, data (no colour space)
uniform vec3 ink;
varying vec2 vUv;
void main() {
  float field = 0.6 * vUv.y + 0.4 * texture2D(hatch, vUv).r;   // rises from the bottom
  if (field >= progress * 1.6) discard;
  gl_FragColor = vec4(ink, 1.0);
}
```

One plane per depth, each with its own `progress` lag and a slightly larger
scale toward the camera. Keep the hatching field as a texture made once
(`dfStory.hatchField`, or a drawn sheet run through `ink-pass.mjs`), never
re-generated per frame.

---

## 20. The focus field

When the story wants the reader to look at one thing (the three bottles, the
glass, the hand), the reference puts a flat block of one colour behind it: a
big red square, the subject standing in front of it, the hatching around it
quiet. That block is the **focus field**: an invisible concept in the brief
whose colour changes per project (it is usually the design hint,
`recipes-design.md` §2) and whose job is only to say "here". It counts toward
the hint's places.

- One focus field on screen at a time, behind one subject.
- It is flat: no gradient, no texture, no glow. The drawing around it carries
  the texture.
- It arrives with the subject, scrubbed by the scroll (it grows from the
  subject's centre or slides in under it), and leaves with it.

```html
<figure class="focus" style="--focus: var(--hint)">
  <span class="focus__field" aria-hidden="true"></span>
  <img src="bottles.webp" alt="Three bottles on a stone pedestal: blue, green and yellow">
</figure>
```

```css
.focus { position: relative; display: grid; place-items: center; }
.focus__field {
  position: absolute; inset: 12% 18%; background: var(--focus);
  transform: scale(calc(0.2 + 0.8 * var(--p, 1))); transform-origin: 50% 60%;
}
.focus > img { position: relative; translate: 0 calc((1 - var(--p, 1)) * 8vh); }
```

---

## 21. Captions and type that assemble

The reference sets almost no paragraphs. Its type does three things:

- **Small caption transitions.** Each boxed caption (a short line of
  narration in a thin rule box) enters on its own, a short move of 12 to 24 px
  with a clip from one edge, and leaves before the next one comes. Captions are
  HTML, never letters in the art, so they are read, translated and found.
- **Assembly by tracking.** The title cards ("THE NOTTURNO EXPERIENCE",
  "INDULGE NOW / ATONE LATER") gather from very wide tracking to their set
  tracking as the scroll arrives, the letters fading up as they close; they
  spread again on the way out.
- **Type that breaks** with the scene: the last word splits round the
  subject, or the product stands between the letters (§23).

Tracking driven by `--p`, so it is scrubbed and reversible:

```css
.assemble {
  --from: 0.9em; --to: -0.02em;
  letter-spacing: calc(var(--to) + (1 - var(--p, 1)) * var(--from));
  opacity: calc(0.25 + 0.75 * var(--p, 1));
  white-space: nowrap; font-kerning: none;   /* kerning shifts while the spacing animates; turn it off for the move */
}
.caption { clip-path: inset(0 calc((1 - var(--p, 1)) * 100%) 0 0); translate: 0 calc((1 - var(--p, 1)) * 16px); }
```

Letter by letter, with GSAP's SplitText (free since GSAP became part of
Webflow; split after the fonts have loaded, words and characters together so
lines do not reflow):

```js
await document.fonts.ready;
const split = SplitText.create('.title-card', { type: 'words, chars', aria: 'auto' });
gsap.timeline({ scrollTrigger: { trigger: '.title-card', start: 'top 70%', end: 'top 20%', scrub: 1 } })
  .from(split.chars, { autoAlpha: 0, x: (i) => (i - split.chars.length / 2) * 14, stagger: { amount: 0.4, from: 'center' } });
```

A stagger across a title stays under 500 ms in total when it is time-based
(not scrubbed); five items or more in a time-based stagger wait for the reader.

---

## 22. Beats the reader performs

"HOLD & REACH", "HOLD & POUR", "HOLD": the reader presses and holds a button
and the story advances while they hold; the hand reaches, the liquid pours,
the background answers. `dfStory.hold` is the control:

```html
<button class="hold" type="button" data-hold aria-describedby="hold-help">
  <span class="hold__ring" aria-hidden="true"></span> Hold &amp; pour
</button>
<p id="hold-help" class="visually-hidden">Press and hold, or keep scrolling.</p>
<script>
  const pour = gsap.timeline({ paused: true }).to('#liquid', { scaleY: 1, ease: 'none' }).to('#glass-glow', { autoAlpha: 1 }, '<0.6');
  const beat = dfStory.hold(document.querySelector('[data-hold]'), {
    duration: 1400,
    onProgress: (p) => pour.progress(p),           // the pour follows the hold, backwards too when released
    onDone: () => document.querySelector('#pour').classList.add('is-poured'),
  });
  ScrollTrigger.create({ trigger: '#pour', start: 'bottom top', onLeave: () => beat.complete() }); // scrolling past completes it
</script>
```

```css
.hold__ring { background: conic-gradient(var(--hint) calc(var(--hold) * 1turn), transparent 0); border-radius: 50%; }
```

- **Never a lock.** A tap advances the beat a little, Space or Enter held
  does what the pointer does, and scrolling past completes it. Under reduced
  motion one press completes it: a timed gesture is not owed by anyone.
- **The press answers in under 100 ms** (scale to 0.97 on press), and the
  release falls back gently rather than snapping.
- **Hold time 1 to 2 s.** Shorter is a click; longer is a chore.
- The background keeps moving during the hold (§17): the hold is a beat, not
  a pause.

---

## 23. The footer is the last scene

The reference does not end on a link list. Its ending is a sequence, still
scrubbed by the scroll:

1. an ink-out (§19) from the last story set onto the product's colour;
2. the closing line set huge, and the product rendered in 3D standing **in
   front of** the card and **between the letters** of the flavour's name, so
   the type sits in depth with the object;
3. a white sheet that rises over the colour, carrying the next line;
4. a carousel of the products (arrows, one at a time, each with its copy);
5. a button that restarts the experience from the top, the title card
   assembling again.

Type and object in depth, without a 3D engine: the word is split into two
copies, one behind the product and one in front, and the front copy is
clipped so only the letters that pass in front of the object show.

```html
<section class="finale">
  <h2 class="finale__word" aria-label="Marshmallow coffee and cream">
    <span class="back" aria-hidden="true">MARSHMALLOW COFFEE &amp; CREAM</span>
    <img class="finale__bottle" src="bottle.webp" alt="">
    <span class="front" aria-hidden="true">MARSHMALLOW COFFEE &amp; CREAM</span>
  </h2>
  <div class="finale__sheet">…</div>
  <button type="button" data-restart>Begin again</button>
</section>
```

```css
.finale__word { display: grid; place-items: center; }
.finale__word > * { grid-area: 1 / 1; }
.finale__bottle { z-index: 1; translate: 0 calc((1 - var(--p, 1)) * 30vh); }
.front { z-index: 2; clip-path: polygon(0 0, 100% 0, 100% 34%, 0 34%, 0 70%, 100% 70%, 100% 100%, 0 100%); }  /* the middle line passes behind */
.finale__sheet { translate: 0 calc((1 - var(--p, 1)) * 100%); background: var(--paper); }
```

```js
document.querySelector('[data-restart]').addEventListener('click', () => {
  scrollTo({ top: 0, behavior: dfStory.reduced() ? 'auto' : 'smooth' });  // every scene is scroll-bound, so it replays
  document.querySelector('#title').focus({ preventScroll: true });
});
```

Because every scene is bound to the scroll, restarting is scrolling to the
top: nothing has to be reset by hand. The carousel is a real list of links
or buttons that works without scripts; its arrows are buttons with names.

---

## 24. Preload everything, honestly

A cut that stutters breaks the camera (§16). The reference loads the whole
experience up front behind its loader so no cut waits on the network, the
image decoder or the GPU. Loading is three jobs, and the progress figure
covers all three:

1. **Fetch and decode** every image of the story (`img.decode()`, so the first
   draw does not decode it on the main thread);
2. **Upload** each one to the GPU when the stage is WebGL
   (`renderer.initTexture(texture)`, so the first frame that shows it does
   not stall);
3. **Compile** the shaders (`await renderer.compileAsync(scene, camera)`,
   which uses parallel shader compilation where the browser has it; the
   synchronous `compile` returns at once and the first render still waits).

```js
const bar = document.querySelector('[data-load] progress');
const textures = new Map();
const { failed } = await dfStory.preload(storyImages.map((src) => ({ src, weight: 1 })), {
  onProgress: (p) => { bar.value = p; bar.textContent = `${Math.round(p * 100)} %`; },
  upload: async (img, item) => {
    const t = new THREE.Texture(img); t.colorSpace = THREE.SRGBColorSpace; t.needsUpdate = true;
    renderer.initTexture(t); textures.set(item.src, t);   // the scene uses these same textures later
  },
  compile: () => renderer.compileAsync(scene, camera),
});
if (failed.length) console.warn('not loaded', failed);
document.documentElement.dataset.ready = '';
```

- **Honest:** the figure moves only when work is done, never backwards, and
  reaches 100 % only after the compile. three.js's `LoadingManager` reports per
  file, not per byte, so weight the files by size if they differ a lot.
- **Text is not behind the loader.** The story's text and the first panel are
  in the HTML and readable while the rest loads (`techniques/yolo.md`, the
  Floor). The loader covers the stage, not the page.
- **Sound is not in the preload.** It loads after the reader turns it on.
- **Changing a material later recompiles it:** switching `transparent`,
  `side` or a map, or adding a light, builds a new program at the worst
  moment. Toggle lights by intensity and create every material variant before
  the compile.
- The tier message states the first-view weight: with everything preloaded,
  it is the whole experience.

---

## 25. Water, smoke and sparks are drawn, frame by frame

In the reference the liquid, the smoke and the sparks are drawings: a few
hand-drawn frames played in a loop, in the same hatching as the set, layered
in front of and behind the figure. They are not particle systems or fluid
shaders: a shader effect is the one thing that would break the etched world.

- **Draw them as frames,** 6 to 12 per cycle, played on twos (12 frames a
  second): the stepped motion is part of the look. Effects are drawn straight
  ahead (frame after frame), not in-betweened.
- **Loop seamlessly:** the last frame leads into the first. Repeat a frame
  as a hold where the motion should breathe.
- **Layer them:** a back layer behind the figure, a front layer over it, each
  its own flipbook, out of phase.
- **Make them** in Grease Pencil and render them as transparent PNGs
  (`drawn-assets.md` §10), then tile the frames into one sheet:
  `ffmpeg -i fx_%04d.png -vf "tile=4x3" -frames:v 1 fx-sheet.png`.

```html
<div class="fx fx--back" data-fx style="background-image:url(pour-back.png)" aria-hidden="true"></div>
<script>
  document.querySelectorAll('[data-fx]').forEach((el, i) =>
    dfStory.flipbook(el, { frames: 12, cols: 4, fps: 12, poster: (i * 3) % 12 }));
</script>
```

`dfStory.flipbook` keeps its time when the browser drops frames, stops off
screen and in a hidden tab, and shows the poster frame under reduced motion.

---

## 26. Reduced motion for the whole story

§14 is the contract; a drawn story adds what a page of reveals does not
have. Under `prefers-reduced-motion: reduce`:

- **The planes stand still** (§17): no pointer parallax, no drift, no scroll
  depth. `dfStory.parallax` does not start.
- **Every scene is its resting still,** in order, with its text in flow; the
  scroll moves the page, not a camera. `--p` is 1 everywhere, so every
  `--p`-driven style shows its finished state.
- **Cuts are instant,** never slowed down: a motion between 150 and 400 ms is
  the range most likely to trigger symptoms, so a reduced cut is a swap (the
  ink at 0 or 1), not a short fade.
- **Holds complete on one press** (§22); flipbooks show their poster (§25).
- **The restart scrolls without smoothing** (§23).
- Nothing flashes more than three times a second, in any mode.

```css
@media (prefers-reduced-motion: reduce) {
  [data-depth] { transform: none !important; translate: none !important; }
  .stage { height: auto; }                     /* the planes stack as one still picture */
  .ink { display: none; }
}
```

```js
const mm = gsap.matchMedia();
mm.add({ motion: '(prefers-reduced-motion: no-preference)' }, () => {
  buildStoryTimelines();          // every ScrollTrigger made here is reverted when the setting changes
});
```

`check-motion --tier yolo` fails a stage that still moves under reduced
motion.

---

## 27. Smooth scroll, and the native scroll under it

Nearly every scroll-driven page of the template catalogue read on
2026-11-07 sits on Lenis (darkroomengineering/lenis, MIT, about 4 KB
compressed): the wheel's steps are eased into one glide, which makes a scrub,
a morph or a camera path read as continuous. It is worth its weight only
under one of those. On a page of text and reveals it is a preference imposed
on every visitor's wheel, so the default is the browser's own scroll.

Lenis keeps the document's real scroll position and only eases how it gets
there, so anchors, the keyboard, find-in-page, `position: sticky` and CSS
scroll timelines keep working. Keep it that way:

- **Not under reduced motion.** Do not create it at all; the page then has
  the native scroll, which is what the visitor asked for (§14).
- **Native scroll is the source of truth.** Read positions from
  `scrollY` or the section's rectangle, never from wheel deltas summed into a
  story position (`build-threejs-scroll-worlds`, Meng To, MIT). A scrubbed
  timeline then works the same with or without the library.
- **One clock.** With GSAP, drive Lenis from GSAP's ticker and tell
  ScrollTrigger on every Lenis scroll; without GSAP, one `requestAnimationFrame`
  loop. Never both.
- **Refresh after layout changes:** fonts, images and late sections move the
  triggers; call `ScrollTrigger.refresh()` after load.
- **No trapped wheel:** never `preventDefault` the wheel to build your own
  scroll, never a fake scrollbar, and nothing nested inside that scrolls on
  its own unless it opts out (`data-lenis-prevent`).

```html
<script src="https://cdn.jsdelivr.net/npm/lenis@1.1.13/dist/lenis.min.js"></script>
<script>
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches && window.Lenis) {
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    // Without GSAP: one loop.
    const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    // With GSAP ScrollTrigger instead of the loop above (the cinematic-gsap-lenis-motion-system skill, Meng To, MIT):
    //   lenis.on('scroll', ScrollTrigger.update);
    //   gsap.ticker.add((time) => lenis.raf(time * 1000));
    //   gsap.ticker.lagSmoothing(0);
  }
</script>
```

If the script fails to load, the `if` is false and the page scrolls natively;
nothing else on the page may depend on Lenis existing. Pin the version you
tested. Built and checked in `docs/examples/motion-techniques/dom-recipes/page.html`:
the page passes `check-motion --tier fast` with Lenis on it, because the
content does not need it, and the wheel recording reached the end with no
stalls.

---

## Checklist before calling motion done

- [ ] One signature curve, named, used for ~80% of transitions
- [ ] An ambient layer exists (§2) — a page with only entrance animations is flat
- [ ] Masks / blends / clips used somewhere (§3–9); zero means flat
- [ ] Entrances are scroll-*triggered*, not scroll-*linked*, unless bound to position on purpose
- [ ] Every entrance has a defined resting state under reduced motion
- [ ] Nothing important is gated behind a scroll the user may not perform
- [ ] Total stagger for any group under 500ms
- [ ] `tabular-nums` on any animating figure
- [ ] The motion plan includes the icons, and the images when approved (§15); each move restates something from the identity
- [ ] Image reveals play once, after decode, animating only transform, opacity, filter, clip-path or mask
- [ ] In a scroll story, every scene change is a designed cut from the transition list, both scenes move through it, and the recording shows no stall (§16)
- [ ] In a drawn story, every set is split into depth planes that answer the pointer and keep a moving hold (§17); each cut names the element it carries across (§18); the focus field, the captions and the title cards are bound to the scroll and play backwards (§20, §21)
- [ ] Every hold beat can be tapped, held from the keyboard or scrolled past (§22); the ending is a scene with a restart (§23)
- [ ] Images are decoded, uploaded and the shaders compiled before the first cut, behind a progress figure that tells the truth, with the text readable meanwhile (§24)
- [ ] Liquids, smoke and sparks are drawn frame loops on twos, not shader effects (§25); under reduced motion the whole story is its stills (§26)
- [ ] Smooth scroll only where a scrub needs it, never under reduced motion, and the page works the same without it (§27)
- [ ] **The rendered page has been looked at** — see `verification.md`
