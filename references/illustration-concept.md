# Illustration concept

When an identity is led by illustration (a drawn scroll story, a webcomic
experience, a site whose pictures are drawn for it) and the author supplies
no concept art, the skill writes the concept bible itself, **before any
art**, and carries it through the build. It is text only. Every panel,
render and transition that follows is made from it and checked against it.

Without a bible each picture is invented on its own: the character's coat
changes between shots, the story's object is drawn as something else, the
grounds repeat, and the cuts are chosen after the fact. The bible is what an
illustrator would have brought.

It lives in the project beside the identity brief (`docs/concept.md`, next to
`docs/identity.md`), the brief's `Drawn:` line points at it (`identity.md`
§8), and it is written after the identity is chosen and before the three
YOLO prototypes (`audition.md` §2), which test its beats and cuts cheaply.

---

## 1. The story spine

A treatment, then a beat table.

- **The treatment:** who wants what (and what keeps them from it), the fear
  that rules the world, the turn, the cost the hero pays, and the question
  left for the next episode. A plot of events with no want and no cost is
  not a spine.
- **The beat table:** one row per beat, with the set it happens in, the
  cut it leaves by and why that cut, and the ground it sits on. No two
  neighbouring beats share a ground; the hint is a full ground only at the
  climax. The cuts follow `recipes-motion.md` §16.

| # | Beat | Set | Leaves by | Why | Carries across | Ground |
|---|---|---|---|---|---|---|

- **Carries across:** the one shape that survives the cut and what it is on
  each side (the table that becomes a pillar, the cloud edge that becomes the
  ground), or `none` and why (`recipes-motion.md` §18).
- **The planes of each set:** listed under the table, back to front, each
  with its depth and its own motion (cloud drift, a cloth edge, the floor
  sliding), so the set is drawn or generated already split
  (`recipes-motion.md` §17).
- **The beats the reader performs** are marked in the table (hold, tap),
  with what the hold does and what scrolling past it does (`recipes-motion.md`
  §22).

## 2. Character sheets

One sheet per living character, built anatomy first (`drawn-assets.md` §6):

- **Role and age:** what they want in the story, in one line.
- **Anatomy:** height in heads, build, posture (the tilt of shoulders against
  hips, a stoop), the hands (slender, big-knuckled), anything that changes
  the silhouette.
- **Silhouette read:** what makes them recognisable as a black shape at
  thumbnail size (the hair, the coat, a prop).
- **Costume and props:** the one garment and the one object they carry, the
  same in every shot.
- **What the camera may and may not show:** for example no full face at full
  screen; silhouette, hands, eyes and profile only.
- **The hint:** whether and how the design hint touches them (the light of
  the story's object on one side of them, never their clothes).
- **The generation brief** (`drawn-assets.md` §7): the prompt skeleton (the
  style head of the ground, the one sentence that describes them word for
  word, the shot), the forbidden terms for this character, the seeds kept,
  and what rejects a generation (a full face, an older or younger face, a
  changed garment, fused fingers).
- **The 3D brief** (`techniques/yolo.md`, "Illustrated scroll story"): the
  anatomical base and its proportions, the rig and the poses the story
  needs, and the look that matches the drawn version (the line, the tone
  bands, the one light).

## 3. Form sheets

One sheet for the story's object, and one for each recurring set and prop:

- **What it is, concretely:** its size against a person, its shape, its
  edges, its material, what is inside it. An image model and a reader both
  need the thing, not its meaning.
- **What it must never be drawn as:** the readings it slides into (a sun, a
  moon, a mountain, a boat, a comet).
- **Its light:** whether it gives light, what colour, what it lights and how
  far (the hint's places, `recipes-design.md` §2).
- **Its ground:** which ground it lives on, and how it reads on the others.

## 4. The style sheet

- **The line:** the ink pass settings per ground (`drawn-assets.md` §8: map,
  texture, cell, levels), so every picture comes out in one hand.
- **The grounds rotation:** the order of grounds through the story.
- **The hint rule:** the hint's places, and nowhere else.
- **Texture:** hatching follows the form; screentone only in skies, fog and
  flat walls; no gradients, no glow.
- **The focus field:** its colour for this project (usually the hint) and the
  beats where it stands behind the subject (`recipes-motion.md` §20).
- **The effects:** each liquid, smoke or spark loop, its frame count and rate
  (on twos), and the plane it sits on (`drawn-assets.md` §10).
- **The 3D look:** the band count, the shadow tint, the contour width and the
  ink-pass settings that make a rendered figure match the drawn sets
  (`drawn-assets.md` §9).

## 5. Carry-through

- Every panel, render and transition is checked against the bible before it
  goes on the page: the character sheet, the form sheet, the style sheet,
  the beat table's cut and ground.
- A generation that breaks a sheet is **rejected, not patched**: regenerate
  with a new seed or a corrected prompt. The small fixes `drawn-assets.md` §7
  allows (erasing a stray moon, cutting a prop from another generation) are
  for faults outside the sheets, never for a wrong character or a wrong
  object.
- When a choice is made during the build (a cut changed, a prop added, a
  ground swapped after a review), the bible is updated in the same step and
  says why. The bible and the page never disagree.
- The reviews read the bible beside the page (`reviews.md`).

---

## Example: a dark webtoon series page (condensed)

An example of the format, from the text of a 2026-11 YOLO example, a webseries
named Cosmic Land. The story and characters are samples invented for it. No
art from it is part of this skill.

**Spine.** Every Friday at 23:40 a piece of the sky falls into the sea off
the cliff town of Vila Breu; whoever goes out to it comes back missing
something, so the town shuts its windows and nobody looks. Want: Tainá, 17,
keeps a bus ticket to the capital she has not used for three Fridays. Fear:
the rule; her mother rowed out ten years ago and came back without any
memory of her daughter. Turn: the lighthouse lamp jams, the fall comes
closer than ever, and a hand waves from the stone. Cost: the stone drinks
memories; when the hand of night takes hers, her mother's face breaks into
stars and is gone. Question: in her mother's handwriting, ten years old,
"Oru said he comes back on Friday." Her mother saw him too.

| # | Beat | Leaves by | Why | Ground |
|---|---|---|---|---|
| 1 | "312": the grandmother pencils the 312th tally mark | match cut: the stroke becomes the crack in the sky | the count and the fall are one thing | paper |
| 2 | The town turns its back; Tainá on the lighthouse gallery | push through the lamp's lens as it dies | the failing lamp is the turn | ink |
| 3 | The lamp will not light: hands on the jammed crank | ink wipe from the tear's light | the sky floods in | paper |
| 4 | The fall, the impact | panel break | the impact breaks the page | ink, then the hint at the impact |
| 5 | A hand waves from the stone; she runs down the stair | page turn | she commits | paper |
| 6 | The row, "hold to row" | reveal through the fog | the fog has hidden it for ten years | ink |
| 7 | The touch, "hold to touch", and the cost | match cut on stars | what she lost becomes the sky | night lit by the hint |
| 8 | Dawn, 313 | the notebook closes | the count goes on | paper |

**Character sheets (condensed).**

- **Tainá**, 17, the lead. About 7 heads, slender; the shoulder line and the
  hip line tilt against each other in every pose. Silhouette: a long dark
  low ponytail and a long dark wool coat with a high collar. Prop: the bus
  ticket. The camera shows her from behind, as hands, as eyes, or in
  profile; never a full face at full screen. The hint touches her only as
  the shard's light on the side that faces it. Generation sentence, in every
  prompt: "a slender 17-year-old girl, long dark hair tied in a low ponytail,
  a long dark wool coat with a high collar". Rejected: a full face, a face
  that reads older, a cute manga face.
- **Vó Dulce**, the grandmother who keeps the count. About 6.5 heads, a
  stooped spine, big-knuckled wrinkled hands, a knitted cardigan. Prop: a
  school notebook of tally marks bundled in fives. Shown as her hands and
  the notebook. Rejected: an old face, fake letters on the page.
- **Oru**, a boy made of night whose sky is being taken apart. Shown only as
  a hand and forearm of night full of small stars, and as a silhouette. The
  hint is the star in his hand. Rejected: two ordinary hands, a hand
  flooded in the hint.
- **Lia**, Tainá's mother, absent. Shown once, as a small memory panel: a
  woman's face with closed eyes, its lower half scattering into dots.
  Never seen whole or in the present.
- **3D brief (for all):** an anatomical base at these head counts, rigged
  for the poses of the beats (standing on the gallery, running down the
  stair, rowing, reaching), shaded in ink with a Line Art contour and three
  tone bands, lit only by the shard. A trial in that order read as
  mannequins beside the drawn sets and was kept off the page.

**Form sheets (condensed).**

- **The fallen shard of sky,** the story's object: a jagged flat slab of
  night sky the size of a boat, black inside and full of tiny white stars,
  its broken angular edges outlined in flat hint pink. Never a mountain, a
  sun, a sail, a boat, a comet or a crescent moon (each one happened). Its
  light is the only warm light at night: it tints every surface it reaches
  and casts shadows away from it. It lives on ink; at the impact the whole
  ground becomes its light.
- **Vila Breu,** the town: small shuttered fishing houses on footings behind
  the cliff lip, one vanishing point, chairs turned to the wall on Fridays.
  On ink.
- **The lighthouse:** striped, with a lamp room under a glass dome, a great
  ribbed lens and a brass crank. The beam is drawn as engraved rays, never a
  glow.
- **The dory:** her mother's old boat, an oar with "L." carved in the wood.
  On the night sea, engraved swell, never a flat shape.

**Style sheet.** Ink #100D11, newsprint #E9E4D9, one hint, stardust pink
#FF3E8E, only on the fallen sky and its light, the primary action and the
newest row of the episode index. The ink pass per ground: `ink` for night
sets, `paper` for the lamp room and the notebook, `hint` at the impact,
`hintlit` for the touch; hatching that follows the form, screentone only in
the sky and the fog. No moon, no sun, no glow, no gradient sky, no full
face, no text in a drawing.
