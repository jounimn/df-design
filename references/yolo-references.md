# YOLO references, analysed

Eight flagship sites, each recorded live on 2026-11-05, driven to its footer by real wheel input and studied from the recording. A new YOLO build reads this file first instead of probing the same sites again; it probes again only for what this file does not answer, or when `node scripts/audit-store.mjs` says the analysis is past its shelf life. The weights and the Floor results of the same sites are in [benchmarks.md](benchmarks.md#yolo-measured-2026-11-03) and in the cards of [techniques/yolo.md](techniques/yolo.md); this file is about what the visitor sees, in order.

The file is text only. No picture of these sites is kept in the repository: they are third-party work. To see one again, record it:

```
node scripts/capture-motion.mjs https://santionispirits.com/ --click "#age-yes" --out captures/motion/santioni
```

**Method.** Each page at 1440x900, driven by the wheel in 120 px steps every 75 ms with a 1.5 s pause every 60 steps, past any start gate, until the scroll and the picture stop changing for 40 steps (or 1,400 steps). The video was tiled into contact sheets (2 frames a second) and an overview (one frame every 4 to 6 s), and the sheets were looked at. Stills taken with `window.scrollTo` showed only the first screen for five of the eight (igloo, lusion, client-zero, everswap and the Lusion DDD page): their choreography exists only in the recordings.

---

## santionispirits.com, the Notturno Experience

Santioni Spirits presents its liqueurs as an etched comic the visitor scrolls through. Age gate passed; 200 wheel steps to the footer.

**The sequence.**

1. A loader: an etched roundel (a saint in a sunburst) draws itself on, a hairline progress rule under it.
2. The age gate in a display serif with wild ligatures; the words slide apart to reveal YES and NO.
3. The title card assembles letter by letter over a dark sea; the sea turns into a white cloud-line horizon.
4. Chapter one, on white: a hooded monk walks across an etched landscape. Panels open inside panels (a face close-up, a hand), with small boxed captions beside them. The camera pans and cuts like a comic page.
5. A moon, a staircase, a red disc portal; the monk climbs. Full-bleed red appears for the first time, the one strong colour after black and white.
6. A hand reaches for the red surface: "HOLD & REACH", a button the visitor presses and holds to advance.
7. The portal fills the screen; a drawn ink wipe to black; a red colonnade hall in vertical hatching, the monk small inside it.
8. Etched eyes slide in as panels; three bottles (blue, green, yellow) stand on a pedestal: the product appears inside the story.
9. "HOLD & POUR": a hand pours blue liqueur into a glass; the liquid is the second colour.
10. The monk drinks; his eyes widen; a speed-line burst, and he flies through white ink streaks ("HOLD").
11. Columns crack and fall, rocks fly over red; the title card returns as a chapter end.
12. A white colonnade, the monk now in a blue robe; an ink-smear transition.
13. The product page: "INDULGE NOW" in widely spaced type on red, the glass and the bottle with flavour copy, "SELECT HOUSES FORTHCOMING" on white, a black footer.

**Techniques.** Layered etched illustration on a WebGL stage (Active Theory's engine), Lottie line animation, hold-to-act gestures, drawn transitions (ink wipes, a portal that fills the frame, smoke of hatching), type that assembles and breaks, boxed captions, sound (8.5 MB, fetched at the gate).

**What makes it absurd.** It is a comic in etched ink (dense hatching, stippling, engraving on every surface) in three colours: black, paper and one red, with the product's three colours as the only others. Every scroll step is a camera move inside one drawn world; nothing is a section. The visitor performs the beats. No cut is a fade.

**What it fails.** The Floor: the drawing kept moving under reduced motion, and without scripts there was one line of text (24 characters).

**What the author singled out,** narrating a recording of it: every element of the background is its own animated layer and the pointer moves the layers by their depth, overlapping one another; the characters are rendered in 3D; the cloud edge between the title card and the first set becomes the next ground; small caption transitions that do not take the whole frame; approaching the portal, the ground recedes and falls while the portal rises with its own surge, like water; during the hold the background keeps moving; the ink transition (black hatching rising and thinning) carries depth, and is the depth effect to bring to future projects, with a cleaner cut for a more commercial identity; a flat red block behind the bottles to give them focus; a table that becomes a pillar across a cut; 3D pillars that also answer the pointer; type that assembles at the end; a footer with the bottle in 3D, arrows to change flavour, and a button that restarts the whole experience. Every one of these is now a recipe (below).

**Rebuilt against it, 2026-11.** An illustrated scroll story of 21 drawn panels was built twice on this grammar (the example stays outside the repository). The first build stacked a new system on each pass and was rejected; the second fixed the structure first (`techniques/yolo.md`, "Structure before art") and built one scene at a time. Of the reference's fine touches, these proved worth their cost: hold beats on the lines the story turns on, the carried element's anticipation before its cut, one caption rhythm, secondary motion on twos where a drawing went dead (`recipes-motion.md` §17, §18, §21). Two were rejected by the author and stay out: a page-wide paper grain (a global overlay; the material is already one ink pair on every plate) and a title pinned over sections that slide under it, with any fixed header or bar during the story.

## igloo.inc

1,400 wheel steps, the cap: the page loops.

**The sequence.** A near-white loader; a floating island of snow and rock with a small igloo, wireframe lines flickering over it as if the scene builds itself. Then three scenes that repeat with variations: the igloo on a mountain (photoreal snow, ice blocks, cloud banks, volumetric fog), its blocks flying apart and back as the visitor scrolls; a portal (a ring of ice segments, a white-hot core, chromatic fringes) whose segments rotate open; a creature on a reflective pedestal with rings on the floor and small mono readouts at the edges. Rock fragments tumble through fog between scenes; each transition is a camera dive through cloud.

**What makes it absurd.** One material world (frosted ice, snow, fog, silver) rendered live with film-grade light, volumetrics and post (bloom, aberration, grain). Scenes morph into each other through the fog with no cut, and the camera never stops. Type is reduced to instrument readouts. Sound arrives during the scroll.

## lusion.co

Gate "EXPLORE" passed; 190 steps to the footer.

**The sequence.** A loader counter; a pile of glossy 3D pipe shapes in a rounded frame that reacts to the cursor (physics); a big grotesk line, then "PLAY REEL" over a fluid sphere; a project grid; a dark chapter in which an astronaut floats and the camera flies through a tunnel of light shards, then a blue chapter where the astronaut walks a corridor of drawn white shapes; "Let's work together!" among hundreds of floating 3D sticker objects; the footer.

**What makes it absurd.** The agency's own character travels through four worlds in one scroll, each in a different material language (glossy plastic, fluid glass, light shards, sticker pop). WebGL windows sit inside a clean editorial layout; physics answers the cursor everywhere.

## client-zero-tech.lusion.co

490 steps to a stable end.

**The sequence.** A black loader, a dot that becomes a ring, a counter; a blue-violet nebula with a star inside a cage of light filaments and "2023" with a short manifesto; a glass cube with the star inside rotates in. The star pulls the camera through a spiral galaxy of dots into the product name. Each feature is a glass panel floating at an angle in space (messaging, collectibles, ownership, social, proof of humanity, DAO, rewards). A planet rises with an orange atmosphere; the end card sits inside a black planet eclipse with a rim light.

**What makes it absurd.** One continuous camera through space; every product feature staged as a lit 3D object.

## everswap.com

200 steps.

**The sequence.** A loader in a diamond mark; a painted mountain world rendered in 3D, the camera rising past green peaks, the logotype curving across a slope, a white bird flying by; the words "One / Pool" split left and right of a diamond as the camera dives into the valley and a glowing line runs down the river; a purple card, then a top-down camera following rivers that branch and rejoin, with labels floating over; a violet motion-blur transition back to the mountains; the landscape folds into the diamond for the end card.

**What makes it absurd.** An illustrated, painterly 3D world that looks drawn, not rendered, and one metaphor (water through mountains as liquidity) carried by the camera from the summit to the river and back. Type is huge and minimal and enters with the camera.

## emons.de

180 steps.

**The sequence.** An isometric 3D film of a depot (red trucks, trees, a warehouse in clay-like CGI) with hotspots, then a conventional corporate page: figures, a row of red 3D vehicles, photographs of people, awards, FAQ, footer.

**What makes it absurd.** Only the hero: a fully modelled brand world in one clay style. The rest is an ordinary site.

## duyucare.dops.agency

220 steps.

**The sequence.** A white editorial page: a serif and sans headline mix, a product jar (a scroll-scrubbed image sequence) that turns and opens, capsules floating, a giant number in a serif that the scroll scales, statistics, a dark footer.

**What makes it absurd.** The product as a film scrubbed frame by frame (25 MB of stills), with editorial type choreographed round it; everything else restrained.

## 1105-ddd2024-homepage.lusion.co

**The sequence.** A black loader with a cyan arc; "Digital / Design / Days" laid huge across the frame over a black-and-white crowd photograph the camera moves through, the words sliding apart as the visitor scrolls; the speakers' names roll by in huge light type while each speaker's portrait forms as a particle point cloud that breathes and disperses; a number and a topic list scrolling at different speeds; a three-column price table, a sponsor block, the footer.

**What makes it absurd.** An event site with editorial type at poster scale and one signature effect (faces as living particle clouds); restraint everywhere else.

---

## What they share

- **One world, one camera.** Each site is one continuous place, and the scroll is a camera that never stops: pans, dives, push-ins, flights through tunnels. Sections are shots, not boxes.
- **One material language, applied to everything,** transitions included: etched ink, frosted ice, hand-painted texture, glass and glow, clay CGI. The cut is made of the world's own stuff (an ink smear, a cloud, a colour blur).
- **Beats the visitor performs:** hold to reach and hold to pour, cursor physics, hotspots.
- **Type as a character.** It assembles, splits round the subject, scales with the camera, or shrinks to readouts. It is rarely a paragraph.
- **Designed cuts, never fades:** wipes, portals, splits, folds, a mark that becomes a mask.
- **Few colours, spent like a director:** black, paper and one red, then the product's colours; monochrome silver; green and one violet beat.
- **Sound** scores the experience where it exists (santioni, igloo, lusion), and on all three it arrives before the visitor asks.
- **The product inside the story:** bottles on a pedestal, features as props in space, never a feature grid.
- **They fail the Floor.** None of the eight passes it whole; the cards in `techniques/yolo.md` say which part each one fails. The bar is their production value, never their Floor.

**What it takes to make one.** An illustrator or a 3D team producing hundreds of authored frames or a live world; motion designed shot by shot; a WebGL layer with post-processing; a scroll engine with pinned chapters; gestures; sound; a loader that tells the truth about the weight.

**What a comic told by scroll needs to stand beside them** ([Webcomic experience](identities/digital.md#webcomic-experience-illustrated-scroll-story)): one drawn world in one hand, dense with hatching, at full-screen size; the scroll as a comic camera (panels inside panels, push-ins on eyes and hands, cuts on action, a portal or an ink cut between chapters); beats the reader performs; one spot colour spent like santioni's red; lettering and SFX inside the art, captions as small boxed narration; scored sound on a tap. What it must not be: generic 3D props under an edge-detect filter, or panels in a column with parallax.

---

## A template catalogue, read 2026-11-07

Not a flagship site: a catalogue of 59 paid and free WebGL landing-page templates (getlayers.ai/templates), read from its 83 preview recordings on 2026-11-07, tiled into contact sheets and looked at. Its pages publish recordings only, so nothing in it could be probed; the moves taken from it were rebuilt on example pages with original content and measured there (`docs/examples/motion-techniques/`). No asset, text or picture of the catalogue is kept in the repository.

- **The house pattern.** One fixed WebGL canvas behind the page carrying one signature move (a particle cloud that re-forms by scroll, an object of glass, ink over a photograph, a mirror floor, an object that travels down the page), and a restrained page layer over it: a thin sans with a serif accent, glass pills, hairlines, small mono labels, a 0 to 100 preloader counter, blur-in headings, smooth scroll.
- **A bar for the signature move, a tell for the rest.** The signature moves are well built and are now cards (below). The page layer is the same on nearly every template: twelve open every heading with the same blur-in, eleven count a preloader from 0 to 100 over a page that is already there. That is the generated-page look of 2026 that the gates and the finish review exist to catch; take the move, not the chrome.
- **Most of it is not YOLO.** Measured on the rebuilt pages, the signature moves weigh 11 to 173 KB of motion code, under the 340 KB High ceiling: they are High techniques. A template becomes YOLO when its move carries modelled products or worlds of several megabytes.

---

## A component catalogue, read 2026-11-08

Not a flagship site either: a paid catalogue of 548 React and Tailwind parts (integra.arsenalpages.com/explorar), sold as parts for sites built with coding agents. Each item was recorded in its own preview on 2026-11-08 (8 frames over time, 4 under a pointer sweep, 4 under the wheel), tiled into contact sheets and looked at, with the runtime of each frame logged (canvas contexts, animation frames, listeners, running animations, computed-style flags). It publishes no GIFs or videos; nothing of it (code, picture, text or name) is kept in the repository, and the moves taken from it were rebuilt on example pages with original content and measured there (`docs/examples/motion-techniques/`). One of its pages dresses a real soft-drink brand as sample content: that is the reason for the briefing rule in `brand-truth.md`, "A real brand is never sample content".

- **A kit, and a few signatures.** Two thirds of the items (360) are CSS and DOM only: the staples of the generated page in one house look, a near-black ground, a grotesk display, a mono face for labels, one coral accent and white pill buttons. Scored by the reader from 0 (commodity) to 3 (signature): 194 at 0, 218 at 1, 87 at 2 and 49 at 3. The kit is the clearest sample there is of the generated look of 2026, and the gates now name its tells (`gates.md`: `named-look-dark`, `border-beam`, `glass-over-nothing`, `preloader-over-painted`, `animation-storm`, `wheel-hijack`, `placeholder-image`).
- **What the 49 strongest items share.** They almost never use the house look. Each has its own art direction (a record sleeve, a museum, an engraving, a cinema archive, a temple, a tea brand, a fintech in lime), and most use **the page's own content as the material of the effect**: the headline refracted, the images frayed, the cards turned into code, the labels turned in 3D. That lesson matters more than any one shader. On a High or YOLO build, the signature move is made of what the page already says and shows, in the identity's own art direction; a move borrowed with its demo's look is the kit again.
- **Cursor effects that are seen before they are found.** The catalogue's lenses, x-ray magnifiers and trails wander on their own until the pointer arrives, so a recording, a thumbnail or a phone shows them working. That is now a rule for every cursor-driven card (`recipes-motion.md` §28).
- **What it built that df-design had no card for.** Glass that bends moving light (reeded and beaded panels), glass letters, images that fray and smear, type on geometry, objects in CSS 3D (34 items, the largest cheap gap), the stepped showcase (three of its twelve full pages step on the wheel with nothing scrolling) and dither. All seven are cards now, each measured on its own example page; none is YOLO by weight (7 to 11 KB of motion code).

---

## Where each technique lives in df-design

The moves above, mapped to the recipe that builds them and to the installed skills whose code or rules were adapted into it (all MIT; credited in the README, licences in `licenses/`). No skill was copied in whole; where a skill had nothing on a move, the recipe was written from the recording.

| Move (site) | Built in | Adapted from |
|---|---|---|
| Every element its own layer, pointer by depth, a moving hold (santioni; lusion's cursor) | `recipes-motion.md` §17, `dfStory.parallax` | `gsap-performance` (quickTo), `threejs-animation` (frame-rate independent damping), `animation-principles`: secondary action and loops (amplitude, phase offset), spatial thinking (overlap, tangents) |
| One shape carried across a cut: cloud to ground, table to pillar, portal up while the ground recedes (santioni; everswap's landscape folding into the diamond) | §18 | `gsap-scrolltrigger` (pin, scrub, labels), `gsap-plugins` (Flip, MorphSVG), `gsap-scrolltrigger-storytelling` (section handoff) |
| The ink-out with depth (santioni) | §19, `dfStory.ink`, `dfStory.hatchField` | `threejs-shaders` (threshold dissolve), written from the recording |
| The focus field (santioni's red block behind the bottles) | §20 | written from the recording; `animation-principles` staging |
| Captions, title cards assembling by tracking, type breaking round the subject (santioni; the Lusion DDD page; everswap's split words) | §21 | `gsap-plugins` (SplitText), `animation-principles` orchestrated sequences |
| Hold to reach, hold to pour (santioni) | §22, `dfStory.hold` | `animation-principles` gesture responses; written from the recording |
| The ending as a scene: product between the letters, rising sheet, carousel, restart (santioni; everswap's end card) | §23 | `gsap-plugins` (ScrollTo), written from the recording |
| Preload, decode, upload and compile with honest progress (every site's loader) | §24, `dfStory.preload` | `threejs-performance` (`compileAsync`), `threejs-loaders`, `animation-principles` loading states |
| Water, smoke and sparks drawn frame by frame (santioni's pour) | §25, `dfStory.flipbook`, `drawn-assets.md` §10 | `scenario-blender-grease-pencil`, `animation-principles` straight ahead and loops |
| 3D characters that look drawn (santioni's monk; lusion's astronaut) | `drawn-assets.md` §9 | `blender-stylized-npr`, `blender-character-rigging`, `blender-animation`, `blender-rendering`, `blender-export-pipelines`, `threejs-materials` |
| A live world that does not hitch (igloo, lusion, client-zero) | `techniques/yolo.md`, Real-time 3D world | `threejs-performance`, `threejs-loaders`, `threejs-textures`, `blender-game-optimization` |
| Reduced motion for the whole story (none of the eight passes it) | §26 | `gsap-core` (matchMedia), `animation-principles` accessible motion and motion sickness |
| A particle cloud that re-forms by scroll (the template catalogue) | `techniques/high.md`, Particles, "Re-forming by scroll" | `particle-system` (iart.ai: per-point seed attribute, size attenuation, additive points), `build-threejs-scroll-worlds` (damping), `recipes-motion.md` §16 (the spring); the multi-target layout, the per-point delay and the sine-curl field written from the recordings |
| Ink over a photograph (the template catalogue) | `techniques/high.md`, Fluid ink | PavelDoGreat/WebGL-Fluid-Simulation (the solver's passes and constants, MIT), `shader-dev` (MiniMax: half-float targets, decay by multiplying) |
| A picture painted open by the pointer (the template catalogue) | `techniques/medium.md`, Cursor-painted reveal | `shader-dev` (feedback decay and its brightness budget); the segment stamp and the torn edge written from the recordings |
| An object of clear glass bending the word behind it (the template catalogue) | `techniques/high.md`, Glass object | `threejs-materials` (physical transmission), `build-threejs-scroll-worlds` (keep transmission rare); the opaque-background fix found on the example page |
| A mirror floor with rings (the template catalogue) | `techniques/high.md`, Reflective water floor | `threejs-*` (Reflector addon), `shader-dev` (the height-field ripple, as the heavier option); the analytic rings written for the example page |
| One object carried down the page between slots (the template catalogue) | `techniques/high.md`, Object that travels between sections, and §18 | `build-threejs-scroll-worlds` (native scroll as the source, anchor progress, `1 - exp(-λ·dt)`), `animation-vocabulary` (Emil Kowalski: shared element transition) |
| The page layer: blur to focus, reading fill, scramble, odometer, the wordmark between planes, the sticky stack, the pixel cut, the ring, smooth scroll (the template catalogue) | `techniques/fast.md` (Text that performs its sentence, Counters, Scroll-linked, Sticky narrative, Marquee), §16, §27 | `cinematic-gsap-lenis-motion-system` (Meng To: the Lenis wiring, blur radius and word stagger), `animation-vocabulary` (the names: stagger, number ticker); the rest written from the recordings |
| Reeded and beaded glass bending moving light (the component catalogue) | `techniques/medium.md`, Glass over moving light | written from the recordings; `shader-dev` (MiniMax) for the field's sharpened sines; `@paper-design/shaders` (Apache-2.0) named as the lighter fluted glass, not measured |
| The headline cast in glass, the page's photograph bent through it; shatter as the YOLO step (the component catalogue) | `techniques/high.md`, Glass letters | written from the recordings; the height-map refraction and Fresnel edge from `threejs-shaders` and `shader-dev`; the glint's path from `recipes-motion.md` §28 |
| A strip that frays into threads at its edges, a lens that smears along its velocity (the component catalogue) | `techniques/high.md`, Images that fray and smear | written from the recordings; `animaxxing-webgl` (John Polacek: CORS, the scroll-velocity wave, the lens that stays still over content) |
| Names on a ribbon tied in a knot; a ring of words through an object (the component catalogue) | `techniques/high.md`, Type on geometry; `techniques/fast.md`, CSS 3D objects | written from the recordings; parallel-transport frames from `threejs-geometry`; `troika-three-text` (MIT) named, not measured |
| Solids, a coin and a ring of words in CSS 3D; a sphere of photographs and a drum the camera enters (the component catalogue) | `techniques/fast.md` and `techniques/medium.md`, CSS 3D objects; the ring in Marquee | `animaxxing-webgl` (the scroll flight: about 20 pictures, a camera that is a pure function of the scroll); the golden-angle sphere and the facing light written for the example page |
| A product per wheel step, a ring wipe, the page recoloured (the component catalogue) | `techniques/medium.md`, Stepped showcase; the `wheel-hijack` gate | `horizontal-scroll-scenes` (Meng To: native scroll as the only state, dwell and move, the label flip before the middle, `inert` on hidden chapters); `choreograph` (Emil Kowalski: one lead per moment) |
| Fog in an ordered dither, a lamp that clears it; a photograph printed in two inks (the component catalogue) | `techniques/fast.md` and `techniques/medium.md`, Dither | `dither-background` (Meng To: the Bayer matrix, cell size, palette rules; its per-cell fill replaced by one image buffer after the first build measured 15 frames a second) |
| A lens, a trail or a lamp that wanders until the pointer arrives (the component catalogue) | `recipes-motion.md` §28, every cursor card | written from the recordings; `choreograph` (attention loops: wait, stop on interaction, resume after the reset); `animaxxing-webgl` (where a lens must stay still) |
| A spotlight that shows a second picture under the pointer (the component catalogue) | `techniques/medium.md`, Cursor-painted reveal, "A lens instead of a trail" | `reveal-hover-effect` (Meng To: the mask stops, the 0.1 and 0.14 easing, collapse on leave, a loop that stops when settled) |
| A model drawn as line art that comes apart, a scan that turns a wire cage into a surface (the component catalogue) | `techniques/high.md`, Wireframe 3D | `build-wireframe-scan-reveal` (Meng To: one world-space front for both, the lag, rim and trail, cage disposal, the 62 % still) |
| A photograph as points with a hole the pointer punches (the component catalogue) | `techniques/high.md`, Particles | `animaxxing-webgl` (`imageShape`: sample a small copy once, CORS) |
| A pile of blocks, a model exploded by scroll, a rack of swinging garments (the component catalogue) | `techniques/yolo.md`, Physics and drag | written from the recordings; matter-js (MIT) named as the 2D engine |
| A wordmark standing inside a modelled scene (the component catalogue) | `techniques/fast.md`, Text that performs its sentence, and `techniques/yolo.md`, Real-time 3D world | written from the recordings |
| Loaders that are title sequences (the component catalogue) | `recipes-motion.md` §24 | `choreograph` (never block what is ready; under reduced motion, jump between frames) |
| A lightning edge; a tube switched on (the component catalogue) | `techniques/fast.md`, Neon glow and Retro VHS | written from the recordings, not measured |

`comic-book-style` (arjun988) was read and gave nothing beyond what `drawn-assets.md` already says (two or three tone bands, strong contours, restrained screentone).
