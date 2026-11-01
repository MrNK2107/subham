"""
Turns the baked light-group layers into web images.

Each layer is linear light. A JPEG can't hold values above 1, and bulb filaments run far above
that, so every channel is stored as  v = (x / (1 + x)) ** (1 / 2.2)  and the page decodes with
y = v ** 2.2,  x = y / (1 - y). Chroma is kept at full resolution (4:4:4): bulbs are only a few
pixels wide and subsampling would wash their colour out.

Also writes poster.jpg, every group at full brightness, tone mapped exactly as the page does it.
It shows while the layers load and stands in for people who prefer reduced motion.

python scripts/blender/encode.py <bake folder> public/scene/lane
"""

import os
import sys

import numpy as np
from PIL import Image

GROUPS = ["ambient", "chase0", "chase1", "chase2", "chase3", "curtain0", "curtain1"]
# Matches the exposure the scene was lit for in Blender.
EXPOSURE = 2.0**-1.6
QUALITY = 86


def encode(x):
    x = np.maximum(x, 0.0)
    return np.power(x / (1.0 + x), 1 / 2.2)


# Minimal AgX (Benjamin Wrensch's fit), the same curve as the fragment shader on the page.
AGX = np.array(
    [
        [0.842479062253094, 0.0423282422610123, 0.0423756549057051],
        [0.0784335999999992, 0.878468636469772, 0.0784336],
        [0.0792237451477643, 0.0791661274605434, 0.879142973793104],
    ]
)
AGX_INV = np.array(
    [
        [1.19687900512017, -0.0528968517574562, -0.0529716355144438],
        [-0.0980208811401368, 1.15190312990417, -0.0980434501171241],
        [-0.0990297440797205, -0.0989611768448433, 1.15107367264116],
    ]
)


def agx(v):
    v = v @ AGX
    lo, hi = -12.47393, 4.026069
    v = (np.clip(np.log2(np.maximum(v, 1e-10)), lo, hi) - lo) / (hi - lo)
    v2 = v * v
    v4 = v2 * v2
    v = 15.5 * v4 * v2 - 40.14 * v4 * v + 31.96 * v4 - 6.868 * v2 * v + 0.4298 * v2 + 0.1191 * v - 0.00232
    return np.clip(v @ AGX_INV, 0, 1)


def save(arr, path):
    Image.fromarray((np.clip(arr, 0, 1) * 255 + 0.5).astype(np.uint8)).save(
        path, quality=QUALITY, subsampling=0, optimize=True, progressive=True
    )
    print(path, os.path.getsize(path) // 1024, "KB")


def main(src, dst):
    os.makedirs(dst, exist_ok=True)
    total = None
    for g in GROUPS:
        x = np.load(os.path.join(src, f"{g}.npy")).astype(np.float32) * EXPOSURE
        total = x if total is None else total + x
        save(encode(x), os.path.join(dst, f"{g}.jpg"))
    save(agx(total), os.path.join(dst, "poster.jpg"))


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
