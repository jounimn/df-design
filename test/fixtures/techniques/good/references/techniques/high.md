# High techniques

The page waits for a scene to draw and runs a 3D engine (see `audition.md` §4).

| Technique | What the visitor sees | Suits |
|---|---|---|
| Particles | Thousands of points of light | Studios, launches |

## Particles

### What it is

Thousands of points of light that gather into the logo.

### Suits

Studios and launches; see [Blueprint](../identity-library.md#blueprint).

### What it costs the visitor

About 340 KB and a 17 ms frame (median of 1 site, Intel UHD GPU).

### Lighter version

[Particles](medium.md#particles): the same idea with hundreds of dots.

### For the builder

One `dfCanvasLoop` call with `context: 'webgl2'` and a `poster`.

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- activetheory.net, 2026-10-14.
