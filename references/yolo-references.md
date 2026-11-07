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

`comic-book-style` (arjun988) was read and gave nothing beyond what `drawn-assets.md` already says (two or three tone bands, strong contours, restrained screentone).
