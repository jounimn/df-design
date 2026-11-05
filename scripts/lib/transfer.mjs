// Bytes on the wire, by type, for one page: what the visitor downloads, as the browser counts it (CDP
// encodedDataLength, headers included, compressed as served). Shared by the prober (the `transfer` field) and by
// check-motion (the weight report and the audio-before-a-gesture check).
//
// A file:// page has no network: Chrome reports the document and its classic scripts, nothing it fetches. Serve the
// page over http(s) to weigh it.

// The kinds a YOLO page is weighed by. Models are 3D geometry and textures; script is JavaScript and wasm.
export const TRANSFER_KINDS = ['images', 'video', 'models', 'audio', 'script', 'other'];

const MODEL_EXT = /\.(glb|gltf|drc|ktx2|basis|hdr|exr|usdz|splinecode|fbx|obj|ply|splat|bin)$/;
const AUDIO_EXT = /\.(mp3|ogg|oga|opus|wav|m4a|aac|flac)$/;
const VIDEO_EXT = /\.(mp4|webm|mov|m4v|m3u8|ts)$/;
const IMAGE_EXT = /\.(jpe?g|png|webp|avif|gif|svg|ico)$/;

// One response, by its URL, MIME type and CDP resource type. The extension wins over the type: a model or a sound
// is often fetched by script (type Fetch / XHR), and Chrome calls both audio and video "Media".
export function kindOf({ url = '', mime = '', type = '' } = {}) {
  const u = url.split(/[?#]/)[0].toLowerCase();
  if (MODEL_EXT.test(u) || /^model\//.test(mime)) return 'models';
  if (AUDIO_EXT.test(u) || /^audio\//.test(mime)) return 'audio';
  if (VIDEO_EXT.test(u) || /^video\//.test(mime)) return 'video';
  if (/\.(m?js|wasm)$/.test(u) || type === 'Script' || /javascript|wasm/.test(mime)) return 'script';
  if (IMAGE_EXT.test(u) || type === 'Image' || /^image\//.test(mime)) return 'images';
  if (type === 'Media') return 'video';
  return 'other';
}

// entries: [{ url, mime, type, bytes }]. Returns { total, requests, byKind: { images, video, ... } } in bytes.
export function summarizeTransfer(entries) {
  const byKind = Object.fromEntries(TRANSFER_KINDS.map((k) => [k, 0]));
  let total = 0;
  let requests = 0;
  for (const e of entries) {
    if (!(e.bytes > 0)) continue;
    byKind[kindOf(e)] += e.bytes;
    total += e.bytes;
    requests += 1;
  }
  return { total, requests, byKind };
}

const mb = (bytes) => (bytes >= 1048576 ? `${(bytes / 1048576).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`);
export const formatBytes = mb;

// "1.3 MB (images 0.4 MB, video 0.8 MB, script 90 KB)": the kinds that weigh anything, heaviest first.
export function formatTransfer(summary) {
  const parts = TRANSFER_KINDS.filter((k) => summary.byKind[k] > 0)
    .sort((a, b) => summary.byKind[b] - summary.byKind[a])
    .map((k) => `${k} ${mb(summary.byKind[k])}`);
  return `${mb(summary.total)}${parts.length ? ` (${parts.join(', ')})` : ''}`;
}

// Starts counting on a page before it is opened. snapshot() is the summary so far; entries() the responses so far,
// each with the bytes received up to now (a video that streams forever counts what has arrived). Both can be read
// any number of times; stop() detaches.
export async function watchTransfer(page) {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  const requests = new Map();
  const get = (id) => {
    let r = requests.get(id);
    if (!r) { r = { url: '', mime: '', type: '', bytes: 0, finished: false }; requests.set(id, r); }
    return r;
  };
  cdp.on('Network.requestWillBeSent', (e) => { const r = get(e.requestId); r.url = e.request.url; if (e.type) r.type = e.type; });
  cdp.on('Network.responseReceived', (e) => { const r = get(e.requestId); r.url = e.response.url; r.mime = e.response.mimeType ?? ''; r.type = e.type ?? r.type; });
  cdp.on('Network.dataReceived', (e) => { const r = get(e.requestId); if (!r.finished) r.bytes += e.encodedDataLength ?? 0; });
  cdp.on('Network.loadingFinished', (e) => { const r = get(e.requestId); r.finished = true; r.bytes = Math.max(r.bytes, e.encodedDataLength ?? 0); });
  const entries = () => [...requests.values()].filter((r) => r.url && !r.url.startsWith('data:')).map(({ url, mime, type, bytes }) => ({ url, mime, type, bytes }));
  return {
    entries,
    snapshot: () => summarizeTransfer(entries()),
    stop: () => cdp.detach().catch(() => {}),
  };
}
