# Benchmarks

Measured 2026-09-15. Thirty sites loaded at 1440x900 in headless Chromium,
scrolled two viewports and back, then interrogated for computed styles,
loaded font faces, network requests matching known animation libraries, and
element counts by CSS feature. Twenty-eight yielded usable hero metrics
(Observable and Infinite Machine render their hero without an `h1`).

These are facts about what shipped, not opinions about what is good. Where a
recipe in this skill cites a number, it comes from here.

## Aggregate

| Measure | Min | Median | Max |
|---|---|---|---|
| Hero font-size | 44px* | **64px** | 112px |
| Hero letter-spacing | -0.07em | **-0.025em** | ~0 |
| Page scroll height | 4,355px | **9,329px** | 25,051px |
| Distinct loaded faces | 2 | **5** | 8 |
| CTA corner radius | 0px | **6px** | 100px (pill) |

\* Excluding two outliers where the `h1` is a small eyebrow above a larger
styled span (Lovable 18px, Cube 38px). Stripe's 44px is genuine — it pairs a
small hero with a very large media stage.

| Proportion | Count |
|---|---|
| Ships a monospace or instrument face | **25 / 28 (89%)** |
| Uses Inter (or Inter Variable) as the **display** face | **4 / 28 (14%)** |
| Honours `prefers-reduced-motion` in CSS | 19 / 28 (68%) |
| Hero centred | 13 / 28 | 
| Has a `<canvas>` | 12 / 28 |
| Uses WebGL | 6 / 28 |
| Has `<video>` | 8 / 28 |

## The mask/blend/clip finding

The single strongest correlate of a page reading as "premium" is not
animation count. It is the number of elements using `mask-image`,
`clip-path` and `mix-blend-mode`:

| Site | Total | mask | blend | clip |
|---|---|---|---|---|
| posthog.com | 164 | 115 | 2 | 47 |
| stripe.com | 99 | 4 | 5 | 90 |
| fibery.io | 94 | 43 | 0 | 51 |
| cerebrium.ai | 85 | 18 | 0 | 67 |
| linear.app | 54 | 25 | 16 | 13 |
| lovable.dev | 48 | 6 | 2 | 40 |
| neon.tech | 48 | 23 | 0 | 25 |
| hex.tech | 45 | 25 | 0 | 20 |

A page scoring zero here will read flat regardless of how its transitions
are tuned. The implementations are in `recipes-motion.md` and
`recipes-design.md`.

## Easing curves actually shipped

Taken from computed `transition-timing-function` counts, not from
tutorials:

| Curve | Where | Instances |
|---|---|---|
| `cubic-bezier(0.25, 1, 0.5, 1)` (easeOutQuart) | Stripe | 435 |
| `cubic-bezier(0.32, 0.72, 0, 1)` | Linear — its signature | 30 |
| `cubic-bezier(0.16, 1, 0.3, 1)` (easeOutExpo) | Stripe | 20 |
| `cubic-bezier(0.165, 0.84, 0.44, 1)` | Stripe | 58 |
| `cubic-bezier(0.4, 0, 0.2, 1)` (Material standard) | Neon | 111 |

Note what this says: the curve most design systems reach for by default —
Material's `(0.4, 0, 0.2, 1)` — is the *least* characterful of the set. The
sites that read as premium decelerate far harder. `(0.25, 1, 0.5, 1)` and
`(0.32, 0.72, 0, 1)` both arrive fast and settle long, which is what reads
as weight.

## Durations actually shipped

| Band | Values observed | Use |
|---|---|---|
| 0.1 – 0.2s | Linear 0.1s (267x), hex 0.15s (1320x), Neon 0.2s (100x) | Hover, press, focus — interaction feedback |
| 0.25 – 0.4s | Stripe 0.3s (435x), hex 0.25s, Linear 0.4s | Content transitions, reveals, menus |
| 0.7 – 0.8s | Stripe 0.8s (58x), Linear 0.7s | Showpiece moments only, sparingly |

## Typography observations

**Nobody ships one face.** The median site loads five. The recurring shape
is display + text + mono, often with a fourth for a specific device.

**The mono is doing a job.** In the data and developer niche it is close to
universal (89%) and it signals "there are real values behind this". Several
sites push further with an *instrument* face that evokes measurement
hardware — Tinybird's `sevenSegment`, WorkOS's `Enhanced dot digital 7`,
Vercel's `GeistPixel`, Dovetail's `PP Mondwest` bitmap serif. This is a
cheap, highly specific identity device and it is almost always used for one
small element, never for running text.

**Display faces are rarely the obvious ones.** Observed: Aeonik Fono, PP
Formula SemiExtended, Söhne, Untitled Sans, Domaine (a serif), APK Protocol,
Matter Mono, basier, Aspekta, polymath, Suisse Intl, ABC Favorit, familjen,
cosmosOracle, Camera Plain, Helvetica Now Display, IBM Plex Serif
(Railway — a serif in a developer tool), RoundHog. Where a Google face
appears it tends to be Outfit, Manrope, Funnel Display, Poppins or Lato —
not Inter.

**Tracking gets aggressive with size.** At 60px and up the median is
-0.025em; WorkOS runs -0.07em at 80px and Vercel -0.06em at 64px. Tight
tracking at display size is most of what separates a "big heading" from a
designed one.

## Section structure

Median page: 9,329px over 8–16 bands. Several switch ground colour between
bands rather than running one canvas the whole way down — ClickHouse 3
distinct section grounds, Cube 4, dbt 3, MotherDuck 3, Stripe 4. Greptile
switches from a warm gray to a dark violet-slate for its "how it works"
band, which is what makes that band read as a separate chapter.

Sticky-positioned elements drive the scroll narrative: Observable 27,
ClickHouse 3, Cosmos 3, Metabase 3, Hex 2, Monte Carlo 2, Vercel 2.

## Per-site data

| Site | Display face | Hero px | Tracking | Faces | Mono | Ground | Accent | Radius | Masks+blend+clip | Sticky | RM rules | Height |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| atlan.com | Funnel Display | 60 | -0.020em | 8 | yes | `rgba(0, 0, 0, 0)` | `rgb(255, 255, 255)` | 0px | 15 | 1 | 14 | 9634 |
| cerebrium.ai | ABC Favorit Trial | 86.0864 | -0.025em | 3 | yes | `rgba(0, 0, 0, 0)` | `rgb(255, 72, 139)` | 7px | 85 | 2 | 1 | 10870 |
| clickhouse.com | basier | 96 | — | 8 | — | `rgb(19, 19, 18)` | `rgb(22, 101, 52)` | 0px | 12 | 3 | 3 | 10035 |
| cosmos.so | cosmosOracle | 74 | -0.050em | 4 | yes | `lab(100 0 0)` | `lab(3.63782 -0.00000745058 0)` | 3.35544e+07px | 9 | 3 | 2 | 6196 |
| cube.dev | Inter | 38 | -0.030em | 8 | yes | `rgb(255, 255, 255)` | `rgb(17, 17, 24)` | 6px | 1 | 1 | 9 | 6966 |
| datafold.com | Aspekta 400 | 72 | — | 5 | yes | `rgb(255, 255, 255)` | `rgb(53, 111, 255)` | 4px | 8 | 0 | 0 | 4355 |
| dovetailapp.com | Inter | 112 | -0.018em | 3 | yes | `rgba(0, 0, 0, 0)` | `rgb(10, 10, 10)` | 8px | 21 | 1 | 0 | 17732 |
| fibery.io | Suisse Intl | 64 | — | 4 | — | `rgb(250, 235, 214)` | `rgb(37, 29, 26)` | 6px | 94 | 0 | 0 | 11270 |
| getdbt.com | polymath | 64 | — | 4 | yes | `rgba(0, 0, 0, 0)` | `rgb(255, 255, 255)` | 12px | 11 | 1 | 0 | 7998 |
| grafana.com | Poppins | 60 | -0.025em | 6 | — | `rgb(244, 244, 246)` | `rgb(27, 85, 245)` | 8px | 4 | 1 | 1 | 9202 |
| hex.tech | PP Formula SemiExtended | 74 | -0.025em | 8 | yes | `rgb(20, 20, 28)` | `—` | — | 45 | 2 | 2 | 10506 |
| linear.app | Inter Variable | 64 | -0.022em | 2 | yes | `rgb(8, 9, 10)` | `rgb(94, 106, 210)` | 0px | 54 | 0 | 7 | 9960 |
| lovable.dev | Camera Plain Variable | 18 | — | 2 | yes | `oklch(0.9699 0 107)` | `oklch(1 0 0 / 0.8)` | 8px | 48 | 2 | 11 | 8130 |
| metabase.com | Lato | 60 | -0.040em | 5 | yes | `rgb(255, 255, 255)` | `rgb(80, 158, 227)` | 12px | 6 | 3 | 27 | 10059 |
| montecarlodata.com | Outfit | 78 | -0.023em | 8 | yes | `rgb(0, 17, 29)` | `rgb(255, 87, 0)` | 14px | 8 | 2 | 7 | 6056 |
| motherduck.com | Aeonik Fono | 44 | — | 5 | yes | `rgb(244, 239, 234)` | `rgb(151, 212, 255)` | 2px | 29 | 0 | 3 | 8265 |
| neon.tech | Inter | 68 | -0.040em | 7 | yes | `rgb(0, 0, 0)` | `rgb(24, 25, 27)` | 0px | 48 | 2 | 0 | 9329 |
| posthog.com | RoundHog | 36 | -0.025em | 8 | yes | `rgb(238, 239, 233)` | `rgb(205, 132, 7)` | 6px | 164 | 0 | 6 | 900 |
| railway.com | IBM Plex Serif | 54 | -0.036em | 4 | yes | `rgb(19, 17, 28)` | `rgb(85, 63, 131)` | 8px | 22 | 1 | 2 | 11697 |
| resend.com | domaine | 96 | -0.010em | 4 | yes | `rgb(0, 0, 0)` | `—` | — | 25 | 1 | 0 | 12133 |
| stripe.com | sohne-var | 44 | -0.020em | 2 | yes | `rgba(0, 0, 0, 0)` | `rgb(83, 58, 253)` | 4px | 99 | 1 | 0 | 15033 |
| supabase.com | Manrope | 46 | — | 7 | yes | `oklch(0.995 0 34)` | `rgb(114, 227, 173)` | 6px | 17 | 1 | 1 | 7747 |
| tinybird.co | Roboto | 64 | -0.020em | 8 | yes | `rgb(10, 10, 10)` | `rgb(39, 247, 149)` | 0px | 7 | 1 | 1 | 10201 |
| trionn.com | familjen | 90 | -0.060em | 8 | yes | `rgb(4, 5, 8)` | `rgb(230, 228, 226)` | 7.2px | 18 | 0 | 0 | 25051 |
| vercel.com | GeistSans | 64 | -0.060em | 3 | yes | `rgb(250, 250, 250)` | `rgb(255, 255, 255)` | 6px | 15 | 2 | 7 | 5486 |
| voidzero.dev | APK Protocol | 60 | -0.050em | 4 | yes | `rgb(255, 255, 255)` | `—` | — | 2 | 1 | 1 | 7508 |
| warp.dev | matterMono | 56 | -0.036em | 8 | yes | `rgba(0, 0, 0, 0)` | `rgb(255, 255, 255)` | 0px | 12 | 1 | 9 | 7628 |
| workos.com | Untitled Sans | 80 | -0.070em | 8 | yes | `rgb(255, 255, 255)` | `rgb(99, 99, 241)` | 100px | 3 | 0 | 0 | 8458 |

RM rules = count of `@media (prefers-reduced-motion)` blocks reachable in
same-origin stylesheets. Cross-origin sheets cannot be enumerated, so this
is a floor, not an exact figure.

## Canvas and WebGL, measured 2026-10-15

Production sites probed one at a time in headless Chromium. Frame times are only comparable within one renderer:
software rendering (SwiftShader) is several times slower than a GPU, so every number names its renderer.
This run used an Intel UHD Graphics GPU through ANGLE (Direct3D11), not SwiftShader. Each row is a technique at the
tier of the version its sites ship (technique plus tier), with the sites listed below the tables.
Weight is a page field: a site counts for it even when no canvas of it animates, and then the canvas columns read
"not measured". n/a means no canvas could be judged. For the Fast rows the weight is the whole page's motion JS, which
mostly belongs to other parts of the site, not to the CSS recipe (see the notes below the tables).

### Per technique

| Technique | Tier | Sites | Canvases | Motion JS (min / median / max) | Reduced motion honoured | Pauses off-screen | Fallback without WebGL |
|---|---|---|---|---|---|---|---|
| Ambient dot grid (Fast) | fast | 1 | not measured | 0 KB / 0 KB / 0 KB | not measured | not measured | not measured |
| Corner glow (Fast) | fast | 1 | not measured | 0 KB / 0 KB / 0 KB | not measured | not measured | not measured |
| Edge fade (Fast) | fast | 2 | not measured | 0 KB / 35 KB / 70 KB | not measured | not measured | not measured |
| Dot grid and hairlines as masks (Fast) | fast | 1 | not measured | 70 KB / 70 KB / 70 KB | not measured | not measured | not measured |
| Noise (Fast) | fast | 2 | not measured | 70 KB / 84 KB / 99 KB | not measured | not measured | not measured |
| Shimmer sweep (Fast) | fast | 1 | not measured | 99 KB / 99 KB / 99 KB | not measured | not measured | not measured |
| Marquee (Fast) | fast | 1 | not measured | 70 KB / 70 KB / 70 KB | not measured | not measured | not measured |
| Additive blends on a dark ground (Fast) | fast | 2 | not measured | 0 KB / 157 KB / 315 KB | not measured | not measured | not measured |
| Scroll-linked (Fast) | | not measured | | | | | |
| Sticky narrative (Fast) | | not measured | | | | | |
| Counters that mean something (Fast) | | not measured | | | | | |
| Text that performs its sentence (Fast) | | not measured | | | | | |
| Image reveal through the identity's device (Fast) | | not measured | | | | | |
| Glassmorphism (Fast) | fast | 1 | not measured | 0 KB / 0 KB / 0 KB | not measured | not measured | not measured |
| Particles (Medium) | medium | 1 | not measured | 139 KB / 139 KB / 139 KB | not measured | not measured | not measured |
| Glassmorphism (Medium) | medium | 2 | 1 | 0 KB / 141 KB / 282 KB | 0 % | 100 % | 100 % |
| ASCII art (Medium) | medium | 1 | not measured | 0 KB / 0 KB / 0 KB | not measured | not measured | not measured |
| Halftone (Medium) | medium | 1 | not measured | 7 KB / 7 KB / 7 KB | not measured | not measured | not measured |
| Particles (High) | high | 1 | 1 | 340 KB / 340 KB / 340 KB | 0 % | n/a | 100 % |
| Holographic (High) | high | 1 | 1 | 340 KB / 340 KB / 340 KB | 0 % | n/a | 100 % |
| Wireframe 3D (High) | high | 1 | 3 | 180 KB / 180 KB / 180 KB | 67 % | n/a | n/a |
| Clay 3D (High) | high | 2 | 4 | 180 KB / 410 KB / 640 KB | 75 % | n/a | 100 % |
| Gradient mesh (High) | high | 2 | 7 | 282 KB / 299 KB / 315 KB | 50 % | 86 % | 100 % |
| Liquid morph | | not measured | | | | | |
| Neon glow | | not measured | | | | | |
| Split-flap | | not measured | | | | | |
| Retro VHS | | not measured | | | | | |

### Frame time by renderer

| Technique | Renderer | Canvases | p50 ms (min / median / max) | p95 ms (min / median / max) |
|---|---|---|---|---|
| Glassmorphism (Medium) | ANGLE (Intel, Intel(R) UHD Graphics (0x00009B41) Direct3D11 vs_5_0 ps_5_0, D3D11) | 1 | 49.9 / 49.9 / 49.9 | 216.6 / 216.6 / 216.6 |
| Particles (High) | ANGLE (Intel, Intel(R) UHD Graphics (0x00009B41) Direct3D11 vs_5_0 ps_5_0, D3D11) | 1 | 16.7 / 16.7 / 16.7 | 16.9 / 16.9 / 16.9 |
| Holographic (High) | ANGLE (Intel, Intel(R) UHD Graphics (0x00009B41) Direct3D11 vs_5_0 ps_5_0, D3D11) | 1 | 16.7 / 16.7 / 16.7 | 16.9 / 16.9 / 16.9 |
| Wireframe 3D (High) | no WebGL or 2D context (WebGPU or worker) | 3 | 16.7 / 16.7 / 16.8 | 33.1 / 33.4 / 33.7 |
| Clay 3D (High) | ANGLE (Intel, Intel(R) UHD Graphics (0x00009B41) Direct3D11 vs_5_0 ps_5_0, D3D11) | 1 | 16.7 / 16.7 / 16.7 | 17 / 17 / 17 |
| Clay 3D (High) | no WebGL or 2D context (WebGPU or worker) | 3 | 16.7 / 16.7 / 16.8 | 33.1 / 33.4 / 33.7 |
| Gradient mesh (High) | ANGLE (Intel, Intel(R) UHD Graphics (0x00009B41) Direct3D11 vs_5_0 ps_5_0, D3D11) | 6 | 16.7 / 16.7 / 49.9 | 16.8 / 17.05 / 216.6 |

### Tier ceilings (p75 of motion JS)

| Tier | Sites | p75 |
|---|---|---|
| fast | 5 | 99 KB |
| medium | 5 | 139 KB |
| high | 5 | 340 KB |

### Sites per row

Fast, probed 2026-10-15 unless noted: Ambient dot grid and Corner glow: linear.app. Edge fade: linear.app and hex.tech.
Dot grid and hairlines as masks: hex.tech. Noise: neon.tech and hex.tech. Shimmer sweep: neon.tech. Marquee: hex.tech.
Additive blends on a dark ground: linear.app and stripe.com (stripe.com probed 2026-10-14). Glassmorphism (Fast): apple.com
(2026-10-14). Scroll-linked, Sticky narrative, Counters, Text that performs its sentence and Image reveal cite no
production URL that can be probed (Sticky narrative names Antigravity and Observable without one): not measured.

New techniques, probed 2026-10-14: Particles (Medium): shopify.com/editions/spring2026 (its canvas sits far down the
page and was not listed as visible, so only weight counts). Particles (High) and Holographic (High): activetheory.net.
Wireframe 3D (High): spline.design (a grid floor in a WebGPU scene). Glassmorphism (Medium): nothing.tech, raycast.com.
Clay 3D (High): spline.design, github.com. ASCII art (Medium): ghostty.org (DOM text, no canvas). Gradient mesh (High):
stripe.com, raycast.com. Halftone (Medium): shaders.paper.design. Liquid morph, Neon glow, Split-flap and Retro VHS have
no site: not measured. Each site was probed once; no site failed.

### Reading the Fast weights

The Fast recipes are CSS, so their own cost is close to nothing. The number in a Fast row is the motion JS of the page
that shows the recipe, and some of it belongs to other parts of that site:
- linear.app: 0 KB, no canvas and no named animation library.
- hex.tech: 70 KB of page JS, no canvas listed.
- neon.tech: 99 KB, with four animating 2D canvases on the page; they are not part of the CSS recipes, so the canvas columns of the Noise and Shimmer rows stay not measured.
- stripe.com: its figure is the WebGL gradient in the hero (the High "Gradient mesh" row), not the `multiply` blends the
  Additive blends card cites; its canvases are left out of that Fast row for the same reason.
- apple.com: 0 KB, DOM only.
The Fast ceiling is the p75 of these page figures. It says how much motion JS a Fast page may carry, not what a recipe costs.
