import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { launchBrowser } from '../scripts/lib/browser.mjs';
import { exportPresentation } from '../scripts/lib/export.mjs';
import { stripWatermark } from '../scripts/lib/watermark.mjs';
import { licenceNeedsCredit } from '../scripts/lib/licence.mjs';
import {
  REQUIRED_SECTIONS, missingSections, sectionsInOrder, parseResearchLog, researchFailures, sitePending, parseCheckArgs, runChecks,
} from '../scripts/lib/presentation-checks.mjs';
import { copyPresentationFixture } from './helpers/presentation-fixture.mjs';

const items = (n, host = 'x.example') => Array.from({ length: n }, (_, i) => `- https://${host}/${i}`).join('\n');
const log = ({ behance = 30, mockups = 30, tail = '' } = {}) =>
  `## Behance cases\n${items(behance, 'b.example')}\n\n## Mockup candidates\n${items(mockups, 'k.example')}\n${tail}`;
const behance = (md) => parseResearchLog(`## Behance cases\n${md}\n`).behance;

test('the nine sections, in order: no market slide', () => {
  assert.deepEqual(REQUIRED_SECTIONS, ['opening', 'concept', 'audience', 'logo-construction', 'logo-system', 'colour-type', 'mockups', 'site', 'closing']);
});

test('missingSections reads real <section data-section> tags: not comments, CSS selectors or script text', () => {
  const all = REQUIRED_SECTIONS.map((s) => `<section data-section="${s}"></section>`).join('');
  assert.deepEqual(missingSections(all), []);
  assert.deepEqual(missingSections(all.replace('<section data-section="site">', '<section data-x="site">') + '<!-- <section data-section="site"> -->'), ['site']);
  const css = `<style>${REQUIRED_SECTIONS.map((s) => `[data-section=${s}]`).join(',')}</style>`;
  assert.deepEqual(missingSections(css), REQUIRED_SECTIONS);
  assert.equal(sectionsInOrder(css), false);
  const js = `<script>const a='${REQUIRED_SECTIONS.map((s) => `<section data-section="${s}">`).join('')}'</script>`;
  assert.deepEqual(missingSections(js), REQUIRED_SECTIONS);
});

test('duplicate and URL-less entries do not count', () => {
  const md = '## Behance cases\n- a https://x/1\n- b https://x/1\n- c no url\n';
  assert.equal(parseResearchLog(md).behance, 1);
});

test('URLs inside markdown links count once and trailing punctuation does not make a new URL', () => {
  const md = '## Mockup candidates\n- [A](https://x.example/a)\n- B https://x.example/a.\n- C https://x.example/a/\n- D https://x.example/b\n';
  assert.equal(parseResearchLog(md).mockups, 2);
});

test('the same page written differently counts once: http/https, www, host case, tracking params, query order, fragment', () => {
  assert.equal(behance(['- https://b.com/x', '- http://b.com/x', '- https://www.b.com/x', '- https://B.com/x', '- https://b.com/x/', '- https://b.com/x#top',
    '- https://b.com/x?utm_source=a&utm_medium=b', '- https://b.com/x?fbclid=1', '- https://b.com/x?gclid=1&ref=home&ref_src=t&mc_cid=9'].join('\n')), 1);
  assert.equal(behance('- https://b.com/x?a=1&b=2\n- https://b.com/x?b=2&a=1'), 1);
  assert.equal(behance('- https://b.com/x?id=1\n- https://b.com/x?id=2\n- https://b.com/y'), 3);
});

test('only top-level list items count: 0–1 space of indent; nested bullets, tabs and 2+ spaces do not', () => {
  assert.equal(behance('- https://b/1\n  - also https://b/2\n    - and https://b/3\n\t- tab https://b/4\n - one space https://b/5'), 2);
});

test('numbered and starred lists count; a bare marker does not', () => {
  assert.equal(behance('1. https://b/1\n2) https://b/2\n* https://b/3\n+ https://b/4\n-\n- '), 4);
  assert.equal(parseResearchLog('## Mockup candidates\n1. https://k/1\n2) https://k/2\n-\n- \n').mockups, 2);
});

test('CRLF files parse like LF files', () => {
  assert.deepEqual(parseResearchLog(log().replace(/\n/g, '\r\n')), parseResearchLog(log()));
});

test('29 cases fail; a Shortfall line in the documented format excuses exactly that base', () => {
  assert.equal(researchFailures(parseResearchLog(log({ behance: 29 }))).length, 1);
  const ok = log({ behance: 29, tail: '\n## Shortfall\n- Behance cases: 29 — only 29 logo-presentation cases exist for this niche on Behance\n' });
  assert.deepEqual(researchFailures(parseResearchLog(ok)), []);
  assert.equal(researchFailures(parseResearchLog(log({ mockups: 5 }))).length, 1);
});

test('a Shortfall must name each short base, with the real count and a reason of three words or more', () => {
  const sf = (lines, extra = {}) => researchFailures(parseResearchLog(log({ behance: 18, ...extra, tail: `\n## Shortfall\n${lines}\n` })));
  assert.deepEqual(sf('- Behance cases: 18 — only 18 relevant cases found in this niche'), []);
  assert.deepEqual(sf('- behance cases: 18 - only 18 relevant cases found in this niche'), []);
  assert.equal(sf('- Behance cases: 20 — only 18 relevant cases found in this niche').length, 1, 'wrong N');
  assert.equal(sf('- Behance cases: 18 — too few').length, 1, 'two words');
  assert.equal(sf('- Behance cases: 18 — TBD').length, 1, 'TBD');
  assert.equal(sf('Only 18 cases exist and I could not find more of them.').length, 1, 'free text is not the format');
  assert.equal(sf('-').length, 1, 'a bare dash');
  assert.equal(sf('<!-- - Behance cases: 18 — only 18 relevant cases found in this niche -->').length, 1, 'a comment');
  assert.equal(sf('- Mockup candidates: 18 — only 18 relevant cases found in this niche').length, 1, 'wrong base');
  assert.equal(sf('- Behance cases: 18 — only 18 relevant cases found in this niche', { mockups: 12 }).length, 1, 'does not excuse Mockup candidates');
  assert.deepEqual(sf('- Behance cases: 18 — only 18 relevant cases found in this niche\n- Mockup candidates: 12 — mockup photos that pass the four rules are rare', { mockups: 12 }), []);
});

test('market research is gone: ## Market brands and ## Perceptual map are neither required nor counted', () => {
  assert.deepEqual(researchFailures(parseResearchLog(log())), [], 'a log with only the two bases passes');
  const withMarket = `${log()}\n## Market brands\n${items(3, 'm.example')}\n\n## Perceptual map\n- A\n- B\n`;
  assert.deepEqual(researchFailures(parseResearchLog(withMarket)), [], 'a short or odd market section does not fail');
  assert.deepEqual(Object.keys(parseResearchLog(withMarket)).sort(), ['behance', 'mockups', 'shortfall', 'shortfalls']);
  const short = parseResearchLog(`${log({ behance: 12 })}\n## Shortfall\n- Market brands: 12 — a market base that is no longer asked for\n`);
  assert.equal(short.shortfall, false, 'Market brands is not a base any more');
  assert.equal(researchFailures(short).length, 1);
});

test('HTML comments are ignored, including an unclosed one', () => {
  const md = `${log({ behance: 29 })}\n## Shortfall\n<!-- - Behance cases: 29 — only 29 relevant cases exist -->\n`;
  assert.equal(parseResearchLog(md).shortfall, false);
  assert.equal(researchFailures(parseResearchLog(md)).length, 1);
  assert.equal(parseResearchLog('## Shortfall\n<!-- todo\n- Behance cases: 1 — only one case exists\n').shortfall, false);
  assert.equal(behance('<!--\n- https://x/1\n- https://x/2\n-->\n- https://x/3'), 1);
});

test('sitePending reads data-pending on the <section> whose data-section is exactly "site"', () => {
  assert.equal(sitePending('<section data-section="site" data-pending>x</section>'), true);
  assert.equal(sitePending('<section data-pending data-section="site">x</section>'), true);
  assert.equal(sitePending('<section\ndata-section="site"\ndata-pending>x</section>'), true);
  assert.equal(sitePending('<section data-section="site">x</section>'), false);
  assert.equal(sitePending('<section data-section="site" data-pending="false">x</section>'), false);
  assert.equal(sitePending('<section data-section="closing" data-pending></section><section data-section="site"></section>'), false);
  assert.equal(sitePending('<section data-section="site-extra" data-pending></section><section data-section="site"></section>'), false);
  assert.equal(sitePending('<div data-section="site" data-pending></div>'), false);
});

test('licences that need credit: Creative Commons Attribution, -ShareAlike/-NonCommercial/-NoDerivatives, by-sa/nc/nd', () => {
  for (const l of ['Creative Commons Attribution 4.0', 'Attribution-ShareAlike 4.0', 'Attribution-NonCommercial', 'attribution-noderivatives', 'CC-BY-SA 4.0', 'by-sa', 'by-nc', 'by-nd', 'BY-NC-SA 3.0', 'cc by-nc-nd']) {
    assert.equal(licenceNeedsCredit(`photo.jpg | https://x | ${l}`), true, l);
  }
  for (const l of ['CC0', 'CC0 1.0 Universal', 'Public Domain', 'Unsplash License, no attribution required', 'Pexels License']) {
    assert.equal(licenceNeedsCredit(`photo.jpg | https://x | ${l}`), false, l);
  }
});

test('parseCheckArgs is strict', () => {
  assert.deepEqual(parseCheckArgs(['d']), { dir: 'd', offline: false, afterGate: false, watermark: undefined });
  assert.deepEqual(parseCheckArgs(['d', '--offline', '--after-gate', '--watermark', 'text:x']), { dir: 'd', offline: true, afterGate: true, watermark: 'text:x' });
  assert.deepEqual(parseCheckArgs(['--watermark=none', 'd']), { dir: 'd', offline: false, afterGate: false, watermark: 'none' });
  assert.deepEqual(parseCheckArgs(['--watermark=text:a=b', 'd']).watermark, 'text:a=b');
  for (const bad of [[], ['d', '--watermark'], ['d', '--watermark', '--offline'], ['--watermark=', 'd'], ['d', '--wat'], ['d', '--offlin'], ['d', 'e'], ['--after-gate']]) {
    assert.throws(() => parseCheckArgs(bad), Error, JSON.stringify(bad));
  }
});

// Fixture variants: export once, copy the exported tree per test, mutate, run the checks.
let browser, base, server;
const PNG_1X1 = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
before(async () => {
  browser = await launchBrowser();
  base = copyPresentationFixture();
  await exportPresentation(base.dir, 'text:Teste', { browser });
  server = http.createServer((req, res) => { res.setHeader('content-type', 'image/png'); res.end(PNG_1X1); });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
});
after(async () => {
  await browser?.close();
  server?.close();
  base?.cleanup();
});

async function check(mutate = () => {}, { reexport, ...options } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'apresentação teste '));
  const dir = path.join(root, 'apresentação');
  try {
    fs.cpSync(base.dir, dir, { recursive: true });
    mutate(dir, root);
    if (reexport) await exportPresentation(dir, 'text:Teste', { browser });
    const results = await runChecks(dir, { offline: true, afterGate: false, browser, ...options });
    return { results, failed: results.filter((r) => !r.ok).map((r) => r.name) };
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}
// A mutation that changes nothing would let its test pass without protecting anything, so it throws instead.
const edit = (dir, file, fn) => {
  const p = path.join(dir, file);
  const before = fs.readFileSync(p, 'utf8');
  const after = fn(before);
  if (after === before) throw new Error(`test mutation changed nothing in ${file}`);
  fs.writeFileSync(p, after);
};
// The card mockup's <img>, whatever other attributes (data-reveal, loading, ...) the fixture gives it.
const CARD_IMG = /<img\b[^>]*\bsrc="assets\/mockup\.png"[^>]*\balt="Card mockup"[^>]*>/;
const RECORD = (file) => [`${file}: recorded in assets.md`, `${file}: source URL recorded`, `${file}: licence recorded and needs no credit`];
const LOCAL_ONLY = 'mockup photo must be a local file in the presentation folder';
const SECTIONS_CHECK = 'nine sections present, in order';
const RESEARCH_CHECK = 'research-log.md: Behance cases and Mockup candidates, 30 each (or a Shortfall)';
const dropSite = (h) => h.replace(/<section data-section="site">[\s\S]*?<\/section>/, '');

test('complete fixture passes every check', async () => {
  const { results, failed } = await check();
  assert.deepEqual(failed, []);
  assert.ok(results.length > 15, `only ${results.length} checks ran`);
});

test('preview without layer fails only that check', async () => {
  const { failed } = await check((dir) => edit(dir, 'preview/presentation.html', stripWatermark));
  assert.deepEqual(failed, ['preview/: every html has the watermark layer']);
});

test('a layer left in final/ fails only that check, with or without --watermark', async () => {
  const mutate = (dir) => edit(dir, 'final/presentation.html', (h) => h.replace('</body>', '<!--df-watermark--><div data-df-watermark></div><!--/df-watermark--></body>'));
  assert.deepEqual((await check(mutate)).failed, ['final/: no html has the watermark layer']);
  assert.deepEqual((await check(mutate, { watermark: 'none' })).failed.sort(), ['final/: no html has the watermark layer', 'no preview/ when watermark=none']);
  const noPreview = (dir) => { mutate(dir); fs.rmSync(path.join(dir, 'preview'), { recursive: true }); };
  assert.deepEqual((await check(noPreview)).failed, ['final/: no html has the watermark layer']);
});

test('preview/ and final/ with different file sets fail only that check', async () => {
  const { failed } = await check((dir) => fs.writeFileSync(path.join(dir, 'preview', 'stray.txt'), 'x'));
  assert.deepEqual(failed, ['preview/ and final/ hold the same file set']);
});

test('mockup row with CC BY fails only that check', async () => {
  const { failed } = await check((dir) => edit(dir, 'assets.md', (m) => m.replace('CC0', 'CC BY 4.0')));
  assert.deepEqual(failed, ['assets/mockup.png: licence recorded and needs no credit']);
});

test('an empty licence cell, or "Creative Commons Attribution", fails only the licence check', async () => {
  const licence = ['assets/mockup.png: licence recorded and needs no credit'];
  assert.deepEqual((await check((dir) => edit(dir, 'assets.md', (m) => m.replace('| CC0 |', '| |')))).failed, licence);
  assert.deepEqual((await check((dir) => edit(dir, 'assets.md', (m) => m.replace('CC0', 'Creative Commons Attribution 4.0')))).failed, licence);
  assert.deepEqual((await check((dir) => edit(dir, 'assets.md', (m) => m.replace('CC0', 'CC BY-SA 4.0')))).failed, licence);
});

test('assets.md matches the file cell exactly, not by substring', async () => {
  const mutate = (dir) => {
    fs.renameSync(path.join(dir, 'assets', 'mockup.png'), path.join(dir, 'assets', 'a.png'));
    edit(dir, 'presentation.html', (h) => h.replaceAll('assets/mockup.png', 'assets/a.png'));
    edit(dir, 'assets.md', (m) => m.replace('assets/mockup.png', 'assets/mocha.png'));
  };
  assert.deepEqual((await check(mutate)).failed, RECORD('assets/a.png'));
});

test('an assets.md row that only appears inside an HTML comment does not record the photo', async () => {
  const { failed } = await check((dir) => edit(dir, 'assets.md', () => '# Assets\n<!-- | assets/mockup.png | https://example.com/x | CC0 | -->\n'));
  assert.deepEqual(failed, RECORD('assets/mockup.png'));
});

test('the source URL comes from the source cell, not from anywhere in the row', async () => {
  const { failed } = await check((dir) => edit(dir, 'assets.md', (m) => m.replace('https://example.com/mockups/poster-card', 'no url here')));
  assert.deepEqual(failed, ['assets/mockup.png: source URL recorded']);
});

test('a photo shown through a ::before background is a mockup photo too: it needs its row', async () => {
  const { failed } = await check((dir) => {
    edit(dir, 'presentation.html', (h) => h.replace('</style>', '.poster::before{content:"";display:block;width:10px;height:10px;background:url(assets/bg.png)}</style>'));
    fs.copyFileSync(path.join(dir, 'assets', 'mockup.png'), path.join(dir, 'assets', 'bg.png'));
  });
  assert.deepEqual(failed, RECORD('assets/bg.png'));
});

test('a mockup photo embedded as a data: URI fails only the local-file rule', async () => {
  const uri = `data:image/png;base64,${PNG_1X1.toString('base64')}`;
  const { failed } = await check((dir) => edit(dir, 'presentation.html', (h) => h.replace(CARD_IMG, `<img src="${uri}" alt="Card mockup">`)));
  assert.deepEqual(failed, [LOCAL_ONLY]);
});

test('a hot-linked mockup photo fails only the local-file rule', async () => {
  const { failed } = await check((dir) => edit(dir, 'presentation.html', (h) => h.replace(CARD_IMG, `<img src="http://127.0.0.1:${server.address().port}/m.png" alt="Card mockup">`)));
  assert.deepEqual(failed, [LOCAL_ONLY]);
});

test('a mockup photo outside the presentation folder fails only the local-file rule', async () => {
  const { failed } = await check((dir, root) => {
    fs.copyFileSync(path.join(dir, 'assets', 'mockup.png'), path.join(root, 'shared.png'));
    edit(dir, 'presentation.html', (h) => h.replace(CARD_IMG, '<img src="../shared.png" alt="Card mockup">'));
  });
  assert.deepEqual(failed, [LOCAL_ONLY]);
});

test('a background data: URI on a mockup fails the local-file rule; a vector logo inside it does not', async () => {
  const svg = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22/%3E';
  assert.deepEqual((await check((dir) => edit(dir, 'presentation.html', (h) => h.replace('</style>', `.card{background:url("${svg}")}</style>`)))).failed, []);
  const png = `data:image/png;base64,${PNG_1X1.toString('base64')}`;
  assert.deepEqual((await check((dir) => edit(dir, 'presentation.html', (h) => h.replace('</style>', `.card::after{content:"";position:absolute;inset:0;background:url("${png}")}</style>`)))).failed, [LOCAL_ONLY]);
});

test('short log without a Shortfall fails only research', async () => {
  const { failed } = await check((dir) => edit(dir, 'research-log.md', (m) => m.replace(/^- behance\.example case 0[123] .*$/gm, '')));
  assert.deepEqual(failed, [RESEARCH_CHECK]);
});

test('short log with a Shortfall line in the documented format passes', async () => {
  const { failed } = await check((dir) => edit(dir, 'research-log.md', (m) => `${m.replace(/^- behance\.example case 0[123] .*$/gm, '')}\n## Shortfall\n- Behance cases: 29 — only 29 relevant cases exist in this niche\n`));
  assert.deepEqual(failed, []);
});

test('pending site fails only with afterGate; data-pending="false" is not pending', async () => {
  const pend = (v = '') => (dir) => edit(dir, 'presentation.html', (h) => h.replace('<section data-section="site">', `<section data-section="site" data-pending${v}>`));
  assert.deepEqual((await check(pend())).failed, []);
  assert.deepEqual((await check(pend(), { afterGate: true })).failed, ['site section is filled (not marked pending)']);
  assert.deepEqual((await check(pend('="false"'), { afterGate: true })).failed, []);
});

test('a 1400px section fails slide overflow only', async () => {
  const { failed } = await check((dir) => edit(dir, 'presentation.html', (h) => h.replace('<section data-section="concept">', '<section data-section="concept"><div style="height:1400px"></div>')));
  assert.deepEqual(failed, ['slide overflow: every section fits 1920×1080']);
});

test('a section with its own min-height cannot hide an overflow or leave a slide of the wrong size', async () => {
  const { failed } = await check((dir) => edit(dir, 'presentation.html', (h) => h.replace('<section data-section="concept">', '<section data-section="concept" style="min-height:1500px"><div style="height:1400px"></div>')), { reexport: true });
  assert.deepEqual(failed, ['slide overflow: every section fits 1920×1080']);
});

test('sections come from the rendered DOM: a CSS selector alone does not make a section', async () => {
  const { failed } = await check((dir) => edit(dir, 'presentation.html', (h) => dropSite(h).replace('</style>', 'section[data-section="site"]{color:red}</style>')), { reexport: true });
  assert.deepEqual(failed, [SECTIONS_CHECK]);
});

test('a missing section is named, and sections out of order fail', async () => {
  assert.deepEqual((await check((dir) => edit(dir, 'presentation.html', dropSite), { reexport: true })).failed, [SECTIONS_CHECK]);
  const swap = (dir) => edit(dir, 'presentation.html', (h) => h.replace('data-section="concept"', 'data-section="TMP"').replace('data-section="audience"', 'data-section="concept"').replace('data-section="TMP"', 'data-section="audience"'));
  assert.deepEqual((await check(swap, { reexport: true })).failed, [SECTIONS_CHECK]);
});

test('a social artboard inside a section is left out of the slide, the PDF and the overflow measure', async () => {
  const inner = (dir) => edit(dir, 'presentation.html', (h) => h
    .replace('<div data-social="story">Story</div>', '')
    .replace('<p>Fixture copy for closing.</p>', '<p>Fixture copy for closing.</p><div data-social="story">Story</div>'));
  assert.deepEqual((await check(inner, { reexport: true })).failed, []);
});

test('watermark=none with a stale preview/ fails; without one it passes', async () => {
  assert.deepEqual((await check(() => {}, { watermark: 'none' })).failed, ['no preview/ when watermark=none']);
  assert.deepEqual((await check((dir) => fs.rmSync(path.join(dir, 'preview'), { recursive: true }), { watermark: 'none' })).failed, []);
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
  assert.deepEqual(failed, ['final/: every slide is 1920×1080, one per section', 'final/: PDF has one page per slide']);
});

test('missing export output is reported once instead of crashing', async () => {
  const { failed } = await check((dir) => fs.rmSync(path.join(dir, 'final'), { recursive: true }));
  assert.deepEqual(failed, ['final/ exists (run export-presentation.mjs)']);
});

const SLIDESHOW = ['presentation.html @1440: slideshow works', 'presentation.html @390: slideshow works'];

test('a presentation without the slideshow runtime fails only the slideshow check, at both sizes', async () => {
  const { failed, results } = await check((dir) => edit(dir, 'presentation.html', (h) => h.replace('<script src="slideshow.js"></script>', '')));
  assert.deepEqual(failed, SLIDESHOW);
  assert.match(results.find((r) => r.name === SLIDESHOW[0]).detail, /runtime did not start/);
});

test('two slides in view at once fail only the slideshow check', async () => {
  const { failed, results } = await check((dir) => edit(dir, 'presentation.html', (h) => h.replace('</head>', '<style>section[data-section]{visibility:visible !important;opacity:1 !important}</style></head>')));
  assert.deepEqual(failed, SLIDESHOW);
  assert.match(results.find((r) => r.name === SLIDESHOW[0]).detail, /expected only slide 1 in view/);
});

test('a reveal that stays masked under reduced motion fails only the slideshow check', async () => {
  const { failed, results } = await check((dir) => edit(dir, 'presentation.html', (h) => h.replace('</head>', '<style>@media (prefers-reduced-motion: reduce){.df-slideshow [data-reveal]{clip-path:inset(0 100% 0 0) !important}}</style></head>')));
  assert.deepEqual(failed, SLIDESHOW);
  assert.match(results.find((r) => r.name === SLIDESHOW[0]).detail, /reduced motion: 1 \[data-reveal\]/);
});

test('a keyboard handler that never moves the slide fails only the slideshow check', async () => {
  const { failed } = await check((dir) => edit(dir, 'slideshow.js', (js) => js.replace(/e\.preventDefault\(\);\r?\n\s*go\(target\);/, 'e.preventDefault();')));
  assert.deepEqual(failed, SLIDESHOW);
});

test('"source page answers": 401/403/429 count as answered (stock sites refuse scripted fetches); 404 and 500 do not', async () => {
  const status = http.createServer((req, res) => { res.statusCode = Number(req.url.slice(1)); res.end(); });
  await new Promise((r) => status.listen(0, '127.0.0.1', r));
  try {
    for (const [code, answered] of [[403, true], [429, true], [404, false]]) {
      const { failed } = await check((dir) => edit(dir, 'assets.md', (m) => m.replace('https://example.com/mockups/poster-card', `http://127.0.0.1:${status.address().port}/${code}`)), { offline: false });
      assert.deepEqual(failed, answered ? [] : ['assets/mockup.png: source page answers'], `HTTP ${code}`);
    }
  } finally {
    status.close();
  }
});
