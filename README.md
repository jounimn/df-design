# df-design

A Claude Code skill for web design and motion, plus the measurement rig that
built it.

Most design guidance is taste asserted confidently. This is thirty production
sites loaded in a real browser and measured — and the prober that did the
measuring ships with it, so every number is reproducible and every claim is
checkable against a site you choose.

`SKILL.md` is the payload Claude loads. This README is for the human reading
the directory.

---

## Use the skill

Anything you write when calling the skill is read first, as **step 0**, and
binds the whole run: scope, constraints, early answers and notes.

```
/df-design only rework the main page, keep the logo and the green
```

That run touches the main page and nothing else. Research, auditions,
assets, the loading tier and the consistency check are all limited to it,
and clashes with untouched pages are reported as notes, not fixed.

When the target already exists, the note can also say how deep to go:

```
/df-design audit the current homepage             # a report, nothing changed
/df-design polish: only fix what looks generated  # the tells, in place
/df-design keep the layout, restyle around the green
/df-design redesign the site                      # keep the content and the wiring, change the rest
```

Before a redesign starts, `scripts/check-kept.mjs record` writes down every
link, field, form, handler, test hook and script the page has; after it,
`check` fails the redesign if any went missing without a reason on the
record (`references/redesign.md`).

Then every run opens with two answers, declared before anything else happens
(a third question, whether the work will be sold and so needs a watermark,
rides in the same message but never blocks the start):

```
path:  audition   # compare candidate identities as small HTML pages, choose, then build
       design     # build directly; the identity is still defined and written down first

mode:  motion     # animation only — identity is settled, not yours to change
       design     # identity and structure — no animation
       both       # a rebrand — identity first, then structure, then motion
```

That is not ceremony. The failure this skill exists to prevent is delivering a
finish-level change when someone asked for a structural one — new tokens and
type on the same layout, handed over as "a rebrand". If the request does not
make either answer obvious, Claude asks instead of guessing.

Path and mode are not generator switches. They select stages of one workflow:

```
Author intent → Identity definition → Reference & identity research
  → Playwright decision → Design direction → HTML audition → Author selection
  → [selling-positioning: now / end / skip]*
  → Identity brief → Implementation → Consistency validation → Verification
                                       * optional detour, see below
```

The optional **selling-positioning** detour, offered once the identity is
chosen, produces a complete logo presentation and the identity's positioning
(from the identity and the author's intent, with no market research; real
mockups; the chosen site shown as part of the work) as an HTML slideshow,
slides, social images and a PDF. The author picks the motion tier of the
slideshow (`fast`, `medium` or `high`), and may choose a logo proposal,
combine parts of several, or redirect.
If the work is being sold, a **protective watermark** (a text pattern, or
the author's image plus text, at low opacity) goes on everything shown,
with a clean copy kept for delivery after payment.

A few rules run through all of it:

- **A reference is not an identity.** A link, a screenshot or a video shows
  what the project *could* be. Claude classifies what each reference
  demonstrates (layout, typography, interaction, an alternative presentation,
  and so on) and weighs it below the author's stated intent.
- **The identity library is the search engine.** `references/identity-library.md`
  indexes a gallery of named visual identities. Each has its grammar, what it
  says, fit, trap, loading cost, live sites that ship it, and search leads.
  Claude uses it to propose directions the author would not have reached, then
  researches past the first acceptable reference.
- **The approved identity binds every surface.** Landing, app, admin, DevOps,
  docs and 404 are one product. Density adapts; identity does not.
- **One surface at a time.** On a project with several surfaces (landing,
  admin, ops, 404), Claude finishes one before starting the next: its own
  spec, the author's approval, the build and a look at the result. Surface
  specs never borrow each other's premises; what is shared lives in the
  identity brief.
- **The author picks the loading tier.** Claude recommends the cheapest tier
  that fully delivers the identity, then offers fast, medium and high
  expensive loading, each described and costed for this project, plus a
  "custom / unrestricted" choice if the author declines the
  recommendation. YOLO, the no-savings tier for flagship experiences, is
  offered in the same message with its weight in MB and never recommended:
  it has no ceiling, and it still owes the Floor (reduced motion, a lighter
  path, the content readable without the experience, no sound before the
  visitor asks), which `check-motion --tier yolo` fails when it is missing. The question comes with the candidates, every run, even
  when every candidate is fast, and is confirmed after the assets are
  priced. When the author combines candidates or techniques from different
  tiers, each technique is listed with its own tier and cost and the author
  keeps or drops each one. A heavier tier has to be justified in the
  identity brief.

- **Icons always; stock images only with the author's yes.** Every image must
  be free for commercial use, need no credit line and carry no watermark in
  the file that ships. In `motion` and `both`, the icons and images are part
  of the motion plan.

In `both`, the order is fixed: **identity → structure → motion.** Motion
applied to a generic layout produces a generic layout that moves.

---

## Architecture

### The workflow

What happens in one run, and which file drives each stage. Dashed stages run
only on the audition path. In `motion` mode, the identity stages shrink to
reading the identity the site already has.

```mermaid
flowchart TD
    Z["Step 0: invocation note<br/>scope · constraints · notes<br/>binds every stage"] --> A
    A["Brief from the author"] --> G{"Path and mode<br/>+ practical requirements<br/>+ may I use stock images?"}
    G --> I["Author intent and<br/>reference classification"]
    I --> L["Library search<br/>sector default → shortlist → cuts"]
    L --> R["Research<br/>past the first good reference, rejects logged<br/>+ shortlist image sources and icon sets"]
    R --> P{"Playwright<br/>allowed?"}
    P -->|yes| PR["Probe references"]
    P -->|no| NB["Non-browser tooling;<br/>author does the looking"]
    PR --> D["Three candidate directions"]
    NB --> D
    D -.audition path.-> AU["HTML auditions<br/>same content, tier message<br/>priced per candidate"]
    AU -.-> S["Author selects,<br/>combines or rejects"]
    S -.-> AS
    D -->|design path| AS["Assets<br/>one icon set (mandatory)<br/>+ approved images: free, commercial,<br/>no credit, no watermark"]
    AS --> T{"Loading tier confirmed<br/>images priced,<br/>combinations re-priced"}
    T --> B["Identity brief<br/>binding on every surface"]
    B --> PL["Plan, then review<br/>against the generic<br/>motion includes icons and images"]
    PL --> SS["Surface spec<br/>one surface at a time"]
    SS --> SA{"Author approves<br/>this surface?"}
    SA -->|no| SS
    SA -->|yes| BU["Build this surface:<br/>hero · hero review · sections<br/>then check-slop and the finish review"]
    BU -->|next surface| SS
    BU -->|all surfaces done| C["Consistency check<br/>across surfaces"]
    C --> V["Verification gate<br/>look at the rendered pages"]

    classDef ref fill:#f4f4f4,stroke:#999,color:#222
    I:::ref
    L:::ref
```

| Stage | File |
|---|---|
| Path and mode, red flags | `SKILL.md` |
| Intent, references, research, identity brief, consistency | `references/identity.md` |
| Library search | `references/identity-library.md` → `references/identities/*.md` |
| Playwright, auditions, loading tier | `references/audition.md` |
| Assets: icons (mandatory), stock images (author's choice) | `references/icons-and-assets.md`, `references/images.md` |
| Plan and build, including icons and images in the motion | `references/recipes-design.md`, `references/recipes-motion.md` |
| The visitor's job: the action, the category's own sections, the close | `references/anatomy.md` |
| A real brand named: fetched or probed, never recalled | `references/brand-truth.md` |
| An existing design: audit, polish, restyle, full; the kept record | `references/redesign.md` |
| The parts every page repeats, written to pass the gates | `references/patterns.md` |
| The gates: tiers, classes, waivers, the judged clauses | `references/gates.md` |
| The two reviews in fresh context | `references/reviews.md` |
| Verification | `references/verification.md` |

### The repository

```mermaid
flowchart LR
    subgraph Skill["Skill payload (what Claude loads)"]
        SK["SKILL.md<br/>gate · workflow · red flags"]
        subgraph Refs["references/"]
            ID["identity.md"]
            AUD["audition.md"]
            LIB["identity-library.md<br/>index of 209"]
            FAM["identities/<br/>historical · digital · print-craft<br/>cultural · industry"]
            RD["recipes-design.md"]
            RM["recipes-motion.md"]
            IC["icons-and-assets.md"]
            DRA["drawn-assets.md"]
            YRF["yolo-references.md"]
            ILC["illustration-concept.md"]
            IMG["images.md"]
            VER["verification.md"]
            BEN["benchmarks.md"]
            ANA["anatomy.md"]
            GAT["gates.md"]
            PAT["patterns.md"]
            REV["reviews.md"]
            RED["redesign.md"]
            BRT["brand-truth.md"]
        end
    end
    subgraph Rig["Measurement rig"]
        PRB["scripts/probe.mjs"]
        LIBS["scripts/lib/<br/>static pass · motion inventory<br/>property and scroll trace<br/>archetype · validate · bundle"]
        TST["test/<br/>483 tests in 31 files, local fixtures"]
    end
    subgraph Gates["Gate checks"]
        CSL["scripts/check-slop.mjs<br/>static tier · render tier"]
        CKP["scripts/check-kept.mjs<br/>record · check"]
        CPT["scripts/capture.mjs"]
        CUT["scripts/cutout.mjs<br/>remove-bg · detect · mask"]
        DRW["scripts/draw.mjs<br/>check · roughen · sheet"]
        INK["scripts/ink-pass.mjs<br/>ink · layers"]
    end
    SK --> ID & AUD & LIB & RD & RM & IC & DRA & IMG & VER & ANA & GAT & PAT & REV & RED & BRT & YRF & ILC
    LIB --> FAM
    RD & RM --> BEN
    PRB --> LIBS
    LIBS --> CAP[("captures/")]
    CAP -. "aggregated into" .-> BEN
    AUD -. "probe the references" .-> PRB
    VER -. "probe the built page" .-> PRB
    GAT -. "implemented by" .-> CSL
    VER -. "run the gates" .-> CSL
    RED -. "the record" .-> CKP
    BRT -. "probe the brand" .-> PRB
    CSL -. "screenshots for" .-> REV
    TST --> LIBS & CSL & CKP & CPT & CUT & INK
    DRA -. "the ink pass" .-> INK
    INK -. "figure layers" .-> CUT
```

The skill and the rig are separate halves. The skill tells Claude how to
work. The rig produced the numbers in `benchmarks.md`, and Claude runs it
during a job to measure reference sites and the page it built. The gate
checks sit between: `check-slop` names the mechanical tells of a generated
page (the static tier reads HTML and CSS; `--render` measures the fold,
horizontal scroll, focus rings, the measure and the page with scripting
off), `check-kept` records what a page says and does before a redesign and
fails the redesign when wiring is lost, `capture` screenshots the real
product for the page that sells it, and `capture-motion` records a page
driven by real input to its end and turns the video into contact sheets,
for the motion no still can show.

---

## Examples

Four briefs from different niches, each covering a different path and mode.
Each example below was then **built as an audition-sized page** with the skill: real icons, and stock images only where that brief's author said yes, every one free for commercial use, credit-free and watermark-free. The screenshot is the rendered page at rest.
On 2026-10-29 all four were **rebuilt through the whole workflow** and the folder of each keeps the trail: `identity.md` (brief and ledger), `surfaces/home.md` (the surface spec), `verification.md` (gate output, both reviews, what is open) and `selling-positioning/` (research log, logo proposals or system, the presentation and its `final/` export: slides, PDF, social; the 3000 px mockups are gitignored and regenerated by `export-presentation`).
The plans are condensed from real runs of the skill on 2026-10-05. The
planning runs fetched no reference URLs, so anything said about a reference
site is a hypothesis the skill would check with the prober first. The pages
use placeholder names, addresses and figures, and the legal deadlines in the
Moreira & Vaz example need checking against the Labour Code before real use.

| | Niche | Path / mode | Reference supplied |
|---|---|---|---|
| Miolo | Food retail: sourdough bakery, Porto | audition / design | an AI-agent product page |
| Tracewell | B2B developer tool | design / motion | linear.app |
| Moreira & Vaz | Professional services: workers' law firm, Lisbon | design / design | gov.uk |
| Faísca | Culture and education: children's science museum | audition / both | a video of a toy brand's site |

### Miolo — a bakery that should feel like an old neighbourhood newsletter

<a href="docs/examples/miolo/full.jpg"><img src="docs/examples/miolo/hero.jpg" alt="Miolo: a typed parish-bulletin bakery page with a violet stamp on stock counts" width="100%"></a>

<sub>Built with the skill: [full page](docs/examples/miolo/full.jpg) · [mobile](docs/examples/miolo/mobile.jpg) · [HTML](docs/examples/miolo/index.html) · [asset record](docs/examples/miolo/assets.md) · [identity](docs/examples/miolo/identity.md) · [verification](docs/examples/miolo/verification.md) · [presentation PDF](docs/examples/miolo/selling-positioning/final/presentation.pdf)</sub>

> "I'm opening a small sourdough bakery in Porto called Miolo… landing page,
> online pre-order, a simple admin page for today's orders. I want it to
> feel like an old neighbourhood newsletter. This site shows another way of
> presenting a product that I like: hermes-agent.nousresearch.com"

- **Reference:** classed as PRESENTATION, not identity. Kept: "show the
  product working". The hero becomes tomorrow's loaves, how many are left
  and when orders close, instead of a bread photo. Its dark developer look
  is left behind.
- **Sector default to escape:** *Bakery / food shop*: darkened bread photo,
  "Welcome to…", slider, PDF menu.
- **Candidates:**
  - **A, closest:** a stencil-duplicated 1970s–80s parish bulletin. This is the specific reading of "newsletter"; the generic broadsheet was cut.
  - **B, the bakery's own world:** the kraft bread bag and the shop's price board.
  - **C, unexpected:** a teletext bulletin page with live counts.
- **Tier message:** fast expensive loading recommended (~150–200 KB). Medium
  and High stated honestly as adding nothing this style needs.
- **Plan:** duplicator-green paper, typed body text (Courier Prime) at
  64ch, lettering-guide caps, one violet stamp used only where a fact
  changes state (ESGOTADO, PAGO). Seven bands, each answering a real
  question. The admin is the bulletin's own ledger; the 404 is an
  "Errata".
- **Copy:** "O pão de amanhã encomenda-se hoje." Sold-out error: "A broa de
  milho esgotou para amanhã enquanto escolhia. O resto da sua encomenda
  está guardado."

### Tracewell — motion for a settled developer-tool brand

<a href="docs/examples/tracewell/full.jpg"><img src="docs/examples/tracewell/hero.jpg" alt="Tracewell: dark developer-tool hero with a masked dot grid and a request hairline" width="100%"></a>

<sub>Built with the skill: [full page](docs/examples/tracewell/full.jpg) · [mobile](docs/examples/tracewell/mobile.jpg) · [mid-motion frame](docs/examples/tracewell/motion.jpg) · [HTML](docs/examples/tracewell/index.html) · [asset record](docs/examples/tracewell/assets.md) · [identity](docs/examples/tracewell/identity.md) · [verification](docs/examples/tracewell/verification.md) · [presentation PDF](docs/examples/tracewell/selling-positioning/final/presentation.pdf)</sub>

> "Open-source distributed tracing… settled brand: near-black, one
> signal-orange accent, Söhne + JetBrains Mono, 4px corners. The landing
> page feels dead. Add motion to the hero and 'how it works'. Keep it fast.
> Motion we admire: linear.app"

- **Identity:** motion mode, so the existing tokens are read and frozen.
  Palette, type, layout and radius are untouched.
- **Reference:** classed as INTERACTION only; the brand outranks it. Taken:
  the staggered dot grid, corner-glow masks, screen blends, a weighted
  curve. Left: Linear's palette, gradients and type.
- **Motion plan:** every move tied to a recipe in `recipes-motion.md`, and each one means something about tracing:
  - **Dot grid (§2):** dots fire like services emitting spans.
  - **Orange hairline (§5, §9):** one masked line crosses the hero like a request crossing services.
  - **Span waterfall (§10):** CSS `view()` draws the trace step by step as you scroll.
  - **Latency counter (§12):** counts to its real value in tabular mono.
- **Reduced motion (§14):** every element has a finished resting state, and the page works without JS.
- **Tier message:** fast (~1 KB of JS) recommended. Medium named a concrete
  extra (sticky scroll story, +30–40 KB). High named a live WebGL service
  graph (+150–300 KB, needs a fallback).

### Moreira & Vaz — a law firm on the workers' side

<a href="docs/examples/moreira-vaz/full.jpg"><img src="docs/examples/moreira-vaz/hero.jpg" alt="Moreira & Vaz: a rights-handbook homepage with a situation index" width="100%"></a>

<sub>Built with the skill: [full page](docs/examples/moreira-vaz/full.jpg) · [mobile](docs/examples/moreira-vaz/mobile.jpg) · [HTML](docs/examples/moreira-vaz/index.html) · [asset record](docs/examples/moreira-vaz/assets.md) · [identity](docs/examples/moreira-vaz/identity.md) · [verification](docs/examples/moreira-vaz/verification.md) · [presentation PDF](docs/examples/moreira-vaz/selling-positioning/final/presentation.pdf)</sub>

> "A 12-lawyer employment-law firm in Lisbon. We represent workers, not
> companies. Our current site looks like every other law firm: navy, a
> gavel, stock handshakes… homepage, a 'your rights at work' guide, intake
> form, 404. Here's a site I find clear: gov.uk"

- **Reference:** classed as LAYOUT and TYPOGRAPHY.
  - Taken: plain language, task-first headings, gov.uk's form pattern (error summary, inline errors).
  - Left: its look. A firm dressed as the state could be mistaken for an official body.
- **Sector default to escape:** *Legal / professional services*: navy,
  gavel, columns. The usual escape, institutional gravitas, also sides
  with institutions, so it was rejected too.
- **Library:** shortlist from four families. Nine cuts with reasons, e.g.:
  - **Constructivism:** reads as 1974 party politics in Portugal.
  - **Risograph:** "cheer feels trivial to someone just dismissed".
- **Chosen (design path):** *Field guide / almanac*, read specifically as
  a worker's pocket rights handbook. Entries are indexed by situation, with
  Labour Code article references in the margin.
- **Plan:** green-biased ink on paper, one bottle-green accent, Source Serif
  4 for display, Atkinson Hyperlegible Next for text at 19px / 66ch, and
  mono only for article numbers and deadlines. The one loud element is the
  hero's situation index: "Fui despedido(a)", "Não me pagaram".
- **Tier message:** fast (~120 KB). Medium and High: "nothing this identity
  needs".
- **Copy:** "Defendemos trabalhadores. Nunca empresas." Submit: "Enviar o
  meu caso". Error: "Escreva o que aconteceu, mesmo em poucas palavras".

### Faísca — rebrand and motion for a children's science museum

<a href="docs/examples/faisca/full.jpg"><img src="docs/examples/faisca/hero.jpg" alt="Faísca: an experiment-sheet homepage with a pendulum diagram" width="100%"></a>

<sub>Built with the skill: [full page](docs/examples/faisca/full.jpg) · [mobile](docs/examples/faisca/mobile.jpg) · [mid-motion frame](docs/examples/faisca/motion.jpg) · [HTML](docs/examples/faisca/index.html) · [asset record](docs/examples/faisca/assets.md) · [identity](docs/examples/faisca/identity.md) · [verification](docs/examples/faisca/verification.md) · [presentation PDF](docs/examples/faisca/selling-positioning/final/presentation.pdf)</sub>

> "A hands-on science museum for kids 6–12 in Coimbra… homepage, ticket
> booking, a schools page, an internal front-desk bookings page, 404. Kids
> curious, parents feel it's worth the money, teachers trust it. I love the
> energy of this toy brand's bouncy site (video attached)."

- **Reference:** the video is classed as INTERACTION plus some INSPIRATION.
  - Taken: spring overshoot and motion that answers the pointer.
  - Left: the toy-shop palette and motion that never stops. Parents and teachers need calm.
- **Sector default to escape:** *Kids / family*: rainbow cartoon clutter.
- **Auditions:** the same content in all three ("Toca. Testa. Descobre."), each labelled with its tier:
  - **A, "Oficina Riso", closest:** Risograph spot inks with draggable exhibits.
  - **B, "Manual de Experiências", the museum's own world:** an experiment-sheet layout with numbered steps and line-art exploded diagrams.
  - **C, "Padrão Faísca", unexpected:** a Bauhaus grid with Nordic-style pattern bands drawn from magnetic field lines and crystals.
- **Motion for B:** "physics you could name in class". One spring curve
  that overshoots once (Hooke's law), cards that tip like a lever, steps
  that reveal in order like an experiment, and a slow pendulum.
  - **Reduced motion:** state changes become instant, the pendulum hangs at rest, and drag still works.
- **Surfaces:**
  - **Front-desk page:** the same manual grammar at desktop density, with no bounce.
  - **404:** "Experiência falhada", a manual page with a part missing from step 4.

---

## Run the prober

```
npm install
node scripts/probe.mjs https://linear.app --cohort analytics
```

Two passes over the page, and the second is the interesting one:

| Pass | `prefers-reduced-motion` | What it is for |
|---|---|---|
| Motion | `no-preference` | Static metrics, motion inventory, property trace, scroll trace, six scroll frames |
| Contract | `reduce` | Re-inventory and re-trace, to see what *actually* stopped moving |

That second pass is why the reduced-motion number in the benchmarks means
something. Grepping a stylesheet for `@media (prefers-reduced-motion)` tells
you a rule exists; re-running the property trace under `reduce` and counting
how many elements still move tells you whether it works. A site can ship the
media query and animate anyway.

Output lands in `captures/<site>/<date>/` — the validated record, the raw
capture, the motion traces, the frames, and a `contact.png` thumbnail grid
rendered by the browser that is already open. The record carries a
`transfer` field: bytes on the wire by type (images, video, models, audio,
script, other) for the first view, before any click, and for the full page
after the scroll frames, plus the sound fetched before any click.

For pages that stream forever or sit behind a gate (the YOLO cohort):

| Option | Default | What it is for |
|---|---|---|
| `--wait <domcontentloaded\|load\|networkidle>` | `load` | What `goto` waits for. A page that streams media never reaches `load` in time; `domcontentloaded` lets it be measured |
| `--timeout <ms>` | `30000` | How long `goto` may take (the settle after it still waits at most 15 s) |
| `--click "<css>"` | none | Clicks to pass a gate (age question, "Begin", sound prompt), in order, after the page settles and again on the reduced-motion pass. Repeat the option, or separate selectors with commas; a comma inside `:is(...)` or `[...]` stays in its selector. A click that fails is kept in `load.clicksFailed`, and the probe goes on |

```
node scripts/probe.mjs https://santionispirits.com/ --cohort yolo --wait domcontentloaded --timeout 60000 --click "#age-yes"
```

The canvas trace reopens the page twice (reduced motion, no WebGL) without
the clicks, so behind a gate its canvas columns may read "not measured".

The six frames are taken with `window.scrollTo`. On a site whose scrolling a
library owns, scrollTo moves nothing and every frame shows the first screen.
When the scroll trace reports that, or the page is a virtual scroller (the
document one screen tall, a taller layer holding the content), the probe
runs the motion capture into `motion/` in the bundle and records it as
`motionCapture` in `raw.json` and `motion.json`. `--motion` asks for it on
any site:

```
node scripts/probe.mjs https://example.com --motion
node scripts/capture-motion.mjs https://example.com --click "#accept" --out captures/motion/example
```

The capture records a video, turns the wheel in small steps (PageDown and
Space when the wheel changes nothing) until the scroll position, a
downscaled picture and the canvas pixels stop changing, and writes
`video.webm`, contact sheets of the whole recording, stills where the picture
settled, and `capture.json`. ffmpeg is used when one is found and is not
required.

### It quarantines rather than deletes

`scripts/lib/validate.mjs` separates suspect fields into a `quarantine` list
with a reason and keeps the raw capture as the authority. Nothing is silently
dropped, and nothing implausible is silently published:

- A page height under 1.5× the viewport on a site showing lazy-loading
  sentinels — measured too early, needs a scroll-to-bottom settle.
- A fully transparent accent or ground. `rgba(0,0,0,0)` is what you read off
  an element that never painted; publishing it as "the brand colour" is how a
  palette table fills up with black.
- Zero font faces on a page that rendered text.
- An absurd corner radius, unless it resolves to a pill — then it is
  normalised, not rejected.

An absent hero is legal and never quarantined. Some pages genuinely have no
`h1`, and a rig that treats that as an error cannot measure a canvas-first
site.

### Archetypes

`classifyArchetype()` sorts a page into `typographic`, `media-stage`,
`canvas`, `interactive-demo`, `editorial`, `none`, or `novel`. Order matters
in the classifier: a dominant visual stage outranks whatever type sits on top
of it. This keeps the aggregates honest — a 112px hero on a WebGL stage is
not evidence about typographic heroes.

```
npm test        # 483 tests in 31 files, node:test, no network — a local fixture server
```

---

## What is in here

| Path | What it is |
|---|---|
| `SKILL.md` | The instruction payload: path and mode gate, workflow, headline numbers, verification gate, red flags. |
| `references/identity.md` | Author intent, reference classification and weighting, research depth, the identity brief, cross-surface consistency. |
| `references/identity-library.md` | Index of the identity gallery: the search engine for candidate directions. |
| `references/identities/` | The gallery itself, one file per family. |
| `references/audition.md` | The Playwright decision, HTML auditions, loading-cost tiers. |
| `references/icons-and-assets.md` | Icons are mandatory: one set per project, chosen to fit the identity. Commercially safe sets, licence traps, sizing icons against type. |
| `references/drawn-assets.md` | When an identity draws its own doodles, annotations, spot illustrations or icon set: the jobs a drawing may do, the line derived from the brief, construction, and the check before it reaches a page. For a drawn story: living characters built anatomy first, key art generated by a local open-weight model (licences, prompts, seeds and rejection, measured CPU cost, the record), and the ink pass; 3D characters rendered in the same ink (Blender toon bands, hull and Line Art, or three.js toon with a hull), and water, smoke and sparks drawn frame by frame in Grease Pencil. |
| `references/yolo-references.md` | The eight YOLO flagship sites, recorded live and analysed as text: each one's scenes in order, its techniques, what makes it absurd, what they share; a catalogue of WebGL templates read from its recordings (the house pattern, and why most of it is High, not YOLO); a catalogue of 548 components read the same way (its kit and its few signatures, and the lesson of its strongest pieces: their own art direction, and the page's own content as the material of the effect); and where each move now lives in the skill and which installed skills it was adapted from. No third-party pictures; dated, so `audit-store` ages it. A YOLO build reads it before probing them again. |
| `references/illustration-concept.md` | When an identity is led by illustration and the author supplies no concept art: the concept bible the skill writes before any art (story spine and beat table, character sheets with generation and 3D briefs, form sheets, style sheet) and the rule that carries it through the build, with one condensed worked example. |
| `references/images.md` | Stock images, only with the author's yes: sources that are free, commercial, credit-free and watermark-free, the traps inside them, searching for the identity, one treatment, weight, and the asset record. |
| `docs/examples/` | The four README examples as built pages, each with its identity brief, surface spec, verification record, screenshots, asset record and selling-positioning presentation. `docs/examples/motion-techniques/` holds the example pages built to measure technique cards whose sources publish no probe-able page (Clay 3D; the particle morph, Fluid ink, Cursor-painted reveal, Glass object, Reflective water floor, Object that travels between sections and the page-layer recipes; Glass over moving light, Glass letters, Images that fray and smear, Type on geometry, CSS 3D objects, Stepped showcase and Dither), each with a README of its measurements. |
| `references/benchmarks.md` | The measurements. Aggregates, per-site data, easing curves and durations actually shipped. |
| `references/recipes-design.md` | Ten sections: type roles and measure, colour ladders, page structure, chrome vocabulary, subject-derived identity, layout, anti-slop, the plan-and-review pass, words as design, and the checklist. |
| `references/recipes-motion.md` | The rules every motion technique obeys: the signature curve, the reduced-motion contract, icons and images in motion, scene changes in a scroll story (designed cuts, continuous through the cut, scroll as eased time, 3D characters that move through it, the stall check), the grammar of a drawn scroll story with working code (depth planes and a moving hold, a shape carried across each cut, the ink-out that carries depth, the focus field, captions and type that assemble by tracking, hold beats, the ending as a scene, preloading with honest progress, drawn effect loops, reduced motion for the whole story), smooth scroll with the native scroll under it (§27), the idle autopilot every cursor-driven effect owes (§28), and a checklist. The techniques themselves are 55 cards in `references/techniques/` (25 fast, 9 medium, 15 high, 6 yolo), 38 of them with a measured cost, and the other 17 say "not measured". |
| `references/techniques/yolo.md` | The YOLO tier: six techniques of flagship experiences (scroll-scrubbed image sequence, pre-rendered 3D film, real-time 3D world, illustrated scroll story, sound design, physics and drag), each priced in MB from the sites that ship it, with the Floor fallback it still owes. The illustrated scroll story card carries the transition list, the grounds, the generated art and the 3D characters. |
| `references/verification.md` | How to confirm the work is real. Read this one even if you skip the rest. |
| `references/gates.md` | The one list of what the skill refuses to ship: Floor (never waived), Reflex (waived on the record), Finish (noted). Which a script settles, which a browser measures, which the eye judges; the judged clauses. |
| `references/anatomy.md` | What a page is built around, by the visitor's job: subscribe, book, visit, attend, buy, try, sign up, hire, join, listen, work in. Where the action lives, the category's own sections, how pages end. |
| `references/patterns.md` | The parts every page repeats, written to pass the gates: controls in eight states, a photograph in a slot, a missing fact, a form that posts nowhere yet, a reveal that survives no script, a loop that can pause. |
| `references/reviews.md` | The two reviews in fresh context, hero and finish: the thread that built the page is its weakest reviewer. |
| `references/redesign.md` | An existing design as the material: audit, polish, restyle or full; what every depth keeps; the record and the handoff. |
| `references/brand-truth.md` | Never theme a real brand from memory: probe or fetch its colours and faces, with the fetch rules that keep it safe. |
| `scripts/probe.mjs` | The prober CLI. |
| `scripts/check-auditions.mjs` | Checks that an audition step landed: pages exist and render cleanly at 1440 and 390, icons present, and images only under the author's answer and the licence rules. Writes each candidate's full page at rest and its motion capture side by side. |
| `scripts/audit-store.mjs` | Reads every store as a whole and reports drift a write gate cannot see: index rows without entries, duplicate identities, a Seen-at with no site, aggregate medians the per-site table no longer supports, `§` references to sections that moved, measurements past their shelf life. Never mutates. |
| `scripts/check-slop.mjs` | Names the mechanical tells of a generated page. Static tier: HTML and CSS, zero dependencies. `--render`: the fold, horizontal scroll, focus by tabbing, the measure, broken images, scripting off, glass over a flat ground, and with motion on a storm of animations, a counter over a page that is already painted, and a wheel that steps a page no key can; writes the screenshots the look needs. Exit 1 on a FAIL or an open REFLEX. |
| `scripts/check-kept.mjs` | `record` what a page says and does; `check` a redesign against it and fail when a link, field, form, handler, test hook or script is gone without a reason on the record. Writes `compare.html`. |
| `scripts/capture.mjs` | Screenshots of the real product at desktop and phone, one element or the full page, or a running desktop app over CDP. Prints a ready `<img>` per file. |
| `scripts/capture-motion.mjs` | The motion capture: a video of the page driven by the wheel (keys as the fallback) to its true end, past any gate given as `--click`; contact sheets of the whole run, stills where the picture settled, and `capture.json` with the steps, the input that moved it, the stalls (input that moved nothing before the page moved again) and whether it reached the end. Used by `probe --motion`, `check-auditions` and `check-slop --render`. |
| `scripts/draw.mjs` | Drawn assets: `check` a set for one line and one palette, `roughen` clean geometry into a seeded hand-drawn line, `sheet` the set on the brief's ground, inverted and at 24px. |
| `scripts/lib/` | Browser launch, static pass, motion inventory, property trace, scroll trace, archetype, validate, bundle; the slop gates (static and render) and the page record. |
| `scripts/cutout.mjs` | Cuts a product or a person out of a photo to sit on a colour ground, lists what is in a photo as labelled boxes, or masks one named object. Local, CPU, offline after `setup`. Only MIT and Apache-2.0 weights from the allow-list in `scripts/py/cutout-models.json`. Prints the `assets.md` row and warns when the subject is a person. |
| `scripts/ink-pass.mjs` | Forces a picture (a generated panel, a render, a scan) into the brief's inks: hatching along the structure tensor, screentone only where there is no structure, the hint only through a mask and never on a figure, each width inked on its own; `layers` splits it into a background and a figure plane. Colours from `--brief` or the flags, none built in. Prints the asset-record treatment. |
| `scripts/py/` | The Python side of the cutout tool, its pinned requirements and the model allow-list, and `ink-pass.py`, the pixels of the ink pass (numpy and Pillow; the cutout venv has both). The venv and the weights live in `~/.cache/df-design`, never in the repo. |
| `test/` | 487 tests in 31 files, and the HTML fixtures they run against. The two that run the cutout models are skipped unless `DF_DESIGN_CUTOUT_TESTS=1`; the ink-pass pixel tests are skipped when no Python with numpy and Pillow is found. |
| `templates/scroll-story.js` | The runtime of a drawn scroll story (`dfStory`), no dependencies: scroll progress as `--p`, the depth-plane parallax with its moving hold, hold beats, drawn flipbook loops, the ink-out, and the preloader that decodes, uploads and compiles with honest progress. Every part stops off screen and stands still under reduced motion. |
| `licenses/` | Third-party licences for what is adapted here (Hallmark, the eleven skill repositories and the fluid solver credited below, all MIT), and the licences of the cutout models, which are downloaded, not vendored (`cutout-models.md`). |

Claude reads the mode's recipe file and works from it; `benchmarks.md` and
`verification.md` are pulled in as needed.

---

## What the measurements say

The sample skews to data, analytics and developer tools: Stripe, Linear,
Vercel, ClickHouse, Hex, MotherDuck, Atlan, Datafold, Neon, Supabase, Warp,
Resend, Observable, PostHog, dbt, Grafana, Metabase, Tinybird, Monte Carlo,
Cube, WorkOS, VoidZero, Railway, Cerebrium, Fibery, Dovetail, Lovable,
Cosmos, Trionn, Infinite Machine.

| Measure | Production median | What gets shipped instead |
|---|---|---|
| Hero type size | **64px** | a 32–48px "large" heading |
| Hero tracking | **-0.025em** | `normal`, or a timid -0.01em |
| Page height | **9,329px** | under 3,000px — six thin bands |
| Distinct font faces | **5** | one neutral sans for everything |
| Ships a monospace face | **25 of 28** | none anywhere |
| Inter as the *display* face | **4 of 28** | Inter, because it is safe |
| CTA corner radius | **6px** | 12–16px, uniformly |

The most load-bearing finding is not in that table. Premium pages are not
built from more keyframes — they are built from **masks, clip paths and blend
modes**. Element counts using each: PostHog 164, Stripe 99, Fibery 94,
Cerebrium 85, Linear 54. A page with zero masks and zero blend modes reads as
flat no matter how carefully its fade durations are tuned.

---

## The verification gate

The skill will not call work done until the rendered page has been looked
at — not the test suite, not the type-checker, not the build. The page.

This is the part that earns its keep, because **absence is silent**. A class
that does not exist, a rule that never matches, a container that never
bounds: none of them raise anything. All of the following shipped green:

- A virtualized table that rendered all 1,386 rows, because the shell used
  `min-h-screen` and the scroll container never engaged. Three tests passed —
  they stubbed a 400px viewport.
- Five custom `fontSize` tokens that `tailwind-merge` deleted on sight,
  because it classifies unrecognised `text-*` as *colours*. The whole type
  scale was inert.
- 41 Tremor classes compiled to nothing, because the `tremor-*` namespace was
  never defined in the host Tailwind config. Every axis label fell back to
  Recharts grey — invisible on a dark canvas.
- A "rebrand" with 183 tests green in which not one structural decision had
  changed.

`references/verification.md` has the procedure: how to capture a page *at
rest* so scroll-triggered content is not photographed at `opacity: 0`, and
how to probe the page for what a screenshot cannot tell you — whether a theme
resolved, whether a virtualizer virtualized, whether a library's classes
compiled at all.

Note the inversion between the two halves of this repo. `verification.md`
emulates reduced motion to *suppress* animation, so a page can be
photographed at rest. The prober's first pass disables that emulation,
because there the animation is the measurement.

---

## Extending it

**Adding sites.** Run the prober; do not hand-edit a number into
`references/benchmarks.md`. When a capture contradicts the table, the capture
is the authority and the table is what needs editing — and `SKILL.md` repeats
several of these aggregates, so a median that no longer matches its source
table has to be updated in both places.

**Adding recipes.** They go in the mode's recipe file and must be **working
code traced to a named site that ships it**. A parameter table is not a
recipe. "Premium = 400ms, ease-out, no overshoot" is what produces
`opacity: 0 → 1` plus an 8px rise and a straight face — that is the failure
this skill was written against, and it creeps back every time a recipe gets
summarised instead of written out.

**Adapting another skill.** Read it whole and take only what serves a
stage this skill already has; it enters through that stage's file, in this
skill's voice, never as a copied folder or a second vocabulary. Check the
repository's licence (`gh api repos/OWNER/REPO/license`), keep its notice in
`licenses/`, credit it below, and map each move to the file that actually
supplied it (`yolo-references.md` keeps that map for the YOLO grammar). A
skill's description is a claim: where it had no code for a move, say the
recipe was written from the reference instead.

**Adding identities.** They go in the right family file under
`references/identities/` and get a row in the index. Each one needs a
grammar, a fit/misfit, a trap, a loading tier and at least one **live site that
ships it**. A style name with no grammar and no example is a mood word, and
mood words are what generic pages are built from.

**Adding to `verification.md`.** Each entry should have cost something to
learn. Every row in that file is a real failure that shipped past a green
suite; that is what makes it persuasive rather than preachy.

**Auditing the store.** The rules above are write-time gates: each judges
one record on its own. The failures that actually degrade an accumulating
store are properties of the collection and arrive slowly: an index row
whose entry was renamed, two identities with one name, a "Seen at" that
names no site, a median the per-site table no longer supports, a `§`
reference to a section that moved, a measurement past its shelf life. Every
one of them passes every write gate. So the store gets a second, separate
defence:

```bash
node scripts/audit-store.mjs            # reads every store, reports, never mutates
node scripts/audit-store.mjs --strict   # exit 1 on an error, for CI
```

Run it before a release and after any batch of additions. It reports with
the evidence attached and changes nothing; the correction is a deliberate
commit that says why. The job that detects must not be the job that
destroys.

**Rebuilding a probe.** When a measurement tool is rewritten, its green
fixture suite proves it does what its author imagined, not that it measures
the world. Before calling the rewrite done, run the new tool over a site
that already has a published row in `references/benchmarks.md` and diff the
fields side by side. Near-total agreement is what makes any disagreement
diagnostic: when seven of nine fields reproduce to the pixel, the other two
are defects, not noise, and they are exactly the ones no fixture encoded.
Where a field legitimately differs, record why beside the row, so the
comparison stays a live check instead of decaying into noise.

**Cutting out images.** The cutout tool keeps its own venv, so nothing changes for the rest of the rig:

```bash
node scripts/cutout.mjs setup                  # remove-bg: venv + ~0.4 GB of weights, once
node scripts/cutout.mjs setup --with detect    # detect and mask: torch CPU + ~0.8 GB more
node scripts/cutout.mjs doctor
DF_DESIGN_CUTOUT_TESTS=1 node --test test/cutout.test.mjs   # the model tests, minutes on a laptop
```

A new model goes in `scripts/py/cutout-models.json` only after its **weights** licence has been read on the model card (a code licence is not enough), with a pinned revision, and with a row in `licenses/cutout-models.md`. The test suite refuses any licence other than MIT or Apache-2.0.

**Inking pictures.** The ink pass runs on the cutout venv's Python (or any Python with numpy and Pillow), and takes its colours from the brief:

```bash
node scripts/ink-pass.mjs doctor
node scripts/ink-pass.mjs ink raw/panel.png --out art/panel --brief docs/identity.md --width 3072,1200 --cutout person
node scripts/ink-pass.mjs layers art/panel@3072.png --out art --name panel --alpha art/panel.figure.png --brief docs/identity.md
```

The image model that makes the raw panels is not part of the repo: its runner, weights, licences and costs are in `references/drawn-assets.md` §7.

**Adding gates.** A gate is a row in `references/gates.md` §3 with a tier
and a class, and, when a script can settle it, an entry in `GATES`
(`scripts/lib/slop-static.mjs`) with its check and a line in the fixtures
that trips it. The test suite refuses a gate documented on one side only.
A gate is Floor only when no admired page breaks it on purpose; a rule the
measured sites break (the eyebrow, tracked caps) is Reflex, however common
the tell, because this skill's authority is the measurement, not the taste.

Design specs and implementation plans are gitignored on purpose — they are
working documents for whoever is driving a build, not part of the shipped
skill.

---

## Credits

Parts of this skill adapt [Hallmark](https://github.com/nutlope/hallmark)
(MIT, Copyright (c) 2026 Hallmark contributors): the gate list and its
tiers, the page anatomy by the visitor's job, the brand-truth protocol, the
redesign depths and the kept record, the two fresh-context reviews, the
patterns, and the capture script. Each was rewritten for this skill's stack
(Playwright, its own CLI and test conventions) and reconciled with its
evidence base; where the two disagree, the measurement wins and the file
says so. The licence is in `licenses/hallmark-LICENSE`.

The grammar of a drawn scroll story (`references/recipes-motion.md`
§17–§26, `templates/scroll-story.js`), the 3D character and drawn-effect
pipelines (`references/drawn-assets.md` §9–§10) and the live-world budget in
`references/techniques/yolo.md` adapt code, rules and figures from these
agent skills, all MIT. Each was read whole, only what serves this skill was
kept, and it was rewritten in this skill's voice and checked against the
YOLO reference sites; where a skill had nothing on a move, the recipe was
written from the recording. The map from each move to its sources is in
`references/yolo-references.md`, "Where each technique lives in df-design".

| Skills | Repository | Copyright | Licence |
|---|---|---|---|
| `gsap-core`, `gsap-timeline`, `gsap-scrolltrigger`, `gsap-plugins`, `gsap-utils`, `gsap-performance`, `gsap-frameworks`, `gsap-react` | [greensock/gsap-skills](https://github.com/greensock/gsap-skills) | GreenSock | `licenses/greensock-gsap-skills-LICENSE` |
| `gsap-scrolltrigger-storytelling` | [MengTo/Skills](https://github.com/MengTo/Skills) | Meng To | `licenses/MengTo-Skills-LICENSE` |
| `threejs-*` (13 skills) | [CloudAI-X/threejs-skills](https://github.com/CloudAI-X/threejs-skills) | CloudAI-X | `licenses/CloudAI-X-threejs-skills-LICENSE` |
| `blender-*` (28 skills) | [EL4CTEO/blender-skills](https://github.com/EL4CTEO/blender-skills) | EL4CTEO | `licenses/EL4CTEO-blender-skills-LICENSE` |
| `scenario-blender-grease-pencil` | [scenario-labs/skills](https://github.com/scenario-labs/skills) | Scenario Inc. | `licenses/scenario-labs-skills-LICENSE` |
| `comic-book-style` | [arjun988/blender-skills](https://github.com/arjun988/blender-skills) | blender-skills contributors | `licenses/arjun988-blender-skills-LICENSE` |
| The animation-principles pack (follow-through, secondary action, staging, spatial thinking, timing, transition and orchestrated sequences, gesture responses, loops, loading states, accessible motion, motion sickness and others) | [dylantarre/animation-principles](https://github.com/dylantarre/animation-principles) | Dylan Tarre | `licenses/dylantarre-animation-principles-LICENSE` |

The cards added from the template research of 2026-11-07 (the particle morph in High Particles, Fluid ink, Cursor-painted reveal, Glass object, Reflective water floor, Object that travels between sections, the page-layer recipes in the Fast cards, `recipes-motion.md` §16's pixel-block cut and §27) adapt rules and figures from these, also MIT, read the same way; the fluid solver's passes and constants come from Pavel Dobryakov's simulation, whose notice is also in the example page that ports it. The map is in `references/yolo-references.md`, in the same table.

| Skills or code | Repository | Copyright | Licence |
|---|---|---|---|
| `shader-dev` | [MiniMax-AI/skills](https://github.com/MiniMax-AI/skills) | MiniMax | `licenses/MiniMax-AI-skills-LICENSE` |
| `particle-system` | [iart-ai/webgl-animation-skills](https://github.com/iart-ai/webgl-animation-skills) | iart.ai | `licenses/iart-ai-webgl-animation-skills-LICENSE` |
| `animation-vocabulary` | [emilkowalski/skills](https://github.com/emilkowalski/skills) | Emil Kowalski | `licenses/emilkowalski-skills-LICENSE` |
| `build-threejs-scroll-worlds`, `cinematic-gsap-lenis-motion-system` | [MengTo/Skills](https://github.com/MengTo/Skills) | Meng To | `licenses/MengTo-Skills-LICENSE` |
| WebGL-Fluid-Simulation (code, adapted in `docs/examples/motion-techniques/fluid-ink/page.html` and the Fluid ink card) | [PavelDoGreat/WebGL-Fluid-Simulation](https://github.com/PavelDoGreat/WebGL-Fluid-Simulation) | Pavel Dobryakov | `licenses/PavelDoGreat-WebGL-Fluid-Simulation-LICENSE` |

The cards added from the component catalogue read on 2026-11-08 (Glass over moving light, Glass letters, Images that fray and smear, Type on geometry, CSS 3D objects, Stepped showcase and Dither, the cursor lens of Cursor-painted reveal, the exploded view and scan front of Wireframe 3D, the photograph-as-points of High Particles, the moves added to Physics and drag, `recipes-motion.md` §28 and the title-sequence rule of §24) adapt rules, code and figures from these, also MIT, read the same way. The catalogue itself is credited as research only: nothing of it is in the repository. The map is in `references/yolo-references.md`, in the same table.

| Skills | Repository | Copyright | Licence |
|---|---|---|---|
| `build-wireframe-scan-reveal`, `reveal-hover-effect`, `dither-background`, `horizontal-scroll-scenes` | [MengTo/Skills](https://github.com/MengTo/Skills) | Meng To | `licenses/MengTo-Skills-LICENSE` |
| `animaxxing-webgl` | [johnpolacek/animaxxing-skills](https://github.com/johnpolacek/animaxxing-skills) | John Polacek | `licenses/johnpolacek-animaxxing-skills-LICENSE` |
| `choreograph` | [emilkowalski/skills](https://github.com/emilkowalski/skills) | Emil Kowalski | `licenses/emilkowalski-skills-LICENSE` |

The demos inside those skills (third-party pages, fonts, pictures and a bundled copy of three.js) were read and not copied; the example pages are written from the skills' text and code. `animaxxing-webgl` asks the agent to install a GSAP framework skill; that step was not taken, and none of its code depends on it here. The libraries named in the new cards are loaded or named, never vendored: `@paper-design/shaders` (Apache-2.0), `troika-three-text` (MIT) and matter-js (MIT); none of the example pages loads them.

These licences cover the skills' text and code, not the libraries they
teach. GSAP itself, with every plugin (SplitText, Flip, MorphSVG and the
rest), is free for commercial use under GreenSock's own standard licence,
which is not MIT; read it before shipping a page that loads it. three.js is
MIT; Blender is GPL, which does not reach the files it renders or exports. Lenis (darkroomengineering/lenis) is MIT and is loaded, not vendored.

`references/recipes-design.md` also adapts guidance from Anthropic's
`frontend-design` skill (Apache-2.0), and `scripts/lib/browser.mjs` ports
the browser detector from the `impeccable` skill.
