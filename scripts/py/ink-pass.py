# The ink pass: force a picture (a generated key panel, a render, a scan) into the identity's inks, deterministically.
# Driven by scripts/ink-pass.mjs, which finds a Python with numpy and Pillow and builds the argument list; run it
# through that CLI (references/drawn-assets.md §8). Every colour comes from the command line: nothing is hard-coded.
#
#   python -I ink-pass.py ink <src> <out-base> --ink #rrggbb --paper #rrggbb [--hint #rrggbb]
#                         [--map ink|paper|hint|hintlit] [--texture hatch|dots] [--width 1536[,1200...]]
#                         [--cell 6] [--strokelen 22] [--lo 0.18] [--hi 0.72] [--gamma 1.0]
#                         [--hint-mask auto|none|<mask.png>] [--hint-hue lo,hi] [--exclude x0,y0,x1,y1 ...]
#                         [--erase x0,y0,x1,y1 ...] [--figure <alpha.png>] [--seed 7] [--debug]
#   python -I ink-pass.py layers <inked.png> <out-dir> <name> --alpha <figure.png|ellipse|none> --fill #rrggbb
#                         [--grow 7] [--format webp|png]
#
# ink, in order:
#   1. upscale to each --width with Lanczos and an unsharp mask. Each width is inked on its own, so the marks stay
#      crisp: resampling a finished screentone or hatching would blur it;
#   2. the hint mask: by default the source's own colour near the hint's hue (saturated, not dark), cleaned, minus
#      the --exclude boxes and minus the figure (--figure, an alpha such as a cutout): the hint never lands on a figure;
#   3. tone = levels(luma, lo, hi, gamma): below lo is solid dark, above hi is solid light; --erase ellipses go dark;
#   4. the tones between become marks:
#        hatch - strokes that follow the form: their direction comes from the structure tensor of the smoothed image
#                (along the contours, across the gradient); a line-integral convolution of a seeded stroke noise along
#                that field makes the strokes, their coverage set by the tone, with a crossing layer for the darkest
#                tones. Where the image has no structure (open sky, fog, flat walls) a clustered-dot screentone stays;
#        dots  - a 45 degree clustered-dot screentone everywhere;
#      --cell (mark spacing) and --strokelen (half a stroke) are in px at 1536 wide and scale with the width;
#   5. the inks, by --map:
#        ink     - dark is ink, light is paper, light inside the hint mask is the hint;
#        paper   - the tones are inverted, so a light-line night drawing becomes ink line on paper; dark marks inside
#                  the hint mask are the hint;
#        hint    - inverted onto the hint as the whole ground (a set inside the hint's light), ink line on it;
#        hintlit - not inverted: dark stays ink, light becomes the hint (what the light reaches);
#      with hint and hintlit, light inside the figure is paper, never the hint.
# Writes <out-base>.png (one width) or <out-base>@<width>.png (several), plus <out-base>[@w].mask.png with --debug.
# The last line printed is JSON: one result per width (size, the share of each ink, hatched share, hint on figure).
import argparse, json, math, sys
import numpy as np
from PIL import Image, ImageFilter


def hexrgb(s):
    s = s.strip().lstrip('#')
    if len(s) != 6:
        raise SystemExit(json.dumps({'error': f'not a #rrggbb colour: {s}'}))
    return np.array([int(s[i:i + 2], 16) for i in (0, 2, 4)], np.uint8)


def hue_of(rgb):
    r, g, b = [v / 255 for v in rgb]
    mx, mn = max(r, g, b), min(r, g, b)
    if mx == mn:
        return 0.0
    d = mx - mn
    if mx == r:
        h = ((g - b) / d) % 6
    elif mx == g:
        h = (b - r) / d + 2
    else:
        h = (r - g) / d + 4
    return h * 60


def blur(x, r):
    # a separable Gaussian in numpy (Pillow cannot blur float images)
    r = max(0.5, float(r)); n = int(math.ceil(r * 3)); t = np.arange(-n, n + 1, dtype=np.float32)
    g = np.exp(-t * t / (2 * r * r)); g /= g.sum()
    x = x.astype(np.float32); p = np.pad(x, ((0, 0), (n, n)), mode='edge')
    x = sum(g[i] * p[:, i:i + x.shape[1]] for i in range(2 * n + 1))
    p = np.pad(x, ((n, n), (0, 0)), mode='edge')
    return sum(g[i] * p[i:i + x.shape[0], :] for i in range(2 * n + 1))


def alpha_of(path):
    # a cutout's alpha (RGBA, LA, PA), or a plain grey mask where white is the figure
    im = Image.open(path)
    if 'A' in im.getbands():
        return im.getchannel('A')
    if im.mode == 'P' and 'transparency' in im.info:
        return im.convert('RGBA').getchannel('A')
    return im.convert('L')


def boxes(values):
    out = []
    for b in values or []:
        v = [float(x) for x in b.split(',')]
        if len(v) != 4:
            raise SystemExit(json.dumps({'error': f'a box is x0,y0,x1,y1, not {b}'}))
        out.append(v)
    return out


def ink_one(a, src, W, cols):
    INK, PAPER, HINT = cols
    scale = W / src.width
    H = max(1, round(src.height * scale))
    k = W / 1536
    big = src.resize((W, H), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=max(0.5, 2.0 * k), percent=160, threshold=2))
    rgb = np.asarray(big).astype(np.float32) / 255.0

    # the hint mask
    mask = np.zeros((H, W), bool)
    if HINT is not None and a.hint_mask == 'auto':
        hsv = np.asarray(big.convert('HSV')).astype(np.float32)
        hue = hsv[..., 0] * 360 / 255; sat = hsv[..., 1] / 255; val = hsv[..., 2] / 255
        if a.hint_hue:
            lo, hi = [float(v) for v in a.hint_hue.split(',')]
        else:
            c = hue_of(HINT); lo, hi = c - 35, c + 35
        if lo < 0 or hi > 360:
            inhue = (hue >= lo % 360) | (hue <= hi % 360)
        else:
            inhue = (hue >= lo) & (hue <= hi)
        m = inhue & (sat > 0.38) & (val > 0.28)
        mi = Image.fromarray((m * 255).astype(np.uint8)).filter(ImageFilter.MedianFilter(5)).filter(ImageFilter.MaxFilter(3))
        mask = np.asarray(mi) > 127
    elif HINT is not None and a.hint_mask not in ('none', 'auto'):
        mask = np.asarray(Image.open(a.hint_mask).convert('L').resize((W, H), Image.NEAREST)) > 127
    for x0, y0, x1, y1 in boxes(a.exclude):
        mask[round(y0 * scale):round(y1 * scale), round(x0 * scale):round(x1 * scale)] = False
    figure = np.zeros((H, W), bool)
    if a.figure:
        fa = alpha_of(a.figure).resize((W, H), Image.LANCZOS)
        figure = np.asarray(fa) >= 64
        mask &= ~figure

    # tone
    luma = 0.2126 * rgb[..., 0] + 0.7152 * rgb[..., 1] + 0.0722 * rgb[..., 2]
    luma = np.where(mask, rgb.max(axis=2), luma)       # a saturated hint colour counts as light
    tone = np.clip((luma - a.lo) / max(1e-3, a.hi - a.lo), 0, 1) ** a.gamma
    yy0, xx0 = np.ogrid[0:H, 0:W]
    for x0, y0, x1, y1 in boxes(a.erase):
        x0, y0, x1, y1 = x0 * scale, y0 * scale, x1 * scale, y1 * scale
        e = ((xx0 - (x0 + x1) / 2) / max(1, (x1 - x0) / 2)) ** 2 + ((yy0 - (y0 + y1) / 2) / max(1, (y1 - y0) / 2)) ** 2 <= 1
        tone[e] = 0; mask[e] = False
    if a.map in ('paper', 'hint'):
        tone = 1 - tone                                   # light line on night becomes ink line on the light ground

    cell = max(1.0, a.cell * k)

    def dots(t):
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        c, s = math.cos(math.pi / 4), math.sin(math.pi / 4)
        u = (xx * c + yy * s) / cell; v = (-xx * s + yy * c) / cell
        fu = u - np.floor(u) - 0.5; fv = v - np.floor(v) - 0.5
        d = np.clip(np.sqrt(fu * fu + fv * fv) / math.sqrt(0.5), 0, 1) ** 1.5
        return ~((1 - t) > d)                             # True = light

    hatched = np.zeros((H, W), bool)
    if a.texture == 'dots':
        light = dots(tone)
    else:
        # the direction field, from the structure tensor of a smoothed luma at 1/4 size
        q = 4; Ws, Hs = max(4, W // q), max(4, H // q)
        ls = np.asarray(Image.fromarray((luma * 255).astype(np.uint8)).resize((Ws, Hs), Image.LANCZOS)).astype(np.float32) / 255
        ls = blur(ls, 1.2 * k)
        gy, gx = np.gradient(ls)
        jxx, jyy, jxy = blur(gx * gx, 3 * k), blur(gy * gy, 3 * k), blur(gx * gy, 3 * k)
        theta = 0.5 * np.arctan2(2 * jxy, jxx - jyy)      # the gradient's orientation
        lam = np.sqrt((jxx - jyy) ** 2 + 4 * jxy ** 2); energy = jxx + jyy
        coher = lam / (energy + 1e-9)
        # strokes run along the contours (across the gradient); with no structure they fall back to 45 degrees
        stroke = theta + math.pi / 2
        ref = np.percentile(energy, 90)
        strength = np.clip((energy / (ref + 1e-9)) * coher, 0, 1) if ref > 1e-7 else np.zeros_like(energy)
        c2 = np.cos(2 * stroke) * strength + (1 - strength) * math.cos(2 * math.radians(-45))
        s2 = np.sin(2 * stroke) * strength + (1 - strength) * math.sin(2 * math.radians(-45))
        up = lambda x: np.asarray(Image.fromarray(x.astype(np.float32), 'F').resize((W, H), Image.BILINEAR))
        ang = 0.5 * np.arctan2(up(s2), up(c2))
        vx, vy = np.cos(ang).astype(np.float32), np.sin(ang).astype(np.float32)
        structured = up(blur(strength, 2 * k)) > 0.18     # where hatching replaces screentone
        rng = np.random.default_rng(a.seed)               # seeded: the pass is deterministic

        def lic(vx, vy, steps):
            # stroke noise: one random value per cell across the stroke, smeared along it by the integration
            sc = max(1, int(cell / 2))
            n = rng.random((H // sc + 2, W // sc + 2)).astype(np.float32)
            nb = np.asarray(Image.fromarray(n, 'F').resize((W, H), Image.NEAREST))
            yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
            acc = nb.copy(); cnt = np.ones((H, W), np.float32)
            step = max(0.5, k)
            for sign in (1, -1):
                px, py = xx.copy(), yy.copy(); dx, dy = vx * sign, vy * sign
                for _ in range(steps):
                    ix = np.clip(px.astype(np.int32), 0, W - 1); iy = np.clip(py.astype(np.int32), 0, H - 1)
                    ux, uy = vx[iy, ix], vy[iy, ix]
                    flip = (ux * dx + uy * dy) < 0; ux = np.where(flip, -ux, ux); uy = np.where(flip, -uy, uy)
                    px += ux * step; py += uy * step; dx, dy = ux, uy
                    ix = np.clip(px.astype(np.int32), 0, W - 1); iy = np.clip(py.astype(np.int32), 0, H - 1)
                    acc += nb[iy, ix]; cnt += 1
            f = acc / cnt
            # rank-equalise so that a tone t lights exactly a fraction t of the stroke field
            r = np.empty(f.size, np.float32); r[np.argsort(f, axis=None, kind='stable')] = np.linspace(0, 1, f.size, dtype=np.float32)
            return r.reshape(H, W)

        L = max(1, int(round(a.strokelen * k / max(0.5, k))))
        f1 = lic(vx, vy, L)
        light = tone > f1                                  # strokes: light lines on dark, dark lines on light
        # the darkest tones get a crossing layer at 90 degrees, as an etcher would
        f2 = lic(-vy, vx, L)
        light &= ~((tone < 0.33) & (f2 > tone * 3))
        hatched = structured & (tone > 0.001) & (tone < 0.999)
        light = np.where(structured, light, dots(tone))
    light = np.where(tone >= 0.999, True, np.where(tone <= 0.001, False, light))

    if a.map == 'ink':
        out = np.where(light[..., None], PAPER, INK)
        if HINT is not None: out = np.where((light & mask)[..., None], HINT, out)
    elif a.map == 'paper':
        out = np.where(light[..., None], PAPER, INK)
        if HINT is not None: out = np.where((~light & mask)[..., None], HINT, out)
    else:                                                 # hint and hintlit: the light is the hint, never on a figure
        out = np.where(light[..., None], HINT, INK)
        out = np.where((light & figure)[..., None], PAPER, out)
    out = out.astype(np.uint8)
    is_hint = np.all(out == HINT, axis=2) if HINT is not None else np.zeros((H, W), bool)
    stats = {
        'width': W, 'height': H, 'map': a.map, 'texture': a.texture,
        'ink_pct': round(float(np.all(out == INK, axis=2).mean() * 100), 2),
        'paper_pct': round(float(np.all(out == PAPER, axis=2).mean() * 100), 2),
        'hint_pct': round(float(is_hint.mean() * 100), 2),
        'hatched_pct': round(float(hatched.mean() * 100), 2),
        'hint_on_figure': int((is_hint & figure).sum()),
        'colours': int(len(np.unique(out.reshape(-1, 3), axis=0))),
    }
    return out, mask, stats


def cmd_ink(a):
    if a.map in ('hint', 'hintlit') and not a.hint:
        raise SystemExit(json.dumps({'error': f'--map {a.map} needs --hint'}))
    cols = (hexrgb(a.ink), hexrgb(a.paper), hexrgb(a.hint) if a.hint else None)
    src = Image.open(a.src).convert('RGB')
    widths = [int(w) for w in str(a.width).split(',') if w.strip()]
    results = []
    for W in widths:
        out, mask, stats = ink_one(a, src, W, cols)
        base = a.out if len(widths) == 1 else f'{a.out}@{W}'
        Image.fromarray(out).save(base + '.png', optimize=True)
        stats['file'] = base + '.png'
        if a.debug:
            Image.fromarray((mask * 255).astype(np.uint8)).save(base + '.mask.png')
            stats['mask'] = base + '.mask.png'
        results.append(stats)
    print(json.dumps({'results': results}))


def cmd_layers(a):
    im = Image.open(a.src).convert('RGB'); W, H = im.size
    fill = tuple(int(v) for v in hexrgb(a.fill))
    ext = a.format
    save = lambda img, p: img.save(p, lossless=True, quality=100, method=6) if ext == 'webp' else img.save(p, optimize=True)
    bg_path = f'{a.outdir}/{a.name}.{ext}'
    res = {'background': bg_path, 'figure': None, 'figure_pct': 0.0, 'width': W, 'height': H}
    if a.alpha == 'ellipse':
        # a small piece set into another set's panel: its edge feathers out in an ellipse, so no rectangle shows
        yy, xx = np.ogrid[0:H, 0:W]; r = ((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2
        al = Image.fromarray((np.clip((1 - r) / 0.35, 0, 1) * 255).astype(np.uint8)); im.putalpha(al)
        save(im, bg_path)
    elif a.alpha == 'none':
        save(im, bg_path)
    else:
        al = alpha_of(a.alpha).resize((W, H), Image.LANCZOS)
        hard = al.point(lambda v: 255 if v > 110 else 0)
        g = max(3, round(a.grow * W / 1536)) | 1
        # the figure's place is filled with the set's ground, grown so no outline is left when the planes move apart
        grown = hard.filter(ImageFilter.MaxFilter(g)).filter(ImageFilter.GaussianBlur(1.2 * W / 1536))
        save(Image.composite(Image.new('RGB', (W, H), fill), im, grown), bg_path)
        fig = im.copy(); fig.putalpha(hard.filter(ImageFilter.GaussianBlur(0.7 * W / 1536)))
        fig_path = f'{a.outdir}/{a.name}-fig.{ext}'
        save(fig, fig_path)
        res['figure'] = fig_path
        res['figure_pct'] = round(sum(hard.histogram()[255:]) / (W * H) * 100, 2)
    print(json.dumps({'results': [res]}))


def main(argv):
    ap = argparse.ArgumentParser(prog='ink-pass.py')
    sub = ap.add_subparsers(dest='cmd', required=True)
    p = sub.add_parser('ink')
    p.add_argument('src'); p.add_argument('out')
    p.add_argument('--ink', required=True); p.add_argument('--paper', required=True); p.add_argument('--hint')
    p.add_argument('--map', default='ink', choices=['ink', 'paper', 'hint', 'hintlit'])
    p.add_argument('--texture', default='hatch', choices=['hatch', 'dots'])
    p.add_argument('--width', default='1536')
    p.add_argument('--cell', type=float, default=6.0)
    p.add_argument('--strokelen', type=float, default=22.0)
    p.add_argument('--lo', type=float, default=0.18)
    p.add_argument('--hi', type=float, default=0.72)
    p.add_argument('--gamma', type=float, default=1.0)
    p.add_argument('--hint-mask', dest='hint_mask', default='auto')
    p.add_argument('--hint-hue', dest='hint_hue', default=None)
    p.add_argument('--exclude', nargs='*', default=[])
    p.add_argument('--erase', nargs='*', default=[])
    p.add_argument('--figure', default=None)
    p.add_argument('--seed', type=int, default=7)
    p.add_argument('--debug', action='store_true')
    l = sub.add_parser('layers')
    l.add_argument('src'); l.add_argument('outdir'); l.add_argument('name')
    l.add_argument('--alpha', required=True)
    l.add_argument('--fill', required=True)
    l.add_argument('--grow', type=int, default=7)
    l.add_argument('--format', default='webp', choices=['webp', 'png'])
    a = ap.parse_args(argv)
    (cmd_ink if a.cmd == 'ink' else cmd_layers)(a)


if __name__ == '__main__':
    main(sys.argv[1:])
