// Copies a built folder and injects the protective watermark layer into every .html (audition and built-surface previews).
// Usage: node scripts/watermark.mjs <src-dir> <spec> <out-dir>
// spec: none | text:Studio X | image+text:path/logo.svg|Studio X   (optional @0.1 opacity suffix)
// The source folder is never modified. Image files are embedded as data URIs.
import fs from 'node:fs';
import path from 'node:path';
import { parseWatermarkSpec, watermarkLayer, injectWatermark } from './lib/watermark.mjs';

const MIME = { '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' };

const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);

function imageDataUri(file, srcDir) {
  const found = [path.resolve(file), path.resolve(srcDir, file)].find((p) => fs.existsSync(p));
  if (!found) throw new Error(`watermark image not found: ${file}`);
  const mime = MIME[path.extname(found).toLowerCase()];
  if (!mime) throw new Error(`watermark image type not supported: ${found}`);
  return `data:${mime};base64,${fs.readFileSync(found).toString('base64')}`;
}

const [src, specArg, out] = process.argv.slice(2);
if (!src || !specArg || !out) {
  console.error('Usage: node scripts/watermark.mjs <src-dir> <spec> <out-dir>');
  process.exit(2);
}
// The source is never modified: out-dir may not be src-dir, an ancestor of it (the copy would overwrite it) or inside it.
const within = (parent, child) => {
  const r = path.relative(parent, child);
  return r === '' || (!r.startsWith('..') && !path.isAbsolute(r));
};
if (within(out, src) || within(src, out)) {
  console.error('out-dir must be a separate folder: not src-dir, not a parent of it, not inside it');
  process.exit(2);
}

// Everything that can fail (spec, image) fails before anything is copied.
const spec = parseWatermarkSpec(specArg);
const layer = spec && watermarkLayer(spec, spec.type === 'image+text' ? { imageDataUri: imageDataUri(spec.image, src) } : {});
fs.cpSync(src, out, { recursive: true });
if (spec) {
  const pages = walk(out).filter((f) => /\.html?$/i.test(f));
  for (const f of pages) fs.writeFileSync(f, injectWatermark(fs.readFileSync(f, 'utf8'), layer));
  console.log(`watermarked ${pages.length} page(s) → ${out}`);
} else {
  console.log(`no watermark; copied → ${out}`);
}
