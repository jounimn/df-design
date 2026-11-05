# Models used by scripts/cutout.mjs

Nothing below is vendored in this repository. `node scripts/cutout.mjs setup` downloads the weights from their
publishers into `~/.cache/df-design/cutout-models` and installs the Python packages from PyPI into
`~/.cache/df-design/cutout-venv`. This repository redistributes none of them, so it ships no licence text for
them. Their licences apply on the machine that downloads them, and they allow commercial use.

The allow-list itself is `scripts/py/cutout-models.json`. The tool refuses every model that is not on it.

| Model id | Weights | Licence | Published at |
|---|---|---|---|
| `birefnet-general-lite` | BiRefNet_lite (Zheng Peng et al.) | MIT | https://huggingface.co/ZhengPeng7/BiRefNet_lite |
| `birefnet-general` | BiRefNet | MIT | https://huggingface.co/ZhengPeng7/BiRefNet |
| `birefnet-portrait` | BiRefNet-portrait | MIT | https://huggingface.co/ZhengPeng7/BiRefNet-portrait |
| `u2net` | U²-Net (Xuebin Qin et al.) | Apache-2.0 | https://github.com/xuebinqin/U-2-Net |
| `rtdetr-v2-r18` | RT-DETRv2 r18vd (PekingU), COCO | Apache-2.0 | https://huggingface.co/PekingU/rtdetr_v2_r18vd |
| `owlv2-base` | OWLv2 base patch16 ensemble (Google) | Apache-2.0 | https://huggingface.co/google/owlv2-base-patch16-ensemble |
| `sam2.1-hiera-tiny` | SAM 2.1 hiera-tiny (Meta) | Apache-2.0 | https://huggingface.co/facebook/sam2.1-hiera-tiny |

The four background removers are fetched through rembg (MIT, https://github.com/danielgatis/rembg) from its
release assets, which are ONNX conversions of the weights above. The other three are pinned to the commits named
in the allow-list.

Left out on purpose, after their licences were read on 2026-11-03:

- BRIA RMBG-1.4 and RMBG-2.0 (CC BY-NC; rembg's default model is RMBG-2.0): commercial use requires a paid agreement.
- IS-Net `isnet-general-use`: no licence is stated for the weights.
- InSPyReNet / transparent-background: no licence is stated for the checkpoints.
- Ultralytics YOLO: AGPL-3.0.

BiRefNet's general weights were trained on public datasets, some of which carry research-only terms. The weights
themselves are published under MIT. None of this is legal advice: read each model card before you ship.
