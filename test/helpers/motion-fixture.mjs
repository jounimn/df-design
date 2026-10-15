// Canvas fixtures for the motion checks. Each kind breaks exactly one thing (see the matrix in
// docs/superpowers/plans/2026-10-13-motion-techniques.md, Task 1) and is otherwise a well-behaved page.
// Inline minimal shaders only: no three.js, no network. The scene lives in an external scene.js so that
// "motion JS weight" has a script to attribute to, and so the over-weight fixture can pad it.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const KINDS = [
  'healthy', 'frozen', 'blank', 'ignoresReducedMotion', 'neverPauses', 'noFallback', 'overweight',
  'staticCanvas', 'twoCanvases', 'noCanvas', 'hiddenCanvas', 'lateCanvas',
  'hiddenUnderReduce', 'removedUnderReduce', 'swapsCanvasForFallback', 'threeLoops', 'lateTwoD',
  'eightCanvases', 'eightOneRogue', 'shadowCanvas', 'fixedCanvas', 'offscreenWorker', 'opacityZero', 'resizing',
  'cssOnly', 'revealOnScroll', 'jsRendered', 'revealOneOfTwenty', 'revealTwoOfTwenty',
];

const NO_SPACER = new Set(['noCanvas', 'cssOnly', 'revealOnScroll', 'jsRendered', 'revealOneOfTwenty', 'revealTwoOfTwenty']);
export const PAD_BYTES = 300000;

// Every scene function takes the canvas id and a set of switches. `pauses` wires an IntersectionObserver,
// `honoursRM` draws one still frame under prefers-reduced-motion, `fallback` shows #fb when WebGL is missing.
const LIB = `
function find(id) {
  const d = document.getElementById(id);
  if (d) return d;
  for (const el of document.querySelectorAll('*')) { const f = el.shadowRoot && el.shadowRoot.getElementById(id); if (f) return f; }
  return null;
}
function glScene(id, { pauses = true, honoursRM = true, fallback = true, preserve = false } = {}) {
  const c = find(id);
  const fb = find('fb-' + id);
  const gl = c.getContext('webgl', { preserveDrawingBuffer: preserve });
  if (!gl && fallback) { if (fb) fb.style.display = 'block'; return; }
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'));
  gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, 'precision mediump float;uniform float t;void main(){gl_FragColor=vec4(.5+.5*sin(t+gl_FragCoord.x*.02),.5+.5*cos(t*1.3+gl_FragCoord.y*.02),.6,1.);}'));
  gl.linkProgram(pr); gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const tl = gl.getUniformLocation(pr, 't');
  const draw = (s) => { gl.viewport(0, 0, c.width, c.height); gl.uniform1f(tl, s); gl.drawArrays(gl.TRIANGLES, 0, 3); };
  run(c, draw, { pauses, honoursRM });
}
function flat2d(id, { pauses = true, moving = false } = {}) {
  const c = document.getElementById(id);
  const x = c.getContext('2d');
  const draw = (s) => {
    const g = x.createLinearGradient(0, 0, c.width, 0);
    const k = moving ? (Math.sin(s) + 1) / 2 : 0;
    g.addColorStop(0, '#223344'); g.addColorStop(Math.min(0.99, 0.2 + 0.6 * k), '#ccaa55'); g.addColorStop(1, '#223344');
    x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
  };
  run(c, draw, { pauses, honoursRM: false });
}
function solid2d(id, { pauses = true } = {}) {
  const c = document.getElementById(id);
  const x = c.getContext('2d');
  run(c, () => { x.fillStyle = '#336699'; x.fillRect(0, 0, c.width, c.height); }, { pauses, honoursRM: false });
}
function once2d(id) {
  const c = document.getElementById(id);
  const x = c.getContext('2d');
  const g = x.createLinearGradient(0, 0, c.width, 0); g.addColorStop(0, '#112233'); g.addColorStop(1, '#ddaa44');
  x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
}
function run(c, draw, { pauses, honoursRM }) {
  if (honoursRM && matchMedia('(prefers-reduced-motion: reduce)').matches) { draw(0); return; }
  let visible = true, raf = 0;
  const frame = (ms) => {
    if (pauses && !visible) { raf = 0; return; }
    draw(ms / 1000);
    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);
  if (pauses) new IntersectionObserver((es) => { visible = es[0].isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame); }).observe(c);
}
`;

const canvasTag = (id, extra = '') => `<canvas id="${id}" width="400" height="300" style="width:400px;height:300px;display:block;${extra}"></canvas>`;
const fbTag = (id) => `<div id="fb-${id}" style="display:none;position:absolute;top:0;left:0;width:400px;height:300px;background:linear-gradient(90deg,#112233,#ddaa44)"></div>`;
const holder = (id, extra = '') => `<div style="position:relative;width:400px;height:300px;${extra}">${canvasTag(id)}${fbTag(id)}</div>`;

const REVEAL_CSS = '<style>.r{opacity:0;transition:opacity .2s}.r.in{opacity:1}</style>';
// Adds .in to each .r block as it is scrolled into view, the way a reveal-on-scroll script does.
const REVEAL_JS = "const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) e.target.classList.add('in'); }), { threshold: 0.1 }); document.querySelectorAll('.r').forEach((el) => io.observe(el));";
// n blocks, each a heading and a paragraph in a 600 px tall section, so most of them start below the fold.
const contentBlocks = (n, attrs) => Array.from({ length: n }, (_, i) => `<section style="height:600px"><h2${attrs(i)}>Heading ${i + 1}</h2><p${attrs(i)}>Text of block ${i + 1}, long enough to be a real paragraph.</p></section>`).join('');
// One h1 and nineteen paragraphs; the first `hidden` paragraphs are revealed by script only.
const twentyItems = (hidden) => `<h1>Twenty items</h1>${Array.from({ length: 19 }, (_, i) => `<p${i < hidden ? ' class="r"' : ''}>Item number ${i + 1} of the page.</p>`).join('')}`;

function build(kind) {
  const one = (call, wrapExtra = '') => ({ body: holder('c', wrapExtra), call });
  switch (kind) {
    case 'healthy': return one("glScene('c', { preserve: false });");
    case 'ignoresReducedMotion': return one("glScene('c', { honoursRM: false });");
    case 'neverPauses': return one("glScene('c', { pauses: false });", 'margin-top:3000px;');
    case 'noFallback': return one("glScene('c', { fallback: false });");
    case 'overweight': return { ...one("glScene('c', {});"), pad: true };
    case 'frozen': return { body: holder('c'), call: "flat2d('c', {});" };
    case 'blank': return { body: holder('c'), call: "solid2d('c', {});" };
    case 'staticCanvas': return { body: holder('c'), call: "once2d('c');" };
    case 'twoCanvases': return { body: holder('a') + holder('b'), call: "glScene('a', {}); flat2d('b', {});" };
    case 'hiddenUnderReduce': return { ...one("glScene('c', {});"), head: '<style>@media (prefers-reduced-motion: reduce){#c{display:none !important}}</style>' };
    case 'removedUnderReduce': return one("if (matchMedia('(prefers-reduced-motion: reduce)').matches) document.getElementById('c').remove(); else glScene('c', {});");
    case 'swapsCanvasForFallback': return one(`const probe = document.createElement('canvas').getContext('webgl');
      if (!probe) { const d = document.createElement('div'); d.style.cssText = 'width:400px;height:300px;background:linear-gradient(90deg,#112233,#ddaa44)'; document.getElementById('c').replaceWith(d); }
      else glScene('c', {});`);
    // Three independent rAF loops on one canvas: every frame fires three callbacks with the same timestamp.
    case 'threeLoops': return { body: holder('c'), call: `const c = document.getElementById('c'); const x = c.getContext('2d');
      for (let k = 0; k < 3; k += 1) { const loop = (ms) => { x.fillStyle = 'hsl(' + ((ms / 10 + k * 80) % 360) + ',70%,50%)'; x.fillRect(k * 130, 0, 130, 300); requestAnimationFrame(loop); }; requestAnimationFrame(loop); }` };
    // The page claims its 2D context 1.5 s in, after anything that probed the canvas for WebGL has run.
    case 'lateTwoD': return { body: holder('c'), call: "setTimeout(() => { const x = document.getElementById('c').getContext('2d'); x.fillStyle = '#c33'; x.fillRect(0, 0, 400, 300); }, 1500);" };
    // Eight healthy canvases stacked 340px apart: a 900px viewport sees two at a time, so most start below the
    // fold. In 'eightOneRogue' only k5 ignores the viewport and keeps drawing when scrolled out.
    case 'eightCanvases':
    case 'eightOneRogue': {
      const ids = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => `k${i}`);
      return {
        body: ids.map((id) => holder(id, 'margin-bottom:40px;')).join(''),
        call: ids.map((id) => `glScene('${id}', { pauses: ${kind === 'eightOneRogue' && id === 'k5' ? 'false' : 'true'} });`).join(' '),
      };
    }
    case 'shadowCanvas': return {
      body: '<div id="host"></div>',
      call: `const sr = document.getElementById('host').attachShadow({ mode: 'open' });
        sr.innerHTML = '<div style="position:relative;width:400px;height:300px"><canvas id="sc" width="400" height="300" style="width:400px;height:300px;display:block"></canvas></div>';
        glScene('sc', { fallback: false });`,
    };
    case 'fixedCanvas': return one("glScene('c', {});", 'position:fixed;top:0;left:0;');
    // The page draws from a worker: the main thread never calls getContext and no draw call is seen.
    case 'offscreenWorker': return { body: holder('c'), call: `const src = 'onmessage=(e)=>{const c=e.data;const x=c.getContext("2d");let k=0;const f=()=>{k+=1;x.fillStyle="hsl("+(k*5%360)+",70%,50%)";x.fillRect(0,0,c.width,c.height);requestAnimationFrame(f)};f()}';
        const w = new Worker(URL.createObjectURL(new Blob([src]))); const o = document.getElementById('c').transferControlToOffscreen(); w.postMessage(o, [o]);` };
    case 'opacityZero': return { body: '<div style="opacity:0">' + holder('c') + '</div>', call: "glScene('c', {});" };
    case 'resizing': return { body: holder('c'), call: "solid2d('c', {}); let w = 400; setInterval(() => { w = w === 400 ? 300 : 400; document.getElementById('c').style.width = w + 'px'; }, 150);" };
    // Pages without a canvas, for the "works without JS" check. cssOnly shows everything with plain CSS;
    // revealOnScroll keeps its content at opacity 0 until the script adds a class as each block is scrolled to;
    // jsRendered builds its content in the script. reveal*OfTwenty hide that many of twenty content items.
    case 'cssOnly': return { body: contentBlocks(6, () => ''), call: '' };
    case 'revealOnScroll': return { head: REVEAL_CSS, body: contentBlocks(6, () => ' class="r"'), call: REVEAL_JS };
    case 'jsRendered': return {
      body: '<div id="app"></div>',
      call: "document.getElementById('app').innerHTML = '<h1>Rendered by script</h1>' + [1, 2, 3, 4, 5].map((n) => '<p>Paragraph ' + n + ' of a page built in JS.</p>').join('') + '<ul><li>One</li><li>Two</li></ul>';",
    };
    case 'revealOneOfTwenty': return { head: REVEAL_CSS, body: twentyItems(1), call: REVEAL_JS };
    case 'revealTwoOfTwenty': return { head: REVEAL_CSS, body: twentyItems(2), call: REVEAL_JS };
    case 'noCanvas': return { body: '<h1>No canvas here</h1>', call: '' };
    case 'hiddenCanvas': return {
      body: `${canvasTag('h1', 'display:none')}<canvas id="h2" width="0" height="0"></canvas><section hidden>${canvasTag('h3')}</section>`,
      call: "glScene('h1', { fallback: false }); glScene('h2', { fallback: false }); glScene('h3', { fallback: false });",
    };
    case 'lateCanvas': return {
      body: '<h1>Canvas arrives late</h1><div id="slot"></div>',
      call: `setTimeout(() => { document.getElementById('slot').innerHTML = ${JSON.stringify(holder('late'))}; glScene('late', {}); }, 1500);`,
    };
    default: throw new Error(`unknown motion fixture kind: ${kind}`);
  }
}

export function motionFixture(kind, { beforeScene = '', spacer = true, inline = false } = {}) {
  const { body, call, pad, head = '' } = build(kind);
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'movimento teste '));
  const dir = path.join(root, 'página');
  fs.mkdirSync(dir);
  const scene = `${LIB}\n${pad ? `/*${'x'.repeat(PAD_BYTES)}*/\n` : ''}${call}\n`;
  fs.writeFileSync(path.join(dir, 'scene.js'), scene);
  fs.writeFileSync(path.join(dir, 'page.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${kind}</title>
<style>html,body{margin:0;background:#fff}</style>${head}</head><body>${body}${NO_SPACER.has(kind) || !spacer ? '' : '<div style="height:2500px"></div>'}${beforeScene}${inline ? `<script>${scene}</script>` : '<script src="scene.js"></script>'}</body></html>`);
  const file = path.join(dir, 'page.html');
  return { root, dir, file, url: pathToFileURL(file).href, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) };
}
