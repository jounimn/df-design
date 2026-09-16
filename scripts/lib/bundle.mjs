import fs from 'node:fs/promises';
import path from 'node:path';

export function bundleDir(root, site, date) {
  return path.join(root, site, date);
}

export async function writeBundle(dir, { record, raw, motion, frames = [] }) {
  await fs.mkdir(path.join(dir, 'frames'), { recursive: true });
  const files = [];

  const writeJson = async (name, data) => {
    await fs.writeFile(path.join(dir, name), JSON.stringify(data, null, 2), 'utf8');
    files.push(name);
  };

  await writeJson('record.json', record);
  await writeJson('raw.json', raw);
  await writeJson('motion.json', motion);

  for (const frame of frames) {
    await fs.writeFile(path.join(dir, 'frames', frame.name), frame.buffer);
    files.push(path.join('frames', frame.name));
  }

  return { dir, files };
}

// Rendered by the browser we already launched. A thumbnail grid is the agent's
// overview image; full-resolution frames are pulled individually, at most three.
// Spec §7.8.
export async function renderContactSheet(browser, frames, outPath) {
  const cells = frames.map((f) => `
    <figure>
      <img src="data:image/png;base64,${f.buffer.toString('base64')}" />
      <figcaption>${f.name}</figcaption>
    </figure>`).join('');

  const html = `<!doctype html><meta charset="utf-8">
    <style>
      body { margin: 0; background: #111; font: 11px ui-monospace, monospace; color: #bbb; }
      .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; padding: 8px; }
      figure { margin: 0; }
      img { width: 100%; display: block; border: 1px solid #333; }
      figcaption { padding: 3px 0; }
    </style><div class="grid">${cells}</div>`;

  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  try {
    await page.setContent(html, { waitUntil: 'load' });
    await page.screenshot({ path: outPath, fullPage: true });
  } finally {
    await context.close();
  }
  return outPath;
}
