# Medium techniques

Medium expensive loading: a small amount of script, noticeable image weight or some GPU work. The tier is described in [audition.md §4](../audition.md#4-loading-cost-cheapest-viable-option-first); this file does not restate it. Every card here links its lighter version in [fast.md](fast.md), which is its fallback, or says why there is none.

| Technique | What the visitor sees | Suits |
|---|---|---|
| [Particles](#particles) | Dozens of points that drift and join with fine lines when they come close | Generative, data and AI brands |
| [ASCII art](#ascii-art) | A picture or a moving field built from letters and symbols | Developer tools, terminals and zines |
| [Halftone](#halftone) | A picture or field built from printed-looking dots that follow its tone | Print, music and campaign brands |
| [Glassmorphism](#glassmorphism) | A row of frosted panels over colour that moves behind them | OS-like products and dashboards over moving imagery |
| [Cursor-painted reveal](#cursor-painted-reveal) | A picture that turns into another wherever the pointer has just been | Portrait and product heroes with two states |
| [Glass over moving light](#glass-over-moving-light) | Reeded or beaded glass bending light that moves behind it | Architecture, interiors and light-led brands |
| [CSS 3D objects](#css-3d-objects) | A sphere of pictures turned by the scroll, then a drum the visitor walks into | Archives, collections and portfolios |
| [Stepped showcase](#stepped-showcase) | One product at a time, each step opening out of the last | Small ranges shown piece by piece |
| [Dither](#dither) | Fog printed in dots of one ink, cleared by a lamp under the pointer | Low-tech, retro-computer and newsprint brands |

## Particles

### What it is

Dozens of small points that drift across the screen and draw a fine line between any two that come near each other, so the field looks like a slowly changing constellation.

### Where it comes from

Particle systems were introduced in the 1982 film Star Trek II: The Wrath of Khan for the fictional Genesis effect, and in 1983 Reeves defined them as animated points used for sparks, rain, fire and similar phenomena ([Wikipedia, Particle system](https://en.wikipedia.org/wiki/Particle_system)).

### Suits

Brands that want a living field of data or computation behind the content: [Generative / creative-coding](../identities/digital.md#generative--creative-coding), [Data-viz-as-hero](../identities/digital.md#data-viz-as-hero), [AI lab](../identities/industry.md#ai-lab).

### What it costs the visitor

On one site (shopify.com/editions/spring2026, measured 2026-10-14) the page's motion code weighed 139 KB, which is the ceiling itself. The animated drawing sat far down the page and was not listed as visible, so only the weight counts, and whether it honours reduced motion was not checked ([benchmarks](../benchmarks.md#canvas-and-webgl-measured-2026-10-15)).

### Lighter version

The Fast version, [Particles](fast.md#particles), is the fallback: a few hand-placed points drifting in SVG, with no script. Use it when the page must work without JavaScript, or when the field does not need to link its points.

### For the builder

One drawing area, one loop. The points are a pure function of time (a seeded start and a constant speed), so the poster is the picture at time 0. The loop's clock counts from the page load, so the first moving frame is a few moments further on and is not the same picture as the poster. Copy `templates/canvas-loop.js` next to the page; the loop draws only while the area is on screen and the tab is visible, draws the poster once under reduced motion, and shows the fallback if the context is missing.

```html
<canvas id="particles" style="width:100%;height:100%;color:rgb(var(--ink))"></canvas>
<svg id="particles-fallback" hidden><!-- the SVG of the Fast card --></svg>
<script src="canvas-loop.js"></script>
```

```js
const canvas = document.getElementById('particles');
const px = (ctx) => { const s = canvas.width / canvas.clientWidth; ctx.setTransform(s, 0, 0, s, 0, 0); return [canvas.clientWidth, canvas.clientHeight]; };
// A seeded generator: frame 0 and the poster are the same picture on every visit.
const mulberry32 = (a) => () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const rand = mulberry32(7);
const pts = Array.from({ length: 80 }, () => ({ x: rand(), y: rand(), vx: (rand() - .5) * 4e-5, vy: (rand() - .5) * 4e-5, r: 1 + rand() * 1.5 }));
const wrap = (v) => ((v % 1) + 1) % 1;

function frame(ctx, t) {
  const [w, h] = px(ctx);
  ctx.clearRect(0, 0, w, h);
  const ink = getComputedStyle(canvas).color;          // the page's own colour, so dark mode follows
  const p = pts.map((q) => [wrap(q.x + q.vx * t) * w, wrap(q.y + q.vy * t) * h, q.r]);
  ctx.strokeStyle = ink; ctx.fillStyle = ink;
  for (let i = 0; i < p.length; i++) for (let j = i + 1; j < p.length; j++) {
    const d = Math.hypot(p[i][0] - p[j][0], p[i][1] - p[j][1]);
    if (d < 90) { ctx.globalAlpha = (1 - d / 90) * .35; ctx.beginPath(); ctx.moveTo(p[i][0], p[i][1]); ctx.lineTo(p[j][0], p[j][1]); ctx.stroke(); }
  }
  ctx.globalAlpha = .8;
  for (const [x, y, r] of p) { ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill(); }
  ctx.globalAlpha = 1;
}

dfCanvasLoop(canvas, {
  context: '2d',
  draw: (t, ctx) => frame(ctx, t),
  poster: (ctx) => frame(ctx, 0),
  fallback: '#particles-fallback',
});
```

The link test compares every pair of points, which is cheap for a few dozen and grows with the square of the count; past a few hundred, bucket the points into a grid or drop the lines.

- **Poster frame:** `frame(ctx, 0)`, drawn by the loop under reduced motion, in export and while the area is off screen.
- **Reduced motion:** the contract in `recipes-motion.md` §14; the loop draws the poster once and never calls `draw`.
- **Checks:** `node scripts/check-motion.mjs <page> --tier medium`: the drawing is alive, honours reduced motion, pauses off screen, and the page's motion code stays within the 139 KB Medium ceiling. Then look at the rendered page (`verification.md`, "Probe, do not squint").

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- shopify.com/editions/spring2026, probed 2026-10-14: motion code of the page 139 KB, one site. Its canvas sits far down the page and was not listed as visible, so only the weight counts; reduced motion, off-screen pausing and fallback were not measured.

## ASCII art

### What it is

A picture or a moving field made only of letters and symbols, where each character stands for a patch of light or dark.

### Where it comes from

Among the oldest known examples of ASCII art are the creations of the computer-art pioneer Kenneth Knowlton, from around 1966, at Bell Labs; the art grew in part because early printers lacked graphics, so characters were used in place of graphic marks ([Wikipedia, ASCII art](https://en.wikipedia.org/wiki/ASCII_art)).

### Suits

Developer tools, terminals and zines: [ASCII / text-mode art](../identities/digital.md#ascii--text-mode-art), [Terminal / CLI](../identities/digital.md#terminal--cli), [Monochrome mono-type dev sites](../identities/digital.md#monochrome-mono-type-dev-sites).

### What it costs the visitor

On one site (ghostty.org, measured 2026-10-14) the page's motion code weighed 0 KB. The effect there is built from page text, not from a drawing area, so the figure says little about the version that redraws the characters every frame ([benchmarks](../benchmarks.md#canvas-and-webgl-measured-2026-10-15)).

### Lighter version

No lighter version: choosing a character for each cell from a picture takes code that runs in the page, so there is no CSS-only form of it. The fallback is the poster frame, a block of text set at build time.

### For the builder

A grid of cells, one character per cell, picked from a ramp of characters from light to dark by a tone function. Measure the font's own advance instead of assuming a cell width, or the grid will not fill the box. The fallback is a `<pre>` holding the poster frame as plain text, which also reads as text to a screen reader.

```html
<canvas id="ascii" style="width:100%;height:100%;color:#9fe8c0" aria-hidden="true"></canvas>
<pre id="ascii-fallback" hidden><!-- frame 0, written out at build time --></pre>
<script src="canvas-loop.js"></script>
```

```js
const canvas = document.getElementById('ascii');
const px = (ctx) => { const s = canvas.width / canvas.clientWidth; ctx.setTransform(s, 0, 0, s, 0, 0); return [canvas.clientWidth, canvas.clientHeight]; };
const RAMP = ' .:-=+*#%@';                              // light to dark
const CELL_H = 15;
const tone = (i, j, t) => 0.5 + 0.5 * Math.sin(i * 0.28 + t * 0.0014) * Math.cos(j * 0.35 - t * 0.0011);   // swap in any 0..1 field

function frame(ctx, t) {
  const [w, h] = px(ctx);
  ctx.clearRect(0, 0, w, h);
  ctx.font = `${CELL_H - 2}px ui-monospace, Menlo, Consolas, monospace`;
  ctx.textBaseline = 'top';
  ctx.fillStyle = getComputedStyle(canvas).color;
  const cellW = ctx.measureText('M').width;             // the font's own advance, so the grid fills the width
  for (let j = 0; j * CELL_H < h; j++) {
    let row = '';
    for (let i = 0; i * cellW < w; i++) row += RAMP[Math.min(RAMP.length - 1, Math.floor(tone(i, j, t) * RAMP.length))];
    ctx.fillText(row, 0, j * CELL_H);                   // one draw per row, not per character
  }
}

dfCanvasLoop(canvas, {
  context: '2d',
  draw: (t, ctx) => frame(ctx, t),
  poster: (ctx) => frame(ctx, 0),
  fallback: '#ascii-fallback',
});
```

To turn a picture into characters, sample it once into a tiny offscreen drawing (one pixel per cell), read its luminance with `getImageData`, and return that as `tone`. A light-on-dark ramp reads best on a dark ground; invert the ramp on a light one.

- **Poster frame:** `frame(ctx, 0)`; the same text, written out at build time, is the `<pre>` fallback.
- **Reduced motion:** the contract in `recipes-motion.md` §14; the loop draws the poster once and never calls `draw`.
- **Checks:** `node scripts/check-motion.mjs <page> --tier medium`: the drawing is alive, honours reduced motion, pauses off screen, and the page's motion code stays within the 139 KB Medium ceiling. Then read the rendered text at the real size (`verification.md`, "Probe, do not squint").

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- ghostty.org, probed 2026-10-14: motion code of the page 0 KB, one site. The effect is page text with no canvas, so reduced motion, off-screen pausing and fallback were not measured.

## Halftone

### What it is

A field of dots that grow and shrink with the tone of a picture beneath them, laid out on a slanted grid like a printed plate.

### Where it comes from

William Fox Talbot is credited with the idea of halftone printing; the New York Daily Graphic published what is called the first newspaper reproduction of a photograph with a full range of tones on 4 March 1880, with a crude halftone screen ([Wikipedia, Halftone](https://en.wikipedia.org/wiki/Halftone)).

### Suits

Print, music and campaign brands: [Halftone / duotone](../identities/print-craft.md#halftone--duotone), [Risograph](../identities/print-craft.md#risograph), [Archival newsprint](../identities/print-craft.md#archival-newsprint).

### What it costs the visitor

On one site (a page on paper.design, measured 2026-10-14) the page's motion code weighed 7 KB ([benchmarks](../benchmarks.md#canvas-and-webgl-measured-2026-10-15)). Depending on the application this technique sits between Medium and High: a dot screen over a still picture, or one that moves gently, stays Medium; over video or a 3D scene, where the tone changes every frame, it is High.

### Lighter version

The Fast version, [Halftone](fast.md#halftone), is the fallback: a dot screen thresholded from a tone gradient in plain CSS, with no script and no picture.

### For the builder

Sample the picture once into a small grid of tones, then each frame draw a dot per cell on a rotated grid, its radius following the square root of the darkness so that the dot's area follows the tone. Here a generated gradient stands in for the photograph; draw the real image into the same tiny offscreen area instead.

```html
<canvas id="halftone" style="width:100%;height:100%"></canvas>
<div id="halftone-fallback" hidden><!-- the Fast card's dot screen --></div>
<script src="canvas-loop.js"></script>
```

```js
const canvas = document.getElementById('halftone');
const px = (ctx) => { const s = canvas.width / canvas.clientWidth; ctx.setTransform(s, 0, 0, s, 0, 0); return [canvas.clientWidth, canvas.clientHeight]; };
const PITCH = 9, ANGLE = Math.PI / 4;                   // dot spacing in CSS pixels; 45° is the classic screen angle

// The tone source, sampled once. Replace the gradient with ctx.drawImage(photo, 0, 0, 160, 90).
const src = document.createElement('canvas'); src.width = 160; src.height = 90;
const sc = src.getContext('2d');
const g = sc.createRadialGradient(60, 40, 4, 60, 40, 70); g.addColorStop(0, '#fff'); g.addColorStop(1, '#000');
sc.fillStyle = g; sc.fillRect(0, 0, 160, 90);
const data = sc.getImageData(0, 0, 160, 90).data;
const tone = (u, v) => {                                // 0 = black, 1 = white; u and v run 0..1
  const x = Math.min(159, Math.max(0, Math.floor(u * 160))), y = Math.min(89, Math.max(0, Math.floor(v * 90)));
  const k = (y * 160 + x) * 4;
  return (0.2126 * data[k] + 0.7152 * data[k + 1] + 0.0722 * data[k + 2]) / 255;
};

function frame(ctx, t) {
  const [w, h] = px(ctx);
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#111';
  const cos = Math.cos(ANGLE), sin = Math.sin(ANGLE), reach = Math.hypot(w, h) / PITCH / 2 + 1;
  const wob = 0.04 * Math.sin(t * 0.0012);              // a slow breath in the tone; drop it for a still plate
  for (let i = -reach; i <= reach; i++) for (let j = -reach; j <= reach; j++) {
    const x = w / 2 + (i * cos - j * sin) * PITCH, y = h / 2 + (i * sin + j * cos) * PITCH;
    if (x < -PITCH || x > w + PITCH || y < -PITCH || y > h + PITCH) continue;
    const dark = 1 - Math.min(1, Math.max(0, tone(x / w, y / h) + wob));
    const r = Math.sqrt(dark) * PITCH * 0.72;           // area follows tone
    if (r > 0.3) { ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill(); }
  }
}

dfCanvasLoop(canvas, {
  context: '2d',
  draw: (t, ctx) => frame(ctx, t),
  poster: (ctx) => frame(ctx, 0),
  fallback: '#halftone-fallback',
});
```

A photograph that must be decoded first makes the poster asynchronous: return the promise from `poster`, and the loop marks the poster done only when it resolves. For video or a 3D scene the tone changes every frame and the cost moves to the High version; this card covers a picture that is sampled once.

- **Poster frame:** `frame(ctx, 0)`, the plate with no breath.
- **Reduced motion:** the contract in `recipes-motion.md` §14; the loop draws the poster once and never calls `draw`.
- **Checks:** `node scripts/check-motion.mjs <page> --tier medium`: the drawing is alive, honours reduced motion, pauses off screen, and the page's motion code stays within the 139 KB Medium ceiling. Then confirm the dots stay separate and round at the real size (`verification.md`, "Probe, do not squint").

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- shaders.paper.design, probed 2026-10-14: motion code of the page 7 KB, one site; reduced motion, off-screen pausing and fallback were not measured.

## Glassmorphism

### What it is

A row of frosted panels floating over colour that keeps moving behind them, so the blur through each panel is never the same twice.

### Where it comes from

The term was coined by Michal Malewicz in 2020; Apple's macOS Big Sur, released that year, is an early example in an operating system, and Windows Vista and Windows 7, with their glass-like window borders, are named as precursors ([Wikipedia, Glassmorphism](https://en.wikipedia.org/wiki/Glassmorphism)).

### Suits

Dashboards and product shells over moving imagery: [Glassmorphism](../identities/digital.md#glassmorphism), [Liquid Glass (Apple 2025)](../identities/digital.md#liquid-glass-apple-2025), [Aurora / mesh gradients](../identities/digital.md#aurora--mesh-gradients).

### What it costs the visitor

On two sites (nothing.tech and raycast.com, measured 2026-10-14) the page's motion code weighed 0 KB and 282 KB, median 141 KB. The one animated background found had a median frame of 49.9 ms and a slowest-5% frame of 216.6 ms on an Intel UHD GPU, kept moving when reduced motion was asked for (0 % honoured), and paused when off screen (100 %). These are the page's numbers, not the blur's alone ([benchmarks](../benchmarks.md#canvas-and-webgl-measured-2026-10-15)).

### Lighter version

The Fast version, [Glassmorphism](fast.md#glassmorphism), is the fallback: one panel, or a very few, over a background that does not move.

### For the builder

What makes this Medium is the combination: several blurred panels over a background that is redrawn every frame, so the browser blurs new pixels each time. The background is one drawing area run by the loop; the panels are the Fast card's `.glass` rule, repeated.

```html
<section class="stage">
  <canvas id="glass-bg" style="position:absolute;inset:0;width:100%;height:100%"></canvas>
  <div id="glass-bg-fallback" hidden style="position:absolute;inset:0;background:linear-gradient(120deg,#ff7a59,#7a5cff 60%,#19c2d6)"></div>
  <div class="glass-row"><div class="glass">One</div><div class="glass">Two</div><div class="glass">Three</div></div>
</section>
<script src="canvas-loop.js"></script>
```

```css
.stage { position: relative; }
.glass {
  background: rgb(255 255 255 / .12);
  border: 1px solid rgb(255 255 255 / .28);
  border-radius: 18px;
  -webkit-backdrop-filter: blur(14px) saturate(140%);
  backdrop-filter: blur(14px) saturate(140%);
}
@supports not (backdrop-filter: blur(1px)) { .glass { background: rgb(40 30 90 / .72); } }
@media (prefers-contrast: more) {
  .glass { background: rgb(40 30 90 / .95); -webkit-backdrop-filter: none; backdrop-filter: none; }
}
```

```js
const canvas = document.getElementById('glass-bg');
const px = (ctx) => { const s = canvas.width / canvas.clientWidth; ctx.setTransform(s, 0, 0, s, 0, 0); return [canvas.clientWidth, canvas.clientHeight]; };
const blobs = [['#ff5f8f', .25, .3, .00031], ['#5f7bff', .7, .35, .00023], ['#2ee6c4', .45, .85, .00027]];   // colour, x, y, speed

function frame(ctx, t) {
  const [w, h] = px(ctx);
  ctx.fillStyle = '#10112a'; ctx.fillRect(0, 0, w, h);
  blobs.forEach(([c, x, y, sp], k) => {
    const cx = (x + 0.12 * Math.sin(t * sp + k * 2)) * w, cy = (y + 0.12 * Math.cos(t * sp * 1.3 + k)) * h, r = Math.max(w, h) * 0.45;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, c); g.addColorStop(1, 'transparent');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  });
}

dfCanvasLoop(canvas, {
  context: '2d',
  draw: (t, ctx) => frame(ctx, t),
  poster: (ctx) => frame(ctx, 0),
  fallback: '#glass-bg-fallback',
});
```

Keep the budget small: the blur runs over every panel on every frame, so a handful of panels at a moderate radius is the limit, and nesting one blurred panel inside another doubles the work. Check text contrast against the brightest blob that can pass behind it, not the calmest frame. Under reduced motion the loop paints the poster and the panels stay as they are.

- **Poster frame:** `frame(ctx, 0)`, the background at its starting positions, behind the panels.
- **Reduced motion:** the contract in `recipes-motion.md` §14; the loop draws the poster once and never calls `draw`, which is the check the measured sites fail.
- **Checks:** `node scripts/check-motion.mjs <page> --tier medium`: the background is alive, honours reduced motion, pauses off screen, and the page's motion code stays within the 139 KB Medium ceiling. Then read the text on each panel at the lowest contrast the background can reach (`verification.md`, "Probe, do not squint").

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- nothing.tech and raycast.com, probed 2026-10-14: motion code 0 KB at one and 282 KB at the other (the table does not say which). One animated drawing in all: median frame 49.9 ms, slowest 5% 216.6 ms, on an Intel UHD GPU through ANGLE (Direct3D11); reduced motion honoured 0 %, pauses off screen 100 %, fallback without WebGL 100 %.

## Cursor-painted reveal

### What it is

A picture shown one way, an engraving, a wireframe or a helmet over a face, that turns into another wherever the pointer has just been: the hand paints a hole with a torn edge, and the hole closes again a moment later.

### Where it comes from

It is the scratchcard made to heal: a printed layer hidden under a coating that the hand rubs away ([Wikipedia, Scratchcard](https://en.wikipedia.org/wiki/Scratchcard)).

### Suits

A portrait or product hero with two states worth comparing (the drawing and the photograph, the shell and the inside, the gear and the person): [Engraving / banknote (guilloche)](../identities/print-craft.md#engraving--banknote-guilloche), [Photographer portfolio](../identities/industry.md#photographer-portfolio), [Sports & performance](../identities/industry.md#sports--performance), [Hardware product](../identities/industry.md#hardware-product).

### What it costs the visitor

Measured on the example page built for this card (2026-11-07): 11 KB of motion code and 89 KB in all, 79 KB of it the photograph. It held 60 frames a second (16.7 ms, 16.8 ms for the slowest 5 %) on an Intel UHD GPU, and still about 47 frames a second with no usable graphics chip: the trail is drawn at a quarter of the size and the picture is one pass.

### Lighter version

No lighter version: the hole follows the hand, and a flat recipe cannot paint it. The fallback is the photograph standing still; when the second state matters more than the play, show both side by side, or reveal the second once on scroll ([Image reveal through the identity's device](fast.md#image-reveal-through-the-identitys-device)).

### For the builder

A trail buffer and one composite. The trail is two small 8-bit textures (a quarter of the canvas) drawn in turn: each frame keeps the last one multiplied by a decay and adds a soft stamp along the segment the pointer moved through, so a fast stroke leaves a line and not a row of dots. The composite reads the trail as a mask between the two pictures, thresholded with a little noise so the edge tears instead of fading. Here the first picture is computed from the second: an engraving drawn from the photograph's own tone, so there is one image to download.

```glsl
// The trail: last frame faded, plus a stamp along the segment the pointer moved through.
uniform sampler2D uPrev; uniform vec2 uA, uB; uniform float uAspect, uRadius, uDecay, uStrength;
void main() {
  vec2 p = vUv, a = uA, b = uB; p.x *= uAspect; a.x *= uAspect; b.x *= uAspect;
  vec2 ab = b - a; float h = clamp(dot(p - a, ab) / max(dot(ab, ab), 1e-6), 0.0, 1.0);
  float stamp = smoothstep(uRadius, 0.0, length(p - a - ab * h)) * uStrength;
  o = vec4(min(1.0, texture(uPrev, vUv).r * uDecay + stamp), 0, 0, 1);
}
```

```glsl
// The picture: an engraving from the photograph's tone, and the photograph where the trail is.
void main() {
  vec2 uv = (vUv - 0.5) * uCover + 0.5; uv.y = 1.0 - uv.y;
  vec3 photo = texture(uPhoto, uv).rgb;
  float lum = dot(photo, vec3(0.299, 0.587, 0.114));
  float line = abs(fract((gl_FragCoord.y + gl_FragCoord.x * 0.35) / (4.0 * uPx.x)) - 0.5) * 2.0;
  vec3 engraving = mix(uInk, uPaper, smoothstep(lum - 0.12, lum + 0.12, line));   // dark tone, thick line
  float m = smoothstep(0.35, 0.55, texture(uTrail, vUv).r + (noise(vUv * 38.0) - 0.5) * 0.35);
  o = vec4(mix(engraving, photo, m), 1.0);
}
```

The page, with the loop and the pointer wiring, is `docs/examples/motion-techniques/cursor-reveal/page.html`.

- **Decay:** 0.975 a frame, a half-life of about 0.45 s at 60 frames a second; at 0.955 the hole had closed before the eye found it. The steady brightness of a held brush is stamp / (1 − decay), so keep the threshold well under it (the `shader-dev` skill, MiniMax, MIT, has the budget).
- **Discoverable on touch:** after three seconds with no pointer, a slow brush draws a loop over the subject at 60 % strength, so a phone visitor sees what the picture does. That is the idle autopilot every cursor-driven card owes (`recipes-motion.md` §28).
- **A lens instead of a trail** (the `reveal-hover-effect` skill, Meng To, MIT): no drawing area at all. The second picture sits over the first, same crop, and shows through a feathered circle at an eased pointer: `mask-image: radial-gradient(circle var(--r) at var(--x) var(--y), #000 0 40%, rgb(0 0 0 / .75) 60%, rgb(0 0 0 / .4) 75%, rgb(0 0 0 / .12) 88%, transparent)`, both `mask-image` and `-webkit-mask-image`. One loop writes the three properties, easing the position by 0.1 and the radius by 0.14 a frame, and stops when they settle; the radius goes back to 0 on leave, cancel and window blur. A hard rim (`clip-path: circle()`) instead of the feather reads as an x-ray lens over a drawing. Idle, the same three properties follow the §28 path, so the lens is seen before it is found. Not measured here: it is two images and one masked layer, and the cost is the second picture's bytes.
- **Two real pictures** instead of one computed from the other: load both, same crop, and mix them; two 3D materials work the same way with the trail sampled in screen space. A smear instead of a hole (the light version of [Fluid ink](high.md#fluid-ink)): use the trail to push the picture's coordinates instead of to mix.
- **No float textures needed:** the trail fits in 8 bits, so this runs where the fluid solver cannot.
- **Poster frame:** the engraving with one fixed opening over the subject. **Reduced motion:** the poster, and the pointer paints nothing (`recipes-motion.md` §14).
- **Checks:** `node scripts/check-motion.mjs <page> --tier medium`.

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- docs/examples/motion-techniques/cursor-reveal/page.html, the example page built for this card, served compressed over http and probed 2026-11-07: motion code 11 KB, 89 KB in all (photograph 79 KB); Intel UHD GPU through ANGLE (Direct3D11), median frame 16.7 ms, slowest 5 % 16.8 ms; SwiftShader (software) about 47 frames a second; reduced motion honoured, pauses off screen, fallback without WebGL, readable without scripts; the wheel recording reached the end with no stalls. The template pages read for this card publish preview recordings only.

## Glass over moving light

### What it is

A panel of reeded or beaded glass in front of slow light. The light behind moves on its own, and every rib or bead bends it its own way, so lines break and jump at each edge; the pointer carries a lamp behind the glass, and when it leaves, the lamp walks on alone.

### Suits

Brands of material, light and making: [Architecture studio](../identities/industry.md#architecture-studio), [Furniture / interiors](../identities/industry.md#furniture--interiors), [Liquid Glass (Apple 2025)](../identities/digital.md#liquid-glass-apple-2025), [Hotel / boutique travel](../identities/industry.md#hotel--boutique-travel). It needs something behind the glass that moves; over a still, flat ground it is glass over nothing (`gates.md`, `glass-over-nothing`).

### What it costs the visitor

Measured on the example page built for this card (2026-11-08): 10 KB of motion code and 8 KB of page in all, with no image. It held 60 frames a second (16.7 ms, 16.8 ms for the slowest 5 %) on an Intel UHD GPU, full screen at 1440 x 900. With no usable graphics chip it drew 46 frames in 4 seconds, about 11 a second: on such a device show the still.

### Lighter version

No lighter version: the play is light moving behind the ribs, and a still of it is only a texture. The fallback is that still, ribs shaded across a soft glow, which the page shows when the moving version cannot run.

### For the builder

One full-screen pass, no image. Behind the glass, a field of thin bright lines that drift and bend (four sine bands, each sharpened with a power); in front, either ribs or beads, and each pixel looks the field up through the glass at its position:

```glsl
// Ribs: each one a half cylinder; its slope u pushes the lookup sideways. The ribs sway as an S.
float x = p.x * 9.0 + 0.45 * sin(p.y * 1.7 + t * 0.12);
float u = fract(x) * 2.0 - 1.0;
vec2 q = p + vec2(u * 0.14, 0.0);
vec3 c = vec3(light(q + vec2(u * 0.006, 0.0), lamp, t).r, light(q, lamp, t).g, light(q - vec2(u * 0.006, 0.0), lamp, t).b);
rib = (uGround + c) * (0.5 + 0.5 * (1.0 - u * u)) * (1.0 - 0.75 * smoothstep(0.93, 1.0, abs(u))) + exp(-pow((u + 0.45) * 6.0, 2.0)) * 0.06;

// Beads: a hex grid of small spheres; the sphere's normal pulls the lookup toward the bead's centre.
vec2 s = vec2(1.0, 1.7320508) * 0.11;
vec2 a = mod(p, s) - 0.5 * s, b = mod(p - 0.5 * s, s) - 0.5 * s;
vec2 d = dot(a, a) < dot(b, b) ? a : b;
float r = length(d) / 0.052, z = sqrt(max(0.0, 1.0 - r * r));
vec3 inside = (uGround + light(p - d * (1.0 - z) * 1.6, lamp, t)) * (0.45 + 0.55 * z);
```

The page, with the field, the lamp and the switch between the two panels, is `docs/examples/motion-techniques/glass-light/page.html`.

- **Resolution:** the picture is soft, so it is drawn at three quarters of the pixels (`maxDpr: 0.75` in `templates/canvas-loop.js`); the slow-machine figure above is at that size.
- **The colour split** (red, green and blue bent by slightly different amounts) is what reads as glass rather than as a pattern; it costs three lookups a pixel instead of one. Drop it before dropping resolution.
- **The lamp** follows the hand through an eased value and, idle, walks a slow figure-of-eight: the idle autopilot of `recipes-motion.md` §28. A touch screen gets the walk only.
- **Lighter to write:** the Apache-2.0 `@paper-design/shaders` package ships a fluted-glass shader over an image; it was not measured here, and over a still image it is the texture without the light.
- **Poster frame:** one still at a fixed time, lamp at rest. **Reduced motion:** the poster (`recipes-motion.md` §14). **Checks:** `node scripts/check-motion.mjs <page> --tier medium`.

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- docs/examples/motion-techniques/glass-light/page.html, the example page built for this card, served compressed over http and probed 2026-11-08: motion code 10 KB, 8 KB in all; Intel UHD GPU through ANGLE (Direct3D11), median frame 16.7 ms, slowest 5 % 16.8 ms; SwiftShader (software) 46 frames in 4 s at 1440 x 900; reduced motion honoured, pauses off screen, fallback without WebGL; the wheel recording reached the end with no stalls. The catalogue items read for it (2026-11-08) publish preview recordings only.

## CSS 3D objects

### What it is

Photographs or solid objects arranged in real depth and turned by the scroll: a sphere of pictures whose front frames are lit and whose back frames go dark, then a drum of the same pictures the visitor walks into.

### Suits

Archives, collections and portfolios with many pictures of one kind: [Photographer portfolio](../identities/industry.md#photographer-portfolio), [Museum / white-cube gallery](../identities/print-craft.md#museum--white-cube-gallery), [Record label / musician](../identities/industry.md#record-label--musician), [Creative agency showcase](../identities/industry.md#creative-agency-showcase).

### What it costs the visitor

Measured on the example page built for this card (2026-11-08): about 3 KB of script (1.4 KB compressed) and 145 KB in all, 142 KB of it one sheet holding all 24 pictures. Scrolled through end to end it held 60 frames a second (16.7 ms, 16.8 ms for the slowest 5 %) on an Intel UHD GPU, and also with no usable graphics chip: 40 flat pictures with a brightness each are cheap to composite.

### Lighter version

The Fast version, [CSS 3D objects](fast.md#css-3d-objects), is the fallback: one object turned by the style sheet alone, with no script. Without the script, and under reduced motion, this page shows its pictures as a flat contact sheet.

### For the builder

Each object is a pinned stage in a tall track of native scroll; the script reads the track's progress and writes transforms, nothing else. The sphere places 24 cards by the golden angle, each turned to face out, and lights each one by how much it faces the viewer after the turn:

```js
const y = 1 - (2 * (i + 0.5)) / N, lat = Math.asin(y), lon = i * 2.39996;            // golden-angle spread
card.style.transform = `rotateY(${lon}rad) rotateX(${-lat}rad) translateZ(${r}px)`;
// per frame, from the scroll progress p:
const turn = p * Math.PI * 2, tilt = 0.25 - p * 0.5;
ball.style.transform = `rotateX(${tilt}rad) rotateY(${turn}rad)`;
const z = Math.cos(lat) * Math.cos(lon + turn) * Math.cos(tilt) - Math.sin(-lat) * Math.sin(tilt);   // facing
card.style.filter = `brightness(${(0.22 + 0.78 * Math.max(0, z)).toFixed(2)})`;

// The drum: cards facing inward round a ring, and the camera dollies from outside to the middle.
card.style.transform = `rotateY(${a}rad) translateZ(${-r * 1.15}px)`;
drum.style.transform = `translateZ(${-r * 3.2 + p * r * 3.6}px) rotateY(${p * 90}deg)`;
```

The page is `docs/examples/motion-techniques/css-3d/sphere.html`; its Fast sibling is `css-3d/page.html`.

- **One sheet, not 24 files:** every card is a slice of one picture (`background-size: 600% 400%` and a position per card), one request and one decode.
- **Brightness, not blur:** the catalogue's sphere also blurs the back cards; a per-frame blur on 24 layers is the expensive part, and brightness alone reads as depth.
- **The drum is the scroll flight** of the `animaxxing-webgl` skill (John Polacek, MIT) done without a renderer: about 20 pictures, fewer on a phone, and the camera's path a pure function of the scroll.
- **Reduced motion:** no turn and no dolly: a camera moving into a ring is the zoom that vestibular disorders react to (`recipes-motion.md` §14); the contact sheet stands instead.
- **Checks:** `node scripts/check-motion.mjs <page> --tier medium`, and the wheel recording of `check-slop --render` must reach the end with no stalls.

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- docs/examples/motion-techniques/css-3d/sphere.html, the example page built for this card, served compressed over http and probed 2026-11-08: script about 3 KB inline (1.4 KB compressed), 145 KB in all (the sheet 142 KB); scrolled end to end in 4 s, median frame 16.7 ms and slowest 5 % 16.8 ms on the Intel UHD GPU and on SwiftShader; reduced motion shows the contact sheet; the wheel recording reached the end with no stalls.

## Stepped showcase

### What it is

One product or exhibit at a time, filling the screen: each step opens the next out of the last (a ring that grows from the object, the page changing colour, a giant word changing), and the visitor steps with the wheel, a swipe, the keys or the buttons alike.

### Suits

A small range shown piece by piece, where each piece earns the whole screen: [Vintage packaging / label](../identities/print-craft.md#vintage-packaging--label), [Museum / white-cube gallery](../identities/print-craft.md#museum--white-cube-gallery), [DTC challenger brand playful](../identities/industry.md#dtc-challenger-brand-playful), [Coffee roaster](../identities/industry.md#coffee-roaster). Three to eight steps; past that it is a catalogue and wants a grid.

### What it costs the visitor

Measured on the example page built for this card (2026-11-08): about 4 KB of script (1.7 KB compressed) and 232 KB in all, 228 KB of it the three photographs. Scrolled through end to end it held 60 frames a second (16.7 ms, 16.8 ms for the slowest 5 %) on an Intel UHD GPU and with no usable graphics chip; the wheel recording reached the end with no stalls.

### Lighter version

No lighter version: the steps are sections of the page and the script only stacks them. Without the script, and on a browser that cannot pin, the exhibits stand one after another as full-screen sections, which is the lighter version.

### For the builder

Three of the catalogue's twelve full pages step on the wheel: the page does not scroll and a wheel listener counts the steps, so a trackpad's momentum, a dragged scrollbar, find-in-page and a reload at depth all lose the place. Where no key answers either, that is the `wheel-hijack` gate (Floor). Built the accessible way it is the state machine of the `horizontal-scroll-scenes` skill (Meng To, MIT): a tall track of native scroll, a pinned stage, and one pure function from the scroll position to the step, its dwell and the move to the next.

```js
const N = 3, DWELL = 1.15, MOVE = 0.85, CYC = DWELL + MOVE, SPAN = N * DWELL + (N - 1) * MOVE;   // in screens
function travel() {
  const b = track.getBoundingClientRect(), max = b.height - innerHeight;
  const sp = max > 0 ? clamp01(-b.top / max) : 0;
  const u = Math.min(SPAN - 1e-5, sp * SPAN), i = Math.min(N - 1, Math.floor(u / CYC));
  const local = u - i * CYC, f = i >= N - 1 ? 0 : clamp01((local - DWELL) / MOVE);
  return { i, f, live: f < 0.39 ? i : i + 1 };   // the label flips before the middle: the new title is already half in
}
// The ring wipe: the next step opens as a circle grown from where its object sits.
next.style.clipPath = `circle(${ease(f) * far}px at ${cx}px ${cy}px)`;
```

The page, with the buttons, the index and the address, is `docs/examples/motion-techniques/stepped-showcase/page.html`.

- **Native scroll is the only state:** never a stored "current step", never a summed wheel delta, never `scroll-snap` (it fights the dwell). Reverse, a dragged scrollbar, Home and End, a link and a reload at depth all land on the same frame.
- **Keys, buttons and swipe:** the arrows, Page Down and Space scroll natively; Previous and Next and the index links scroll to a step's station (`scrollTo`, smooth unless reduced motion). A finger swipes the page as it swipes any page.
- **The address:** a committed step (its dwell, not the middle of a move) is written with `history.replaceState` as `#exhibit-2`, and announced once in a polite live region; arriving with the hash scrolls to that station.
- **Hidden steps are `inert` as well as hidden,** so a link in an exhibit off screen is never focused.
- **Reduced motion cuts at once:** no wipe, the next step replaces the last at the middle of the move, and the buttons jump instead of gliding.
- **No hijack below:** the stage holds the hero only; the page after it scrolls as any page does.
- **Choreography:** the object leads (the ring grows from it), the word supports (it slides a little as the ring passes), the colour is decoration and changes with the ring, never on its own (`choreograph`, Emil Kowalski, MIT: one lead per moment).
- **`html { scroll-behavior: smooth }` breaks the glide and every capture;** keep it `auto` and pass `behavior` per call.
- **Checks:** `node scripts/check-motion.mjs <page> --tier medium` and `check-slop --render`, whose `wheel-hijack` gate fails a page that does not scroll and answers only the wheel.

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- docs/examples/motion-techniques/stepped-showcase/page.html, the example page built for this card, served compressed over http and probed 2026-11-08: script about 4 KB inline (1.7 KB compressed), 232 KB in all (photographs 228 KB); scrolled end to end in 4 s, median frame 16.7 ms and slowest 5 % 16.8 ms on the Intel UHD GPU and on SwiftShader; the wheel recording reached the end with no stalls.

## Dither

### What it is

A field or a picture printed in two colours of ink through a regular screen of dots, the way an old printer or a 1-bit screen made grey: here a fog that drifts across the page, which a lamp under the pointer clears.

### Where it comes from

Ordered dithering thresholds each pixel against a fixed matrix; the 4 x 4 matrix used here is Bryce Bayer's, published in 1973 ([Wikipedia, Ordered dithering](https://en.wikipedia.org/wiki/Ordered_dithering)).

### Suits

[Dithered / 1-bit low-tech](../identities/digital.md#dithered--1-bit-low-tech), [Retro OS desktop (Windows 95 / classic Mac / XP)](../identities/digital.md#retro-os-desktop-windows-95--classic-mac--xp), [Archival newsprint](../identities/print-craft.md#archival-newsprint), [Solarpunk and low-tech web](../identities/cultural.md#solarpunk-and-low-tech-web).

### What it costs the visitor

Measured on the example page built for this card (2026-11-08): 7 KB of motion code and 7 KB in all. It held 60 frames a second (16.7 ms, 16.8 ms for the slowest 5 %) on an Intel UHD GPU, and drew 107 frames in 4 seconds, about 27 a second, with no usable graphics chip.

### Lighter version

The Fast version, [Dither](fast.md#dither), is the fallback: one photograph printed through the same screen by the style sheet, with no script and nothing moving.

### For the builder

A small buffer, one value per cell, drawn up with hard pixels. The fog is value noise (three octaves) drifting, plus a lean toward one corner, minus a soft hole at the lamp; each cell is ink where the fog beats the screen:

```js
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
  const nx = (x / cols) * aspect, ny = y / rows;
  let fog = fbm(nx * 2.2 + drift, ny * 2.2 - drift * 0.4) * 0.82 + (1 - ny) * 0.15 + (nx / aspect) * 0.12 - 0.1;
  fog -= Math.exp(-((nx - lx) ** 2 + (ny - ly) ** 2) * 22) * 0.55;        // the lamp clears a soft hole
  const c = fog > BAYER[(y & 3) * 4 + (x & 3)] ? ink : paper;             // ink where the fog beats the screen
  data.set(c, (y * cols + x) * 4);
}
small.getContext('2d').putImageData(img, 0, 0);
ctx.imageSmoothingEnabled = false;
ctx.drawImage(small, 0, 0, canvas.width, canvas.height);                  // one cell = 7 CSS pixels
```

The page is `docs/examples/motion-techniques/dither/page.html`.

- **The noise from a table:** the first build hashed every sample with `sin()`, two fields of three octaves a cell, and dropped to 15 frames a second on the Intel GPU with 44 long tasks in 4 seconds; a table of 256 random values and one field kept it at 60. Write the field into one image buffer and draw it up once; the `dither-background` skill (Meng To, MIT) fills a rectangle per cell, which is the slow path at full screen.
- **Cells of 5 to 10 pixels:** smaller and the screen disappears into grain; the matrix must be visible from reading distance.
- **Two inks from the tokens,** never a grey ramp: the identity's ink and paper, so dark mode and a rebrand follow.
- **The lamp** is the idle autopilot of `recipes-motion.md` §28: it sweeps on its own until the hand arrives.
- **Poster frame:** the field at a fixed time. **Reduced motion:** the poster. **Checks:** `node scripts/check-motion.mjs <page> --tier medium`.

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- docs/examples/motion-techniques/dither/page.html, the example page built for this card, served compressed over http and probed 2026-11-08: motion code 7 KB, 7 KB in all; Intel UHD GPU, median frame 16.7 ms, slowest 5 % 16.8 ms; SwiftShader 107 frames in 4 s at 1440 x 900; reduced motion honoured, pauses off screen; the wheel recording reached the end with no stalls.
