# The reviews, in fresh context

The thread that built the page is its weakest reviewer: it knows why every
decision was made and forgives all of them. Two reviews run with no
inherited transcript (a subagent in Claude Code; in a harness without
subagents, a cold re-read with the prompt in hand, recorded as `in-thread`).
The **hero review** once the nav and hero are built and nothing below them
exists; the **finish review** after the build, before the verification gate
calls the surface done.

Adapted from Hallmark's `review-hero.md` and `review-finish.md`
(github.com/nutlope/hallmark, MIT).

**How to run one.** Do not read the reviewer's prompt yourself. Start the
reviewer with *Read `references/reviews.md` §1 (or §2) and follow it*, and
pass the inputs it lists: files as paths, lines as quoted text. Run it in
the foreground, since the build waits on its first word. Act on that word.
`recapture` means the screenshots were wrong (a fallback face, a blank
frame): retake them and start again; it does not use up the round. Otherwise
fix what is real, recapture the same shots with `check-slop --render`, and
score each finding yourself against its recapture: `resolved`, `partial` or
`unresolved`, with a reason. Send the recaptures back for one scoring round
only when the first word was `rebuild` or a finding named a Floor gate;
scoring is not a second review. Record the outcome in the surface ledger
(`identity.md` §8): `hero-review: fix · 4 findings · 4 resolved`, then
`finish-review: subagent · 5 findings · 4 resolved 1 unresolved · gap: none`.

Verification is budgeted: one batched inspection, one fix batch, at most one
confirming round; each review adds one fix batch and its recapture.

---

## 1. Hero review

You are reviewing the first screen of a page that is still being built. You
did not build it and will not be told why anything is the way it is. Your
inputs, and nothing else: the `fold-1280.png` and `hero-1440.png`
screenshots `check-slop --render` wrote, the identity brief's `Intent:` and
`Grammar:` lines, the surface spec's job and content lines, and any
reference image the brief names as `IDENTITY`. Batch your reads; stop
reading by the tenth turn and write.

First line: `ship` or `fix`.

Then at most five findings, one line each, worst first. Ask:

- Does the headline say something only this product could say, in seven
  words or fewer? Would it pass unchanged on a competitor's page?
- Is the content centred in the screen, or does it stop early over a band of
  nothing? Is the visual beside the text a real picture (the author's, an
  approved photograph, the product captured), and does it hold its half of
  the screen at 60% of its height or more? Where the identity puts no image
  in the fold, the type is the visual: does it fill the screen? At 1920 the
  container holds its 1440 size by rule, so extra air there is not a finding.
- Does anything read as a template: a centred stack, a pill or a label above
  the headline, a gradient blob, an empty coloured box where a picture should
  be, a drawn illustration, a row of counting marks, two filled buttons side
  by side? A filled primary beside a quiet action that goes somewhere else is
  the control pair, and a sample of the product built in a slot is the
  product; neither is a finding.
- Is the page's signature, its strongest real thing, on this screen? Delete
  the picture in your head: if the screen still says the same thing, the
  picture is too weak or too small.
- Does the type carry the identity at this size? Is the display face the one
  the grammar names, loaded, not a fallback?
- Would you expect a model to make this first screen for this brief? If so,
  say what gives it away.

On a redesign the page's content is fixed and what sits below the first
screen is the old page, not yet rebuilt: neither is a finding. Never ask for
copy, an action or a visual the page does not have; say in one line what the
author could supply.

What the identity brief prescribes or refuses is not a finding. Do not fix
anything.

---

## 2. Finish review

You are reviewing a built surface against a fixed list. You did not build it
and will not be told why anything is the way it is. Read the page, not the
intent. Your inputs, and nothing else: the screenshots `check-slop --render`
wrote (the fold at 1280, the hero at 1440, the full page at 1440 and at
390), the page's HTML or component source, the identity brief, the surface
spec, the hero review's findings with how each was settled, and
`references/gates.md` §3 and §5. On a redesign you also get the `before`
screenshots. Look at the screenshots first; open the source only to quote
copy or to locate a finding; the script has already read the CSS. A pinned
pane shows once in a full-page shot: the column beside its later screens is
the pin, not an empty half. Batch your reads; stop reading by the tenth turn
and write.

First line: one of `recapture` (a screenshot is missing, blank or shows the
wrong thing; list what to recapture and stop), `rebuild` (the first
viewport fails the identity wholesale), `fix` (findings follow), `ship`
(nothing owed).

Then the findings, ranked by cost to the page, at most eight, one line
each: the gate or the plain defect, where it is, what you would do. Not
findings: a direction you would not have chosen; what the brief prescribes
or refuses; an element the hero review settled, unless you name a new
reason.

Scroll the 1440 full page one screen at a time before ranking: a screen
with nothing big enough to be its reason (a head and a line adrift, a
narrow column beside an empty half, a section head under 40px, an empty
coloured box or a drawn illustration where a photograph or the product
should be, a row of counting marks) outranks every detail finding
(`gates.md` §5, "A full page"). Then the copy: name any head that would pass
unchanged on a competitor's page.

Then one answer to the question no gate can: does the identity brief
describe the page in front of you? Name the largest gap, or say there is
none. Write two lines of your own from the screenshots first: what the page
is about, and the one thing a visitor would remember. Three findings when
they fail. **Seen before:** the page, or a section, reads as a template or
a familiar site; name which and where. **Clean:** something is on the page
without a job (a device repeated, a decoration, a box around nothing), or a
screen has nothing worth looking at. **Carried:** the identity lives in the
hero and stops there.

On a redesign the content is fixed: never ask for copy, an action or a
visual the old page did not have. Add one answer: what did the old page do
better? Name anything a visitor could do, read or find before that is
harder now; if nothing, say so. On a polish you get only the full pages at
1440, before and after: the layout was kept on purpose, so ask one thing,
whether anything still reads as machine-made, in at most five findings.

On a screen someone works in (a dashboard, an admin) there is no hero, fold
or section rhythm to judge. Read the full screens at 1440 and 390 and ask
what someone fluent in the category would: is the hierarchy clear, is the
density even, does every control and table work on a phone, are the four
data states there.

Close with one line naming what must not be diluted while fixing. Do not
fix anything.
