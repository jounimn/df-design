# High techniques

High expensive loading: heavy script, large media, and main-thread and GPU cost, so it needs a fallback. The tier is described in [audition.md §4](../audition.md#4-loading-cost-cheapest-viable-option-first); this file does not restate it. Each card here links its lighter version, in [medium.md](medium.md) or [fast.md](fast.md), except Clay 3D, which says why there is none.

| Technique | What the visitor sees | Suits |
|---|---|---|
| [Particles](#particles) | Thousands of points that swarm and twinkle across the screen | Generative, AI and data brands |
| [Liquid morph](#liquid-morph) | Shapes that stretch, split and merge like thick drops of liquid | Calm, friendly and organic brands |
| [Holographic](#holographic) | A solid object whose rainbow colour shifts as it turns | Collectibles, beauty and music |
| [Wireframe 3D](#wireframe-3d) | A solid object drawn as bare edges, turning in space | Technical, plan-like and sci-fi brands |
| [Gradient mesh](#gradient-mesh) | A full-screen field of colour that flows with no edges | Fintech, AI and launch pages |
| [Clay 3D](#clay-3d) | Soft, matte lumps that look hand-modelled and turn slowly | Friendly consumer, kids and playful brands |
| [Halftone](#halftone) | A picture, video or 3D scene turned into printed-looking dots | Print, music and campaign brands |

## Particles

### What it is

Thousands of tiny points that swarm across the screen and twinkle, like sparks or dust in a beam of light.

### Where it comes from

Particle systems were introduced in the 1982 film Star Trek II: The Wrath of Khan for the fictional Genesis effect, and in 1983 Reeves defined them as animated points used for sparks, rain, fire and similar phenomena ([Wikipedia, Particle system](https://en.wikipedia.org/wiki/Particle_system)).

### Suits

Brands that want a swarm that feels alive and computed: [Generative / creative-coding](../identities/digital.md#generative--creative-coding), [AI lab](../identities/industry.md#ai-lab), [Cyberpunk](../identities/digital.md#cyberpunk).

### What it costs the visitor

On one site (activetheory.net, measured 2026-10-14) the page's motion code weighed 340 KB, which is the High ceiling itself. Its one animated drawing ran at a median frame of 16.7 ms and 16.9 ms for the slowest 5 % of frames on an Intel UHD GPU, so it was smooth, but it kept moving when reduced motion was asked for (0 % honoured). A fallback showed when 3D graphics were missing (100 %) ([benchmarks](../benchmarks.md#canvas-and-webgl-measured-2026-10-15)).

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

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

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
