// The ink pass: force a picture (a generated key panel, a render, a scan) into the brief's inks, deterministically,
// with hatching that follows the form, screentone only where there is no structure, and the hint only through a mask
// and never on a figure. Then split it into a background plane and a figure plane for parallax
// (references/drawn-assets.md §8).
//
//   node scripts/ink-pass.mjs doctor [--json]
//   node scripts/ink-pass.mjs ink <img> --out <base> (--brief docs/identity.md | --ink #hex --paper #hex [--hint #hex])
//                                 [--map ink|paper|hint|hintlit] [--texture hatch|dots] [--width 3072,1200]
//                                 [--cell 6] [--strokelen 22] [--lo 0.18] [--hi 0.72] [--gamma 1] [--seed 7]
//                                 [--hint-mask auto|none|<mask.png>] [--hint-hue 285,350]
//                                 [--exclude x0,y0,x1,y1] [--erase x0,y0,x1,y1] [--figure <alpha.png> | --cutout person|object]
//                                 [--debug] [--json]
//   node scripts/ink-pass.mjs layers <inked.png> --out <dir> --name <name> --alpha <figure.png|ellipse|none>
//                                 (--fill #hex | --brief docs/identity.md) [--grow 7] [--format webp|png] [--json]
//
// Python 3 with numpy and Pillow does the pixels: DF_DESIGN_INK_PYTHON, else the cutout tool's venv
// (node scripts/cutout.mjs setup), else a system Python that has both. --cutout runs scripts/cutout.mjs remove-bg
// --no-trim on the source first and keeps its alpha as <base>.figure.png, for `layers --alpha`.
// Exit 0 = written; 1 = the run failed; 2 = bad command line or no usable Python.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  UsageError, INK_PY, parseInkArgs, resolveInks, resolveFill, inkPythonArgs, layersPythonArgs, inkPythonCandidates, treatment,
} from './lib/ink-pass.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const HEAD = fs.readFileSync(new URL(import.meta.url), 'utf8').replace(/\r\n/g, '\n').split('\n');
const first = HEAD.findIndex((l) => l.startsWith('//   node'));
const USAGE = HEAD.slice(first, HEAD.indexOf('//', first)).map((l) => l.slice(5)).join('\n');
const fail = (msg, code = 2) => { console.error(msg); process.exit(code); };

let parsed;
try { parsed = parseInkArgs(process.argv.slice(2)); } catch (e) { if (e instanceof UsageError) fail(`${e.message}\n\nUsage:\n${USAGE}`); throw e; }
if (parsed.cmd === 'help') { console.log(`Usage:\n${USAGE}`); process.exit(0); }

function findPython() {
  for (const [cmd, pre] of inkPythonCandidates()) {
    const r = spawnSync(cmd, [...pre, '-I', '-c', 'import numpy, PIL, sys; print(sys.executable); print(numpy.__version__); print(PIL.__version__)'], { encoding: 'utf8' });
    if (r.status === 0) { const [exe, np, pil] = r.stdout.trim().split(/\r?\n/); return { exe, numpy: np, pillow: pil }; }
  }
  return null;
}

const py = findPython();
if (parsed.cmd === 'doctor') {
  const report = { python: py?.exe || null, numpy: py?.numpy || null, pillow: py?.pillow || null, script: INK_PY };
  if (parsed.opts.json) console.log(JSON.stringify(report, null, 2));
  else console.log(py ? `python   ${py.exe}\nnumpy    ${py.numpy}\npillow   ${py.pillow}` : 'no Python with numpy and Pillow found: run node scripts/cutout.mjs setup (its venv has both), or point DF_DESIGN_INK_PYTHON at one');
  process.exit(py ? 0 : 1);
}
if (!py) fail('no Python with numpy and Pillow found: run node scripts/cutout.mjs setup (its venv has both), or point DF_DESIGN_INK_PYTHON at one');

function runPy(args) {
  const r = spawnSync(py.exe, ['-I', INK_PY, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 16 * 1024 * 1024, env: { ...process.env, PYTHONIOENCODING: 'utf-8' } });
  const line = (r.stdout || '').trim().split('\n').pop();
  let out = null;
  try { out = JSON.parse(line); } catch { /* reported below */ }
  if (r.status !== 0 || !out || out.error) fail(out?.error || `ink-pass.py failed (exit ${r.status}): ${(r.stderr || '').trim().split('\n').slice(-3).join(' ')}`, 1);
  return out;
}

const show = (p) => path.relative(process.cwd(), p).split(path.sep).join('/') || '.';
const { opts, inputs } = parsed;
if (!fs.existsSync(inputs[0])) fail(`no such file ${inputs[0]}`, 1);

try {
  if (parsed.cmd === 'ink') {
    const inks = resolveInks(opts);
    let figure = opts.figure;
    if (figure && !fs.existsSync(figure)) fail(`--figure: no such file ${figure}`, 1);
    if (opts.cutout) {
      // the figure's alpha at frame size, from the cutout tool (allow-listed MIT or Apache-2.0 models only)
      const dir = path.dirname(path.resolve(opts.out));
      fs.mkdirSync(dir, { recursive: true });
      const args = [path.join(HERE, 'cutout.mjs'), 'remove-bg', inputs[0], '--no-trim', '--out', dir];
      if (opts.cutout === 'person') args.push('--subject', 'person', '--no-person-check');
      const r = spawnSync(process.execPath, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] });
      if (r.status !== 0) fail(`--cutout: scripts/cutout.mjs remove-bg failed (exit ${r.status}); run node scripts/cutout.mjs doctor`, 1);
      const made = path.join(dir, `${path.basename(inputs[0], path.extname(inputs[0]))}.cutout.png`);
      figure = `${path.resolve(opts.out)}.figure.png`;
      fs.copyFileSync(made, figure);
    }
    fs.mkdirSync(path.dirname(path.resolve(opts.out)), { recursive: true });
    const out = runPy(inkPythonArgs(parsed, inks, figure));
    const record = treatment(opts, inks);
    if (opts.json) { console.log(JSON.stringify({ ...out, figure: figure || null, treatment: record }, null, 2)); process.exit(0); }
    for (const r of out.results) {
      console.log(`${show(r.file)}  ${r.width} x ${r.height}  map ${r.map}, ${r.texture}: ink ${r.ink_pct} %, paper ${r.paper_pct} %, hint ${r.hint_pct} %${r.texture === 'hatch' ? `, hatched ${r.hatched_pct} %` : ''}`);
      if (r.hint_on_figure) console.log(`  WARNING: ${r.hint_on_figure} px of hint on the figure`);
    }
    if (figure) console.log(`  figure alpha  ${show(figure)}  (for: node scripts/ink-pass.mjs layers <inked.png> --alpha ${show(figure)} ...)`);
    console.log(`  assets.md treatment: ${record}`);
    console.log('  look at it at 100 % before it goes on a page: the hatching follows the form, no hint on a figure, nothing the model drew against the prompt');
  } else {
    const fill = resolveFill(opts);
    if (!['ellipse', 'none'].includes(opts.alpha) && !fs.existsSync(opts.alpha)) fail(`--alpha: no such file ${opts.alpha}`, 1);
    fs.mkdirSync(opts.out, { recursive: true });
    const out = runPy(layersPythonArgs(parsed, fill));
    if (opts.json) { console.log(JSON.stringify(out, null, 2)); process.exit(0); }
    const r = out.results[0];
    console.log(`${show(r.background)}  ${r.width} x ${r.height}${r.figure ? `, the figure's place filled with ${fill}` : ''}`);
    if (r.figure) console.log(`${show(r.figure)}  the figure at full frame, ${r.figure_pct} % of it`);
  }
} catch (e) {
  if (e instanceof UsageError) fail(`${e.message}\n\nUsage:\n${USAGE}`);
  throw e;
}
