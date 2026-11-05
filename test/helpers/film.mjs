// A short looping film for the video fixtures, made on the spot: Playwright records a page whose colour changes and
// saves it as WebM (VP8), which every Chromium plays. No binary file is kept in the repository.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { newPage } from '../../scripts/lib/browser.mjs';

export async function recordFilm(browser) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'filme teste '));
  try {
    const { page, context } = await newPage(browser, { recordVideoDir: dir, viewport: { width: 160, height: 90 } });
    await page.setContent('<style>@keyframes a{to{background:#36c}}body{margin:0;background:#c33;animation:a .5s infinite alternate}</style>');
    await page.waitForTimeout(1200);
    const video = page.video();
    await context.close();
    return fs.readFileSync(await video.path());
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}
