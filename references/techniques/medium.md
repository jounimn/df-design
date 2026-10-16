# Medium techniques

Medium expensive loading: a small amount of script, noticeable image weight or some GPU work. The tier is described in [audition.md §4](../audition.md#4-loading-cost-cheapest-viable-option-first); this file does not restate it. Every card here links its lighter version in [fast.md](fast.md), which is its fallback, or says why there is none.

| Technique | What the visitor sees | Suits |
|---|---|---|
| [Particles](#particles) | Dozens of points that drift and join with fine lines when they come close | Generative, data and AI brands |
| [ASCII art](#ascii-art) | A picture or a moving field built from letters and symbols | Developer tools, terminals and zines |
| [Halftone](#halftone) | A picture or field built from printed-looking dots that follow its tone | Print, music and campaign brands |
| [Glassmorphism](#glassmorphism) | A row of frosted panels over colour that moves behind them | OS-like products and dashboards over moving imagery |

## Particles

### What it is

Dozens of small points that drift across the screen and draw a fine line between any two that come near each other, so the field looks like a slowly changing constellation.

### Where it comes from

Particle systems were introduced in the 1982 film Star Trek II: The Wrath of Khan for the fictional Genesis effect, and in 1983 Reeves defined them as animated points used for sparks, rain, fire and similar phenomena ([Wikipedia, Particle system](https://en.wikipedia.org/wiki/Particle_system)).

### Suits

Brands that want a living field of data or computation behind the content: [Generative / creative-coding](../identities/digital.md#generative--creative-coding), [Data-viz-as-hero](../identities/digital.md#data-viz-as-hero), [AI lab](../identities/industry.md#ai-lab).

### What it costs the visitor

On one site (shopify.com/editions/spring2026, measured 2026-10-14) the page's motion code weighed 139 KB. The animated drawing sat far down the page and was not listed as visible, so only the weight counts, and whether it honours reduced motion was not checked ([benchmarks](../benchmarks.md#canvas-and-webgl-measured-2026-10-15)).

### Lighter version

The Fast version, [Particles](fast.md#particles), is the fallback: a few hand-placed points drifting in SVG, with no script. Use it when the page must work without JavaScript, or when the field does not need to link its points.

### For the builder

One drawing area, one loop. The points are a pure function of time (a seeded start and a constant speed), so the poster is simply frame 0 and the first paint is the same picture the loop starts from. Copy `templates/canvas-loop.js` next to the page; the loop draws only while the area is on screen and the tab is visible, draws the poster once under reduced motion, and shows the fallback if the context is missing.

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
- **Checks:** `node scripts/check-motion.mjs <page> --tier medium`: the drawing is alive, honours reduced motion, pauses off screen, and the page's motion code stays within the Medium ceiling. Then look at the rendered page (`verification.md`, "Probe, do not squint").

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
- **Checks:** `node scripts/check-motion.mjs <page> --tier medium`: the drawing is alive, honours reduced motion, pauses off screen, and the page's motion code stays within the Medium ceiling. Then read the rendered text at the real size (`verification.md`, "Probe, do not squint").

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
- **Checks:** `node scripts/check-motion.mjs <page> --tier medium`: the drawing is alive, honours reduced motion, pauses off screen, and the page's motion code stays within the Medium ceiling. Then confirm the dots stay separate and round at the real size (`verification.md`, "Probe, do not squint").

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
- **Checks:** `node scripts/check-motion.mjs <page> --tier medium`: the background is alive, honours reduced motion, pauses off screen, and the page's motion code stays within the Medium ceiling. Then read the text on each panel at the lowest contrast the background can reach (`verification.md`, "Probe, do not squint").

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- nothing.tech and raycast.com, probed 2026-10-14: motion code 0 KB at one and 282 KB at the other (the table does not say which). One animated drawing in all: median frame 49.9 ms, slowest 5% 216.6 ms, on an Intel UHD GPU through ANGLE (Direct3D11); reduced motion honoured 0 %, pauses off screen 100 %, fallback without WebGL 100 %.
