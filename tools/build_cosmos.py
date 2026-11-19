"""Build the opening 'cosmos' data: an atlas of every gallery photo and a halftone of the
portrait where each cell is assigned the photo whose mean colour is closest to it.
Run: python3 tools/build_cosmos.py   (from the project root)"""
import json, random, re
from pathlib import Path
from PIL import Image, ImageOps
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
random.seed(7)
ids = re.findall(r'"id": "([^"]+)"', (ROOT / "src/data/gallery.ts").read_text())
srcs = re.findall(r'"src": "([^"]+)"', (ROOT / "src/data/gallery.ts").read_text())
assert len(ids) == len(srcs)

# 1) atlas
T, COLS = 128, 8
rows = (len(ids) + COLS - 1) // COLS
atlas = Image.new("RGB", (COLS * T, rows * T), "black")
means = []
for i, src in enumerate(srcs):
    im = Image.open(ROOT / "public" / src.lstrip("/")).convert("RGB")
    im = ImageOps.fit(im, (T, T), Image.LANCZOS, centering=(0.5, 0.35))
    atlas.paste(im, ((i % COLS) * T, (i // COLS) * T))
    means.append(np.asarray(im).reshape(-1, 3).mean(0))
atlas.save(ROOT / "public/images/cosmos-atlas.webp", quality=82, method=6)
means = np.array(means)

# 2) halftone of the portrait
p = Image.open(ROOT / "tools/portrait-cutout.png").convert("RGBA")
p = p.crop((0, 0, p.width, int(p.height * 0.84)))          # less shirt, more face
rgb, alpha = p.convert("RGB"), p.getchannel("A")
lum_eq = ImageOps.equalize(rgb.convert("L"), mask=alpha.point(lambda v: 255 if v > 110 else 0))
GW = 104
GH = round(GW * p.height / p.width)
small = np.asarray(p.resize((GW, GH), Image.LANCZOS)).astype(float)
eq = np.asarray(lum_eq.resize((GW, GH), Image.LANCZOS)).astype(float) / 255
cells = []
for y in range(GH):
    for x in range(GW):
        r, g, b, a = small[y, x]
        if a < 110:
            continue
        raw = (0.299 * r + 0.587 * g + 0.114 * b) / 255
        fx, fy = x / GW - 0.47, y / GH - 0.40               # face centre
        focus = np.exp(-(fx * fx / 0.30 ** 2 + fy * fy / 0.42 ** 2))
        lum = min(1.0, max(0.0, (raw - 0.08) / 0.62)) ** 0.75 * (0.38 + 0.62 * focus)
        lum = min(1.0, lum * 1.35)
        size = 0.45 + 0.55 * lum ** 1.1          # brighter cells get bigger tiles; every cell keeps a tile
        d = ((means - [r, g, b]) ** 2).sum(1)
        slot = int(random.choice(np.argsort(d)[:4]))
        cells.append([x, y, round(size, 2), int(r), int(g), int(b), slot, round(lum, 2)])

out = {"cols": COLS, "rows": rows, "tile": T, "count": len(ids), "gw": GW, "gh": GH,
       "ids": ids, "cells": cells}
(ROOT / "src/data/cosmos.json").write_text(json.dumps(out, separators=(",", ":")))
print(len(ids), "images,", len(cells), "cells, grid", GW, "x", GH)

# 3) static poster (no-WebGL / reduced-motion fallback and first paint)
C = 16
poster = Image.new("RGB", (GW * C, GH * C), (14, 14, 15))
for x, y, s, r, g, b, slot, l in cells:
    t = atlas.crop(((slot % COLS) * T, (slot // COLS) * T, (slot % COLS + 1) * T, (slot // COLS + 1) * T))
    sz = max(2, int(C * s * 0.9))
    t = t.resize((sz, sz), Image.LANCZOS)
    k = 0.66 + 0.9 * l
    col = tuple(int(min(255, v * 1.15)) for v in (r, g, b))
    t = Image.blend(t, Image.new("RGB", t.size, col), 0.62).point(lambda v: int(min(255, v * k)))
    poster.paste(t, (x * C + (C - sz) // 2, y * C + (C - sz) // 2))
poster.save(ROOT / "public/images/cosmos-poster.webp", quality=80, method=6)
print("poster", poster.size)
