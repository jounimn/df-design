import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { launchBrowser } from '../scripts/lib/browser.mjs';
import { exportPresentation } from '../scripts/lib/export.mjs';
import { stripWatermark } from '../scripts/lib/watermark.mjs';
import {
  REQUIRED_SECTIONS, missingSections, parseResearchLog, researchFailures, sitePending, runChecks,
} from '../scripts/lib/presentation-checks.mjs';
import { copyPresentationFixture } from './helpers/presentation-fixture.mjs';

const items = (n, host = 'x.example') => Array.from({ length: n }, (_, i) => `- https://${host}/${i}`).join('\n');
const log = ({ behance = 30, market = 30, mockups = 30, map = 8, tail = '' } = {}) =>
  `## Behance cases\n${items(behance, 'b.example')}\n\n## Market brands\n${items(market, 'm.example')}\n\n## Mockup candidates\n${items(mockups, 'k.example')}\n\n## Perceptual map\n${Array.from({ length: map }, (_, i) => `- Brand ${i}`).join('\n')}\n${tail}`;

test('the ten sections, in order', () => {
  assert.deepEqual(REQUIRED_SECTIONS, ['opening', 'concept', 'market', 'audience', 'logo-construction', 'logo-system', 'colour-type', 'mockups', 'site', 'closing']);
});

test('missingSections reads data-section and ignores commented-out sections', () => {
  const html = REQUIRED_SECTIONS.filter((s) => s !== 'site').map((s) => `<section data-section="${s}"></section>`).join('') + '<!-- <section data-section="site"> -->';
  assert.deepEqual(missingSections(html), ['site']);
});

test('duplicate and URL-less entries do not count', () => {
  const md = '## Behance cases\n- a https://x/1\n- b https://x/1\n- c no url\n';
  assert.equal(parseResearchLog(md).behance, 1);
});

test('URLs inside markdown links count once and trailing punctuation does not make a new URL', () => {
  const md = '## Market brands\n- [A](https://x.example/a)\n- B https://x.example/a.\n- C https://x.example/a/\n- D https://x.example/b\n';
  assert.equal(parseResearchLog(md).market, 2);
});

test('29 cases without Shortfall fails; with Shortfall passes', () => {
  assert.equal(researchFailures(parseResearchLog(log({ behance: 29 }))).length, 1);
  assert.deepEqual(researchFailures(parseResearchLog(log({ behance: 29, tail: '\n## Shortfall\nOnly 29 cases exist for this niche on Behance.\n' }))), []);
  assert.equal(researchFailures(parseResearchLog(log({ market: 12 }))).length, 1);
  assert.equal(researchFailures(parseResearchLog(log({ mockups: 5 }))).length, 1);
});

test('map of 7 fails, 8 passes, 12 passes, 13 fails', () => {
  const fails = (map) => researchFailures(parseResearchLog(log({ map }))).length;
  assert.deepEqual([7, 8, 12, 13].map(fails), [1, 0, 0, 1]);
});

test('a Shortfall heading with no text does not count', () => {
  assert.equal(parseResearchLog(log({ tail: '\n## Shortfall\n\n' })).shortfall, false);
  assert.equal(parseResearchLog(log({ tail: '\n## Shortfall\nOnly 12 brands exist.\n' })).shortfall, true);
});

test('HTML comments are ignored: instructions under ## Shortfall are not a shortfall, commented entries are not entries', () => {
  const md = `${log({ behance: 29 })}\n## Shortfall\n<!-- Only when a base is under 30: the real count and the reason. -->\n`;
  assert.equal(parseResearchLog(md).shortfall, false);
  assert.equal(researchFailures(parseResearchLog(md)).length, 1);
  const commented = '## Behance cases\n<!--\n- https://x/1\n- https://x/2\n-->\n- https://x/3\n';
  assert.equal(parseResearchLog(commented).behance, 1);
});

test('sitePending reads data-pending on the site section only', () => {
  assert.equal(sitePending('<section data-section="site" data-pending>x</section>'), true);
  assert.equal(sitePending('<section data-pending data-section="site">x</section>'), true);
  assert.equal(sitePending('<section data-section="site">x</section>'), false);
  assert.equal(sitePending('<section data-section="closing" data-pending></section><section data-section="site"></section>'), false);
});

// Fixture variants: export once, copy the exported tree per test, mutate, run the checks.
let browser, base;
before(async () => {
  browser = await launchBrowser();
  base = copyPresentationFixture();
  await exportPresentation(base.dir, 'text:Teste', { browser });
});
after(async () => {
  await browser?.close();
  base?.cleanup();
});

async function check(mutate = () => {}, options = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'apresentação teste '));
  const dir = path.join(root, 'apresentação');
  try {
    fs.cpSync(base.dir, dir, { recursive: true });
    mutate(dir);
    const results = await runChecks(dir, { offline: true, afterGate: false, browser, ...options });
    return { results, failed: results.filter((r) => !r.ok).map((r) => r.name) };
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}
const edit = (dir, file, fn) => {
  const p = path.join(dir, file);
  fs.writeFileSync(p, fn(fs.readFileSync(p, 'utf8')));
};

test('complete fixture passes every check', async () => {
  const { results, failed } = await check();
  assert.deepEqual(failed, []);
  assert.ok(results.length > 15, `only ${results.length} checks ran`);
});

test('preview without layer fails only that check', async () => {
  const { failed } = await check((dir) => edit(dir, 'preview/presentation.html', stripWatermark));
  assert.deepEqual(failed, ['preview/: every html has the watermark layer']);
});

test('a layer left in final/ fails only that check', async () => {
  const { failed } = await check((dir) => edit(dir, 'final/presentation.html', (h) => h.replace('</body>', '<!--df-watermark--><div data-df-watermark></div><!--/df-watermark--></body>')));
  assert.deepEqual(failed, ['final/: no html has the watermark layer']);
});

test('preview/ and final/ with different file sets fail only that check', async () => {
  const { failed } = await check((dir) => fs.rmSync(path.join(dir, 'preview', 'social', 'story.png')));
  assert.ok(failed.includes('preview/ and final/ hold the same file set'), failed.join(' | '));
});

test('mockup row with CC BY fails only that check', async () => {
  const { failed } = await check((dir) => edit(dir, 'assets.md', (m) => m.replace('CC0', 'CC BY 4.0')));
  assert.deepEqual(failed, ['mockup.png: licence is not CC BY / credit-required']);
});

test('a mockup photo missing from assets.md fails its record check', async () => {
  const { failed } = await check((dir) => edit(dir, 'assets.md', (m) => m.replace('assets/mockup.png', 'assets/other.png')));
  assert.ok(failed.includes('mockup.png: recorded'), failed.join(' | '));
});

test('short log without Shortfall fails only research', async () => {
  const { failed } = await check((dir) => edit(dir, 'research-log.md', (m) => m.replace(/^- https:\/\/behance\.example\/example\/(1|2|3)$/gm, '').replace(/^- behance\.example case 0[123].*$/gm, '')));
  assert.deepEqual(failed, ['research-log.md: bases of 30 (or a Shortfall) and a map of 8–12']);
});

test('pending site fails only with afterGate', async () => {
  const pend = (dir) => edit(dir, 'presentation.html', (h) => h.replace('<section data-section="site">', '<section data-section="site" data-pending>'));
  assert.deepEqual((await check(pend)).failed, []);
  assert.deepEqual((await check(pend, { afterGate: true })).failed, ['site section is filled (not marked pending)']);
});

test('a 1400px section fails slide overflow only', async () => {
  const { failed } = await check((dir) => edit(dir, 'presentation.html', (h) => h.replace('<section data-section="concept">', '<section data-section="concept"><div style="height:1400px"></div>')));
  assert.deepEqual(failed, ['slide overflow: every section fits 1920×1080']);
});

test('a missing section is named', async () => {
  const { failed } = await check((dir) => edit(dir, 'presentation.html', (h) => h.replace('data-section="site"', 'data-x="site"')));
  assert.ok(failed.includes('ten sections present, in order'), failed.join(' | '));
});

test('sections out of order fail the order check', async () => {
  const { failed } = await check((dir) => edit(dir, 'presentation.html', (h) => h.replace('data-section="concept"', 'data-section="TMP"').replace('data-section="market"', 'data-section="concept"').replace('data-section="TMP"', 'data-section="market"')));
  assert.ok(failed.includes('ten sections present, in order'), failed.join(' | '));
});

test('watermark=none with a stale preview/ fails; without one it passes', async () => {
  assert.deepEqual((await check(() => {}, { watermark: 'none' })).failed, ['no preview/ when watermark=none']);
  const clean = await check((dir) => fs.rmSync(path.join(dir, 'preview'), { recursive: true }), { watermark: 'none' });
  assert.deepEqual(clean.failed, []);
});

test('a watermark spec with no preview/ fails', async () => {
  const { failed } = await check((dir) => fs.rmSync(path.join(dir, 'preview'), { recursive: true }), { watermark: 'text:Teste' });
  assert.deepEqual(failed, ['preview/ exists (watermark requested)']);
});

test('a wrong PNG size and a short PDF are caught', async () => {
  const { failed } = await check((dir) => {
    fs.copyFileSync(path.join(dir, 'final', 'social', 'square.png'), path.join(dir, 'final', 'slides', '01-opening.png'));
    fs.writeFileSync(path.join(dir, 'final', 'presentation.pdf'), '%PDF-1.4\n/Type /Page\n');
  });
  assert.ok(failed.includes('final/: every slide is 1920×1080, one per section'), failed.join(' | '));
  assert.ok(failed.includes('final/: PDF has one page per slide'), failed.join(' | '));
});

test('missing export output is reported once instead of crashing', async () => {
  const { failed } = await check((dir) => fs.rmSync(path.join(dir, 'final'), { recursive: true }));
  assert.ok(failed.includes('final/ exists (run export-presentation.mjs)'), failed.join(' | '));
});
