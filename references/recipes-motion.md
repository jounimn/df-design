# Motion recipes

Working implementations, each traced to a site that ships it. Every value
here was read off a production page — see `benchmarks.md` for the method.
The techniques themselves are cards, one file per tier: [fast](techniques/fast.md) (23 cards),
[medium](techniques/medium.md) (4), [high](techniques/high.md) (7) and [yolo](techniques/yolo.md) (6). Open the file of the tier the
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

A fade between two pictures is not on the list. A cut used twice in a row
needs a reason.

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
- [ ] **The rendered page has been looked at** — see `verification.md`
