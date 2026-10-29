# Redesign and audit: an existing design as the material

Read when the target already exists: a site, a route on a dev server, a
folder of pages, a component tree. The `design` path still runs
(`SKILL.md`): intent, identity, research, brief, one surface at a time. This
file adds three things: a **depth** the author chooses, a **record** of what
the page says and does so the redesign cannot lose it, and an **audit** verb
that reports and changes nothing.

Adapted from Hallmark's `redesign.md` (github.com/nutlope/hallmark, MIT).

---

## 1. The depth, asked in the first message

When the target exists, the opening questions (`SKILL.md`, "MANDATORY: open
with two answers") gain one more, read from the invocation note when it
already answers it:

| Depth | Stays | Changes | The note says |
|---|---|---|---|
| **audit** | everything | nothing: a report | *audit*, *review*, *what looks generated*, *tell me what is wrong* |
| **polish** | the system and the layout | only what a gate names: the tells, contrast, states, motion, tokens | *polish*, *keep our look*, *only fix what looks generated* |
| **restyle** | the layout | the system: colour, type, radius, shadow, motion, the controls | *keep the layout*, *restyle*, *reskin*, *only the colours and type* |
| **full** | the content and the wiring | the system and the composition: structure, hero, sections, chrome | *redesign*, *rebrand*, *make it ours*: the default when the target exists and nothing narrows it |

Ask in the author's words ("Should I keep your layout and change the look,
or rebuild the page around your content?"), and record the answer in the
status line as `redesign=<audit|polish|restyle|full>`.

The depths do not blend. A polish that finds the concept wrong says so and
recommends the full run; it never smuggles one in. The red flag in
`SKILL.md` is the same rule from the other side: tokens and type swapped on
an unchanged layout is a **restyle**, and a run that calls it a rebrand is
mislabelled.

*From scratch* is a build, not a depth: the old page is the material
inventory, the new one lives in new files beside it.

---

## 2. What a redesign keeps, at every depth

- **The content.** Every fact, claim, name, price, date and quote the page
  states. Figures, quotes and logos already there are the author's material:
  carried over as found and listed in the handoff to verify, one a gate
  doubts included (`gates.md`, `invented-proof`). Nothing is added: no
  action, section, claim or picture the page did not have, beyond what the
  author hands over and what a gate requires (a pause on a loop, a focus
  ring).
- **The wiring.** Every link, form, field, handler, route, id and test
  hook; every script, data call and analytics call. Edit markup inside the
  component that owns it. Never move logic, rename a prop, or drop a
  `name`, an `id`, a `key`, a `type`, an `href` or a `data-testid` that a
  script or a test reads. A state the screen has no logic for (a failed
  load, an undo) is listed for the author, never built.
- **The files.** No file deleted, no route removed and no component tree
  replaced without a file-level plan the author approved, and no test
  edited to make the redesign pass. Documents in the repo (a README, a
  deck) explain the product; they are not page copy. In a git project,
  start from a clean tree (ask the author to commit or stash; never do it
  for them), so the redesign is one diff they can read and revert.
- **The brand,** when there is one. A brand is chosen: a logo, a colour or
  a face the project names (a brand file, a logo asset, named tokens, a font
  file of its own) or the author states. Its values are read from the
  project's files or fetched (`brand-truth.md`), never recalled. A framework
  default or a look the gates name (the purple-to-blue gradient, Inter as
  the display, a stock swatch) is not a brand: restyle and full replace it,
  and the brief says so in case it was.
- **The words,** unless a gate names them. Wording that fails a copy gate
  (`buzzwords`, `placeholder-copy`, `stock-second-action`, the echo) is
  tightened from the facts already on the page, and the handoff lists every
  changed line, before and after. An eyebrow is never just deleted: where
  its heading is figurative, the plain label becomes the heading. Terms,
  disclaimers and consent text are never reworded. When the author says to
  keep every word, record `copy=verbatim` in the status line: the copy
  gates then report as notes.

---

## 3. Before: the record

1. List the pages in the target: route, file, and whether each is a page
   or a screen someone works in (`anatomy.md`, "work in"). In a framework
   project start the dev server and record through its URL; the scripts do
   not render an empty shell `index.html` from disk.
2. Record each page as it stands:

   ```bash
   node scripts/check-kept.mjs record <page.html|url> --dir captures/kept/<page>
   node scripts/check-slop.mjs <page.html> --render --out captures/kept/<page>/before
   ```

   `check-kept record` writes `before.json` (every link, form, field,
   handler, test hook, script, selector a script queries, heading, figure,
   image and id) and `before-1440.png`. `check-slop --render` writes the
   findings and the screenshots at the fold, 1440 and 390.
3. **Look at the screenshots before you weigh the findings,** so the script
   does not write the verdict, then give the read in four lines: what the
   page is for (the audience, the one action); what works and stays (at
   least one thing); what reads as generated (the worst tells, by gate);
   what is broken.

**`audit` stops here.** It walks the judged gates (`gates.md` §3 and §5)
from the screenshots and reports the findings by tier with `file:line`, the
read, the lightest depth that would settle them, and what only a deeper one
would. It changes none of the project's files.

---

## 4. The ask, and the brief

One message replaces the identity questions when the page already carries
an identity worth keeping; skip it when the note already answers it:

> Before I redesign, three things. 1. **What must stay**: the brand, a
> section, a page? Say "keep the layout" and I only restyle. 2. **What is
> wrong with it**, in your words, and the feeling you want instead.
> 3. **Anything new to show**: screenshots, photos, numbers, a quote. Or say
> **go ahead** and I will redesign it in full.

The identity brief (`identity.md` §8) opens with four lines of its own, and
nothing is deleted until the author has seen the Files line:

```markdown
Redesign:  full · 3 pages (/, /pricing, /docs)
Before:    Floor 14 FAIL · Reflex 9 · a centred template in a stock indigo; the pricing table is clear and stays
Keeps:     every link, field and handler · the green and the brand face · the pricing table
Files:     edit: app/page.tsx, app/pricing/page.tsx, app/globals.css · create: app/tokens.css · delete: none
```

Then the brief's usual lines, as far as the depth reaches: Grammar at
restyle and full; Surfaces and the per-surface specs with their job
(`anatomy.md`) at full only. At polish the brief stops after Files.

---

## 5. Build

- **Polish** fixes in place, under the gates: tokens, colour, type, motion,
  states, contrast, single elements (fold an eyebrow into its heading, add a
  focus ring, flatten a gradient, tint a grey). Never restructure: no moving
  sections, no re-picking a system, no swapping a nav. Structural findings
  print with the depth that would settle them; they are not rebuilt.
- **Restyle** keeps every section where it is and changes the system:
  write the token file from the brief (`recipes-design.md` §2), swap the
  faces, the radius, the shadows, the controls (`patterns.md`), the motion
  (`recipes-motion.md`). A kept layout is a kept layout: the layout gates
  (template shape, same seam, hero shape, thin section, dead band) print
  as notes at this depth, for the author to read, and a polish adds the
  spacing gates to the notes.
- **Full** runs the surface loop (`SKILL.md`): spec, approval, build,
  verify, one surface at a time, with the page's own content as the
  material inventory and its job from `anatomy.md`. The hero first, then
  the hero review (`reviews.md`), then the sections.
- **More than one page** at restyle or full: the identity brief is the
  locked system; pages share tokens, type and accent and differ only in
  structure. Past three pages, give each page to its own subagent where the
  harness has them, with the brief, the page's files and this file.
- **A screen someone works in** recomposes inside the shell it has: what
  leads, how the figures, tables and forms are arranged. Routes,
  destinations and each component's logic stay; there is no hero and no
  hero review.

---

## 6. After

1. The record, against the redesign:

   ```bash
   node scripts/check-kept.mjs check <page.html|url> --dir captures/kept/<page>
   ```

   Anything the page had and no longer has is a `FAIL kept` (a link, a
   form, a field, a handler, a test hook, a script, a selector a script
   still queries) or a `WARN kept` (a heading, a figure, an image, an id).
   Restore it, or put it on the record in the page:

   ```html
   <!-- df-design · dropped /blog, #team · the author is retiring the blog and the team section -->
   <!-- df-design · reworded "Built for modern teams" to "Out of your way" · the opener was a cliché -->
   ```

   The reason is a clause (12 characters or more). The run also writes
   `compare.html`, the before and after screenshots side by side: give the
   author its path.
2. `check-slop --render` to 0 FAIL, every REFLEX fixed or waived
   (`gates.md` §6).
3. The project's own checks, where it has them: the type check, the build,
   the tests. A redesign that breaks one is not finished.
4. The verification gate (`verification.md`), and the finish review with
   the `before` screenshots beside the new ones (`reviews.md`): it answers
   what the old page did better. A polish hands it only the full pages at
   1440, before and after, and takes at most five findings.
5. The handoff, ahead of the material ask; where the layout stayed it adds a
   Layout line (the findings only a full redesign would settle):

   ```
   Redesign   full · 3 pages
   Before     Floor 14 FAIL · Reflex 9
   After      Floor 0 · Reflex 1 waived (eyebrow: the step labels are a real sequence)
   Kept       14/14 links · 5/5 fields · 9/9 handlers · 11/11 headings · every figure
   Changed    the system and the composition: structure, hero, sections, chrome
   Dropped    none
   Yours      2 claims kept as found ("50,000+ teams", the Acme quote) · 4 lines reworded, listed below
   Compare    captures/kept/home/compare.html
   ```
