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
| **element** | the project's identity, everywhere but the one element | one piece the author saw: a button, a background, a component, and only the tokens and assets it brings | *just that button*, *I want the background from B*, *add this card* |

Ask in the author's words ("Should I keep your layout and change the look,
or rebuild the page around your content?"), and record the answer in the
status line as `redesign=<audit|polish|restyle|full|element>`.

**A new identity meeting an old one.** When an identity (auditioned,
chosen, or handed over) is going into a project that already has one, and
the note does not say how far, ask before anything else is read: *"Should
the new identity replace the current one everywhere, or do you only want
the [button / background] you saw, with the rest left as it is?"* Replace
is restyle or full and owes the migration map (§4); the one piece is
`element` and owes the element brief (§4). Asking is cheaper than guessing:
a half-replaced identity is the failure this question exists for.

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

### The migration map: a new identity replacing an old one

At restyle and full, when the brief brings a new identity into a project
that has one, the Files line points to a **migration map**
(`docs/identity-migration.md`). The author approves it with the brief, and
no file changes before. A brief that lists only the new values leaves the
old ones to whoever builds: they survive in the surfaces nobody opened, in
a theme block nobody named, in a button three screens still write by hand.
The map has five parts:

1. **Inventory.** What the old identity is made of, read from the files,
   with paths: custom properties and every theme block (`.dark`,
   `[data-theme=…]`), the faces and where they load, colour literals outside
   the tokens, radii, shadows, each control's recipe and the files that
   write it by hand, the shell (nav, rail, footer), icons, motion, and the
   tests that assert an old value. A stylesheet only one surface loads is
   listed with that surface: shared vocabulary parked there never reaches
   the rest.
2. **The map,** one row per inventory item:

   ```markdown
   | Legacy | Where | Decision | New | Reason |
   |---|---|---|---|---|
   | `--brand: 174 177 255` | src/index.css:212 | REPLACE | `--brand: 1 7 176` | |
   | `Inter` | index.html:9, tailwind.config.ts:14 | REPLACE | `Archivo` (display), `IBM Plex Mono` (figures) | |
   | `[data-theme="cockpit"]` | src/layouts/AppLayout.tsx:31 | REMOVE | — | no block defines its tokens |
   | `[data-theme="admin"]` | src/index.css:190 | KEEP | — | the admin's density was drawn for it; approved 2026-10-14 |
   ```

   Decision is REPLACE, REMOVE or KEEP, never blank. **Nothing is kept by
   default or by omission:** a KEEP is the author's decision, with its
   reason and the date they approved it, and a surface outside the step 0
   scope is a KEEP whose reason says so. The Legacy cell puts in backticks
   the literal a search finds (the old value, class, selector or font
   name), not a name the new identity reuses.
3. **Steps,** in order: the one token file (`recipes-design.md` §2), the
   faces, the controls in their one home (`patterns.md`; no screen writes a
   control's classes by hand), the shell, then each surface. Each step
   names its files, the rows it settles, the assets it adds, and its
   acceptance check: a search that returns nothing, a gate, a capture. A
   test that asserts an old value is repointed in the step that changes
   it, and the assertions are counted before and after: a guard deleted is
   a theme left unguarded.
4. **Conflicts.** Each KEEP that meets the new identity: where they touch,
   what the clash looks like (an old theme block re-colouring the new
   button, the old face in the new nav), and how it is resolved: the KEEP
   is fenced to its own selector, re-valued from the new tokens, or turned
   back to REPLACE with the author.
5. **Done:** every step checked, `check-kept map` at 0 FAIL (§6), then the
   gates and captures on every surface the map reaches, and the
   consistency check with its blind test (`identity.md` §10).

### The element brief: `element`

The one piece the author saw, and nothing else. The brief stops after
these lines:

```markdown
Redesign:  element · the solid button from audition B
Source:    auditions/b.html:212 .btn--solid · face, fill, radius, the eight states
Brings:    each token and asset it needs, new or mapped onto the project's own (--brand-blue → --accent)
Where:     the components and pages it goes into, with paths
Untouched: the rest of the identity: no shared token re-valued, no face, theme block or other control changed
```

A token the element needs that would re-colour anything else is a question
for the author, not an edit (`SKILL.md`, step 0, the Build row).
`check-kept record` before and `check` after, on each page it lands on,
shows nothing else moved.

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

   With a migration map (§4), the map against the source, every source
   folder the old identity lives in:

   ```bash
   node scripts/check-kept.mjs map docs/identity-migration.md src/
   ```

   `FAIL map` for a row with no decision, a KEEP without a reason the
   author approved, a REPLACE with nothing in its New cell, a REPLACE or
   REMOVE literal still in the code (`file:line`), or a custom property the
   source defines and the map never names. A new token belongs in the New
   cell of the row it replaces.
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
   Map        41 rows · 33 replace · 5 remove · 3 keep (each approved) · 0 FAIL map
   Dropped    none
   Yours      2 claims kept as found ("50,000+ teams", the Acme quote) · 4 lines reworded, listed below
   Compare    captures/kept/home/compare.html
   ```
