# Gates

The one list of what this skill refuses to ship, and who checks each item: a
script, a browser, or your eye. `scripts/check-slop.mjs` settles every gate
tagged **M** (static) and **R** (render); the rest are walked by hand, at the
verification gate and in the reviews (`reviews.md`).

The list adapts Hallmark's gates (github.com/nutlope/hallmark, MIT, Copyright
(c) 2026 Hallmark contributors), reconciled with this skill's evidence. Where
Hallmark holds a **house rule** stricter than the field (the eyebrow, the
tracked-caps label, the words-per-screen budget), the thirty measured sites
in `benchmarks.md` break it on purpose: Stripe and Linear open sections with
eyebrows, Greptile tracks its mono step labels. Those gates are **Reflex**
here, not Floor: the default is still the tell, and a page that keeps one
says why on the record. The Hallmark id stays beside each gate so the two
lists can be read together.

---

## 1. How a gate binds

Every gate carries a **tier**, which says whether you may disagree with it:

- **Floor.** Never waivable. A gate is Floor when no admired page breaks it
  on purpose: correctness, access, honesty, and the bans every generator
  falls into. `FAIL`.
- **Reflex.** A default a language model falls into. A build with a real
  reason may waive one on the record (§2). `REFLEX` until fixed or waived.
- **Finish.** Craft detail, invisible at arm's length. Reported as `NOTE`,
  answered, never blocking.

**Class** says who checks it: **M** the static tier of `check-slop` (HTML
and CSS, inline `<style>` and linked local stylesheets); **R** the render
tier (`--render`, or `--url` for a dev server); **J** judged, by you, from
the rendered page. An M or R gate still has a judged half: the script names
the suspect, the eye confirms it.

**Grades:** `FAIL` (Floor, nothing ships) · `REFLEX` (fix or waive) ·
`WAIVED` (on the record, visible) · `WAIVER` (a waiver the script rejected:
it names a Floor gate, an unknown gate, or gives no real reason) · `NOTE`
(Finish). `FAIL` and `REFLEX` count separately, so "0 FAIL" stays a true
statement about the Floor.

**Scope.** `--scope app` (a dashboard, an admin, a tool someone works in)
skips the marketing-page gates: `three-tiles`, `vh-hero`,
`stock-second-action`, `invented-proof`, `one-face`, `safe-display-face`,
`named-look`, `fold`, `dead-half`, `word-budget`. `--scope component`
skips the page-level ones. Everything else binds, the Floor first.

**Tailwind and components.** The static tier reads HTML and CSS. A
framework project is checked through its rendered output: run the dev
server and pass `--url`, or point the static tier at the built CSS. It does
not read utility classes inside `.tsx` or `.vue` files.

---

## 2. Waivers

A Reflex gate is waived in the page itself, as an HTML comment or a CSS
comment, three fields separated by a middle dot:

```html
<!-- df-design · waive eyebrow · the step labels are the real order of a morning at the oven -->
```

```css
/* df-design · waive mono-costume · the hour labels are measurements the baker reads off the oven clock */
```

The reason is about this page and is at least 24 characters. A waiver
naming a Floor gate is rejected and the gate still fires. Every accepted
waiver prints as `WAIVED` so the record stays visible; the same gate waived
on every project is a house style, and a house style belongs in the
identity brief (`identity.md` §8), not in a waiver.

A redesign records what it gives up with `dropped` and `reworded`
(`redesign.md`, "After").

---

## 3. The gates

One line each. Tiers and classes are the truth; the script derives its
table from this file's companion, `GATES` in `scripts/lib/slop-static.mjs`,
and the two are tested to agree.

### Colour and surface

| Gate | Tier | Class | The tell | The fix | Hallmark |
|---|---|---|---|---|---|
| `gradient-ai` | Floor | M | A purple-to-blue or purple-to-pink gradient anywhere, gradient text included | One anchor hue, solid ink | 2a |
| `gradient-text` | Reflex | M | Gradient text in any other hue | Solid ink; weight or a display face | 2b |
| `literal-colour` | Floor | M | A colour literal outside the token block | Lift it into the tokens (`recipes-design.md` §2) | 48 |
| `named-look` | Reflex | M | Cream paper (L 88 or over, hue 55 to 105), a high-contrast serif display and a terracotta accent (hue 15 to 60) | Move one axis: the accent first, the paper second, the display last (`recipes-design.md` §7) | 65 |
| `glow` | Reflex | M/J | A zero-offset chromatic glow shadow, or a blurred colour blob behind text | Elevation by lightness; shadows with offset and blur | 29 |
| `uniform-radius` | Reflex | M | One large radius on everything | The measured CTA median is 6px; one radius per nesting level, sharp where the identity is sharp | F7 |
| accent footprint | Reflex | J | Accent past about 5% of any viewport without a reason in the brief: solid fills, large accent headings, full-bleed accent bands | One loud colour, spent once (`recipes-design.md` §2) | 23 |
| pure absolutes | Reflex | J | `#000` and `#fff` as ink and paper on a page with an anchor hue; zero-chroma greys | Bias the neutral toward the accent's hue | 7, 22 |
| contrast | Floor | J | Text, icon, focus ring or field edge under its threshold against what it is drawn over: body 4.5:1, large text, icons and rings 3:1; button text within a hair of its fill; grey text on a coloured surface | Fix the pair; probe computed colours (`verification.md`) | 40, 41 |

### Type

| Gate | Tier | Class | The tell | The fix | Hallmark |
|---|---|---|---|---|---|
| `safe-display-face` | Reflex | M | Inter, Roboto, Open Sans, Poppins, Lato, Space Grotesk or a system face as the display | A display face from the identity; 4 of 28 measured sites use Inter for display | 1 |
| `one-face` | Reflex | M | The display role is not filled: headings inherit the body face | Three roles, display clearly distinct from text (`recipes-design.md` §1) | 37 |
| `literal-font` | Floor | M | A `font-family` literal outside the token block | Lift it into the tokens | 48 |
| `italic-word` | Floor | M | One italic word inside an otherwise roman heading | A line break, or the whole head set one way | 38i |
| `accented-word` | Reflex | M/J | One word in a heading set apart by colour, weight, a highlight or an underline | The whole head one way; a line break; a second line at a second size | 38iii |
| `tracked-caps` | Reflex | M | A small label (15px or under) set uppercase or in small caps, or letter-spaced past 0.03em | The body face, a step smaller, sentence case, untracked | 67 |
| `mono-costume` | Reflex | M/J | A mono face on labels, captions, meta rows or table heads when neither display nor body is mono and the content is not code, a figure or a unit | Mono labels real data, or nothing (`recipes-design.md` §1) | 64 |
| `measure` | Floor | R | Running text wider than 90 characters a line | `max-width: 65ch`; 60–70ch sans, 75ch serif at most | 25 |
| `text-strain` | Reflex | R | Running text rendered under 12px | Body 16px at 1.5 to 1.65; labels one step smaller | 75 |
| caps leading | Reflex | J | An uppercase display head that can wrap at `line-height` under 1.0 | 1.0 at least, 1.02 to 1.08 recommended | 55 |

### Structure and layout

| Gate | Tier | Class | The tell | The fix | Hallmark |
|---|---|---|---|---|---|
| `card-in-card` | Floor | M | A card inside a card | One containment layer | 4 |
| `three-tiles` | Reflex | M/J | Three equal icon-above-heading tiles | None of the thirty measured sites do it: vary widths and heights, inline the icons | 3 |
| `vh-hero` | Reflex | M | A height in `vh` | `dvh` or `svh`, so the phone address bar does not cut the hero | 6a |
| `overflow-hidden` | Floor | M | `overflow-x: hidden` on html or body (it breaks sticky); a `100vw` width | `overflow-x: clip` on both; `width: 100%` | 34 |
| `horizontal-scroll` | Floor | R | The page scrolls sideways at any width from 320 to 1920 | `overflow-x: clip`; tables, code and diagrams in their own `overflow-x: auto` container (`recipes-design.md` §6) | 34 |
| `bare-1fr-image-track` | Reflex | M | An image-bearing grid track on bare `1fr` | `minmax(0, 1fr)`; display heads carry `overflow-wrap: break-word; min-width: 0` | 50 |
| `sticky-collision` | Reflex | M | Two `position: sticky; top: 0` rules | `top: var(--nav-height)` on the second | 56 |
| `fold` | Floor | R | The hero's headline or primary action is not visible at 1280 x 800 without scrolling | Pull the display clamp down, tighten leading, trim padding; the hero is the first screen | 44b |
| `dead-half` | Reflex | R/J | A hero whose content stops in the left half of a 1440 canvas with nothing on the right | Fill it with the product, centre the composition, or frame the column in a band (`recipes-design.md` §6) | 44c |
| `container-cap` | Reflex | R | At 1920 the gutters stay under 120px: the container is not capped and centred | Cap the container (1360 to 1520) and centre it; at 1920 the gutters grow, the measure does not | 44d |
| `word-budget` | Finish | R | A 900px window at 1440 holding more than about 120 words | One idea per screen; sections become objects | 58 |
| template shape | Reflex | J | Hero, three features, a call to action, a footer; or the same shape as the last project | Build from the job's anatomy (`anatomy.md`) and the subject's own world (`recipes-design.md` §5) | 8 |
| same seam | Reflex | J | Every section separated the same way with the same gap | Switch the ground between chapters; climb different rungs of the surface ladder in different places (`recipes-design.md` §3) | 9, 59 |
| hero shape | Reflex | J | Title, lede, action and mark all stacked on one centred axis, or a hero taller than one screen with nothing to fill it | At most two centred elements; break one alignment | 6b |
| thin section | Reflex | J | Below the hero, a body spanning under three quarters of the container that is not a statement; a section with no mass (no visual 300px tall, no set of three across, no table of three rows) | Widen the body, add a visual, set a statement, or merge the section | 77 |
| small heads | Reflex | J | The median `h2` below the hero under 40px at 1440 | `h2` at the section size, item titles at the title size | 78 |
| dead band | Reflex | J | More than 160px of nothing between the hero's lowest content and the fold | Centre the content and grow the visual or the head; never fill with copy | 79 |
| crowded head | Reflex | J | A heading nearer what precedes it than what it heads | At least twice the space above a head as below it | 71 |
| cramped box | Reflex | J | Text in a filled box within 8px of its sides, or running text within 8px of a phone's edge | Pad the box; a 16px gutter | 72 |

### Chrome and copy

| Gate | Tier | Class | The tell | The fix | Hallmark |
|---|---|---|---|---|---|
| `eyebrow` | Reflex | M/J | Short inert type before a heading that announces it, in any geometry (stacked, beside, pill, ordinal, category tag over a card, `TRUSTED BY` over logos) | Open the section another way; keep it only where it carries a fact, a destination or a real sequence (`recipes-design.md` §4) | 54 |
| `middle-dots` | Reflex | M | A meta string joined with middle dots (`A · B · C`) | Line breaks, columns or hairlines; one dot in a byline at most | 63 |
| `arrow-glued` | Reflex | M | An arrow glued to link or button text (`Learn more →`) | A verb as the label; the link already says it goes somewhere | 63 |
| `word-dash-label` | Reflex | M | A `WORD — fragment` label | Say the thing as a sentence or a heading | 63 |
| `numbered-markers` | Reflex | M/J | Ordinal markers (`01 / 02 / 03`) on content that is not a sequence | A real `<ol>` when the sequence is genuine; nothing when it is not | 66 |
| `stock-second-action` | Reflex | M | A stock action label (Learn more, Get started, Book a demo) | The button says exactly what happens (`recipes-design.md` §9) | 19 |
| `buzzwords` | Reflex | M | Seamless, robust, empower, supercharge, elevate, effortless, unlock, unleash, next-generation, world-class, best-in-class, industry-leading, mission-critical, future-proof | Say what the product does, in its own nouns | 19 |
| `placeholder-copy` | Floor | M | Lorem ipsum, a placeholder person (Jane Doe), a placeholder company (Acme) | The brief's real content, or plausible specific copy for this subject | 19 |
| `invented-proof` | Reflex | M/J | A figure that reads as proof (Trusted by 50,000+ teams, 10x faster) with no source | The author's own number with its source, or nothing. The judged half is Floor: an invented metric, testimonial, logo wall or case-study count never ships | 46a |
| `em-dash` | Finish | M | Em or en dashes in the copy, the punctuation of generated text | A comma, a colon, a full stop or parentheses | 19 |
| chrome by reflex | Reflex | J | The AI nav (wordmark left, inline links, button right, hairline under) or the AI footer (four link columns, social row, copyright) without a decision behind it | Decide the chrome from the identity and the job, and say so in the surface spec | 42 |
| decoration text | Reflex | J | Rotated vertical text with nothing to say, scroll cues, a version badge or `BETA` pill in the hero, a city-and-weather strip, a `01 / 4` count on tiles | Delete it; a lost fact becomes a caption or a footer line | 66 |
| the echo | Reflex | J | One fact (a price, a time, a count) printed in four or more sections, or a section's last line restating its heading | Say each fact once, where it does work | 69 |
| fake send | Floor | J | A form that prints success ("Sent", "You're on the list") with no request behind it | An empty `data-endpoint` and no success state until the form is wired (`patterns.md`) | 70 |
| wireframe page | Reflex | J | More than five empty image slots on one page, or four in a row (blank portraits, blank bottles) | Set the set in type; a slot that stays holds a real image | 68 |
| stock close | Reflex | J | The last section is an email sign-up on a page whose job is not one where a mailing list is native | End on what the visitor came to do, in the form the job takes (`anatomy.md`) | 85 |

### Motion and interaction

| Gate | Tier | Class | The tell | The fix | Hallmark |
|---|---|---|---|---|---|
| `transition-all` | Floor | M | `transition: all` | List the properties | 10a |
| `animates-layout` | Floor | M | A keyframe or transition on width, height, top or left | `transform` and `opacity` (`recipes-motion.md`) | 10a |
| `reduced-motion` | Floor | M | Motion present with no `prefers-reduced-motion: reduce` fallback | Add it: the reduced-motion contract in `recipes-motion.md` | 27 |
| `hidden-at-rest` | Floor | M | A reveal class setting `opacity: 0` or `visibility: hidden` with no `.js` scoping and no self-running animation, so the page ships blank when a script fails | Visible by default; hide only under a `.js` class the script adds, or animate from visible with `@starting-style` | 62 |
| `hidden-without-script` | Floor | R | With scripting off, headings, text or images stay invisible | Same fix, measured | 62 |
| `focus-visible` | Floor | M | No `:focus-visible` styling anywhere, or an outline removed with nothing in its place | A ring at 3:1 or better on every interactive element | 26a |
| `focus-ring` | Floor | R | Tabbing reaches an element with no visible focus state | Same, measured by tabbing | 26a |
| `focus-fades` | Floor | M | A focus ring that transitions in | Instant | 15 |
| `autoplay-unmuted` | Floor | M | A video autoplaying without `muted` | `autoplay muted loop playsinline` | 28a |
| hover on everything | Reflex | J | The same lift or scale on every card; an image scaling on hover; a hover state on a non-interactive element | One signal per element, on the container, never on the image | 11 |
| bounce | Reflex | J | Overshoot easing on UI state | Exponential ease-out; the signature curve in `recipes-motion.md` | 12 |
| the loop | Floor | J | Auto-rotating or looping content past 5 seconds with no pause on hover and focus and no visible pause control | `patterns.md`, "A loop that can pause" (WCAG 2.2.2) | 18 |
| eight states | Reflex | J | A control with no `:active` or `:disabled`; input borders that shift between states; a focus ring built from `border` | All eight states; constant border, `outline`, shared height (`patterns.md`) | 26b, 39a |

### Assets and access

| Gate | Tier | Class | The tell | The fix | Hallmark |
|---|---|---|---|---|---|
| `emoji-icon` | Floor | M | An emoji standing in for an icon | The one icon set the identity chose (`icons-and-assets.md`), or the word alone | 30a |
| `decorative-svg` | Floor | M | An inline `<svg>` with neither `aria-hidden="true"` nor a label | Hide it or name it | 33 |
| `img-alt` | Floor | M | An `<img>` without `alt`, or without a source | `alt=""` when decorative, a description otherwise | 76 |
| `broken-image` | Floor | R | An image that does not load | The real file at the path the page uses | 76 |
| `doc-basics` | Finish | M | No `lang`, no `<title>`, no viewport meta, no description | Add them | F23 |
| `heading-skip` | Finish | M | A heading level skipped | One level at a time | F21 |
| `overflow-undeclared` | Finish | M | Neither html nor body declares `overflow-x` | `clip` on both; the render tier measures the real scroll width | 34 |
| drawn illustration | Reflex | J | An inline SVG or CSS figure of an object, plant, animal, person, product or scene past icon size, where a photograph or the product belonged | A photograph under the author's yes (`images.md`), the product captured (`scripts/capture.mjs`), or type at scale | 80 |
| empty picture | Reflex | J | An image slot or gradient block 300 x 200 or larger showing nothing but its wash | The author's image, an approved stock image, or the product | 81 |
| counting marks | Reflex | J | 24 or more identical marks standing for a quantity | Set the number in type | 82 |
| photo wall | Reflex | J | Below the hero, photographs cover more than about a third of the page, so it reads as a stock gallery | Keep the strongest pictures, set big; carry the rest in the identity's own material | 83 |
| fake product | Reflex | J | A built mock of a product that exists and could be reached, or a drawn interface where a screenshot belonged | Run it and capture it (`scripts/capture.mjs`); frame the captures in the identity | 84 |
| browser chrome | Floor | J | A hand-drawn browser bar (traffic lights, URL pill) or OS title bar | A real screenshot in a `<figure>`, or no chrome | 47a |
| device frames | Reflex | J | A phone, laptop, terminal or editor frame; more than one | One frame with real content inside, or none | 47b |
| text under an element | Floor | J | A line of text painted under an opaque box, an image or another run of text | Give the text its own space | 73 |
| icon libraries | Reflex | J | Two icon libraries on one page | One set (`icons-and-assets.md` §0) | 30b |

---

## 4. Finish checks

Reported and answered, never blocking: straight quotes in prose · `...` for an
ellipsis · more than one filled-primary button recipe on a page, or two filled
buttons side by side · an icon in a coloured coin · display-size figures
without tabular numerals · more than one scroll-choreography pattern · a flex
row of unequal heights without `align-items: center` · a helper-text slot with
no reserved `min-height: 1lh` · page invariants broken (more than one primary
button style, container width, column gap below the hero or radius per nesting
level; more centred heading groups than left-aligned ones) · browser surfaces
unthemed on a committed palette (`::selection`, `caret-color`,
`scrollbar-color`) · a text block squeezed into a sliver at 1440 · more than
three font weights in running use · a grid leaving one item alone on its last
row · justified text without `hyphens: auto` · a hairline border under a wide
soft shadow on one surface · content a phone never gets (40 words or more
shown at 1440 and hidden at 375, navigation aside) · a paragraph leaving one
word on its last line, or a head ending on a stub.

---

## 5. Judged clauses

The gates a script cannot settle, with enough to judge them well.

**The eyebrow test.** Small type before a heading survives only when it
carries a fact, a destination or an identifier the reader would otherwise
lack. Delete the line and read the page: if nothing was lost but a name for
what comes next, it was an eyebrow. The fix is never bare deletion. Where
the heading under it is figurative, the plain label becomes the heading
(*Opening hours* over *When to find us* becomes *Opening hours*). Twelve
other ways in: nothing (air above, the heading flush); the heading announces
itself in its first two words; a lead-in inside the paragraph in a heavier
weight; a drop cap, one a page; a rule that does more than rule; a numeral
at graphic scale, only when the number is real and is the point; a real
`<ol>` with `counter()`; a caption below instead of a label above;
marginalia; a change of paper; a running head or folio; persistence (the
heading stays while its content scrolls). Greptile's `STEP 01` eyebrows pass
because the steps are a sequence (`recipes-design.md` §4).

**Tracked caps.** The small uppercase line with its letters spread apart,
whether above a heading, heading a table, naming a tag or running the nav.
Delete the transform and the tracking and read it again: a label in the body
face a step smaller says the same thing without announcing that a machine
set it. Capitals survive as a wordmark, as a lettering device the identity
names, and as the display voice of an identity built on them.

**The screen budget.** Nobody reads a landing page. A visitor takes one idea
per screen or leaves. The measured pages are long (median 9,329px) because
they have many ideas, not because each screen is dense. A screen is a head
block, then its composition: a visual, a set of three, a table, a statement.

**Hidden at rest.** Reveal patterns must be visible with scripting off. The
safe shapes: `.js .reveal { opacity: 0 }` with the class added by the
script, a CSS animation from visible that reduced motion collapses, or
`@starting-style`. `patterns.md` has the working version.

**Template punctuation.** The middle dot as a universal separator, the arrow
as a universal suffix and the coloured dot as a universal prefix are the
punctuation of generated pages. One dot in a byline, a marquee's separator
and a dot that conveys live state are legal.

**The named look.** Cream, high-contrast serif, terracotta: the most
recognised generated look, and the one a warm, bookish or family brief pulls
a model toward hardest. `recipes-design.md` §7 names the whole cluster. An
identity that genuinely lives there (a letterpress printer, a Victorian
course) takes its most specific reading, with its own medium, era and place,
and waives the gate on the record.

**The accented word.** One word in the accent colour, in bold or on a
highlighter band: after the eyebrow, the most common machine-made head. A
head is one weight, one style and one colour. An identity whose signature is
the misregistered or coloured word (a riso print, a manifesto) places it
once, in the hero, and waives the gate.

**Decoration text.** The agency-portfolio tics: rotated labels, scroll cues,
version pills, city-and-weather strips, mono-caps strips under the hero,
credit lines under stock images. Each says "designed" without carrying a
fact. A fact stays; a decoration goes.

**The wireframe page.** A page that promises material it does not have shows
it as frames: six blank portraits under "Six instructors", four empty phones
in a row, four grey bottles. Set the set in type, and keep a slot or two
where the author's images will land, each holding an approved image or the
product.

**The echo.** A thin brief tempts a builder to say its few facts again: the
price in the hero, on every card, in the FAQ and the footer. Say a fact once,
where it does work.

**The fake send.** A form that answers "Sent" to nobody is an invented
outcome, as dishonest as an invented metric. Until the endpoint exists, the
form validates, posts nowhere and says so plainly.

**A full page (thin section, small heads, dead band).** The failure these
catch is the opposite of clutter: a page of small things on a wide canvas. A
screen holding only a heading and a line, a narrow column with the right
half empty, a 36px section head under an 84px hero, a hero whose content
stops at 60% of the screen. The fix is mass, never more words and never a
smaller gap: a bigger visual, a wider body, a head at the section size, a
statement set large. `recipes-design.md` §3 and §6 hold the compositions.

**Pictures (drawn illustration, empty picture, counting marks).** A page
that shows nothing real reaches for three substitutes: a drawing of the
thing, a coloured box where the photograph should be, and a row of marks
that counts what the copy could state. Each reads as generated at a glance.
Ask for the photograph (`images.md`), capture the product
(`scripts/capture.mjs`), set the number large.

**The photo wall.** The opposite failure: a page that is all photographs,
one after another, reads as a stock gallery, and the identity never gets to
speak. Keep the pictures that carry a fact, set them big, and build the
sections between them from the identity's own material: type, figures, the
product, a table, a device drawn from the subject's world.

**The fake product.** Ask where the product is before building one. A brief
that names an app, a site or a tool that exists, a folder holding its code,
or a URL means the page shows captures of it: the main screen, a detail, a
second screen, the phone view. A built mock is right only for a product not
built yet.

**The stock anatomy.** The email-field close is the visible part of a
deeper habit: hero beside a picture, a figure row, three steps, a split, a
showcase, an email band. Judge the whole page against `anatomy.md`: is the
job's action where real sites in the category put it, are the category's
own sections here (the menu, the lineup, the issues, the record), and could
this exact sequence of sections sit under a different business's name? If it
could, the page has no anatomy of its own yet.

**Contrast.** Probe computed colours, do not squint (`verification.md`).
Body text 4.5:1 against what it is drawn over; large text, icons, focus
rings and field edges 3:1. Button text within a hair of its fill, a dark
panel that does not swap its text colour and grey text on a coloured
surface are the usual failures.

---

## 6. When the gates run

| Moment | What runs |
|---|---|
| Each audition, before it is shown (`audition.md` §3) | `check-slop <auditions/> --render` beside `check-auditions`; a candidate that fails the Floor is fixed before the author compares |
| Each surface, after the build, before the verification gate | `check-slop --render` until 0 FAIL and every REFLEX fixed or waived; then the judged gates in §3 and §5 from the screenshots it wrote |
| A redesign | `check-kept record` before, `check-kept check` after (`redesign.md`) |
| The reviews (`reviews.md`) | The reviewer reads this file's §3 and §5 and the screenshots; never the CSS, which the script has already read |

Nothing ships with an open `FAIL` or an open `REFLEX`. A Floor finding is
fixed; a Reflex finding is fixed or waived; a Finish note is read and
answered. A fabricated pass is itself slop.
