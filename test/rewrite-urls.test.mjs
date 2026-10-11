import test from 'node:test';
import assert from 'node:assert/strict';
import { rewriteRelativeUrls } from '../scripts/lib/export.mjs';

test('rewriteRelativeUrls prefixes relative urls only, and only where they are urls', () => {
  const out = rewriteRelativeUrls([
    '<!-- <img src="c.png"> -->',
    '<link rel="stylesheet" href="css/a.css"><img src="a b/é.png" srcset="s1.png 1x, s2.png 2x" style="background:url(bg.png)">',
    '<a href="#x">a</a><a href="?q=1">q</a><a href="/abs">abs</a><a href="//cdn.example/x">cdn</a><a href="https://e.com/x">e</a><a href="mailto:a@b.c">m</a><img src="data:image/png;base64,AAAA">',
    '<a href="./up.html">u</a><iframe src="../site/index.html"></iframe>',
    '<style>.a{background:url("img/z.png")} .b{background:url(https://e.com/z.png)}</style>',
    `<script src="app.js"></script><script>const u = "<img src='no.png'>"; fetch("data.json");</script>`,
  ].join('\n'), '../');
  for (const want of [
    '<!-- <img src="c.png"> -->', 'href="../css/a.css"', 'src="../a b/é.png"', 'srcset="../s1.png 1x, ../s2.png 2x"', 'url(../bg.png)',
    'href="#x"', 'href="?q=1"', 'href="/abs"', 'href="//cdn.example/x"', 'href="https://e.com/x"', 'href="mailto:a@b.c"', 'src="data:image/png;base64,AAAA"',
    'href="../up.html"', 'src="../../site/index.html"', 'url("../img/z.png")', 'url(https://e.com/z.png)', '<script src="../app.js">',
    `const u = "<img src='no.png'>"; fetch("data.json");`,
  ]) assert.ok(out.includes(want), want + '\n' + out);
});

test('style attributes: entity-encoded quotes around url() are decoded, rewritten and encoded again', () => {
  assert.equal(rewriteRelativeUrls('<div style="background:url(&quot;x.jpg&quot;)">'), '<div style="background:url(&quot;../x.jpg&quot;)">');
  assert.equal(rewriteRelativeUrls("<div style='background:url(&#39;x.jpg&#39;)'>"), "<div style='background:url(&#39;../x.jpg&#39;)'>");
  assert.equal(rewriteRelativeUrls(`<div style='background:url("x.jpg")'>`), `<div style='background:url("../x.jpg")'>`);
  assert.equal(rewriteRelativeUrls('<div style="background:url(&quot;https://e.com/x.jpg&quot;)">'), '<div style="background:url(&quot;https://e.com/x.jpg&quot;)">');
  assert.equal(rewriteRelativeUrls(`<div style="background:url( 'sp ace.jpg' )">`), `<div style="background:url('../sp ace.jpg')">`);
});

test('srcset: candidates are split on separating commas only; commas inside a url and whole data: uris survive', () => {
  assert.equal(rewriteRelativeUrls('<img srcset="a.jpg 1x, b/c.jpg 2x,d.jpg 480w">'), '<img srcset="../a.jpg 1x, ../b/c.jpg 2x,../d.jpg 480w">');
  assert.equal(rewriteRelativeUrls('<img srcset="data:image/png;base64,AAAA 1x, x.png 2x">'), '<img srcset="data:image/png;base64,AAAA 1x, ../x.png 2x">');
  assert.equal(rewriteRelativeUrls('<img srcset="img.jpg?w=100,200 1x">'), '<img srcset="../img.jpg?w=100,200 1x">');
  assert.equal(rewriteRelativeUrls('<img srcset="a.jpg, b.jpg 2x">'), '<img srcset="../a.jpg, ../b.jpg 2x">');
  assert.equal(rewriteRelativeUrls('<img srcset="https://e.com/a.jpg 1x, /root.jpg 2x, #x 3x">'), '<img srcset="https://e.com/a.jpg 1x, /root.jpg 2x, #x 3x">');
});

test('only real tags are rewritten: text of <p>, <textarea>, <title>, scripts and comments stay as written', () => {
  for (const same of [
    '<p>Set src="logo.png" in your config</p>', '<textarea> href="t.html"</textarea>', '<title>a src="b.png"</title>',
    '<script>var s = \' src="x.js"\'; el.innerHTML = "<img src=\\"y.png\\">";</script>', '<!-- <img src="c.png"> -->', '<div data="x">', '<a title="a src=b.png">x</a>'.replace('x</a>', 'x</a>'),
  ]) assert.equal(rewriteRelativeUrls(same), same);
  assert.equal(rewriteRelativeUrls('<a title="a > b" href="x.html">'), '<a title="a > b" href="../x.html">');
  assert.equal(rewriteRelativeUrls('<object data="x.svg"></object><td background="bg.jpg">'), '<object data="../x.svg"></object><td background="../bg.jpg">');
  assert.equal(rewriteRelativeUrls('<img src = x.png alt=y>'), '<img src = "../x.png" alt=y>');
});

test('CSS @import with a string is rewritten like url()', () => {
  assert.equal(rewriteRelativeUrls('<style>@import "base.css"; @import url(more.css); @import "https://e.com/x.css";</style>'),
    '<style>@import "../base.css"; @import url(../more.css); @import "https://e.com/x.css";</style>');
});

test("an author's own <base href> is the only thing prefixed; urls stay as written", () => {
  assert.equal(rewriteRelativeUrls('<base href="assets/"><img src="a.png"><style>.a{background:url(b.png)}</style><a href="c.html">'),
    '<base href="../assets/"><img src="a.png"><style>.a{background:url(b.png)}</style><a href="c.html">');
  const absolute = '<base href="https://e.com/"><img src="a.png">';
  assert.equal(rewriteRelativeUrls(absolute), absolute);
  const inComment = '<!-- <base href="x/"> --><img src="a.png">';
  assert.equal(rewriteRelativeUrls(inComment), '<!-- <base href="x/"> --><img src="../a.png">');
});
