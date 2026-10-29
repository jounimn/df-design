# Surface: home (the landing page)

Status: approved on stated assumptions (author absent), 2026-10-29. Built from this spec only. Amended after the two reviews (nav count, p99 row, two section heads, the hero loop control); the amendments are noted inline.

## Who, on what

A backend engineer or SRE evaluating a tracing tool, sent here from a GitHub README, a Hacker News thread or a
colleague's link. On a laptop at work (1440 wide, often a second screen), sometimes on a phone (390) from the
README. They have used Jaeger or an APM before and will leave if the page reads as marketing. They read the first
screen, scroll once to see the product, and either copy the install command or leave.

## Job: sign up (`anatomy.md`)

For a developer tool the install command is the action. It sits in the hero under the headline with its terms in
one line (version, licence), the nav carries "Start tracing", and the page ends on the install command again in
a short band. Never a newsletter close.

## Content and flows

Copy voice: the existing page's. Plain verbs, the product's nouns, no superlatives. Every figure on the page is
sample data inside a built trace and is marked as a sample in the caption or the handoff; nothing reads as a claim
about adoption or speed.

1. **Nav.** Wordmark and mark left; How it works, Integrations, Docs, Changelog; right: "GitHub" with the star glyph (no count: a
   star count nobody gave reads as proof) and "Start tracing" (quiet in the nav, so the hero spends the one filled
   orange action). Decided, not reflex: a
   developer tool's nav carries the repo and the action, and the hairline under it is the only rule the hero
   has above it.
2. **Hero.** Headline "See every request, end to end." Sub: what Tracewell does in two sentences. Actions:
   "Start tracing" (primary) and "Read the docs" (quiet). The install command `npm i @tracewell/sdk` with a
   copy control and its terms in one line beside it: v0.9, OpenTelemetry-native, Apache-2.0 (facts, in mono as
   data; no pill above the headline). Behind it the dot field; under it the request hairline crossing five hops
   (edge, auth, orders, payments, postgres). The type is the visual; the hairline is the signature in motion.
3. **How it works.** Left: a real sequence as an `<ol>` (instrument once, propagate context, read the waterfall)
   and, in a full-width row under both, the p99 figure for `orders.load-cart` at display size with its direction. Right: the trace waterfall for GET /checkout,
   212 ms, seven spans, one slow (payments.charge, 96 ms), drawn by CSS `view()` as it scrolls into view. This
   is the product at work, built as a sample because the product cannot be captured.
4. **What you see.** Two named moments, each a built screen beside its copy, alternating sides: the span detail
   (attributes, the span against its own p99) and the compare view (this deploy against the last, hop by hop).
   Not three tiles: two wide rows with mass.
5. **Instrument once.** The integration as a code sample with language tabs (Node, Python, Go) that work with
   scripting off (radio inputs; every panel shows in order without CSS). One filled line of copy above it.
6. **Run it on your own infrastructure.** Two columns, one hairline between them: Docker Compose (one command)
   and Kubernetes (the Helm chart), with where the data lives (Postgres or ClickHouse). No prices: the project
   is Apache-2.0 and there is nothing to charge for on this page.
7. **Questions.** Five `<details>` rows: sampling, retention, OpenTelemetry compatibility, overhead, the
   licence. The chevron is the only icon that moves here, and it moves because the state changed.
8. **Close.** The hero's action again in a short band: the install command and "Start tracing", nothing else.
9. **Footer.** One line: Tracewell is Apache-2.0 and built in the open; links: Docs, GitHub, Discord, Security,
   Changelog. Decided: a single-row footer suits a one-page tool; four link columns would be chrome by reflex.

## Density

Marketing density with instrument panels: 16px body at 1.55, 18.5px lede, 80px display; panels in 12.5px mono.
Controls 44px on the page, 34px in the nav. Sections 128px apart with the ground switching between the page
ground and the panel ground so the seams differ.

## How it carries the identity

The frozen tokens from the existing page, unchanged. The accent is spent on the request hairline, the slow span,
the primary action and the focus ring. Masks and blends do the compositing: the dot field fades under a radial
mask, the corner glow on the trace panel is a mask, the hairline is screen-blended. Motion is confined to the two
sections the author named (hero, how it works) plus the state changes of controls (copy to check, chevron); the
added bands are still. Every moving element has a resting state and the page reads whole with scripting off.

## Motion plan (fast tier, `techniques/fast.md`)

| Element | Card | Restates | Rest state |
|---|---|---|---|
| Dot field | Ambient dot grid, Dot grid as masks | services emitting spans | static dotted field, a few dots lit |
| Request hairline | Hairlines as masks, Additive blends | one request crossing five services, each hop lighting as the pulse reaches it | the pulse rests past the third hop, the passed hops lit |
| Hero loop control | patterns.md, A loop that can pause | the two ambient loops run past 5 s (WCAG 2.2.2) | paused off-screen, on hover and focus, under reduced motion; a visible Pause / Play button |
| Span waterfall | Scroll-linked (`view()`) | the trace being drawn where time went | every bar at full length, every status stamped |
| p99 counter | Counters that mean something | the latency after the cache fix, with its direction | the final number |
| Copy to check | Icons: state, not decoration | the command was copied | copy glyph |
| Question chevron | Icons: state, not decoration | the row opened | pointing down |

## Later

- A docs surface, if the author brings one: the same tokens, a three-pane layout, the mono for code.
- A 404 as a diagnostic readout (trace not found), same chrome.
- A hosted offering, if one exists later: a pricing table with its period switch belongs on this page then.
- Integrations as a logo row only if the author supplies real integration marks and their licences.
