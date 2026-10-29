// What a page says and does: the record a redesign is checked against (references/redesign.md).
// Modelled on the before/kept record of Hallmark's sloplint (github.com/nutlope/hallmark, MIT), rewritten for Playwright.
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { settle } from './browser.mjs';

export const urlOf = (target) => (/^https?:\/\//i.test(target) ? target : pathToFileURL(path.resolve(target)).href);

// Runs inside the page. Returns plain data only.
function inventory() {
  const base = location.pathname.slice(0, location.pathname.lastIndexOf('/') + 1);
  const key = (raw) => {
    try {
      const u = new URL(raw, location.href);
      if (!/^(https?|file):$/.test(u.protocol)) return raw.trim();
      if (u.origin !== location.origin) return u.href;
      if (u.pathname === location.pathname && u.search === location.search && u.hash) return u.hash;
      return (location.protocol === 'file:' && u.pathname.startsWith(base) ? u.pathname.slice(base.length) : u.pathname) + u.search + u.hash;
    } catch { return raw.trim(); }
  };
  const uniq = (a) => [...new Set(a.filter(Boolean))];
  const text = (el) => (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
  const quiet = (el) => !!el.closest('script, style, noscript, template');
  const links = uniq([...document.querySelectorAll('a[href]')].map((a) => a.getAttribute('href')).filter((h) => h && h.trim() && h.trim() !== '#').map(key));
  const fieldsIn = (root) => {
    const n = {};
    return uniq([...root.querySelectorAll('input, select, textarea, button[name]')].filter((f) => f.getAttribute('name') || !(f.tagName === 'INPUT' && /^(submit|button|reset|image|hidden)$/i.test(f.getAttribute('type') || ''))).map((f) => {
      const hook = f.getAttribute('data-testid') || f.getAttribute('data-test') || f.getAttribute('data-cy');
      if (f.getAttribute('name')) return f.getAttribute('name');
      if (f.id && !/^(:|radix-|headlessui-|react-aria)/.test(f.id)) return `#${f.id}`;
      if (hook) return `[${hook}]`;
      const t = f.tagName === 'INPUT' ? (f.getAttribute('type') || 'text').toLowerCase() : f.tagName.toLowerCase();
      n[t] = (n[t] || 0) + 1;
      return `unnamed ${t} ${n[t]}`;
    }));
  };
  const forms = [...document.querySelectorAll('form')].map((f, i) => ({
    key: f.id ? `#${f.id}` : f.getAttribute('action') ? `${(f.getAttribute('method') || 'get').toLowerCase()} ${key(f.getAttribute('action'))}` : `form ${i + 1}`,
    method: (f.getAttribute('method') || 'get').toLowerCase(),
    action: f.getAttribute('action') ? key(f.getAttribute('action')) : '',
    fields: fieldsIn(f),
    hidden: uniq([...f.querySelectorAll('input[type="hidden"][name]')].map((c) => `${c.getAttribute('name')}=${c.getAttribute('value') || ''}`)),
    submits: f.querySelectorAll('button:not([type]), button[type="submit"], input[type="submit"], input[type="image"]').length,
  }));
  const handlers = uniq([...document.querySelectorAll('*')].flatMap((el) => [...el.attributes].filter((a) => /^on[a-z]+$/i.test(a.name)).map((a) => `${el.tagName.toLowerCase()}${el.id ? `#${el.id}` : ''} ${a.name}="${a.value.replace(/\s+/g, ' ').trim().slice(0, 60)}"`)));
  const hooks = uniq([...document.querySelectorAll('[data-testid], [data-test], [data-cy]')].map((el) => el.getAttribute('data-testid') || el.getAttribute('data-test') || el.getAttribute('data-cy')));
  const scripts = uniq([...document.querySelectorAll('script[src]')].map((s) => key(s.getAttribute('src'))));
  const inline = [...document.querySelectorAll('script:not([src])')].map((s) => s.textContent || '').join('\n');
  const queried = uniq([...inline.matchAll(/(?:querySelector(?:All)?|closest|matches)\(\s*(['"`])([^'"`]+)\1/g)].map((m) => m[2]).concat([...inline.matchAll(/getElementById\(\s*(['"`])([^'"`]+)\1/g)].map((m) => `#${m[2]}`)).concat([...inline.matchAll(/getElementsByClassName\(\s*(['"`])([^'"`]+)\1/g)].map((m) => `.${m[2].trim().split(/\s+/).join('.')}`)));
  const hooked = queried.filter((q) => { try { return !!document.querySelector(q); } catch { return false; } });
  const headings = uniq([...document.querySelectorAll('h1, h2, h3, h4')].filter((h) => !quiet(h)).map((h) => text(h).toLowerCase().replace(/[\p{Extended_Pictographic}️‍]/gu, '').replace(/\s+/g, ' ').trim()).filter((t) => t.length > 1));
  const body = text(document.body);
  const figures = uniq((body.match(/[$€£¥]\s?\d[\d,.]*\+?[kKmM]?|\b\d[\d,.]*\s?%|\b\d[\d,.]*[kKmM]?\+(?=\s|$)|\b\d{1,3}(?:,\d{3})+\b|\b\d{1,2}[:.]\d{2}\s?(?:am|pm)?\b|\b(?:19|20)\d{2}\b|\b\d+(?:\.\d+)?\s(?:hours?|minutes?|mins?|days?|weeks?|months?|years?|seconds?|ms|km|kg|g|ml|mm|cm|gb|mb|tb|x)\b|\+?\d[\d\s().-]{7,}\d/gi) || []).map((t) => t.replace(/\s+/g, '').toLowerCase()));
  const images = uniq([...document.querySelectorAll('img[src]')].map((i) => (i.getAttribute('src') || '').split('?')[0].split('/').pop()));
  const ids = uniq([...document.querySelectorAll('[id]')].map((el) => el.id).filter((id) => id && !/^(:|radix-|headlessui-|react-aria)/.test(id)));
  const controls = document.querySelectorAll('button, [role="button"], input[type="submit"], input[type="button"], select, textarea, input:not([type="hidden"])').length;
  const comments = [];
  const walker = document.createTreeWalker(document.documentElement, NodeFilter.SHOW_COMMENT);
  let c;
  while ((c = walker.nextNode())) comments.push(c.textContent);
  for (const s of document.querySelectorAll('style')) for (const m of (s.textContent || '').matchAll(/\/\*([\s\S]*?)\*\//g)) comments.push(m[1]);
  return { links, fields: fieldsIn(document), forms, handlers, hooks, scripts, hooked: hooked, queried, headings, figures, images, ids, controls, words: body ? body.split(' ').length : 0, title: document.title, comments };
}

export async function recordPage(browser, target, { screenshot = null } = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  try {
    await page.goto(urlOf(target), { waitUntil: 'load', timeout: 45000 });
    await settle(page, { quiet: 400 });
    const record = await page.evaluate(inventory);
    record.target = target;
    record.recorded = new Date().toISOString();
    if (screenshot) {
      await page.evaluate(async () => { const h = document.documentElement.scrollHeight; for (let y = 0; y < h; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 30)); } scrollTo(0, 0); });
      await page.screenshot({ path: screenshot, fullPage: true });
      record.screenshot = screenshot;
    }
    return record;
  } finally {
    await context.close();
  }
}

// `df-design · dropped <item>, <item> · <reason>` and `df-design · reworded "<old>" to "<new>" · <reason>` on the page.
export function parseAllowances(comments) {
  const dropped = [];
  const reworded = [];
  const short = [];
  for (const raw of comments || []) {
    const m = /df-design\s*[·:-]\s*(dropped|reworded)\s+([\s\S]+?)\s*[·:-]\s*([^·]*?)\s*$/i.exec(raw.trim());
    if (!m) continue;
    const reason = m[3].trim();
    if (reason.length < 12) { short.push({ kind: m[1].toLowerCase(), what: m[2].trim().slice(0, 50), reason }); continue; }
    if (m[1].toLowerCase() === 'reworded') {
      const q = [...m[2].matchAll(/"([^"]+)"/g)].map((x) => x[1].toLowerCase());
      if (q[0]) reworded.push({ old: q[0], new: q[1] || '', reason });
    } else {
      for (const item of m[2].split(',')) { const t = item.trim().replace(/^[`"']|[`"']$/g, ''); if (t) dropped.push({ item: t, lower: t.toLowerCase(), reason }); }
    }
  }
  return { dropped, reworded, short };
}

const norm = (s) => String(s).toLowerCase().trim();
const allowed = (dropped, value) => dropped.some((d) => { const v = norm(value); return v === d.lower || v.includes(d.lower) || d.lower.includes(v) && d.lower.length >= 4; });

export function comparePages(before, after) {
  const { dropped, reworded, short } = parseAllowances(after.comments);
  const findings = [];
  const report = (grade, what, items, fix) => { if (items.length) findings.push({ grade, what, items, fix }); };
  const gone = (list, now) => (list || []).filter((x) => !(now || []).includes(x) && !allowed(dropped, x));
  for (const s of short) findings.push({ grade: 'WARN', what: 'record', items: [`${s.kind} ${s.what} is not on the record: its reason is under 12 characters`], fix: 'Say why in a clause' });

  report('FAIL', 'links', gone(before.links, after.links), 'Restore the link, or put it on the record: <!-- df-design · dropped <href> · <the reason> -->');
  report('FAIL', 'fields', gone(before.fields, after.fields), 'Restore the field with its name');
  report('FAIL', 'handlers', gone(before.handlers, after.handlers), 'Keep inline handlers where scripts expect them');
  report('FAIL', 'test hooks', gone(before.hooks, after.hooks), 'Keep every data-testid, data-test and data-cy a test reads');
  report('FAIL', 'scripts', gone(before.scripts, after.scripts), 'Keep every script tag');
  const stillQueried = (before.hooked || []).filter((q) => (after.queried || []).includes(q) || (before.queried || []).includes(q));
  const lost = stillQueried.filter((q) => !(after.hooked || []).includes(q) && !allowed(dropped, q));
  report('FAIL', 'selectors a script queries', lost, 'The script still looks for this selector and nothing matches: keep the id or class, or change the script with it');
  for (const bf of before.forms || []) {
    const af = (after.forms || []).find((f) => f.key === bf.key) || (after.forms || []).find((f) => f.action === bf.action && f.method === bf.method);
    if (!af) { if (!allowed(dropped, bf.key)) findings.push({ grade: 'FAIL', what: 'forms', items: [`${bf.key} is gone`], fix: 'Keep the form, its method and its action' }); continue; }
    if (bf.action !== af.action || bf.method !== af.method) findings.push({ grade: 'FAIL', what: 'forms', items: [`${bf.key}: ${bf.method} ${bf.action} is now ${af.method} ${af.action}`], fix: 'Keep the method and the action' });
    const missing = bf.fields.filter((x) => !af.fields.includes(x) && !allowed(dropped, x));
    if (missing.length) findings.push({ grade: 'FAIL', what: 'forms', items: [`${bf.key} lost ${missing.join(', ')}`], fix: 'Keep every field in its form' });
    const hid = bf.hidden.filter((x) => !af.hidden.includes(x));
    if (hid.length) findings.push({ grade: 'FAIL', what: 'forms', items: [`${bf.key} lost hidden ${hid.join(', ')}`], fix: 'Keep hidden inputs and their values' });
    if (bf.submits && !af.submits) findings.push({ grade: 'FAIL', what: 'forms', items: [`${bf.key} has no submit any more`], fix: 'Keep a submit control' });
  }
  const headingsGone = (before.headings || []).filter((h) => !(after.headings || []).includes(h) && !reworded.some((r) => r.old === h) && !allowed(dropped, h));
  report('WARN', 'headings', headingsGone, 'Restore it, or put it on the record: <!-- df-design · reworded "<old>" to "<new>" · <why> --> or dropped <item> · <why>');
  report('WARN', 'figures', gone(before.figures, after.figures), 'A figure the page stated is gone: restore it or record why');
  report('WARN', 'images', gone(before.images, after.images), 'An image the page showed is gone: restore it or record why');
  report('WARN', 'ids', gone(before.ids, after.ids), 'An id is gone; anchors and scripts may point at it');
  if ((after.controls || 0) < (before.controls || 0)) report('WARN', 'controls', [`${before.controls} controls before, ${after.controls} after`], 'Something a visitor could do is gone; name it in the handoff');

  const count = (k) => ({ before: (before[k] || []).length, kept: (before[k] || []).filter((x) => (after[k] || []).includes(x)).length });
  const kept = { links: count('links'), fields: count('fields'), handlers: count('handlers'), hooks: count('hooks'), scripts: count('scripts'), headings: count('headings'), figures: count('figures'), images: count('images') };
  const ok = !findings.some((f) => f.grade === 'FAIL');
  return { findings, kept, ok, dropped, reworded };
}

export function compareHtml({ before, after, beforeShot, afterShot, summary }) {
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Before and after</title>
<style>:root{--ink:#1b1b1b;--paper:#f5f3ee;--line:#d6d1c5;--font:system-ui,sans-serif}html,body{overflow-x:clip;margin:0}body{background:var(--paper);color:var(--ink);font:15px/1.5 var(--font)}
header{padding:16px 24px;border-bottom:1px solid var(--line)}pre{white-space:pre-wrap;margin:8px 0 0}main{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:24px;padding:24px}figure{margin:0}img{width:100%;height:auto;display:block;border:1px solid var(--line)}figcaption{padding:8px 0}</style></head>
<body><header><strong>Before:</strong> ${esc(before)} · <strong>After:</strong> ${esc(after)}<pre>${esc(summary)}</pre></header>
<main><figure><figcaption>Before</figcaption><img src="${esc(beforeShot)}" alt="The page before the redesign, full height at 1440"></figure><figure><figcaption>After</figcaption><img src="${esc(afterShot)}" alt="The page after the redesign, full height at 1440"></figure></main></body></html>`;
}
