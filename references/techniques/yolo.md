# YOLO techniques

YOLO loading: the no-savings tier, for the flagship experience of a company with the budget and the team for it. It has no weight, script or GPU ceiling. It keeps the Floor: reduced motion honoured (drawings and films included), a lighter path for a visitor whose device cannot run the experience, the content readable without the experience, and honest loading (no sound fetched before the visitor asks for it, the first-view weight stated). The tier is described in [audition.md §4](../audition.md#4-loading-cost-cheapest-viable-option-first); this file does not restate it. YOLO is offered in the tier message and never recommended by default. Choosing it commits the build to at least one technique below at flagship scale (authored media or a real-time 3D scene); a page under the High ceiling is a high build with a yolo label, and `check-motion --tier yolo` reports it as built below the chosen tier. Before production, three light prototypes of the experience are built and the author picks one ([audition.md §2](../audition.md#on-the-yolo-tier-three-prototypes-before-production)).

Each card names its Floor fallback under "Lighter version", and links the nearest card of a lower tier where one exists. Every cost below comes from the YOLO probes of 2026-11-03 ([benchmarks](../benchmarks.md#yolo-measured-2026-11-03)): one run per site, headless Chrome at 1440x900 on an Intel UHD GPU. On this tier media, not script, is what makes a page heavy: the heaviest page by transfer, 26.7 MB, carried 9 KB of motion code.

| Technique | What the visitor sees | Suits |
|---|---|---|
| [Scroll-scrubbed image sequence](#scroll-scrubbed-image-sequence) | A product film that the scroll bar plays forwards and backwards | Packaged products with a hero object |
| [Pre-rendered 3D film](#pre-rendered-3d-film) | The company's world, rendered once as a film, with chapters to jump between | Logistics, industry, devices |
| [Real-time 3D world](#real-time-3d-world) | A lit scene the visitor moves through by scrolling or dragging | Launches and brand worlds with a 3D team |
| [Illustrated scroll story](#illustrated-scroll-story) | A drawn world in layers and panels that opens as the visitor scrolls | Spirits, heritage food and drink, publishers |
| [Sound design](#sound-design) | Music and effects that answer what the visitor does | Experiences meant to be watched like a film |
| [Physics and drag](#physics-and-drag) | Objects with weight that the visitor can push and throw | Playful studios, toys, launches |

## Scroll-scrubbed image sequence

### What it is

A product film cut into hundreds of stills that the scroll bar plays forwards and backwards: the jar turns, the box opens, the capsules fly apart exactly as far as the visitor scrolls.

### Where it comes from

It is the flip book worked by a scroll bar instead of a thumb. John Barnes Linnett patented the flip book in 1868 as the kineograph ([Wikipedia, Flip book](https://en.wikipedia.org/wiki/Flip_book)).

### Suits

Packaged consumer products with one hero object: supplements, cosmetics, drinks, devices.

### What it costs the visitor

On one site (duyucare.dops.agency, measured 2026-11-03) 25.1 MB arrived before the first view settled, 23.7 MB of it stills over 1,082 requests, and 26.7 MB after a full scroll; the motion code was 9 KB. A counter from 0 to 100 % said honestly that it was loading, but it waited for the whole sequence. Under reduced motion the sequence still followed the scroll, which the visitor drives, but the drawing and two films also kept moving on their own. There was no lighter path for a small or weak device.

### Lighter version

The [Sticky narrative](fast.md#sticky-narrative) card carries the same story without the footage: the copy holds still while three to five key frames, as ordinary pictures, go past it. That is the Floor fallback, under reduced motion and without scripts. On phones, a sequence of 60 to 120 frames, not a thousand.

### For the builder

A `<canvas>` 2D context draws `frames[Math.round(progress * (n - 1))]`, with `progress` from a GSAP ScrollTrigger with `scrub` (or a scroll listener). Load the first frame and every eighth one first, fill in the rest while the browser is idle, and serve a smaller set under 768 px wide. Keep the key frames as `<img>` in the HTML, so the page reads without scripts, and show them in flow under `prefers-reduced-motion: reduce`. Put the first-view weight in the tier message: it is the whole sequence unless the loading is staged.

Check it with `node scripts/check-motion.mjs <page> --tier yolo`, over http(s): it reports the weight by type and fails the Floor.

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- duyucare.dops.agency, probed 2026-11-03: 25.1 MB first view, 26.7 MB after a full scroll (images 23.7 MB, video 2.4 MB, script 376 KB); motion code 9 KB; readable without scripts (7,765 characters and the h1); no fallback for a visitor who cannot run the drawing.

## Pre-rendered 3D film

### What it is

The company's world modelled and rendered once, offline, as a film: trucks leave the depot, climb a mountain road and reach the port, the airport and the railhead. The page plays it, with chapter marks the visitor can jump between, or plays the product turning as the visitor scrolls.

### Where it comes from

Pre-rendering is the film way of making 3D: every frame is rendered ahead of time, so the picture can be richer than a device could draw live ([Wikipedia, Pre-rendering](https://en.wikipedia.org/wiki/Pre-rendering)).

### Suits

Logistics, industry and infrastructure, any company whose product is a network or a place; device makers whose product page is a film.

### What it costs the visitor

On two sites (emons.de and apple.com/airpods-pro, measured 2026-11-03) 10.8 MB and 13.0 MB of film, 17.7 MB and 23.1 MB for the whole page after a full scroll, but only 1.3 MB and 8.3 MB before the first view settled; motion code 105 KB and 355 KB. Without scripts each showed its full text (10,660 and 30,524 characters) with a still in place of the film. Under reduced motion Apple replaced the hero film with a still of the product and passed the whole Floor; the Emons film kept playing.

### Lighter version

For one object, the [Clay 3D](high.md#clay-3d) card draws it live at a fraction of the weight. For a whole world there is no lighter technique; the Floor fallback is the poster frame, with the chapters as a list of links and the text in flow.

### For the builder

One `<video muted playsinline preload="metadata" poster="...">`, chapters as buttons that set `currentTime`, hotspots as buttons placed over it. Blender, run headless with the render script kept in the project, is the tool for the film (the [Rendered 3D](high.md#rendered-3d) card has the setup and the look); scrubbing a video by scroll needs an encode with every frame a keyframe (`-g 1`) or it stutters; Emons chose chapters over scrubbing, Apple scrubs. Under `prefers-reduced-motion: reduce` do not autoplay: show the poster and the chapters. Without scripts the poster and the chapter text are in the HTML.

`check-motion --tier yolo` fails a video that still plays under reduced motion.

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- www.emons.de, probed 2026-11-03: 1.3 MB first view, 17.7 MB after a full scroll (video 10.8 MB, images 5.8 MB, script 883 KB); motion code 105 KB; GSAP, ScrollTrigger, Lenis, Lottie and Webflow in the shipped code.
- www.apple.com/airpods-pro, probed 2026-11-03: 8.3 MB first view, 23.1 MB after a full scroll (video 13.0 MB, images 8.1 MB, script 976 KB); motion code 355 KB; 81 `<noscript>` pictures.

## Real-time 3D world

### What it is

A lit, textured scene the visitor moves through by scrolling or dragging: an igloo on a mountain that breaks apart, a small planet of streets to walk, a driver's helmet turning over his face.

### Where it comes from

The scene is drawn live, frame by frame, by the same kind of engine that runs video games ([Wikipedia, Game engine](https://en.wikipedia.org/wiki/Game_engine)); the agency showcases (Active Theory, Lusion, Abeto) made it the flagship form of the brand site.

### Suits

Launches, flagship brand worlds, technology and entertainment brands with the budget for a 3D team.

### What it costs the visitor

On four sites (igloo.inc, landonorris.com, lusion.co and messenger.abeto.co, measured 2026-11-03) 5.6 to 14.6 MB in all after a full scroll, of which 0.6 to 11.1 MB of 3D models; the motion code, where it could be measured, was 414 KB and 495 KB, above the 340 KB High ceiling. None passed the Floor: two showed nothing without scripts, two hid their text under a loader, one stayed on its loader under reduced motion, and one could not paint a frame in 30 s.

### Lighter version

For one object, the [Clay 3D](high.md#clay-3d) or [Wireframe 3D](high.md#wireframe-3d) card. For the whole world, the Floor fallback is a rendered still or a short film per chapter, with the text in flow and visible before the scene is ready.

### For the builder

three.js (or the studio's own engine), glTF models with Draco geometry and KTX2 textures, a loading manager that drives an honest percentage, and GSAP ScrollTrigger or a wheel handler for the camera path. Serve the text as HTML outside the `<canvas>` and keep it visible until the scene is ready, never under an opaque loader. Start the scene only after a WebGL2 test passes and `matchMedia('(prefers-reduced-motion: reduce)')` does not match; otherwise show the still. Pause the loop when the scene is out of view (`recipes-motion.md` §14).

`check-motion --tier yolo` fails text that is in the DOM but covered by a loader without scripts, and a canvas that moves under reduced motion or is blank without WebGL.

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- www.igloo.inc, probed 2026-11-03: 8.3 MB first view, 14.6 MB after a full scroll (models 11.1 MB, audio 2.8 MB, script 450 KB); motion code 414 KB; blank without scripts; stayed on its loader under reduced motion for the 25 s watched.
- landonorris.com, probed 2026-11-03: 5.2 MB first view, 7.4 MB after a full scroll (images 4.6 MB, models 1.5 MB, script 589 KB); motion code not measured (the probe timed out); without scripts a full-screen loader covered the 1,854 characters of text.
- lusion.co, probed 2026-11-03: 10.6 MB first view, 13.0 MB after a full scroll (images 6.0 MB, video 2.4 MB, audio 1.2 MB, models 0.6 MB, script 476 KB); motion code not measured (load timeout); without scripts a counter on black covered the text; no screenshot under reduced motion within 30 s.
- messenger.abeto.co, probed 2026-11-03: 5.6 MB first view and after a full scroll (audio 3.5 MB, models 1.0 MB, script 526 KB); motion code 495 KB; blank without scripts. It is a game, the far end of the class, not a brand model.

## Illustrated scroll story

### What it is

A hand-drawn world, etched in a few inks, that the visitor scrolls and drags through: panels open, characters move, a cocktail is poured.

### Where it comes from

The form is the long scrolling feature, often called "snowfall" after The New York Times piece "Snow Fall", published online in December 2012: editorial layout joined to parallax scrolling and web video ([Creative Bloq, Snowfall](https://www.creativebloq.com/web-design/snowfall-51411702)). Here the photographs are replaced by drawings in layers.

### Suits

Spirits, heritage food and drink, publishers, music: brands with a story and an illustrator.

### What it costs the visitor

On one site (santionispirits.com, measured 2026-11-03) 9.7 MB at the age gate, before the visitor had answered it, of which 8.5 MB was sound; 633 KB of script and 431 KB of motion code, above the 340 KB High ceiling. It failed the Floor: the drawing kept moving under reduced motion, and without scripts there was one line of text.

### Lighter version

The [Scroll-linked](fast.md#scroll-linked) card gives the layered parallax with ordinary pictures. The Floor fallback is the illustrations as flat images in a scrolling page, with the story as text between them and the age question as an HTML form.

### For the builder

Layered illustration planes in a WebGL scene (Active Theory's engine on this site), Lottie for line animation, pointer drag on the canvas. Fetch the sound only after the visitor turns it on, keep the age gate in HTML, and keep the story text in the HTML beside the scene. Under reduced motion show the panels still.

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- santionispirits.com, probed 2026-11-03, measured at its age gate (the gate was not passed): 9.7 MB (audio 8.5 MB, script 633 KB); motion code 431 KB; a WebAssembly module and Lottie in the shipped code; the drawing kept moving under reduced motion; a fallback showed without WebGL; 24 characters without scripts.

## Sound design

### What it is

Music and effects that answer what the visitor does: a pour, a click, wind on the mountain.

### Where it comes from

Film sound effects made to match the picture are called Foley, after the sound-effects artist Jack Foley ([Wikipedia, Foley (filmmaking)](https://en.wikipedia.org/wiki/Foley_%28filmmaking%29)).

### Suits

Experiences meant to be watched like a film; never utilities, forms or shops.

### What it costs the visitor

On four sites (santionispirits.com, igloo.inc, lusion.co and messenger.abeto.co, measured 2026-11-03) 1.2 to 8.5 MB of sound. On three of them it arrived before the visitor did anything; on the fourth (igloo.inc) it arrived during the scroll, still before any click.

### Lighter version

No lighter version: silence is the fallback, and it is the default until the visitor turns the sound on.

### For the builder

Web Audio or Howler; fetch the files only after an explicit "sound on" tap, never on load or on scroll, and say on the button that it loads sound. Leave it off under reduced motion. `check-motion --tier yolo` fails any sound file fetched while the page is opened, scrolled and read without a click.

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- santionispirits.com 8.5 MB, messenger.abeto.co 3.5 MB, igloo.inc 2.8 MB, lusion.co 1.2 MB of audio, probed 2026-11-03.

## Physics and drag

### What it is

Objects with weight that the visitor can push, throw and drag, and that settle back where they belong.

### Where it comes from

A physics engine simulates bodies with mass, friction and collisions, the way games and engineering software do ([Wikipedia, Physics engine](https://en.wikipedia.org/wiki/Physics_engine)).

### Suits

Playful studios, toys, launches.

### What it costs the visitor

On one site (lusion.co, measured 2026-11-03) a physics engine in a page of 13.0 MB after a full scroll; its reduced-motion render could not be captured in 30 s, because the page kept the main thread busy.

### Lighter version

No lighter version: the weight and the throw are the technique, and no lower card simulates them. The Floor fallback is the objects at rest, as a picture, with the content beside them.

### For the builder

Rapier, cannon-es or matter-js stepped in the render loop, with a sleeping threshold so the loop stops when nothing moves. Under reduced motion, place the objects at rest and do not start the loop.

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- lusion.co, probed 2026-11-03: 13.0 MB after a full scroll, a physics engine marker in the shipped code (see Real-time 3D world for the rest of the page).
