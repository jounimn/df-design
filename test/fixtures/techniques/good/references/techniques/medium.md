# Medium techniques

The page draws on a canvas and still loads quickly (see `audition.md` §4).

| Technique | What the visitor sees | Suits |
|---|---|---|
| Particles | Hundreds of dots that follow the pointer | Playful brands |

## Particles

### What it is

Hundreds of dots that gather toward the pointer and scatter again.

### Suits

Playful brands; see [Pixel art](../identity-library.md#pixel-art).

### What it costs the visitor

not measured

### Lighter version

[Particles](fast.md#particles): the same dots as a few SVG circles.

### For the builder

One `dfCanvasLoop` call with `context: '2d'`, a `poster` that draws the dots at rest.

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- Not measured.
