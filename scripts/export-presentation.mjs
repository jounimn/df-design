// Exports a presentation folder (presentation.html) to slides, mockups, social artboards and a PDF.
// Usage: node scripts/export-presentation.mjs <presentation-dir> <spec|none>
// spec: none | text:Studio X | image+text:path/logo.svg|Studio X   (optional @0.1 opacity suffix)
// Writes <dir>/final/ always, and <dir>/preview/ (watermarked) when spec is not 'none'.
import path from 'node:path';
import { launchBrowser } from './lib/browser.mjs';
import { exportPresentation } from './lib/export.mjs';

const [dir, spec] = process.argv.slice(2);
if (!dir || !spec) {
  console.error('Usage: node scripts/export-presentation.mjs <presentation-dir> <spec|none>');
  process.exit(2);
}

const browser = await launchBrowser();
try {
  const { outputs } = await exportPresentation(dir, spec, { browser });
  for (const f of outputs) console.log(path.relative(process.cwd(), f));
  console.log(`\n${outputs.length} files written`);
} finally {
  await browser.close();
}
