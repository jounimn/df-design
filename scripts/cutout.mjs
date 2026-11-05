// Cut a product or a person out of a photo, find what is in it, or mask one named object, so the subject can sit on
// the identity's ground (references/images.md, "Cut out the subject"). Local, CPU only, offline after `setup`.
//
//   node scripts/cutout.mjs setup [--with detect,high,portrait]     make the venv, install, download the weights
//   node scripts/cutout.mjs doctor [--json]                          what is installed, which models are present
//   node scripts/cutout.mjs remove-bg <img...> [--quality draft|default|high] [--subject person] [--model <id>]
//                                   [--out <dir>] [--ground #1f3fbf] [--no-defringe] [--no-trim] [--no-person-check]
//                                   [--record docs/assets.md] [--pages <pages>] [--json]
//   node scripts/cutout.mjs detect <img...> [--labels shoe,bottle] [--threshold 0.5] [--annotate] [--out <dir>] [--json]
//   node scripts/cutout.mjs mask <img...> --label shoe [--box x0,y0,x1,y1] [--pick 1] [--refine hybrid|sam2]
//                                   [--threshold 0.2] [--out <dir>] [--ground #hex] [--record <assets.md>] [--json]
//
// The venv and the weights live in ~/.cache/df-design (DF_DESIGN_CUTOUT_HOME moves them). Only the models in
// scripts/py/cutout-models.json can run, all MIT or Apache-2.0; rembg's own default (non-commercial) never runs.
// Each cutout writes <name>.cutout.png (RGBA, trimmed), <name>.on-ground.jpg (a preview to look at) and prints the
// assets.md row. Exit 0 = at least one output; 1 = none (not found, errors); 2 = bad command line or not set up.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  UsageError, PY_SCRIPT, REQUIREMENTS, loadRegistry, cutoutHome, cutoutPaths, runEnv, pythonCandidates,
  pythonVersionOk, setupGroups, parseCutoutArgs, pythonArgs, describeCutout, PY_MIN, PY_MAX,
} from './lib/cutout.mjs';

const USAGE = fs.readFileSync(new URL(import.meta.url), 'utf8').split('\n').filter((l) => l.startsWith('//   node')).map((l) => l.slice(5)).join('\n');
const fail = (msg, code = 2) => { console.error(msg); process.exit(code); };

let parsed;
try { parsed = parseCutoutArgs(process.argv.slice(2)); } catch (e) { if (e instanceof UsageError) fail(`${e.message}\n\nUsage:\n${USAGE}`); throw e; }
if (parsed.cmd === 'help') { console.log(`Usage:\n${USAGE}`); process.exit(0); }

const registry = loadRegistry();
const paths = cutoutPaths(cutoutHome());
const venvReady = () => fs.existsSync(paths.python);
const show = (p) => path.relative(process.cwd(), p).split(path.sep).join('/') || '.';

function findPython() {
  for (const [cmd, pre] of pythonCandidates()) {
    const r = spawnSync(cmd, [...pre, '-c', 'import sys; print("%d.%d.%d" % sys.version_info[:3])'], { encoding: 'utf8' });
    const v = (r.stdout || '').trim();
    if (r.status === 0 && pythonVersionOk(v)) return { cmd, pre, version: v };
  }
  return null;
}

function step(label, cmd, args, env) {
  console.log(`\n> ${label}`);
  const r = spawnSync(cmd, args, { stdio: 'inherit', env });
  if (r.status !== 0) fail(`${label} failed (exit ${r.status ?? r.error?.message}).`, 1);
}

function runPython(args, { offline = true } = {}) {
  const python = process.env.DF_DESIGN_CUTOUT_PYTHON || paths.python;
  if (!process.env.DF_DESIGN_CUTOUT_PYTHON && !venvReady()) fail(`cutout is not set up: no venv at ${paths.venv}.\nRun: node scripts/cutout.mjs setup${parsed.cmd === 'remove-bg' ? '' : ' --with detect'}`);
  const r = spawnSync(python, ['-I', PY_SCRIPT, ...args], { encoding: 'utf8', env: runEnv(paths, process.env, { offline }), stdio: ['ignore', 'pipe', 'inherit'], maxBuffer: 64 * 1024 * 1024 });
  if (r.error) fail(`could not run ${python}: ${r.error.message}`, 1);
  const line = (r.stdout || '').trim().split('\n').pop();
  let out;
  try { out = JSON.parse(line); } catch { fail(`cutout.py printed no JSON (exit ${r.status}).`, 1); }
  return { status: r.status, out };
}

// ---- setup ----
if (parsed.cmd === 'setup') {
  let groups;
  try { groups = setupGroups(parsed.opts.with, registry); } catch (e) { fail(e.message); }
  if (!venvReady()) {
    const py = findPython();
    if (!py) fail(`no Python ${PY_MIN.join('.')} to ${PY_MAX.join('.')} found. Install one (python.org), or point DF_DESIGN_PYTHON at it.`);
    console.log(`Python ${py.version} (${py.cmd} ${py.pre.join(' ')}) -> venv at ${paths.venv}`);
    fs.mkdirSync(paths.home, { recursive: true });
    step('create the venv', py.cmd, [...py.pre, '-m', 'venv', paths.venv]);
  } else console.log(`venv already at ${paths.venv}`);
  const pip = [paths.python, ['-m', 'pip', 'install', '--disable-pip-version-check', '--no-input']];
  step('install background removal (requirements-cutout.txt)', pip[0], [...pip[1], '-r', REQUIREMENTS.base]);
  if (groups.includes('detect')) step('install detection (requirements-cutout-detect.txt, torch CPU)', pip[0], [...pip[1], '-r', REQUIREMENTS.detect]);
  const sizes = Object.values(registry.models).filter((m) => groups.includes(m.group)).reduce((n, m) => n + m.size_mb, 0);
  console.log(`\n> download the weights for ${groups.join(', ')} (up to ~${sizes} MB, once)`);
  const { out } = runPython(['fetch', '--groups', groups.join(',')], { offline: false });
  if (out.error) fail(out.error, 1);
  for (const r of out.results) console.log(`  ${r.model.padEnd(24)} ${r.status}`);
  if (out.results.some((r) => r.status === 'missing')) process.exit(1);
  console.log(`\nReady. Runs are offline from here on (models in ${paths.home}${path.sep}cutout-models).`);
  process.exit(0);
}

// ---- doctor ----
if (parsed.cmd === 'doctor') {
  const report = { home: paths.home, venv: venvReady() ? paths.venv : null };
  if (!report.venv) {
    const py = findPython();
    report.python = py ? `${py.version} (${py.cmd} ${py.pre.join(' ')})` : null;
  } else {
    const { out } = runPython(['doctor']);
    Object.assign(report, out.results?.[0] || { error: out.error });
  }
  if (parsed.opts.json) { console.log(JSON.stringify(report, null, 2)); process.exit(report.venv ? 0 : 1); }
  console.log(`home     ${report.home}`);
  console.log(`venv     ${report.venv || 'missing: run node scripts/cutout.mjs setup'}`);
  if (!report.venv) { console.log(`python   ${report.python || `none between ${PY_MIN.join('.')} and ${PY_MAX.join('.')} found`}`); process.exit(1); }
  console.log(`python   ${report.python}   offline runs: ${report.offline ? 'yes' : 'no'}`);
  console.log(`packages ${Object.entries(report.packages).map(([k, v]) => `${k} ${v ? 'ok' : 'missing'}`).join(', ')}`);
  for (const [id, m] of Object.entries(report.models)) console.log(`  ${id.padEnd(24)} ${m.present ? 'present' : `missing (setup${m.group === 'base' ? '' : ` --with ${m.group}`})`}  ${m.licence}`);
  process.exit(0);
}

// ---- remove-bg, detect, mask ----
let args;
try { args = pythonArgs(parsed, registry); } catch (e) { if (e instanceof UsageError) fail(e.message); throw e; }
const { out } = runPython(args);
if (out.error) fail(out.error, out.error.includes('not downloaded') ? 2 : 1);

const recordFile = parsed.opts.record;
if (recordFile && !fs.existsSync(recordFile)) fail(`--record: no such file ${recordFile}`);
const recordMd = recordFile ? fs.readFileSync(recordFile, 'utf8') : null;
let written = 0;
for (const r of out.results) {
  if (r.error) { console.log(`${show(r.input)}: ${r.error}`); continue; }
  written++;
  if (parsed.cmd === 'detect') {
    r.files = [r.json, r.annotated].filter(Boolean).map(show);
    if (parsed.opts.json) continue;
    console.log(`${show(r.input)}  ${r.size.join(' x ')}  ${r.detections.length} found${r.merged ? `, ${r.merged} duplicate box${r.merged > 1 ? 'es' : ''} merged` : ''}  (${r.models.map((m) => m.id).join(' + ')}, ${r.seconds} s)`);
    for (const d of r.detections) console.log(`  ${d.label.padEnd(16)} ${d.score.toFixed(2)}  [${d.box.join(', ')}]`);
    for (const l of r.not_found) console.log(`  ${l.padEnd(16)} not found`);
    console.log(`  ${r.files.join('  ')}`);
    continue;
  }
  Object.assign(r, describeCutout(r, { recordFile, recordMd, pages: parsed.opts.pages }));
  if (parsed.opts.json) continue;
  console.log(`${show(r.cutout)}  ${r.size.join(' x ')}  (${r.models.map((m) => `${m.id}, ${m.licence}`).join(' + ')}, ${r.seconds} s)`);
  console.log(`  preview  ${show(r.preview)}  look at it at 100% before placing the cutout: the edge, holes, stray pieces`);
  console.log(`  assets.md row${r.original === 'found' ? '' : ` (${r.original}: fill the source page and licence from the original's row)`}:`);
  console.log(`  ${r.row}`);
  if (r.note) console.log(`  ${r.note.startsWith('recognisable') ? 'WARNING' : 'note'}: ${r.note}`);
}
if (parsed.opts.json) console.log(JSON.stringify(out, null, 2));
process.exit(written ? 0 : 1);
