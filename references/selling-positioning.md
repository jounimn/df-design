# Selling-positioning

An optional detour. Once the identity is chosen, the skill offers a
**complete logo presentation and the identity's market positioning**, in
the manner of a Behance brand case. It is delivered as an HTML presentation,
16:9 slides, individual mockups, social posts and one PDF, and it includes a
view of the chosen site so the presentation shows the full work.

It is not a third value of `path`. It is recorded in the status line as
`selling=<now|end|skip>`.

| Section | Covers |
|---|---|
| §1 | When to offer, the prompt, the Playwright question |
| §2–§6 | Logo, market, Behance, mockups, site view |
| §7–§8 | The presentation and its export |
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
> screens), the brand's position in the market with researched competitors,
> and the chosen site shown as part of the work — as an HTML page, slides,
> social images and a PDF? **This can take a long time**: it means
> analysing more than 30 reference presentations, more than 30 brands in
> your market and more than 30 mockups. Do it now, leave it for the end, or
> skip?

Never drop the time warning. The author decides with it in front of them.

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

Record the choice in the status line: `selling=<now|end|skip>`.

---

## 2. Logo

| Situation | Do |
|---|---|
| **The author has a logo** | Use it unchanged. Never redraw it. |
| **No logo** | Design 2–3 SVG proposals from the chosen identity: its type, palette and grammar (the identity library entry). The author approves one, or redirects. |

If the author rejects every proposal, redirect with their notes and make
**one more round**. After that, ask whether to continue without the logo
system.

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

## 3. Market positioning

Full depth.

- **Broad base: at least 30 brands** in the niche, researched online. Each
  has a URL and an access date, and is classified by segment, price band and
  aesthetic.
- **Deep cut: 8–12 brands** from the base, analysed in full and placed on a
  **perceptual map**. Choose two axes for the niche (for example
  traditional ↔ experimental, everyday ↔ premium).
- From the research, write: target audience, positioning statement,
  differentiators, price band, brand archetype, and tone of voice with
  sample lines.

**Small niche.** When fewer than 30 direct competitors exist online,
complete the base with **adjacent** brands (same aesthetic or audience in
another city or category), labelled as adjacent. If 30 is still not
reached, record the real count and the reason under `## Shortfall` (§9).

Nothing is invented. What could not be found is marked **not verified**.

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

Log every case: URL, what it demonstrates, accepted or rejected and why
(§9).

**Behance is a single-page app.** A plain HTTP fetch sees an empty shell.
Collect through the browser (Playwright) or through web search over gallery
pages. If neither works, tell the author and ask whether to proceed with
another source of cases. Never invent references.

---

## 5. Mockups

Blank-surface photographs chosen **for the identity**: card, letterhead,
storefront, bag, packaging, apparel, signage, laptop, phone. A craft bakery
gets kraft paper and a street front, not a phone on marble.

- **Screen at least 30 candidates.**
- Check each against the four rules in `images.md`: free, commercial use, no
  credit line, no watermark in the file. Most "free mockup" sites require
  credit, so they fail. **Check the item, not the site.**
- Compose the logo in CSS over the photo:
  - `perspective` / `matrix3d` for the surface plane
  - `mix-blend-mode: multiply` on light surfaces, `screen` on dark ones, so
    texture and light come through
- An application with no passing photo is **dropped** from the presentation,
  and the reason is reported. A failing mockup is never used "just this
  once".

**Every mockup photo is a local file inside the presentation folder.** Not
a `data:` URI, not a hotlink (`http`/`https`), not a path that leaves the
folder (`../`). Download the original, store it in the folder, and
reference it by relative path. The checker fails any other source.

Record every photo that is used in `assets.md` (§9).

---

## 6. Site view

The presentation shows the chosen site as part of the work.

- Desktop (1440) and mobile (390) captures, taken at rest
  (`verification.md`), composed into laptop and phone mockups that pass the
  same rules as §5.
- A full-page excerpt.
- In the HTML version, a link to the site HTML and an embedded `iframe`.

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

Ten sections, in this order. Each is a `section` with the `data-section`
attribute shown.

| # | `data-section` | Holds |
|---|---|---|
| 1 | `opening` | Logo on the brand ground |
| 2 | `concept` | Concept and positioning statement |
| 3 | `market` | Perceptual map, deep-cut competitors, differentiators, price band |
| 4 | `audience` | Audience, archetype, tone of voice |
| 5 | `logo-construction` | Logo construction and grid |
| 6 | `logo-system` | Lockups, symbol, mono, reversed, clear space, minimum size, incorrect uses |
| 7 | `colour-type` | Colour and type |
| 8 | `mockups` | Mockups and applications |
| 9 | `site` | The site view (§6), the full work |
| 10 | `closing` | Closing |

Markup contract, which the exporter and the checker read:

| Attribute | On | Means |
|---|---|---|
| `data-section="<name>"` | The ten sections | One slide each, in the order above |
| `data-mockup="<name>"` | Each mockup element | Exported on its own, 3000px on the long side. The value is the file name: `data-mockup="card"` gives `mockups/card.png`. Names must be unique |
| `data-social="square"` | One element | Exported as the 1080×1080 post |
| `data-social="story"` | One element | Exported as the 1080×1920 post |
| `data-pending` | The `site` section | The site is not built yet. The checker fails it after the verification gate |

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
  research-log.md        # Behance cases + market brands + mockup candidates
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

The checker confirms the ten sections, the research counts, the licence
rows, the preview and final split, every export size and the PDF page
count, and that the page renders at 1440 and 390 with no errors and no
horizontal scroll. It cannot judge taste, and it cannot see a watermark
baked into a stock photo.

---

## 9. The logs

Both live in the presentation directory. The checker reads them.

### `research-log.md`

The headings are read exactly as written. Entries are **top-level** list
items: `- `, or numbered (`1.` / `1)`). A sub-bullet does not count, and
neither does anything inside a code block.

- **Behance cases, Market brands and Mockup candidates** count **unique
  URLs**. A repeated entry, or one with no URL, does not count. The same
  page with `http` and `https`, with or without `www.`, or with tracking
  parameters (`utm_*`, `fbclid`…) counts once.
- **Perceptual map** counts list items. A URL is recommended, not required.
- HTML comments are ignored, so the template's instructions never count as
  content. Keep them as comments.
- **A base under 30 needs its own line under `## Shortfall`**, one per short
  base, in exactly this form:

  ```
  - Behance cases: 18 — only 18 relevant cases exist for this niche online
  ```

  The name is `Behance cases`, `Market brands` or `Mockup candidates`. The
  number is the real count the checker reads from the log. The reason is in
  words (three or more). A Shortfall does not excuse a base it does not name,
  and a comment, "TBD" or a bare `-` does not count. Copying the template
  adds none.

```markdown
# Research log

## Behance cases
<!-- One line per case: URL, what it demonstrates, accepted or rejected and why. 30 or more. -->
- https://www.behance.net/gallery/111111/example-one — what it demonstrates; accepted: the pacing of its construction slides
- https://www.behance.net/gallery/222222/example-two — what it demonstrates; rejected: stock-template composition

## Market brands
<!-- One line per brand: URL, name, segment, price band, aesthetic, access date. Mark adjacent brands. 30 or more. -->
- https://example.com — Brand name; segment, price band, aesthetic; accessed 2026-10-10
- https://example.org — Brand name (adjacent: other city); segment, price band, aesthetic; accessed 2026-10-10

## Mockup candidates
<!-- One line per screened photo: URL, what it shows, passed or failed which rule. 30 or more. -->
- https://stocksnap.io/photo/example-one — kraft bag; passed all four rules
- https://example.net/free-mockup/two — shopfront; failed rule 3: credit required

## Perceptual map
<!-- The 8-12 deep-cut brands, one line each, with the two axes. -->
- https://example.com — Brand name: x = traditional, y = premium
- https://example.org — Brand name: x = experimental, y = everyday

## Shortfall
<!-- Delete this section unless a base is under 30. Then one line per short base, the real count and the reason, in this form:
- Behance cases: 18 — only 18 relevant cases exist for this niche online
-->
```

| Rule | Value |
|---|---|
| Behance cases | 30 or more unique URLs |
| Market brands | 30 or more unique URLs |
| Mockup candidates | 30 or more unique URLs |
| Perceptual map | 8–12 list items |
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
- **source URL** is the item page, and it must answer.
- **licence** is never empty, and must need no credit (as shown on the page).
  A CC BY row, or an empty cell, fails the check.

`images.md` §5 keeps a longer record for the site's own images. This table is
the presentation's.

---

## 10. Look

The verification gate applies. Before calling the path done, **look** at the
exported slides, mockups and social posts, and report what the look showed.

Check what the code cannot prove:

- the logo sits on the surface in each mockup, with the texture showing through
- no watermark is baked into a photo
- in `preview/`, the mark is visible and the content is readable; in `final/`, there is no mark
- no slide is cut off or overcrowded

If Playwright was not allowed, the author does the looking. Say exactly what
to open.

---

## Red flags

| Thought | Reality |
|---|---|
| "Behance has a perfect mockup, I'll use it" | Behance work is copyrighted. It informs structure only. Never take assets. |
| "I found 18 brands, I'll round up with plausible ones" | Nothing is invented. Add adjacent brands, then record the real count under `## Shortfall`. |
| "This free-mockup site is free, so the item is" | Most require credit. Check the item against the four rules. |
| "The audition page is good enough for the site section" | Refresh it with the built, verified site after the gate. |
| "The presentation can use a neutral case template" | It is written in the identity's grammar: its type, palette and composition. |
| "The author is waiting; skip the time warning" | The warning is part of the prompt. The author decides with it. |
| "They have a logo, but I can improve it" | Use it unchanged. Never redraw it. |
| "No mockup passes, but this one is close" | Drop the application and report why. A failing mockup is never used just this once. |
| "I'll embed the mockup photo as a data URI / hotlink it" | Mockup photos are local files in the presentation folder, recorded in `assets.md` with their licence. The checker fails anything else. |
| "I only found 18 cases, one Shortfall line covers everything" | One line per short base, with the real count. A Shortfall excuses only the bases it names. |
| "The checker passed, so it is done" | It cannot judge taste or see a watermark in a photo. Look at the captures. |
