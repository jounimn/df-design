// Copies test/fixtures/presentation/ into a fresh temp dir whose name has a space and an accent
// (the repo itself lives under a path with spaces), and writes the mockup image the HTML expects.
// A 1x1 PNG constant keeps binaries out of the repo.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FIXTURE = path.join(HERE, '..', 'fixtures', 'presentation');
const TEMPLATES = path.join(HERE, '..', '..', 'templates');
const PNG_1X1 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

export function copyPresentationFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'apresentação teste '));
  const dir = path.join(root, 'apresentação');
  fs.cpSync(FIXTURE, dir, { recursive: true });
  // The author copies the slideshow runtime next to presentation.html; the fixture does the same.
  for (const file of ['slideshow.js', 'slideshow.css']) fs.copyFileSync(path.join(TEMPLATES, file), path.join(dir, file));
  fs.mkdirSync(path.join(dir, 'assets'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'assets', 'mockup.png'), Buffer.from(PNG_1X1, 'base64'));
  return { root, dir, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) };
}
