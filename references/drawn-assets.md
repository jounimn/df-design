# Drawn assets

Some identities have a hand: an instruction manual draws its steps, a
bakery bulletin is marked up with a pen, a comic is inked. For those, the
icons, the doodles in the margin and the small illustrations are drawn for
the project, in the identity's own line, the same way the logo is
(`selling-positioning.md` §2). This file covers when to draw, how to derive
the line from the brief, and how to check a set before it reaches a page.

Library icon sets and stock illustration are in `icons-and-assets.md` and
`images.md`. A drawing never replaces a photograph or the product
(`reviews.md` §2, "a drawn illustration where a photograph or the product
should be").

---

## 0. When to draw

Draw when the brief says the identity has a hand, and write it in the brief
as a `Drawn:` line (`identity.md` §8):

- the **Grammar** names a drawn surface or imagery: line art, marker, ink,
  etching, risograph, a manual's callouts, a comic's panels
- **no icon set fits** a strongly historical or crafted identity
  (`icons-and-assets.md` §0), so the dozen glyphs the product needs are
  drawn as the set
- the **subject** is drawn by nature: a comic, a children's book, a map, a
  patent, a recipe card

Do not draw because a page feels empty. An empty screen needs a
photograph, the product or better type (`gates.md` §5, "A full page").

---

## 1. What a drawing does on a page

Every drawing has a job you can name. These are the jobs:

| Job | Example | Rule |
|---|---|---|
| **Annotate** real content | circle the date, an arrow to the price, a tick beside a done step | Annotate body and data, never a single word in a head (`accented-word`) |
| **Divide** | a drawn rule or a margin mark between bands | One divider shape for the whole site |
| **Explain** | a manual's step diagram, an exploded view, a route | The drawing carries information the text does not |
| **Stand in** for an empty, error or loading state | the 404, an empty cart, a search with no results | Never in a state that has real content to show |
| **Label** | the drawn icon set | Every rule of `icons-and-assets.md` §0, §3–§4 still applies: one set, cap-height size, beside a word |
| **Mark** | a stamp, a sticker, a seal on a changed fact | Spend it where a fact changes, like the hint |

A drawing with no job is decoration. Decoration in the hero, one doodle per
feature item, and a doodle beside every heading are the drawn version of
the template tells (`icons-and-assets.md`, "The restraint finding").

---

## 2. The line comes from the brief

Decide the line before drawing anything, and write it in the `Drawn:` line.

**Stroke** follows the type, as icons do (`icons-and-assets.md` §4): the
weight of the text the drawing sits beside, at the size it is drawn.
**Colour** is `currentColor` or a `var(--token)`: ink on the ground, the
base pair. The design hint goes on a drawing only when the drawing is the
subject or the mark, and it counts toward the hint's places
(`recipes-design.md` §2).

**Character** follows the identity's surface:

| Surface in the brief | Construction | roughen |
|---|---|---|
| Technical pen, manual, patent, blueprint | butt or square caps, mitre joins, one width, hatching at one angle for shade | none, or `--amount 0.2` |
| Marker, felt-tip, a pen on a printed sheet | round caps and joins, one width | `--amount 0.8` to `1.2`, `--step 3` |
| Pencil, sketchbook | round caps, a thinner width, two passes of the same stroke with different seeds | `--amount 1` to `1.5` |
| Etching, engraving, woodcut | outlines plus parallel hatch lines for tone, no gradients | `--amount 0.3` |
| Comic ink, webtoon | a heavy contour (about twice the inner line), thin inner lines, solid blacks as filled shapes | `--amount 0.4` on the contour only |
| Risograph, screen print | flat filled shapes in the spot colours, the second colour offset 1 to 2px | none; the offset is the hand |
| Brush | filled shapes, not strokes: draw the outline of the brush mark | `--amount 0.6` on the outline |

One character per site. A marker doodle next to an etched illustration is
two hands, which reads the way two icon sets do.

---

## 3. Construction

1. **One grid.** Icons and doodles share one `viewBox` (`0 0 48 48` is a
   good default; a drawn icon set may follow the library set's grid). Spot
   illustrations share another (for example `0 0 320 240`).
2. **One width, one cap, one join** across the set, set on the root `<svg>`
   so every path inherits them.
3. **Clean geometry first.** Draw the shapes as plain paths, lines,
   circles and polygons. Then give them the hand, if the character has one:

   ```bash
   node scripts/draw.mjs roughen drawn/clean/cup.svg --seed 12 --amount 0.9 --out drawn/cup.svg
   ```

   Every path and shape is sampled along its length, moved along its
   normal by seeded noise, and written back as one smooth path. The same
   seed gives the same drawing. Use one seed per set and record it.
4. **No live text, no raster, no script** inside a drawing. Words belong in
   the page, where they are read, translated and found. Outline lettering
   that is part of the drawing.
5. **Light.** A doodle is under 16 KB. Past that, raise `--step` or simplify
   the clean geometry.

---

## 4. Check the set, then look at it

```bash
node scripts/draw.mjs check drawn/ --stroke 2 --palette "#FFC21A"
node scripts/draw.mjs sheet drawn/ --ground "#ECEFEA" --ink "#161F1D" --out drawn/sheet.png
```

`check` fails a raster, live text, a script, a colour that is not
`currentColor`, a token or the palette, a width other than the set's, and a
missing `viewBox`. Mixed `viewBox`es, widths and caps are warnings. `sheet`
draws every file on the brief's ground and ink, inverted, and three times at
24px.

Open the sheet and answer, in writing, before any drawing goes on a page:

- Is it **one hand**? Same width, same wobble, same corners across the set.
- Does it **read at 24px**? A drawn icon that blurs into a blot at icon size
  is an illustration, not an icon.
- Does it work **inverted**? It will sit on the dark band or the dark theme.
- Does every drawing have **its job** from §1?

---

## 5. Shipping them

- Inline the SVG. A drawing beside a label is `aria-hidden="true"`; a
  drawing that carries meaning alone gets `role="img"` and an `aria-label`.
- Motion, when the identity moves: a drawing may draw itself on once, as it
  enters (`stroke-dasharray` and `stroke-dashoffset` with `pathLength="1"`).
  Under reduced motion it is already drawn. Never loop it.
- Record every drawing in the asset record (`images.md` §5): the file,
  "drawn for this project" as its source, no licence needed, the seed,
  amount and step it was roughened with, and the pages it is on.
- In a selling-positioning presentation, the drawn set sits beside the logo
  system and shares its line (`selling-positioning.md` §2).

---

## Red flags

| Thought | Reality |
|---|---|
| "The page looks empty, a doodle will help" | An empty screen needs a photograph, the product or better type. Every drawing has a job (§1). |
| "A cute doodle per feature" | One drawing per item is the drawn feature grid. Annotate real content instead. |
| "I'll draw the product" | Show the product. A drawing where the product should be is a finish-review finding. |
| "Some marker doodles and an etched hero" | One character per site (§2). Two hands read as two icon sets. |
| "I'll wobble each one by eye" | `draw.mjs roughen` with one seed for the set: the same hand everywhere, and it can be redrawn. |
| "The label is part of the drawing" | Live text inside an SVG is not read, translated or found. Set it in the page. |
| "It looks right at 200px" | Run `sheet`: it has to read at 24px and inverted too. |
| "The doodles can be in the hint colour" | The hint goes on a drawing only when it is the subject or the mark, and it counts toward the hint's places. |
