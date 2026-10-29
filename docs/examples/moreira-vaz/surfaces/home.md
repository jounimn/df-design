# Surface: home (Moreira & Vaz)

Status: proceeding on stated assumptions (the author is absent; who, device and flows are read from README.md and the existing folder, 2026-10-29).

**Who.** A worker in or near Lisbon who has just been dismissed, not paid, harassed at work or moved to another shift, and a relative or friend searching on their behalf. Often reading within hours of the event. Not a company, never an HR department: the page must make that clear in the first line so the wrong visitor leaves and the right one stays.

**Device.** A phone first (390 wide, one hand, at arm's length), then a laptop at home or on a break. Text at 19px desktop and 18px phone; every control at 44px or more; the index entries are the biggest tap targets on the page.

**Job.** `hire` (`anatomy.md`). The visitor comes to get this firm to take their case. Action: "Conte-nos o seu caso" in the nav and once more after the work, as the intake form at the foot of the page. The phone is the second way in and sits beside the action in the hero and in the footer (its number is a fact the brief did not give: a slot, not an invented number). The work, for a law firm on the workers' side, is the rights themselves: the situation index in the hero, one handbook entry opened as a case, the deadlines table. The page ends on contact details, per office (one office).

**Content and flows.**
1. Nav: wordmark with "Advogados do trabalho, Lisboa" under it; the action "Conte-nos o seu caso" (to the form); the phone slot. No language switch (EN is on the Later list).
2. Hero: "Defendemos trabalhadores. Nunca empresas." and a two-line lede; beside it the signature, the situation index: "O que lhe aconteceu?" with four entries ("Fui despedido(a)", "Não me pagaram", "Estou a ser assediado(a) no trabalho", "Mudaram-me o horário"), each with its sample deadline and article in the margin column, each linking to the part of this page that answers it. A note under the index says the deadlines are samples to confirm.
3. Quem somos: the one approved photograph (calçada at the Rossio, duotone) with a caption that is a fact; the stance in two paragraphs; three facts from the brief (12 lawyers, 0 companies, Lisbon with the address slot).
4. One entry of the handbook, opened: "Fui despedido(a)" as a sample entry ("verbete de exemplo"), with "O que a lei diz", "O que fazer hoje" and "Prazo" in the handbook's ruled layout with marginal article references. Shows what the rights guide (next surface) will be, without building it.
5. Prazos: the deadlines table (situation, deadline, law, what to do now), captioned as samples to confirm against the Código do Trabalho; stacks to entries at 640.
6. Como funciona: four steps as a real `<ol>` (tell us, we answer in two working days, first consultation priced beforehand, we decide together); README copy.
7. Conte-nos o seu caso: the intake form in gov.uk's pattern (labels above, one hint line, error summary at the top on submit, inline errors with the warning icon), posting nowhere yet: `data-endpoint=""`, validated by about 1 KB of script, and it says plainly that nothing was sent. Submit: "Enviar o meu caso". Error copy: "Escreva o que aconteceu, mesmo em poucas palavras". Confidentiality line beside it. Without script the form is a plain form with no success state.
8. Footer: wordmark, address slot with the map pin, the Ordem dos Advogados line without a number, Livro de Reclamações (external, real URL), a link to the confidentiality line.

**Density.** Handbook density: ruled rows, a 15rem margin column, 60 to 66ch text, generous band padding (96px desktop, 64px phone) so the rows read as entries and not as a wall (the identity's trap).

**How it carries the identity.** The index and the table are the handbook's own devices: 2px ink rule at the top, 1px rules between entries, serif entries, mono deadlines and articles in the margin. Paper and white bands alternate so each chapter changes ground. Bottle green is spent on the links, the one filled button and the step numerals, nowhere else. No gavel, no navy, no card.

**Gates to watch.** fold at 1280x800 (h1 and the first index entries visible); measure under 90ch everywhere; focus rings on every control; the form never prints success; two missing-fact slots at most (phone, address); every deadline marked as a sample; `numbered-markers` only on the real sequence (Como funciona); mono only on data.

## Later

- Guide surface ("Os seus direitos no trabalho"): one page per situation in the handbook grammar, the index as its contents page; the home's sample entry becomes the real first entry once the firm supplies the text.
- Intake form page: the same form on its own page with the gov.uk error summary, a file field for the dismissal letter, and the endpoint once it exists.
- 404: "Verbete não encontrado", the handbook's index as the way back.
- EN version and language switch (immigrant workers in Lisbon), only if the author wants it.
- The author's phone number, street address and Ordem dos Advogados registration number, to fill the two slots and the footer line.
- Confirm every deadline and article against the Código do Trabalho and Lei 98/2009 before publishing.
