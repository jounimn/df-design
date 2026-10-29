# Identity: Tracewell

`df-design: path=design mode=motion scope=landing page (home) watermark=none load=fast selling=now tier=fast — "Open-source distributed tracing. Settled brand: near-black, one signal-orange accent, Söhne + JetBrains Mono, 4px corners. The landing page feels dead. Add motion to the hero and 'how it works'. Keep it fast. Motion we admire: linear.app." Author absent: every question answered from the README section and the existing folder, proceeding on stated assumptions.`

```markdown
# Identity: Tracewell
Conditions:    Scope: the landing page only; no other surface exists in the brief. Constraints: the brand is
               settled and frozen (near-black ground, one signal-orange accent, Söhne for display and UI,
               JetBrains Mono for data, 4px corners); mode is motion, so palette, type scale and radius are read
               from the existing page and not changed. Answers given early: path=design (no auditions), the
               reference linear.app is "motion we admire", loading must stay fast. Note: "the landing page feels
               dead", so the motion has to carry meaning, not decoration. Assumed (author absent): Playwright
               allowed; watermark none; no stock images (the existing assets.md records the author declined
               them); selling=now with the presentation at the site's tier (fast); the surface spec approved as
               written; the sign-up anatomy may add static bands below the two the author named, so long as
               the motion stays in the hero and "how it works" and the page stays fast.
Intent:        A developer should feel, in the first screen, what the product does: a request crossing services,
               a trace drawn where the milliseconds went. Serious, fast, built by engineers for engineers; the
               page should feel alive without ever feeling marketed. "See every request, end to end."
Practical:     Language: English (en). Locale: none needed (no prices, no dates). Flows: the sign-up action is the
               install command (`npm i @tracewell/sdk`) and "Start tracing"; the project is open source and
               self-hosted, so there is no account to create on this page; "Read the docs" is the quiet second
               action. Users: backend engineers and SREs evaluating a tracing tool, on a laptop at work, often
               with a second screen; some arrive from a GitHub README on a phone. Devices: 1440 desktop first,
               390 phone second. Assets given: wordmark and mark on the existing page; copy voice from the
               existing page; sample trace data (GET /checkout, 212 ms, payments.charge slow) marked as a sample.
Grammar:       Type: Schibsted Grotesk (SIL OFL) standing in for Söhne, display 80px at -0.045em and UI 13 to 18px;
                 JetBrains Mono for data only (service names, durations, trace ids, the install command, code).
               Colour: ground #0B0D10, panel #101318, lines #1D2229 / #2A3039, ink ladder #E9EBEE / #A3AAB4 /
                 #6B737E, one accent #FF6A1A spent on the request hairline, the slow span, the primary action and
                 the focus ring; dark-only, colour-scheme dark.
               Geometry: 4px radius on controls and panels, 2px on span bars, 1px hairlines; a 1200px container
                 with 32px gutters; no shadows, elevation by lightness.
               Surface: a masked dot field behind the hero, a corner glow as a mask on the trace panel, screen
                 blends for the hairline; no photography, no illustration; the product's own screens are the
                 pictures.
               Motion: one signature curve, Linear's weighted ease cubic-bezier(0.32, 0.72, 0, 1), on about 80% of
                 transitions; feedback 150ms, content 300ms. Every move restates tracing: dots fire like services
                 emitting spans; one orange hairline crosses the hero like a request crossing services; the span
                 waterfall draws itself with CSS view() as the reader scrolls; the p99 counter counts to its
                 value in tabular mono; the copy icon swaps to a check; the question chevron turns. Every element
                 has a finished resting state; the page works with scripting off.
               Voice: plain verbs, sentence case, the product's own nouns (span, hop, trace, p99); buttons say
                 what happens ("Start tracing", "Copy install command"); no superlatives.
Origin:        linear.app (INTERACTION only, probed 2026-10-15 in `benchmarks.md`): the staggered dot grid, corner
                 glow as a mask, screen blends on a dark ground, the weighted curve. Left: Linear's palette,
                 gradients and type. The brand outranks it.
               Library: Dark product precision (`identities/industry.md`), the family the settled brand already
                 lives in; its trap (near-black plus one accent with no masks or blends) is what the motion plan
                 answers.
               The subject's own world (`recipes-design.md` §5): the trace waterfall, the W3C traceparent header,
                 the service hop, the p99 threshold, the install command. The waterfall is the page's signature.
Never:         A hero that is a centred stack with a pill above it; three icon tiles; a gradient wash or a blurred
               blob; mono on labels that carry no data; an email sign-up close; invented adoption figures,
               testimonials or logo walls; a second accent; Linear's purple or its gradients; entrance fades on
               every section; any motion that does not restate tracing.
Icons:         Lucide (lucide-static v1.52.0, ISC), inlined, stroke 1.5 to match regular-weight UI text, sized to
               cap height (13.5 to 15px), currentColor, aria-hidden beside a label. Chosen over Tabler for its
               24px grid and round joins, which sit with the grotesk at 13 to 15px; the page needs about twelve
               glyphs. Set: star, arrow-right, book-open, copy, check, circle-check, triangle-alert,
               chevron-down, terminal, box, database, git-branch. Record: `assets.md`.
Images:        The author declined stock images (recorded in the existing `assets.md`); none used. The product's
               own screens, built in HTML as samples, are the only pictures. Asset record: `assets.md`.
Loading tier:  fast, the author's choice ("Keep it fast"), confirmed after Assets with no images to price: two
               Google Fonts families (about 60 KB), about 1 KB of plain JavaScript (dot generation, copy button,
               the waterfall fallback, the counter), no library. The tier message named what medium (a sticky
               scroll story, +30 to 40 KB) and high (a live WebGL service graph, +150 to 300 KB with a fallback)
               would add; fast does everything this identity needs.
Surfaces:      landing page (home): in scope. Docs, app, admin, 404: not in the brief, untouched and not designed.
```

## Surface ledger

| Surface | Spec | Approved by author | Implemented | Verified |
|---|---|---|---|---|
| home | surfaces/home.md | assumed, 2026-10-29 (author absent; proceeding on stated assumptions) | yes | yes: check-slop Floor 0 FAIL · Reflex 0 (1 waived: invented-proof, sample data) · Finish 1 note · check-motion fast: no check failed · hero-review: subagent · fix · 5 findings · 5 resolved · finish-review: subagent · fix · 8 findings · 7 resolved 1 partial · gap: phone signature, resolved · looked at 1440 + 390 + mid-motion · open: ink 3 contrast 4.06:1 (brief change, author) |

Detail in `verification.md`. Consistency check (`identity.md` §10): one surface in scope, so it runs on home alone and on the presentation; no other surface exists to clash with.

## Tier message, as sent with the direction (design path, motion mode)

Loading cost: how heavy the site is to load. Pick one:

1. Fast expensive loading (recommended): the dot field, the request hairline, the span waterfall drawn by CSS
   scroll-driven animation, the p99 counter and the copy-to-check icon, all in CSS and about 1 KB of plain
   JavaScript. Cost: about 60 KB first load, almost all of it the two font families; works without JavaScript.
2. Medium expensive loading: a sticky scroll story where the copy holds still while the trace draws hop by hop.
   Cost: +30 to 40 KB of script (a small motion library) and one more section.
3. High expensive loading: a live WebGL service graph in the hero, nodes lighting as requests cross them.
   Cost: +150 to 300 KB of script, GPU work, and a poster fallback for reduced motion and older machines.

Fast does everything this identity needs. Recorded answer (author absent, README): fast.

## Selling-positioning offer

Offered after the brief (design path): now, at the end, or skip, with the time warning. Recorded answer (brief):
now, presentation tier fast, the site's tier. See `selling-positioning/`.
