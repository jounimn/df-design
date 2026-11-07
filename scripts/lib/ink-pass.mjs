// Pure helpers for scripts/ink-pass.mjs: the command line, the colours (from flags or the brief's Hint line), the
// Python to run and the argument list for scripts/py/ink-pass.py. No Python here: everything in this file runs in CI.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { cutoutHome, cutoutPaths, pythonCandidates } from './cutout.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const INK_PY = path.join(HERE, '..', 'py', 'ink-pass.py');
export const MAPS = ['ink', 'paper', 'hint', 'hintlit'];
export const TEXTURES = ['hatch', 'dots'];

export class UsageError extends Error {}

const HEX = /^#?[0-9a-f]{6}$/i;
export const normHex = (s) => `#${String(s).replace(/^#/, '').toUpperCase()}`;

// Relative luminance of a #rrggbb colour, 0 (black) to 1 (white).
export function luminance(hex) {
  const v = normHex(hex).slice(1).match(/../g).map((h) => parseInt(h, 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
}

// The brief's Hint line (identity.md §8): "Hint: <base pair> → <the hint> ...". The two colours before the arrow are
// the base pair (the darker is the ink, the lighter the paper); the first colour after it is the hint.
export function inksFromBrief(text) {
  const line = String(text).replace(/\r\n/g, '\n').split('\n').find((l) => /^\s*(?:[-*]\s*)?(?:\*\*)?Hint:?(?:\*\*)?:?\s/.test(l));
  if (!line) return null;
  const [before, after = ''] = line.split(/→|->/);
  const base = (before.match(/#[0-9a-f]{6}\b/gi) || []).slice(0, 2);
  const hint = (after.match(/#[0-9a-f]{6}\b/gi) || [])[0];
  if (base.length < 2) return null;
  const [ink, paper] = [...base].sort((a, b) => luminance(a) - luminance(b)).map(normHex);
  return { ink, paper, hint: hint ? normHex(hint) : null };
}

const SPEC = {
  doctor: { valued: [], multi: [], bool: ['--json'] },
  ink: {
    valued: ['--out', '--ink', '--paper', '--hint', '--brief', '--map', '--texture', '--width', '--cell', '--strokelen', '--lo', '--hi', '--gamma', '--hint-mask', '--hint-hue', '--figure', '--cutout', '--seed'],
    multi: ['--exclude', '--erase'],
    bool: ['--debug', '--json'],
  },
  layers: { valued: ['--out', '--name', '--alpha', '--fill', '--brief', '--grow', '--format'], multi: [], bool: ['--json'] },
};
export const COMMANDS = Object.keys(SPEC);

export function parseInkArgs(argv) {
  const [cmd, ...rest] = argv;
  if (!cmd || cmd === '--help' || cmd === '-h' || cmd === 'help') return { cmd: 'help' };
  const spec = SPEC[cmd];
  if (!spec) throw new UsageError(`unknown command "${cmd}" (known: ${COMMANDS.join(', ')})`);
  const opts = { exclude: [], erase: [] };
  const inputs = [];
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (!a.startsWith('--')) { inputs.push(a); continue; }
    const [k, inline] = a.includes('=') ? [a.slice(0, a.indexOf('=')), a.slice(a.indexOf('=') + 1)] : [a, undefined];
    const key = k.slice(2);
    if (spec.valued.includes(k) || spec.multi.includes(k)) {
      const v = inline ?? rest[++i];
      if (v === undefined || (inline === undefined && v.startsWith('--'))) throw new UsageError(`${k} needs a value`);
      if (spec.multi.includes(k)) opts[key].push(v); else opts[key] = v;
    } else if (spec.bool.includes(k) && inline === undefined) opts[key] = true;
    else throw new UsageError(`unknown option ${a} for ${cmd} (known: ${[...spec.valued, ...spec.multi, ...spec.bool].join(', ') || 'none'})`);
  }
  if (cmd === 'doctor' && inputs.length) throw new UsageError('doctor takes no files');
  if (cmd !== 'doctor' && inputs.length !== 1) throw new UsageError(`${cmd} takes one image`);
  if (cmd === 'ink') validateInk(opts);
  if (cmd === 'layers') validateLayers(opts);
  return { cmd, inputs, opts };
}

const num = (opts, k, ok, msg) => { if (opts[k] !== undefined && !(Number.isFinite(Number(opts[k])) && ok(Number(opts[k])))) throw new UsageError(`--${k} ${msg}`); };
const box = /^-?\d+(\.\d+)?(,-?\d+(\.\d+)?){3}$/;

function validateInk(o) {
  if (!o.out) throw new UsageError('ink needs --out <base> (the file name without .png)');
  for (const k of ['ink', 'paper', 'hint']) if (o[k] !== undefined && !HEX.test(o[k])) throw new UsageError(`--${k} takes a #rrggbb colour`);
  if (o.map && !MAPS.includes(o.map)) throw new UsageError(`--map takes ${MAPS.join(', ')}`);
  if (o.texture && !TEXTURES.includes(o.texture)) throw new UsageError(`--texture takes ${TEXTURES.join(', ')}`);
  if (o.width !== undefined && !/^\d{2,5}(,\d{2,5})*$/.test(o.width)) throw new UsageError('--width takes a width in px, or several separated by commas (3072,1200)');
  num(o, 'cell', (v) => v > 0, 'takes a number above 0');
  num(o, 'strokelen', (v) => v > 0, 'takes a number above 0');
  num(o, 'lo', (v) => v >= 0 && v < 1, 'takes a number from 0 to 1');
  num(o, 'hi', (v) => v > 0 && v <= 1, 'takes a number from 0 to 1');
  num(o, 'gamma', (v) => v > 0, 'takes a number above 0');
  num(o, 'seed', (v) => Number.isInteger(v) && v >= 0, 'takes a whole number');
  if (o.lo !== undefined && o.hi !== undefined && Number(o.lo) >= Number(o.hi)) throw new UsageError('--lo must be below --hi');
  if (o['hint-hue'] !== undefined && !/^-?\d+(\.\d+)?,-?\d+(\.\d+)?$/.test(o['hint-hue'])) throw new UsageError('--hint-hue takes lo,hi in degrees (285,350)');
  for (const k of ['exclude', 'erase']) for (const b of o[k]) if (!box.test(b)) throw new UsageError(`--${k} takes a box x0,y0,x1,y1 in the source's pixels, not "${b}"`);
  if (o.cutout !== undefined && !['person', 'object'].includes(o.cutout)) throw new UsageError('--cutout takes person or object');
  if (o.cutout && o.figure) throw new UsageError('give --figure or --cutout, not both');
}

function validateLayers(o) {
  if (!o.out) throw new UsageError('layers needs --out <dir>');
  if (!o.name) throw new UsageError('layers needs --name <name>');
  if (!o.alpha) throw new UsageError('layers needs --alpha <figure.png>, ellipse or none');
  if (o.fill !== undefined && !HEX.test(o.fill)) throw new UsageError('--fill takes a #rrggbb colour');
  num(o, 'grow', (v) => Number.isInteger(v) && v >= 0, 'takes a whole number of px');
  if (o.format && !['webp', 'png'].includes(o.format)) throw new UsageError('--format takes webp or png');
}

// The inks for a run: the flags win, then the brief. Nothing falls back to a built-in palette.
export function resolveInks(opts, readFile = (p) => fs.readFileSync(p, 'utf8')) {
  const fromBrief = opts.brief ? inksFromBrief(readFile(opts.brief)) : null;
  if (opts.brief && !fromBrief) throw new UsageError(`--brief ${opts.brief}: no Hint line with a base pair (Hint: #ink and #paper → #hint)`);
  const pick = (k) => (opts[k] ? normHex(opts[k]) : fromBrief?.[k] || null);
  const inks = { ink: pick('ink'), paper: pick('paper'), hint: pick('hint') };
  if (!inks.ink || !inks.paper) throw new UsageError('the inks come from the brief: give --ink and --paper (and --hint), or --brief <identity.md> with its Hint line');
  if ((opts.map === 'hint' || opts.map === 'hintlit') && !inks.hint) throw new UsageError(`--map ${opts.map} needs a hint colour (--hint, or the brief's Hint line)`);
  return inks;
}

// The argument list for ink-pass.py.
export function inkPythonArgs({ inputs, opts }, inks, figure = opts.figure) {
  const args = ['ink', inputs[0], opts.out, '--ink', inks.ink, '--paper', inks.paper];
  if (inks.hint) args.push('--hint', inks.hint);
  for (const k of ['map', 'texture', 'width', 'cell', 'strokelen', 'lo', 'hi', 'gamma', 'hint-mask', 'hint-hue', 'seed']) if (opts[k] !== undefined) args.push(`--${k}`, String(opts[k]));
  if (figure) args.push('--figure', figure);
  for (const k of ['exclude', 'erase']) if (opts[k].length) args.push(`--${k}`, ...opts[k]);
  if (opts.debug) args.push('--debug');
  return args;
}

export function layersPythonArgs({ inputs, opts }, fill) {
  const args = ['layers', inputs[0], opts.out, opts.name, '--alpha', opts.alpha, '--fill', fill];
  if (opts.grow !== undefined) args.push('--grow', String(opts.grow));
  if (opts.format) args.push('--format', opts.format);
  return args;
}

// The fill behind a figure in `layers`: --fill, else the brief's ink (the set's ground is usually the ink).
export function resolveFill(opts, readFile = (p) => fs.readFileSync(p, 'utf8')) {
  if (opts.fill) return normHex(opts.fill);
  const b = opts.brief ? inksFromBrief(readFile(opts.brief)) : null;
  if (b) return b.ink;
  throw new UsageError('layers needs --fill <the set\'s ground> (or --brief, which uses its ink)');
}

// Interpreters to try, in order: DF_DESIGN_INK_PYTHON, the cutout tool's venv (it has numpy and Pillow), then the
// system Pythons the cutout tool would try. The CLI keeps the first that imports numpy and PIL.
export function inkPythonCandidates(env = process.env, platform = process.platform) {
  if (env.DF_DESIGN_INK_PYTHON) return [[env.DF_DESIGN_INK_PYTHON, []]];
  const venv = cutoutPaths(cutoutHome(env), platform).python;
  const list = fs.existsSync(venv) ? [[venv, []]] : [];
  return [...list, ...pythonCandidates(platform, env)];
}

// The asset-record treatment text for an inked file, so the ink settings travel with the picture (images.md §5).
export function treatment(opts, inks) {
  const parts = [`ink pass (scripts/ink-pass.mjs): map ${opts.map || 'ink'}, ${opts.texture || 'hatch'}`, `inks ${inks.ink} / ${inks.paper}${inks.hint ? ` / hint ${inks.hint}` : ''}`];
  const set = ['cell', 'strokelen', 'lo', 'hi', 'gamma', 'seed'].filter((k) => opts[k] !== undefined).map((k) => `${k} ${opts[k]}`);
  if (set.length) parts.push(set.join(', '));
  if (opts.erase.length) parts.push(`erased ${opts.erase.join(' ')}`);
  if (opts.exclude.length) parts.push(`hint excluded ${opts.exclude.join(' ')}`);
  if (opts.figure || opts.cutout) parts.push('figure kept clear of the hint');
  return parts.join('; ');
}
