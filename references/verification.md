# Verification

**Work is not done until the rendered page has been looked at.**

This file exists because every failure below shipped through a green test
suite, a clean type-check and a successful build, and every one was caught
within a minute of opening the page.

---

## Why this gate exists

| What shipped | What the tooling said | What was true |
|---|---|---|
| A virtualized table | 3 tests green, including "renders fewer than 500 rows" | The shell used `min-h-screen`, so `<main>`'s `overflow-y-auto` never engaged. The virtualizer measured a **53,677px** viewport and rendered all 1,386 rows. The test passed because it stubbed a 400px viewport. |
| Five custom `fontSize` tokens | Build clean, classes present in source | `tailwind-merge` classifies unrecognised `text-*` as *colours* and deleted every one. `twMerge("text-title text-ink")` returned `"text-ink"`. The whole type scale was inert. |
| Themed charts | Build clean, no warnings | Tremor styles its chrome with a `tremor-*` utility namespace the host config must define. It was never defined, so **41 classes compiled to nothing** and every axis label fell back to Recharts grey — invisible on a dark canvas. |
| A rebrand | 183 tests green | Every page had the same layout it started with. Tokens and type had changed; not one structural decision had. |

The pattern: **absence is silent.** A class that does not exist, a rule that
never matches, a container that never bounds — none of them raise anything.
Only looking finds them.

---

## Capture the page at rest

A full-page screenshot does **not** scroll the page — the browser captures
beyond the viewport without moving it. Anything using `whileInView`, an
`IntersectionObserver`, or a scroll-linked value is therefore photographed
in its *initial* state: `opacity: 0`, or clipped to nothing. You will see
blank bands and conclude the section is broken.

Emulate reduced motion instead. Every entrance then renders at its resting
state, which is also a free check that the reduced-motion contract works.

```js
import { chromium } from "@playwright/test";

const ctx = await chromium.launch().then((b) => b.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "reduce",          // <- the whole trick
}));
const page = await ctx.newPage();
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);
await page.screenshot({ path: out, fullPage: true });
```

If a blank band persists *with* reduced motion on, it is a real bug.

For an app shell bounded to the viewport (`h-screen` + an inner
`overflow-y-auto`), `fullPage` adds nothing — the document is 900px and the
content scrolls inside a child. Capture the viewport, and scroll the inner
container if you need what is below.

---

## A screenshot always succeeds

`page.screenshot()` has no failure mode. It writes a valid PNG of whatever
was on screen, and a PNG of the wrong thing looks exactly as much like a
result as a PNG of the right thing. Every other step in a build can fail
loudly; this one cannot. So the rig has to fail loudly for it.

One session, capturing eight pages for a README, took three passes. Each
pass wrote eight plausible PNGs. Each was wrong in a different silent way:

| Pass | What the files showed | Cause |
|---|---|---|
| 1 | An unrendered headline, a panel reading "unavailable", four counters at `0` | The shutter fired on load. The helper waited only for a loading string to detach — on a public page, that is immediately. Reveals had not fired and the fetches had not landed. |
| 2 | Eight pictures of the login page | The persistent browser profile's session cookie had expired. Nothing checked who was signed in. |
| 3 | An always-dark admin page, filed as `admin-light.png` | `page.addInitScript()` **accumulates**. Called once per target on a shared page, every earlier theme still ran on every later navigation. |

None of the three raised anything. All three were caught by opening the
files and looking.

### What the rig owes you

```js
// 1. One page per target. addInitScript accumulates on a shared page.
const page = await context.newPage();
await page.addInitScript((mode) => localStorage.setItem("theme", mode), target.theme);

// 2. Prove you are who you think you are, every target.
const me = await page.evaluate(() => fetch("/api/auth/me", { credentials: "include" })
  .then((r) => (r.ok ? r.json() : null)));
if (!me) await logIn(page);
if (new URL(page.url()).pathname === "/login") throw new Error(`bounced: ${target.path}`);

// 3. Assert the theme you asked for is the theme that rendered.
const applied = await page.evaluate(() => ({
  mode: document.documentElement.classList.contains("dark") ? "dark" : "light",
  named: document.querySelector("[data-theme]")?.getAttribute("data-theme") ?? null,
}));
if (applied.mode !== target.theme) throw new Error(`${target.file}: got ${applied.mode}`);
```

Reduced motion settles entrances. It does **not** settle a `fetch`, a
count-up, or a chart's own draw animation — those need the network quiet
plus a beat. And an `IntersectionObserver` only fires for viewports the
page actually passed through: jumping straight to the bottom skips every
observer in the middle, which then reveal on the way back up, mid-shutter.
Walk the height in viewport-sized steps.

### Frame on elements, not pixels

A magic scroll offset crops whatever happens to be at that offset. The
first attempt at a mid-page section sliced a card in half and landed in the
middle of a paragraph. Scroll the section itself into place:

```js
await page.evaluate((label) => {
  const eyebrow = [...document.querySelectorAll("*")]
    .find((el) => !el.children.length && el.textContent?.trim() === label);
  const section = eyebrow?.closest("section") ?? eyebrow;
  if (!section) throw new Error(`no section for ${label}`);   // fail, don't shoot
  window.scrollTo(0, window.scrollY + section.getBoundingClientRect().top - HEADER_H);
}, "Cadeia de rastreio");
```

Match the DOM's own casing — an eyebrow uppercased by `text-transform`
still holds `Cadeia de rastreio` in `textContent`, and a selector written
against the rendered capitals silently finds nothing.

---

## Probe, do not squint

A screenshot cannot tell you whether a theme applied or a class exists. Ask
the page.

```js
// Did the theme actually resolve? (This caught a false "Grafite is broken"
// report — the tokens were correct; a 28px chip just looked yellow at size.)
await page.evaluate(() => {
  const el = document.querySelector("[data-theme]");
  const read = (e, p) => getComputedStyle(e).getPropertyValue(p).trim();
  return { theme: el?.dataset.theme, brand: read(el, "--brand"), canvas: read(el, "--canvas") };
});

// Did the virtualizer actually virtualize?
await page.evaluate(() => ({
  domRows: document.querySelectorAll("tbody tr[data-index]").length,
  docHeight: document.documentElement.scrollHeight,
}));
```

And check the compiled CSS directly for classes a library expects:

```bash
grep -c "fill-tremor-content" dist/assets/*.css   # 0 means the namespace is undefined
```

A unit test that compiles the exact class list and asserts each produces a
rule turns this silent failure into a loud one.

---

## Before you trust what you are looking at

1. **Is the server serving the current code?** A stale dev server returning
   HTTP 500 shows a cached page. Check the status code, not the pixels.
   Multiple orphaned instances on shifting ports is a common cause of
   "my changes aren't showing up".
2. **Which port and which stack?** Dev servers often bind IPv6 `[::1]` while
   the API binds IPv4 `127.0.0.1`. Probing the wrong one reports "down" for
   a healthy server.
3. **Is an animation still running?** A screenshot taken mid-transition
   shows a half-drawn chart or an empty donut. Wait, or emulate reduced
   motion.
4. **Is the data degenerate?** A flat line, a single-slice donut and a
   one-bar list are a *data* problem wearing a design problem's clothes. No
   amount of styling fixes a chart with one value in it. Say so.
5. **Is the toggle even the theme input?** Before filing "this page ignores
   the theme" as a bug, read the shell. One session burned several probes
   on an admin page that rendered dark while `:root` carried no `.dark` and
   `--canvas` resolved light — the layout pinned `data-theme="grafite"` by
   route, on purpose, and the toggle was never meant to reach it. A theme
   can come from a class, an attribute, a route, or the OS. Find which
   before calling it broken.

---

## What to report

State what the look showed, including when it showed nothing useful.

- "Verified: 1,386 rows → 32 in the DOM, document height 53,677px → 900px."
- "Axis labels legible in both themes; console clean on every route."
- "I could not verify this visually — the dev server would not start."

That last one is an acceptable sentence. **"Done" without having looked is
not.** If a claim was never checked, mark it unchecked rather than letting
a green suite imply otherwise.
