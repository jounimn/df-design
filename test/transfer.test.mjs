import test from 'node:test';
import assert from 'node:assert/strict';
import { TRANSFER_KINDS, formatTransfer, kindOf, summarizeTransfer } from '../scripts/lib/transfer.mjs';

test('kindOf: the extension wins over the resource type, so a model or a sound fetched by script is still itself', () => {
  assert.equal(kindOf({ url: 'https://x.example/scene/world.glb?v=2', type: 'Fetch' }), 'models');
  assert.equal(kindOf({ url: 'https://x.example/tex/rock.ktx2', type: 'XHR' }), 'models');
  assert.equal(kindOf({ url: 'https://x.example/draco/mesh.drc', type: 'Fetch' }), 'models');
  assert.equal(kindOf({ url: 'https://x.example/sfx/pour.mp3', type: 'Fetch' }), 'audio');
  assert.equal(kindOf({ url: 'https://x.example/a', mime: 'audio/ogg', type: 'Media' }), 'audio');
  assert.equal(kindOf({ url: 'https://x.example/film.mp4', type: 'Media' }), 'video');
  assert.equal(kindOf({ url: 'https://x.example/stream', type: 'Media' }), 'video');
  assert.equal(kindOf({ url: 'https://x.example/frames/0412.webp', type: 'Image' }), 'images');
  assert.equal(kindOf({ url: 'https://x.example/app.js', type: 'Script' }), 'script');
  assert.equal(kindOf({ url: 'https://x.example/engine.wasm', type: 'Fetch' }), 'script');
  assert.equal(kindOf({ url: 'https://x.example/style.css', type: 'Stylesheet' }), 'other');
  assert.equal(kindOf({}), 'other');
});

test('summarizeTransfer: totals by kind, ignoring entries with no bytes', () => {
  const s = summarizeTransfer([
    { url: 'a.webp', type: 'Image', bytes: 1000 },
    { url: 'b.webp', type: 'Image', bytes: 500 },
    { url: 'tone.mp3', type: 'Fetch', bytes: 2000 },
    { url: 'pending.glb', type: 'Fetch', bytes: 0 },
    { url: 'app.js', type: 'Script', bytes: 300 },
  ]);
  assert.equal(s.total, 3800);
  assert.equal(s.requests, 4);
  assert.deepEqual(Object.keys(s.byKind), TRANSFER_KINDS);
  assert.equal(s.byKind.images, 1500);
  assert.equal(s.byKind.audio, 2000);
  assert.equal(s.byKind.models, 0);
});

test('formatTransfer: the total, then the kinds that weigh anything, heaviest first, in KB or MB', () => {
  const s = summarizeTransfer([
    { url: 'film.mp4', bytes: 10.8 * 1048576 },
    { url: 'a.jpg', bytes: 5.8 * 1048576 },
    { url: 'app.js', type: 'Script', bytes: 883 * 1024 },
  ]);
  assert.equal(formatTransfer(s), '17.5 MB (video 10.8 MB, images 5.8 MB, script 883 KB)');
  assert.equal(formatTransfer(summarizeTransfer([])), '0 KB');
});
