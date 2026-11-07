# Drawn assets

Some identities have a hand: an instruction manual draws its steps, a
bakery bulletin is marked up with a pen, a comic is inked. For those, the
icons, the doodles in the margin and the small illustrations are drawn for
the project, in the identity's own line, the same way the logo is
(`selling-positioning.md` §2). This file covers when to draw, how to derive
the line from the brief, and how to check a set before it reaches a page;
then, for a drawn story, how a living character is built (§6), how key art
is generated on the project's own machine (§7), how the ink pass forces
any picture into the brief's inks (§8), how a 3D character is rendered in
the same ink (§9) and how water, smoke and sparks are drawn frame by frame
(§10). When the identity is led by
illustration and the author supplies no concept art, the concept bible
(story spine, character, form and style sheets) is written first, in
`illustration-concept.md`, and every drawing here is made from it.

Library icon sets and stock illustration are in `icons-and-assets.md` and
`images.md`. A drawing never replaces a photograph or the product
(`reviews.md` §2, "a drawn illustration where a photograph or the product
should be").

---

## 0. When to draw

Draw when the brief says the identity has a hand, and write it in the brief
as a `Drawn:` line (`identity.md` §8):

- the **Grammar** names a drawn surface or imagery: line art, marker, ink,
  etching, risograph, a manual's callouts, a comic's panels
- **no icon set fits** a strongly historical or crafted identity
  (`icons-and-assets.md` §0), so the dozen glyphs the product needs are
  drawn as the set
- the **subject** is drawn by nature: a comic, a children's book, a map, a
  patent, a recipe card

Do not draw because a page feels empty. An empty screen needs a
photograph, the product or better type (`gates.md` §5, "A full page").

---

## 1. What a drawing does on a page

Every drawing has a job you can name. These are the jobs:

| Job | Example | Rule |
|---|---|---|
| **Annotate** real content | circle the date, an arrow to the price, a tick beside a done step | Annotate body and data, never a single word in a head (`accented-word`) |
| **Divide** | a drawn rule or a margin mark between bands | One divider shape for the whole site |
| **Explain** | a manual's step diagram, an exploded view, a route | The drawing carries information the text does not |
| **Stand in** for an empty, error or loading state | the 404, an empty cart, a search with no results | Never in a state that has real content to show |
| **Label** | the drawn icon set | Every rule of `icons-and-assets.md` §0, §3–§4 still applies: one set, cap-height size, beside a word |
| **Mark** | a stamp, a sticker, a seal on a changed fact | Spend it where a fact changes, like the hint |

A drawing with no job is decoration. Decoration in the hero, one doodle per
feature item, and a doodle beside every heading are the drawn version of
the template tells (`icons-and-assets.md`, "The restraint finding").

---

## 2. The line comes from the brief

Decide the line before drawing anything, and write it in the `Drawn:` line.

**Stroke** follows the type, as icons do (`icons-and-assets.md` §4): the
weight of the text the drawing sits beside, at the size it is drawn.
**Colour** is `currentColor` or a `var(--token)`: ink on the ground, the
base pair. The design hint goes on a drawing only when the drawing is the
subject or the mark, and it counts toward the hint's places
(`recipes-design.md` §2).

**Character** follows the identity's surface:

| Surface in the brief | Construction | roughen |
|---|---|---|
| Technical pen, manual, patent, blueprint | butt or square caps, mitre joins, one width, hatching at one angle for shade | none, or `--amount 0.2` |
| Marker, felt-tip, a pen on a printed sheet | round caps and joins, one width | `--amount 0.8` to `1.2`, `--step 3` |
| Pencil, sketchbook | round caps, a thinner width, two passes of the same stroke with different seeds | `--amount 1` to `1.5` |
| Etching, engraving, woodcut | outlines plus parallel hatch lines for tone, no gradients | `--amount 0.3` |
| Comic ink, webtoon | a heavy contour (about twice the inner line), thin inner lines, solid blacks as filled shapes | `--amount 0.4` on the contour only |
| Risograph, screen print | flat filled shapes in the spot colours, the second colour offset 1 to 2px | none; the offset is the hand |
| Brush | filled shapes, not strokes: draw the outline of the brush mark | `--amount 0.6` on the outline |

One character per site. A marker doodle next to an etched illustration is
two hands, which reads the way two icon sets do.

---

## 3. Construction

1. **One grid.** Icons and doodles share one `viewBox` (`0 0 48 48` is a
   good default; a drawn icon set may follow the library set's grid). Spot
   illustrations share another (for example `0 0 320 240`).
2. **One width, one cap, one join** across the set, set on the root `<svg>`
   so every path inherits them.
3. **Clean geometry first.** Draw the shapes as plain paths, lines,
   circles and polygons. Then give them the hand, if the character has one:

   ```bash
   node scripts/draw.mjs roughen drawn/clean/cup.svg --seed 12 --amount 0.9 --out drawn/cup.svg
   ```

   Every path and shape is sampled along its length, moved along its
   normal by seeded noise, and written back as one smooth path. The same
   seed gives the same drawing. Use one seed per set and record it.
4. **No live text, no raster, no script** inside a drawing. Words belong in
   the page, where they are read, translated and found. Outline lettering
   that is part of the drawing.
5. **Light.** A doodle is under 16 KB. Past that, raise `--step` or simplify
   the clean geometry.

---

## 4. Check the set, then look at it

```bash
node scripts/draw.mjs check drawn/ --stroke 2 --palette "#FFC21A"
node scripts/draw.mjs sheet drawn/ --ground "#ECEFEA" --ink "#161F1D" --out drawn/sheet.png
```

`check` fails a raster, live text, a script, a colour that is not
`currentColor`, a token or the palette, a width other than the set's, and a
missing `viewBox`. Mixed `viewBox`es, widths and caps are warnings. `sheet`
draws every file on the brief's ground and ink, inverted, and three times at
24px.

Open the sheet and answer, in writing, before any drawing goes on a page:

- Is it **one hand**? Same width, same wobble, same corners across the set.
- Does it **read at 24px**? A drawn icon that blurs into a blot at icon size
  is an illustration, not an icon.
- Does it work **inverted**? It will sit on the dark band or the dark theme.
- Does every drawing have **its job** from §1?

---

## 5. Shipping them

- Inline the SVG. A drawing beside a label is `aria-hidden="true"`; a
  drawing that carries meaning alone gets `role="img"` and an `aria-label`.
- Motion, when the identity moves: a drawing may draw itself on once, as it
  enters (`stroke-dasharray` and `stroke-dashoffset` with `pathLength="1"`).
  Under reduced motion it is already drawn. Never loop it.
- Record every drawing in the asset record (`images.md` §5): the file,
  "drawn for this project" as its source, no licence needed, the seed,
  amount and step it was roughened with, and the pages it is on.
- In a selling-positioning presentation, the drawn set sits beside the logo
  system and shares its line (`selling-positioning.md` §2).

---

## 6. Living characters: anatomy first

Any living character (a person, an animal, a creature, a hand) is built on
an anatomical structure before it is drawn, whatever makes the picture: a
pen, code, an image model's init, or a 3D rig. Style may bend the anatomy
only after the anatomy is there. Without it every pose looks wrong in a way
no texture hides: limbs from tubes, shoulders and hips parallel, hands as
mittens.

1. **Proportions.** The figure's height in heads, written down (a slight
   teenager about 7, an old woman with a stooped spine about 6.5), and the
   joints placed on that grid.
2. **Gesture.** The line of action, then the shoulder line and the hip line,
   tilted against each other in every standing pose (contrapposto: the
   weight on one leg).
3. **Skeleton, then masses.** The rib cage, the pelvis, the trapezius and
   deltoids, the bulge of each limb. Hands from their bones: metacarpals to
   the knuckles, three phalanges per finger with their curl, the knuckle
   creases and the nails; a grip mode where the fingers wrap the object.
4. **Silhouette, then clothing.** One union outline over the masses, then
   the clothes over the body with their folds at the joints, then the hair.
5. **The construction sheet is kept** beside the drawings, and each figure
   is checked against it before it goes into a scene.

In 3D the same order holds: an anatomical base mesh with a rig (`blender-character-rigging`),
posed with IK, never a figure assembled from primitives. A generated figure
is checked against the same sheet: the head count, the tilt of the lines,
five fingers that do not fuse.

---

## 7. Generated key art, local

### What it is

The key panels of a drawn story (the sets, the figures, the close-ups of
hands and eyes) made by a local open-weight image model on the project's own
machine, then forced into the brief's inks by the ink pass (§8). Code keeps
everything else: the compositing, the camera, the cuts, the SFX lettering,
the balloons, the sound and the interface.

### Where it comes from

Text-to-image diffusion run on the CPU: [stable-diffusion.cpp](https://github.com/leejet/stable-diffusion.cpp)
running [FLUX.1-schnell](https://huggingface.co/black-forest-labs/FLUX.1-schnell),
a four-step model whose weights are Apache-2.0.

### Suits

A drawn identity with a hand (comic ink, etching, woodcut, scratchboard)
when no illustrator is supplied: the illustrated scroll story
(`techniques/yolo.md`), the webcomic experience (`identities/digital.md`).
Ask first: the tier message asks whether an illustrator or a 3D artist is
supplied, and generated art is what the author agrees to when none is. It is
never a product photograph, a real person, or a brand's own characters.

It closes part of the gap to an illustrator, not all of it. In a trial of
2026-11 the figures read as people for the first time (a girl's weight on a
cliff, coat folds, the back of a rower, a hand with knuckles and nails), but
the model drifted to a grey airbrushed engraving, drew glow, suns and moons
it was told not to, and misread an invented object (a falling piece of the
sky came out as a mountain, a sun, a sail and a boat). The ink pass is
therefore not optional.

### What it costs the visitor

Nothing beyond the pictures: after the ink pass a panel has two or three
colours, and lossless WebP of three inks compresses to little. A
nine-set episode of inked key art weighed 1.4 MB at the first view and
4.1 MB after a full scroll (measured 2026-11-07, `check-motion --tier yolo`).
The cost is the builder's, in hours of CPU:

| Step (Intel i5-10210U, 4 threads, no GPU) | Measured |
|---|---|
| Model load, 6.4 GB of weights | 8 s warm, 20 s cold |
| Text encoding | 21 s |
| One sampling step | 341 s at 768x432, 567 s at 1024x576 |
| VAE decode, tiled | 160 s |
| One 768x432 image, with RAM free | about 20 to 30 min |
| The same under memory pressure (2.8 GB free, other apps open) | about 50 to 70 min; one 1024x576 image took 123 min |
| Peak RAM | 9.6 GB |

A whole episode (nine sets of about five layers, about four tries each) is
about 180 generations: about 70 h of CPU at 768x432, and impractical at
1536x864 (about 25 min a step). On a rented 24 GB GPU the same run is under
an hour. Close the other applications before a run.

### Lighter version

An illustrator's own drawings; for simple sets and props, the code-drawn
line of §3; for a figure that must move, a 3D character (`techniques/yolo.md`,
"Illustrated scroll story").

### For the builder

**The stack.** Every part has a commercial licence, read on its own page,
and a checksum recorded against the release digest or the Hugging Face LFS
hash:

| Part | Licence |
|---|---|
| stable-diffusion.cpp, a release build for the machine (the CPU build picks AVX2 at runtime) | MIT |
| FLUX.1-schnell, quantized GGUF (Q4_0 runs in 9.6 GB) | Apache-2.0 |
| `ae.safetensors`, the VAE of FLUX.1-schnell | Apache-2.0 |
| `clip_l` text encoder | MIT |
| `t5xxl` text encoder, quantized GGUF | Apache-2.0 |

Never FLUX.1-dev, FLUX.1 Kontext dev or any weights under a non-commercial
licence, and never a model whose card does not state its weights' licence.
The weights live outside the repository, like the cutout models
(`licenses/cutout-models.md`).

**The prompts.**

- **A style head per ground,** the same for every panel of that ground. For
  night: flat black ink, white contour, directional hatching that follows
  each form, screentone for the mid-tones, hard edges; "the sky is flat black
  with small white stars, no gradient, no glow, no bloom, no sun, no moon,
  no sunset". For day: black ink on flat newsprint, the same marks, "no
  gradient, no glow, no airbrush".
- **No full faces.** Characters seen from behind, as hands, as eyes, or in
  profile. Faces change between shots, and a full face is where a generated
  figure fails first.
- **No text.** "No letters, no numbers and no words anywhere"; every letter
  the page needs is HTML or drawn SFX.
- **The story's object described concretely.** The model has no idea of an
  invented thing, so give it a shape, a size, a material and the colour of
  its edge ("a jagged flat slab of night sky the size of a boat, black
  inside and full of tiny white stars, its broken angular edges outlined in
  flat hot pink").
- **One sentence per character,** repeated word for word in every prompt
  (age, build, hair, the one garment). It is what keeps the character the
  same across shots.

**The modes.** Text-to-image for most panels, 4 steps, cfg 1, euler.
Image-to-image only where a composition must hold, at strength 0.5 to 0.6,
from an init built from the layout's own layers with no interface baked in;
at 0.7 and above the four-step model all but ignores the init.

**Seeds and rejection.** Two seeds per panel, a third only when both fail.
Put both side by side on a contact sheet and reject a full face, fake
letters or glyphs, a glow halo, a moon or a sun, fused fingers, and the
story's object drawn as something else (a boat, a comet, a crescent moon).
A small fault is fixed, not regenerated: `--erase` fills a part the model
drew against the prompt with ink, and a prop can be cut from another
generation of the same beat (`scripts/cutout.mjs`).

**The run.** Generations go in the background, one at a time (two at once
page the memory), from a queue script that writes a progress file after
every step: the panel, the seed, the step, the start and end times, the
output. Check the progress file; never hold the session on one blocking
call that runs for an hour.

**The record.** Each generated file gets a row in the asset record
(`images.md` §5): the model, its quantization, source repository and
licence; every checksum; the runner and its version; the seed, steps, cfg,
sampler and size; the prompt (or the prompt file and its key); the mode,
with the strength and the init; the ink settings, which `ink-pass.mjs`
prints as the treatment; the cutout model. No copyright is claimed over a
raw generation, and no prompt names a real person, a brand or an existing
artwork.

---

## 8. The ink pass

A generated panel, a 3D render or a scan comes out in greys, gradients and
off-palette colour. The ink pass turns it into the brief's inks,
deterministically:

```bash
node scripts/ink-pass.mjs ink raw/fall.png --out art/fall --brief docs/identity.md --width 3072,1200
node scripts/ink-pass.mjs ink raw/row.png --out art/row --ink "#141019" --paper "#F0EBDF" --hint "#2E7DFF" --map paper --cutout person
node scripts/ink-pass.mjs layers art/row@3072.png --out art --name row --alpha art/row.figure.png --fill "#141019"
```

- **The inks come from the brief,** the `Hint:` line's base pair and hint
  (`--brief`), or from `--ink`, `--paper` and `--hint`. Nothing falls back
  to a built-in palette.
- **Hatching that follows the form.** The stroke direction comes from the
  image's structure tensor, along the contours and across the gradient; a
  seeded line-integral convolution along that field draws the strokes, their
  coverage set by the tone, with a crossing layer in the darkest tones. Where
  the picture has no structure (open sky, fog, a flat wall) a clustered-dot
  screentone stays. `--texture dots` makes it screentone everywhere.
- **The maps,** one per ground: `ink` (dark to ink, light to paper),
  `paper` (inverted, so a light-line night drawing becomes ink line on
  paper), `hint` (inverted onto the hint as the whole ground, for a set inside
  the hint's light), `hintlit` (night, with what the light reaches in the
  hint).
- **The hint only through a mask,** never over a figure. The mask is the
  source's own colour near the hint's hue (`--hint-hue` to set the range,
  `--hint-mask` to give one), minus `--exclude` boxes and minus the figure.
- **Figure and background layers.** `--cutout person` (or `object`) cuts the
  figure with `scripts/cutout.mjs` and keeps its alpha; `layers` writes the
  background with the figure's place filled with the set's ground, grown so
  no outline shows when the planes move apart, and the figure on its own
  transparent plane at full frame, so both stay in register. `--alpha
  ellipse` feathers a small piece set into another panel.
- **Crisp at every size.** The source is upscaled with Lanczos and an
  unsharp mask, and each `--width` is inked on its own: resizing a finished
  screentone or hatching blurs it.
- **Levels and fixes.** `--lo` and `--hi` set where solid ink and solid
  paper begin (0.18 and 0.72 by default; lower `--lo` and raise `--hi` to
  hatch more of the picture); `--erase` fills an ellipse with ink; `--seed`
  moves the strokes.

It runs on Python 3 with numpy and Pillow: the cutout tool's venv
(`node scripts/cutout.mjs setup`), or any Python that has both
(`node scripts/ink-pass.mjs doctor` says which). It prints the share of each
ink, the share that was hatched, a warning if any hint landed on the
figure, and the treatment line for the asset record. Look at every result
at 100 % before it goes on a page: the hatching runs along the forms, the
figure carries no hint, and nothing the model drew against the prompt is
left.

---

## 9. Characters rendered as ink

A drawn character can hold a pose; it cannot turn and walk through a cut
without an animator's frames. When the story needs that movement
(`recipes-motion.md` §16), the character is 3D, built on the anatomical
base of §6, and rendered so it carries the sets' line and tone. The recipe
below is adapted from the `blender-stylized-npr`, `blender-character-rigging`,
`blender-animation`, `blender-rendering` and `blender-export-pipelines`
skills (EL4CTEO/blender-skills, MIT) and the `threejs-materials` and
`threejs-performance` skills (CloudAI-X/threejs-skills, MIT), for Blender
5.2 and three.js r186.

**The look, in Blender.**

- **Bands, not gradients.** Two tone bands (three for a hero close-up), the
  edge softened by about 0.02 so it does not alias. The shadow band is a
  multiply by a tint taken from the brief's ink, never grey or black.
- **One key light,** the set's light: its direction drives the bands, so the
  figure is lit from where the drawing says the light is.
- **Standard view transform.** AgX and Filmic desaturate flat colour; the
  bands must come out at the brief's values.
- **No bloom, no ambient occlusion:** both fight the flat look.
- **The contour.** An inverted hull (a Solidify modifier with flipped
  normals and an outline material that shows only back faces), 2 to 6 mm
  wide on a 1.75 m figure, thinner at the fingertips through a vertex group;
  apply the scale and merge by distance first. The hull misses inner creases
  and the lines where two parts cross: add Line Art (contour, crease and
  intersection) for those. In 5.2 the Line Art `radius` is the line's full
  width in metres; pick it from the pixel size of the render, never by eye.
- **Hatching,** when the sets are etched, is not modelled: render the bands
  and pass the frames through `ink-pass.mjs` (§8) with the set's settings,
  so the figure and the set share one hand.

```python
# Inverted hull on a character (Blender 5.2). The outline material shows back faces only.
md = ob.modifiers.get("NPR_Outline") or ob.modifiers.new("NPR_Outline", "SOLIDIFY")
md.thickness, md.offset = 0.004, 1.0
md.use_flip_normals, md.use_rim, md.use_quality_normals = True, False, True
md.material_offset = ob.data.materials.find("NPR_Outline")
# Line Art for the inner lines the hull cannot draw (needs a scene camera).
la = lines_ob.modifiers.new("LineArt", "LINEART")
la.source_type, la.target_layer, la.target_material = "SCENE", "Lines", ink_mat
la.use_contour = la.use_crease = la.use_intersection = True
la.radius = 2 * px_size                                # 2 px wide at the render's scale
```

**Moving it.** A rigged base mesh posed with IK (Rigify gives IK/FK
switching), one action per clip, first and last frame identical for loops,
authored at 24 fps, baked to keys before export (constraints and the cycles
modifier do not export).

**Two ways to the page:**

| | Rendered frames | Live in three.js |
|---|---|---|
| What ships | transparent PNG or WebP frames per plane | one GLB with its clips |
| When | the figure moves on a fixed path through a cut; full Line Art and the ink pass are kept | the figure turns to the pointer or the camera is free |
| Render | `film_transparent`, an orthographic or locked camera matching the set's plane, frames first and the video or sheet after | `MeshToonMaterial` with a stepped gradient map, the hull as a second material, `AnimationMixer` scrubbed by the scroll |
| Weight | the frames: count them in the tier message | hero character 10 to 30 k triangles, 1 or 2 materials, textures 2048 at most, under 100 bones, the GLB under 5 MB |

Rendered frames, per plane with alpha, from the command line:

```bash
blender -b scene.blend -E BLENDER_EEVEE -o //render/monk_#### -F PNG -s 1 -e 48 -a
# EEVEE needs a GPU even headless; without one use Cycles on the CPU or Workbench.
```

Set `scene.render.film_transparent = True` and, in Blender 5, the image
`media_type` before the `file_format`. Render each plane (the figure, its
FX, the set) as its own pass so the page can move them apart (§8,
`recipes-motion.md` §17).

Live, the toon look is rebuilt in the engine (node shading does not export):

```js
const steps = new Uint8Array([90, 255]);                       // two bands; the array length is the band count
const bands = new THREE.DataTexture(steps, steps.length, 1, THREE.RedFormat);
bands.minFilter = bands.magFilter = THREE.NearestFilter;        // hard steps; data, so no colour space
bands.needsUpdate = true;
const skin = new THREE.MeshToonMaterial({ color: '#d9cbb4', gradientMap: bands });
// The hull: the same geometry, back faces only, pushed out along the normals.
const hull = new THREE.MeshBasicMaterial({ color: '#141019', side: THREE.BackSide });
hull.onBeforeCompile = (shader) => {
  shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>',
    '#include <begin_vertex>\n transformed += normalize(normal) * 0.004;');
};
```

Export from Blender as GLB with Draco or meshopt geometry and WebP or KTX2
textures (`gltf-transform optimize in.glb out.glb --texture-compress ktx2`),
load it with `GLTFLoader` and a single shared `KTX2Loader`, and compile it
with the rest before the first cut (`recipes-motion.md` §24). Lights are
switched by intensity, never added or removed at runtime: either recompiles
every toon material.

A figure that reads as a mannequin beside the drawn sets goes back to
modelling and shading; it does not go on the page.

---

## 10. Drawn effects, frame by frame

Water, smoke, sparks, an ink splash and a pour are drawn as a few frames in
the set's hand and played in a loop (`recipes-motion.md` §25), never
simulated with particles or a shader. Grease Pencil in Blender 5.2 draws
them from Python as data, so every frame is reproducible; the notes below
are adapted from the `scenario-blender-grease-pencil` skill (scenario-labs,
MIT).

- **Frames:** 6 to 12 per cycle at 24 fps on twos (each drawing held two
  frames). Draw effects straight ahead, frame after frame; interpolate only
  between drawings with the same strokes in the same order.
- **Holds and cycles** reuse a drawing instead of copying it
  (`frames.copy(f, n, instance_drawing=True)`), and an empty key ends the
  effect.
- **Impacts:** heavier lines on the impact frame; repeated hits duplicated
  and offset so they do not look stamped.
- **Flat colour:** set `use_lights = False` on every layer, or the inks render
  at a quarter of their value. A stroke is filled when its `fill_id` is not 0.
- **Width:** a point's `radius` is half the line width in metres; for an
  orthographic camera one pixel is `ortho_scale / max(resolution)`.
- **Write-on:** the Build modifier draws a stroke on over time, for a line
  that inks itself.
- **Render:** orthographic camera, `film_transparent`, Standard view
  transform, PNG with alpha; then tile the frames into one sheet with ffmpeg
  (`tile=4x3`) for `dfStory.flipbook`. A back layer and a front layer are
  rendered separately, so the figure sits inside the effect.

```python
# A smoke frame as data (Blender 5.2, Grease Pencil v3). Draw brushes cannot run from a script.
gp = bpy.data.grease_pencils.new("Smoke"); ob = bpy.data.objects.new("Smoke", gp)
layer = gp.layers.new("Lines"); layer.use_lights = False
drawing = layer.frames.new(1).drawing
points = [((0.0, 0.0, 0.1 * i), 0.004 + 0.002 * (i % 3)) for i in range(24)]   # (position, radius) along the curl
drawing.add_strokes([len(points)])
for p, (co, r) in zip(drawing.strokes[0].points, points):
    p.position = co; p.radius = r                      # radius is half the width, in metres
drawing.tag_positions_changed()
layer.frames.copy(1, 3)                                # next drawing starts as a copy, then is redrawn
```

Record each effect in the asset record like any drawing (§5): "drawn for
this project", the script and seed that made it, the frame count and rate.

---

## Red flags

| Thought | Reality |
|---|---|
| "The page looks empty, a doodle will help" | An empty screen needs a photograph, the product or better type. Every drawing has a job (§1). |
| "A cute doodle per feature" | One drawing per item is the drawn feature grid. Annotate real content instead. |
| "I'll draw the product" | Show the product. A drawing where the product should be is a finish-review finding. |
| "Some marker doodles and an etched hero" | One character per site (§2). Two hands read as two icon sets. |
| "I'll wobble each one by eye" | `draw.mjs roughen` with one seed for the set: the same hand everywhere, and it can be redrawn. |
| "The label is part of the drawing" | Live text inside an SVG is not read, translated or found. Set it in the page. |
| "It looks right at 200px" | Run `sheet`: it has to read at 24px and inverted too. |
| "The doodles can be in the hint colour" | The hint goes on a drawing only when it is the subject or the mark, and it counts toward the hint's places. |
| "The figure reads well enough from its silhouette" | A living character starts from its skeleton and proportions, then volume, then clothing (§6). Without them every pose looks wrong. |
| "The generated panel is close enough to the identity" | Run the ink pass (§8): the model's greys, glow and off-palette colour are not the brief's inks. |
| "I'll wait for this generation to finish" | Run it in the background with a progress file (§7). One image can take an hour on a laptop. |
| "A particle system will do for the pour" | In a drawn world the liquid, the smoke and the sparks are drawn frames on twos (§10). A shader effect is the one thing that breaks the etching. |
| "The 3D figure is shaded, so it fits the sets" | Bands with an ink-tinted shadow, a contour, the Standard view transform and the ink pass (§9). A smooth-shaded figure beside etched sets is a mannequin. |
| "Any open model will do" | Only weights whose own licence allows commercial use, with the checksum recorded; never a dev or non-commercial release (§7). |
