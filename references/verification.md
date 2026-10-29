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

## Run the gates before you look

```bash
node scripts/check-slop.mjs <page.html or folder> --render          # a built page
node scripts/check-slop.mjs --url http://localhost:3000/pricing     # a route on a dev server
node scripts/check-slop.mjs <page.html> --tier floor                # the quick gate while building, static only
```

The static tier reads the HTML and CSS for the Floor and Reflex gates: the
tokens, the gradients, the eyebrow, tracked caps, mono as costume, the
emoji icon, the missing focus ring, motion with no reduced-motion fallback,
content hidden until a script runs, the placeholder copy. `--render` opens
the page in Playwright for what only a browser can settle: the fold at
1280 x 800, horizontal scroll at six widths, focus rings found by tabbing,
the measure, images that load, the container at 1920, the page with
scripting off. It writes the screenshots the look needs to
`captures/slop/<page>/` (`fold-1280.png`, `hero-1440.png`, `full-1440.png`,
`full-390.png`), captured at rest with reduced motion and after a scroll
through, so the next section's trick is already applied.

Read the summary line: `Floor 0 FAIL · Reflex 1 (1 waived) · Finish 2
notes`. A Floor finding is fixed; a Reflex finding is fixed or waived in
the page with a reason (`gates.md` §2); a Finish note is read. Then walk
the judged gates the script cannot settle (`gates.md` §3, class J, and §5)
from the screenshots, and send the finish review (`reviews.md` §2) the same
screenshots. **The script settles the mechanical half. It does not say the
page looks designed; the review and the look do.**

On a redesign, `check-kept check` runs here too, against the record taken
before the work started (`redesign.md` §6): a link, a field, a handler or a
test hook that went missing fails the redesign.

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
import { chromium } from "playwright";   // the skill ships `playwright`, not `@playwright/test`

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

**Lazy images are the other blank.** `loading="lazy"` images below the fold
are not fetched by a full-page capture either, because the page never
scrolls. Scroll through the page once before capturing, then wait for the
images:

```js
const h = await page.evaluate(() => document.documentElement.scrollHeight);
for (let y = 0; y < h; y += 400) { await page.evaluate((y) => scrollTo(0, y), y); await page.waitForTimeout(50); }
await page.evaluate(() => scrollTo(0, 0));
await page.evaluate(() => Promise.all([...document.images].map((i) =>
  i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))));
```

For an app shell bounded to the viewport (`h-screen` + an inner
`overflow-y-auto`), `fullPage` adds nothing — the document is 900px and the
content scrolls inside a child. Capture the viewport, and scroll the inner
container if you need what is below.

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

When the page has a canvas, or the tier is Fast, run `check-motion` with the
recorded tier; read the result, and tell the author "passed" or the problem in
plain words. On a Fast page it also opens the page with JavaScript off and
fails when its headings, text or images are missing or hidden there.

For a presentation, `check-presentation --tier <tier>` runs the same canvas
checks, named `motion: ...`, once for each slide that has a canvas. It only
looks at a canvas inside a `section[data-section]`: a canvas outside a slide
gets no `motion:` check, and without a canvas the flag is not needed. A
canvas in a slide with no `--tier` stops the run with exit code 2.

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

---

## What to report

State what the look showed, including when it showed nothing useful.

- "Verified: 1,386 rows → 32 in the DOM, document height 53,677px → 900px."
- "Axis labels legible in both themes; console clean on every route."
- "check-slop: Floor 0 FAIL · Reflex 1 waived (eyebrow: the step labels are a real sequence) · finish review: fix, 3 findings, 3 resolved."
- "I could not verify this visually — the dev server would not start."

That last one is an acceptable sentence. **"Done" without having looked is
not.** If a claim was never checked, mark it unchecked rather than letting
a green suite imply otherwise.
