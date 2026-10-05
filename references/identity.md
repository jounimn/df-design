# Identity

A website is not finished when it works, or even when it looks good. It is
finished when it has a **deliberate, recognisable, coherent and defensible
identity**, and every surface of the product carries it.

This file covers how that identity is found, weighed, researched, approved
and then held to. `identity-library.md` is the baseline of identities to
draw from; `audition.md` is how candidate identities are shown to the
author.

---

## 1. Reference is not identity

```
IDENTITY    What the website is supposed to be.
REFERENCE   Something that demonstrates, inspires, expands or informs
            what the website could be.
```

A supplied reference never becomes the identity automatically. Given
`https://hermes-agent.nousresearch.com/`, the wrong reading is "make it
look like Hermes Agent". The right one is a question: **what does this
reference teach us about how this project could be presented?** Its hero
composition, its density, how it relates product to marketing, its type,
its motion: any of those, or several, or none.

The same holds for local material: a video in `Downloads`, a screenshot, a
PDF, a previous version of the site. Extract the *design possibility* it
demonstrates. Do not transcribe it.

---

## 2. What the author gives you

Any combination of: written description, brand guidelines, reference sites,
images, videos, existing sites or design systems, previous versions,
repositories, screenshots. None of these is required. Work with what exists.

For **each** piece of material, establish what the author intends it to
communicate before using it. If the intent is not stated and cannot be
read from context, ask — one line per reference, not an interrogation.

### Classify every reference

| Class | The reference... |
|---|---|
| `IDENTITY` | defines or strongly communicates the desired identity |
| `INSPIRATION` | supplies aesthetic characteristics |
| `PRESENTATION` | shows another way of presenting the same product |
| `INTERACTION` | shows interaction or animation |
| `LAYOUT` | shows composition or information architecture |
| `TYPOGRAPHY` | shows a typographic direction |
| `BRAND` | carries existing brand constraints |
| `CONTEXT` | carries historical, cultural or industry context |
| `ALTERNATIVE` | shows another valid design direction |

A reference can carry several classes. Write the classification down; it
decides how hard the reference pulls.

### Analyse a website reference across

Hero structure · navigation · type · layout · colour behaviour · information
hierarchy · components · motion · interaction · product presentation ·
technical storytelling · marketing/product relationship · density · visual
motifs · overall identity.

Use the prober for the measurable parts (`node scripts/probe.mjs <url>` —
type metrics, font faces, palette, mask/blend/clip counts, motion
libraries) when Playwright is allowed (see `audition.md`). Measure; do not
eyeball what can be measured.

---

## 3. Weighting

In priority order — judgement, not arithmetic:

1. **Explicit author intent.** What the author wants the project to
   communicate.
2. **Existing project and brand constraints.** Brand, required identity,
   design system, technical limits.
3. **Author-supplied `IDENTITY` references.**
4. **The identity library** (`identity-library.md`).
5. **New research.**

**The author's intent outranks any single reference.** "I want the feeling
of an old newsletter, but this site shows another way to present the
product" is two signals, and both survive:

```
Old newsletter (intent)
  + alternative presentation model (reference, PRESENTATION)
  + identity library
  + research
        ↓
  candidate identities
```

It is not "the site is now the identity".

Avoid both failure modes:

- **Ignoring the author** — imposing a library identity over a stated
  direction.
- **Obeying one reference** — treating a single link as the full spec.

The author's intent sets the direction. The library and the research
expand it, challenge it and refine it.

---

## 4. One product, many valid identities

A product is not limited to one obvious presentation. A bakery can be:

```
A  Traditional bakery: printed menu, warm editorial
B  Old newsletter: archival type, newspaper composition
C  Modern artisan: minimal, product photography carries it
D  Playful illustrated: handcrafted packaging language
```

A reference whose job is "here is another valid way" **adds a candidate**.
It does not replace the library.

When proposing candidates, draw at least one from the subject's own world
(`recipes-design.md` §5): its instruments, documents, packaging and
vocabulary. Draw at least one from the library that the author would not
have reached on their own. Three is the usual number; never one.

The candidate closest to the author's intent is its **most specific
reading**, not its generic one. "Old newsletter" becomes a particular
newsletter with its own medium, era and place, such as a duplicated parish
sheet, not "a broadsheet". This matters most when the intent lands on a
look that generators default to (`recipes-design.md` §7).

---

## 5. Asking the author for the identity

Once candidates exist, the author chooses. They may:

- select one candidate
- describe their own
- combine several ("B's type, C's restraint")
- reject all of them, which means a new round, not a compromise
- ask for a **new identity built from source material**. That material then
  becomes the primary research input: analyse it, extract its defining
  traits, find related identities and stronger references, compare
  readings, generate candidates, audition them
- ask for something deliberately unlike the supplied references

---

## 6. Research — and do not stop at the first good reference

The first acceptable reference is where research starts. Keep going until
the direction is backed by the **strongest available** material for its
authenticity, coherence, historical grounding, contemporary execution, type,
interaction, motion, components and memorability.

Research is not "modern SaaS landing page" by default. It goes where the
identity lives. For an archival bakery, that means printed menus, old
newsletters, newspaper typography, packaging, food advertising, editorial
design, artisan branding, and the best contemporary bakery sites.

Sources by kind: existing sites · design systems · historical material ·
type foundries and specimens · component patterns · motion · icon and
illustration systems (licences: `icons-and-assets.md`) · industry and
comparable products · visual movements · presentation techniques.

**Be critical.** Reject, and say why:

- weak or generic references
- poorly executed ones (probe them: zero masks and blends, 32px heroes and
  Inter display all show)
- references that conflict with the author's intent
- references that add noise rather than meaning

Keep a short **research log**: what was kept, what was rejected, one line of
reason each. The log is what makes the direction defensible.

The target is a direction you would score 100/100: critical and appealing.
That does not mean complex. A simple identity scores 100 when its
simplicity is intentional, coherent and fit for the subject.

---

## 7. An identity is a whole design language

Not `primary colour + font + border radius`. Define, where relevant:

| Group | Decide |
|---|---|
| Type | faces and roles (display / text / instrument), scale, tracking, hierarchy |
| Colour | ground, ink ladder, accent, semantic colours, contrast, both themes |
| Space | spacing scale, density, rhythm, page length |
| Geometry | radius, border treatment, rules, grid, shadows or their absence |
| Surface | texture, noise, paper, glass, image treatment |
| Imagery | photography, illustration, iconography (one set) |
| Motion | intensity, curve, what moves and why, reduced-motion fallback |
| Voice | microcopy tone, labels, empty and error states |
| Origin | the historical or cultural references, and the subject's own world |

The output is a coherent visual grammar, which `audition.md` then
demonstrates.

---

## 8. The approved identity is binding

Once the author approves an identity, write it down as an **identity
brief**. It becomes a constraint every later decision is checked against.
Put it in the project (e.g. `docs/identity.md`), or in the conversation if
the author does not want a file:

```markdown
# Identity: <name>
Intent:        <what the site must communicate, in the author's words>
Grammar:       <type / colour / geometry / surface / motion, one line each>
Origin:        <the references kept from the research log, with their class>
Never:         <the drifts this identity forbids, e.g. "generic SaaS card grid">
Loading tier:  <fast / medium / high / custom, as chosen by the author (audition.md §4), and what justifies it>
Surfaces:      <every surface it must cover: landing, app, admin, docs, 404...>
```

Implementation must not drift toward generic conventions. "Archival
editorial bakery" approved and "modern SaaS dashboard" delivered is the
failure this section exists for. When a decision is unclear, the brief
decides.

---

## 9. Every surface belongs to the same product

A project root that holds several surfaces is **one visual product**:

```
Project
├── Backend / admin
├── Frontend / app
├── DevOps / status / internal tools
├── Landing page
└── Error 404 / 500
```

These are different technical responsibilities. They are not different
products. The exception is a project that really does ship several
independent brands, and then the author says so.

The purposes differ: marketing, product use, operations, infrastructure,
recovery. The **visual language does not**. Each surface keeps the identity
through type, colour tokens, spacing, component shapes, icons, borders,
background treatment, motion language, navigation, motifs and microcopy.

**Expression can change. Identity cannot.**

- **Technical surfaces** (admin, backend, DevOps, debugging) put
  usability, density, accessibility and clarity first. They **adapt** the
  identity and never discard it:

  ```
  Weak:    Landing = warm editorial bakery
           Admin   = stock Bootstrap panel
  Strong:  Admin   = warm editorial bakery
                     + higher density
                     + functional components
                     + technical status information
  ```

  Status colours, table rules, form fields and the nav all come from the
  same tokens.

- **Error pages** are part of the identity, not an exception to it. The
  concept may reinterpret it (an editorial site's 404 is a misplaced
  article, an archive's is a missing entry, a bakery's is a misplaced
  recipe, a technical site's is a diagnostic readout), but the type,
  tokens and chrome stay.

Implementation: one token file and one component vocabulary shared by every
surface. Separately styled apps are how products fragment.

---

## 10. Consistency check — before calling anything done

Run this across **every** surface, on the rendered pages
(`verification.md`), not the source:

- [ ] **Identity:** still the approved brief, with no drift toward the generic
- [ ] **Type:** same faces and hierarchy logic on every surface
- [ ] **Colour:** one token system, semantic colours consistent
- [ ] **Components:** buttons, inputs, cards and nav from one vocabulary
- [ ] **Icons:** one set, one stroke, one size logic (`icons-and-assets.md`)
- [ ] **Motion:** reinforces the identity rather than decorating; reduced-motion honoured
- [ ] **Density:** appropriate per surface, with the same rhythm underneath
- [ ] **Technical surfaces:** admin, DevOps and error pages visibly the same product
- [ ] **Loading:** the build stays within the tier the author chose; every library above the fast tier is justified in the brief
- [ ] **References:** informed by them, not copied from them
- [ ] **The blind test:** shown without URLs, filenames or context, would
      every page read as part of the same website?

If any answer is no, name the inconsistency and fix it before reporting.

---

## Distinctions to keep straight

```
Visual quality      ≠  visual complexity
Professional design ≠  generic design system
Reference           ≠  identity
Author material     ≠  automatic design specification
Consistency         ≠  every page looking identical
Expensive tech      ≠  better design
```

The result should feel like **one deliberate product with several technical
surfaces**, not a set of pages generated separately.
