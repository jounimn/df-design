// scripts/cutout.mjs in three layers. Pure helpers always run. The Python plumbing runs with `--backend stub`
// (no weights) when some Python with Pillow and numpy is found, and is skipped otherwise. The real models run only
// with DF_DESIGN_CUTOUT_TESTS=1 and a venv made by `node scripts/cutout.mjs setup`: a cold load is minutes on a laptop.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  loadRegistry, pickModel, parseCutoutArgs, pythonArgs, cutoutHome, cutoutPaths, runEnv, pythonCandidates,
  pythonVersionOk, setupGroups, treatmentText, assetRow, originalRow, describeCutout, personNote,
  PERSON_WARNING, PERSON_REMINDER, UsageError,
} from '../scripts/lib/cutout.mjs';
import { licenceNeedsCredit } from '../scripts/lib/licence.mjs';
import { parseAssetRows } from '../scripts/lib/presentation-checks.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const CLI = path.join(HERE, '..', 'scripts', 'cutout.mjs');
const registry = loadRegistry();

// ---------------- pure helpers ----------------

test('every allow-listed model is MIT or Apache-2.0, and nothing non-commercial is on the list', () => {
  for (const [id, m] of Object.entries(registry.models)) {
    assert.ok(['MIT', 'Apache-2.0'].includes(m.licence), `${id}: ${m.licence}`);
    assert.ok(/^https:\/\//.test(m.card), `${id} names its model card`);
    if (m.runner === 'hf') assert.match(m.revision, /^[0-9a-f]{40}$/, `${id} is pinned to a commit`);
  }
  for (const banned of ['bria-rmbg', 'isnet-general-use', 'u2netp', 'silueta', 'sam']) assert.equal(registry.models[banned], undefined, banned);
  for (const id of [...Object.values(registry.quality), ...Object.values(registry.subject)]) assert.equal(registry.models[id].task, 'remove-bg', id);
});

test('pickModel maps quality and subject, and refuses anything off the list (never rembg\'s default)', () => {
  assert.equal(pickModel({}, registry), 'birefnet-general-lite');
  assert.equal(pickModel({ quality: 'draft' }, registry), 'u2net');
  assert.equal(pickModel({ quality: 'high' }, registry), 'birefnet-general');
  assert.equal(pickModel({ subject: 'person', quality: 'draft' }, registry), 'birefnet-portrait');
  assert.equal(pickModel({ model: 'u2net', quality: 'high' }, registry), 'u2net');
  assert.throws(() => pickModel({ model: 'bria-rmbg' }, registry), /not on the allow-list/);
  assert.throws(() => pickModel({ model: 'isnet-general-use' }, registry), /not on the allow-list/);
  assert.throws(() => pickModel({ model: 'rtdetr-v2-r18' }, registry), /detect model, not a background remover/);
  assert.throws(() => pickModel({ quality: 'ultra' }, registry), UsageError);
  assert.throws(() => pickModel({ subject: 'cat' }, registry), UsageError);
});

test('the command line: commands, inputs, flags, and the errors that exit 2', () => {
  assert.deepEqual(parseCutoutArgs([]), { cmd: 'help' });
  const p = parseCutoutArgs(['remove-bg', 'a.jpg', 'b.png', '--quality', 'high', '--ground=000000', '--no-defringe']);
  assert.deepEqual(p, { cmd: 'remove-bg', inputs: ['a.jpg', 'b.png'], opts: { quality: 'high', ground: '000000', 'no-defringe': true } });
  assert.deepEqual(parseCutoutArgs(['mask', 'a.jpg', '--label', 'shoe', '--pick', '2']).opts, { label: 'shoe', pick: '2' });
  const bad = [
    [['paint', 'a.jpg'], /unknown command/],
    [['remove-bg'], /at least one image/],
    [['mask', 'a.jpg'], /needs --label/],
    [['detect', 'a.jpg', '--label', 'x'], /unknown option --label/],
    [['detect', 'a.jpg', '--threshold', '2'], /between 0 and 1/],
    [['mask', 'a.jpg', '--label', 'x', '--pick', '0'], /counts from 1/],
    [['remove-bg', 'a.jpg', '--ground', 'blue'], /#rrggbb/],
    [['remove-bg', 'a.jpg', '--out'], /needs a value/],
    [['setup', 'a.jpg'], /takes no files/],
    [['remove-bg', 'a.jpg', '--backend', 'gpu'], /models or stub/],
  ];
  for (const [argv, re] of bad) assert.throws(() => parseCutoutArgs(argv), re, argv.join(' '));
});

test('pythonArgs turns quality into an allow-listed --model and keeps Node-only flags out of Python', () => {
  const args = pythonArgs(parseCutoutArgs(['remove-bg', 'a.jpg', '--quality', 'draft', '--ground', '1f3fbf', '--record', 'assets.md', '--pages', 'home', '--json']), registry);
  assert.deepEqual(args, ['--backend', 'models', 'remove-bg', 'a.jpg', '--model', 'u2net', '--ground', '#1f3fbf']);
  assert.deepEqual(pythonArgs(parseCutoutArgs(['mask', 'a.jpg', '--label', 'shoe', '--backend', 'stub']), registry), ['--backend', 'stub', 'mask', 'a.jpg', '--label', 'shoe']);
  assert.throws(() => pythonArgs(parseCutoutArgs(['remove-bg', 'a.jpg', '--model', 'bria-rmbg']), registry), /allow-list/);
});

test('the venv lives in ~/.cache/df-design unless DF_DESIGN_CUTOUT_HOME moves it', () => {
  assert.equal(cutoutHome({}, '/home/me'), path.join('/home/me', '.cache', 'df-design'));
  assert.equal(cutoutHome({ DF_DESIGN_CUTOUT_HOME: 'x' }, '/home/me'), path.resolve('x'));
  const win = cutoutPaths('C:\\h', 'win32');
  assert.equal(win.python, path.join('C:\\h', 'cutout-venv', 'Scripts', 'python.exe'));
  assert.equal(cutoutPaths('/h', 'linux').python, path.join('/h', 'cutout-venv', 'bin', 'python'));
});

test('model runs are offline and use their own model folders; setup is the one online step', () => {
  const p = cutoutPaths('/h', 'linux');
  const env = runEnv(p, { U2NET_HOME: '/elsewhere', PATH: '/bin' });
  assert.equal(env.HF_HUB_OFFLINE, '1');
  assert.equal(env.TRANSFORMERS_OFFLINE, '1');
  assert.equal(env.U2NET_HOME, undefined);
  assert.equal(env.REMBG_HOME, p.rembgHome);
  assert.equal(env.HF_HOME, p.hfHome);
  const online = runEnv(p, { HF_HUB_OFFLINE: '1' }, { offline: false });
  assert.equal(online.HF_HUB_OFFLINE, undefined);
});

test('Python 3.10 to 3.13 is accepted; the Windows launcher is tried first; DF_DESIGN_PYTHON overrides', () => {
  for (const v of ['3.10.0', '3.11.9', '3.13.5']) assert.equal(pythonVersionOk(v), true, v);
  for (const v of ['3.9.18', '3.14.0', '2.7.18', 'x']) assert.equal(pythonVersionOk(v), false, v);
  assert.deepEqual(pythonCandidates('win32', {})[0], ['py', ['-3.13']]);
  assert.deepEqual(pythonCandidates('linux', {})[0], ['python3.13', []]);
  assert.deepEqual(pythonCandidates('linux', { DF_DESIGN_PYTHON: '/opt/py' }), [['/opt/py', []]]);
});

test('setup groups: base always, the rest by name', () => {
  assert.deepEqual(setupGroups(undefined, registry), ['base']);
  assert.deepEqual(setupGroups('detect,high,detect', registry), ['base', 'detect', 'high']);
  assert.throws(() => setupGroups('gpu', registry), /--with takes/);
});

const RESULT = {
  input: 'images/sneakers.jpg', cutout: 'images/sneakers.cutout.png', treatment: 'cutout, defringed', person: false,
  models: [{ id: 'birefnet-general-lite', source: 'ZhengPeng7/BiRefNet_lite', licence: 'MIT' }],
};
const RECORD = `# Assets\n\n| File | Source page | Licence | Downloaded | Treatment | Pages |\n|---|---|---|---|---|---|\n| images/sneakers.jpg | https://commons.wikimedia.org/wiki/File:Ash_and_orange_sneakers.jpg | CC0 | 2026-11-03 | none | landing |\n`;

test('the assets.md row: the model goes in Treatment, and the row passes the licence checks', () => {
  const t = treatmentText(RESULT);
  assert.equal(t, 'cutout of sneakers.jpg: birefnet-general-lite (ZhengPeng7/BiRefNet_lite, MIT), defringed');
  assert.equal(treatmentText({ ...RESULT, label: 'shoe' }).startsWith('cutout of the shoe in sneakers.jpg'), true);
  const row = assetRow({ file: 'images/sneakers.cutout.png', source: 'https://commons.wikimedia.org/wiki/File:Ash_and_orange_sneakers.jpg', licence: 'CC0', date: '2026-11-03', treatment: t, pages: 'landing' });
  assert.equal(licenceNeedsCredit(row), false);
  const [parsed] = parseAssetRows(row);
  assert.deepEqual([parsed.file, parsed.licence], ['images/sneakers.cutout.png', 'CC0']);
  // with no record, the source columns are placeholders, which the presentation checker refuses
  assert.match(assetRow({ file: 'a.png', date: 'd', treatment: t }), /<source page of the original> \| <licence of the original>/);
  assert.match(assetRow({ file: 'a|b.png', date: 'd', treatment: 'x' }), /a\\\|b\.png/);
});

test('--record finds the original photo\'s row and fills the source and licence', () => {
  assert.equal(originalRow(RECORD, 'elsewhere/sneakers.jpg').licence, 'CC0');
  assert.equal(originalRow(RECORD, 'bottle.jpg'), null);
  const d = describeCutout(RESULT, { recordFile: 'assets.md', recordMd: RECORD, pages: 'landing', date: '2026-11-03', cwd: process.cwd() });
  assert.equal(d.original, 'found');
  assert.equal(d.row, '| images/sneakers.cutout.png | https://commons.wikimedia.org/wiki/File:Ash_and_orange_sneakers.jpg | CC0 | 2026-11-03 | cutout of sneakers.jpg: birefnet-general-lite (ZhengPeng7/BiRefNet_lite, MIT), defringed | landing |');
  assert.equal(describeCutout(RESULT, { date: 'd' }).original, 'no record given');
});

test('a person in the cutout warns that CC0 is not a model release; unknown prints the reminder', () => {
  assert.equal(personNote(true), PERSON_WARNING);
  assert.match(PERSON_WARNING, /CC0 is not a model release/);
  assert.equal(personNote(null), PERSON_REMINDER);
  assert.equal(personNote(false), null);
});

// ---------------- Python plumbing, stub backend ----------------

function hasPilNumpy(cmd, pre = []) {
  const r = spawnSync(cmd, [...pre, '-I', '-c', 'import PIL, numpy, sys; print(sys.executable)'], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : null;
}
function findStubPython() {
  if (process.env.DF_DESIGN_CUTOUT_PYTHON) return hasPilNumpy(process.env.DF_DESIGN_CUTOUT_PYTHON);
  const venv = cutoutPaths(cutoutHome()).python;
  if (fs.existsSync(venv) && hasPilNumpy(venv)) return venv;
  for (const [cmd, pre] of pythonCandidates()) { const exe = hasPilNumpy(cmd, pre); if (exe) return exe; }
  return null;
}
const STUB_PY = findStubPython();
const stubSkip = STUB_PY ? false : 'no Python with Pillow and numpy found (run node scripts/cutout.mjs setup)';

// A PNG written with zlib alone: a red disc on a warm off-white ground. Generated here, so it has no licence to record.
function writeDiscPng(file, w = 240, h = 180) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 3 + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const inDisc = (x - w / 2) ** 2 + (y - h / 2) ** 2 < (h / 3) ** 2;
      const o = y * (w * 3 + 1) + 1 + x * 3;
      [raw[o], raw[o + 1], raw[o + 2]] = inDisc ? [192, 48, 16] : [232, 228, 220];
    }
  }
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
    const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(zlib.crc32(body));
    return Buffer.concat([len, body, crc]);
  };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  fs.writeFileSync(file, Buffer.concat([Buffer.from('89504e470d0a1a0a', 'hex'), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
}
const pngInfo = (file) => { const b = fs.readFileSync(file); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), colourType: b[25] }; };

function cli(args, env = {}) {
  return spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', timeout: 180000, env: { ...process.env, DF_DESIGN_CUTOUT_PYTHON: STUB_PY || '', ...env } });
}
function tmpWithDisc(name = 'disc.png') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'df-cutout-'));
  writeDiscPng(path.join(dir, name));
  return dir;
}

test('stub: remove-bg writes a trimmed RGBA cutout, a preview on the ground, and the row', { skip: stubSkip, timeout: 180000 }, () => {
  const dir = tmpWithDisc();
  try {
    writeDiscPng(path.join(dir, 'second.png'), 200, 200);
    const r = cli(['remove-bg', path.join(dir, 'disc.png'), path.join(dir, 'second.png'), '--backend', 'stub', '--ground', '#000000', '--no-defringe']);
    assert.equal(r.status, 0, r.stderr + r.stdout);
    for (const stem of ['disc', 'second']) {
      const png = pngInfo(path.join(dir, `${stem}.cutout.png`));
      assert.equal(png.colourType, 6, 'RGBA');
      assert.ok(png.w < 240 && png.h <= 180, `trimmed to the subject: ${png.w}x${png.h}`);
      assert.ok(fs.existsSync(path.join(dir, `${stem}.on-ground.jpg`)), 'preview');
    }
    assert.match(r.stdout, /\| .*disc\.cutout\.png \| <source page of the original> \| <licence of the original> \| \d{4}-\d{2}-\d{2} \| cutout of disc\.png: /);
    assert.match(r.stdout, /look at it at 100%/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('stub: --record fills the row from the original, --json gives the whole result', { skip: stubSkip, timeout: 180000 }, () => {
  const dir = tmpWithDisc();
  try {
    const record = path.join(dir, 'assets.md');
    fs.writeFileSync(record, '| File | Source page | Licence |\n|---|---|---|\n| disc.png | https://example.org/disc | CC0 |\n');
    const r = cli(['remove-bg', path.join(dir, 'disc.png'), '--backend', 'stub', '--record', record, '--pages', 'home', '--json', '--no-defringe']);
    assert.equal(r.status, 0, r.stderr);
    const out = JSON.parse(r.stdout);
    const [res] = out.results;
    assert.equal(res.original, 'found');
    assert.match(res.row, /^\| disc\.cutout\.png \| https:\/\/example\.org\/disc \| CC0 \| .* \| home \|$/);
    assert.equal(licenceNeedsCredit(res.row), false);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('stub: detect merges duplicate boxes, says "not found" for the rest, writes JSON and an annotated copy', { skip: stubSkip, timeout: 180000 }, () => {
  const dir = tmpWithDisc();
  try {
    const r = cli(['detect', path.join(dir, 'disc.png'), '--backend', 'stub', '--labels', 'object,shoe', '--annotate']);
    assert.equal(r.status, 0, r.stderr);
    const j = JSON.parse(fs.readFileSync(path.join(dir, 'disc.detect.json'), 'utf8'));
    assert.equal(j.detections.length, 1);
    assert.equal(j.merged, 1);
    assert.deepEqual(j.not_found, ['shoe']);
    assert.ok(fs.existsSync(path.join(dir, 'disc.detect.jpg')));
    assert.match(r.stdout, /shoe\s+not found/);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('stub: mask cuts the named object, warns for a person, and refuses to guess when nothing is found', { skip: stubSkip, timeout: 180000 }, () => {
  const dir = tmpWithDisc();
  try {
    const found = cli(['mask', path.join(dir, 'disc.png'), '--label', 'person', '--backend', 'stub', '--no-defringe'], { DF_DESIGN_CUTOUT_STUB_LABEL: 'person' });
    assert.equal(found.status, 0, found.stderr);
    assert.ok(fs.existsSync(path.join(dir, 'disc.person.cutout.png')));
    assert.match(found.stdout, /WARNING: recognisable person: .*CC0 is not a model release/);
    const none = cli(['mask', path.join(dir, 'disc.png'), '--label', 'fish', '--backend', 'stub']);
    assert.equal(none.status, 1);
    assert.match(none.stdout, /no "fish" found in disc\.png: nothing was cut out/);
    assert.equal(fs.existsSync(path.join(dir, 'disc.fish.cutout.png')), false);
    const boxed = cli(['mask', path.join(dir, 'disc.png'), '--label', 'disc', '--box', '60,20,180,160', '--backend', 'stub', '--refine', 'sam2', '--no-defringe']);
    assert.equal(boxed.status, 0, boxed.stderr);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('stub: an off-list model is refused before anything runs', { skip: stubSkip, timeout: 60000 }, () => {
  const r = cli(['remove-bg', 'x.png', '--model', 'bria-rmbg', '--backend', 'stub']);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /not on the allow-list/);
});

// ---------------- real models, opt-in ----------------

const VENV = cutoutPaths(cutoutHome()).python;
const realSkip = process.env.DF_DESIGN_CUTOUT_TESTS !== '1' ? 'set DF_DESIGN_CUTOUT_TESTS=1 to run the models (minutes on a laptop)'
  : !fs.existsSync(VENV) ? `no venv at ${VENV}: run node scripts/cutout.mjs setup --with detect` : false;
const realCli = (args) => spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', timeout: 900000, env: { ...process.env, DF_DESIGN_CUTOUT_PYTHON: '' } });
const alphaAt = (file, points) => {
  const code = `import sys, json; from PIL import Image; a = Image.open(sys.argv[1]).getchannel('A'); print(json.dumps([a.getpixel(tuple(p)) for p in json.loads(sys.argv[2])]))`;
  const r = spawnSync(VENV, ['-I', '-c', code, file, JSON.stringify(points)], { encoding: 'utf8' });
  return JSON.parse(r.stdout);
};

test('models: birefnet-general-lite cuts the disc out with a solid inside and clear corners', { skip: realSkip, timeout: 900000 }, () => {
  const dir = tmpWithDisc();
  try {
    const r = realCli(['remove-bg', path.join(dir, 'disc.png'), '--no-trim', '--no-person-check']);
    assert.equal(r.status, 0, r.stderr + r.stdout);
    const [centre, c1, c2, c3, c4] = alphaAt(path.join(dir, 'disc.cutout.png'), [[120, 90], [2, 2], [237, 2], [2, 177], [237, 177]]);
    assert.ok(centre > 230, `centre alpha ${centre}`);
    for (const c of [c1, c2, c3, c4]) assert.ok(c < 25, `corner alpha ${c}`);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('models: detect returns valid JSON and names what it could not find', { skip: realSkip, timeout: 900000 }, () => {
  const dir = tmpWithDisc();
  try {
    const r = realCli(['detect', path.join(dir, 'disc.png'), '--labels', 'person,shoe', '--json']);
    assert.equal(r.status, 0, r.stderr + r.stdout);
    const [res] = JSON.parse(r.stdout).results;
    assert.ok(Array.isArray(res.detections));
    assert.ok(res.models.every((m) => ['MIT', 'Apache-2.0'].includes(m.licence)));
    assert.ok(res.not_found.includes('person'), 'no person in a red disc');
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});
