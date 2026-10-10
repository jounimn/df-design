# Watermark

A protective watermark for authors who sell the work. It lets the author
show previews to a client without distribution risk, and keeps a clean copy
for delivery after payment.

It is **optional and the author decides**. It is asked once, in the first
message, on both paths.

This is the author's own mark over their own work. It is not the
third-party watermark that `images.md` forbids (see §6).

---

## 1. Ask, in the first message

Ask it with the path and mode questions (`SKILL.md`), in plain words:

> Will this work be sold to a client? If you like, I can put a watermark on
> everything I show you — a text pattern, or your image/logo with a text
> pattern — repeated across the whole screen at low opacity, and keep a
> clean copy separately for delivery after payment.

- **No, or no answer:** record `watermark=none`. The question does not
  block the start. Do not offer it again.
- **Yes:** ask for the text (default: the author's studio or name). For the
  image variant, ask for the file, or for permission to use the author's
  logo.
- **Already answered:** a step 0 note that settles it ("I'm selling this to
  a client, watermark it") settles it. Skip the question.

Record the answer in the status line:

`watermark=<none|text:"…"|image+text:"…">`

An answer of no stands for the run. Do not ask again at the next stage.

---

## 2. The two types

| Type | What the author sees | Spec passed to the scripts |
|---|---|---|
| **Text** | The text repeated diagonally (−30°) across the whole viewport | `text:Studio X` |
| **Image + text** | The text pattern underneath, the image repeated on top | `image+text:path/logo.svg\|Studio X` |

Append `@0.1` to set the opacity: `text:Studio X@0.1`.

| Property | Value |
|---|---|
| Opacity | 0.08–0.15. Default **0.12**. Outside the range is an error |
| Tiling | A 360×240 SVG tile as a background, covering the full page height |
| Layer | One isolated element: `position: fixed`, `inset: 0`, `pointer-events: none`, `z-index: 2147483647` |
| Escaping | Text is XML-escaped in the SVG. `&`, `<`, quotes and accents are safe: "Miolo & Filhos — São Paulo" |

The layer never blocks a click, a scroll or a selection. The author uses
the page normally.

Do not raise the opacity above 0.15 to make the mark "safer". A mark that
hides the design stops being a preview.

---

## 3. Scope: everything shown

The watermark covers **everything shown to the author while the run
lasts**. Not just the final presentation.

| What is shown | How the layer gets in |
|---|---|
| HTML auditions | `node scripts/watermark.mjs <src-dir> <spec> <out-dir>` copies the directory and injects the layer into every `.html`. Show the author the copy |
| Built-surface previews | The same command, on the built surface's directory |
| `selling-positioning` output | `node scripts/export-presentation.mjs <presentation-dir> <spec\|none>` writes `preview/` (with the layer) and `final/` (clean) |

Image files are embedded in the layer as data URIs. Nothing else in the
copy changes.

---

## 4. Preview and final

- **`preview/`** is watermarked. It is what the author shows the client.
- **`final/`** is the same files without the layer. It is what the author
  delivers after payment.
- With `watermark=none`, only `final/` is produced.
- When both exist, they hold the same file set. The checker confirms it
  (`check-presentation.mjs`).

For auditions and built surfaces, the watermarked copy is the one shown.
The clean source is the working directory itself.

---

## 5. The author's project files are never watermarked in place

The script copies. It never edits the source.

- The project files, the auditions and the build stay clean.
- The layer is injected into a **copy**, and the copy is what is shown.
- If a watermark landed on a source file by mistake, restore it before doing
  anything else: `git checkout -- <file>`, or copy the original back. With
  no original, strip the block (it returns the HTML byte for byte):

  ```bash
  node -e "import('./scripts/lib/watermark.mjs').then(async m=>{const fs=await import('node:fs');const f=process.argv[1];fs.writeFileSync(f,m.stripWatermark(fs.readFileSync(f,'utf8')))})" <file>
  ```

A watermark in the shipped files would be delivered to the paying client.
That defeats the purpose.

---

## 6. Not the `images.md` rule

| | `images.md` rule 4 | This watermark |
|---|---|---|
| Whose mark | A third party's (the stock site, the photographer) | The author's own |
| On what | The stock image file that ships | The author's own work, on a copy |
| Why | A licence problem: the image is not free to use | A commercial protection before payment |
| Ships to the client | Never | Never. Only in `preview/` and shown copies |

Both statements hold at once. A stock image with a third-party watermark
still fails. The author's layer over the page does not make it pass, and a
passing image does not make the layer wrong.

---

## 7. Check it

- The layer is in every watermarked HTML and in none of `final/`.
- Look at a capture of the preview: the mark is visible, covers the page and
  does not hide the content.
- Look at `final/`: no mark anywhere.

Report what the look showed.

---

## Red flags

| Thought | Reality |
|---|---|
| "It says no watermark, so I can't add one" | `images.md` forbids a third party's mark in the images that ship. The author's protective layer is a different thing. |
| "I'll watermark the source files" | Never in place. Inject into a copy; the project files stay clean. |
| "They said no last time, so I'll ask again" | The answer stands for the run. Ask once, in the first message. |
| "The note already said it, but I'll ask anyway" | A step 0 note that settles it settles it. Skip the question. |
| "A higher opacity is safer" | Past 0.15 the mark hides the design. Stay within 0.08–0.15. |
| "The audition isn't the real work, so no mark" | Scope is everything shown: auditions, previews, all output. |
| "I'll skip `final/`, the preview is enough" | The author needs a clean copy for delivery after payment. |
