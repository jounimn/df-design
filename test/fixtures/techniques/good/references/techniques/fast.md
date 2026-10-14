# Fast techniques

The page loads at once and moves with CSS or SVG only (see `audition.md` §4).

| Technique | What the visitor sees | Suits |
|---|---|---|
| Particles | A few dots drifting | Calm, technical brands |

## Particles

### What it is

A handful of small dots that drift slowly behind the headline.

### Where it comes from

Drifting dots go back to screensavers of the early 1990s ([Wikipedia, Screensaver](https://en.wikipedia.org/wiki/Screensaver)).

### Suits

Technical and calm brands; see [Blueprint](../identity-library.md#blueprint).

### What it costs the visitor

About 4 KB, appears with the first paint (median of 2 sites).

### For the builder

Twelve `<circle>` elements in one SVG, moved with a CSS animation. The reduced-motion contract is `recipes-motion.md` §14: the dots stay still.

#### Where the cost was measured

Fixed measurement examples; the project's references come from research (`identity.md` §6).

- example.com, 2026-10-14.
