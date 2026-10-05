# Identities: Print, type and craft

Identities carried over from print, typography, illustration and hand craft.

Entry format and how to use it: `../identity-library.md`. URLs were checked live on 2026-10-05 (an answer, or a 401/403/429 bot wall on a known brand). "Awwwards entry" links are the gallery record; the live build may have been retired. Look at a site before quoting a detail from it.

---

### Academic paper / LaTeX
- **Grammar:** Computer Modern / Latin Modern, justified single column, numbered sections (1.1, 1.2), abstract block, theorem/definition boxes, equation numbering via KaTeX/MathJax, figure captions "Figure 3:", references list; no colour.
- **Says:** rigour, peer-reviewed seriousness, nerd credibility.
- **Fits:** research, ML/AI labs, technical blogs, documentation of methods, scientific tools. **Misfits:** lifestyle, consumer retail, playful brands.
- **Trap:** Computer Modern renders thin and grey on screen; MathJax weight and reflow; parody when content is not actually technical.
- **Load:** fast (medium with MathJax).
- **Seen at:** https://latex.vercel.app (LaTeX.css — drop-in academic stylesheet); https://distill.pub (Distill — interactive research articles with paper conventions).
- **Search:** "LaTeX.css"; "Distill template"; "academic paper website style"; "Computer Modern webfont"; "arXiv-style blog".

### Annual report / corporate print
- **Grammar:** big numbers as headlines, charts drawn as design objects, sober serif or grotesk pairing (Söhne, Tiempos, GT Sectra), section dividers in colour fields, letter-from-the-CEO prose, footnotes; paginated chapter navigation.
- **Says:** accountability, scale, measured confidence.
- **Fits:** foundations, public companies, NGOs, yearly reviews, "state of" reports. **Misfits:** consumer playful brands, art, nightlife.
- **Trap:** chart-as-decoration with no data truth; PDF-thinking (fixed pages) on the web; scroll-jacked number counters that hide the figures.
- **Load:** medium (chart libraries, scroll motion).
- **Seen at:** https://stripe.com/annual-updates/2024 (Stripe annual letter — long-form with designed data); https://www.gatesfoundation.org/goalkeepers (Goalkeepers report — data storytelling).
- **Search:** "annual report website"; Awwwards "annual report"; site:fontsinuse.com "annual report"; "impact report microsite"; Siteinspire "report".

### Archival newsprint
- **Grammar:** newspaper column grid, condensed headline faces, rules
  between columns, datelines, halftone imagery, off-white newsprint ground,
  black ink with a single spot colour. Columns run 35–45ch
  (`recipes-design.md` §1, Measure).
- **Says:** record, authority, history, "the story of this place".
- **Fits:** bakeries and food with history, local institutions, media, archives, changelogs. **Misfits:** futuristic products.
- **Trap:** pastiche fonts that are unreadable at body size; fake
  aging textures. Use a real text serif and real rules. **The broadsheet is
  also one of the commonest AI-generated defaults** (hairline rules, zero
  radius, dense columns; `recipes-design.md` §7). Propose it only when the
  brief or the subject really is a record of something. Then make it
  specific: a real masthead with an edition and a dateline drawn from the
  subject, not a generic "The Daily ___".
- **Load:** fast to medium.
- **Seen at:** wsj.com: column rules, serif heads, stipple hedcut portraits *(own read)*; ft.com: salmon newsprint ground with black ink *(own read)*; theonion.com: parody broadsheet conventions on the web.
- **Search:** awwwards.com/websites/newspaper/; Fonts In Use "newspapers" topic; trends.daisyui.com/trend/punk-zine/ (rougher cousin); lovable.dev "broadsheet template" (a counter-example: the blackletter-masthead pastiche the Trap warns about); Society for News Design (snd.org) awards.

### Blueprint / cyanotype
- **Grammar:** Prussian/cyan ground with white line or photogram imagery; sun-print fading edges; for blueprint, white hairlines, dimension arrows, grid paper; mono or technical lettering (Isocpeur, DIN, monospace); the whole page in one blue.
- **Says:** making, process, plan-before-build, archival science.
- **Fits:** architects, makers, photography, education, product process pages. **Misfits:** food, fashion with colourful product, anything needing full colour.
- **Trap:** single-hue page kills hierarchy and image fidelity; white-on-cyan body text tiring; overlaps with Technical drafting (keep the cyanotype/photogram angle distinct).
- **Load:** fast.
- **Seen at:** https://kindofcyan.com (Kind of Cyan — cyanotype print studio); https://www.objectspace.org.nz/exhibitions/blueprints/ (exhibition page for cyanotype "Blueprints" photograms). Strongest examples remain print (Anna Atkins, *Photographs of British Algae*, 1843).
- **Search:** "cyanotype website"; Are.na "cyanotype"; "Anna Atkins photograms"; "blueprint aesthetic web design"; Dribbble "cyanotype".

### Book-like long read
- **Grammar:** single reading column 60–75ch, book serifs (Equity, Charter, Iowan, Garamond, ET Book), drop caps, small caps, sidenotes/margin notes, footnote popovers, hanging punctuation, no chrome; warm paper background.
- **Says:** depth, authorship, attention, reading as an act.
- **Fits:** essays, writers, research, publishers, newsletters. **Misfits:** e-commerce, dashboards, visual-first portfolios.
- **Trap:** sidenotes collapse badly on mobile; serif at 16px too small; justified text without hyphenation causes rivers.
- **Load:** fast.
- **Seen at:** https://craigmod.com (Craig Mod — essays with book-craft typography); https://gwern.net (sidenotes, popups, small caps, dense scholarship); https://practicaltypography.com (Butterick — book-typography web book); https://edwardtufte.github.io/tufte-css/ (Tufte CSS — sidenote template).
- **Search:** "Tufte CSS"; "sidenotes web typography"; Typewolf "long-form"; "web book design"; Robin Sloan.

### Botanical / natural-history illustration
- **Grammar:** engraved or watercolour specimen plates (Redouté, Haeckel, Audubon) on cream; Latin binomials in italic old-style (Caslon, Garamond, Plantin, Cormorant); plate numbers, specimen labels, thin rules; muted greens, ochres, ink black.
- **Says:** knowledge, patience, nature catalogued with care.
- **Fits:** gardens, apothecary/skincare, tea, natural history, conservation, perfume. **Misfits:** urban tech, sport, nightlife.
- **Trap:** public-domain plates used as wallpaper (clichéd "apothecary" look); high-res scans unoptimised; script-y faux-Victorian type.
- **Load:** medium (illustration scans).
- **Seen at:** https://www.c82.net/werner (Nicholas Rougeux's interactive Werner's Nomenclature of Colours — natural-history colour plates); https://publicdomainreview.org (essays built around natural-history plates); https://www.diptyqueparis.com (illustrated botanical labels across the shop).
- **Search:** Public Domain Review collections "botany"; Biodiversity Heritage Library Flickr; "botanical illustration brand website"; Are.na "specimen plate"; site:fontsinuse.com botanical.

### Calligraphy
- **Grammar:** broad-nib, pointed-pen, brush or Arabic/East Asian calligraphic marks as hero objects; animated stroke drawing (SVG stroke-dashoffset); paired with restrained serif or sans; ink black, sumi grey, vermilion seal.
- **Says:** mastery, ritual, cultural depth, the human gesture.
- **Fits:** cultural institutions, tea, sake/spirits, luxury craft, artists, wedding. **Misfits:** fast fintech, gaming, utility apps.
- **Trap:** script fonts posing as calligraphy; cultural appropriation of scripts the team cannot read; stroke animations that loop endlessly.
- **Load:** fast (SVG), medium if video of brushwork.
- **Seen at:** https://www.sebastianlester.com (Seb Lester — calligraphy/lettering artist); https://www.29lt.com (29LT — Arabic type and calligraphy-led foundry).
- **Search:** "calligraphy website design"; "SVG stroke animation calligraphy"; Are.na "calligraphy"; site:fontsinuse.com calligraphy; "shodo website".

### Catalogue / mail-order
- **Grammar:** dense grids of item + number + price; tiny product photos or line drawings; part numbers, index tabs, order forms; utilitarian sans or catalogue serifs; yellow/kraft accents; Whole Earth hand-assembled pages or McMaster-Carr precision.
- **Says:** abundance, trustworthy utility, "everything you need".
- **Fits:** hardware/industrial supply, outdoor gear, tool libraries, curated shops, directories. **Misfits:** single-product launches, luxury, storytelling brands.
- **Trap:** density without fast search/filter is just noise; nostalgia print scans with no live data; lazy-loading kills the scanning speed that defines it.
- **Load:** fast (McMaster is the benchmark for speed).
- **Seen at:** https://www.mcmaster.com (McMaster-Carr — line drawings, instant catalogue navigation); https://wholeearth.info (Whole Earth Index — complete scanned catalogue archive); https://www.presentandcorrect.com (Present & Correct — stationery shop with archival-catalogue feel).
- **Search:** "McMaster-Carr website design"; "Whole Earth Catalog layout"; Are.na "catalogue"; "mail order catalogue aesthetic"; site:fontsinuse.com catalog.

### Collage / photomontage
- **Grammar:** cut-out photography with hard scissor edges or torn paper, mismatched scales, flat colour blocks behind, halftone fragments, Dada/Höch/Heartfield heritage; layered on scroll with parallax; grotesque or condensed type pasted in.
- **Says:** remix, critique, energy, cultural commentary.
- **Fits:** cultural magazines, music, fashion campaigns, activism, art schools. **Misfits:** precise B2B, medical, minimal product.
- **Trap:** dozens of transparent PNGs = heavy page; overlapping layers obscure text and links; overlap with Scrapbook (keep it graphic/political, not cosy).
- **Load:** medium (many cut-out images; use WebP/AVIF with alpha).
- **Seen at:** https://www.drmestudio.com (DR.ME — studio built on found-image collage, "365 Days of Collage"); https://www.awwwards.com/inspiration/about-us-hero-collage-loverboy (Loverboy collage hero on Awwwards).
- **Search:** "collage website design"; Elephant "Contemporary collage in graphic design"; Kolaj Magazine; Awwwards inspiration "collage"; Are.na "photomontage".

### Comic / manga panels
- **Grammar:** gutters and panel borders, speech balloons, SFX lettering, screentone (manga) or Ben-Day dots (US comics), bold ink outlines; comic lettering faces (CC Wild Words, Anime Ace, Comicraft fonts — not Comic Sans); vertical (webtoon) or horizontal page-turn scroll.
- **Says:** narrative, fun, approachable explanation, fandom.
- **Fits:** explainers, games, entertainment, onboarding stories, kids' education. **Misfits:** serious finance, legal, grief.
- **Trap:** text baked into images (no translation, no a11y); panels that don't reflow on mobile; heavy WebGL camera rigs for what could be stacked images.
- **Load:** medium (illustration), high if WebGL.
- **Seen at:** https://ncase.me (Nicky Case — comic-style explorable explainers); https://xkcd.com (stick-figure strip as the whole identity); https://theoatmeal.com (long vertical comics). Reference: "Ten Years Away" horizontal WebGL comic (designrush.com/best-designs/websites/ten-years-away-website-design).
- **Search:** "comic website design"; Robin Rendle "Every website is a comic book"; Awwwards "comic"; Blambot fonts; "webtoon paneling".

### Conceptual sketch
- **Grammar:** pencil and ink drawing, architectural line work,
  annotations, watercolour washes, a paper ground, thin serif or
  handwritten labels.
- **Says:** process, thinking, design intent, "before it was built".
- **Fits:** architecture, industrial design, studios, product origin stories. **Misfits:** finished-product commerce.
- **Trap:** sketches as decoration with no content meaning.
- **Load:** fast (SVG line work) to medium (raster drawings).
- **Seen at:** excalidraw.com: whiteboard whose hand-drawn line work is the product's identity; roughjs.com: the sketchy-render library behind it, with a site in the style.
- **Search:** trends.daisyui.com/trend/hand-drawn-ui/; awwwards.com/inspiration/freehand-sketches-its-just-a-portfolio; awwwards.com/websites/sketch/ and /hand-drawn/; Siteinspire "architecture" plus "illustration"; Behance "architectural sketch website".

### Editorial design
- **Grammar:** magazine composition, a serif or condensed display at large
  scale, columns, pull quotes, captions, photo-led spreads, deliberate
  type contrast.
- **Says:** authority, story, taste.
- **Fits:** media, fashion, culture, food, long-form products. The "old
  newsletter" family lives here. **Misfits:** dense app UI (adapt it, see `identity.md` §9).
- **Trap:** a serif headline on a SaaS layout is not editorial; the
  *composition* is.
- **Load:** fast to medium (several webfonts; subset them).
- **Seen at:** monocle.com and theatlantic.com: listed on the enlighten-media editorial page; pudding.cool: visual-essay layouts, photo- and chart-led *(own read)*.
- **Search:** design-styles.enlighten-media.net/pages/editorial/; trends.daisyui.com/trend/editorial-design/; awwwards.com/websites/editorial/; Fonts In Use "magazines" topic; subframe.com/tips/editorial-website-design-examples.

### Engraving / banknote (guilloche)
- **Grammar:** guilloche rosettes and wave lattices, microtext, intaglio-style line engraving of portraits, security borders; engraver's romans and copperplate (Copperplate Gothic, Didone, GT Sectra Fine); deep green, oxblood, navy on paper tones; serial numbers.
- **Says:** value, trust, officialdom, money.
- **Fits:** fintech, banks, crypto (with care), certificates, premium memberships, wine/spirits. **Misfits:** casual consumer, kids, wellness.
- **Trap:** dense SVG patterns heavy to render/animate; fine lines moiré on screens; counterfeit-looking pastiche of real currency.
- **Load:** fast (generated SVG), medium if animated canvas.
- **Seen at:** Reference: Elisa Exchange identity (a4.design/blog/elisa-exchange-visual-identity-explained/) — guilloche as core fintech language; no confirmed live site.
- **Search:** "guilloche web design"; kottke "guilloches"; "guilloche generator SVG"; Dribbble "guilloche"; site:fontsinuse.com banknote.

### Field guide / almanac
- **Grammar:** dense, indexed, tabular: tide/moon tables, small-caps headings, numbered entries, marginal icons, two-column reference layout; humanist serifs (Scotch Roman, Caslon, Century); rough woodcut-ish spot illustrations; newsprint or kraft tones.
- **Says:** useful, folksy wisdom, practical, seasonal.
- **Fits:** gardening, outdoors, weather, food/seasonal produce, birding, slow-living. **Misfits:** luxury, cutting-edge tech, nightlife.
- **Trap:** density without hierarchy becomes a wall; ad-heavy almanac sites dilute the identity; cutesy "rustic" pastiche.
- **Load:** fast.
- **Seen at:** https://www.almanac.com (Old Farmer's Almanac — moon/tide/planting tables); https://www.audubon.org/field-guide (Audubon bird guide — entry/specimen structure); https://solar.lowtechmagazine.com (solar-powered magazine — almanac-like battery/weather meta, dithered plates).
- **Search:** "field guide website design"; Are.na "almanac"; "Whole Earth Catalog layout"; "Sibley guide layout"; site:fontsinuse.com almanac.

### Grid-breaking experimental typography
- **Grammar:** overlapping text layers, rotated and mirrored type, mixed scales within a line, interface as composition (scroll, hover redraw layout), unusual faces (David Rudnick, OK-RM, M/M); raw HTML defaults used on purpose.
- **Says:** avant-garde, critical, art-school, "we read theory".
- **Fits:** art schools, studios, music labels, experimental publications, cultural festivals. **Misfits:** commerce conversion, government, accessibility-critical services.
- **Trap:** illegible by design is still illegible; navigation discoverability lost; overlaps Neo-brutalism (keep it typographic composition, not boxy UI).
- **Load:** fast to medium.
- **Seen at:** https://hoverstat.es (Hoverstat.es — gallery of experimental sites); https://ok-rm.co.uk (OK-RM — type-led studio site); https://www.bureauborsche.com (Bureau Borsche — typographic studio site).
- **Search:** Hoverstat.es; Are.na "web typography experiments"; "experimental typography website"; Brutalist Websites; site:fontsinuse.com experimental web.

### Halftone / duotone
- **Grammar:** photos reduced to two inks (duotone via CSS `mix-blend-mode` or SVG `feColorMatrix`) or visible dot screens/dithers; saturated pairs (pink/navy, green/purple, yellow/black); bold sans overlaid.
- **Says:** punchy, graphic, music-poster energy; dithering signals low-tech honesty.
- **Fits:** music, campaigns, event series, sustainability/low-tech publications. **Misfits:** product shots needing true colour, food, fashion detail.
- **Trap:** duotone on faces can look sickly; filters computed live on many images hurt paint; generic "Spotify 2015" pastiche.
- **Load:** fast (dithered images are tiny; CSS duotone is free).
- **Seen at:** https://solar.lowtechmagazine.com (Low-tech Magazine — every image dithered to save energy); https://www.wearecollins.com (Collins — Spotify 2015 duotone identity case study).
- **Search:** "duotone web design"; "CSS duotone filter"; "dithered images website"; Are.na "halftone"; site:fontsinuse.com duotone.

### Hand-lettering & sign-painting
- **Grammar:** brush script, casual sign alphabets, drop shadows and outlines, gold-leaf and enamel colours (red, cream, black, gold), shopfront fascia proportions; custom lettering as logo and headlines, SVG not fonts; flourishes and banners.
- **Says:** human hand, local trade, warmth, character.
- **Fits:** cafés, barbers, breweries, markets, illustrators, local shops. **Misfits:** enterprise, medical, minimal tech.
- **Trap:** script fonts pretending to be lettering (repeating glyphs give it away); lettering rasterised as PNG; script body copy illegible.
- **Load:** fast (SVG lettering).
- **Seen at:** https://betterletters.com (Better Letters — sign-painting school/shop, painted lettering throughout); https://jessicahische.is (letterer's portfolio — custom lettering as navigation and headlines); https://www.sebastianlester.com (calligraphy/lettering artist — see Calligraphy).
- **Search:** "sign painting website"; Are.na "sign painting"; site:fontsinuse.com "hand-lettering" web; Better Letters; "Sign Painters" documentary.

### Instruction manual (IKEA / Braun / TE)
- **Grammar:** wordless numbered steps, line-art isometric drawings, callout circles, exploded views; neutral grotesques (Helvetica, Akzidenz, Univers) or mono; light grey and one signal colour (orange/red); generous white, figure numbers, "1 / 2 / 3" sequencing.
- **Says:** clarity, honesty, product you can understand and repair.
- **Fits:** hardware, flat-pack furniture, onboarding, documentation, tools. **Misfits:** luxury mood brands, fiction, nightlife.
- **Trap:** line art too thin at mobile sizes; diagrams as raster images (no zoom, no alt text); jokey IKEA parody.
- **Load:** fast (SVG diagrams).
- **Seen at:** https://teenage.engineering/guides (Teenage Engineering — manuals as product pages with diagrams); https://www.vitsoe.com (Vitsœ — Rams-era product documentation and planning); https://www.c82.net/euclid (Byrne's Euclid recreated — diagram-led instruction).
- **Search:** "teenage engineering guides"; "Braun manual design"; Are.na "instruction manual"; "exploded view illustration website"; site:fontsinuse.com manual.

### Japanese graphic poster
- **Grammar:** extreme negative space, one bold graphic gesture, vertical (tategaki) Japanese type next to Latin grotesk, red/black/white or soft pastels; Tanaka Ikko / Kenya Hara / Nippon Design Center lineage; asymmetric but strictly aligned.
- **Says:** restraint, precision, cultural poise.
- **Fits:** design galleries, craft retailers, Japanese brands, architecture, tea/food. **Misfits:** maximal consumer brands, dense apps.
- **Trap:** using Japanese characters as decoration; Japanese webfonts are huge (subset or use system Hiragino/Noto); overlap with Swiss/Minimalism (anchor in tategaki and graphic gesture).
- **Load:** medium (CJK fonts).
- **Seen at:** https://www.dnpfcp.jp/gallery/ggg (Ginza Graphic Gallery — poster exhibitions); https://www.2121designsight.jp (21_21 Design Sight — exhibition identity); https://www.ndc.co.jp (Nippon Design Center — Hara's studio).
- **Search:** "Japanese graphic design website"; "tategaki CSS writing-mode"; Are.na "Japanese poster"; site:fontsinuse.com Japan; "Ikko Tanaka poster".

### Letterpress
- **Grammar:** debossed/impressed type on cotton-paper texture; wood and metal type (Clarendon, Antique No. 6, Caslon, Chiswick, wood-type gothics); 1–2 inks, ink-squash edges, slight uneven coverage; printer's ornaments, rules and fleurons; centred, justified compositions.
- **Says:** craft, permanence, slowness, care.
- **Fits:** stationers, wedding/invitation, print studios, heritage drinks, book arts. **Misfits:** tech launches, fast fashion, data products.
- **Trap:** faux-emboss via inset box-shadow looks like 2009 skeuomorphism; paper-texture JPGs bloat the page; low-contrast grey "ink" on cream.
- **Load:** medium (paper texture images, several historic webfonts).
- **Seen at:** https://woodtype.org (Hamilton Wood Type Museum — wood-type specimens as identity); https://letterpresscommons.com (community archive — press and type documentation).
- **Search:** "letterpress studio website"; site:fontsinuse.com "wood type"; Are.na "letterpress"; "Hamilton Wood Type" collection; Typewolf "Clarendon".

### Luxury typography
- **Grammar:** a high-contrast didone or refined serif at very large size,
  wide tracking on small caps, vast space, a muted or monochrome palette,
  slow fades.
- **Says:** exclusivity, craft, price.
- **Fits:** fashion, hospitality, jewellery, premium real estate, high-end food. **Misfits:** utilities, developer tools.
- **Trap:** light hairline faces unreadable at body size; lifestyle stock
  photography that undoes the type.
- **Load:** fast to medium (a licensed display face).
- **Seen at:** harpersbazaar.com: a Didot masthead and display serif heads *(own read)*; byredo.com: fragrance house with vast space, a monochrome palette and refined type *(own read)*.
- **Search:** Fonts In Use "Didot" and "Bodoni" (fashion uses); trends.daisyui.com/trend/quiet-luxury/; awwwards.com/websites/luxury/; awwwards.com/websites/fashion/; Land-book "fashion" or "jewellery".

### Map / cartographic
- **Grammar:** the map is the interface: contour lines, hatching, legends, scale bars, compass, coordinates, place labels in spaced caps and italic hydrography; muted terrain palettes or Stamen-style watercolour/toner; panels as legend boxes.
- **Says:** exploration, place, data with territory, discovery.
- **Fits:** travel, outdoor, real estate, journalism, logistics, civic data. **Misfits:** single-product pitches, fashion, personal brands.
- **Trap:** map tiles/JS libraries heavy; maps that trap scroll on mobile; decorative maps with no real geography.
- **Load:** medium (vector tiles), high with 3D globe/WebGL.
- **Seen at:** https://felt.com (Felt — cartographic product with map-native UI); https://www.davidrumsey.com (David Rumsey Map Collection — historic cartography); https://stamen.com (Stamen — map design studio, watercolour/toner styles).
- **Search:** "cartographic web design"; Stamen maps; "contour lines SVG background"; Are.na "maps"; NYT/Pudding map stories.

### Mega-type / typographic poster
- **Grammar:** one or two words set at 15–40vw, often edge-to-edge and cropped by the viewport; heavy or compressed grotesques (Druk, Neue Haas Grotesk Display, Monument Extended, PP Neue Machina); tight negative tracking; 2-colour fields; scroll-linked scale/position.
- **Says:** confidence, attitude, "poster on the wall".
- **Fits:** agencies, festivals, fashion drops, campaigns, launches. **Misfits:** dense information, documentation, accessibility-critical services.
- **Trap:** clamp() not set so headlines overflow on mobile; layout shift while display font loads; all-caps compressed type unreadable for >5 words; nothing below the fold supports the shout.
- **Load:** fast (one subset display face), medium if scroll-scrubbed.
- **Seen at:** https://www.wearecollins.com (studio — oversized type-led case studies); https://locomotive.ca (Montréal studio — viewport-scale wordmarks and scroll type).
- **Search:** Godly "big type"; Awwwards tag "typography"; site:fontsinuse.com Druk web; "kinetic typography website"; Hoverstat.es.

### Menu card / bistro chalkboard
- **Grammar:** one page of centred or ruled items with dot leaders to prices, small caps section heads ("Starters", "Plats"), Didone or old-style serif (Bodoni, Caslon, Le Monde), sometimes chalk-hand script on dark; minimal images; daily-change feel.
- **Says:** confidence in the food, tradition, no marketing noise.
- **Fits:** restaurants, bars, bakeries, wine merchants, pricing pages in a hospitality voice. **Misfits:** tech products with complex features, image-led retail.
- **Trap:** menus as PDFs or images; chalkboard textures cheap and illegible; leader dots breaking on narrow screens.
- **Load:** fast.
- **Seen at:** https://stjohnrestaurant.com (St. JOHN — terse typeset menu as the identity); https://www.chezpanisse.com (Chez Panisse — daily menus, letterpress-like type); https://balthazarny.com (Balthazar — Parisian brasserie card).
- **Search:** "restaurant website menu typography"; Typewolf restaurants; site:fontsinuse.com menu; Siteinspire "restaurant"; "dot leaders CSS".

### Mid-century travel poster
- **Grammar:** flat silkscreen-style illustration with 4–6 colours, long shadows, graphic skies and gradients in steps; condensed sans or deco display (Futura, Gill Sans, Kabel, Bebas-type) set in bold bands; WPA/railway composition with title band at top or bottom.
- **Says:** escape, optimism, place pride, collectability.
- **Fits:** tourism boards, national parks, travel, hotels, regional products, events. **Misfits:** urban tech, finance, health.
- **Trap:** stock "vintage poster" vectors look generic; poster aspect ratio crammed into a 16:9 hero crops the composition; text inside images not accessible.
- **Load:** medium (large illustrations; SVG keeps it fast).
- **Seen at:** https://59parks.net (59 Parks — commissioned national-park screenprints, poster-first site); https://andersondesigngroupstore.com (Anderson Design Group — WPA-style travel posters); https://www.posterhouse.org (Poster House museum — poster history).
- **Search:** "WPA poster style"; Poster House exhibitions; site:fontsinuse.com "travel poster"; Are.na "travel poster"; "railway poster" collection.

### Museum / white-cube gallery
- **Grammar:** white or off-white ground, abundant space, one institutional grotesque or custom face; artwork images unframed, captions in small tabular "wall label" style (artist, title, date, medium); a strict or flexible logo system (Whitney's responsive W); minimal colour, chrome hidden.
- **Says:** curatorial authority, neutrality, letting the work speak.
- **Fits:** museums, galleries, artist estates, collections, architects. **Misfits:** mass-market retail, children's products, energetic launches.
- **Trap:** so neutral it is indistinguishable from a Squarespace template; huge unoptimised artwork images; grey caption text below 4.5:1.
- **Load:** medium (large images).
- **Seen at:** https://whitney.org (Experimental Jetset responsive-W system on the web); https://www.stedelijk.nl (Mevis & Van Deursen identity); https://kunsthallebasel.ch (stark typographic exhibition listings).
- **Search:** "museum website design"; Siteinspire "museum"; "Walker Art Center website"; site:fontsinuse.com museum identity; Are.na "white cube".

### Playbill / wood-type poster (circus, theatre)
- **Grammar:** stacked wood-type lines of varying widths and weights filling the sheet, centred, multiple faces in one poster, red/black/yellow inks on cream; stars, rules, "ONE NIGHT ONLY" hierarchy; Paula Scher's Public Theater adaptation in modern grotesques.
- **Says:** spectacle, live event, come tonight.
- **Fits:** theatres, music venues, circuses, festivals, markets. **Misfits:** quiet luxury, healthcare, software.
- **Trap:** stacked type that doesn't reflow on mobile; too many faces = chaos; western/saloon cliché.
- **Load:** fast to medium (several display faces).
- **Seen at:** https://hatchshowprint.com (Hatch Show Print — Nashville letterpress poster shop); https://publictheater.org (Public Theater — Pentagram/Scher wood-type identity on the web); https://www.ringling.org (Ringling museum — circus heritage).
- **Search:** "Hatch Show Print"; "Public Theater identity Paula Scher"; site:fontsinuse.com "wood type"; Are.na "playbill"; "circus poster typography".

### Punk / DIY zine
- **Grammar:** photocopier black on off-white, toner speckle and blown-out contrast; ransom-note mixed type, typewriter (Courier, American Typewriter), marker scrawl; tape, staples, torn edges; rotated paste-ups, diagonal reading, hand-numbered pages.
- **Says:** anti-corporate, urgent, participatory, scene-made.
- **Fits:** music scenes, activism, independent publishing, skate/streetwear, community events. **Misfits:** institutions wanting authority, B2B, anything that must look trustworthy to strangers.
- **Trap:** brand-agency pastiche of punk is instantly spotted; rotated text and ransom letters wreck screen-reader order and readability; collaged PNGs balloon weight.
- **Load:** medium (scanned textures, cut-out images).
- **Seen at:** https://maximumrocknroll.com (long-running punk zine — newsprint/photocopy heritage); https://brokenpencil.com (zine-culture magazine — DIY publishing identity); https://trends.daisyui.com/trend/punk-zine/ (trend write-up, grammar notes).
- **Search:** "punk zine web design"; Are.na "zine"; "photocopy texture website"; site:fontsinuse.com zine; Printed Matter Art Book Fair.

### Receipt / ticket
- **Grammar:** narrow column (~320–380px) of monospace or thermal-printer type (OCR-B, Space Mono, VT323-ish), dashed rules, zigzag torn edges, barcodes/QR, itemised lines with totals; ticket stubs with perforation and seat/row grids.
- **Says:** transactional honesty, data-as-souvenir, playful "proof".
- **Fits:** year-in-review/wrapped features, event tickets, checkouts, pricing, invoicing tools. **Misfits:** long-form, luxury mood, imagery-led brands.
- **Trap:** gimmick wears thin beyond one component; mono text at small size hurts readability; screenshot-shareable image not accessible.
- **Load:** fast.
- **Seen at:** https://receiptify.herokuapp.com (Receiptify — Spotify top tracks as a thermal receipt).
- **Search:** "receipt UI design"; Dribbble "receipt"; "CSS zigzag edge"; "ticket stub UI"; "wrapped receipt".

### Risograph
- **Grammar:** 2–3 spot inks from the Riso palette (fluorescent pink, federal blue, yellow, teal) with `mix-blend-mode: multiply` overprints; deliberate 1–3px misregistration; grain/noise texture via SVG `feTurbulence`; chunky grotesques (Monument Grotesk, Obviously, Cooper) or hand-drawn display; flat illustration with no gradients except dithered ones.
- **Says:** independent, small-run, affordable, cheerful, maker-led.
- **Fits:** indie publishers, print shops, festivals, bookshops, zines, community orgs, kids' culture. **Misfits:** finance, healthcare, enterprise SaaS, luxury.
- **Trap:** fluoro pink on white fails contrast for body text; noise overlay on every element turns muddy and costs paint time; fake misregistration on UI chrome reads as a bug.
- **Load:** fast.
- **Seen at:** https://risottostudio.com (Glasgow riso studio — spot-colour illustration, overprint shop imagery); https://stencil.wiki (riso resource — ink swatches, process documentation).
- **Search:** "risograph" on Are.na; site:fontsinuse.com risograph; "riso print studio website"; Siteinspire tag "illustration" + "print"; Eye on Design "rise of risograph".

### Scrapbook
- **Grammar:** paper textures, tape, torn edges, handwriting, polaroids,
  stickers, collage at slight rotations.
- **Says:** personal, memory, craft, warmth.
- **Fits:** journaling apps, travel, family products, makers, small food brands. **Misfits:** enterprise.
- **Trap:** texture images everywhere bloat the page; rotated text hurts
  reading. Keep body copy straight.
- **Load:** medium (texture images; use SVG filters for the cheaper torn edges).
- **Seen at:** jeongsteph.design: Steph Jeong's portfolio, layered collage of screenshots, photos and illustrations (Awwwards "Scrapbook 2.0").
- **Search:** trends.daisyui.com/trend/scrapbook-sticker-ui/ and /trend/collage/; awwwards.com/websites/scrapbook/; designmodo.com/scrapbook-website-design/ (older, many links dead); webspec.com "structured scrapbook" 2025 trend piece; Dribbble "scrapbook website".

### Stamps, seals & ephemera
- **Grammar:** perforated edges, postmarks, rubber-stamp marks with ink spread, wax seals, tickets, luggage labels, cancellation lines; condensed sans and engraver's roman (Copperplate, Engravers Gothic); faded multi-colour; layered, tilted objects.
- **Says:** journeys, authenticity, collectability, "official but personal".
- **Fits:** travel, postal/logistics, membership clubs, archives, wedding, heritage. **Misfits:** dashboards, dense apps, minimalist tech.
- **Trap:** skeuomorphic clutter; stamp-rotated text unreadable; perforation done with images not CSS masks.
- **Load:** fast (CSS `mask` perforations, SVG stamps).
- **Seen at:** https://www.ephemerasociety.org (Ephemera Society — collecting printed ephemera); https://postalmuseum.si.edu (Smithsonian National Postal Museum — stamp collections).
- **Search:** "stamp perforation CSS"; Are.na "ephemera"; "postage stamp web design"; Dribbble "stamp badge"; "rubber stamp texture".

### Technical drafting
- **Grammar:** a dot or hairline grid, registration marks, numbered
  annotations, monospace "instrument" labels, measured spacing (Greptile,
  Hex; `recipes-design.md` §4).
- **Says:** precision, engineering, "we measured".
- **Fits:** developer tools, data and analytics, infrastructure, B2B technical products. **Misfits:** emotional consumer brands.
- **Trap:** structural marks that encode nothing (`01 / 02 / 03` on
  unordered features).
- **Load:** fast; masks and blends do the work (`benchmarks.md`).
- **Seen at:** vercel.com: the blueprint-grid originator, with hairline grid, crosshair marks and measured cells (setproduct guide); greptile.com and hex.tech: the survey's own references, both live.
- **Search:** setproduct.com/blog/complete-guide-to-blueprint-grid-design; rauno.me/craft/vercel; trends.daisyui.com/trend/data-dense-utilitarian-ui/; Godly "grid" / "developer tools"; Framer marketplace "blueprint grid".

### Type specimen / foundry
- **Grammar:** the type is the content: huge glyph sets, waterfalls, pangrams, editable text fields, weight/size sliders; neutral background, one accent; strict tabular info (licences, styles); often black/white with hairline rules.
- **Says:** expertise, precision, cultural seriousness.
- **Fits:** foundries, design studios, typographers, brand-guidelines sites, publishers. **Misfits:** consumer retail, hospitality, emotive storytelling.
- **Trap:** loading 30 styles at once (FOUT and megabytes); editable specimens without `font-display` strategy; looking like every other foundry (black, grotesk, slider).
- **Load:** medium.
- **Seen at:** https://klim.co.nz (Klim — long-form specimens and essays); https://grillitype.com (Grilli Type — per-family minisites); https://abcdinamo.com (Dinamo — playful testers, gradient specimens); https://commercialtype.com (Commercial Type — magazine-like specimens).
- **Search:** "type foundry website"; Buttondown "Adventures in Typography foundry websites"; site:fontsinuse.com specimen; Future Fonts; Velvetyne.

### Typewriter / manuscript
- **Grammar:** monospaced typewriter faces (Courier Prime, American Typewriter, IBM Plex Mono, Special Elite), uneven ink strike, strike-through edits, underline with underscores, paper sheets with carbon copy greys, red margin rule; screenplay formatting.
- **Says:** authorship, draft-in-progress, honesty, literary or investigative.
- **Fits:** writers, screenwriting, journalism, archives, film, letters. **Misfits:** retail, fintech, bright consumer.
- **Trap:** distressed typewriter fonts at body size are tiring; mono widths make long lines; nostalgic kitsch.
- **Load:** fast.
- **Seen at:** https://quoteunquoteapps.com/courierprime (Courier Prime — screenplay typewriter face); https://www.typewriterdatabase.com (typewriter archive).
- **Search:** "typewriter aesthetic website"; site:fontsinuse.com "Courier"; Are.na "typewriter"; "screenplay format CSS"; "manuscript web design".

### Variable-font expressive type
- **Grammar:** a single variable family animated along weight/width/slant/optical or custom axes (Recursive, Fraunces, Decovar, Roboto Flex, Anybody); type reacts to cursor, scroll or audio; letterforms morph rather than objects move.
- **Says:** inventive, technical, alive, type-literate.
- **Fits:** foundries, design events, creative tech, music, editorial features. **Misfits:** conservative services, long-form reading (animation distracts).
- **Trap:** full variable files are 200KB+ unsubset; animating `font-variation-settings` triggers re-layout every frame; motion without `prefers-reduced-motion` fallback.
- **Load:** medium.
- **Seen at:** https://v-fonts.com (variable-font catalogue — live axis sliders); https://www.axis-praxis.org (playground for axis animation); https://recursive.design (Recursive microsite — sans↔mono and casual axes demonstrated live); https://fraunces.undercase.xyz (Fraunces "wonky"/softness axes).
- **Search:** "variable font microsite"; abduzeedo "Exat variable font microsite"; Codrops variable font; Grilli Type minisites; "font-variation-settings animation".

### Vintage packaging / label
- **Grammar:** tin, can and bottle label conventions: badges, banners, borders, "Est." dates, illustrated mascots, chunky slab and condensed display (Cooper, Recoleta, Clarendon, GT Super), sunburst rules; limited flat palettes per SKU; product photography styled as still life.
- **Says:** heritage-with-a-wink, quality ingredients, giftable.
- **Fits:** DTC food and drink, pantry goods, cosmetics, candles. **Misfits:** software, finance, public services.
- **Trap:** every DTC brand already does it (Recoleta + pastel + mascot); illustration-only CTAs lose affordance; nostalgia without product truth.
- **Load:** medium (packshots, display fonts).
- **Seen at:** https://eatfishwife.com (Fishwife — illustrated tinned-fish labels as site identity); https://graza.co (Graza — squeeze-bottle label language, playful display type); https://brightland.co (Brightland — artful label-led olive oil).
- **Search:** "DTC packaging website"; Packaging of the World; site:fontsinuse.com label; Godly "food"; "tinned fish branding".

### Woodcut / linocut
- **Grammar:** black relief-print illustration with gouge marks, white chisel lines, solid blacks; one or two ink colours on cream; heavy old-style or wood-type display; imperfect edges; hand-carved logos.
- **Says:** earthy, handmade, rooted, a little folkloric.
- **Fits:** breweries, coffee roasters, farms, bakeries, folk music, outdoor brands. **Misfits:** fintech, clinical, high fashion minimal.
- **Trap:** vector "woodcut" filters look plastic; large black areas as JPG instead of SVG; craft-beer cliché.
- **Load:** fast (SVG traced prints).
- **Seen at:** https://sailorsgravebrewing.com/pages/artwork (Sailors Grave — linocut label artwork gallery). Print reference: Lindfield Coffee Works linocut-stamped bags (packagingoftheworld.com/2016/11/lindfield-coffee-works.html).
- **Search:** "linocut branding"; Dribbble "linocut"; Steven Noble engraving; Packaging of the World "linocut"; Are.na "woodcut".
