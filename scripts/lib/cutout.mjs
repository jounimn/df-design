// Pure helpers for scripts/cutout.mjs: the model allow-list, where the venv lives, the command line, and the
// assets.md row a cutout prints. No Python, no network, no model: everything here runs in CI.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseAssetRows } from './presentation-checks.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const PY_DIR = path.join(HERE, '..', 'py');
export const PY_SCRIPT = path.join(PY_DIR, 'cutout.py');
export const REQUIREMENTS = { base: path.join(PY_DIR, 'requirements-cutout.txt'), detect: path.join(PY_DIR, 'requirements-cutout-detect.txt') };

export class UsageError extends Error {}

export function loadRegistry(file = path.join(PY_DIR, 'cutout-models.json')) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

// ---- where things live ----

export function cutoutHome(env = process.env, home = os.homedir()) {
  return env.DF_DESIGN_CUTOUT_HOME ? path.resolve(env.DF_DESIGN_CUTOUT_HOME) : path.join(home, '.cache', 'df-design');
}

export function cutoutPaths(home, platform = process.platform) {
  const venv = path.join(home, 'cutout-venv');
  return {
    home,
    venv,
    python: platform === 'win32' ? path.join(venv, 'Scripts', 'python.exe') : path.join(venv, 'bin', 'python'),
    rembgHome: path.join(home, 'cutout-models', 'rembg'),
    hfHome: path.join(home, 'cutout-models', 'hf'),
  };
}

// The environment every model run gets: its own model folders, and no network (setup is the only command that
// downloads, and it drops the two OFFLINE flags).
export function runEnv(paths, base = process.env, { offline = true } = {}) {
  const env = {
    ...base, REMBG_HOME: paths.rembgHome, HF_HOME: paths.hfHome, PYTHONIOENCODING: 'utf-8', PYTHONUTF8: '1',
    TRANSFORMERS_VERBOSITY: 'error', HF_HUB_DISABLE_PROGRESS_BARS: '1', HF_HUB_DISABLE_TELEMETRY: '1',
  };
  delete env.U2NET_HOME; // rembg prefers it over REMBG_HOME; a stray one would point at another model folder
  if (offline) Object.assign(env, { HF_HUB_OFFLINE: '1', TRANSFORMERS_OFFLINE: '1' });
  else { delete env.HF_HUB_OFFLINE; delete env.TRANSFORMERS_OFFLINE; }
  return env;
}

// Interpreters to try for the venv, newest first. 3.14 is left out until onnxruntime and torch wheels are verified.
export const PY_MIN = [3, 10];
export const PY_MAX = [3, 13];
export function pythonCandidates(platform = process.platform, env = process.env) {
  if (env.DF_DESIGN_PYTHON) return [[env.DF_DESIGN_PYTHON, []]];
  const minors = [];
  for (let m = PY_MAX[1]; m >= PY_MIN[1]; m--) minors.push(m);
  const list = platform === 'win32' ? minors.map((m) => ['py', [`-3.${m}`]]) : [];
  for (const m of minors) list.push([`python3.${m}`, []]);
  list.push(['python3', []], ['python', []]);
  return list;
}

export function pythonVersionOk(version) {
  const [maj, min] = String(version).split('.').map(Number);
  if (!Number.isInteger(maj) || !Number.isInteger(min)) return false;
  const v = maj * 100 + min;
  return v >= PY_MIN[0] * 100 + PY_MIN[1] && v <= PY_MAX[0] * 100 + PY_MAX[1];
}

// ---- models ----

export function setupGroups(withList, registry = loadRegistry()) {
  const known = new Set(Object.values(registry.models).map((m) => m.group));
  const asked = (withList || '').split(',').map((s) => s.trim()).filter(Boolean);
  for (const g of asked) if (!known.has(g) || g === 'base') throw new UsageError(`--with takes ${[...known].filter((k) => k !== 'base').join(', ')}; not "${g}"`);
  return ['base', ...new Set(asked)];
}

// --model wins, then --subject, then --quality. Only allow-listed background removers; never rembg's default.
export function pickModel({ model, quality, subject } = {}, registry = loadRegistry()) {
  let id;
  if (model) id = model;
  else if (subject) {
    id = registry.subject[subject];
    if (!id) throw new UsageError(`--subject takes ${Object.keys(registry.subject).join(', ')}; not "${subject}"`);
  } else {
    id = registry.quality[quality || 'default'];
    if (!id) throw new UsageError(`--quality takes ${Object.keys(registry.quality).join(', ')}; not "${quality}"`);
  }
  const m = registry.models[id];
  if (!m) throw new UsageError(`model "${id}" is not on the allow-list (scripts/py/cutout-models.json). Allowed: ${Object.keys(registry.models).join(', ')}`);
  if (m.task !== 'remove-bg') throw new UsageError(`model "${id}" is a ${m.task} model, not a background remover`);
  return id;
}

// ---- command line ----

const SPEC = {
  setup: { valued: ['--with'], bool: [] },
  doctor: { valued: [], bool: ['--json'] },
  'remove-bg': { valued: ['--out', '--ground', '--quality', '--subject', '--model', '--record', '--pages', '--backend'], bool: ['--no-defringe', '--no-trim', '--no-person-check', '--json'] },
  detect: { valued: ['--out', '--labels', '--threshold', '--backend'], bool: ['--annotate', '--json'] },
  mask: { valued: ['--out', '--ground', '--label', '--box', '--pick', '--threshold', '--refine', '--record', '--pages', '--backend'], bool: ['--no-defringe', '--no-trim', '--json'] },
};
export const COMMANDS = Object.keys(SPEC);
const NODE_ONLY = new Set(['--record', '--pages', '--json', '--backend', '--quality', '--subject', '--model', '--with']);

export function parseCutoutArgs(argv) {
  const [cmd, ...rest] = argv;
  if (!cmd || cmd === '--help' || cmd === '-h' || cmd === 'help') return { cmd: 'help' };
  const spec = SPEC[cmd];
  if (!spec) throw new UsageError(`unknown command "${cmd}" (known: ${COMMANDS.join(', ')})`);
  const opts = {};
  const inputs = [];
  for (let i = 0; i < rest.length; i++) {
    const a = rest[i];
    if (a.startsWith('--')) {
      const [k, inline] = a.includes('=') ? [a.slice(0, a.indexOf('=')), a.slice(a.indexOf('=') + 1)] : [a, undefined];
      if (spec.valued.includes(k)) {
        const v = inline ?? rest[++i];
        if (v === undefined || (inline === undefined && v.startsWith('--'))) throw new UsageError(`${k} needs a value`);
        opts[k.slice(2)] = v;
      } else if (spec.bool.includes(k) && inline === undefined) opts[k.slice(2)] = true;
      else throw new UsageError(`unknown option ${a} for ${cmd} (known: ${[...spec.valued, ...spec.bool].join(', ') || 'none'})`);
    } else inputs.push(a);
  }
  if (['setup', 'doctor'].includes(cmd) && inputs.length) throw new UsageError(`${cmd} takes no files`);
  if (['remove-bg', 'detect', 'mask'].includes(cmd) && !inputs.length) throw new UsageError(`${cmd} needs at least one image`);
  if (cmd === 'mask' && !opts.label) throw new UsageError('mask needs --label <what to cut out>, e.g. --label shoe');
  if (opts.backend && !['models', 'stub'].includes(opts.backend)) throw new UsageError('--backend takes models or stub');
  if (opts.threshold !== undefined && !(Number(opts.threshold) > 0 && Number(opts.threshold) < 1)) throw new UsageError('--threshold takes a number between 0 and 1');
  if (opts.pick !== undefined && !(Number.isInteger(Number(opts.pick)) && Number(opts.pick) >= 1)) throw new UsageError('--pick counts from 1');
  if (opts.ground !== undefined && !/^#?[0-9a-f]{6}$/i.test(opts.ground)) throw new UsageError('--ground takes a #rrggbb colour');
  if (opts.refine !== undefined && !['hybrid', 'sam2'].includes(opts.refine)) throw new UsageError('--refine takes hybrid or sam2');
  return { cmd, inputs, opts };
}

// The argument list for cutout.py, from the parsed Node command line.
export function pythonArgs({ cmd, inputs, opts }, registry = loadRegistry()) {
  const args = ['--backend', opts.backend || 'models', cmd, ...inputs];
  if (cmd === 'remove-bg') args.push('--model', pickModel(opts, registry));
  for (const [k, v] of Object.entries(opts)) {
    if (NODE_ONLY.has(`--${k}`)) continue;
    args.push(`--${k}`);
    if (v !== true) args.push(k === 'ground' && !v.startsWith('#') ? `#${v}` : String(v));
  }
  return args;
}

// ---- the record ----

const cell = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();

// "cutout of sneakers.jpg: birefnet-general-lite (ZhengPeng7/BiRefNet_lite, MIT), defringed". The text never says
// credit or attribution: check-auditions reads the whole row through licenceNeedsCredit().
export function treatmentText(result) {
  const models = (result.models || []).map((m) => `${m.id} (${m.source}, ${m.licence})`).join(' + ');
  const what = result.label ? `cutout of the ${result.label} in ${path.basename(result.input)}` : `cutout of ${path.basename(result.input)}`;
  const extra = /defringed/.test(result.treatment || '') ? ', defringed' : '';
  return `${what}: ${models || 'no model'}${extra}`;
}

export function assetRow({ file, source, licence, date, treatment, pages }) {
  return `| ${[file, source || '<source page of the original>', licence || '<licence of the original>', date, treatment, pages || '<pages>'].map(cell).join(' | ')} |`;
}

// The original photo's row in an assets.md, found by the input's file name.
export function originalRow(md, inputFile) {
  const base = path.basename(inputFile).toLowerCase();
  return parseAssetRows(md).find((r) => path.basename(r.file).toLowerCase() === base && /^https?:\/\//.test(r.source.replace(/[<>]/g, ''))) || null;
}

export const PERSON_WARNING = 'recognisable person: CC0 or a free licence covers copyright, not publicity. CC0 is not a model release (images.md, trap 4). Use it in marketing only with a release, or choose hands, detail or a product instead.';
export const PERSON_REMINDER = 'if the subject is a recognisable person, CC0 is not a model release (images.md, trap 4). Install detection (setup --with detect) to have this checked.';

export function personNote(person) {
  if (person === true) return PERSON_WARNING;
  if (person === null || person === undefined) return PERSON_REMINDER;
  return null;
}

export const today = () => new Date().toLocaleDateString('sv-SE');

// Turn one cutout result into what the CLI prints: the row and the person note.
export function describeCutout(result, { recordFile, recordMd, pages, date = today(), cwd = process.cwd() } = {}) {
  const dir = recordFile ? path.dirname(path.resolve(recordFile)) : cwd;
  const file = path.relative(dir, path.resolve(result.cutout)).split(path.sep).join('/');
  const orig = recordMd ? originalRow(recordMd, result.input) : null;
  return {
    row: assetRow({ file, source: orig?.source, licence: orig?.licence, date, treatment: treatmentText(result), pages }),
    original: orig ? 'found' : recordMd ? 'not in the record' : 'no record given',
    note: personNote(result.person),
  };
}
