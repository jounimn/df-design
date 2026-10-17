# Selling-positioning

An optional detour. Once the identity is chosen, the skill offers a
**complete logo presentation and the identity's positioning**, in the manner
of a Behance brand case. It is delivered as an HTML slideshow, 16:9 slides,
individual mockups, social posts and one PDF, and it includes a view of the
chosen site so the presentation shows the full work.

It is not a third value of `path`. It is recorded in the status line as
`selling=<now|end|skip> tier=<fast|medium|high>`.

| Section | Covers |
|---|---|
| §1 | When to offer, the prompt, the motion tier, the Playwright question |
| §2–§6 | Logo, positioning, Behance, mockups, site view |
| §7–§8 | The presentation (a slideshow) and its export |
| §9 | The two logs the checker reads |
| §10 | Looking at it |

---

## 1. When to offer

| Path | The offer follows |
|---|---|
| `audition` | Author selection |
| `design` | The author's approval of the identity brief |

The prompt, in the author's words:

> Before I build: would you like a complete brand presentation as well —
> the logo and its variations, real mockups (card, storefront, packaging,
> screens), how the brand positions itself, and the chosen site shown as
> part of the work — as a slideshow, slides, social images and a PDF?
> **This can take a long time**: it means studying more than 30 reference
> presentations and screening more than 30 mockups. Do it now, leave it for
> the end, or skip?

Never drop the time warning. The author decides with it in front of them.

**Ask the motion tier in the same message.** The presentation moves
(transitions between slides, image reveals), and how much is the author's
choice, as for the site. Use the tier message of `audition.md` §4, filled for
this presentation. Default to the tier already chosen for the site, and
recommend the cheapest tier that serves the identity: a big-tech product may
warrant heavy motion, a bakery usually does not.

| Tier | Presentation motion |
|---|---|
| `fast` | CSS only: slide and fade transitions, `clip-path` reveals for images (`[data-reveal]`). Built into the runtime (§7) |
| `medium` | A small library (GSAP core or Motion One) for choreographed image and mockup reveals, hooked on the runtime's `df:slidechange` event |
| `high` | Techniques from [`techniques/high.md`](techniques/high.md), run by `canvas-loop.js` inside the slide in focus. Every export shows the poster frame, and the lighter version appears without WebGL or under reduced motion |

`prefers-reduced-motion` turns all of it off, at every tier. If the author
answers **skip**, no tier is asked or recorded.

| Answer | Then |
|---|---|
| **Now, `audition` path** | Run §2–§8 before the Assets stage. Refresh the site section after the verification gate (§6) |
| **Now, `design` path** | Assets, the loading tier and the identity brief are already done. Run §2–§8 before Implementation. Refresh the site section after the verification gate (§6) |
| **At the end** | Continue to Assets (or Implementation) and the build. Run §2–§8 after the verification gate |
| **Skip** | Continue. Do not offer it again |

**If Playwright was declined earlier**, add to the prompt:

> The images and PDF need the browser tool. Shall I deliver the HTML only
> (you can export it from the browser with Print → PDF), or will you allow
> the browser tool for the export alone?

Record the answer as a condition. If the author accepts HTML only, deliver
`presentation.html` (with the watermark layer in `preview/` when
watermarked) and tell them how to export by hand.

Record the choice in the status line:
`selling=<now|end|skip> tier=<fast|medium|high>`.

---

## 2. Logo

| Situation | Do |
|---|---|
| **The author has a logo** | Use it unchanged. Never redraw it. |
| **No logo** | Design 2–3 SVG proposals from the chosen identity: its type, palette and grammar (the identity library entry). Show them side by side. The author chooses, combines or redirects. |

When you present the proposals, tell the author that **combining is an
option**. The author may:

| Answer | Then |
|---|---|
| **Choose** one proposal | Build the system from it |
| **Combine** parts of different proposals (the wordmark of one, the symbol of another) | Build the system from the chosen parts, and show the combined lockup for confirmation before going on. Keep each part's drawing as it was |
| **Redirect** with notes | Revise and show again (one more round, below) |

If the author rejects every proposal, redirect with their notes and make
**one more round**. After that, ask whether to continue without the logo
system.

**Draw the logo in the identity's own line.** When the identity is built from
single-weight strokes (ruled lettering, typed rules), draw the logo as
**monoline strokes**: one stroke width, round caps and joins. It then sits
with the page and survives small sizes. Leave room inside the `viewBox` for
the stroke caps, or the ends are clipped.

The step 0 scope holds here. A new logo does not enter the shared header,
or any surface outside the scope, unless the author agrees.

From the approved mark, build the system:

- primary lockup
- horizontal and stacked lockups
- symbol alone
- monochrome and reversed versions
- clear space and minimum size
- incorrect uses

---

## 3. Positioning

**No market research.** Positioning is written from the chosen identity and
the author's intent. Do not research competitors, build a brand base or draw
a perceptual map.

Write:

- the positioning statement and the concept line
- the target audience
- the brand archetype
- the tone of voice, with sample lines

A price band appears **only if the author gives one**. Nothing is presented
as researched fact: audience and tone are the agent's reading of the
identity, and the slide says them as a proposal, not as data. The author
approves them.

---

## 4. Behance as creative source

Study **at least 30** logo-presentation cases from the same niche or
aesthetic.

Extract:

- the **sequence**: opening, concept, construction, grid, colour, type,
  mockups, applications, closing
- composition rhythms and framing
- pacing between dense and quiet slides

**Never take assets.** Behance work is copyrighted. It informs structure
and composition only. This is the rule of `identity.md` §1: a reference is
not an identity.

**A case counts only if its images were actually viewed.** Reading the title
or the search snippet is not viewing. A viewed case has at least two or three
captures read, and its log line says what they showed.

**Behance is a single-page app, and it answers 403 to automated access.** A
plain HTTP fetch sees an empty shell, and scripted browsers are often
refused. Expect this. Do not count Behance cases you only judged from search
text. Then:

1. Collect through the browser (Playwright) or through web search over
   gallery pages.
2. List the Behance cases judged from text only under `## Not viewed` (§9).
   They do not count.
3. Complete the base from **open identity-case sources** that show the
   images: BP&O, Fonts In Use, Identity Designed, It's Nice That, studio
   sites. Paywalled sources (for example Brand New) do not count.
4. If you still cannot reach 30, record the real count under `## Shortfall`
   (§9), and tell the author.

Never invent references.

Log every viewed case: URL, what it demonstrates, accepted or rejected and
why (§9).

---

## 5. Mockups

Blank-surface photographs chosen **for the identity**: card, letterhead,
storefront, bag, packaging, apparel, signage, laptop, phone. A craft bakery
gets kraft paper and a street front, not a phone on marble.

- **Screen at least 30 candidates.**
- Check each against the four rules in `images.md`: free, commercial use, no
  credit line, no watermark in the file. Most "free mockup" sites require
  credit, so they fail. **Check the item, not the site.**
- A photo with third-party text or logos on the surface you need fails the
  look, even when its licence passes. Log it as unsuitable.
- Compose the logo in CSS over the photo:
  - the surface plane is a **homography**: write the logo on a flat plane,
    then map its four corners onto the four corners of the surface with a
    CSS `matrix3d` (solve the eight unknowns of the projective transform)
  - give the plane a fixed size of **1000 px** wide and scale it to the
    figure with `scale: calc(100cqw / 1000px)`, the figure being a size
    container (`container-type: inline-size`). The plane's coordinates then
    do not depend on the figure's size
  - `mix-blend-mode: multiply` on light surfaces, `screen` on dark ones, so
    texture and light come through
  - **Contrast.** Check the mark at thumbnail size. A dark mark on pale cloth
    needs full opacity and a large enough plane. If it still disappears,
    change the blend mode or the colour, never the photo
- **Browser requirement.** Dividing two lengths in `calc()` (typed
  arithmetic) needs **Chrome 140 or later**, which is what the export and the
  checker run. For an older browser, fix the figure at a set pixel width and
  write the plane at that same width (scale 1), or set the scale from a
  script.
- The export crops each mockup to its **computed size**.
- **Device frames.** A laptop or phone drawn in CSS around a capture is
  allowed. It is not a photograph, so it needs no row in `assets.md`.
- An application with no passing photo is **dropped** from the presentation,
  and the reason is reported. A failing mockup is never used "just this
  once".

**Every mockup photo is a local file inside the presentation folder.** Not
a `data:` URI, not a hotlink (`http`/`https`), not a path that leaves the
folder (`../`). Download the original, store it in the folder, and
reference it by relative path. The checker fails any other source.

Some stock sites (Pexels, for one) answer **403 to a scripted fetch** of an
item page, though the page opens in a browser. The checker accepts 401, 403
and 429 as "the page answers". Say so beside the table in `assets.md`, and
note it in `research-log.md` (§9), so the reader knows the licence was read
in the browser.

Record every photo that is used in `assets.md` (§9).

---

## 6. Site view

The presentation shows the chosen site as part of the work.

- Desktop (1440) and mobile (390) captures, taken at rest
  (`verification.md`), composed into laptop and phone frames (§5).
- A full-page excerpt.
- In the slideshow, an embedded `iframe` of the site, and a link to the site
  HTML. In the export the `iframe` is **not** shown. Put a static `<img>`
  of the capture in its place, and show the `iframe` only under
  `.df-slideshow` (hide it otherwise).
- **Captures wait.** Before each capture, scroll the whole page so lazy
  images load, then wait until every image has decoded. Count the images
  that did not load: it must be zero. A capture taken early shows blank
  photos.

Which site is shown:

| When the path ran | The site section shows |
|---|---|
| Now, `audition` path | The chosen audition page. Refreshed with the built, verified site after the verification gate |
| Now, `design` path | Marked pending (`data-pending`). Filled with the built, verified site after the verification gate |
| At the end | The built, verified site |

The step 0 scope holds here: the site section shows only the surfaces in
scope, and says nothing about the others.

A refresh re-runs the export.

---

## 7. The presentation

One file, `presentation.html`, written in the **chosen identity's
grammar**: its type, palette and composition. Not a generic case template.

**It is a slideshow, not a scrolling page.** One 16:9 slide is in focus at a
time, scaled to fit the viewport. The runtime is a shared skill asset:
`templates/slideshow.js` and `templates/slideshow.css`. It is structural
only; the identity styles the slides.

Copy both files next to `presentation.html`, and link them:

```html
<link rel="stylesheet" href="slideshow.css">
…
<script src="slideshow.js"></script>
```

The exported `final/` and `preview/` pages reach them by the rewritten
`../` path, so the files are not duplicated.

The runtime gives:

- ←/→, PageUp/PageDown, Home/End
- previous and next buttons on screen, with a focus outline
- touch swipe
- a counter ("03 / 09")
- the URL hash (`#slide-3`), so a slide can be linked, and back and forward
  work
- `[data-social]` never becomes a slide
- **Portrait phones.** The slide stays one 16:9 slide. A discreet "rotate
  your phone for full screen" hint shows in portrait, and the previous and
  next buttons and the counter sit in a bar **outside** the slide, never over
  it. In landscape the slide fills the screen

**Motion.** The runtime carries the fast tier: slide and fade transitions,
and `clip-path` reveals on every `[data-reveal]` element of the slide that
enters. It fires `df:slidechange` on `document`, with
`detail: { from, to, slide }`. Indices are 1-based, like the hash and the
counter, and `from` is `null` for the first slide. The `medium` and `high`
tiers plug their library or shader into that event. Reduced motion: no
transition, no reveal; images are visible at once.

**The export contract.** `window.__DF_EXPORT__ === true`, set before the
page's scripts run, turns the runtime off: every section lies in the page
flow at rest, `[data-reveal]` is already revealed, no controls. The exporter
and the checker set it for every capture. Do not read it for anything else.

**Scope the mobile CSS.** Rules for narrow screens (stacking, smaller type)
serve the exported page and a plain browser. Write them under
`html:not(.df-slideshow)`, so they never shrink a slide in the slideshow.

**Backstage stays out.** The slides are the client's. Notes such as what was
left out, where the photos came from, or "see `assets.md`" go to the report
and to the logs (§9), never onto a slide.

Nine sections, in this order. Each is a `section` with the `data-section`
attribute shown.

| # | `data-section` | Holds |
|---|---|---|
| 1 | `opening` | Logo on the brand ground |
| 2 | `concept` | Concept and positioning statement |
| 3 | `audience` | Audience, archetype, tone of voice |
| 4 | `logo-construction` | Logo construction and grid |
| 5 | `logo-system` | Lockups, symbol, mono, reversed, clear space, minimum size, incorrect uses |
| 6 | `colour-type` | Colour and type |
| 7 | `mockups` | Mockups and applications |
| 8 | `site` | The site view (§6), the full work |
| 9 | `closing` | Closing |

Mockups should read as a balanced grid: complete rows, and items of similar
visual weight in each row.

Markup contract, which the exporter and the checker read:

| Attribute | On | Means |
|---|---|---|
| `data-section="<name>"` | The nine sections | One slide each, in the order above |
| `data-mockup="<name>"` | Each mockup element | Exported on its own, 3000px on the long side. The value is the file name: `data-mockup="card"` gives `mockups/card.png`. Names must be unique |
| `data-social="square"` | One element | Exported as the 1080×1080 post |
| `data-social="story"` | One element | Exported as the 1080×1920 post |
| `data-pending` | The `site` section | The site is not built yet. The checker fails it after the verification gate |
| `data-reveal` | Any image or mockup | Revealed by `clip-path` when its slide enters (fast tier). At rest in the export |

Each section must fit **1920×1080**. A taller section would be cropped in
its slide, so the checker fails it as "slide overflow". Split the content
instead.

Elements with `data-social` may sit inside a section. The slide PNG and the
PDF hide them, and they are exported only as `social/square.png` and
`social/story.png`. They do not count toward the section's 1920×1080.

Relative assets resolve from the presentation directory. Paths may contain
spaces and accents.

---

## 8. Export

| Format | Size |
|---|---|
| Slides, one per section | 1920×1080 PNG |
| Individual mockups | PNG, 3000px on the long side |
| Social posts | 1080×1080 and 1080×1920 PNG |
| PDF | One file, one page per slide |

Output tree:

```
selling-positioning/
  presentation.html
  slideshow.js slideshow.css   # copied from templates/
  research-log.md        # Behance cases + mockup candidates
  assets.md              # every mockup photo: source URL, licence, checked
  preview/               # watermarked (only when watermark != none)
    slides/ mockups/ social/ presentation.pdf presentation.html
  final/                 # clean
    slides/ mockups/ social/ presentation.pdf presentation.html
```

With `watermark=none`, only `final/` is produced. The watermark spec and the
preview/final split are in `watermark.md`.

Run, in this order:

```bash
node scripts/export-presentation.mjs <presentation-dir> <watermark-spec|none>
node scripts/check-presentation.mjs <presentation-dir> --watermark <watermark-spec|none>
```

After the verification gate, when the site section is filled or refreshed,
run both again, with the late check:

```bash
node scripts/export-presentation.mjs <presentation-dir> <watermark-spec|none>
node scripts/check-presentation.mjs <presentation-dir> --after-gate --watermark <watermark-spec|none>
```

Optional flags of `check-presentation.mjs`:

| Flag | Does |
|---|---|
| `--offline` | Skips the source-URL fetch when there is no network |
| `--after-gate` | Also fails a site section still marked `data-pending` |
| `--watermark <spec\|none>` | Says what the export was run with. `none` fails a leftover `preview/`; a spec fails a missing or stale one. Pass the same value given to the export |
| `--tier <fast\|medium\|high\|custom>` | The tier the author chose. Required when a slide has a canvas, which then also gets the `motion:` canvas checks (`verification.md`) |

When the presentation has a canvas, `check-presentation` also runs the same motion checks as a page (`verification.md`) against the `tier=` recorded for it, and each is prefixed `motion:`. Without a canvas it adds nothing.

The checker confirms the nine sections, the research counts, the licence
rows, the preview and final split, every export size and the PDF page
count, that the page renders at 1440 and 390 with no errors and no
horizontal scroll, and that the slideshow works (one slide in focus, arrows,
hash, button). It cannot judge taste, and it cannot see a watermark baked
into a stock photo.

---

## 9. The logs

Both live in the presentation directory. The checker reads them.

### `research-log.md`

The headings are read exactly as written. Entries are **top-level** list
items: `- `, or numbered (`1.` / `1)`). A sub-bullet does not count, and
neither does anything inside a code block.

- **Behance cases and Mockup candidates** count **unique URLs**. A repeated
  entry, or one with no URL, does not count. The same page with `http` and
  `https`, with or without `www.`, or with tracking parameters (`utm_*`,
  `fbclid`…) counts once.
- **A Behance case counts only if its images were viewed** (§4). The line
  says what the captures showed.
- **`## Not viewed`** holds cases judged from search text only. The checker
  ignores it, so it never counts toward the 30.
- HTML comments are ignored, so the template's instructions never count as
  content. Keep them as comments.
- **A base under 30 needs its own line under `## Shortfall`**, one per short
  base, in exactly this form:

  ```
  - Behance cases: 18 — only 18 relevant cases exist for this niche online
  ```

  The name is `Behance cases` or `Mockup candidates`. The number is the real
  count the checker reads from the log. The reason is in words (three or
  more). A Shortfall does not excuse a base it does not name, and a comment,
  "TBD" or a bare `-` does not count. Copying the template adds none.
- Put the reason for any 403 (Behance, a stock site) in a comment or a
  plain line outside the lists. It is a note for the reader, not an entry.

```markdown
# Research log

## Behance cases
<!-- One line per case actually viewed: URL, what the captures showed, accepted or rejected and why. 30 or more. Behance itself answers 403 to automated access: complete from open sources (BP&O, Fonts In Use, Identity Designed, It's Nice That, studio sites). -->
- https://www.behance.net/gallery/111111/example-one — viewed 3 captures: the construction slides alternate dense and quiet; accepted: that pacing
- https://bpando.org/example-two/ — viewed 2 captures: stock-template composition; rejected: generic

## Not viewed
<!-- Cases judged from search text only. They do not count. -->
- https://www.behance.net/gallery/333333/example-three — Behance answered 403; not counted

## Mockup candidates
<!-- One line per screened photo: URL, what it shows, passed or failed which rule. 30 or more. -->
- https://stocksnap.io/photo/example-one — kraft bag; passed all four rules
- https://example.net/free-mockup/two — shopfront; failed rule 3: credit required

## Shortfall
<!-- Delete this section unless a base is under 30. Then one line per short base, the real count and the reason, in this form:
- Behance cases: 18 — only 18 relevant cases exist for this niche online
-->
```

| Rule | Value |
|---|---|
| Behance cases (viewed) | 30 or more unique URLs |
| Mockup candidates | 30 or more unique URLs |
| `## Not viewed` | Ignored |
| A base under 30 | Accepted only with its own line under `## Shortfall` |

### `assets.md`

A table, one row per mockup photo used, with these columns in this order:

```markdown
| file | source URL | licence |
|---|---|---|
| assets/mockup-card.jpg | https://stocksnap.io/photo/... | CC0 |
```

- **file** is the photo's path relative to the presentation folder, written
  exactly as the page uses it. The checker matches the whole path, not a
  part of it.
- **source URL** is the item page, and it must answer. A 401, 403 or 429
  counts as answering (§5).
- **licence** is never empty, and must need no credit (as shown on the page).
  A CC BY row, or an empty cell, fails the check.

Under the table, write the note about scripted 403s (§5) when it applies,
for example: "Pexels answers 403 to scripted requests. The item pages were
opened in the browser and the licence read there."

`images.md` §5 keeps a longer record for the site's own images. This table is
the presentation's.

---

## 10. Look

The verification gate applies. Before calling the path done, **look** at the
exported slides, mockups and social posts, and report what the look showed.
Open every PNG in `final/`, not a sample.

Check what the code cannot prove:

- the logo sits on the surface in each mockup, with the texture showing
  through, and is legible at thumbnail size
- numbers and times read as numbers in the display face (`18h00`, not
  `I8HOO`); set them in the text face if the display face confuses `0`,
  `O`, `1` and `I`
- no watermark is baked into a photo
- in `preview/`, the mark is visible and the content is readable; in `final/`, there is no mark
- no slide is cut off or overcrowded, and no backstage note is on a slide
- in the slideshow itself: arrows, buttons and swipe work, the hash follows,
  and a portrait phone shows the hint and the control bar outside the slide

If Playwright was not allowed, the author does the looking. Say exactly what
to open.

---

## Red flags

| Thought | Reality |
|---|---|
| "Behance has a perfect mockup, I'll use it" | Behance work is copyrighted. It informs structure only. Never take assets. |
| "Behance blocked me, so the search results count as cases" | A case counts only if its images were viewed. List the rest under `## Not viewed` and complete from open sources. |
| "I found 18 cases, I'll round up with plausible ones" | Nothing is invented. Record the real count under `## Shortfall`. |
| "Positioning needs a competitor map" | There is no market research. Positioning comes from the identity and the author's intent. A price appears only if the author gave it. |
| "This free-mockup site is free, so the item is" | Most require credit. Check the item against the four rules. |
| "The audition page is good enough for the site section" | Refresh it with the built, verified site after the gate. |
| "The presentation can use a neutral case template" | It is written in the identity's grammar: its type, palette and composition. |
| "The author is waiting; skip the time warning" | The warning is part of the prompt. The author decides with it. |
| "I'll pick the motion tier myself" | The tier is the author's choice. Recommend, ask, record `tier=`. |
| "They have a logo, but I can improve it" | Use it unchanged. Never redraw it. |
| "The author must pick exactly one proposal" | They may combine parts (this wordmark, that symbol). Say so when you present, then show the combined lockup to confirm. |
| "No mockup passes, but this one is close" | Drop the application and report why. A failing mockup is never used just this once. |
| "I'll embed the mockup photo as a data URI / hotlink it" | Mockup photos are local files in the presentation folder, recorded in `assets.md` with their licence. The checker fails anything else. |
| "I only found 18 cases, one Shortfall line covers everything" | One line per short base, with the real count. A Shortfall excuses only the bases it names. |
| "A note on the slide will explain what we left out" | The slides are the client's. Backstage notes go to the report and the logs. |
| "The mobile CSS is plain, no need to scope it" | Scope it to `html:not(.df-slideshow)`, or it shrinks the slides in the slideshow. |
| "The checker passed, so it is done" | It cannot judge taste or see a watermark in a photo. Look at every capture. |
