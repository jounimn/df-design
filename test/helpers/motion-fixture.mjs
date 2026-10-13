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
];

export const PAD_BYTES = 300000;

// Every scene function takes the canvas id and a set of switches. `pauses` wires an IntersectionObserver,
// `honoursRM` draws one still frame under prefers-reduced-motion, `fallback` shows #fb when WebGL is missing.
const LIB = `
function glScene(id, { pauses = true, honoursRM = true, fallback = true, preserve = false } = {}) {
  const c = document.getElementById(id);
  const fb = document.getElementById('fb-' + id);
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

export function motionFixture(kind, { beforeScene = '' } = {}) {
  const { body, call, pad } = build(kind);
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'movimento teste '));
  const dir = path.join(root, 'página');
  fs.mkdirSync(dir);
  const scene = `${LIB}\n${pad ? `/*${'x'.repeat(PAD_BYTES)}*/\n` : ''}${call}\n`;
  fs.writeFileSync(path.join(dir, 'scene.js'), scene);
  fs.writeFileSync(path.join(dir, 'page.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${kind}</title>
<style>html,body{margin:0;background:#fff}</style></head><body>${body}${beforeScene}<script src="scene.js"></script></body></html>`);
  const file = path.join(dir, 'page.html');
  return { root, dir, file, url: pathToFileURL(file).href, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) };
}
