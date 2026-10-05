# Images

Stock photographs and illustrations for a site whose author has none, or
not enough. Icons are mandatory and live in `icons-and-assets.md`. Images
are **optional and the author decides**.

Every image that ships must pass all four rules:

1. **Free**
2. **Commercial use allowed**
3. **No attribution required**: no credit line, anywhere
4. **No watermark in the file that ships**

Licences change. Sources were checked against their own licence pages on
2026-10-05. None of this is legal advice: read the live licence on the item
page before you ship.

---

## 1. Ask, then source

**Ask in the first message**, as one line of the requirements list
(`SKILL.md`):

> May I use free stock images (free for commercial use, no credit line, no
> watermark) where you have no photos of your own? Yes, no, or only for
> some pages.

- **No:** use the author's own images, or honest labelled placeholders
  ("Fotografia: por fazer"), and design so the identity works without
  photography. The icon set is still used.
- **Yes** or **some pages:** continue below. Record which pages.

**During research** (`identity.md` §6), for each candidate identity,
shortlist which sources fit it (§2) and the search terms its grammar
implies (§3). Do not download yet. Candidates may be rejected.

**In the Assets stage**, after the author chooses an identity and before
the loading tier, pick the actual images, give them one treatment (§4) and
record them (§5). Their weight goes into the tier message (`audition.md`
§4).

Tell the author what was picked, in one message, before the tier message:

```
Images: <how many, from where, and the licence in plain words: "free for
  commercial use, no credit line"; that each file was checked for a
  watermark at full size>. They appear on <pages>, treated <the identity's
  treatment>. <Pages with no images, and why.>
Icons: <the set, its licence in plain words, the stroke, and where icons
  are used>.
Weight: <the images' total size at the sizes the page uses>.
```

If the author said no to stock images, the Images line says so and names
the placeholders that hold the space for their own photos.

---

## 2. Sources that pass

| Source | Best for | Licence | Use only |
|---|---|---|---|
| **StockSnap.io** | General photography | CC0 | The site's own "Free Download" button |
| **Burst** (Shopify, now served at shopify.com/stock-photos) | Products, small business, food, retail | Burst Photo License | Items whose licence link reads "Photo License: Burst" (`/licenses/shopify-some-rights-reserved`). Some items on the site are Creative Commons instead; check each item's link |
| **Kaboompics** | Interiors, lifestyle, food, flat lays, colour-matched sets | Kaboompics Standard License | The free download |
| **Unsplash** | Widest range, high quality | Unsplash License | Images whose button says "Download free"; **never** Unsplash+ (+ badge, lock icon, watermarked preview) |
| **Pexels** | Photography and video | Pexels License | Results on pexels.com; skip the sponsored iStock row and anything linking off-site |
| **Pixabay** | Photography, vectors, illustrations | Pixabay Content License | Skip the sponsored iStock/Shutterstock row; set the AI filter to "Authentic only" when the identity needs real photographs |
| **unDraw** | Flat illustrations, recolourable | unDraw License | Illustrations without brand logos inside them |
| **Museum open access** (Met, Rijksmuseum, Smithsonian, Art Institute of Chicago, National Gallery of Art, Cleveland Museum of Art) | Historical identities: engravings, botanical plates, posters, paintings, objects | CC0 / Public Domain | Items with the CC0 or Public Domain marker on the object page. Not every item qualifies. |
| **Rawpixel** public-domain collection | Restored vintage prints and illustrations | CC0 | Items marked "Public Domain / CC0" on the item page; premium items sit in the same search |
| **Wikimedia Commons** | Places, history, science | CC0 / PD tags per file | Files tagged CC0 or public domain; most files are CC BY or CC BY-SA, which fail |
| **Openverse** | Search across many sources | CC0 / Public Domain Mark | Tick only those two licences, then **confirm the licence on the source page**. Openverse does not verify it. |

**Fails, do not use:**

- **Freepik** (rebranded as **Magnific**), plus its sister sites **Flaticon** and **Storyset**: the free tier requires attribution
- **Reshot**: closed January 2026
- **NASA images**: public domain, but NASA asks to be credited, which breaks rule 3; and ESA- or JPL-credited images can be CC BY
- Anything **CC BY** or **CC BY-SA**, whatever the site

**Automated access.** Unsplash, Pexels, Pixabay, StockSnap and Kaboompics
often block scripted requests with bot checks, so an agent may be unable to
read the item page and confirm its licence. Burst, Wikimedia Commons and
the museum collections answered scripted requests when this file was
written (the three README examples with images were sourced through them, or from a
Pexels CDN file with its page licence confirmed). When an item page cannot
be read, do not guess its licence. Use another source, or ask the author
to confirm it in a browser.

### The traps

Free stock sites mix paid, watermarked items into free results. **Check the
item, not the site.**

1. **A watermark in the preview** almost always means a paid item. Leave it.
2. **Sponsored rows** (iStock, Shutterstock, Getty) link off-site. Ignore anything that leaves the source's domain.
3. **"Credit required" text** near the download button fails rule 3.
4. **People, logos, products, private buildings:** CC0 covers copyright, not privacy, publicity or trade marks, and no free source guarantees a model or property release. Avoid recognisable people and brands in hero and marketing images.
5. **AI-generated images** are mixed into some searches. Filter them out when the identity depends on real photography.
6. **Never put a stock image in a logo.** Pexels, Pixabay and Kaboompics forbid it.
7. **Download the original file**, not the page thumbnail. Commons and some museums overlay the preview.

### Check the final file for a watermark

The rule is about the file that ships, so check that file:

- Open the downloaded file at 100% and look at the corners and centre. Watermarks are usually a diagonal wordmark or a corner logo.
- Compare its pixel dimensions with the size the source advertises. A small file from a "high-resolution" source is often a preview.
- Look at it again in the rendered page during verification (`verification.md`). Name it in the report: "6 images, all from the free download path, no watermark visible at 100%."

---

## 3. Search for the identity, not the subject

A search for "bread" returns the generic bakery: a darkened loaf on a
wooden board. Build the query from the identity's **grammar**
(`identities/*.md`) plus the subject:

| Identity | Weak query | Strong query |
|---|---|---|
| Archival newsprint / parish bulletin | bread | "flour sack texture", "hands kneading black and white", "bakery 1970s Portugal" |
| Technical drafting | server | "cable detail macro", "circuit board top-down monochrome" |
| Wabi-sabi | ceramics | "handmade bowl crack natural light", "raw clay texture" |
| Victorian | flowers | Rijksmuseum or Met "botanical engraving", "still life 17th century" |
| Children's science museum | kids science | "hands magnet iron filings", "prism light spectrum table" |

- **Prefer texture, detail and hands** to posed people. They are safer
  (no releases needed) and read as craft.
- **Pick a set, not singles.** Five images from one photographer or one
  collection share light and colour; five from five sources do not.
  Kaboompics and museum collections are good for matched sets.
- **Historical identities often want public-domain art**, not photography:
  engravings, posters and plates from the museum collections.

---

## 4. One treatment for every image

Stock looks like stock when each image keeps its own colour and light.
Give every image on the site one treatment taken from the identity, so a
new photo joins the set with no editing pass:

- **A duotone** in the identity's ink and paper (CSS recipe in `recipes-motion.md` §15)
- **A halftone or grain** for print identities
- **A consistent crop:** one aspect ratio per role (hero 3:2, cards 4:5) and one focal rule
- **A shared grade:** the same warmth and contrast across the set

Then the motion: in `motion` and `both`, approved images are in the motion
plan, entering through the identity's own device (`recipes-motion.md`
§15).

### Weight

Images are usually most of a page's weight. Their cost goes into the tier
message.

- Serve **AVIF with a WebP fallback**, via `<picture>` and `srcset`, at the sizes the layout uses. Never serve a 6000px original.
- Hero image: under ~200 KB at desktop width. Others: under ~100 KB.
- `width` and `height` on every `<img>`, `loading="lazy"` below the fold, `fetchpriority="high"` on the hero only.
- Meaningful `alt` text in the site's languages. `alt=""` only for pure texture.

---

## 5. Record every image

Keep an asset record in the project (e.g. `docs/assets.md`), one row per
image. Licences and pages change, and the record is your evidence:

```markdown
| File | Source page | Licence (as shown on the page) | Downloaded | Treatment | Pages |
|---|---|---|---|---|---|
| hero-hands.avif | https://stocksnap.io/photo/... | CC0 | 2026-10-05 | duotone ink/paper | landing |
```

Summarise it in the identity brief (`identity.md` §8): the sources, the
treatment, and which pages use stock.

---

## Red flags

| Thought | Reality |
|---|---|
| "No photos, so I'll add stock" | Ask first. The author may want none, or only on some pages. |
| "It's on a free site, so it's free" | Paid, watermarked items sit in free searches. Check the item. |
| "CC BY is basically free" | It requires a credit line, which fails the rule. |
| "NASA images are public domain" | NASA asks for credit, and ESA- or JPL-credited images can be CC BY. Excluded. |
| "The preview looks fine" | Ship the original file, and check that file for a watermark. |
| "One great image per section" | Five sources means five lights. Pick a matched set and give it one treatment. |
| "A person smiling at a laptop" | No release is guaranteed, and it is the stock cliché. Use hands, texture and detail. |
