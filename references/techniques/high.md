# High techniques

High expensive loading: heavy script, large media, and main-thread and GPU cost, so it needs a fallback. The tier is described in [audition.md §4](../audition.md#4-loading-cost-cheapest-viable-option-first); this file does not restate it. Each card here links its lighter version, in [medium.md](medium.md) or [fast.md](fast.md), except Clay 3D, Rendered 3D and the four cards added from the 2026-11-07 template research (Fluid ink, Glass object, Reflective water floor, Object that travels between sections), which say why there is none, as do the three added from the component catalogue read on 2026-11-08 (Glass letters, Images that fray and smear, Type on geometry). Those seven, and the scroll morph in Particles, were measured on example pages built for them (`docs/examples/motion-techniques/`), because the pages that show them publish only recordings.

**Own art direction, own material.** A card here is a move, not a look. The strongest pieces of the two catalogues read in November 2026 each had their own art direction and made the effect out of the page's own content: the headline refracted, the section's photographs frayed, the product's labels turned in depth. Their commodity parts wore one house look and ran the effect on a demo's stock picture ([yolo-references.md](../yolo-references.md#a-component-catalogue-read-2026-11-08)). Build the move from what the page already says and shows, in the identity's colours and type; a move copied with its demo's look is the kit again, and the gates name the kit (`named-look-dark`, `border-beam`).

| Technique | What the visitor sees | Suits |
|---|---|---|
| [Particles](#particles) | Thousands of points that swarm and twinkle, or re-form into one shape after another as the page scrolls | Generative, AI and data brands |
| [Liquid morph](#liquid-morph) | Shapes that stretch, split and merge like thick drops of liquid | Calm, friendly and organic brands |
| [Holographic](#holographic) | A solid object whose rainbow colour shifts as it turns | Collectibles, beauty and music |
| [Wireframe 3D](#wireframe-3d) | A solid object drawn as bare edges, turning in space | Technical, plan-like and sci-fi brands |
| [Gradient mesh](#gradient-mesh) | A full-screen field of colour that flows with no edges | Fintech, AI and launch pages |
| [Clay 3D](#clay-3d) | Soft, matte lumps that look hand-modelled and turn slowly | Friendly consumer, kids and playful brands |
| [Rendered 3D](#rendered-3d) | A modelled, lit object or scene, rendered once and shipped as pictures | Products, characters and toon worlds |
| [Halftone](#halftone) | A picture, video or 3D scene turned into printed-looking dots | Print, music and campaign brands |
| [Fluid ink](#fluid-ink) | A photograph whose colours flow after the pointer like ink in water | Calm, sensory and travel brands |
| [Glass object](#glass-object) | A body of clear glass that bends the word behind it as it turns | Luxury, hardware and brand marks |
| [Reflective water floor](#reflective-water-floor) | A dark pool that mirrors the scene and ripples where it is touched | Night, calm and luxury scenes |
| [Object that travels between sections](#object-that-travels-between-sections) | One object that comes down the page and settles beside each section | Product pages told section by section |
| [Glass letters](#glass-letters) | The headline cast in clear glass, the photograph bent through it | Short words over a picture of their subject |
| [Images that fray and smear](#images-that-fray-and-smear) | A strip of photographs that unravels into threads at its edges, under a smearing lens | Pictures that are the product, shown as a run |
| [Type on geometry](#type-on-geometry) | Names written along a ribbon tied in a knot, turning in depth | Lists of names that belong to an object |

## Particles

### What it is

Thousands of tiny points that swarm across the screen and twinkle, like sparks or dust in a beam of light. In its larger form one cloud of points re-forms as the visitor scrolls: a shell becomes a ring, the ring is pulled into a helix, the helix spills into a disc, and the points swirl between shapes rather than sliding in straight lines.

### Where it comes from

Particle systems were introduced in the 1982 film Star Trek II: The Wrath of Khan for the fictional Genesis effect, and in 1983 Reeves defined them as animated points used for sparks, rain, fire and similar phenomena ([Wikipedia, Particle system](https://en.wikipedia.org/wiki/Particle_system)).

### Suits

Brands that want a swarm that feels alive and computed: [Generative / creative-coding](../identities/digital.md#generative--creative-coding), [AI lab](../identities/industry.md#ai-lab), [Cyberpunk](../identities/digital.md#cyberpunk).

### What it costs the visitor

On one site (activetheory.net, measured 2026-10-14) the page's motion code weighed 340 KB, which is the High ceiling itself. Its one animated drawing ran at a median frame of 16.7 ms and 16.9 ms for the slowest 5 % of frames on an Intel UHD GPU, so it was smooth, but it kept moving when reduced motion was asked for (0 % honoured). A fallback showed when 3D graphics were missing (100 %) ([benchmarks](../benchmarks.md#canvas-and-webgl-measured-2026-10-15)).

The version that re-forms by scroll was measured on the example page built for this card (2026-11-07): 11 KB of motion code and 9 KB in all, because the shapes are computed on the visitor's machine, not downloaded. With 60,000, 200,000 and 400,000 points it held 16.7 ms a frame (16.8 ms for the slowest 5 %) on the same Intel UHD GPU; with no usable graphics chip (a software renderer) it fell to about 12 frames a second at 60,000 points and 9 at 200,000, so a weak device needs the lighter version. A shape taken from a 3D model instead of computed costs about 1.2 MB per shape at 100,000 points, and a chain of them is where the technique becomes a [Real-time 3D world](yolo.md#real-time-3d-world).

### Lighter version

The Medium version, [Particles](medium.md#particles), is the fallback: dozens of points on a flat 2D surface, with fine lines between near neighbours. Use it when the effect needs far fewer points, or when the visitor's hardware cannot be trusted with thousands.

### For the builder

Twenty thousand points, moved entirely by the GPU: each point is four numbers uploaded once, and the vertex program turns the clock into a position. No library, only the context the loop already holds. The helper throws on a compile error, and a throw makes the loop show the fallback instead of a blank box.

```html
<canvas id="points" style="width:100%;height:100%;color:#cfe3ff"></canvas>
<svg id="points-fallback" hidden><!-- the Medium or Fast version of the same effect --></svg>
<script src="canvas-loop.js"></script>
<script type="module" src="points.js"></script>
```

```js
const canvas = document.getElementById('points');
const COUNT = 20000;

// Each point is four numbers: start x, start y, drift x, drift y. The GPU moves them; the page never touches them again.
const VERTEX = `#version 300 es
in vec4 aSeed;
uniform float uTime, uPx;
out float vTwinkle;
void main() {
  vec2 p = fract(aSeed.xy + aSeed.zw * uTime * 0.00002);     // fract() wraps a point round the screen
  vTwinkle = 0.55 + 0.45 * sin(uTime * 0.002 + aSeed.x * 40.0);
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
  gl_PointSize = (1.0 + 2.5 * fract(aSeed.y * 57.3)) * uPx;
}`;
const FRAGMENT = `#version 300 es
precision mediump float;
uniform vec3 uInk;
in float vTwinkle;
out vec4 outColor;
void main() {
  float a = smoothstep(0.5, 0.0, length(gl_PointCoord - 0.5)) * vTwinkle;   // a soft round point
  outColor = vec4(uInk * a, a);                                             // premultiplied alpha
}`;

function program(gl, vertexSource, fragmentSource) {
  const shader = (type, source) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));   // a throw shows the fallback
    return s;
  };
  const p = gl.createProgram();
  gl.attachShader(p, shader(gl.VERTEX_SHADER, vertexSource));
  gl.attachShader(p, shader(gl.FRAGMENT_SHADER, fragmentSource));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  return p;
}

let gpu = null;                                                 // programs and buffers; rebuilt after a lost context
function build(gl) {
  const prog = program(gl, VERTEX, FRAGMENT);
  let seed = 12345;                                             // seeded, so the poster is the same on every visit
  const rnd = () => (seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296;
  const data = new Float32Array(COUNT * 4);
  for (let i = 0; i < data.length; i++) data[i] = i % 4 < 2 ? rnd() : (rnd() - 0.5) * 2;
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  const at = gl.getAttribLocation(prog, 'aSeed');
  gl.enableVertexAttribArray(at);
  gl.vertexAttribPointer(at, 4, gl.FLOAT, false, 0, 0);
  const ink = getComputedStyle(canvas).color.match(/[\d.]+/g).slice(0, 3).map((v) => v / 255);   // the page's own colour
  const u = (name) => gl.getUniformLocation(prog, name);
  return { prog, vao, ink, uTime: u('uTime'), uPx: u('uPx'), uInk: u('uInk') };
}

function frame(gl, t) {
  gpu ??= build(gl);
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  gl.useProgram(gpu.prog);
  gl.bindVertexArray(gpu.vao);
  gl.uniform1f(gpu.uTime, t);
  gl.uniform1f(gpu.uPx, canvas.width / canvas.clientWidth);     // keep points the same size on a sharper screen
  gl.uniform3f(gpu.uInk, ...gpu.ink);
  gl.drawArrays(gl.POINTS, 0, COUNT);
}

dfCanvasLoop(canvas, {
  context: 'webgl2',
  draw: (t, gl) => frame(gl, t),
  poster: (gl) => frame(gl, 0),
  restore: () => { gpu = null; },                               // a restored context has none of the old programs or buffers
  fallback: '#points-fallback',
});
```

The count is the main lever on cost: try halving it before anything else. `restore` throws the programs and buffers away so a restored context rebuilds them; without it the page would draw with handles that no longer exist.

- **Poster frame:** `frame(gl, 0)`: the points at their start positions with the twinkle at zero time, identical on every visit because the seed is fixed.
- **Reduced motion:** the contract in `recipes-motion.md` §14; the loop draws the poster once and never calls `draw`, which is the check the measured site fails.
- **Colour:** the colour is read from the page with `getComputedStyle(...)` and split by a pattern that expects `rgb()` or `rgba()`, which is what a browser returns for ordinary CSS colours. A colour written as `oklch()`, `color-mix()` or `color()` may come back in another form and give wrong numbers. In that case paint the colour onto a one-pixel 2D drawing area with `fillStyle`, read the pixel, and use its three values.
- **Serving:** the recipe loads its script with `<script type="module" src="...">`. Serve the page over http, or inline the module as in `docs/examples/motion-techniques/clay-3d/page.html`: browsers block a module file next to a file:// page.
- **Checks:** `node scripts/check-motion.mjs <page> --tier high`: the drawing is alive, honours reduced motion, pauses off screen, shows the fallback without 3D graphics, and the page's motion code stays within the 340 KB ceiling. Also lose and restore the context (`WEBGL_lose_context`) and confirm the fallback appears and the points come back.

**Re-forming by scroll (the particle morph).** The signature move of a whole family of WebGL template pages, read from their preview recordings on 2026-11-07: one cloud goes through a ring, an hourglass, a helix, a black hole and a galaxy, and carries the page from section to section. Four things make it, and all of them stay on the GPU:

- **One position per point per shape**, computed once and uploaded once as attributes of one buffer. A parametric shape (sphere, torus, helix, spiral disc) is computed in a loop like the one above. A shape from a model is sampled from its surface (three.js `MeshSurfaceSampler`) into the same layout, offline into a binary file and not on the main thread at load: 100,000 points are 1.2 MB per shape.
- **A per-point delay.** Each point carries its own number (the `aSeed` attribute of the `particle-system` skill, iart.ai, MIT); the shader turns the section's progress `f` into `smoothstep(d, d + 0.55, f)` with `d = seed * 0.45`, so the change ripples through the cloud instead of moving as one block.
- **Turbulence between shapes.** A field with no sinks (the curl of a sine potential: three cosines, no noise texture), added with a strength that peaks halfway between two shapes and is calm on each, so the cloud swirls without clumping. Curl noise from simplex noise reads richer and costs three noise samples per point per frame; the sine field held 400,000 points at 16.7 ms on an integrated GPU.
- **Scroll as eased time.** The section's progress sets a target and a critically damped spring carries the drawn morph to it (`recipes-motion.md` §16): it eases, never stops dead, never overshoots into the next shape.

**From a photograph, with a hole the pointer punches.** The catalogue's liquid sculpture: a photograph sampled into points, each point drawn in the picture's colour at its home, and the pointer pushing a hole through them that springs shut. Sample once on a small copy of the image (the `imageShape` of the `animaxxing-webgl` skill, John Polacek, MIT: draw it into a 240 px canvas, `getImageData`, keep a point per pixel past a threshold; the image must be same-origin or CORS-readable). In the vertex shader push each point away from the pointer by `normalize(p - m) * pow(max(0.0, R - length(p - m)) / R, 2.0) * k`, with `k` a uniform eased toward 1 while the hand moves and back to 0 when it rests, so the hole closes with a spring and not a cut. The pointer is the eased pointer of `recipes-motion.md` §28, idle path included. Not built on an example page here.

```js
// The layout: per point, shell xyz, ring xyz, helix xyz, disc xyz, seed. One buffer, five attributes.
const SHAPES = 4, stride = (SHAPES * 3 + 1) * 4;
['aShell', 'aRing', 'aHelix', 'aDisc'].forEach((name, k) => {
  const at = gl.getAttribLocation(prog, name);
  gl.enableVertexAttribArray(at);
  gl.vertexAttribPointer(at, 3, gl.FLOAT, false, stride, k * 12);
});
const seedAt = gl.getAttribLocation(prog, 'aSeed');
gl.enableVertexAttribArray(seedAt);
gl.vertexAttribPointer(seedAt, 1, gl.FLOAT, false, stride, SHAPES * 12);

// The scroll sets a target; a spring carries the drawn morph (0 = shell ... 3 = disc). step(dt) runs in draw.
let target = 0, morph = 0, speed = 0;
addEventListener('scroll', () => { target = progressOf(section) * (SHAPES - 1); }, { passive: true });
function step(dt) { const k = 60, d = 2 * Math.sqrt(k); speed += (k * (target - morph) - d * speed) * dt; morph += speed * dt; }
```

```glsl
in vec3 aShell, aRing, aHelix, aDisc;
in float aSeed;
uniform float uTime, uMorph;
vec3 shape(int k) { return k == 0 ? aShell : k == 1 ? aRing : k == 2 ? aHelix : aDisc; }
vec3 curl(vec3 p, float t) {                        // the curl of a sine potential: no sinks, so no clumps
  vec3 a = vec3(1.7, 2.3, 1.9);
  return -a.yzx * cos(p.zxy * a.yzx + t);
}
void main() {
  int i = int(min(floor(uMorph), 2.0));
  float f = uMorph - float(i);
  float d = aSeed * 0.45, k = smoothstep(d, d + 0.55, f);            // each point leaves on its own delay
  vec3 p = mix(shape(i), shape(i + 1), k);
  p += curl(p * 1.3, uTime * 0.0004 + aSeed * 6.0) * (0.04 + 0.22 * sin(3.14159 * k)) * 0.12;
  // ...then project p as in the recipe above: nearer points drawn larger, added on a dark ground
}
```

The whole page is `docs/examples/motion-techniques/particle-morph/page.html`. The chapters are text in the HTML beside a sticky stage, so they read without the drawing; under reduced motion the section shrinks to its text and the shell stands still.

- **Points:** the example takes the count as a URL parameter (`?n=200000`), so the cost can be read on the target device before a number is chosen. Past about 100,000 points that also need a velocity of their own (flocking, collisions, a pointer that pushes them), keep the state in textures updated each frame (three.js `GPUComputationRenderer`, or TSL `compute()` on WebGPU); a morph between fixed shapes does not need it.
- **Pixels:** the loop is capped at `maxDpr: 1.5`: points are filled pixel by pixel, and additive blending touches every pixel again.
- **A weak device:** on a software renderer the morph ran at 9 to 12 frames a second. Read the renderer once (`WEBGL_debug_renderer_info`; "SwiftShader" or "llvmpipe" means no usable chip) and draw the poster, or halve the count.

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- docs/examples/motion-techniques/particle-morph/page.html, the example page built for this card, served compressed over http and probed 2026-11-07: motion code 11 KB, 9 KB in all; Intel UHD GPU through ANGLE (Direct3D11), median frame 16.7 ms and slowest 5 % 16.7 ms at 60,000 points, 16.8 ms at 200,000 and 400,000; SwiftShader (software) about 12 frames a second at 60,000 points and 9 at 200,000; reduced motion honoured, pauses off screen, fallback without WebGL, all four chapters readable without scripts; the wheel recording reached the end with no stalls.
- activetheory.net, probed 2026-10-14: motion code of the page 340 KB, one site; one drawing, median frame 16.7 ms, slowest 5 % 16.9 ms, on an Intel UHD GPU through ANGLE (Direct3D11); reduced motion honoured 0 %, fallback without WebGL 100 %; off-screen pausing could not be judged.

## Liquid morph

### What it is

Shapes that stretch toward each other, pinch off and merge again, like thick drops of liquid with a soft body.

### Where it comes from

The merging shapes come from metaballs, organic-looking forms that meld together when they come close; the technique was invented by Jim Blinn in the early 1980s to model atom interactions for Carl Sagan's 1980 series Cosmos, and designers also call it the jelly effect ([Wikipedia, Metaballs](https://en.wikipedia.org/wiki/Metaballs)).

### Suits

Calm, friendly and soft-technology brands: [Blob / fluid organic shapes](../identities/digital.md#blob--fluid-organic-shapes), [Aurora / mesh gradients](../identities/digital.md#aurora--mesh-gradients), [Generative / creative-coding](../identities/digital.md#generative--creative-coding).

### What it costs the visitor

not measured: no production site was found that ships this effect.

### Lighter version

The Fast version, [Liquid morph](fast.md#liquid-morph), is the lighter one: the same merging shapes drawn as an SVG filter, without the lit, thick-drop body.

### For the builder

One triangle that covers the screen, and a program that runs once for every pixel. Each ball adds its radius squared over its distance squared to a field; the liquid's surface is where the field reaches 1, so two balls that come close add up past 1 between them and join. No library.

```html
<canvas id="liquid" style="width:100%;height:100%;color:#1d3fbb;background:#f3eee6"></canvas>
<svg id="liquid-fallback" hidden><!-- the Fast version: the SVG filter card --></svg>
<script src="canvas-loop.js"></script>
<script type="module" src="liquid.js"></script>
```

```js
const canvas = document.getElementById('liquid');

// One triangle that covers the screen; the fragment shader does all the work for every pixel.
const VERTEX = `#version 300 es
void main() {
  vec2 p = vec2(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0);
  gl_Position = vec4(p, 0.0, 1.0);
}`;
// Metaballs: every ball adds r² / distance² to a field, and the liquid's surface is where the field reaches 1.
// Two balls close together add up past 1 between them, which is what makes them merge.
const FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uInk, uGround;
out vec4 outColor;
void main() {
  vec2 p = (gl_FragCoord.xy / uRes - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  float field = 0.0;
  for (int i = 0; i < 6; i++) {
    float k = float(i);
    vec2 c = 0.30 * vec2(sin(uTime * 0.0007 * (1.0 + k * 0.37) + k * 2.1), cos(uTime * 0.0009 * (1.0 + k * 0.23) + k * 1.3));
    float r = 0.10 + 0.03 * sin(k * 3.0);
    field += r * r / dot(p - c, p - c);
  }
  float edge = smoothstep(1.0, 1.04, field);                    // the soft edge of the surface
  float body = smoothstep(1.0, 3.0, field);                     // deeper inside is lighter, like a thick drop
  vec3 liquid = mix(uInk * 0.75, uInk * 1.25, body);
  outColor = vec4(mix(uGround, liquid, edge), 1.0);
}`;

function program(gl, vertexSource, fragmentSource) {
  const shader = (type, source) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));   // a throw shows the fallback
    return s;
  };
  const p = gl.createProgram();
  gl.attachShader(p, shader(gl.VERTEX_SHADER, vertexSource));
  gl.attachShader(p, shader(gl.FRAGMENT_SHADER, fragmentSource));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  return p;
}

const rgb = (css) => css.match(/[\d.]+/g).slice(0, 3).map((v) => v / 255);
let gpu = null;
function frame(gl, t) {
  if (!gpu) {
    const prog = program(gl, VERTEX, FRAGMENT);
    const u = (name) => gl.getUniformLocation(prog, name);
    gpu = { prog, vao: gl.createVertexArray(), uRes: u('uRes'), uTime: u('uTime'), uInk: u('uInk'), uGround: u('uGround') };
  }
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.useProgram(gpu.prog);
  gl.bindVertexArray(gpu.vao);
  gl.uniform2f(gpu.uRes, canvas.width, canvas.height);
  gl.uniform1f(gpu.uTime, t);
  gl.uniform3f(gpu.uInk, ...rgb(getComputedStyle(canvas).color));
  gl.uniform3f(gpu.uGround, ...rgb(getComputedStyle(canvas).backgroundColor));
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

dfCanvasLoop(canvas, {
  context: 'webgl2',
  draw: (t, gl) => frame(gl, t),
  poster: (gl) => frame(gl, 0),
  restore: () => { gpu = null; },
  fallback: '#liquid-fallback',
});
```

The cost grows with the number of pixels, not of balls: on a large screen render at a lower `maxDpr` (the loop's option) before cutting balls. The ink and ground colours are read from the canvas's own CSS `color` and `background-color`, so dark mode follows the page.

- **Poster frame:** `frame(gl, 0)`: the balls at their start positions.
- **Reduced motion:** the contract in `recipes-motion.md` §14; the loop draws the poster once and never calls `draw`.
- **Colour:** the colour is read from the page with `getComputedStyle(...)` and split by a pattern that expects `rgb()` or `rgba()`, which is what a browser returns for ordinary CSS colours. A colour written as `oklch()`, `color-mix()` or `color()` may come back in another form and give wrong numbers. In that case paint the colour onto a one-pixel 2D drawing area with `fillStyle`, read the pixel, and use its three values.
- **Serving:** the recipe loads its script with `<script type="module" src="...">`. Serve the page over http, or inline the module as in `docs/examples/motion-techniques/clay-3d/page.html`: browsers block a module file next to a file:// page.
- **Checks:** `node scripts/check-motion.mjs <page> --tier high`: the drawing is alive, honours reduced motion, pauses off screen, shows the fallback without 3D graphics, and the page's motion code stays within the 340 KB ceiling. Also lose and restore the context and confirm the shapes come back.

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- No site was found that ships this effect, so none was probed. Cost not measured.

## Holographic

### What it is

A solid object whose rainbow colour shifts as it turns, the way a foil card changes when you tilt it.

### Where it comes from

Iridescence is the phenomenon of certain surfaces that appear gradually to change colour as the angle of view or of illumination changes, caused by wave interference of light in microstructures or thin films; soap bubbles, feathers, butterfly wings and opal are examples ([Wikipedia, Iridescence](https://en.wikipedia.org/wiki/Iridescence)).

### Suits

Collectible, beauty and music brands that sell novelty and premium: [Holographic / iridescent](../identities/digital.md#holographic--iridescent), [Y2K aesthetic](../identities/digital.md#y2k-aesthetic), [Cybercore](../identities/digital.md#cybercore).

### What it costs the visitor

On one site (activetheory.net, measured 2026-10-14, the same page and the same drawing as the Particles card) the page's motion code weighed 340 KB, which is the High ceiling itself. The drawing ran at a median frame of 16.7 ms on an Intel UHD GPU, but kept moving when reduced motion was asked for (0 % honoured); a fallback showed when 3D graphics were missing (100 %) ([benchmarks](../benchmarks.md#canvas-and-webgl-measured-2026-10-15)).

### Lighter version

The Fast version, [Holographic](fast.md#holographic), is the lighter one: a turning rainbow gradient on a flat card, without a solid that rotates.

### For the builder

A three.js scene with one object and a small custom material. An iridescent material is a colour that depends on the angle you look from: the angle between the surface and the eye picks a place on a rainbow, and the rim, seen edge-on, is pushed brighter. Pin the library version you tested (this was run on r170) and copy `three.module.min.js` from the package's `build/` folder next to the page.

```html
<canvas id="holo" style="width:100%;height:100%"></canvas>
<div id="holo-fallback" hidden><!-- the Fast version: the conic-gradient card --></div>
<script src="canvas-loop.js"></script>
<script type="module" src="holo.js"></script>
```

```js
import * as THREE from './three.module.min.js';

const canvas = document.getElementById('holo');

// An iridescent material is a colour that depends on the angle you look from. The angle between the surface
// and the eye picks a place on a rainbow, and the rim, seen edge-on, is pushed brighter.
const material = new THREE.ShaderMaterial({
  uniforms: { uTime: { value: 0 } },
  vertexShader: `
    varying vec3 vNormal, vView, vPos;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vNormal = normalize(normalMatrix * normal);
      vView = normalize(-mv.xyz);
      vPos = position;
      gl_Position = projectionMatrix * mv;
    }`,
  fragmentShader: `
    uniform float uTime;
    varying vec3 vNormal, vView, vPos;
    void main() {
      float facing = dot(normalize(vNormal), normalize(vView));              // 1 face-on, 0 edge-on
      vec3 hue = 0.5 + 0.5 * cos(6.2832 * (facing * 1.6 + uTime * 0.00004 + vec3(0.0, 0.33, 0.67)));
      float foil = 0.06 * sin(vPos.y * 38.0 + vPos.x * 11.0);                // fine grain, like printed foil
      float rim = pow(1.0 - abs(facing), 2.0);
      gl_FragColor = vec4(mix(hue * 0.6, hue + 0.35, rim) + foil, 1.0);
      #include <colorspace_fragment>
    }`,
});

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
camera.position.set(0, 0, 6);
const knot = new THREE.Mesh(new THREE.TorusKnotGeometry(1, 0.34, 220, 32, 2, 3), material);
scene.add(knot);

let renderer = null;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch { /* no 3D graphics: the loop shows the fallback */ }

let width = 0, height = 0;
function render(t) {
  if (canvas.width !== width || canvas.height !== height) {
    width = canvas.width; height = canvas.height;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  material.uniforms.uTime.value = t;
  knot.rotation.set(0.5, t * 0.0004, 0);
  renderer.render(scene, camera);
}

dfCanvasLoop(canvas, {
  context: 'webgl2',
  draw: (t) => render(t),
  poster: () => render(0),
  restore: (gl) => gl.viewport(0, 0, canvas.width, canvas.height),      // see the Clay 3D card: the restored viewport is not the canvas size
  fallback: '#holo-fallback',
});
```

The renderer is created before the loop so that the library, not the loop, decides the context's options; the loop then asks for the same context. The library weighs about 167 KB compressed (675 KB as a plain file) and counts as the page's motion code: see the Clay 3D card for what that does to the High ceiling. When a page already loads it for another scene, this card adds only the few lines above.

- **Poster frame:** `render(0)`: the knot at its start pose and colour.
- **Reduced motion:** the contract in `recipes-motion.md` §14; the loop draws the poster once and never calls `draw`.
- **Serving:** the recipe loads its script with `<script type="module" src="...">`. Serve the page over http, or inline the module as in `docs/examples/motion-techniques/clay-3d/page.html`: browsers block a module file next to a file:// page.
- **Checks:** `node scripts/check-motion.mjs <page> --tier high`: the drawing is alive, honours reduced motion, pauses off screen, shows the fallback without 3D graphics, and the page's motion code stays within the 340 KB ceiling. Also lose and restore the context and confirm the knot comes back at full size.

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- activetheory.net, probed 2026-10-14: motion code of the page 340 KB, one site, the same page and drawing as the Particles card; median frame 16.7 ms, slowest 5 % 16.9 ms, on an Intel UHD GPU through ANGLE (Direct3D11); reduced motion honoured 0 %, fallback without WebGL 100 %.

## Wireframe 3D

### What it is

A solid object drawn as bare edges, with nothing between them, turning slowly in real depth.

### Where it comes from

The term wire frame comes from designers using metal wire to represent the three-dimensional shape of solid objects; the computer model draws only the edges where surfaces meet ([Wikipedia, Wire-frame model](https://en.wikipedia.org/wiki/Wire-frame_model)).

### Suits

Technical, plan-like and sci-fi brands: [Low-poly](../identities/digital.md#low-poly), [Blueprint / cyanotype](../identities/print-craft.md#blueprint--cyanotype), [Cyberpunk](../identities/digital.md#cyberpunk).

### What it costs the visitor

On one site (spline.design, measured 2026-10-14) the page's motion code weighed 180 KB, under the 340 KB High ceiling. Its scene was a grid floor drawn through a newer graphics path whose renderer could not be named; its three animated drawings had a median frame of 16.7 ms and 33.4 ms for the slowest 5 % of frames, and two of the three honoured reduced motion (67 %) ([benchmarks](../benchmarks.md#canvas-and-webgl-measured-2026-10-15)).

### Lighter version

The Fast version, [Wireframe 3D](fast.md#wireframe-3d), is the lighter one: a cube of bordered faces turned by CSS, good for boxes and flat plates but not for curved objects.

### For the builder

A three.js scene of two line models: the edges of an icosahedron and of a cube, turning in opposite directions so the two lattices cross. Edges only: take the solid, keep the lines where its faces meet, and throw the faces away. Pin the library version you tested (this was run on r170).

```html
<canvas id="wire" style="width:100%;height:100%"></canvas>
<div id="wire-fallback" hidden><!-- the Fast version: the CSS cube card --></div>
<script src="canvas-loop.js"></script>
<script type="module" src="wire.js"></script>
```

```js
import * as THREE from './three.module.min.js';

const canvas = document.getElementById('wire');

// Edges only: take the solid, keep the lines where its faces meet, and throw the faces away.
const outer = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(1.3, 1)),
  new THREE.LineBasicMaterial({ color: 0x14141a }),
);
const inner = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)),
  new THREE.LineBasicMaterial({ color: 0x14141a, transparent: true, opacity: 0.55 }),
);
const scene = new THREE.Scene();
scene.add(outer, inner);
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
camera.position.set(0, 0, 6);

let renderer = null;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch { /* no 3D graphics: the loop shows the fallback */ }

let width = 0, height = 0;
function render(t) {
  if (canvas.width !== width || canvas.height !== height) {
    width = canvas.width; height = canvas.height;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  outer.rotation.set(0.4, t * 0.0003, 0);
  inner.rotation.set(-0.3, t * -0.0006, 0.2);                    // turns the other way, so the two lattices cross
  renderer.render(scene, camera);
}

dfCanvasLoop(canvas, {
  context: 'webgl2',
  draw: (t) => render(t),
  poster: () => render(0),
  restore: (gl) => gl.viewport(0, 0, canvas.width, canvas.height),      // see the Clay 3D card: the restored viewport is not the canvas size
  fallback: '#wire-fallback',
});
```

Lines are one pixel wide whatever the screen, so they stay fine on a sharp display. Pass your own geometry to `EdgesGeometry` to draw any model as wire; its second argument is the angle below which an edge is dropped, so a smooth model shows only its silhouette creases. The library's weight counts as the page's motion code: see the Clay 3D card.

**An exploded view, and a scan front.** Two moves of the component catalogue read on 2026-11-08, both for a model with parts. *Exploded:* give each part its own `EdgesGeometry` and an outward direction (its centre minus the model's), and set `part.position = base + dir * k * explode(p)`, where `p` is the section's progress through a spring (`recipes-motion.md` §16) and `explode` rises and falls once, so the lens comes apart and goes back together as the page scrolls past. *Scan front* (the `build-wireframe-scan-reveal` skill, Meng To, MIT): the solid and a temporary wire cage made from the same geometry share one world-space origin and radius; the solid discards fragments beyond the front minus a lag, so the cage arrives first and the surface fills in behind it:

```glsl
// Solid: unscanned beyond the front, with a lag and two long sine terms so the front is not a perfect circle.
float wob = sin(vWorld.y * .011 + vWorld.x * .007) * 36.0 + sin(vWorld.z * .021 + vWorld.y * .013) * 17.0;
if (uScanOn > .5 && distance(vWorld, uOrigin) > uRadius - 520.0 + wob) discard;
// Cage (additive, depthWrite false): a rim riding the front and a fading trail behind it.
float d = distance(vWorld, uOrigin);
float a = (exp(-pow((d - uRadius) / 135.0, 2.0)) * 1.6 + smoothstep(uRadius, uRadius - 950.0, d) * .34) * uWire;
```

The skill's landed numbers, in its scene's units: 3.4 s, the radius eased by `1 - (1 - t)^1.35` to the scene's diagonal x 1.3 + 900, the cage on over the first 6 % and burnt off over the last 28 %, then removed and its geometry and material disposed (hidden by opacity it still costs a draw). Start the front outside the silhouette, low and to one side: a centred origin reads as a loading ring. Under reduced motion show a composed still at 62 % of the radius, cage and solid both visible, with a replay button that resets it. Neither move was built on an example page here; the skill itself says not to claim a cost without profiling the cage pass, so profile it on the page that uses it.

- **Poster frame:** `render(0)`: both lattices at their start rotation.
- **Reduced motion:** the contract in `recipes-motion.md` §14; the loop draws the poster once and never calls `draw`.
- **Serving:** the recipe loads its script with `<script type="module" src="...">`. Serve the page over http, or inline the module as in `docs/examples/motion-techniques/clay-3d/page.html`: browsers block a module file next to a file:// page.
- **Checks:** `node scripts/check-motion.mjs <page> --tier high`: the drawing is alive, honours reduced motion, pauses off screen, shows the fallback without 3D graphics, and the page's motion code stays within the 340 KB ceiling. Also lose and restore the context and confirm the lattices come back.

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- spline.design, probed 2026-10-14: motion code of the page 180 KB, one site; a grid floor in a WebGPU scene, three animated drawings, median frame 16.7 ms, slowest 5 % 33.4 ms (renderer not nameable: WebGPU or a worker); reduced motion honoured 67 %.

## Gradient mesh

### What it is

A full-screen field of colour that flows slowly, with pools of colour that blend into each other and no edges anywhere.

### Where it comes from

In vector graphics a gradient can be spread over a mesh of points instead of along one line, and Adobe Illustrator supports such gradient meshes ([Wikipedia, Color gradient](https://en.wikipedia.org/wiki/Color_gradient)). The High version here does not use a mesh: it computes the colour of every pixel from a few moving colour points.

### Suits

Fintech, AI and launch pages that want warmth and energy: [Aurora / mesh gradients](../identities/digital.md#aurora--mesh-gradients), [Gradient-grain](../identities/digital.md#gradient-grain), [Generative / creative-coding](../identities/digital.md#generative--creative-coding).

### What it costs the visitor

On two sites (stripe.com and raycast.com, measured 2026-10-14) the page's motion code weighed 315 KB and 282 KB, median 299 KB, both under the 340 KB High ceiling. Across seven animated drawings 50 % honoured reduced motion, 86 % paused when off screen and a fallback showed without 3D graphics in 100 %. The median frame was 16.7 ms, but on the raycast.com hero it was 49.9 ms with 216.6 ms for the slowest 5 % of frames, on an Intel UHD GPU. That is one drawing on one site, so read it as a warning that a full-screen drawing can be slow, not as a rule; the same raycast.com measurement is used in the [Glassmorphism Medium card](medium.md#glassmorphism) (see the [benchmarks](../benchmarks.md#canvas-and-webgl-measured-2026-10-15)).

### Lighter version

The Fast version, [Gradient mesh](fast.md#gradient-mesh), is the lighter one: three large colour pools drifting by CSS, with no per-pixel blending and no grain.

### For the builder

One triangle that covers the screen, and a program that runs once for every pixel. Five colours sit at moving points; each pixel takes a blend of all five, weighted by one over the distance squared, so the colour near a point is that point's and changes smoothly in between. A slight bend of the coordinates stops the pools being circles, and a little grain hides banding. No library.

```html
<canvas id="mesh" style="width:100%;height:100%"></canvas>
<div id="mesh-fallback" hidden><!-- the Fast version: the CSS pools card --></div>
<script src="canvas-loop.js"></script>
<script type="module" src="mesh.js"></script>
```

```js
const canvas = document.getElementById('mesh');

const VERTEX = `#version 300 es
void main() {
  vec2 p = vec2(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0);
  gl_Position = vec4(p, 0.0, 1.0);
}`;
// Five colours sit at moving points. Each pixel takes a blend of all five, weighted by 1 / distance², so the
// colour near a point is that point's and changes smoothly in between: no edge, no stops.
const FRAGMENT = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform vec3 uColor[5];
out vec4 outColor;
float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float t = uTime * 0.0003;
  uv += 0.05 * vec2(sin(uv.y * 4.0 + t * 2.0), cos(uv.x * 5.0 - t * 1.6));       // bends the pools so none is a circle
  vec3 sum = vec3(0.0);
  float weight = 0.0;
  for (int i = 0; i < 5; i++) {
    float k = float(i);
    vec2 c = 0.5 + 0.38 * vec2(sin(t * (0.7 + k * 0.23) + k * 1.9), cos(t * (0.9 + k * 0.17) + k * 2.7));
    float w = 1.0 / pow(dot(uv - c, uv - c) + 0.02, 1.6);
    sum += uColor[i] * w;
    weight += w;
  }
  vec3 col = sum / weight;
  col += (hash(gl_FragCoord.xy) - 0.5) * 0.03;                                   // a little grain hides banding
  outColor = vec4(col, 1.0);
}`;

function program(gl, vertexSource, fragmentSource) {
  const shader = (type, source) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, source);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));   // a throw shows the fallback
    return s;
  };
  const p = gl.createProgram();
  gl.attachShader(p, shader(gl.VERTEX_SHADER, vertexSource));
  gl.attachShader(p, shader(gl.FRAGMENT_SHADER, fragmentSource));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  return p;
}

const COLORS = ['#ff5f8f', '#5f7bff', '#2ee6c4', '#ffb86b', '#9b6bff'].map((h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255));
let gpu = null;
function frame(gl, t) {
  if (!gpu) {
    const prog = program(gl, VERTEX, FRAGMENT);
    const u = (name) => gl.getUniformLocation(prog, name);
    gpu = { prog, vao: gl.createVertexArray(), uRes: u('uRes'), uTime: u('uTime'), uColor: u('uColor') };
  }
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.useProgram(gpu.prog);
  gl.bindVertexArray(gpu.vao);
  gl.uniform2f(gpu.uRes, canvas.width, canvas.height);
  gl.uniform1f(gpu.uTime, t);
  gl.uniform3fv(gpu.uColor, COLORS.flat());
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

dfCanvasLoop(canvas, {
  context: 'webgl2',
  draw: (t, gl) => frame(gl, t),
  poster: (gl) => frame(gl, 0),
  restore: () => { gpu = null; },
  fallback: '#mesh-fallback',
});
```

The cost grows with the number of pixels, so on a full-screen hero lower the loop's `maxDpr` before anything else; the blend is smooth, so a lower resolution shows little. Put text over the quietest region and check its contrast against the brightest pool that can pass under it.

- **Poster frame:** `frame(gl, 0)`: the pools at their start positions.
- **Reduced motion:** the contract in `recipes-motion.md` §14; the loop draws the poster once and never calls `draw`, and the loop pauses off screen, which is what keeps a full-screen drawing from running below the fold.
- **Serving:** the recipe loads its script with `<script type="module" src="...">`. Serve the page over http, or inline the module as in `docs/examples/motion-techniques/clay-3d/page.html`: browsers block a module file next to a file:// page.
- **Checks:** `node scripts/check-motion.mjs <page> --tier high`: the drawing is alive, honours reduced motion, pauses off screen, shows the fallback without 3D graphics, and the page's motion code stays within the 340 KB ceiling. Then read the frame time on the slowest hardware you can reach; the measured hero is the warning.

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- stripe.com, probed 2026-10-14: motion code of the page 315 KB, the gradient in its hero.
- raycast.com, probed 2026-10-14: motion code of the page 282 KB; its hero drawing had a median frame of 49.9 ms and 216.6 ms for the slowest 5 % of frames on an Intel UHD GPU through ANGLE (Direct3D11).
- Both together: seven animated drawings, reduced motion honoured 50 %, pauses off screen 86 %, fallback without WebGL 100 %.

## Clay 3D

### What it is

Soft, matte lumps that look hand-modelled out of clay, turning slowly and catching a gentle highlight.

### Where it comes from

William Harbutt developed plasticine in 1897, and Segundo de Chomón's film Sculpteur Moderne, released on 31 January 1908, shows heaps of clay moulding themselves into sculptures ([Wikipedia, Clay animation](https://en.wikipedia.org/wiki/Clay_animation)).

### Suits

Friendly, touchable brands that want a handmade 3D object: [Claymorphism](../identities/digital.md#claymorphism), [Kawaii](../identities/cultural.md#kawaii), [Low-poly](../identities/digital.md#low-poly).

### What it costs the visitor

On two sites (spline.design and github.com, measured 2026-10-14) the page's motion code weighed 180 KB and 640 KB, median 410 KB. The 640 KB one is nearly twice the 340 KB High ceiling. Across four animated drawings 75 % honoured reduced motion, and a fallback showed without 3D graphics in 100 %; the one drawing whose renderer could be named ran at a median frame of 16.7 ms and 17 ms for the slowest 5 % of frames, on an Intel UHD GPU ([benchmarks](../benchmarks.md#canvas-and-webgl-measured-2026-10-15)).

### Lighter version

No lighter version: clay is a lit, rounded solid you can turn, and no flat CSS or SVG recipe makes a surface read as one. The fallback is the poster frame, saved as a picture.

### For the builder

This recipe runs. It uses three.js with a matcap material: the colour of each point is read from a small picture by the direction the surface faces, so there are no lights, no shadows and no environment map to load, and the picture is drawn in code, so there is no image to download. The lump is a sphere pushed in and out by sine waves, with its normals computed from the lumpy shape, so it shades smooth with no seam. The renderer is created first so that the library decides the context's options; the loop then asks for the same context. The poster is one fixed-time frame, the fallback is a picture of it, and the loop pauses the drawing off screen and under reduced motion. Pin the library version you tested (this ran on r170) and copy `three.module.min.js` from the package's `build/` folder next to the page.

```html
<div class="stage" style="position:relative;height:420px">
  <canvas id="clay" style="width:100%;height:100%"></canvas>
  <img id="clay-fallback" src="clay-poster.jpg" alt="Three soft clay lumps" hidden style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover">
</div>
<script src="canvas-loop.js"></script>
<script type="module" src="clay.js"></script>
```

```js
import * as THREE from './three.module.min.js';

const canvas = document.getElementById('clay');

// A matcap made in code: one lit sphere drawn once on a small 2D canvas, so there is no image to download.
// The material reads its colour from this picture by the direction the surface faces, so it needs no lights.
function makeMatcap() {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const sphere = g.createRadialGradient(100, 88, 6, 128, 128, 132);   // light from the upper left
  sphere.addColorStop(0, '#fff1e4');
  sphere.addColorStop(0.45, '#e9a07a');
  sphere.addColorStop(1, '#6a392a');
  g.fillStyle = sphere;
  g.fillRect(0, 0, 256, 256);
  const texture = new THREE.CanvasTexture(c);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// A lump: a sphere pushed in and out by a few sine waves, once. Clay is never perfectly round.
const bump = (v) => 1 + 0.12 * Math.sin(v.x * 3 + 1) * Math.cos(v.y * 2.5) + 0.08 * Math.sin(v.z * 4 + v.x * 2);
function makeLump() {
  const geometry = new THREE.IcosahedronGeometry(1, 6);
  const pos = geometry.attributes.position;
  const normals = new Float32Array(pos.count * 3);
  const v = new THREE.Vector3(), t1 = new THREE.Vector3(), t2 = new THREE.Vector3();
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const at = (dir, out) => out.copy(dir).multiplyScalar(bump(dir));
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    t1.set(v.y, -v.x, 0.001).cross(v).normalize();            // two directions along the surface
    t2.copy(v).cross(t1).normalize();
    at(v, a);
    at(b.copy(v).addScaledVector(t1, 0.01).normalize(), b);
    at(c.copy(v).addScaledVector(t2, 0.01).normalize(), c);
    b.sub(a); c.sub(a);
    b.cross(c).normalize();                                    // the real normal of the lumpy surface, so it shades smooth
    if (b.dot(v) < 0) b.negate();
    pos.setXYZ(i, a.x, a.y, a.z);
    normals.set([b.x, b.y, b.z], i * 3);
  }
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
  return geometry;
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 50);
camera.position.set(0, 0, 6);
const material = new THREE.MeshMatcapMaterial({ matcap: makeMatcap() });
const geometry = makeLump();
const big = new THREE.Mesh(geometry, material);
const small = new THREE.Mesh(geometry, material);
const tiny = new THREE.Mesh(geometry, material);
small.scale.setScalar(0.45); small.position.set(1.7, -0.7, 0.4);
tiny.scale.setScalar(0.28);  tiny.position.set(-1.6, 0.9, 0.6);
scene.add(big, small, tiny);

// Create the renderer first: it makes the WebGL 2 context, and the loop then asks for the same one.
let renderer = null;
try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch { /* no 3D graphics: the loop shows the fallback */ }

let width = 0, height = 0;
function render(t) {
  if (canvas.width !== width || canvas.height !== height) {      // the loop owns the size of the backing store
    width = canvas.width; height = canvas.height;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }
  big.rotation.set(0.3, t * 0.0003, 0);
  big.scale.setScalar(1 + 0.015 * Math.sin(t * 0.0012));         // a slow breath
  small.rotation.y = t * -0.0005;
  tiny.rotation.x = t * 0.0006;
  renderer.render(scene, camera);
}

dfCanvasLoop(canvas, {
  context: 'webgl2',
  draw: (t) => render(t),
  poster: () => render(0),                                       // one fixed-time frame
  // After a lost context comes back, three rebuilds its programs and buffers itself, but the restored context's
  // viewport is not the canvas size and three does not know: set it, or it draws into a single pixel.
  restore: (gl) => gl.viewport(0, 0, canvas.width, canvas.height),
  fallback: '#clay-fallback',                                    // the poster saved as a picture
});
```

Save `clay-poster.jpg` once from the loop's own poster: open the page with reduced motion on, wait for `canvas.dataset.dfPoster === 'done'`, and take a screenshot of the stage. The fallback then shows exactly the picture the poster draws, so a visitor without 3D graphics sees the same still.

**How the library counts against the tier.** The weight check counts bytes as served. At r170 the library file is 675 KB as a plain file and about 167 KB compressed; the example page `docs/examples/motion-techniques/clay-3d/page.html` (library, loop and recipe) measured 182 KB served compressed, a little over half of the 340 KB High ceiling, and the check passed (the bare recipe page, without the example's poster picture and text, measured 173 KB). On a server that does not compress, the library alone is 675 KB, nearly twice the ceiling, and the check fails. So: serve it compressed, load it once for every scene on the page (the Holographic and Wireframe 3D cards add only a few lines to it), and keep the scene's own weight (models, textures) inside the remaining 158 KB. This recipe has no model and no texture file, which is why it fits.

- **Poster frame:** `render(0)`: the three lumps at their start pose, drawn once.
- **Reduced motion:** the contract in `recipes-motion.md` §14; the loop draws the poster once and never calls `draw`.
- **Serving:** the recipe loads its script with `<script type="module" src="...">`. Serve the page over http, or inline the module as in `docs/examples/motion-techniques/clay-3d/page.html`: browsers block a module file next to a file:// page.
- **Checks:** `node scripts/check-motion.mjs <page> --tier high` on this recipe's page: all four drawing checks passed (alive, honours reduced motion, pauses off screen, fallback without 3D graphics) and the weight was 182 KB against 340 KB, on the example page `docs/examples/motion-techniques/clay-3d/page.html`. The loss of the context was tested too: the fallback appeared, and after the context was restored the lumps drew again, which needs the `restore` line (the restored context's viewport is one pixel, and the library does not reset it).

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- spline.design and github.com, probed 2026-10-14: motion code of the page 180 KB and 640 KB (the table does not say which is which), four animated drawings in all; reduced motion honoured 75 %, fallback without WebGL 100 %. One drawing had a nameable renderer (an Intel UHD GPU through ANGLE, Direct3D11): median frame 16.7 ms, slowest 5 % 17 ms; the other three had a median of 16.7 ms and 33.4 ms for the slowest 5 % (WebGPU or a worker).

## Rendered 3D

### What it is

A model lit and rendered once, offline, in Blender, and shipped as pictures: a hero still, a short turntable the scroll turns, or a loop of a few seconds. The page draws no 3D at all, so the picture can have the light, the ink lines and the materials a live scene could not afford on a phone.

### Where it comes from

Pre-rendering is the film way of making 3D: each frame is computed ahead of time, so it can be richer than a device could draw live ([Wikipedia, Pre-rendering](https://en.wikipedia.org/wiki/Pre-rendering)).

### Suits

Products, characters and places that need to look modelled and lit rather than drawn: packaged goods, devices, comic and toon worlds ([Comic / manga panels](../identities/print-craft.md#comic--manga-panels), [Claymorphism](../identities/digital.md#claymorphism), [Low-poly](../identities/digital.md#low-poly)), and any identity whose live 3D would cost more than its picture.

### What it costs the visitor

Not measured on a production page yet. It costs what its pictures cost: one still is one image, and a scrubbed turntable is its frames times their size, so the frame count is the budget. Past a few dozen frames at full width, or a film, the technique is [Pre-rendered 3D film](yolo.md#pre-rendered-3d-film) on the YOLO tier.

### Lighter version

No lighter version: the lighter version is the same render as one still picture, which costs what any image costs.

### For the builder

Blender is the tool, run headless so the render can be repeated: the portable build (no installer) and one Python script kept in the project, `blender -b -P render.py`. Models, materials and HDRIs from CC0 sources (Poly Haven, Kenney, Quaternius, ambientCG), each recorded in the asset record (`images.md` §5) with its page and licence; no CC BY and no non-commercial files.

- **Concept first.** Nothing is modelled before its concept is approved, its look (materials and textures, colour, line, finish, marks) specified, its turnarounds checked by the author and its layer sheet drawn ([illustration-concept.md §0](../illustration-concept.md#0-concept-first)). A CC0 model is a piece of an approved inventory, retextured to the look, never a stand-in for one.
- **The look comes from the brief**, not from Blender's defaults. A drawn identity gets ink: Line Art or Freestyle for the contour, toon bands with a tinted shadow (a cool, saturated tint, never grey, which reads as dirt), and the Standard view transform so the flat colour you pick is the pixel you get. A product gets a soft key, a rim and one HDRI, matched to the page's ground.
- **The design hint** goes on the model only where the brief spends it (`recipes-design.md` §2): the subject's material, never the whole scene.
- **Frames:** WebP or AVIF at the size the page shows them, a poster frame first, the rest loaded after the first view. A turntable of 24 to 72 frames scrubbed by scroll is drawn to a canvas; a loop is a muted, `playsinline` video with a poster.
- **Floor:** under `prefers-reduced-motion: reduce` show the poster and do not scrub or play; without scripts the poster is an `<img>` with its alt text.
- Agent skills for Blender (toon and NPR shading, Line Art, Grease Pencil, lighting) can drive the scene, when the author has installed them; the render script and the asset record are what ship with the project.

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- Not measured on a production page yet; measure the shipped frames with `probe.mjs` and record them here.

## Halftone

### What it is

A picture, a video or a 3D scene turned into printed-looking dots that grow and shrink with its tone, on a slanted grid, while the picture underneath keeps moving.

### Where it comes from

William Fox Talbot is credited with the idea of halftone printing; the New York Daily Graphic published what is called the first newspaper reproduction of a photograph with a full range of tones on 4 March 1880, with a crude halftone screen ([Wikipedia, Halftone](https://en.wikipedia.org/wiki/Halftone)).

### Suits

Print, music and campaign brands: [Halftone / duotone](../identities/print-craft.md#halftone--duotone), [Risograph](../identities/print-craft.md#risograph), [Acid graphics](../identities/digital.md#acid-graphics).

### What it costs the visitor

not measured: no production site was probed for the High version; the one Halftone site that was probed ships the Medium one. Depending on the application this technique sits between Medium and High: it is High here because the tone changes every frame (video or a 3D scene), where the Medium card samples a picture once.

### Lighter version

The Medium version, [Halftone](medium.md#halftone), is the fallback: the same dot screen over a picture sampled once, drawn on a flat 2D surface. Below it, the Fast version in [fast.md](fast.md#halftone) is a plain CSS dot screen with no script.

### For the builder

The same dots as the Medium card, but worked out for every pixel by the GPU, so the source can change every frame at no extra cost to the page. Rotate the pixel grid, find the centre of the dot cell the pixel is in, read the source's tone there and draw a dot whose area follows the darkness. The source is any picture the browser can upload as a texture: an `<img>`, a `<video>`, or another drawing area holding a 3D render. Here a small 2D drawing stands in for a moving picture. No library.

```html
<canvas id="halftone" style="width:100%;height:100%"></canvas>
<div id="halftone-fallback" hidden><!-- the Medium or Fast version --></div>
<script src="canvas-loop.js"></script>
<script type="module" src="halftone.js"></script>
```

```js
const canvas = document.getElementById('halftone');

// The source of the tone can be anything the browser can upload as a texture: an <img>, a <video>, or another
// drawing area holding a 3D render. Here a small 2D drawing stands in for a moving picture.
const source = document.createElement('canvas');
source.width = 320; source.height = 180;
const sc = source.getContext('2d');
function paintSource(t) {
  sc.fillStyle = '#d9d2c4'; sc.fillRect(0, 0, 320, 180);
  const x = 160 + 90 * Math.sin(t * 0.0007), y = 90 + 40 * Math.cos(t * 0.0009);
  const g = sc.createRadialGradient(x, y, 4, x, y, 90);
  g.addColorStop(0, '#111'); g.addColorStop(1, '#d9d2c4');
  sc.fillStyle = g; sc.fillRect(0, 0, 320, 180);
}

const VERTEX = `#version 300 es
void main() {
  vec2 p = vec2(gl_VertexID == 1 ? 3.0 : -1.0, gl_VertexID == 2 ? 3.0 : -1.0);
  gl_Position = vec4(p, 0.0, 1.0);
}`;
// Rotate the pixel grid, find the centre of the dot cell this pixel is in, read the picture's tone there, and
// draw a dot whose area follows the darkness. fwidth() keeps the dot edge one pixel soft at any resolution.
const FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D uTone;
uniform vec2 uRes;
uniform float uPitch;
uniform vec3 uInk, uPaper;
out vec4 outColor;
void main() {
  float a = 0.7853982;                                           // 45 degrees, the classic screen angle
  mat2 rot = mat2(cos(a), -sin(a), sin(a), cos(a));
  vec2 cell = floor(rot * gl_FragCoord.xy / uPitch) + 0.5;
  vec2 centre = transpose(rot) * (cell * uPitch);
  vec3 tone = texture(uTone, centre / uRes).rgb;
  float dark = 1.0 - dot(tone, vec3(0.2126, 0.7152, 0.0722));
  float radius = sqrt(dark) * uPitch * 0.72;                     // area follows tone
  float d = length(gl_FragCoord.xy - centre);
  float dotMask = 1.0 - smoothstep(radius - fwidth(d), radius + fwidth(d), d);
  outColor = vec4(mix(uPaper, uInk, dotMask), 1.0);
}`;

function program(gl, vertexSource, fragmentSource) {
  const shader = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));   // a throw shows the fallback
    return s;
  };
  const p = gl.createProgram();
  gl.attachShader(p, shader(gl.VERTEX_SHADER, vertexSource));
  gl.attachShader(p, shader(gl.FRAGMENT_SHADER, fragmentSource));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  return p;
}

let gpu = null;
function frame(gl, t) {
  if (!gpu) {
    const prog = program(gl, VERTEX, FRAGMENT);
    const u = (name) => gl.getUniformLocation(prog, name);
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gpu = { prog, texture, vao: gl.createVertexArray(), uTone: u('uTone'), uRes: u('uRes'), uPitch: u('uPitch'), uInk: u('uInk'), uPaper: u('uPaper') };
  }
  paintSource(t);                                                // for a <video>, nothing to paint: upload it as it is
  gl.bindTexture(gl.TEXTURE_2D, gpu.texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);   // one upload per frame

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.useProgram(gpu.prog);
  gl.bindVertexArray(gpu.vao);
  gl.uniform1i(gpu.uTone, 0);
  gl.uniform2f(gpu.uRes, canvas.width, canvas.height);
  gl.uniform1f(gpu.uPitch, 9 * (canvas.width / canvas.clientWidth));    // dot spacing in CSS pixels, scaled to the screen
  gl.uniform3f(gpu.uInk, 0.07, 0.07, 0.07);
  gl.uniform3f(gpu.uPaper, 0.96, 0.94, 0.89);
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

dfCanvasLoop(canvas, {
  context: 'webgl2',
  draw: (t, gl) => frame(gl, t),
  poster: (gl) => frame(gl, 0),
  restore: () => { gpu = null; },                                // the texture is gone with the old context: rebuild it
  fallback: '#halftone-fallback',
});
```

For a `<video>`, delete `paintSource`, make `source` the video element, and upload only when `source.readyState >= 2`; the same `texImage2D` call takes it. For a still image the upload can move inside the `if (!gpu)` block and run once. The texture belongs to the context, so `restore` clears `gpu` and the next frame creates it again.

- **Poster frame:** `frame(gl, 0)`: the source at its first frame, as dots.
- **Reduced motion:** the contract in `recipes-motion.md` §14; the loop draws the poster once and never calls `draw`, so a video under the dots stops being uploaded too.
- **Serving:** the recipe loads its script with `<script type="module" src="...">`. Serve the page over http, or inline the module as in `docs/examples/motion-techniques/clay-3d/page.html`: browsers block a module file next to a file:// page.
- **Checks:** `node scripts/check-motion.mjs <page> --tier high`: the drawing is alive, honours reduced motion, pauses off screen, shows the fallback without 3D graphics, and the page's motion code stays within the 340 KB ceiling. Then confirm the dots stay round and separate at the real size on a sharp display (`verification.md`, "Probe, do not squint").

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- No site was probed for the High version. The only Halftone site probed, shaders.paper.design on 2026-10-14, ships the Medium one (7 KB of motion code, one site); see the [Medium card](medium.md#halftone). Cost not measured.

## Fluid ink

### What it is

A photograph that behaves like the surface of water with ink on it: where the pointer passes, the picture's own colours are dragged after it, curl into eddies and slowly settle back into the still image.

### Where it comes from

It is paper marbling made live. Marbling floats colours on a liquid bath, combs or blows them into swirls and lays paper on the surface to take the pattern; the Japanese form, suminagashi, is recorded from the twelfth century ([Wikipedia, Paper marbling](https://en.wikipedia.org/wiki/Paper_marbling)).

### Suits

A hero with one strong photograph and a calm, sensory brand: [Hotel / boutique travel](../identities/industry.md#hotel--boutique-travel), [Ethereal](../identities/digital.md#ethereal), [Blob / fluid organic shapes](../identities/digital.md#blob--fluid-organic-shapes), [Pool, lido and spa](../identities/industry.md#pool-lido-and-spa).

### What it costs the visitor

Measured on the example page built for this card (2026-11-07), since the template pages that show it publish only recordings: 15 KB of motion code and 51 KB in all, 41 KB of it the photograph. It held 60 frames a second (16.7 ms, 16.8 ms for the slowest 5 %) on an Intel UHD GPU; with no usable graphics chip it fell to about 12 frames a second, because it redraws some thirty full passes every frame.

### Lighter version

No lighter version: the solver is the technique. The cheaper reading of the same idea is the trail of the [Cursor-painted reveal](medium.md#cursor-painted-reveal) card used to push the picture sideways instead of to mask it: a smear that follows the hand, with no eddies and no ink. The fallback is the photograph standing still.

### For the builder

A stable-fluids solver on the GPU, after Pavel Dobryakov's WebGL-Fluid-Simulation (MIT, `licenses/PavelDoGreat-WebGL-Fluid-Simulation-LICENSE`), cut down to what a hero needs. Two fields live in pairs of half-float textures that are read and written in turn: the velocity (128 cells on the short side) and the dye (512). Each frame, in order:

1. **Splat:** the pointer's movement since the last frame is added to the velocity as a soft Gaussian spot, and dye of the photograph's colour under the pointer is added the same way.
2. **Vorticity:** the curl of the velocity is measured and pushed back in, so small eddies survive instead of being smoothed away (strength 18 here).
3. **Pressure:** the divergence of the velocity is computed, the last pressure is kept at 0.8 and refined by 20 Jacobi steps, and its gradient is subtracted, so the flow neither piles up nor empties.
4. **Advection:** the velocity carries itself and the dye one step along, each divided by `1 + dissipation * dt`, so they fade by multiplying, never by subtracting (velocity 0.25, dye 0.9).
5. **Display:** the photograph is sampled at its own coordinates pushed back along the velocity, and the dye is laid over it.

```js
// One pass: a full-screen quad drawn into a target (or the screen) with a program and its inputs.
function step(dt) {
  const v = fbo.velocity, texel = [1 / v.read.w, 1 / v.read.h];
  pass(P.curl, fbo.curl, { uTexel: texel }, { uVelocity: v.read.tex });
  pass(P.vorticity, v.write, { uTexel: texel, uCurlStrength: 18, uDt: dt }, { uVelocity: v.read.tex, uCurl: fbo.curl.tex }); v.swap();
  pass(P.divergence, fbo.divergence, { uTexel: texel }, { uVelocity: v.read.tex });
  pass(P.scale, fbo.pressure.write, { uValue: 0.8 }, { uSource: fbo.pressure.read.tex }); fbo.pressure.swap();
  for (let i = 0; i < 20; i++) {
    pass(P.pressure, fbo.pressure.write, { uTexel: texel }, { uPressure: fbo.pressure.read.tex, uDivergence: fbo.divergence.tex });
    fbo.pressure.swap();
  }
  pass(P.gradient, v.write, { uTexel: texel }, { uPressure: fbo.pressure.read.tex, uVelocity: v.read.tex }); v.swap();
  pass(P.advect, v.write, { uTexel: texel, uDt: dt, uDissipation: 0.25 }, { uVelocity: v.read.tex, uSource: v.read.tex }); v.swap();
  pass(P.advect, fbo.dye.write, { uTexel: texel, uDt: dt, uDissipation: 0.9 }, { uVelocity: v.read.tex, uSource: fbo.dye.read.tex }); fbo.dye.swap();
}
```

```glsl
// The display pass: the photograph pushed along the flow, the dye over it.
uniform sampler2D uPhoto, uDye, uVelocity; uniform vec2 uCover;
void main() {
  vec2 uv = (vUv - 0.5) * uCover + 0.5;                       // object-fit: cover, like the fallback <img>
  vec2 v = texture(uVelocity, vUv).xy;
  vec3 photo = texture(uPhoto, vec2(uv.x, 1.0 - uv.y) - v * 0.00018).rgb;
  vec3 dye = texture(uDye, vUv).rgb;
  o = vec4(photo * (1.0 - 0.25 * clamp(length(dye), 0.0, 1.0)) + dye, 1.0);
}
```

The whole page, with the eight programs, is `docs/examples/motion-techniques/fluid-ink/page.html`.

- **The ink is the photograph's.** Sample the picture once into a 64 x 64 2D canvas and read the colour under the pointer for each splat, normalised so a dark pixel still lays a visible ink of its hue; random rainbow dye is the demo look, not a brand's.
- **Never a dead frame.** After two seconds with no pointer (and always on a touch screen), a slow figure eight lays a faint ink (a twenty-fifth of the pointer's), so the visitor discovers what the picture does; a strong idle ink saturates to white within seconds.
- **Float targets:** WebGL 2 with `EXT_color_buffer_float`, textures in `RGBA16F` with `HALF_FLOAT` (32-bit float targets can fail silently; the `shader-dev` skill, MiniMax, MIT). Without the extension, throw: the loop shows the photograph. Multiply to decay, never subtract, and clamp what you write.
- **The photograph is the fallback and the source.** One `<img>` under the canvas, decoded before the loop starts and uploaded as the texture; without scripts or 3D graphics it is simply the hero image.
- **Poster frame:** the photograph with no dye, drawn once. **Reduced motion:** the poster, and the pointer does nothing (`recipes-motion.md` §14).
- **Pixels and cost:** the solver works at 128 x 205 cells whatever the screen, so its cost is fixed; the display pass is the only one at screen size, capped at `maxDpr: 1.5`. On a software renderer it ran at about 12 frames a second: detect it (`WEBGL_debug_renderer_info`) and keep the photograph.
- **Checks:** `node scripts/check-motion.mjs <page> --tier high`. The page must be tall enough to scroll the hero fully out of view, or the off-screen check cannot pass: a canvas whose bottom edge sits exactly on the viewport's top edge still counts as on screen.

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- docs/examples/motion-techniques/fluid-ink/page.html, the example page built for this card, served compressed over http and probed 2026-11-07: motion code 15 KB, 51 KB in all (photograph 41 KB); Intel UHD GPU through ANGLE (Direct3D11), median frame 16.7 ms, slowest 5 % 16.8 ms; SwiftShader (software) about 12 frames a second; reduced motion honoured, pauses off screen, fallback without WebGL, readable without scripts; the wheel recording reached the end with no stalls. The template pages read for this card (2026-11-07) publish preview recordings only, so none could be probed.

## Glass object

### What it is

A solid made of clear glass, turning slowly in front of a word or a picture and bending it: the letters behind it swell, split and slide as the edges pass over them, with a thin fringe of colour where the light is split.

### Where it comes from

Light changes direction where it passes from one material into another, by an amount set by the two materials; the effect is called refraction, and a prism splits white light into colours because each colour bends by a slightly different amount ([Wikipedia, Refraction](https://en.wikipedia.org/wiki/Refraction)).

### Suits

A product or a brand mark that wants to read as a precious object: [Holographic / iridescent](../identities/digital.md#holographic--iridescent), [Liquid Glass (Apple 2025)](../identities/digital.md#liquid-glass-apple-2025), [Luxury fashion house](../identities/industry.md#luxury-fashion-house), [Hardware product](../identities/industry.md#hardware-product).

### What it costs the visitor

Measured on the example page built for this card (2026-11-07): 148 KB of motion code, almost all of it the 3D library served compressed, and 201 KB in all with the 53 KB still that stands in for it. It held 60 frames a second (16.7 ms, 17.1 ms for the slowest 5 %) on an Intel UHD GPU; with no usable graphics chip it fell to under 2 frames a second, the heaviest of the cards measured that day, because the glass draws the scene behind it a second time every frame.

### Lighter version

No lighter version: the bending is the technique, and no flat recipe bends what is behind it. The fallback is the poster frame saved as a picture; a scene that only needs to turn can be the same glass rendered once offline, as a [Rendered 3D](high.md#rendered-3d) turntable.

This is not [Glassmorphism](medium.md#glassmorphism), which blurs a flat panel over moving colour: frosted glass you look through, where this is a body of clear glass you look at. The two share a word and nothing else, so neither is the lighter version of the other.

### For the builder

three.js `MeshPhysicalMaterial` with `transmission: 1`: the renderer draws the opaque scene behind the object into a texture and samples it through the surface, bent by `ior` and `thickness`; `dispersion` splits the colours at the edges, a little `iridescence` gives the thin-film sheen. The environment that the glass reflects is generated in code (`RoomEnvironment`), so there is no HDR file to download. Pin the library version you tested (r170).

```js
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.toneMapping = THREE.ACESFilmicToneMapping;
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.5;
// The transmission pass sees only opaque things: the ground is the scene background, and the word is cut out with
// alphaTest. A transparent plane, or a transparent canvas behind, leaves the glass with nothing to bend.
scene.background = new THREE.Color(css.getPropertyValue('--ground'));
const word = new THREE.Mesh(new THREE.PlaneGeometry(8, 2), new THREE.MeshBasicMaterial({ map: wordTexture(), alphaTest: 0.5 }));
word.position.z = -1.6;

const glass = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.42, 48, 128), new THREE.MeshPhysicalMaterial({
  transmission: 1, thickness: 1.4, ior: 1.5, roughness: 0.04, dispersion: 4,
  iridescence: 0.25, iridescenceIOR: 1.3, clearcoat: 1,
}));
scene.add(word, glass);

// The pointer tilts the glass with a damping that does not depend on the frame rate.
const k = 1 - Math.exp(-4 * dt);
tiltX += (aimX - tiltX) * k; tiltY += (aimY - tiltY) * k;
glass.rotation.set(0.5 + tiltX, t * 0.00035 + tiltY, 0.2);
```

The page, with the word drawn into a texture in code and the loop wiring, is `docs/examples/motion-techniques/glass-object/page.html`.

- **The first failure is milky glass:** with a transparent word and a transparent canvas the object rendered as frosted white plastic. The transmission texture holds only opaque objects and the background, so give the scene a background colour and cut text out with `alphaTest`.
- **What sits behind is part of the design.** The word, the type size and the gap between the word and the glass decide what the visitor sees bent; the page's real heading stays HTML, outside the drawing.
- **A model instead of a torus:** a GLB with Draco or meshopt geometry adds its own weight to the 148 KB; keep it under the 340 KB ceiling, or the page is a [Real-time 3D world](yolo.md#real-time-3d-world).
- **The word itself in glass:** when the headline is the object, the [Glass letters](#glass-letters) card bends the page's own photograph through the type, in one pass and 11 KB, with no library.
- **Cost:** transmission draws the scene twice. Cap the loop at `maxDpr: 1.5`, keep one transmissive object per view (the `build-threejs-scroll-worlds` skill, Meng To, MIT: "keep transmission surfaces rare and small"), and on a software renderer (under 2 frames a second here) draw the poster instead.
- **Poster frame:** the glass at its rest angle. Save it once as the fallback picture: reduced motion on, wait for `canvas.dataset.dfPoster === 'done'`, screenshot the canvas. **Reduced motion:** the poster, and the pointer does not tilt it.
- **Checks:** `node scripts/check-motion.mjs <page> --tier high`; lose and restore the context and confirm the glass comes back (`restore` resets the viewport, as in the [Clay 3D](high.md#clay-3d) card).

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- docs/examples/motion-techniques/glass-object/page.html, the example page built for this card, served compressed over http and probed 2026-11-07: motion code 148 KB (three.js r170 and RoomEnvironment from jsDelivr, compressed), 201 KB in all with the 53 KB poster; Intel UHD GPU through ANGLE (Direct3D11), median frame 16.7 ms, slowest 5 % 17.1 ms; SwiftShader (software) 6 frames in 4 seconds; reduced motion honoured, pauses off screen, fallback without WebGL, readable without scripts; the wheel recording reached the end with no stalls.

## Reflective water floor

### What it is

A dark, still pool under the scene that mirrors it: lit panels, an object or a horizon stand on the water and their light lies on its surface. Where the pointer touches it, rings spread and the reflection wobbles, then settles.

### Where it comes from

A reflecting pool is a shallow basin of still water laid out to mirror the buildings or the sky around it, a device of garden and memorial design ([Wikipedia, Reflecting pool](https://en.wikipedia.org/wiki/Reflecting_pool)).

### Suits

Night, calm and luxury scenes, and any carousel or object that should look placed in a room: [Hotel / boutique travel](../identities/industry.md#hotel--boutique-travel), [Luxury fashion house](../identities/industry.md#luxury-fashion-house), [Sleep and sound](../identities/industry.md#sleep-and-sound), [Fintech trust](../identities/industry.md#fintech-trust).

### What it costs the visitor

Measured on the example page built for this card (2026-11-07): 151 KB of motion code, almost all of it the 3D library, and 196 KB in all. It held 60 frames a second (16.7 ms for the slowest 5 % too) on an Intel UHD GPU; with no usable graphics chip it fell to about 11 frames a second, because the scene is drawn twice, once from below the water.

### Lighter version

No lighter version: the mirror moves with the scene and the rings answer the hand, and a flat recipe does neither. The fallback is the poster frame saved as a picture; a still picture with its own mirrored copy below it, faded by a gradient, is the cheapest reading of a reflection for a scene that does not move.

### For the builder

three.js `Reflector` (an addon) renders the scene from a camera mirrored below the plane into a texture and maps it back onto the plane. Its shader is replaced so the reflection is bent by rings that spread from each drop, with no simulation texture: each drop is a position and a start time, and the ring is a wave packet computed where the pixel is.

```js
import { Reflector } from 'three/addons/objects/Reflector.js';

const MAX_DROPS = 6;
const water = {
  uniforms: { color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null }, uTime: { value: 0 },
    uDrops: { value: Array.from({ length: MAX_DROPS }, () => new THREE.Vector3(0, 0, -100)) }, uGround: { value: groundColour } },
  vertexShader: `uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vWorld;
    void main() { vUv = textureMatrix * vec4(position, 1.0); vWorld = (modelMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: `uniform sampler2D tDiffuse; uniform vec3 color, uGround; uniform float uTime; uniform vec3 uDrops[${MAX_DROPS}];
    varying vec4 vUv; varying vec3 vWorld;
    void main() {
      vec2 slope = vec2(0.0);
      for (int i = 0; i < ${MAX_DROPS}; i++) {                 // xy = where the drop fell, z = when
        vec2 d = vWorld.xz - uDrops[i].xy; float r = length(d), age = uTime - uDrops[i].z;
        float front = r - age * 1.6, env = exp(-front * front * 1.5) * exp(-age * 0.7) / (1.0 + 0.5 * r);
        slope += (d / max(r, 1e-3)) * cos(front * 10.0) * env;
      }
      slope += 0.012 * vec2(sin(vWorld.x * 2.1 + uTime * 0.9), cos(vWorld.z * 2.7 - uTime * 0.7));   // never glass-flat
      vec4 uv = vUv; uv.xy += slope * 0.1 * uv.w;
      float far = smoothstep(2.0, 14.0, length(vWorld.xz - cameraPosition.xz));
      gl_FragColor = vec4(mix(texture2DProj(tDiffuse, uv).rgb * color, uGround, 0.25 + 0.6 * far), 1.0);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`,
};
const floor = new Reflector(new THREE.PlaneGeometry(40, 40), { shader: water, color: 0x9aa0b4, clipBias: 0.003 });
floor.rotation.x = -Math.PI / 2;
// The material keeps a clone of the uniforms it was given: write drops into floor.material.uniforms, not water.uniforms.
const drop = (x, z) => { floor.material.uniforms.uDrops.value[next].set(x, z, clock); next = (next + 1) % MAX_DROPS; };
```

A pointer drop is a ray from the camera through the pointer, cut with the plane `y = 0`, at most one every 180 ms; with no pointer for two seconds a drop falls somewhere in front of the scene every 1.6 s. The page, with the ring of panels it reflects, is `docs/examples/motion-techniques/water-floor/page.html`.

- **Strength:** the displacement is small. At `slope * 0.6` the floor turned into psychedelic marbling; `0.1` reads as water. Fade the reflection into the ground with distance, or the far edge of the plane shows as a hard line.
- **The mirror at half size:** set the reflector's render target to half the canvas (`floor.getRenderTarget().setSize(w / 2, h / 2)` on resize): the rings hide the softness and it halves the second drawing of the scene.
- **A ripple simulation** instead of drops, for water that keeps every touch: a height field in a pair of textures, `next = 2 * current - previous + 0.45 * laplacian`, damped by 0.996, normals from the height differences (`shader-dev`, MiniMax, MIT). It costs one more pass and a float target; the drops cost nothing but a uniform array.
- **Poster frame:** one ring on the water, held. **Reduced motion:** the poster; no drops (`recipes-motion.md` §14).
- **Checks:** `node scripts/check-motion.mjs <page> --tier high`. On a software renderer (about 11 frames a second) draw the poster.

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- docs/examples/motion-techniques/water-floor/page.html, the example page built for this card, served compressed over http and probed 2026-11-07: motion code 151 KB (three.js r170 and the Reflector addon from jsDelivr, compressed), 196 KB in all with the 46 KB poster; Intel UHD GPU through ANGLE (Direct3D11), median frame 16.7 ms, slowest 5 % 16.7 ms; SwiftShader (software) about 11 frames a second; reduced motion honoured, pauses off screen, fallback without WebGL, readable without scripts; the wheel recording reached the end with no stalls.

## Object that travels between sections

### What it is

One object that comes with the visitor down the page: it sits beside the opening headline, and as the page scrolls it lifts, turns and settles into its place in the next section, smaller or closer, showing another side. It never fades out and in again.

### Where it comes from

It is the match cut of film, a cut between two shots joined by a shape or an object they share; the bone thrown into the air that becomes a satellite in *2001: A Space Odyssey* (1968) is the best-known one ([Wikipedia, Match cut](https://en.wikipedia.org/wiki/Match_cut)).

### Suits

A product or object page told section by section: [Hardware product](../identities/industry.md#hardware-product), [Luxury fashion house](../identities/industry.md#luxury-fashion-house), [Automotive / EV launch](../identities/industry.md#automotive--ev-launch), [3D scroll-story (Apple product page)](../identities/digital.md#3d-scroll-story-apple-product-page).

### What it costs the visitor

Measured on the example page built for this card (2026-11-07): 144 to 173 KB of motion code (the probe and the tier check count it differently), almost all of it the 3D library, and 157 KB in all. It held 60 frames a second (16.8 ms for the slowest 5 %) on an Intel UHD GPU and about 23 frames a second with no usable graphics chip. Built as YOLO it was reported below that tier: the move costs a few kilobytes on top of the library, so the object's own model decides the tier, and a modelled product of several megabytes belongs to the [Real-time 3D world](yolo.md#real-time-3d-world) card.

### Lighter version

No lighter version: the object is drawn in 3D so it can turn while it travels. With pictures instead, the same carry is one element moved between two places in the page (`recipes-motion.md` §18); the Floor fallback is a still of the object in its first place, and the sections without it.

### For the builder

One canvas fixed behind the whole page and one object in it. Every section keeps an empty slot in its layout (`data-anchor`) where the object comes to rest; the scroll decides which two slots it is between, and how far.

```js
// Where a slot is in the world: its centre on screen, unprojected onto the plane z = 0, its width as a scale.
camera.updateMatrixWorld();                         // place() runs before the first render: without this it unprojects from the origin
function place(el) {
  const r = el.getBoundingClientRect();
  ndc.set(((r.left + r.width / 2) / innerWidth) * 2 - 1, -((r.top + r.height / 2) / innerHeight) * 2 + 1, 0.5).unproject(camera);
  dir.copy(ndc).sub(camera.position).normalize();
  const pos = camera.position.clone().addScaledVector(dir, -camera.position.z / dir.z);
  const worldPerPx = (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.position.z) / innerHeight;
  return { pos, scale: (r.width * worldPerPx) / 2.6, turn: +el.dataset.turn };
}
// 0 when one slot is centred on screen, 1 when the next one is; the pose is mixed between the two.
function pose() {
  const mid = innerHeight / 2, centres = anchors.map((el) => { const r = el.getBoundingClientRect(); return r.top + r.height / 2; });
  let i = 0;
  while (i < anchors.length - 2 && centres[i + 1] < mid) i++;
  const a = place(anchors[i]), b = place(anchors[i + 1]);
  const t = THREE.MathUtils.clamp((mid - centres[i]) / Math.max(1, centres[i + 1] - centres[i]), 0, 1);
  const e = t * t * (3 - 2 * t);                    // ease the hand-over, not the scroll
  return { pos: a.pos.lerp(b.pos, e), scale: a.scale + (b.scale - a.scale) * e, turn: a.turn + (b.turn - a.turn) * e, lift: Math.sin(Math.PI * t) };
}
// Each frame: follow the pose with a frame-rate independent damping, and lift the object towards the viewer mid-move.
const k = 1 - Math.exp(-7 * dt);
cur.pos.lerp(p.pos, k); cur.scale += (p.scale - cur.scale) * k; cur.turn += (p.turn - cur.turn) * k;
stone.position.copy(cur.pos).z += p.lift * 1.2;
```

The page is `docs/examples/motion-techniques/travel-object/page.html`. The damping is the scroll conductor's (`build-threejs-scroll-worlds`, Meng To, MIT: `1 - exp(-λ·dt)`, never a fixed lerp per frame, and native scroll as the one source of the story's position).

- **It is a cut, so it follows the cut rules** (`recipes-motion.md` §16 and §18): the carrier never fades, it moves against the rest (it rises towards the viewer while the sections slide up), and its shape survives while its detail changes (here it turns to show a new face in each room).
- **The slot is real layout.** Each slot has the object's size in the CSS (`--size`), so the text beside it is set as if the object were there; without scripts or 3D graphics the first slot shows the still, the rest stay empty and the text reads.
- **Reading layout every frame:** `getBoundingClientRect` on four slots is a read with no write after it, so it causes no layout thrash; measure it with the probe before adding more slots.
- **Reduced motion:** the canvas is taken out of its fixed position and drawn once, still, in the first slot (`position: absolute` on the canvas under `prefers-reduced-motion: reduce`); the object does not travel.
- **Checks:** `node scripts/check-motion.mjs <page> --tier high`. A fixed canvas never leaves the screen, so "pauses off screen" reports n/a; the loop still stops in a hidden tab.

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- docs/examples/motion-techniques/travel-object/page.html, the example page built for this card, served compressed over http and probed 2026-11-07: motion code 144 KB (three.js r170 and RoomEnvironment from jsDelivr, compressed; `check-motion` counted 173 KB), 157 KB in all; Intel UHD GPU through ANGLE (Direct3D11), median frame 16.7 ms, slowest 5 % 16.8 ms; SwiftShader (software) about 23 frames a second; reduced motion honoured, fallback without WebGL, readable without scripts; `check-motion --tier yolo` reported it built below the chosen tier (185 KB in all, under the 340 KB High ceiling); the wheel recording reached the end with no stalls.

## Glass letters

### What it is

The page's own headline cast in thick clear glass: the photograph behind it shows through the letters, bent by their bevels, with dark edges and a glint that follows the pointer.

### Suits

A short word that names the subject, over a picture of the subject: [Luxury typography](../identities/print-craft.md#luxury-typography), [Mega-type / typographic poster](../identities/print-craft.md#mega-type--typographic-poster), [Hotel / boutique travel](../identities/industry.md#hotel--boutique-travel), [Liquid Glass (Apple 2025)](../identities/digital.md#liquid-glass-apple-2025). One word, two at most: a sentence in glass is unreadable.

### What it costs the visitor

Measured on the example page built for this card (2026-11-08): 11 KB of motion code and 127 KB in all, 120 KB of it the photograph. It held 60 frames a second (16.6 ms, 17.7 ms for the slowest 5 %) on an Intel UHD GPU, full screen at 1440 x 900. With no usable graphics chip it drew 24 frames in 4 seconds, about 6 a second: there, show the still.

### Lighter version

No lighter version: the play is the picture bent through the type, and nothing flat bends it. The fallback is the headline set solid over the photograph, which the page shows without the script and when the drawing cannot run; [Glass object](high.md#glass-object) is the same idea with a modelled body in front of a word instead of the word itself.

### For the builder

The headline stays HTML: the script reads its font, size and box, draws it into a texture twice (blurred in red, a rounded height; sharp in green, where the glass is), and turns the text clear once the glass has drawn. One pass then bends the photograph through the slope of the height:

```glsl
vec4 ty = texture(uType, vUv);                                     // r: height, g: inside the glass
float hx = texture(uType, vUv + vec2(uPx.x, 0)).r - texture(uType, vUv - vec2(uPx.x, 0)).r;
float hy = texture(uType, vUv + vec2(0, uPx.y)).r - texture(uType, vUv - vec2(0, uPx.y)).r;
vec3 n = normalize(vec3(-hx * 6.0, -hy * 6.0, 1.0));
vec2 bend = n.xy * 0.09;
vec3 seen = vec3(scene(vUv + bend * 1.06).r, scene(vUv + bend).g, scene(vUv + bend * 0.94).b);   // a slight colour split
vec3 l = normalize(vec3((lamp - vUv) * vec2(uPx.y / uPx.x, 1.0), 0.35));
float spec = pow(max(dot(reflect(-l, n), vec3(0, 0, 1)), 0.0), 60.0);
float fres = pow(1.0 - n.z, 1.5);                                  // steep edges go dark, as thick glass does
o = vec4(mix(back, seen * (1.05 - fres * 1.6) + spec * 0.9, ty.g), 1.0);
```

```css
.glass-on h1 { color: transparent; }                                          /* still the text that is read and selected */
.glass-on:has(canvas[data-df-loop="fallback"]) h1 { color: var(--ink); }     /* the drawing failed: the type comes back */
```

The page is `docs/examples/motion-techniques/glass-letters/page.html`.

- **The page's own content is the material:** the word is the headline and what shows through it is the section's own photograph. That is what the strongest pieces of the catalogue read on 2026-11-08 share (`yolo-references.md`); a stock gradient behind generic glass is the template.
- **Match the page's type exactly:** read `getComputedStyle(h1)` and the box from `getBoundingClientRect()`, redraw on resize and after `document.fonts.ready`, and keep the headline on one line (`white-space: nowrap`) so one baseline is enough.
- **The glint** follows the pointer through an eased value and, idle, walks a slow path across the word: the autopilot of `recipes-motion.md` §28.
- **The picture behind must move a little** (here a 1 % drift), or the glass is a still. Leave a margin round the picture so the drift never shows its edge.
- **A slow machine:** about 6 frames a second here. Read the renderer once (`WEBGL_debug_renderer_info`, or ask the context with `failIfMajorPerformanceCaveat: true`) and draw the poster on a software renderer.
- **Shatter, for a YOLO page:** the letters pre-cut into Voronoi shards that the pointer pushes apart and a spring pulls home. It needs the shards as geometry (one mesh per shard, or one instanced mesh), a spring per shard and the same refraction per shard; it was read from a recording and not built here.
- **Poster frame:** the glass with the glint at rest. **Reduced motion:** the poster. **Checks:** `node scripts/check-motion.mjs <page> --tier high`; with scripting off the headline must read over the photograph.

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- docs/examples/motion-techniques/glass-letters/page.html, the example page built for this card, served compressed over http and probed 2026-11-08: motion code 11 KB, 127 KB in all (photograph 120 KB); Intel UHD GPU through ANGLE (Direct3D11), median frame 16.6 ms, slowest 5 % 17.7 ms; SwiftShader (software) 24 frames in 4 s at 1440 x 900; reduced motion honoured, pauses off screen, fallback without WebGL; the wheel recording reached the end with no stalls.

## Images that fray and smear

### What it is

A strip of photographs that comes apart into threads where it leaves the frame and is woven again where it comes in, with a lens passing over it that smears the pictures the way it moves.

### Suits

Pictures that are the product, shown as a run: [Fashion e-commerce experimental](../identities/industry.md#fashion-e-commerce-experimental), [Photographer portfolio](../identities/industry.md#photographer-portfolio), [Glitch art](../identities/digital.md#glitch-art), [Bakery / food shop](../identities/industry.md#bakery--food-shop) when the weave is the bread's own crumb.

### What it costs the visitor

Measured on the example page built for this card (2026-11-08): 11 KB of motion code and 164 KB in all, 156 KB of it the three photographs. It held 60 frames a second (16.7 ms, 16.8 ms for the slowest 5 %) on an Intel UHD GPU, and drew 61 frames in 4 seconds, about 15 a second, with no usable graphics chip.

### Lighter version

No lighter version: the threads are the pictures pulled apart pixel row by pixel row, which needs the drawing. The fallback is the three photographs in a row whose cut ends fade, the Fast [Edge fade](fast.md#edge-fade).

### For the builder

The photographs are laid once into one strip texture at the size they are drawn; one pass reads the strip with a moving offset. Near either edge each row of pixels slides on its own and only thin rows are kept; inside a circle at the eased pointer the strip is read twelve times along the lens's own velocity:

```glsl
float side = px.x / uRes.x * 2.0 - 1.0;
float edge = smoothstep(0.55, 1.0, abs(side));
float row = floor(px.y / uThread);                                    // a thread is 3 CSS pixels tall
float pull = (hash(row) * 0.8 + 0.2 + 0.25 * sin(row * 0.37 + uTime * 1.3)) * edge * edge * uRes.x * 0.22;
vec4 c = strip(px + vec2(sign(side) * pull, 0.0));
c *= mix(1.0, step(0.45, fract(px.y / uThread)) * step(hash(row + 3.1), 1.15 - edge), smoothstep(0.0, 0.25, edge));
if (length(px - lens) < uRadius) {                                    // the lens: smeared along its velocity, a little magnified
  vec4 acc = vec4(0.0);
  vec2 from = lens + (px - lens) * 0.86;
  for (int i = 0; i < 12; i++) acc += strip(from - uVel * (float(i) / 11.0 - 0.5));
  c = acc / 12.0;
}
```

The page is `docs/examples/motion-techniques/fray-smear/page.html`.

- **The strip is the page's own pictures,** inked in the page's two colours; the catalogue's version runs a stock art pack, which is the template, not the move.
- **The smear is the lens's velocity, eased** (a fifth of the change a frame), so it lengthens and settles instead of flickering; at rest the lens is a plain magnifier.
- **The lens walks on its own** until the hand arrives and three seconds after it leaves (`recipes-motion.md` §28); a touch screen gets the walk only. The `animaxxing-webgl` skill (John Polacek, MIT) keeps its hover lens still unless a mouse is over it: that is right for a lens over content, and the reason this one stays a decoration over a strip that is also shown without it.
- **A strip that moves is a loop:** a visible "Pause the strip" button stops it and the lens (WCAG 2.2.2).
- **Images must be readable by the drawing:** same origin, or served with `Access-Control-Allow-Origin` and `crossorigin="anonymous"` (`animaxxing-webgl`).
- **Scroll velocity instead of a pointer:** feed the scroll's speed into the same velocity and the strip bends as the page moves (the scroll wave of `animaxxing-webgl`), straightening when it stops.
- **Poster frame:** the strip part-way, the lens at the middle with a short smear. **Reduced motion:** the poster. **Checks:** `node scripts/check-motion.mjs <page> --tier high`; at 320 px the hidden row must not push the page sideways (the first build did, until the row was clipped).

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- docs/examples/motion-techniques/fray-smear/page.html, the example page built for this card, served compressed over http and probed 2026-11-08: motion code 11 KB, 164 KB in all (photographs 156 KB); Intel UHD GPU through ANGLE (Direct3D11), median frame 16.7 ms, slowest 5 % 16.8 ms; SwiftShader (software) 61 frames in 4 s at 1440 x 900; reduced motion honoured, pauses off screen, fallback without WebGL; the wheel recording reached the end with no stalls.

## Type on geometry

### What it is

Words carried round a three-dimensional shape: the names written along a ribbon tied in a knot, sliding along it while the knot turns, readable in front and mirrored and faint behind.

### Suits

A list of names that belong to an object or a motion: [Kinetic typography](../identities/digital.md#kinetic-typography), [Nautical and coastal](../identities/cultural.md#nautical-and-coastal), [Music festival / events](../identities/industry.md#music-festival--events), [Type specimen / foundry](../identities/print-craft.md#type-specimen--foundry).

### What it costs the visitor

Measured on the example page built for this card (2026-11-08): 11 KB of motion code and 8 KB of page in all, with no image and no library. It held 60 frames a second (16.7 ms, 16.7 ms for the slowest 5 %) on an Intel UHD GPU, and drew 71 frames in 4 seconds, about 18 a second, with no usable graphics chip.

### Lighter version

No lighter version: words on a curved surface in depth need the drawing. The cheap answer is a ring of words in the style sheet alone, standing round an object in the same depth: the Fast [CSS 3D objects](fast.md#css-3d-objects) card.

### For the builder

No library: the ribbon is built in about thirty lines. A trefoil knot gives the centre line; each point gets a frame by carrying the last normal along (no flips), the ribbon's width turns once per loop, and the words are one strip of texture the ribbon's length repeats six times:

```js
const P = (t) => { const r = Math.cos(3 * t) + 2; return [r * Math.cos(2 * t) * 0.32, r * Math.sin(2 * t) * 0.32, -Math.sin(3 * t) * 0.32]; };
let N = [0, 0, 1];
for (let i = 0; i <= n; i++) {
  const t = (i / n) * Math.PI * 2, c = P(t), T = norm(sub(P(t + 1e-3), P(t - 1e-3)));
  N = norm(sub(N, T.map((x) => x * dot(N, T))));                    // parallel transport
  const B = cross(T, N), twist = t * 3 + 0.4;
  const d = [0, 1, 2].map((k) => Math.cos(twist) * N[k] + Math.sin(twist) * B[k]);
  for (const side of [-1, 1]) { pos.push(...c.map((x, k) => x + side * d[k] * width / 2)); nrm.push(...cross(T, d)); uv.push((i / n) * 6, side < 0 ? 1 : 0); }
}
```

```glsl
float ink = texture(uWords, vec2(vUv.x + uSlide, vUv.y)).a;                         // the words slide along the rope
if (!gl_FrontFacing) ink = texture(uWords, vec2(-vUv.x - uSlide, vUv.y)).a * 0.6;   // read from behind, fainter
o = vec4(mix(mix(uRope * light, uLetter, ink), uGround, smoothstep(2.9, 4.9, vDepth) * 0.75), 1.0);
```

The page is `docs/examples/motion-techniques/type-geometry/page.html`.

- **One texture, drawn once:** the words in the display face into a 2048 x 128 strip, stretched to fill it exactly so it tiles, with mipmaps and anisotropic filtering, or the far turns shimmer. `troika-three-text` (MIT) sets real glyphs in a three.js scene and suits text that changes; it was not measured here.
- **Six repeats along the knot,** not nine: at nine the letters were squeezed thin.
- **The far turns fade into the page** (the ground colour by depth), which is the depth cue that keeps the knot readable as one object.
- **The words are decoration;** the page's text says the same thing in HTML. The drawing is `aria-hidden`, with a still of the knot as the fallback.
- **A loop that can pause:** "Stop the rope" (WCAG 2.2.2).
- **A text tube through an object** (the catalogue's word ring orbiting a jellyfish) is the same strip on a cylinder round the object; in the style sheet alone it is the Fast card's ring.
- **Poster frame:** the knot at a fixed time. **Reduced motion:** the poster. **Checks:** `node scripts/check-motion.mjs <page> --tier high`.

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- docs/examples/motion-techniques/type-geometry/page.html, the example page built for this card, served compressed over http and probed 2026-11-08: motion code 11 KB, 8 KB in all; Intel UHD GPU through ANGLE (Direct3D11), median frame 16.7 ms, slowest 5 % 16.7 ms; SwiftShader (software) 71 frames in 4 s at 1440 x 900; reduced motion honoured, pauses off screen, fallback without WebGL; the wheel recording reached the end with no stalls.
