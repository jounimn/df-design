# Surface: home (the landing page)

Status: spec approved on stated assumptions (author absent), built, verified. See `../identity.md` for the ledger.

## Who, on what

A neighbour or a regular, mostly on a phone in the evening after work, deciding whether to put a loaf aside for tomorrow; a few on a desktop at the office. First-time visitors arrive from the sheet in the shop window or from word of mouth, so the page has to say what Miolo bakes and how the pre-order works before asking for a name.

## Job

**buy** (`anatomy.md`): pre-order tomorrow's bread. The action is the product with its price and options, as the hero: tomorrow's bake, what is left, when it closes, and one button that goes to the order form. The buy action comes again after the sections that earn it, as the form itself. The page ends on the offer (the form) and the practical details (hours, address), never on a mailing list.

## Content and flows

- Masthead: the bulletin's nameplate, the sheet number and date (sample values), the job's action word in the nav ("Encomendar").
- Folha do dia (the hero): headline "O pão de amanhã encomenda-se hoje.", the cut-off and collection line, the order button, and the day's slip: three loaves with price, weight and what is left; the broa stamped ESGOTADA with when it returns.
- Três pães, mais nenhum (the "O pão" band, its head carrying the band's first fact after the finish review): how the bread is made (two short paragraphs), the three loaves described, and the three approved photographs (the only images on the page) with one duotone.
- A semana: which loaf bakes on which day, as a typed table of the six oven days (the broa only on Tuesdays and Thursdays); Monday, when the oven is off, is the footnote, so six day columns fit a phone.
- Como se encomenda: the four real steps as a numbered list (choose by 18h00, receive the order number, collect from 7h30, pay at the counter), the ticket and the PAGO stamp.
- Encomendar para amanhã: the order form. Quantity per loaf (the sold-out loaf disabled), name, telephone, a collection window, a note; the total computed in the browser; `data-endpoint=""`, so it validates, posts nowhere and says so. Beside it, collection and payment as plain facts, with the two missing-fact slots (payment methods, the shop's telephone).
- Colophon: what the bulletin is, where and when (address and hours as the README page has them), the faces and the icon set.

Sample values (to be replaced by the author, never read as facts): sheet n.º 214 and its date, the counts (12 of 40, 7), the prices, order n.º 0412, Rua de Cedofeita.

## Density

A typed sheet: one measure of 64ch for prose, generous band padding, the slip and the form denser (a list and a form are the bulletin's own objects). Six bands and the colophon; roughly 5,000px at 1440.

## How it carries the identity

The whole page is the duplicated sheet: paper ground, typed body, lettering-guide caps for every head, typed rules (hyphens and equals signs) where another page would draw a hairline, dotted leaders to the prices, the violet stamp only on counts, ESGOTADA and PAGO. The photographs are multiplied onto the paper in one duotone so they read as printed, not pasted. The form is typed too: 2px radii, ink borders, the same Courier, the ring in ink. Nothing moves.

## Chrome decisions

Nav: the nameplate, the issue line and one action, "Encomendar", which jumps to the form; no inline link row (a bulletin has no menu). Footer: a colophon in three columns (what, where, how it is set), the form of a printed sheet's last lines, not four link columns.

## Later

- Admin: today's orders as the bulletin's own ledger, on a counter tablet (its own spec, its own premises).
- 404: "Errata", in the same type and tokens.
- An English edition of the sheet, if the author wants one (the earlier PT/EN switch pointed at nothing and was dropped).
- Wiring the form to a real endpoint, and the order number issued by it.
- The live counts fed from the admin instead of the sample values.
