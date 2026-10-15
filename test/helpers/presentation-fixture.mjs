// Copies test/fixtures/presentation/ into a fresh temp dir whose name has a space and an accent
// (the repo itself lives under a path with spaces), and writes the mockup image the HTML expects.
// A 1x1 PNG constant keeps binaries out of the repo.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.join(HERE, '..', 'fixtures', 'presentation');
const TEMPLATES = path.join(HERE, '..', '..', 'templates');
const PNG_1X1 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

export function copyPresentationFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'apresentação teste '));
  const dir = path.join(root, 'apresentação');
  fs.cpSync(FIXTURE, dir, { recursive: true });
  // The author copies the slideshow runtime next to presentation.html; the fixture does the same.
  for (const file of ['slideshow.js', 'slideshow.css']) fs.copyFileSync(path.join(TEMPLATES, file), path.join(dir, file));
  fs.mkdirSync(path.join(dir, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'assets', 'mockup.png'), Buffer.from(PNG_1X1, 'base64'));
  return { root, dir, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) };
}

// A canvas on slide 2 ("concept"), run by templates/canvas-loop.js, 500 px tall across the slide: the poster is magenta, so an export
// that shows the poster is easy to tell from a blank canvas.
//   healthy     a WebGL shader that animates; a fallback laid over it when WebGL is missing
//   frozen      a 2D canvas that is redrawn every frame but never changes
//   slowPoster  like healthy's 2D twin, but the poster is drawn 1.5 s after the page loads (and returns a promise)
export const POSTER_RGB = [255, 0, 170];
export function addCanvasSlide(dir, kind = 'healthy') {
  const template = fs.readFileSync(path.join(TEMPLATES, 'canvas-loop.js'));
  fs.writeFileSync(path.join(dir, 'canvas-loop.js'), template);
  const scenes = {
    healthy: `dfCanvasLoop(c, { context: 'webgl', fallback: '#fb',
      draw(t, gl) { if (!gl.__p) gl.__p = build(gl); gl.viewport(0, 0, c.width, c.height); gl.uniform1f(gl.__p, t / 1000); gl.drawArrays(gl.TRIANGLES, 0, 3); },
      poster(gl) { gl.clearColor(1, 0, 0.667, 1); gl.clear(gl.COLOR_BUFFER_BIT); } });`,
    frozen: `dfCanvasLoop(c, { context: '2d', fallback: '#fb',
      draw(t, x) { const g = x.createLinearGradient(0, 0, c.width, 0); g.addColorStop(0, '#223344'); g.addColorStop(0.5, '#ccaa55'); g.addColorStop(1, '#223344'); x.fillStyle = g; x.fillRect(0, 0, c.width, c.height); },
      poster(x) { x.fillStyle = '#ff00aa'; x.fillRect(0, 0, c.width, c.height); } });`,
    slowPoster: `dfCanvasLoop(c, { context: '2d', fallback: '#fb',
      draw(t, x) { x.fillStyle = 'hsl(' + (t / 10 % 360) + ',70%,50%)'; x.fillRect(0, 0, c.width, c.height); },
      poster(x) { return new Promise((done) => setTimeout(() => { x.fillStyle = '#ff00aa'; x.fillRect(0, 0, c.width, c.height); done(); }, 1500)); } });`,
  };
  if (!scenes[kind]) throw new Error(`unknown canvas slide kind: ${kind}`);
  const file = path.join(dir, 'presentation.html');
  let html = fs.readFileSync(file, 'utf8');
  const before = html;
  html = html.replace('<h2>02 · Concept</h2>',
    '<h2>02 · Concept</h2><div style="position:relative;width:100%;height:500px"><canvas id="c" style="display:block;width:100%;height:500px"></canvas>'
    + '<div id="fb" hidden style="position:absolute;left:0;top:0;width:100%;height:500px;background:linear-gradient(90deg,#112233,#ddaa44)"></div></div>');
  html = html.replace('<script src="slideshow.js"></script>', `<script src="slideshow.js"></script><script src="canvas-loop.js"></script><script>
const c = document.getElementById('c');
const build = (gl) => {
  const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const pr = gl.createProgram();
  gl.attachShader(pr, sh(gl.VERTEX_SHADER, 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}'));
  gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, 'precision mediump float;uniform float t;void main(){gl_FragColor=vec4(.5+.5*sin(t+gl_FragCoord.x*.02),.5+.5*cos(t*1.3+gl_FragCoord.y*.02),.6,1.);}'));
  gl.linkProgram(pr); gl.useProgram(pr);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(pr, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  return gl.getUniformLocation(pr, 't');
};
${scenes[kind]}
</script>`);
  if (html === before || !html.includes('canvas-loop.js')) throw new Error('addCanvasSlide: the fixture markup changed; update the helper');
  fs.writeFileSync(file, html);
}
