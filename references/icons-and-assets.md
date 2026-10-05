# Icons and visual assets

Every icon on a page is a licence decision and an identity decision at the
same time. Most pages get the first one wrong quietly and the second one
wrong loudly.

This file covers both: what you may legally ship in commercial work, and
how to make an icon set read as part of the design rather than bolted on.

Licences change. Every row here was correct when written, and none of it is
legal advice — **check the repository's own LICENSE file before you ship**.
That check costs thirty seconds and is the whole difference between an
asset you own the right to use and one you do not.

---

## 1. The sets you can ship commercially

Permissive, no attribution required, no "free tier" that quietly excludes
commercial use. These are safe defaults.

| Set | Licence | Count | Shape | Best for |
|---|---|---|---|---|
| **Lucide** | ISC | ~1,500 | 24px, 2px stroke | The default. Community fork of Feather, actively maintained, first-class React/Vue/Svelte packages. |
| **Phosphor** | MIT | ~9,000 | 6 weights: thin → fill, plus duotone | Products that need a weight axis. The thin weight is the cheapest way to look expensive on a dark UI. |
| **Tabler** | MIT | ~5,800 | 24px, 2px stroke | Dense admin and dashboard work. Largest permissive outline set. |
| **Heroicons** | MIT | ~300 | 24px outline + solid, 20/16 solid | Tailwind projects. Built by Tailwind Labs, so the sizing lines up with the default scale. |
| **Radix Icons** | MIT | ~300 | 15px, crisp | Dense chrome — toolbars, menus, table headers. Designed at one size and not scalable without going soft. |
| **Feather** | MIT | ~280 | 24px, 2px stroke | Minimal needs. Effectively frozen; prefer Lucide. |
| **Remix Icon** | Apache-2.0 | ~2,800 | 24px outline + fill | Needing outline/fill pairs of the same glyph. |
| **Material Symbols** | Apache-2.0 | ~3,700 | Variable: weight, fill, grade, optical size | Android-adjacent products, or when you want a true variable-font icon axis. |
| **Bootstrap Icons** | MIT | ~2,000 | 16px base | Bootstrap projects. |
| **Carbon Icons** | Apache-2.0 | ~2,200 | 16/20/24/32 | Enterprise data products. IBM's set; pairs with IBM Plex. |
| **Iconoir** | MIT | ~1,600 | 24px, 1.5px stroke | A lighter stroke than Lucide without going to Phosphor Thin. |
| **Octicons** | MIT | ~600 | 16/24 | Developer tools, repository UI. |
| **Simple Icons** | CC0-1.0 | ~3,300 | Brand marks | Logos of companies and products. **Read the trademark trap below.** |

### Supporting assets

| Asset | Licence | Notes |
|---|---|---|
| **unDraw** | Open licence, no attribution | Flat illustrations, recolourable to one brand hue at download. The one illustration source that does not demand a credit line. |
| **Open Peeps** | CC0 | Hand-drawn people, mix-and-match. |
| **Hero Patterns** | CC BY 4.0 | SVG background tiles. **Attribution required.** |
| **Google Fonts** | Mostly SIL OFL | Check per family — a handful are Apache-2.0 or Ubuntu Font Licence. |
| **Fontshare** | Free for commercial use | ITF's library. Where to find a display face that is not Inter. |
| **Iconify** | Framework MIT; **sets keep their own licences** | An aggregator, not a licence. See the trap below. |

---

## 2. Three traps that cost real money

**Font Awesome Free is CC BY 4.0.** The icons require attribution. The code
is MIT and the fonts are OFL, which is what people read, and then they ship
the icons with no credit line. If you want attribution-free, take Lucide or
Phosphor and move on. Everything Font Awesome Free gives you exists in a
permissive set.

**Simple Icons is CC0, but the logos are trademarks.** CC0 waives the
*copyright* in the SVG path data. It grants you nothing under trademark
law. You may render a company's mark to link to that company; you may not
use it to imply they endorse, sponsor or supply you. The licence is not the
permission you actually need — their brand guidelines are.

**Iconify is not a licence.** It is a delivery framework over 200+ sets,
each carrying its own terms. `@iconify/react` being MIT says nothing about
the set you just pulled a glyph from, and some of those sets are
CC BY or non-commercial. If you use Iconify, pin a specific set and check
*that* set's licence.

A fourth, less expensive but more common: **"free" that means "free tier".**
Several popular icon products ship a small free set and a paid full set
under one brand. Check whether the icon you picked is in the permissive
half before you build a UI around it.

---

## 3. One set. Never two.

Mixing icon sets is the visual equivalent of mixing font families at random
and it is immediately legible to anyone looking. Stroke widths disagree,
optical sizes disagree, corner treatments disagree. The page reads as
assembled rather than designed.

Pick one set for the entire product. When it is missing a glyph, draw the
glyph in that set's grid and stroke width — every set above publishes its
grid — rather than importing a second set for one icon.

The exception that is not an exception: **brand marks are not icons.**
Simple Icons alongside Lucide is fine, because a GitHub logo and a
"settings" glyph are different categories and no reader expects them to
share a stroke width.

---

## 4. Making icons match the type

An icon set is chosen against the type, not in isolation. The failure is
always the same: a 2px-stroke icon beside 13px text, so the icon out-weighs
the word it labels and the eye goes to the wrong thing.

| Type weight | Icon stroke | Set |
|---|---|---|
| Light / regular UI text | 1–1.5px | Phosphor Thin or Light, Iconoir |
| Medium UI text (most products) | 1.5–2px | Lucide, Tabler, Heroicons outline |
| Bold, condensed or industrial | 2–2.5px, or solid | Phosphor Bold, Heroicons solid |

Rules that hold across the measured sites:

- **Size icons to the cap height of the text they sit beside**, not the font
  size. A 16px icon beside 14px text already looks slightly large; 20px is
  wrong.
- **Optical alignment beats metric alignment.** Centring an icon on the text
  baseline box leaves it looking low. `translateY(-0.5px)` on an inline icon
  is a real adjustment, not fussiness.
- **Icons inherit colour.** `stroke="currentColor"` / `fill="currentColor"`
  and never a hardcoded hex, so one token change moves every icon and dark
  mode costs nothing.
- **Decorative icons are invisible to screen readers.** `aria-hidden="true"`
  when a text label sits beside it; an `aria-label` only when the icon *is*
  the control.

### The restraint finding

On the measured production sites, icons appear in navigation, status and
dense tabular chrome — and almost nowhere else. None of the thirty put an
icon in a hero. None used one icon per feature-list item, which is the
single most recognisable template tell: three columns, three circled
icons, three paragraphs.

If a section needs an icon per item to feel designed, the section needs
better type and spacing instead.

---

## 5. Shipping them

```bash
npm i lucide-react        # ISC
# or
npm i @phosphor-icons/react   # MIT
```

```tsx
import { ChartLine, Table, Sparkle } from "lucide-react";

// Size to cap height; colour from the token system; hidden from AT when labelled.
<ChartLine size={16} strokeWidth={1.5} aria-hidden="true" className="text-ink-muted" />
```

**Import per glyph, never the barrel.** `import * as Icons` or
`import Icons from "..."` pulls the entire set into the bundle; both
packages above are tree-shakeable only if each glyph is named. A 9,000-icon
set imported wholesale is a megabyte of SVG for the six glyphs you used.

Check it: build, then confirm the icon chunk is kilobytes, not megabytes.
This is one of the few design decisions with a number attached — use it.

For a handful of glyphs, skip the dependency entirely and inline the SVGs
as components. Copy the paths from the set so the grid and stroke stay
consistent, and keep the licence note in the file header.

---

## Red flags

| Thought | Reality |
|---|---|
| "It's free to download, so it's free to use" | Free download, attribution-required, and non-commercial are three different things. Open the LICENSE. |
| "Font Awesome is the standard" | Font Awesome Free is CC BY 4.0 — you owe a credit line. Lucide and Phosphor owe nothing. |
| "Simple Icons is CC0, so I can use their logo" | CC0 waives copyright, not trademark. Check brand guidelines, not the licence. |
| "Iconify is MIT" | The framework is. The 200+ sets are not, and some are non-commercial. |
| "I'll grab this one icon from another set" | Stroke width and grid will not match, and it reads immediately. Draw it in your set's grid. |
| "An icon per feature will make the section feel designed" | Three circled icons in three columns is the template tell. None of the thirty measured sites do it. |
| "Bigger icons are clearer" | Size to cap height. An icon that out-weighs its own label sends the eye to the wrong place. |
| "`import * as Icons` is tidier" | It ships the whole set. Name every glyph or the bundle carries thousands you never render. |
