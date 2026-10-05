# Identity library

The skill's gallery of visual identities, and the **search engine** for every
design direction. The author should never have to supply every reference
from scratch, and the agent should never fall back to "modern SaaS landing
page" because it could not think of anything else.

The library **expands and challenges** the author's direction
(`identity.md` §3). It never overrides it. It is a starting vocabulary, not
a menu to pick from blind. "Victorian" for a typography course and
"Victorian" for a tea shop are different identities.

The index below lists every identity in one line. The full entries live in
`identities/<family>.md`; open only the families you need.

---

## How to search it

1. **Read the brief for search terms.** What is the subject? Who is the
   audience? What feeling words did the author use ("old newsletter",
   "calm", "loud", "premium")? What constraints apply (brand, accessibility,
   loading)?
2. **Find the sector default first.** Look up the subject in *Industry
   archetypes*. Its Trap line names the generic version of this sector,
   which is the thing every candidate must escape.
3. **Scan Says and Fits** across every family for the feeling words and
   the subject. Shortlist **6–10 identities from at least three families**.
   Make sure the shortlist includes:
   - the identity closest to the author's stated intent
   - one drawn from the subject's own world (its documents, packaging,
     instruments, history; `recipes-design.md` §5)
   - one the author would not have reached, from a family they did not
     mention
4. **Open the family files** for the shortlist. Read Grammar and Trap.
   Cut anything whose Misfits names the subject, or whose Trap you cannot
   avoid within the loading tier.
5. **Research each survivor** with its **Seen at** and **Search** lines
   (`identity.md` §6). Probe the Seen-at sites when Playwright is allowed
   (`node scripts/probe.mjs <url>`). Do not stop at the first good one, and
   log what you rejected.
6. **Narrow to three candidates** and audition them (`audition.md`), or
   present them for the author's choice on the design path.

The library's identities combine (see Combining below). A candidate can be
"Archival newsprint composition with Risograph colour", as long as the
brief says which identity owns which part of the grammar.

---

## Entry format

Every entry in `identities/*.md` has:

- **Grammar:** the type, colour, geometry, surface and motion that make it recognisable
- **Says:** what it communicates
- **Fits / Misfits:** subjects it serves and subjects it fights
- **Trap:** how it goes wrong on the web; for industry archetypes, the generic default and how the best escape it
- **Load:** the cheapest tier that does it faithfully (`audition.md` §4)
- **Seen at:** live sites that ship it. URLs were checked live on 2026-10-05; look at a site before quoting a detail from it
- **Search:** queries, gallery tags and wiki pages that find more references

General sources that work for almost any entry: Aesthetics Wiki
(`aesthetics.fandom.com/wiki/<Name>`), `trends.daisyui.com/trend/<slug>/`
(style write-ups with demos), Fonts In Use, Typewolf, Godly, Siteinspire,
Land-book, Hoverstat.es, Are.na channels, CARI (`cari.institute`).
Awwwards tag URLs (`awwwards.com/websites/<tag>/`) accept any word, so read
them as free-text searches, not curated lists.

---

## Index

### Historical movements — `identities/historical.md` (31)

| Identity | Says | Fits | Load |
|---|---|---|---|
| 70s Supergraphics / Groovy | warmth, nostalgia, easy-going optimism | food & drink, consumer goods, music, skate/surf, hospitality, cannabis | fast |
| Art Brut / Outsider art | authenticity, raw creativity, the unpolished human | galleries, art therapy, children's charities, independent musicians, craft | medium |
| Art Deco | glamour, ceremony, old money, Jazz Age confidence | hotels, cocktail bars, spirits, theatre, jewellery, galas, luxury residential | fast |
| Art Nouveau | craft, nature, romance, fin-de-siècle refinement | perfume, tea, botanicals, wine, florists, museums, fantasy publishing | fast |
| Arts & Crafts | handmade, honest materials, heritage craft, anti-industrial | furniture makers, bookbinders, heritage, textiles, independent publishers, gardens | fast |
| Atomic Age / Googie | postwar optimism, Americana, kitsch futurism | diners, motels, bowling, games, retro events, cocktail bars | fast |
| Bauhaus | function, rationality, education, modernist confidence | design schools, architecture, museums, furniture, tooling, typography projects | fast |
| Concrete Brutalism (architectural) | civic ambition, permanence, honesty of material, urban culture | arts centres, architecture, housing, urbanism, photography books, techno | medium |
| Constructivism / Soviet avant-garde poster | agitation, urgency, collective force, revolution | activism, theatre, music, festivals, political campaigns, editorial | fast |
| Dada / photomontage | anti-art, irony, nonsense as critique | art institutions, experimental music, satire, zines, cultural anniversaries | medium |
| De Stijl / Neoplasticism | order, balance, Dutch modernism, pure structure | architecture, galleries, design studios, furniture, portfolios | fast |
| Emigre / Cranbrook deconstruction (postmodern type) | theory-driven, critical, 1990s digital avant-garde | design criticism, art schools, experimental publishing, music labels | fast |
| Grunge (90s Carson-era) | raw, emotional, alternative, intentional rule-breaking | music, skate/surf, fashion, film, magazines, youth culture | medium |
| Italian Futurism | speed, noise, machines, aggression, the new | motorsport, music, aviation, energy drinks, Campari-style aperitivo, experimental type | fast |
| Maximalism | abundance, culture, personality, art | art, music, fashion, culture festivals, post-internet brands | medium |
| Memphis | irreverent, playful, anti-good-taste 80s postmodernism | design shops, toys, events, youth brands, galleries, creative studios | fast |
| Mid-century modern | optimistic, design-literate, warm modernism | furniture, interiors, architecture tours, coffee, record shops, travel, kids' books | fast |
| Minimalism | confidence, focus, premium restraint | almost anything whose product or photography is strong | fast |
| Op Art | perception, sixties modernity, hypnotic precision | opticians, galleries, fashion, music, events, hypnotic product launches | fast |
| Polish poster school | intellectual wit, cultural seriousness, artistic authorship | film festivals, theatre, opera, books, cultural institutions | medium |
| Pop Art | fun, mass culture, irony, consumer bravado | snacks, drinks, entertainment, retail, events, comics | fast |
| Psychedelic 60s | altered state, counterculture, joy, music festival | gigs, festivals, records, cannabis/psychedelic therapy, craft beer, fashion drops | medium |
| Punk xerox / ransom note | DIY, anger, independence, anti-establishment | bands, gigs, activism, streetwear, independent zines, skate | medium |
| Space Age / 60s retro-futurism | exploration, optimism about technology, the future as it was imagined | aerospace, science museums, audio hardware, fashion, sci-fi media, launches | fast |
| Streamline Moderne | speed, optimism, machine-age travel | rail/travel, automotive, diners, appliances, retro tech, hospitality | fast |
| Surrealism | imagination, a twist, brand as idea | creative agencies, travel, fashion campaigns, launches | medium |
| Swiss design | clarity, rigour, nothing superfluous | design studios, architecture, institutions, B2B tools with something to state | fast |
| Swiss Punk / New Wave typography | educated rebellion, typographic experimentation within rigour | design schools, type foundries, architecture, cultural programmes, music | fast |
| Ukiyo-e / Japanese woodblock | Japanese craft, narrative tradition, calm drama | Japanese food, sake, tea, travel, games set in Japan, museums, tattoo | medium |
| Victorian | heritage, theatre, opulence, the antique | typography and art courses, museums, tea, theatre, heritage brands | medium |
| Vienna Secession / Wiener Werkstätte | cultured, architectural, Viennese rigour with ornament | galleries, architecture firms, coffee houses, design shops, classical music | fast |

### Digital and UI-native — `identities/digital.md` (48)

| Identity | Says | Fits | Load |
|---|---|---|---|
| 3D scroll-story (Apple product page) | premium hardware, engineering marvel, launch-event drama | hardware launches, cars, wearables, premium devices | high |
| Acid graphics | digital subculture, edge, speed | music, club nights, fashion drops, crypto culture, creative studios | fast to medium |
| Anti-design | rebellion, authenticity, art-school confidence, anti-corporate | art schools, fashion, music, galleries, provocative campaigns | fast |
| ASCII / text-mode art | code-literate, crafty, nerdy-poetic | dev tools, creative coders, terminals, music/zines, experimental studios | fast |
| Aurora / mesh gradients | modern fintech/SaaS optimism, energy, premium-but-friendly | fintech, AI, SaaS launch pages, conferences | medium |
| Bento grid | "many capabilities, organised" | product feature overviews, portfolios, personal sites | fast |
| Blob / fluid organic shapes | calm, friendly, human, soft tech | wellness, mental health, education, consumer apps, children, community | fast |
| Claymorphism | friendly, touchable, low-stakes | consumer apps, onboarding, kids and education, playful fintech | fast |
| Corporate Memphis (and its backlash) | inclusive, friendly, big-tech approachability — now also generic, inauthentic | deliberate retro/ironic use, internal tools, quick explainers where budget is low | fast |
| Cybercore | online-native nostalgia, dreamy tech, fan and fashion culture | fashion and edit accounts, music, fan sites, youth events | fast to medium |
| Cyberpunk | high-tech, dystopian, gaming | games, esports, security, hardware | fast |
| Dark mode neon dashboard | real-time, operational, powerful, tech-savvy | observability, trading, analytics, security ops, gaming stats | fast |
| Data-viz-as-hero | evidence, rigour, curiosity, explanation | journalism, research, NGOs, climate, public data, analytics products | medium |
| Dithered / 1-bit low-tech | frugal, sustainable, honest, retro-Mac/Game Boy charm | sustainability, low-tech/solar projects, indie games, zines, handheld hardware | fast |
| Ethereal | wonder, aspiration, the intangible | wellness, travel, spiritual, fragrance, music | fast |
| Flat design | clear, honest, functional, public-service plainness or friendly product simplicity | government and civic services, onboarding-heavy consumer apps, education, utilities, documentation | fast |
| Fluent / Metro | Windows, enterprise, productivity, Microsoft 365 | Windows apps, enterprise SaaS, Teams/Office add-ins, admin consoles | fast |
| Frutiger Aero | optimistic mid-2000s tech utopia, clean nature-meets-technology, nostalgia | nostalgia campaigns, music, wellness-with-irony, eco tech, Gen-Z fashion drops, game sites | medium |
| Generative / creative-coding | inventive, technical-artistic, alive, systems thinking | creative studios, generative artists, AI/ML, conferences, data/science brands | high |
| Glassmorphism | modern, light, layered, OS-native | dashboards over imagery, wellness and health, OS-like product shells | fast |
| Glitch art | disruption, digital decay, edgy tech, music energy | electronic music, games, cybersecurity events, fashion drops, film trailers | medium |
| Gradient-grain | warm, analogue, crafted digital; less sterile than flat gradients | creative studios, wellness, music, podcasts, browsers and consumer tech with personality | fast |
| Hand-drawn / sketchy UI | early-stage, collaborative, approachable, thinking-in-progress | whiteboards, ideation tools, education, personal blogs, explainers | fast |
| Holographic / iridescent | futuristic, collectible, premium-novelty, beauty/fashion tech | cosmetics, fashion, trading cards/collectibles, crypto, music, events | high |
| Indie web / small web personal sites | human-made, independent, anti-platform, personal | personal sites, blogs, digital gardens, hobby communities, artists | fast |
| Internet toy / playful interactive web | curious, delightful, shareable, human | personal projects, education, campaigns, viral microsites, museums | fast |
| Isometric illustration | systems, infrastructure, orderly complexity explained | cloud/infra SaaS, logistics, fintech explainers, games | fast |
| Kinetic typography | energy, confidence, voice, motion craft | motion designers, type foundries, agencies, music, sport, campaigns | medium |
| Liquid Glass (Apple 2025) | Apple-platform native, 2025-current, fluid, premium | iOS/macOS app marketing, Apple-ecosystem products, music/media players | medium |
| Low-poly | playful, game-like, handcrafted 3D, approachable | games, creative-developer portfolios, kids/edu, interactive storytelling | high |
| Material Design / Material You (M3) | Android-native, systematic, friendly-engineered, Google ecosystem | Android apps and companion sites, productivity tools, Google-adjacent developer products, internal tools wanting a ready system | fast |
| Monochrome mono-type dev sites | precise, unhyped, typographically literate engineering | fonts, dev tools, open-source projects, technical writers, studios of one | fast |
| Neo-brutalism | honest, energetic, indie, unpolished on purpose | creative tools, developer tools for indie audiences, Gen-Z products, component libraries | fast |
| Neumorphism | calm, physical, hardware-like control surfaces | smart-home and device controls, music and audio tools | fast |
| Notion-style doodle minimal | thoughtful, calm, creative-productive, human but tidy | productivity, writing tools, knowledge bases, edtech, startups wanting warmth | fast |
| Pixel art | playful, gaming, retro-computing, craft | games, developer tools with humour, indie brands | fast |
| Raw brutalist web (unstyled HTML) | honest, fast, indifferent to trends, information over persuasion | investor relations of contrarian firms, link aggregators, classifieds, manifesto sites, documentation, essays | fast |
| Retro CRT phosphor (amber / green) | 1980s mainframe, hacker fiction, Fallout/Alien-style retro-future | games, ARGs, sci-fi films, CTF/security events, retro hardware | fast |
| Retro OS desktop (Windows 95 / classic Mac / XP) | playful nostalgia, "the site is a computer", explorable | product sites with personality, music/radio, portfolios, games, internet-culture brands | medium |
| Skeuomorphism | tactile, crafted, hardware-honest, playful nostalgia for objects | hardware, audio/music tools, synths, cameras, games, collectible gadgets | medium |
| Spatial / visionOS | immersive, next-platform, calm future computing | XR products, 3D tools, immersive media, Apple Vision Pro apps | high |
| Synthwave | retro-future nostalgia | music, retro games, events | fast |
| Terminal / CLI | built by engineers for engineers; speed, control, keyboard-first | dev tools, CLIs, terminals, infra, security, hackathons, developer portfolios | fast |
| Vaporwave | ironic consumer-capitalism nostalgia, dreamy, internet-art | music releases, art, streetwear, game jams, nostalgia events | medium |
| Web 1.0 / GeoCities | amateur, personal, sincere, 1990s internet | nostalgia projects, fan sites, music/zine side projects, retro films, art projects | fast |
| Webcore | internet nostalgia as art; irony; archival love of the old web | artist portfolios, music releases, galleries, festival microsites | medium |
| Weirdcore / Dreamcore | unease, nostalgia turned uncanny, dream logic, liminality | ARGs, horror games, experimental music, art projects | fast |
| Y2K aesthetic | nostalgic, playful, internet-native | youth brands, events, creative schools, music | medium |

### Print, type and craft — `identities/print-craft.md` (38)

| Identity | Says | Fits | Load |
|---|---|---|---|
| Academic paper / LaTeX | rigour, peer-reviewed seriousness, nerd credibility | research, ML/AI labs, technical blogs, documentation of methods, scientific tools | fast |
| Annual report / corporate print | accountability, scale, measured confidence | foundations, public companies, NGOs, yearly reviews, "state of" reports | medium |
| Archival newsprint | record, authority, history, "the story of this place" | bakeries and food with history, local institutions, media, archives, changelogs | fast to medium |
| Blueprint / cyanotype | making, process, plan-before-build, archival science | architects, makers, photography, education, product process pages | fast |
| Book-like long read | depth, authorship, attention, reading as an act | essays, writers, research, publishers, newsletters | fast |
| Botanical / natural-history illustration | knowledge, patience, nature catalogued with care | gardens, apothecary/skincare, tea, natural history, conservation, perfume | medium |
| Calligraphy | mastery, ritual, cultural depth, the human gesture | cultural institutions, tea, sake/spirits, luxury craft, artists, wedding | fast |
| Catalogue / mail-order | abundance, trustworthy utility, "everything you need" | hardware/industrial supply, outdoor gear, tool libraries, curated shops, directories | fast |
| Collage / photomontage | remix, critique, energy, cultural commentary | cultural magazines, music, fashion campaigns, activism, art schools | medium |
| Comic / manga panels | narrative, fun, approachable explanation, fandom | explainers, games, entertainment, onboarding stories, kids' education | medium |
| Conceptual sketch | process, thinking, design intent, "before it was built" | architecture, industrial design, studios, product origin stories | fast |
| Editorial design | authority, story, taste | media, fashion, culture, food, long-form products. The "old | fast to medium |
| Engraving / banknote (guilloche) | value, trust, officialdom, money | fintech, banks, crypto, certificates, premium memberships, wine/spirits | fast |
| Field guide / almanac | useful, folksy wisdom, practical, seasonal | gardening, outdoors, weather, food/seasonal produce, birding, slow-living | fast |
| Grid-breaking experimental typography | avant-garde, critical, art-school, "we read theory" | art schools, studios, music labels, experimental publications, cultural festivals | fast to medium |
| Halftone / duotone | punchy, graphic, music-poster energy; dithering signals low-tech honesty | music, campaigns, event series, sustainability/low-tech publications | fast |
| Hand-lettering & sign-painting | human hand, local trade, warmth, character | cafés, barbers, breweries, markets, illustrators, local shops | fast |
| Instruction manual (IKEA / Braun / TE) | clarity, honesty, product you can understand and repair | hardware, flat-pack furniture, onboarding, documentation, tools | fast |
| Japanese graphic poster | restraint, precision, cultural poise | design galleries, craft retailers, Japanese brands, architecture, tea/food | medium |
| Letterpress | craft, permanence, slowness, care | stationers, wedding/invitation, print studios, heritage drinks, book arts | medium |
| Luxury typography | exclusivity, craft, price | fashion, hospitality, jewellery, premium real estate, high-end food | fast to medium |
| Map / cartographic | exploration, place, data with territory, discovery | travel, outdoor, real estate, journalism, logistics, civic data | medium |
| Mega-type / typographic poster | confidence, attitude, "poster on the wall" | agencies, festivals, fashion drops, campaigns, launches | fast |
| Menu card / bistro chalkboard | confidence in the food, tradition, no marketing noise | restaurants, bars, bakeries, wine merchants, pricing pages in a hospitality voice | fast |
| Mid-century travel poster | escape, optimism, place pride, collectability | tourism boards, national parks, travel, hotels, regional products, events | medium |
| Museum / white-cube gallery | curatorial authority, neutrality, letting the work speak | museums, galleries, artist estates, collections, architects | medium |
| Playbill / wood-type poster (circus, theatre) | spectacle, live event, come tonight | theatres, music venues, circuses, festivals, markets | fast to medium |
| Punk / DIY zine | anti-corporate, urgent, participatory, scene-made | music scenes, activism, independent publishing, skate/streetwear, community events | medium |
| Receipt / ticket | transactional honesty, data-as-souvenir, playful "proof" | year-in-review/wrapped features, event tickets, checkouts, pricing, invoicing tools | fast |
| Risograph | independent, small-run, affordable, cheerful, maker-led | indie publishers, print shops, festivals, bookshops, zines, community orgs, kids' culture | fast |
| Scrapbook | personal, memory, craft, warmth | journaling apps, travel, family products, makers, small food brands | medium |
| Stamps, seals & ephemera | journeys, authenticity, collectability, "official but personal" | travel, postal/logistics, membership clubs, archives, wedding, heritage | fast |
| Technical drafting | precision, engineering, "we measured" | developer tools, data and analytics, infrastructure, B2B technical products | fast |
| Type specimen / foundry | expertise, precision, cultural seriousness | foundries, design studios, typographers, brand-guidelines sites, publishers | medium |
| Typewriter / manuscript | authorship, draft-in-progress, honesty, literary or investigative | writers, screenwriting, journalism, archives, film, letters | fast |
| Variable-font expressive type | inventive, technical, alive, type-literate | foundries, design events, creative tech, music, editorial features | medium |
| Vintage packaging / label | heritage-with-a-wink, quality ingredients, giftable | DTC food and drink, pantry goods, cosmetics, candles | medium |
| Woodcut / linocut | earthy, handmade, rooted, a little folkloric | breweries, coffee roasters, farms, bakeries, folk music, outdoor brands | fast |

### Cultural and lifestyle — `identities/cultural.md` (38)

| Identity | Says | Fits | Load |
|---|---|---|---|
| Afrofuturism | Black futures, sovereignty, imagination grounded in history | Black-led culture, music, fashion, film, education, museums, speculative-tech campaigns | medium to high |
| Anime official site | event, fandom, IP universe, high production | anime and manga, games, light novels, character IP, Japanese entertainment | medium to high |
| Art-school indie (zine and riso) | experimental, community-made, anti-corporate, curatorial | galleries, small presses, bookfairs, artist-run spaces, student shows, indie labels | fast |
| Barbiecore | maximal femininity as power, camp, fun | toys, fashion capsules, events, beauty collabs, campaigns with deliberate camp | medium |
| Biophilic organic | living, restorative, calm, healthy | plant retail, wellness, landscape architecture, sustainable building, food | fast to medium |
| Bohemian | free, natural, travelled, artisanal | travel, interiors, lifestyle, natural products, retreats | medium |
| Brazilian tropical modernism | sun, optimism, modernist confidence, sensual nature | fashion, swimwear, architecture, music, cultural foundations, hospitality | medium |
| Celtic and insular | ancient continuity, myth, landscape, craft | Irish, Scottish, Welsh and Breton cultural institutions, music festivals, whiskey, heritage tourism | fast |
| Chinese traditional (shan-shui and ink) | cultivated heritage, literati refinement, continuity | museums, tea, porcelain, luxury craft, cultural festivals, calligraphy schools | medium |
| Clean-girl beauty minimal | effortless, skin-first, approachable aspiration, Gen-Z wellness | skincare, cosmetics, wellness supplements, haircare | fast to medium |
| Club and rave flyer | energy, nightlife, community, underground credibility | festivals, clubs, promoters, DJs, labels, nightlife media | medium to high |
| Coquette and balletcore | romantic, girlish, playful femininity, sometimes ironic | lingerie, dresses, accessories, beauty, bakeries, Gen-Z fashion drops | fast to medium |
| Cottagecore | pastoral escape, handmade comfort, softness, seasonal living | slow fashion, bakeries, florists, farm shops, craft courses, cosy games | medium |
| Dark academia | erudition, melancholy, ritual, literary seriousness | publishers, bookshops, classical music, universities' literary arms, games, journals, stationery | medium |
| Desert modern and Southwest | spaciousness, retreat, stillness, creative pilgrimage | desert hotels, retreats, wellness, festivals, land-art institutions, ceramics | medium to high |
| Gorpcore and outdoor technical | competence, performance, nature as technical terrain, urban-outdoor cool | outdoor gear, trail running, technical apparel, expedition travel, field-research organisations | medium |
| Gothic and dark romantic | darkness as beauty, rebellion, mysticism, the alternative scene | alt fashion, metal and darkwave music, tattoo studios, horror publishing, occult goods | medium |
| Hip-hop and mixtape | swagger, hustle, culture authority, nostalgia | music artists, hip-hop media, sneaker culture, urban apparel | medium |
| Islamic geometric and Arabic calligraphic | order, heritage, contemplative craft, the scholarship of Islamic art | museums, cultural centres, Gulf and MENA institutions, Arabic publishing, heritage hospitality | fast to medium |
| Japanese quiet craft (Muji / mingei) | restraint, provenance, seasonal attention, craftsmanship over brand noise | tea, ceramics, confectionery, ryokan, kitchenware, stationery, slow-living brands | medium |
| K-pop comeback microsite | event, fandom, concept narrative, polished idol world | music launches, fandom communities, entertainment IPs, campaign microsites | high |
| Kawaii | cute, friendly, comforting, collectable | character IP, stationery, toys, snacks, cosy games, consumer apps for young audiences | medium |
| Korean soft minimal | cool, gallery-adjacent, sensorial, Seoul concept-store luxury | fragrance, skincare, eyewear, concept retail, cafés, galleries | medium to high |
| Mediterranean summer (dolce vita) | leisure, warmth, conviviality, slow pleasure | aperitifs, non-alcoholic spirits, hotels, swimwear, restaurants, olive oil, travel | medium |
| Mexican folk colour (Otomí, papel picado, Barragán) | vitality, craft, heritage, celebration | Mexican-owned food and drink, artisan cooperatives, cultural institutions, fashion working with makers | medium |
| Nautical and coastal | clean, sporting, seaside heritage, preppy leisure | swimwear, sailing, seafood, coastal hotels, knitwear | fast |
| Nordic print modernism (Marimekko / Josef Frank) | joyful, design-literate, mid-century optimism, craft through print | textiles, homeware, children's goods, cultural institutions, seasonal campaigns | fast |
| Nordic soft minimal | democratic good taste, calm domesticity, things built to last | furniture, homeware, lighting, design-led D2C, architecture studios, hotels | fast to medium |
| Old money and prep (Ivy) | inherited ease, understated status, tradition | menswear, tennis and country apparel, private members' clubs, estates, spirits | medium |
| Palm Springs poolside (retro resort) | leisure, glamour, irony-tinged nostalgia, summer | hotels, swimwear, cocktails, playlists, summer pop-ups | medium |
| Skate culture | irreverence, crew loyalty, DIY, authenticity over polish | skate brands, independent apparel, music labels, youth media | medium to high |
| Solarpunk and low-tech web | hopeful sustainability, commons, degrowth, care | climate organisations, co-ops, permaculture, civic tech, community energy, sustainable publishing | fast |
| South Asian heritage craft (block-print, khadi) | heirloom craft, provenance, festive luxury, slow fashion | textiles, homeware, Ayurveda/wellness, wedding, craft marketplaces | medium |
| South Asian kitsch maximal (truck art / Bollywood) | exuberance, street pride, humour, nostalgia, abundance | street food, chai brands, gifting, festivals, music, diaspora brands | medium |
| Streetwear drop | hype, scarcity, insider belonging | limited-run apparel, sneakers, collabs, music merch | fast |
| Tropical tiki | escapism, kitsch fun, rum cocktail culture | cocktail bars, rum, summer events, retro games | medium |
| Wabi-sabi | calm, impermanence, honesty of material | ceramics, tea, craft, mindfulness, architecture | fast to medium |
| Western and Americana heritage | durability, frontier self-reliance, craft, heritage | boots, workwear, whiskey, outdoor, BBQ, ranch hospitality, country music | medium |

### Industry archetypes — `identities/industry.md` (40)

| Identity | Says | Fits | Load |
|---|---|---|---|
| Academic / research lab | rigour, openness, ideas over branding | labs, research institutes, technical essays, think tanks | fast |
| AI lab | serious stewards of powerful technology; human, not sci-fi | model labs, AI research orgs, safety/policy | fast |
| Architecture studio | rigour, spatial thinking, built work | architecture firms, landscape, urbanism, engineering studios | medium |
| Automotive / EV launch | engineered future, calm confidence, design object | EVs, mobility, premium hardware | high |
| Bakery / food shop | made today, by people, nearby; worth a detour | bakeries, patisseries, delis, grocers, cafés that bake, food producers with a shop | medium |
| Beauty / skincare | ritual, efficacy, taste | skincare, fragrance, cosmetics, wellness retail | medium |
| Climate tech | measurable, credible, optimistic climate action | carbon accounting, removal, energy, ag-tech | medium |
| Coffee roaster | craft, traceability, connoisseurship | roasters, cafés, specialty tea, chocolate | fast |
| Craft beer / wine | craft, character, collectability | breweries, wineries, distilleries, natural wine bars | medium |
| Creative agency showcase | we can build anything you imagine; craft as spectacle | digital agencies, studios, creative technologists | high |
| Crypto / web3 | frontier tech; or crypto made friendly and consumer | wallets, protocols, exchanges, on-chain apps | medium |
| Dark product precision | fast, serious, built by craftspeople | software tools and platforms | fast to medium |
| Designer portfolio | taste and craft demonstrated, not claimed | product/interaction designers, design engineers | fast |
| Developer docs | precise, complete, respects your time | APIs, SDKs, platforms, dev tools | fast |
| DTC challenger brand playful | we know this category is ridiculous; we are in on it | food & drink, household goods, CPG disruptors | medium |
| Education / course creator | transformation through learning; credible teachers | online courses, bootcamps, ed-tech, cohort programmes | medium |
| Fashion e-commerce experimental | culture-literate, avant-garde, retail as content | streetwear, avant-garde labels, concept stores, drops | medium |
| Fintech trust | competent, regulated, engineered — your money is handled by adults who also ship good software | payments, banking-as-a-service, spend management, treasury, B2B infra | medium |
| Furniture / interiors | considered living, design as everyday | furniture, homeware, lighting, design retail | medium |
| Gaming launch / game studio | enter this world; this is an event | game launches, studios, esports, interactive entertainment | high |
| Government / civic | this is the official, accessible, unshowy way to get a thing done | public services, civic tech, utilities, internal tools, accessibility-first products | fast |
| Hardware product | engineered object with character; tools for makers | consumer electronics, synths, cameras, keyboards | medium |
| Health clinical calm | safe, accessible, medically serious yet humane | primary care, insurers, clinics, mental health providers, health systems | fast |
| Hotel / boutique travel | a world you want to be in; the stay as identity | hotels, resorts, travel operators, members' clubs | high |
| Indie hacker / solo dev | one human built this, it works, it's honest about numbers | solo SaaS, micro-tools, directories, build-in-public products | fast |
| Kids / family | safe, joyful, made for children but approved by parents | toys, kids' apps, learning products, family services | medium |
| Legal / professional services | institutional gravitas, discretion, counsel | law firms, legal tech, consultancies, wealth advisors | fast |
| Luxury fashion house | we do not need to persuade you; the image is the argument | fashion houses, jewellery, perfume, high-end galleries | high |
| Music festival / events | energy, scene, this year's edition | festivals, conferences with culture, club nights | medium |
| Neobank playful | banking without the bank — fast, social, on your side, slightly cheeky | consumer finance apps, P2P payments, Gen Z products, budgeting | medium |
| Nonprofit / documentary / impact | urgency, transparency, human stakes | charities, NGOs, campaigns, investigative/data journalism | high |
| Open-source project | community-owned, technical, opinionated | libraries, frameworks, databases, CLIs | fast |
| Pet brand | pets are family; we care like you do | pet food, accessories, vets, insurance | medium |
| Photographer portfolio | the work speaks; book-like sequencing | photographers, artists, illustrators | high |
| Publishing / newsletter | thinking you pay for; the writer as brand | newsletters, essay sites, independent media | fast |
| Real estate / property | taste-led property; homes as design objects, not inventory | design-led estate agents, developers, co-ownership, residential launches | medium |
| Record label / musician | curation, catalogue, scene | labels, artists, radio, music shops | medium |
| Restaurant / hospitality | atmosphere, taste, the night out | restaurants, bars, cafés, food halls | medium |
| Sports & performance | effort, speed, identity through performance | athletic apparel, fitness apps, wearables, clubs, events | high |
| Telehealth / DTC wellness | discreet, modern self-care; prescription made consumer-grade | telehealth, supplements, diagnostics subscriptions, sexual health, hair loss | medium |

---

## Combining

Identities combine along **grammar lines**, not as a mood blend: one
supplies the type, another the composition, a third the motion. Name which
does which in the identity brief (`identity.md` §8). Two identities that
both claim the same group (two display systems, two surface treatments) do
not combine; pick one.

## Keeping the library honest

Add an identity only with: a grammar, a fit and misfit, a trap, a loading
tier, at least one **live site that ships it**, and search leads. It goes in
the right family file, in alphabetical order, and gets a row in the index
above. A style name with no grammar and no example is a mood word, and mood
words are what generic pages are built from.

When a Seen-at site has been redesigned away from its identity, replace the
link; do not leave it pointing at evidence that no longer exists.
