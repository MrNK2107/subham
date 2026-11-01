"""
Blender side of the export: reads the baked light-group EXRs and writes their linear pixels as
float16 .npy files, which encode.py turns into web images (Pillow can't read EXR).

LANE_BAKE=<folder> blender -b --factory-startup -P scripts/blender/layers_to_npy.py
"""

import os

import bpy
import numpy as np

folder = os.environ["LANE_BAKE"]
for name in sorted(os.listdir(folder)):
    if not name.endswith(".exr"):
        continue
    img = bpy.data.images.load(os.path.join(folder, name))
    w, h = img.size
    px = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(px)
    # Blender stores rows bottom-up.
    rgb = np.flipud(px.reshape(h, w, 4))[:, :, :3]
    np.save(os.path.join(folder, name[:-4] + ".npy"), rgb.astype(np.float16))
    print("converted", name, w, h, float(rgb.max()), flush=True)
