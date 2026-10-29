# Anatomy: what a page is built around, by the visitor's job

Read when writing a surface spec (`SKILL.md`, "One surface at a time") and
again when judging the finished page against the stock anatomy
(`gates.md` §5). The job the visitor comes to do sets where the action
lives, which sections are the category's own, and how the page ends. The
identity dresses this anatomy; it never replaces it.

Adapted from Hallmark's `anatomy.md` (github.com/nutlope/hallmark, MIT),
which drew it from the homepages of about fifty real independent sites
across these jobs. The pattern every generator slips into (text beside a
picture, a figure row, three steps, an email band) is how software pages
look, and almost nothing else.

**Name the job in the surface spec** in one word from the list below, and
build the section list from its anatomy before choosing compositions
(`recipes-design.md` §3, §6). Where the brief names a job this list lacks,
write its anatomy the same way: the action, the category's own sections,
the close.

**When the brief gives none of a section's content,** build it as a sample
the author replaces, marked in the handoff: an example issue with its parts,
dishes typical of the cuisine, three candles named plainly, track titles as
placeholders. A sample shows the shape of the real thing; it never states a
fact a visitor could take as true (a price, a date, a person's name, a
count, a review). A section whose whole content would be facts nobody gave
(a lineup, a tour) is one line and a text slot, or it waits. Practical facts
the job wants and the brief lacks (hours, an address, dates) take the page's
two missing-fact slots (`patterns.md`, "A fact the author did not give"):
slot the two a visitor needs to act, and ask for the rest in the first
message (`SKILL.md`, "what the build needs that the brief did not say").

Every job: the nav carries the job's own action word (Book, Tickets, Shop,
Listen, Start free), the hero shows the thing itself (the room, the cover,
the dates, the screen), and proof comes in the category's own form, never a
generic band of numbers.

---

## subscribe (a newsletter, a waitlist, a podcast)

- **Action:** in the hero, and often it is the hero: the name, one line, the
  email field. A podcast puts the latest episode with its play control under
  it.
- **Sections:** a sample issue or the latest one, set as it arrives; who
  writes it; the archive as an index of issues or episodes with dates; the
  reader count only if given, set like a circulation figure under the
  masthead.
- **Ends:** a second field under the archive, or the archive itself. The one
  job whose close may be an email field.

## book (a restaurant, a class, a clinic, a studio)

- **Action:** a booking picker (party, date, time) opened from the nav and
  the hero, or the next free times as buttons; repeated beside the menu or
  the classes, never only at the foot.
- **Sections:** the room or the food as a photograph with little or no head;
  the menu (a switcher by lunch and dinner, or rows with prices); for classes
  the timetable as a schedule; how to find it; hours and address as a section
  of their own.
- **Ends:** hours, address and the booking again. A fine room may have
  almost nothing: one photograph, the menu, the booking.

## visit (a shop, a gallery, a venue, a place)

- **Action:** today's hours and the address, in the nav or the hero; tickets
  or donate only if the brief has them.
- **Sections:** what is on now as the lead picture; what is coming as dated
  rows (an index or a schedule, a this-week and next-week switch); for a
  shop, the shelves (a rail or a grid of the brief's own things); getting
  there.
- **Ends:** visit information and the address, or the mailing list for what
  is on next.

## attend (an event, a festival, a race, a conference)

- **Action:** tickets in the nav from the first screen; the date and the
  place are the headline.
- **Sections:** the lineup or the speakers (an index or a dense grid, the
  names set large); the days as a schedule; ticket tiers with prices; the
  venue and travel; questions. Figures (stages, acts, miles) only when the
  brief gives them.
- **Ends:** tickets again, the questions, or the mailing list for the next
  edition. Between editions the whole page is the date, the place and the
  list.

## buy (a physical product, a small shop)

- **Action:** the product with its price and options (an offer), often as
  the hero; a buy action after the sections that earn it, or a sticky bar
  with the price.
- **Sections:** the range as tiles or a rail with prices; the product in
  use, close; how it is made; delivery and the guarantee as plain facts;
  reviews only if given.
- **Ends:** the offer again, new arrivals, or the guarantee. An email field
  belongs in the footer, not as the close.

## try (an app, a game, a desktop tool)

- **Action:** the store or download buttons right under the head, one per
  platform the brief names.
- **Sections:** the key art, trailer or main screen captured from the
  product (`scripts/capture.mjs`); features as named moments shown in
  screens (a pinned run or a switcher), not icon tiles; a before and after
  where the product changes something; platforms.
- **Ends:** the download again beside one last screen. Games are short: five
  or six blocks is a full page.

## sign up (software, an API, a developer tool)

- **Action:** start free in the nav and the hero with its terms in one line
  under it; for a developer tool the install command may be the action.
- **Sections:** the product at work (captured, or built as a sample when it
  cannot be captured); what it does as named moments; a code sample or the
  integration; the pricing table with its period switch; questions.
- **Ends:** the hero's action again in a short band, or the code sample.
  Never a newsletter. This is the niche `benchmarks.md` measured: the
  median page runs 8 to 16 bands because it has that much to explain.

## hire (a studio, a freelancer, an architect)

- **Action:** a plain contact (an email, a phone, "Talk to us") in the nav
  and once more after the work; no form needed.
- **Sections:** the work as the page: a list or index of projects (name,
  client, year, place) with pictures, one opened as a case; what the studio
  does as a short list; where it is.
- **Ends:** contact details, per office if there are several.

## join (a club, a community, a membership)

- **Action:** join or "your first visit" in the hero.
- **Sections:** what a session is like, shown; when and where as a schedule
  or a list of places; membership options as rows with prices; first-visit
  guidance; people in the brief's own pictures only.
- **Ends:** the first visit, the membership options, or a sign-up field.

## listen (a band, a film, a podcast, a publication)

- **Action:** the new release or current issue with its listen, watch or
  order buttons side by side.
- **Sections:** the record, film or issue (its cover, its tracks or contents
  as an index); dates (tour, screenings) as rows with ticket links; earlier
  work as covers in a rail or grid; videos.
- **Ends:** the dates, more of the catalogue, or the mailing list. Artist
  pages can be very short: one picture, the release, the dates. With no
  release in the brief, the act leads instead (the players, how it sounds
  described plainly, where it plays) and the page's job is booking them: the
  close is the enquiry.

## work in (a dashboard, an admin, a tool)

Not a landing page: a screen someone works in, where the bar is earned
familiarity and the marketing anatomy steps aside. The identity lends its
palette, faces, radius and surfaces, never a hero or a section rhythm.
Density is the design: controls 32 to 40px with a 44px hit target, tables
before cards, one container recipe. Every region that loads data has four
states (loading, empty, error, full). State lives in the URL (filters, tabs,
pagination); a destructive action is undone or confirmed. The signature is
still owed: the one object this tool is known by (the ledger, the timeline,
the queue), never a greeting above four stat cards. `identity.md` §9 has
the per-surface expression; `check-slop --scope app` skips the landing-page
gates.

---

## How pages end

In the order real sites use them: the hero's action again in a short band;
practical details (hours, address, contacts); more of the catalogue (the
archive, new arrivals, more work); a short trust tail (a guarantee, press,
awards the brief gives); a mailing list, for things that recur (issues,
editions, releases, events). The last is one close in five, never the
default (`gates.md`, stock close).
