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
| **Now** | Run §2–§8 before the Assets stage. Refresh the site section after the verification gate (§6) |
| **At the end** | Continue to Assets and the build. Run §2–§8 after the verification gate |
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
| `data-mockup` | Each mockup element | Exported on its own, 3000px on the long side |
| `data-social="square"` | One element | Exported as the 1080×1080 post |
| `data-social="story"` | One element | Exported as the 1080×1920 post |
| `data-pending` | The `site` section | The site is not built yet. The checker fails it after the verification gate |

Each section must fit **1920×1080**. A taller section would be cropped in
its slide, so the checker fails it as "slide overflow". Split the content
instead.

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
  research-log.md        # Behance cases + market brands
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
node scripts/check-presentation.mjs <presentation-dir>
```

After the verification gate, when the site section is filled or refreshed,
run both again, with the late check:

```bash
node scripts/export-presentation.mjs <presentation-dir> <watermark-spec|none>
node scripts/check-presentation.mjs <presentation-dir> --after-gate
```

`--offline` skips the source-URL fetch when there is no network.

The checker confirms the ten sections, the research counts, the licence
rows, the preview and final split, every export size and the PDF page
count, and that the page renders at 1440 and 390 with no errors and no
horizontal scroll. It cannot judge taste, and it cannot see a watermark
baked into a stock photo.

---

## 9. The logs

Both live in the presentation directory. The checker reads them.

### `research-log.md`

The headings are read exactly as written. Entries are list items starting
with `- ` and carry a URL. The checker counts **unique URLs**: a repeated
entry, or one with no URL, does not count.

```markdown
# Research log

## Behance cases
- https://www.behance.net/gallery/… — what it demonstrates; accepted: the pacing of its construction slides
- https://www.behance.net/gallery/… — what it demonstrates; rejected: stock-template composition

## Market brands
- https://example.com — Brand name; segment, price band, aesthetic; accessed 2026-10-10
- https://example.org — Brand name (adjacent: other city); segment, price band, aesthetic; accessed 2026-10-10

## Perceptual map
- https://example.com — Brand name: x = traditional, y = premium
- https://example.org — Brand name: x = experimental, y = everyday

## Shortfall
Only when a base is under 30: the real count and the reason. Leave the
section out otherwise.
```

| Rule | Value |
|---|---|
| Behance cases | 30 or more |
| Market brands | 30 or more |
| Perceptual map | 8–12 brands |
| A base under 30 | Accepted only under a non-empty `## Shortfall` |

### `assets.md`

One row per mockup photo used, as in `images.md` §5:

```markdown
| File | Source page | Licence (as shown on the page) | Downloaded | Treatment | Pages |
|---|---|---|---|---|---|
| mockup-card.jpg | https://stocksnap.io/photo/... | CC0 | 2026-10-10 | none | mockups |
```

The licence must need no credit. A CC BY row fails the check.

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
| "The checker passed, so it is done" | It cannot judge taste or see a watermark in a photo. Look at the captures. |
