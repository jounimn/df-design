"""Cut a subject out of a photo, find what is in it, or mask one named object. Called by scripts/cutout.mjs.

    python -I cutout.py remove-bg <in...> [--model ID] [--out DIR] [--ground #hex] [--no-defringe] [--no-trim]
    python -I cutout.py detect    <in...> [--labels a,b] [--threshold F] [--annotate] [--out DIR]
    python -I cutout.py mask      <in...> --label NAME [--box x0,y0,x1,y1] [--pick N] [--refine hybrid|sam2] ...
    python -I cutout.py fetch     --groups base,high,portrait,detect      (the only command that uses the network)
    python -I cutout.py doctor

One JSON object on stdout ({"results": [...]}); progress and warnings on stderr. Models come only from
cutout-models.json next to this file. `--backend stub` swaps every model for a colour-distance mask and a
bounding-box detector, so the plumbing can be tested with Pillow and numpy alone.
Paths: REMBG_HOME (rembg models) and HF_HOME (Hugging Face cache) are set by the Node wrapper.
"""
import argparse
import json
import os
import re
import sys
import time

HERE = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(HERE, 'cutout-models.json'), encoding='utf-8') as fh:
    REGISTRY = json.load(fh)
MODELS = REGISTRY['models']

COCO = {'person', 'bicycle', 'car', 'motorcycle', 'airplane', 'bus', 'train', 'truck', 'boat', 'traffic light',
        'fire hydrant', 'stop sign', 'parking meter', 'bench', 'bird', 'cat', 'dog', 'horse', 'sheep', 'cow',
        'elephant', 'bear', 'zebra', 'giraffe', 'backpack', 'umbrella', 'handbag', 'tie', 'suitcase', 'frisbee',
        'skis', 'snowboard', 'sports ball', 'kite', 'baseball bat', 'baseball glove', 'skateboard', 'surfboard',
        'tennis racket', 'bottle', 'wine glass', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'banana', 'apple',
        'sandwich', 'orange', 'broccoli', 'carrot', 'hot dog', 'pizza', 'donut', 'cake', 'chair', 'couch',
        'potted plant', 'bed', 'dining table', 'toilet', 'tv', 'laptop', 'mouse', 'remote', 'keyboard',
        'cell phone', 'microwave', 'oven', 'toaster', 'sink', 'refrigerator', 'book', 'clock', 'vase', 'scissors',
        'teddy bear', 'hair drier', 'toothbrush'}
DETECTOR, OPEN_VOCAB, SEGMENTER, CROP_MODEL = 'rtdetr-v2-r18', 'owlv2-base', 'sam2.1-hiera-tiny', 'birefnet-general-lite'
DEFAULT_THRESHOLD = {DETECTOR: 0.5, OPEN_VOCAB: 0.2}
PERSON_MIN_AREA = 0.05  # a person box under 5% of the frame is a passer-by, not the subject
PERSON_WORDS = {'person', 'people', 'man', 'woman', 'boy', 'girl', 'child', 'kid', 'baby', 'face', 'head',
                'portrait', 'model', 'person face'}


class CutoutError(Exception):
    pass


def log(*a):
    print(*a, file=sys.stderr, flush=True)


def model_info(mid):
    if mid not in MODELS:
        raise CutoutError(f'model "{mid}" is not on the allow-list (cutout-models.json): {", ".join(MODELS)}')
    m = MODELS[mid]
    return {'id': mid, 'source': m['source'], 'licence': m['licence'], 'runner': m['runner']}


def setup_hint(mid):
    return f'model "{mid}" is not downloaded: run node scripts/cutout.mjs setup --with {MODELS[mid]["group"]}'


# ---------- geometry and image helpers (no model needed) ----------

def iou(a, b):
    ix0, iy0, ix1, iy1 = max(a[0], b[0]), max(a[1], b[1]), min(a[2], b[2]), min(a[3], b[3])
    inter = max(0, ix1 - ix0) * max(0, iy1 - iy0)
    union = (a[2] - a[0]) * (a[3] - a[1]) + (b[2] - b[0]) * (b[3] - b[1]) - inter
    return inter / union if union > 0 else 0.0


def merge_boxes(dets, threshold=0.7):
    """Greedy per-label merge: a box overlapping a better-scored box of the same label by IoU > threshold is dropped."""
    kept = []
    for d in sorted(dets, key=lambda d: -d['score']):
        if not any(k['label'] == d['label'] and iou(k['box'], d['box']) > threshold for k in kept):
            kept.append(d)
    return kept


def slug(text):
    return re.sub(r'[^a-z0-9]+', '-', text.lower()).strip('-') or 'object'


def load_image(path):
    from PIL import Image, ImageOps
    with Image.open(path) as im:
        return ImageOps.exif_transpose(im).convert('RGB')


def parse_colour(hexstr):
    h = hexstr.lstrip('#')
    if not re.fullmatch(r'[0-9a-fA-F]{6}', h):
        raise CutoutError(f'--ground takes a #rrggbb colour, not {hexstr}')
    return '#' + h.lower()


def alpha_bbox(alpha, floor=8):
    return alpha.point(lambda v: 255 if v > floor else 0).getbbox()


def defringe(img, alpha, max_side=1024):
    """Re-estimate the foreground colour in the soft edge so the old ground does not bleed onto the new one."""
    import numpy as np
    from PIL import Image
    try:
        from pymatting import estimate_foreground_ml
    except ImportError:
        log('defringe skipped: pymatting is not installed')
        return img
    small = img.copy()
    small.thumbnail((max_side, max_side))
    a = np.asarray(alpha.resize(small.size), dtype=np.float64) / 255
    fg = estimate_foreground_ml(np.asarray(small, dtype=np.float64) / 255, a)
    fg = Image.fromarray((np.clip(fg, 0, 1) * 255).astype('uint8')).resize(img.size, Image.LANCZOS)
    A = np.asarray(alpha, dtype=np.float64)[..., None] / 255
    edge = ((A > 0.02) & (A < 0.98)).astype(np.float64)
    out = np.asarray(img, dtype=np.float64) * (1 - edge) + np.asarray(fg, dtype=np.float64) * edge
    return Image.fromarray(out.astype('uint8'))


def write_cutout(img, alpha, out_png, out_preview, ground, clean=True, trim=True):
    from PIL import Image
    bbox = alpha_bbox(alpha)
    if bbox is None:
        raise CutoutError('the mask is empty: nothing was cut out')
    if clean:
        img = defringe(img, alpha)
    rgba = img.convert('RGBA')
    rgba.putalpha(alpha)
    if trim:
        pad = round(0.02 * max(img.size))
        w, h = img.size
        bbox = (max(0, bbox[0] - pad), max(0, bbox[1] - pad), min(w, bbox[2] + pad), min(h, bbox[3] + pad))
        rgba = rgba.crop(bbox)
    os.makedirs(os.path.dirname(out_png) or '.', exist_ok=True)
    rgba.save(out_png, optimize=True)
    bg = Image.new('RGBA', rgba.size, ground)
    bg.alpha_composite(rgba)
    bg.convert('RGB').save(out_preview, quality=90)
    return {'cutout': out_png, 'preview': out_preview, 'size': list(rgba.size), 'crop': list(bbox)}


# ---------- backends ----------

class StubBackend:
    """No weights. Foreground = pixels far from the median border colour; detection = that region's box (twice,
    so the merge is exercised). STUB_LABEL names what the stub 'sees' (default 'object')."""
    name = 'stub'

    def __init__(self):
        self.label = os.environ.get('DF_DESIGN_CUTOUT_STUB_LABEL', 'object')

    def info(self, mid):
        return {'id': f'stub:{mid}', 'source': 'stub backend (no model)', 'licence': 'n/a', 'runner': 'stub'}

    def alpha(self, img, mid):
        import numpy as np
        from PIL import Image, ImageFilter
        a = np.asarray(img, dtype=np.int16)
        border = np.concatenate([a[0], a[-1], a[:, 0], a[:, -1]])
        ref = np.median(border, axis=0)
        dist = np.abs(a - ref).sum(axis=2)
        m = Image.fromarray(((dist > 60) * 255).astype('uint8'), 'L')
        return m.filter(ImageFilter.GaussianBlur(1))

    def detect(self, img, labels, threshold):
        box = alpha_bbox(self.alpha(img, None), 128)
        if box is None:
            return [], 'stub'
        wanted = labels or [self.label]
        if self.label not in wanted:
            return [], 'stub'
        x0, y0, x1, y1 = box
        return [{'label': self.label, 'score': 0.9, 'box': [x0, y0, x1, y1]},
                {'label': self.label, 'score': 0.8, 'box': [x0 + 1, y0 + 1, x1 - 1, y1 - 1]}], 'stub'

    def segment(self, img, box):
        from PIL import Image
        full = Image.new('L', img.size, 0)
        crop = self.alpha(img.crop(tuple(box)), None)
        full.paste(crop, (box[0], box[1]))
        return full

    def crop_alpha(self, img, box):
        return self.segment(img, box)

    def has(self, mid):
        return True


class ModelBackend:
    name = 'models'

    def __init__(self):
        self._rembg, self._hf = {}, {}

    def info(self, mid):
        return model_info(mid)

    # presence, without touching the network
    def rembg_path(self, mid):
        home = os.environ.get('REMBG_HOME') or os.path.expanduser('~/.rembg')
        return os.path.join(home, 'models', mid, f'{mid}.onnx')

    def has(self, mid):
        m = MODELS[mid]
        if m['runner'] == 'rembg':
            return os.path.exists(self.rembg_path(mid))
        try:
            from huggingface_hub import try_to_load_from_cache
        except ImportError:
            return False
        hit = try_to_load_from_cache(m['source'], 'config.json', revision=m['revision'])
        return isinstance(hit, str)

    def need(self, mid):
        model_info(mid)
        if not self.has(mid):
            raise CutoutError(setup_hint(mid))

    def alpha(self, img, mid):
        self.need(mid)
        if mid not in self._rembg:
            from rembg import new_session
            t = time.perf_counter()
            self._rembg[mid] = new_session(mid, providers=['CPUExecutionProvider'])
            log(f'loaded {mid} in {time.perf_counter() - t:.0f} s')
        from rembg import remove
        return remove(img, session=self._rembg[mid], only_mask=True, post_process_mask=False)

    def _hf_load(self, mid, proc_cls, model_cls):
        self.need(mid)
        if mid not in self._hf:
            m = MODELS[mid]
            t = time.perf_counter()
            self._hf[mid] = (proc_cls.from_pretrained(m['source'], revision=m['revision']),
                             model_cls.from_pretrained(m['source'], revision=m['revision']).eval())
            log(f'loaded {mid} in {time.perf_counter() - t:.0f} s')
        return self._hf[mid]

    def _rtdetr(self, img, threshold):
        import torch
        from transformers import AutoImageProcessor, RTDetrV2ForObjectDetection
        proc, model = self._hf_load(DETECTOR, AutoImageProcessor, RTDetrV2ForObjectDetection)
        inputs = proc(images=img, return_tensors='pt')
        with torch.no_grad():
            outputs = model(**inputs)
        res = proc.post_process_object_detection(outputs, target_sizes=[img.size[::-1]], threshold=threshold)[0]
        return [{'label': model.config.id2label[int(l)], 'score': round(float(s), 3), 'box': [round(float(v)) for v in b]}
                for s, l, b in zip(res['scores'], res['labels'], res['boxes'])]

    def _owlv2(self, img, queries, threshold):
        import torch
        from transformers import Owlv2Processor, Owlv2ForObjectDetection
        proc, model = self._hf_load(OPEN_VOCAB, Owlv2Processor, Owlv2ForObjectDetection)
        inputs = proc(text=[queries], images=img, return_tensors='pt')
        with torch.no_grad():
            outputs = model(**inputs)
        side = max(img.size)  # OWLv2 pads to a square; boxes are relative to it
        res = proc.post_process_grounded_object_detection(outputs, threshold=threshold, target_sizes=[(side, side)],
                                                          text_labels=[queries])[0]
        w, h = img.size
        out = []
        for s, l, b in zip(res['scores'], res['labels'], res['boxes']):
            x0, y0, x1, y1 = [float(v) for v in b]
            out.append({'label': queries[int(l)], 'score': round(float(s), 3),
                        'box': [round(max(0, x0)), round(max(0, y0)), round(min(w, x1)), round(min(h, y1))]})
        return out

    def detect(self, img, labels, threshold):
        """COCO labels go to RT-DETR; anything else to OWLv2. Returns (detections, model ids used)."""
        dets, used = [], []
        coco = [l for l in labels or [] if l in COCO]
        other = [l for l in labels or [] if l not in COCO]
        if not labels or coco:
            found = self._rtdetr(img, threshold if threshold is not None else DEFAULT_THRESHOLD[DETECTOR])
            dets += [d for d in found if not labels or d['label'] in coco]
            used.append(DETECTOR)
        if other:
            dets += self._owlv2(img, other, threshold if threshold is not None else DEFAULT_THRESHOLD[OPEN_VOCAB])
            used.append(OPEN_VOCAB)
        return dets, used

    def segment(self, img, box):
        import torch
        from PIL import Image
        from transformers import Sam2Processor, Sam2Model
        proc, model = self._hf_load(SEGMENTER, Sam2Processor, Sam2Model)
        inputs = proc(images=img, input_boxes=[[box]], return_tensors='pt')
        with torch.no_grad():
            outputs = model(**inputs, multimask_output=False)
        logits = proc.post_process_masks(outputs.pred_masks, inputs['original_sizes'], binarize=False)[0]
        return Image.fromarray((torch.sigmoid(logits[0, 0].float()).numpy() * 255).astype('uint8'), 'L')

    def crop_alpha(self, img, box):
        """The salient-object model on the padded box crop, pasted back into a full-size alpha."""
        from PIL import Image
        w, h = img.size
        x0, y0, x1, y1 = box
        pad = int(0.08 * max(x1 - x0, y1 - y0))
        c = (max(0, x0 - pad), max(0, y0 - pad), min(w, x1 + pad), min(h, y1 + pad))
        full = Image.new('L', img.size, 0)
        full.paste(self.alpha(img.crop(c), CROP_MODEL), (c[0], c[1]))
        return full


def detect_installed(backend):
    if backend.name == 'stub':
        return True
    try:
        import transformers  # noqa: F401
    except ImportError:
        return False
    return backend.has(DETECTOR)


def person_in(backend, img):
    """True / False when the detector is installed; None when it is not (the wrapper then prints the reminder)."""
    if not detect_installed(backend):
        return None
    dets, _ = backend.detect(img, ['person'], None)
    area = img.size[0] * img.size[1]
    return any((d['box'][2] - d['box'][0]) * (d['box'][3] - d['box'][1]) >= PERSON_MIN_AREA * area for d in dets)


# ---------- commands ----------

def out_base(path, out_dir):
    stem = os.path.splitext(os.path.basename(path))[0]
    return os.path.join(out_dir or os.path.dirname(os.path.abspath(path)), stem)


def cmd_remove_bg(a, backend):
    mid = a.model
    model_info(mid)
    if MODELS[mid]['task'] != 'remove-bg':
        raise CutoutError(f'{mid} is a {MODELS[mid]["task"]} model, not a background remover')
    results = []
    for path in a.inputs:
        try:
            img = load_image(path)
            t = time.perf_counter()
            alpha = backend.alpha(img, mid)
            base = out_base(path, a.out)
            r = write_cutout(img, alpha, base + '.cutout.png', base + '.on-ground.jpg', a.ground,
                             clean=not a.no_defringe, trim=not a.no_trim)
            r.update({'input': path, 'seconds': round(time.perf_counter() - t, 2), 'models': [backend.info(mid)],
                      'person': None if a.no_person_check else person_in(backend, img),
                      'treatment': 'cutout' + ('' if a.no_defringe else ', defringed')})
            results.append(r)
        except CutoutError as e:
            results.append({'input': path, 'error': str(e)})
    return results


def cmd_detect(a, backend):
    labels = [s.strip() for s in a.labels.split(',') if s.strip()] if a.labels else None
    results = []
    for path in a.inputs:
        try:
            img = load_image(path)
            t = time.perf_counter()
            raw, used = backend.detect(img, labels, a.threshold)
            dets = merge_boxes(raw)
            missing = [l for l in labels or [] if not any(d['label'] == l for d in dets)]
            base = out_base(path, a.out)
            r = {'input': path, 'size': list(img.size), 'detections': dets, 'not_found': missing,
                 'merged': len(raw) - len(dets), 'seconds': round(time.perf_counter() - t, 2),
                 'models': [backend.info(m) for m in (used if isinstance(used, list) else [used])]}
            os.makedirs(os.path.dirname(base) or '.', exist_ok=True)
            with open(base + '.detect.json', 'w', encoding='utf-8') as fh:
                json.dump(r, fh, indent=2)
            r['json'] = base + '.detect.json'
            if a.annotate:
                from PIL import ImageDraw
                im = img.copy()
                dr = ImageDraw.Draw(im)
                for d in dets:
                    dr.rectangle(d['box'], outline='#c6ff00', width=max(2, round(max(img.size) / 400)))
                    dr.text((d['box'][0] + 6, d['box'][1] + 6), f"{d['label']} {d['score']}", fill='#c6ff00')
                im.save(base + '.detect.jpg', quality=88)
                r['annotated'] = base + '.detect.jpg'
            results.append(r)
        except CutoutError as e:
            results.append({'input': path, 'error': str(e)})
    return results


def hybrid_alpha(sam, crop, size):
    """Select with SAM2, take the edge from BiRefNet: crop alpha x (SAM2 mask dilated and softened)."""
    from PIL import ImageChops, ImageFilter
    k = max(3, round(max(size) / 220)) | 1
    gate = sam.filter(ImageFilter.MaxFilter(k)).filter(ImageFilter.GaussianBlur(max(1, k // 4)))
    return ImageChops.multiply(crop, gate)


def cmd_mask(a, backend):
    label = a.label.strip()
    results = []
    for path in a.inputs:
        try:
            img = load_image(path)
            t = time.perf_counter()
            used = []
            if a.box:
                box = [int(v) for v in a.box.split(',')]
                if len(box) != 4 or box[2] <= box[0] or box[3] <= box[1]:
                    raise CutoutError('--box takes x0,y0,x1,y1 with x1 > x0 and y1 > y0')
                target = {'label': label, 'score': None, 'box': box}
            else:
                raw, used = backend.detect(img, [label], a.threshold)
                used = used if isinstance(used, list) else [used]
                dets = [d for d in merge_boxes(raw) if d['label'] == label]
                if not dets:
                    results.append({'input': path, 'label': label, 'found': False,
                                    'error': f'no "{label}" found in {os.path.basename(path)}: nothing was cut out. '
                                             'Try another word, a lower --threshold, or --box.'})
                    continue
                if a.pick > len(dets):
                    raise CutoutError(f'--pick {a.pick}, but only {len(dets)} "{label}" found')
                target = dets[a.pick - 1]
            sam = backend.segment(img, target['box'])
            used.append(SEGMENTER)
            if a.refine == 'hybrid':
                alpha = hybrid_alpha(sam, backend.crop_alpha(img, target['box']), img.size)
                used.append(CROP_MODEL)
            else:
                alpha = sam
            base = out_base(path, a.out) + '.' + slug(label)
            r = write_cutout(img, alpha, base + '.cutout.png', base + '.on-ground.jpg', a.ground,
                             clean=not a.no_defringe, trim=not a.no_trim)
            r.update({'input': path, 'label': label, 'found': True, 'target': target,
                      'seconds': round(time.perf_counter() - t, 2),
                      'models': [backend.info(m) for m in dict.fromkeys(used) if m in MODELS or backend.name == 'stub'],
                      'person': label.lower() in PERSON_WORDS,
                      'treatment': f'cutout of the {label}' + ('' if a.no_defringe else ', defringed')})
            results.append(r)
        except CutoutError as e:
            results.append({'input': path, 'error': str(e)})
    return results


def cmd_fetch(a, backend):
    """Download the weights of the named groups. The one command that is allowed to use the network."""
    groups = {g.strip() for g in a.groups.split(',') if g.strip()}
    unknown = groups - {m['group'] for m in MODELS.values()}
    if unknown:
        raise CutoutError(f'unknown group(s) {", ".join(sorted(unknown))}')
    results = []
    for mid, m in MODELS.items():
        if m['group'] not in groups:
            continue
        if backend.name == 'stub' or backend.has(mid):
            results.append({'model': mid, 'status': 'present'})
            continue
        log(f'downloading {mid} (~{m["size_mb"]} MB, {m["licence"]})')
        if m['runner'] == 'rembg':
            from rembg import new_session
            new_session(mid, providers=['CPUExecutionProvider'])
        else:
            from huggingface_hub import snapshot_download
            snapshot_download(m['source'], revision=m['revision'],
                              allow_patterns=['*.json', '*.safetensors', '*.txt', '*.model'])
        results.append({'model': mid, 'status': 'downloaded' if backend.has(mid) else 'missing'})
    return results


def cmd_doctor(a, backend):
    import importlib.util
    pkgs = {p: importlib.util.find_spec(p) is not None for p in ('PIL', 'numpy', 'rembg', 'onnxruntime', 'pymatting',
                                                                 'torch', 'transformers')}
    models = {mid: {'present': backend.has(mid), 'group': m['group'], 'licence': m['licence']}
              for mid, m in MODELS.items()}
    return [{'python': sys.version.split()[0], 'packages': pkgs, 'models': models,
             'offline': os.environ.get('HF_HUB_OFFLINE') == '1'}]


def build_parser():
    p = argparse.ArgumentParser(prog='cutout.py')
    p.add_argument('--backend', choices=['models', 'stub'], default='models')
    sub = p.add_subparsers(dest='cmd', required=True)

    def common(sp, cut=True):
        sp.add_argument('inputs', nargs='+')
        sp.add_argument('--out', help='output folder (default: next to each input)')
        if cut:
            sp.add_argument('--ground', type=parse_colour, default='#1f3fbf', help='preview ground colour')
            sp.add_argument('--no-defringe', action='store_true')
            sp.add_argument('--no-trim', action='store_true')

    r = sub.add_parser('remove-bg')
    common(r)
    r.add_argument('--model', default=REGISTRY['quality']['default'])
    r.add_argument('--no-person-check', action='store_true')
    d = sub.add_parser('detect')
    common(d, cut=False)
    d.add_argument('--labels')
    d.add_argument('--threshold', type=float)
    d.add_argument('--annotate', action='store_true')
    m = sub.add_parser('mask')
    common(m)
    m.add_argument('--label', required=True)
    m.add_argument('--box')
    m.add_argument('--pick', type=int, default=1)
    m.add_argument('--threshold', type=float)
    m.add_argument('--refine', choices=['hybrid', 'sam2'], default='hybrid')
    f = sub.add_parser('fetch')
    f.add_argument('--groups', required=True)
    sub.add_parser('doctor')
    return p


def main(argv=None):
    a = build_parser().parse_args(argv)
    if getattr(a, 'pick', 1) < 1:
        print(json.dumps({'error': '--pick counts from 1'}))
        return 2
    backend = StubBackend() if a.backend == 'stub' else ModelBackend()
    cmd = {'remove-bg': cmd_remove_bg, 'detect': cmd_detect, 'mask': cmd_mask, 'fetch': cmd_fetch,
           'doctor': cmd_doctor}[a.cmd]
    try:
        results = cmd(a, backend)
    except CutoutError as e:
        print(json.dumps({'error': str(e)}))
        return 2
    print(json.dumps({'command': a.cmd, 'backend': backend.name, 'results': results}))
    ok = [r for r in results if 'error' not in r]
    return 0 if ok or not results else 1


if __name__ == '__main__':
    sys.exit(main())
