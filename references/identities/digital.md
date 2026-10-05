# Identities: Digital and UI-native

Styles born on screens: UI paradigms, internet subcultures, rendering techniques.

Entry format and how to use it: `../identity-library.md`. URLs were checked live on 2026-10-05 (an answer, or a 401/403/429 bot wall on a known brand). "Awwwards entry" links are the gallery record; the live build may have been retired. Look at a site before quoting a detail from it.

---

### 3D scroll-story (Apple product page)
- **Grammar:** sticky full-viewport stages, scroll-scrubbed image sequences or video of a product rotating/exploding, giant headline numbers (SF Pro Display), black or white stage, one feature per screen.
- **Says:** premium hardware, engineering marvel, launch-event drama.
- **Fits:** hardware launches, cars, wearables, premium devices. **Misfits:** services without a hero object, content sites, low-bandwidth audiences.
- **Trap:** hundreds of frames/MB of video; scroll-jacking; content invisible without JS; huge LCP.
- **Load:** high.
- **Seen at:** https://www.apple.com/airpods-pro/ — scroll-scrubbed product reveal; https://www.apple.com/iphone-17-pro/ — sticky stages and exploded hardware renders.
- **Search:** "Apple product page scroll animation"; Awwwards "scrollytelling"; Godly "3D"; "image sequence scroll canvas"; "scroll-driven animations CSS".

### Acid graphics
- **Grammar:** post-Y2K tech-collage: distorted, stretched and wide display
  faces, glitch, data overlays, chrome, black and white with acid green or
  hot accents, dense micro-type, barcodes and warning labels.
- **Says:** digital subculture, edge, speed.
- **Fits:** music, club nights, fashion drops, crypto culture, creative studios. **Misfits:** mainstream consumer trust.
- **Trap:** illegible display type in navigation and CTAs. Keep the
  functional text plain; the chaos belongs in the art, not the controls.
- **Load:** fast to medium.
- **Seen at:** no production site verified yet; trends.daisyui.com/trend/acid-graphics/ ships a working demo.
- **Search:** trends.daisyui.com/trend/acid-graphics/; Are.na "acid graphics"; Behance "acid graphic design"; Aesthetics Wiki "Cybercore" (adjacent); Fonts In Use "acid".

### Anti-design
- **Grammar:** deliberate rule-breaking — clashing colours, default or ugly fonts, overlapping elements, misaligned grids, raw HTML styles, harsh hues (brat green), stretched type, cursor gimmicks.
- **Says:** rebellion, authenticity, art-school confidence, anti-corporate.
- **Fits:** art schools, fashion, music, galleries, provocative campaigns. **Misfits:** services, commerce at scale, accessibility-sensitive audiences.
- **Trap:** indistinguishable from incompetence; usability collapse; contrast failures; overlaps with Neo-brutalism (stay distinct: anti-design rejects the system entirely).
- **Load:** fast–medium.
- **Seen at:** https://art.yale.edu — Yale School of Art, wiki-editable chaotic layout; https://brat-generator.com — generator of Charli XCX "brat" anti-design cover look.
- **Search:** "anti-design web"; brutalistwebsites.com; Aesthetics Wiki "Brat"; "ugly design trend"; Are.na "anti design".

### ASCII / text-mode art
- **Grammar:** monospace grid as image medium — ASCII/ANSI art, box-drawing characters, character-density shading, animated text fields; one or two colours; everything aligned to a character cell.
- **Says:** code-literate, crafty, nerdy-poetic.
- **Fits:** dev tools, creative coders, terminals, music/zines, experimental studios. **Misfits:** mainstream commerce, image-led products.
- **Trap:** screen readers read glyph soup (needs aria-hidden + alt); breaks at narrow widths; font fallback misaligns grid.
- **Load:** fast (medium if canvas-animated).
- **Seen at:** https://ghostty.org — animated ASCII ghost hero for a terminal emulator; https://play.ertdfgcvb.xyz — Andreas Gysin's ASCII playground of live text-mode sketches.
- **Search:** "ASCII art website"; ertdfgcvb; "text mode" Are.na; "ANSI art web"; Codrops "ASCII effect".

### Aurora / mesh gradients
- **Grammar:** soft multi-stop mesh or blurred-blob gradients in saturated hues (violet, coral, teal), often animated slowly (WebGL or CSS); clean neo-grotesque type (Söhne, Inter) over the top; light UI cards on gradient.
- **Says:** modern fintech/SaaS optimism, energy, premium-but-friendly.
- **Fits:** fintech, AI, SaaS launch pages, conferences. **Misfits:** heritage, editorial, minimal-luxury, anything wanting gravity.
- **Trap:** generic "AI startup" cliché; banding; text over shifting colour loses contrast; animated WebGL draining battery.
- **Load:** medium (CSS), high if WebGL animated.
- **Seen at:** https://stripe.com — animated WebGL mesh-gradient hero, the reference; https://whatamesh.vercel.app — open recreation of the Stripe gradient.
- **Search:** "mesh gradient" Godly; "aurora background" UI; "Stripe gradient WebGL"; Lapa Ninja "gradient"; "blurred blob gradient hero".

### Bento grid
- **Grammar:** a dashboard-like mosaic of rounded tiles of varied size,
  each tile one feature, with mixed media inside.
- **Says:** "many capabilities, organised".
- **Fits:** product feature overviews, portfolios, personal sites. **Misfits:** linear narrative, editorial reading.
- **Trap:** it is now a default. A bento of equal-weight tiles with icon
  and heading is the feature-grid tell in a new shape. Tile size must encode
  importance.
- **Load:** fast.
- **Seen at:** apple.com/iphone/: the "Get the highlights" tile mosaic that set the pattern *(own read)*; linear.app and raycast.com: listed on the enlighten-media bento page; procreate.com: cited for its bento feature layout.
- **Search:** bentogrids.com (dedicated gallery); saasframe.io/patterns/bento-grid; design-styles.enlighten-media.net/pages/bento-ui/; awwwards.com/websites/bento-grid/; Godly "bento".

### Blob / fluid organic shapes
- **Grammar:** irregular rounded SVG blobs (morphing via border-radius or path tweens), soft pastel or warm palettes, rounded sans (Circular, Recoleta, Apercu), friendly characters, curved section dividers.
- **Says:** calm, friendly, human, soft tech.
- **Fits:** wellness, mental health, education, consumer apps, children, community. **Misfits:** serious B2B, security, luxury.
- **Trap:** default "friendly startup" sameness; random blobs without structure; morph animations constantly repainting.
- **Load:** fast.
- **Seen at:** https://www.headspace.com — rounded organic shapes and soft characters; https://www.blobmaker.app — blob SVG generator widely used for the look.
- **Search:** "blob shapes web design"; "organic shapes UI"; Dribbble "blob"; "SVG morph blob"; Webdesigner Depot "blobs trend".

### Claymorphism
- **Grammar:** inflated shapes, large radii (20–32px), three shadows (one
  large outer drop, plus two inner shadows: lighter top-left, darker
  bottom-right), pastel fills, rounded sans, 3D clay renders as hero art.
- **Says:** friendly, touchable, low-stakes.
- **Fits:** consumer apps, onboarding, kids and education, playful fintech. **Misfits:** dense data, legal, luxury.
- **Trap:** every element puffed up, so nothing leads; pastel-on-pastel text fails contrast.
- **Load:** fast (CSS shadows). The clay renders are images: budget them.
- **Seen at:** bankwest.com.au: Australian bank, cited as building interface elements on claymorphism principles; unorthodocss.com/examples/claymorph/: a CSS reference build, listed as the clay example on the enlighten-media showcase.
- **Search:** hype4.academy "claymorphism in user interfaces" (the source article); awwwards.com/websites/claymorphism/; trends.daisyui.com/trend/claymorphism/; design-styles.enlighten-media.net/pages/claymorphism/; Dribbble "claymorphism 3D icons".

### Corporate Memphis (and its backlash)
- **Grammar:** flat vector people with tiny heads, long bendy limbs, non-naturalistic skin (purple/blue), primary shapes, no outlines, confetti shapes; geometric sans; mixed with Memphis-group squiggles.
- **Says:** inclusive, friendly, big-tech approachability — now also generic, inauthentic.
- **Fits:** deliberate retro/ironic use, internal tools, quick explainers where budget is low. **Misfits:** brands wanting authenticity or distinction; anything serious or culturally specific.
- **Trap:** reads as stock/AI-generic and invites mockery ("Alegria"); faceless people undercut trust; backlash means it signals laziness.
- **Load:** fast.
- **Seen at:** https://www.humaaans.com — Pablo Stanley's mix-and-match flat people library; https://cari.institute/aesthetics/corporate-memphis — CARI dated reference; https://eyeondesign.aiga.org/the-internet-is-turning-on-big-techs-colorful-corporate-mascots/ — AIGA on the backlash.
- **Search:** Aesthetics Wiki "Corporate Memphis"; "Alegria Facebook Buck"; Know Your Meme "corporate art style"; "Big Tech art style"; CARI "Corporate Memphis".

### Cybercore
- **Grammar:** saturated cobalt and electric blue, violet and chrome
  silver; early-software windows and dialogs, anime frames, butterflies and
  angel wings, sparkle and star glyphs, pixel and Y2K-tech type mixed with
  chrome display lettering.
- **Says:** online-native nostalgia, dreamy tech, fan and fashion culture.
- **Fits:** fashion and edit accounts, music, fan sites, youth events. **Misfits:** mainstream consumer trust, B2B.
- **Trap:** it is documented mostly as a Pinterest/TikTok fashion aesthetic,
  not a web style, so there are few production sites to learn from. Keep
  functional text plain. Not to be confused with Acid graphics (black and
  white with acid accents).
- **Load:** fast to medium.
- **Seen at:** no verified live production site. trends.daisyui.com/trend/cybercore/ ships a working demo; the Aesthetics Wiki and NYLON ("Cybercore, the ultimate Y2K fashion aesthetic trend") document it as a Pinterest/TikTok fashion and edit aesthetic, not a web style.
- **Search:** aesthetics.fandom.com/wiki/Cybercore; trends.daisyui.com/trend/cybercore/ and /trend/cyberdelia/; trends.daisyui.com/trend/acid-graphics/ (closer to this entry's grammar); Are.na "cybercore"; Neocities "cybercore".

### Cyberpunk
- **Grammar:** a dark ground, neon (cyan and magenta), HUD frames, angled
  cut corners, scanlines, monospace readouts, technical diagrams.
- **Says:** high-tech, dystopian, gaming.
- **Fits:** games, esports, security, hardware. **Misfits:** gentle consumer subjects.
- **Trap:** neon on black at low weight fails contrast; glow on every
  element is noise.
- **Load:** fast (CSS clip-path frames) to high (WebGL scenes).
- **Seen at:** cyberpunk.net: CD Projekt's Cyberpunk 2077 site, yellow/cyan HUD frames and glitch; theghostintheshell.jp/en: listed on the enlighten-media cyberpunk page; augmented-ui.com: CSS library for cut-corner HUD frames, styled in its own idiom.
- **Search:** design-styles.enlighten-media.net/pages/cyberpunk/; trends.daisyui.com/trend/cyberpunk/ and /trend/fui-hud/; awwwards.com/websites/cyberpunk/; HUDS+GUIS (hudsandguis.com) for FUI references.

### Dark mode neon dashboard
- **Grammar:** near-black panels, neon accent lines (cyan, magenta, lime), glowing charts and sparklines, dense KPI tiles, monospace numerals (tabular), thin borders, status dots.
- **Says:** real-time, operational, powerful, tech-savvy.
- **Fits:** observability, trading, analytics, security ops, gaming stats. **Misfits:** consumer onboarding, editorial, wellness.
- **Trap:** neon on black vibrates and fatigues; colour-only status fails colour-blind users; glow filters on many SVG nodes slow rendering.
- **Load:** fast–medium (chart libs).
- **Seen at:** https://grafana.com — dark observability dashboards as hero imagery; https://www.tremor.so — dashboard component library showcasing dark chart UIs.
- **Search:** Dribbble "dark dashboard"; "neon dashboard UI"; Godly "dashboard"; "observability UI"; "trading terminal UI".

### Data-viz-as-hero
- **Grammar:** the visualisation is the page — full-bleed maps, animated charts, scrollytelling with annotated steps; restrained type (serif headlines, sans labels), muted base palette with one or two data accents.
- **Says:** evidence, rigour, curiosity, explanation.
- **Fits:** journalism, research, NGOs, climate, public data, analytics products. **Misfits:** brand-only campaigns, luxury.
- **Trap:** heavy JS/data payloads; no accessible table fallback; decorative charts without real data; colour scales not colour-blind safe.
- **Load:** medium–high.
- **Seen at:** https://earth.nullschool.net — live global wind/ocean visualisation as the entire site; https://pudding.cool — visual-essay scrollytelling; https://ourworldindata.org — chart-led research publication.
- **Search:** Awwwards "data visualization"; "scrollytelling"; Information is Beautiful Awards; "The Pudding"; Observable gallery.

### Dithered / 1-bit low-tech
- **Grammar:** 1-bit or few-colour dithered images (Floyd–Steinberg, Bayer), system fonts, monochrome or single-tint background, tiny page weight, sometimes battery/energy indicators.
- **Says:** frugal, sustainable, honest, retro-Mac/Game Boy charm.
- **Fits:** sustainability, low-tech/solar projects, indie games, zines, handheld hardware. **Misfits:** photography-led products, fashion, food.
- **Trap:** dithered images unreadable at small sizes; moiré when scaled non-integer; poor alt-text discipline.
- **Load:** fast.
- **Seen at:** https://solar.lowtechmagazine.com — solar-powered site with dithered images and default type; https://play.date — 1-bit Playdate game imagery.
- **Search:** "dithering web design"; "1-bit aesthetic"; "Low-tech Magazine solar website"; "Obra Dinn dither"; Are.na "dither".

### Ethereal
- **Grammar:** luminous gradients, glow, soft focus, dreamlike photography,
  thin elegant serif or light sans, slow drifting motion.
- **Says:** wonder, aspiration, the intangible.
- **Fits:** wellness, travel, spiritual, fragrance, music. **Misfits:** operational tools.
- **Trap:** soft everything, so there is no edge, no hierarchy and no CTA.
- **Load:** fast with CSS gradients and one image; high if the glow is WebGL.
- **Seen at:** engine.xyz and reflect.app: luminous aurora-gradient grounds (enlighten-media "Aurora" page); Awwwards Annual Awards 2021 site: floating soft pink clouds, documented at pangrampangram.com/blogs/font-in-use/awwwards.
- **Search:** aesthetics.fandom.com/wiki/Ethereal; trends.daisyui.com/trend/mesh-gradient-aurora-ui/; design-styles.enlighten-media.net/pages/aurora/; Godly or Land-book "gradient" plus "fragrance"/"wellness"; awwwards.com/websites/gradient/.

### Flat design
- **Grammar:** geometric/neo-grotesque sans (GDS Transport, Helvetica Now, Inter, Feather-style rounded for Duolingo); solid fills, no gradients or shadows; 2–5 saturated brand colours on white; simple vector icons; hard edges or uniform radius; motion limited to state changes.
- **Says:** clear, honest, functional, public-service plainness or friendly product simplicity.
- **Fits:** government and civic services, onboarding-heavy consumer apps, education, utilities, documentation. **Misfits:** luxury, fashion, atmospheric brands, anything needing depth or mystery.
- **Trap:** affordance loss (buttons indistinguishable from labels), flat colour pairs failing contrast (white on mid-green/orange), dated 2013 iOS 7 pastiche.
- **Load:** fast.
- **Seen at:** https://www.gov.uk — GOV.UK Design System: flat black/white/blue, bold type, zero ornament; https://www.duolingo.com — flat saturated green, rounded chunky buttons, flat character illustration.
- **Search:** "flat design" Dribbble 2013; GOV.UK Design System; "flat UI" Lapa Ninja; Aesthetics Wiki "Flat Design"; "Microsoft Metro flat".

### Fluent / Metro
- **Grammar:** Segoe UI Variable; Metro: flat live tiles, all-lowercase oversized headers, edge-to-edge panorama; Fluent 2: acrylic/mica translucent surfaces, reveal highlight, soft 4–8px radius, neutral greys with one accent; depth via subtle shadow and layering.
- **Says:** Windows, enterprise, productivity, Microsoft 365.
- **Fits:** Windows apps, enterprise SaaS, Teams/Office add-ins, admin consoles. **Misfits:** consumer lifestyle, creative portfolios, anything that must not look like Microsoft.
- **Trap:** mica/acrylic needs backdrop-filter and blurs into grey mush; Segoe not licensed for web (fallback breaks the look); Metro tile pastiche feels 2012.
- **Load:** fast (medium with acrylic backdrop-filter).
- **Seen at:** https://fluent2.microsoft.design — Fluent 2 tokens, materials, motion; https://cari.institute/aesthetics/frutiger-metro — CARI archive of the Metro-era flat-glossy hybrid.
- **Search:** "Fluent 2 design system"; "Metro UI" Windows Phone; CARI "Frutiger Metro"; "Windows 11 mica acrylic web".

### Frutiger Aero
- **Grammar:** humanist sans (Frutiger, Segoe UI, Myriad); sky-blue/aqua/lime gradients, glossy "gel" buttons with top highlight, glass and water, bubbles, lens flares, aurora, grass macro, fish; rounded everything; Windows Vista/7, Wii, early iPod era.
- **Says:** optimistic mid-2000s tech utopia, clean nature-meets-technology, nostalgia.
- **Fits:** nostalgia campaigns, music, wellness-with-irony, eco tech, Gen-Z fashion drops, game sites. **Misfits:** serious finance, B2B SaaS, editorial.
- **Trap:** gloss and stock-photo collage reads as clip-art pastiche; white text on light aqua fails contrast; raster heavy.
- **Load:** medium (gradients/gloss in CSS fine, but photo bubbles/backgrounds heavy).
- **Seen at:** https://frutigeraeroarchive.org — archive site styled in Aero gloss, wallpapers and media; https://cari.institute/aesthetics/frutiger-aero — CARI reference board with dated examples.
- **Search:** Aesthetics Wiki "Frutiger Aero"; CARI "Frutiger Aero"; Are.na "frutiger aero"; "Windows Vista Aero glass UI"; "Frutiger Eco".

### Generative / creative-coding
- **Grammar:** algorithmic visuals (flow fields, particles, noise, shaders, cellular patterns) as the identity, often unique per visit; restrained type (mono or grotesk) so the system leads; canvas/WebGL heroes.
- **Says:** inventive, technical-artistic, alive, systems thinking.
- **Fits:** creative studios, generative artists, AI/ML, conferences, data/science brands. **Misfits:** conservative institutions, low-power audiences.
- **Trap:** GPU/battery drain; screensaver look with no idea behind it; text over moving fields; no static fallback.
- **Load:** high.
- **Seen at:** https://lusion.co — WebGL studio site with particle/physics visuals; https://activetheory.net — real-time 3D generative studio site; https://www.tylerxhobbs.com — generative artist (Fidenza) portfolio.
- **Search:** Codrops "WebGL"; OpenProcessing; Awwwards "WebGL"; "generative brand identity"; Are.na "creative coding".

### Glassmorphism
- **Grammar:** translucent panels (`backdrop-filter: blur`), a vivid
  gradient or photographic ground behind them, thin light borders, layered
  depth.
- **Says:** modern, light, layered, OS-native.
- **Fits:** dashboards over imagery, wellness and health, OS-like product shells. **Misfits:** print-like or archival subjects.
- **Trap:** blur on large or many surfaces is GPU-expensive and janks on
  scroll; text over a moving ground loses contrast.
- **Load:** fast to write, medium at runtime. Limit blur to a few fixed
  panels.
- **Seen at:** reflect.app: note-taking app whose glass cards sit over a dark aurora ground (cited by mycodelesswebsite and enlighten-media); perplexity.ai/personal-computer: the enlighten-media showcase's glass example.
- **Search:** trends.daisyui.com/trend/glassmorphism/; design-styles.enlighten-media.net/pages/glassmorphism/; awwwards.com/websites/glassmorphism/; "Apple Liquid Glass" web examples; mycodelesswebsite.com/glassmorphism-websites/.

### Glitch art
- **Grammar:** RGB channel splits, datamosh, pixel sorting, scanline tears, jitter on hover, distorted display type, CRT noise, black/white plus RGB primaries.
- **Says:** disruption, digital decay, edgy tech, music energy.
- **Fits:** electronic music, games, cybersecurity events, fashion drops, film trailers. **Misfits:** calm/trust brands, long reading, healthcare.
- **Trap:** flashing (WCAG 2.3.1 seizure risk); constant canvas/shader repaint; glitched text unreadable; dated 2016 trope.
- **Load:** medium (CSS clip-path glitch) to high (WebGL shaders).
- **Seen at:** https://www.awwwards.com/inspiration/glitch-effect — Awwwards collection of shipped glitch interactions; https://www.hongkiat.com/blog/website-glitch-effects/ — showcase of live sites using glitch.
- **Search:** Awwwards "glitch"; Codrops "glitch effect"; Aesthetics Wiki "Glitchcore"; "datamosh web"; Speckyboy "glitch effect web design".

### Gradient-grain
- **Grammar:** gradients overlaid with film/SVG noise (feTurbulence), muted or retro-warm palettes, soft halos; editorial sans or serif; tactile print feel.
- **Says:** warm, analogue, crafted digital; less sterile than flat gradients.
- **Fits:** creative studios, wellness, music, podcasts, browsers and consumer tech with personality. **Misfits:** dense data, enterprise admin.
- **Trap:** full-viewport noise as large PNG; animated grain repaint cost; blend-mode noise varying across browsers; muddy contrast.
- **Load:** fast (SVG filter) to medium (raster noise).
- **Seen at:** https://fffuel.co/gggrain/ — generator and reference for grainy gradients; https://css-tricks.com/grainy-gradients/ — technique write-up with live demos; https://arc.net — browser site with soft grainy colour fields.
- **Search:** "grainy gradient"; "noise texture web design"; Dribbble "grain gradient"; Godly "gradient"; "feTurbulence noise".

### Hand-drawn / sketchy UI
- **Grammar:** wobbly rough strokes on boxes and arrows, handwritten fonts (Virgil, Caveat, Kalam), hachure fills, whiteboard canvas, marker colours, intentionally imperfect alignment.
- **Says:** early-stage, collaborative, approachable, thinking-in-progress.
- **Fits:** whiteboards, ideation tools, education, personal blogs, explainers. **Misfits:** finished-product polish, finance, enterprise trust.
- **Trap:** handwritten body text hurts reading; looks unfinished; rough.js SVG heavy with many nodes.
- **Load:** fast–medium.
- **Seen at:** https://excalidraw.com — sketchy whiteboard with Virgil font; https://www.tldraw.com — hand-drawn infinite canvas; https://roughjs.com — library producing the sketchy look.
- **Search:** "hand-drawn website design"; rough.js; "sketchy UI"; Hoverstat.es "illustration"; "handwritten font web".

### Holographic / iridescent
- **Grammar:** thin-film rainbow shifts (pink-cyan-lime-violet) on chrome or foil, angle- or cursor-dependent colour, specular sweeps, pearlescent cards; usually black or white ground with tight sans.
- **Says:** futuristic, collectible, premium-novelty, beauty/fashion tech.
- **Fits:** cosmetics, fashion, trading cards/collectibles, crypto, music, events. **Misfits:** sober finance, healthcare, government.
- **Trap:** shader cost and battery; colour noise behind text; Y2K overlap; looks cheap when CSS-only gradients fake foil badly.
- **Load:** high (WebGL shaders) or medium (CSS conic gradients).
- **Seen at:** https://open-design.ai/plugins/example-webgl-holographic-foil/ — live WebGL thin-film foil demo.
- **Search:** "holographic foil CSS"; "iridescent shader three.js"; Codrops "iridescence"; "Pokémon card holo CSS" (simey); Aesthetics Wiki "Holographic".

### Indie web / small web personal sites
- **Grammar:** hand-written HTML/CSS, system or one quirky webfont, 88x31 badges, guestbooks, webrings, sidebars, status cafés, sticker cursors, pastel or dark custom palettes, pixel art accents; personality over polish; RSS everywhere.
- **Says:** human-made, independent, anti-platform, personal.
- **Fits:** personal sites, blogs, digital gardens, hobby communities, artists. **Misfits:** brands, SaaS, institutions.
- **Trap:** fixed widths not responsive; tiny pixel fonts; low-contrast themed text; clutter.
- **Load:** fast.
- **Seen at:** https://melonland.net — MelonLand, a hub of the modern personal-web scene with hand-made layout; https://32bit.cafe — community for personal sites with retro web styling; https://indieweb.org — IndieWeb principles (own your content).
- **Search:** "small web" / "personal website" Neocities; "digital garden"; "webring 2025"; "indie web aesthetic"; Are.na "personal websites".

### Internet toy / playful interactive web
- **Grammar:** single-purpose interactive pages — sliders, physics, draggable objects, absurd prompts; simple sans or hand type, white or bright backgrounds; the interaction is the design.
- **Says:** curious, delightful, shareable, human.
- **Fits:** personal projects, education, campaigns, viral microsites, museums. **Misfits:** conversion-driven products, enterprise.
- **Trap:** novelty with no payoff; inaccessible custom controls; mobile touch broken.
- **Load:** fast–medium (high if physics/WebGL).
- **Seen at:** https://neal.fun — Neal Agarwal's games and interactive explainers; https://oimo.io — physics/creative-coding toys.
- **Search:** "internet toys"; neal.fun; Hoverstat.es; Are.na "web toys"; "the useless web".

### Isometric illustration
- **Grammar:** 30-degree axonometric vector scenes of servers, desks, cities and flows; flat or soft-gradient fills; brand-colour accents; no vanishing point; often modular tiles.
- **Says:** systems, infrastructure, orderly complexity explained.
- **Fits:** cloud/infra SaaS, logistics, fintech explainers, games (puzzle). **Misfits:** human/emotional brands, luxury, editorial.
- **Trap:** generic 2018 SaaS cliché; tiny detail unreadable on mobile; huge SVGs; style clash with UI screenshots.
- **Load:** fast–medium (SVG weight).
- **Seen at:** https://www.monumentvalleygame.com — isometric impossible-architecture game brand; https://www.lapa.ninja/category/isometric — gallery of isometric landing pages.
- **Search:** Lapa Ninja "isometric"; Dribbble "isometric illustration"; "isometric SaaS hero"; "isometric CSS transform"; Monument Valley art.

### Kinetic typography
- **Grammar:** type as the main visual and main motion — oversized display faces (variable fonts, condensed grotesques), split-text reveals, scroll-scrubbed scale, distortion/twist shaders, marquees, morphing weights.
- **Says:** energy, confidence, voice, motion craft.
- **Fits:** motion designers, type foundries, agencies, music, sport, campaigns. **Misfits:** reading-heavy content, accessibility-critical services.
- **Trap:** no prefers-reduced-motion fallback; SplitText breaks screen readers and SEO; CLS from late font load; motion over message.
- **Load:** medium (GSAP + variable font) to high (WebGL type).
- **Seen at:** https://matvoyce.tv — Mat Voyce portfolio, GSAP/WebGL kinetic type (Awwwards SOTD Jan 2025).
- **Search:** Awwwards "kinetic typography"; Godly "typography"; Codrops "text animation"; "variable font animation"; "GSAP SplitText".

### Liquid Glass (Apple 2025)
- **Grammar:** translucent material that refracts and lenses content beneath (not just blurs), specular rim highlights responding to motion, capsule controls floating over content, concentric corner radii, SF Pro; content-first with chrome receding.
- **Says:** Apple-platform native, 2025-current, fluid, premium.
- **Fits:** iOS/macOS app marketing, Apple-ecosystem products, music/media players. **Misfits:** Android/Windows-first products, text-dense tools, low-end device audiences.
- **Trap:** legibility over busy content (Apple's own early complaint); SVG displacement-filter refraction only works in Chromium; heavy GPU; looks like dated glassmorphism if only blur.
- **Load:** medium–high (backdrop-filter + SVG displacement / WebGL).
- **Seen at:** https://www.apple.com/newsroom/2025/06/apple-introduces-a-delightful-and-elegant-new-software-design/ — Apple's launch of Liquid Glass; https://developer.apple.com/design/human-interface-guidelines/materials — HIG on Liquid Glass materials.
- **Search:** "Liquid Glass CSS"; "liquid glass SVG displacement"; "iOS 26 design"; Codrops "liquid glass"; Dribbble "liquid glass UI".

### Low-poly
- **Grammar:** faceted flat-shaded 3D meshes, limited palettes per scene, toy-like miniature worlds, orthographic or soft perspective camera, chunky sans or pixel UI.
- **Says:** playful, game-like, handcrafted 3D, approachable.
- **Fits:** games, creative-developer portfolios, kids/edu, interactive storytelling. **Misfits:** corporate, finance, text-heavy.
- **Trap:** WebGL load and battery; no fallback; navigation hidden in a game; 2014 polygon-wallpaper pastiche when used as static background.
- **Load:** high.
- **Seen at:** https://bruno-simon.com — drivable low-poly 3D portfolio; https://messenger.abeto.co — Abeto's Messenger, a walkable low-poly planet in the browser.
- **Search:** Awwwards "3D websites"; "low poly three.js"; Godly "3D"; Aesthetics Wiki "Low Poly"; Spline community low poly.

### Material Design / Material You (M3)
- **Grammar:** Roboto / Google Sans (Product Sans) / Roboto Flex; dynamic tonal palettes derived from a seed colour; elevation by tone not shadow (M3); large-radius pill buttons, FABs, chips, cards; shape morphing; emphasised easing, container-transform motion.
- **Says:** Android-native, systematic, friendly-engineered, Google ecosystem.
- **Fits:** Android apps and companion sites, productivity tools, Google-adjacent developer products, internal tools wanting a ready system. **Misfits:** brands needing distinct identity, editorial, luxury, iOS-first products.
- **Trap:** reads as stock template; tonal palettes produce muddy low-contrast surface/on-surface pairs; mixing M2 shadows with M3 tones.
- **Load:** fast (medium if Material Web components + Roboto Flex variable font).
- **Seen at:** https://m3.material.io — canonical M3 tonal colour, shape and motion system; https://www.android.com — expressive M3 shapes, pastel tonal blocks, playful morphing.
- **Search:** "Material 3 Expressive"; "Material You dynamic color"; m3.material.io/styles; "Material design" Godly; Figma community "Material 3 Design Kit".

### Monochrome mono-type dev sites
- **Grammar:** a single monospace family for everything (Berkeley Mono, Commit Mono, IBM Plex Mono); black/white plus at most one accent; dense lists, tables, changelogs; hairline rules; tiny sizes, generous line-height; no imagery.
- **Says:** precise, unhyped, typographically literate engineering.
- **Fits:** fonts, dev tools, open-source projects, technical writers, studios of one. **Misfits:** consumer marketing, emotion-led brands.
- **Trap:** monospace body text slows long reading; everything same weight so hierarchy vanishes; grey-on-grey.
- **Load:** fast.
- **Seen at:** https://commitmono.com — whole site set in its own monospace with live settings; https://berkeleygraphics.com — Berkeley Mono: monochrome, technical-catalogue layout.
- **Search:** "monospace website"; Godly "monospace"; Siteinspire "minimal" + mono; "developer portfolio monospace"; Are.na "monospace web".

### Neo-brutalism
- **Grammar:** thick black borders, hard offset shadows (no blur), flat
  saturated fills, chunky grotesk, visible structure, sticker-like
  components.
- **Says:** honest, energetic, indie, unpolished on purpose.
- **Fits:** creative tools, developer tools for indie audiences, Gen-Z products, component libraries. **Misfits:** luxury, healthcare trust.
- **Trap:** used as a skin on a conventional layout. The offset shadows
  without the rawness read as a theme.
- **Load:** fast.
- **Seen at:** gumroad.com: the canonical neo-brutalist commerce site (black borders, hard offset shadows, flat pink and yellow); neobrutalism.dev: a shadcn-based component library in the style.
- **Search:** trends.daisyui.com/trend/neubrutalism/; awwwards.com/websites/neo-brutalism/; brutalistwebsites.com (raw brutalism, the parent); Godly "brutalist"; Dribbble "neubrutalism".

### Neumorphism
- **Grammar:** a monochrome ground, elements extruded *from* it by twin
  light and dark shadows, almost no borders, one muted accent.
- **Says:** calm, physical, hardware-like control surfaces.
- **Fits:** smart-home and device controls, music and audio tools. **Misfits:** anything text-heavy or that must be accessible at a glance.
- **Trap:** controls have no visible edge, so affordance and contrast fail
  (WCAG 1.4.11). Keep a real focus ring and a 3:1 boundary on every control.
- **Load:** fast.
- **Seen at:** neumorphism.io: the generator that popularised the twin-shadow CSS, itself rendered in the style; demo.themesberg.com/neumorphism-ui/: Themesberg's full Neumorphism UI kit as a live site.
- **Search:** trends.daisyui.com/trend/neumorphism/; design-styles.enlighten-media.net/pages/neumorphism/; awwwards.com/websites/neumorphism/; Dribbble "soft UI smart home"; uxdesign.cc "neumorphism isn't actually a design trend".

### Notion-style doodle minimal
- **Grammar:** black-line hand-drawn people/objects (Open Peeps style) with occasional single accent colour, lots of white, neutral grey UI, Inter/system sans and serif headlines, emoji as icons, calm grid.
- **Says:** thoughtful, calm, creative-productive, human but tidy.
- **Fits:** productivity, writing tools, knowledge bases, edtech, startups wanting warmth. **Misfits:** gaming, luxury, high-energy consumer.
- **Trap:** now default "Notion clone"; doodles inconsistent in line weight; empty whitespace reads unfinished.
- **Load:** fast.
- **Seen at:** https://www.notion.com — monochrome doodle illustration plus clean UI; https://www.openpeeps.com — hand-drawn people library defining the look.
- **Search:** "Notion illustration style"; Open Peeps / Open Doodles; Lapa Ninja "illustration"; "black line doodle illustration"; Blush (blush.design).

### Pixel art
- **Grammar:** a bitmap or pixel display face, a hard-edged limited
  palette, stepped (not eased) motion, 8-bit icons.
- **Says:** playful, gaming, retro-computing, craft.
- **Fits:** games, developer tools with humour, indie brands. **Misfits:** luxury, health.
- **Trap:** pixel fonts at body size; smoothed scaling (use
  `image-rendering: pixelated` and integer scales).
- **Load:** fast.
- **Seen at:** lexaloffle.com/pico-8.php: the PICO-8 fantasy-console site with pixel UI and palette; wizardshock.xyz: pixel studio site (enlighten-media pixel-art page); stardewvalley.net: game site using the game's pixel art *(own read)*.
- **Search:** design-styles.enlighten-media.net/pages/pixel-art/; trends.daisyui.com/trend/pixel-art/ and /trend/rpg-pixel-art/; awwwards.com/websites/pixel-art/; One Page Love "pixel"; Fonts In Use "bitmap" / "pixel fonts".

### Raw brutalist web (unstyled HTML)
- **Grammar:** browser defaults — Times/system serif, blue/purple links, full-width text, `<hr>`, no images or tiny ones; or minimal hand CSS with monospace; content-first, zero decoration.
- **Says:** honest, fast, indifferent to trends, information over persuasion.
- **Fits:** investor relations of contrarian firms, link aggregators, classifieds, manifesto sites, documentation, essays. **Misfits:** consumer brands, e-commerce conversion, onboarding.
- **Trap:** line length unlimited on wide screens; looks broken rather than chosen; no visual hierarchy so scanning fails.
- **Load:** fast.
- **Seen at:** https://www.berkshirehathaway.com — famously unstyled corporate homepage; https://www.craigslist.org — bare link lists at scale; https://www.drudgereport.com — Courier/Times link wall.
- **Search:** brutalistwebsites.com; brutalist-web.design (guidelines); "motherfuckingwebsite"; "plain HTML website"; "better motherfucking website".

### Retro CRT phosphor (amber / green)
- **Grammar:** VT323, IBM Plex Mono, Glass TTY, "Perfect DOS VGA"; single-hue phosphor (P1 green #33ff33, P3 amber #ffb000) on near-black; text-shadow glow, scanlines, barrel distortion, flicker, vignette.
- **Says:** 1980s mainframe, hacker fiction, Fallout/Alien-style retro-future.
- **Fits:** games, ARGs, sci-fi films, CTF/security events, retro hardware. **Misfits:** long-form reading, accessibility-critical services.
- **Trap:** glow and scanlines kill legibility; flicker triggers photosensitivity; monochrome removes hierarchy; animated overlays repaint every frame.
- **Load:** fast (medium if WebGL CRT shader).
- **Seen at:** https://github.com/Swordfish90/cool-retro-term — reference CRT terminal emulator look; https://kombai.com/gallery/inspirations/okafor/ — phosphor-green portfolio template with scanline glow.
- **Search:** "CRT effect CSS"; "phosphor terminal UI"; "Fallout pip-boy UI"; "retro terminal website"; Codrops "CRT".

### Retro OS desktop (Windows 95 / classic Mac / XP)
- **Grammar:** window chrome with title bars, bevelled 3D grey buttons (#c0c0c0), Chicago/Charcoal/MS Sans Serif/Tahoma pixel fonts, desktop icons, draggable windows, start menu/menu bar, dialog boxes, Luna blue (XP) or 1-bit Mac.
- **Says:** playful nostalgia, "the site is a computer", explorable.
- **Fits:** product sites with personality, music/radio, portfolios, games, internet-culture brands. **Misfits:** checkout flows, accessibility-critical, mobile-first services.
- **Trap:** windows unusable on mobile; drag UX hides content; keyboard focus traps; fake chrome slows real tasks.
- **Load:** medium.
- **Seen at:** https://posthog.com — full desktop-OS metaphor with windows and icons for a product analytics site; https://poolsuite.net — classic-Mac-style desktop radio player; https://jdan.github.io/98.css/ — Windows 98 component library.
- **Search:** 98.css / XP.css / system.css; "website as operating system"; "Windows 95 web design"; Aesthetics Wiki "Windows 95"; Godly "retro".

### Skeuomorphism
- **Grammar:** UI rendered as physical objects — leather, brushed metal, felt, paper, knobs, toggles, LED segments; inner/drop shadows, specular highlights, embossed labels; type borrowed from hardware silkscreen (Helvetica, DIN, OCR, dot-matrix); macro product photography.
- **Says:** tactile, crafted, hardware-honest, playful nostalgia for objects.
- **Fits:** hardware, audio/music tools, synths, cameras, games, collectible gadgets. **Misfits:** dense data tools, government, anything needing scalable component systems.
- **Trap:** heavy raster textures; inconsistent light source; fake controls that don't behave like the real thing; contrast lost on embossed text.
- **Load:** medium (large images, layered shadows); high if 3D product renders.
- **Seen at:** https://teenage.engineering — hardware-as-UI, product photos and silkscreen-style labels; https://play.date — Playdate crank console presented as a tactile, physical toy.
- **Search:** "skeuomorphism revival 2024"; "neo-skeuomorphism" Dribbble; "tactile UI" Godly; "iOS 6 skeuomorphic"; Hoverstat.es hardware.

### Spatial / visionOS
- **Grammar:** floating glass panels with depth, soft shadows onto environment, ornaments, large rounded rects, hover-lift on gaze, SF Pro, 3D product renders and passthrough photography; dim surroundings, light panels.
- **Says:** immersive, next-platform, calm future computing.
- **Fits:** XR products, 3D tools, immersive media, Apple Vision Pro apps. **Misfits:** dense web apps, budget brands, text-heavy docs.
- **Trap:** fake depth on a flat screen feels inert; heavy video/3D; parallax nausea.
- **Load:** high.
- **Seen at:** https://www.apple.com/apple-vision-pro/ — spatial UI showcased with video and layered glass windows.
- **Search:** "visionOS UI design"; HIG "Designing for visionOS"; Dribbble "spatial UI"; "spatial computing website"; Godly "3D".

### Synthwave
- **Grammar:** an 80s sunset gradient, perspective grid floor, chrome
  script, palms, magenta, cyan and purple, VHS grain.
- **Says:** retro-future nostalgia.
- **Fits:** music, retro games, events. **Misfits:** almost every business product.
- **Trap:** pastiche. It is a costume unless the subject owns the era.
- **Load:** fast (CSS grid and gradient); high if the grid is a live 3D scene.
- **Seen at:** synthwave.live: a synthwave music player in pink and purple (described by its author, Blake Watson); neonflorida.com: listed on the enlighten-media vaporwave/retro-neon page.
- **Search:** trends.daisyui.com/trend/synthwave-outrun/; design-styles.enlighten-media.net/pages/vaporwave/; Aesthetics Wiki "Synthwave" and "Outrun"; awwwards.com/websites/synthwave/; Fonts In Use "Outrun" / chrome script.

### Terminal / CLI
- **Grammar:** monospace (JetBrains Mono, Berkeley Mono, IBM Plex Mono, SF Mono); dark background, ANSI 16-colour accents; prompt glyphs `$ >`, blinking caret, typed-command reveals, command palettes, keyboard shortcuts shown as `kbd`; boxed TUI borders.
- **Says:** built by engineers for engineers; speed, control, keyboard-first.
- **Fits:** dev tools, CLIs, terminals, infra, security, hackathons, developer portfolios. **Misfits:** consumer, lifestyle, non-technical audiences.
- **Trap:** fake interactive terminal as navigation (hostile, unindexable); low-contrast grey-on-black; typing animations delaying content.
- **Load:** fast.
- **Seen at:** https://charm.sh — Charm: pink/purple TUI branding, terminal screenshots as hero; https://www.warp.dev — terminal product with dark, block-based command UI imagery.
- **Search:** "terminal portfolio" GitHub topic; "TUI design"; Godly "developer tools"; "CLI landing page"; "keyboard-first UI".

### Vaporwave
- **Grammar:** magenta-to-cyan pastel gradients, perspective grid floors, low sun, Greek busts, palm trees, Windows 95 dialogs, full-width Japanese text (Ａｅｓｔｈｅｔｉｃ), VHS artefacts, MS Gothic / Arial / Times in italic; slowed, dreamy motion.
- **Says:** ironic consumer-capitalism nostalgia, dreamy, internet-art.
- **Fits:** music releases, art, streetwear, game jams, nostalgia events. **Misfits:** serious B2B, healthcare, finance.
- **Trap:** meme pastiche; pastel text on pastel gradient fails contrast; confused with Synthwave (which is darker, neon, 80s cinema).
- **Load:** medium.
- **Seen at:** https://windows96.net — vaporwave-flavoured browser OS; https://cari.institute/aesthetics/vaporwave — CARI dated reference board; https://trends.daisyui.com/trend/vaporwave/ — vaporwave UI theme demo.
- **Search:** Aesthetics Wiki "Vaporwave"; CARI "Vaporwave"; "Ａｅｓｔｈｅｔｉｃ web design"; Webflow "made-in-webflow/vaporwave"; Are.na "vaporwave".

### Web 1.0 / GeoCities
- **Grammar:** Times New Roman, Comic Sans, Arial, default blue underlined links; tiled backgrounds, tables, `<marquee>`, animated GIFs, under-construction signs, hit counters, webrings, 88x31 buttons; 8–16 colour palettes on black or tiled bg; fixed 640–800px widths.
- **Says:** amateur, personal, sincere, 1990s internet.
- **Fits:** nostalgia projects, fan sites, music/zine side projects, retro films, art projects. **Misfits:** anything commercial needing trust, accessibility-sensitive services.
- **Trap:** pastiche without the sincerity; GIF weight; motion (blink/marquee) breaking reduced-motion and readability; not responsive.
- **Load:** fast (medium if many GIFs).
- **Seen at:** https://www.spacejam.com/1996/ — the original 1996 Space Jam site preserved live; https://neocities.org — free host continuing GeoCities culture.
- **Search:** "GeoCities archive" (oocities, geocities.restorativland.org); "88x31 buttons"; Aesthetics Wiki "Web 1.0"; "One Terabyte of Kilobyte Age"; Neocities browse.

### Webcore
- **Grammar:** curated remix of early-web artefacts — GIF collages, Windows dialog boxes, cursor trails, pixel fonts, stock 3D clip-art, sparkle text, layered browser chrome; maximal, scrolling collage rather than a working site.
- **Says:** internet nostalgia as art; irony; archival love of the old web.
- **Fits:** artist portfolios, music releases, galleries, festival microsites. **Misfits:** products, services, anything task-driven.
- **Trap:** becomes unreadable collage; enormous GIF payload; no information hierarchy; borrowed assets with rights issues.
- **Load:** medium–high (hundreds of GIFs).
- **Seen at:** https://www.cameronsworld.net — Cameron's World, collage of archived GeoCities fragments; https://www.windows93.net — absurdist fake OS mashing early-web artefacts.
- **Search:** Aesthetics Wiki "Webcore"; "Cameron's World"; Are.na "webcore"; "old web aesthetic collage"; "Y2K web GIF collage".

### Weirdcore / Dreamcore
- **Grammar:** low-res amateur photos of empty spaces (liminal), oversaturated sky, eyes, clip-art, MS Paint text in white with black outline or Comic Sans/Arial, cryptic messages ("you are not alone"), compression artefacts, default-system UI.
- **Says:** unease, nostalgia turned uncanny, dream logic, liminality.
- **Fits:** ARGs, horror games, experimental music, art projects. **Misfits:** anything needing trust or clarity.
- **Trap:** reads as broken or as a hack; disturbing imagery; zero information architecture.
- **Load:** fast–medium.
- **Seen at:** https://cari.institute/aesthetics/weirdcore — CARI reference board; https://cari.institute/aesthetics/dreamcore — CARI reference board; https://zombo.com — early absurdist web, uncanny looping promise.
- **Search:** Aesthetics Wiki "Weirdcore" / "Dreamcore" / "Liminal Space"; "Kidcore"; Are.na "weirdcore"; "ARG website design".

### Y2K aesthetic
- **Grammar:** chrome and iridescence, bubbly 3D blobs, smileys, pixel
  cursors, grids, spray gradients, early-web UI chrome, bright pink, cyan and
  yellow.
- **Says:** nostalgic, playful, internet-native.
- **Fits:** youth brands, events, creative schools, music. **Misfits:** B2B trust, finance.
- **Trap:** a sticker pile with no hierarchy; it dates fast. Decide what
  it is ironic *about*.
- **Load:** medium (3D renders as images). High only if the blobs are live
  WebGL.
- **Seen at:** workos.com/launch-week/spring-2026: chrome gradients, iridescence and bubble type on a launch-week microsite (enlighten-media Y2K page); spacehey.com: a working MySpace-style social network, early-2000s UI chrome.
- **Search:** cari.institute (Consumer Aesthetics Research Institute, Y2K and adjacent eras); webdesignmuseum.org/exhibitions/y2k-aesthetic-in-web-design; trends.daisyui.com/trend/y2k/ and /trend/y2k-techno-skeuomorphism/; awwwards.com/websites/y2k/ (finds the Versace Jeans Couture "Y2K Never Dies" page); Aesthetics Wiki "Y2K".
