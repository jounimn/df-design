// Tiny binary readers so the export checks need no image or PDF dependency.
const PNG_SIGNATURE = '89504e470d0a1a0a';

export function pngSize(buf) {
  if (buf.length < 24 || buf.subarray(0, 8).toString('hex') !== PNG_SIGNATURE || buf.toString('latin1', 12, 16) !== 'IHDR') {
    throw new Error('not a PNG: signature or IHDR chunk missing');
  }
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

// Chromium's page.pdf() keeps page objects uncompressed (probed: 3 sections → 3 `/Type /Page`, one `/Count 3`).
// If a PDF ever packs them into object streams, fall back to the page tree's /Count.
export function pdfPageCount(buf) {
  const text = buf.toString('latin1');
  const pages = (text.match(/\/Type\s*\/Page(?![A-Za-z])/g) || []).length;
  if (pages > 0) return pages;
  const counts = [...text.matchAll(/\/Type\s*\/Pages[^>]*?\/Count\s+(\d+)|\/Count\s+(\d+)[^>]*?\/Type\s*\/Pages/g)]
    .map((m) => Number(m[1] ?? m[2]));
  return counts.length ? Math.max(...counts) : 0;
}
