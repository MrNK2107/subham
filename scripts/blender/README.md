# Landing scene

The hero on the landing page is a render, not a live 3D scene. To rebuild it:

1. Download these Poly Haven textures at 2k (Diffuse, Rough, nor_gl as JPG) into one folder:
   `beige_wall_001`, `blue_plaster_weathered`, `clay_plaster`, `painted_plaster_wall`, `asphalt_02`.
   The files are named like `beige_wall_001_Diffuse.jpg`, which is what Poly Haven's API serves.
2. Bake one EXR per light group (about 3 minutes on an RTX-class GPU):

   ```sh
   LANE_TEX=<textures> LANE_BAKE=<out> blender -b -P scripts/blender/lane.py -- --cycles-device OPTIX
   ```

   `LANE_PREVIEW=<file.png>` instead of `LANE_BAKE` renders a single preview of the full scene.

3. Convert and encode into `public/scene/lane/`:

   ```sh
   LANE_BAKE=<out> blender -b --factory-startup -P scripts/blender/layers_to_npy.py
   python scripts/blender/encode.py <out> public/scene/lane
   ```

Light adds linearly, so the page can sum the layers with any weights and get a physically correct
frame: see `src/ui/scene/StreetLights.tsx` and `src/ui/scene/controller.ts`.

# The evening chapters

The four hours below the hero (haldi, sangeet, ceremony, send-off) are close still lifes from
`scripts/blender/scenes.py`.

1. Add these Poly Haven textures to the same folder: `granite_tile`, `marble_01`, `dark_wood`,
   `fine_grained_wood`.
2. Download these Poly Haven models as 2k glTF, each into its own folder named after the asset
   (`<models>/brass_pot_02/brass_pot_02_2k.gltf` plus its textures): `brass_pot_01`,
   `brass_pot_02`, `brass_pan_01`, `brass_vase_03`, `lemon`, `bananas`, `food_pomegranate_01`,
   `throw_pillows_01`. Poly Haven's API refuses requests without a User-Agent header.
3. Render each scene (about 20 seconds each on an RTX-class GPU):

   ```sh
   LANE_TEX=<textures> SCENE_MODELS=<models> SCENE=haldi SCENE_OUT=haldi.png \
     blender -b -P scripts/blender/scenes.py -- --cycles-device OPTIX
   ```

   `SCENE` is `haldi`, `sangeet`, `ceremony` or `dinner`; `SCENE_SAMPLES` and `SCENE_PCT` make quick
   previews. The sunlit haldi ships with `SCENE_EXPOSURE=0.3 SCENE_LOOK="AgX - Punchy"`.

   The closing midnight shot is the lane from below the strands:
   `LANE_CAM=midnight LANE_TEX=<textures> LANE_PREVIEW=midnight.png blender -b -P scripts/blender/lane.py -- --cycles-device OPTIX`,
   saved as `public/scene/lane/midnight-{1920,1080}.webp`.

4. Save each as WebP at 1920 and 1080 wide in `public/scene/chapters/` (`dinner` ships as
   `sendoff`).

Everything here is CC0 (Poly Haven) or built in the scripts; no image is AI-generated.
