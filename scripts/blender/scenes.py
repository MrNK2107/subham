"""
The four chapter scenes of the landing page, one evening of a celebration:

  haldi     4:30 pm  a brass urli of turmeric paste and marigolds in low gold sun
  sangeet   7:30 pm  floor cushions and a lit brass lantern at blue hour, fairy lights behind
  ceremony 10:00 pm  a kalash between brass lamps, lit only by their flames
  dinner   11:00 pm  laddoos, bananas and pomegranates on brass for the send-off

Close, shallow-focus still lifes: real objects at the scale a guest sees them. The brass, fruit
and cushions are Poly Haven scans (CC0); flowers, leaves, paste and sweets are built here.

  LANE_TEX=<poly haven maps> SCENE=haldi SCENE_OUT=out.png blender -b -P scripts/blender/scenes.py \
    -- --cycles-device OPTIX
"""

import math
import os
import random

import bmesh
import bpy
from mathutils import Euler, Matrix, Vector, noise

TEX = os.environ.get("LANE_TEX", "")
rng = random.Random(int(os.environ.get("SCENE_SEED", "5")))


# --- scene plumbing ------------------------------------------------------------------------------


def reset():
    for collection in (
        bpy.data.objects,
        bpy.data.meshes,
        bpy.data.curves,
        bpy.data.lights,
        bpy.data.cameras,
        bpy.data.materials,
        bpy.data.images,
        bpy.data.worlds,
    ):
        for block in list(collection):
            collection.remove(block)


def link(ob):
    bpy.context.scene.collection.objects.link(ob)
    return ob


def mesh_object(name, bm, mat=None, smooth=True, subsurf=0):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    if smooth:
        for p in me.polygons:
            p.use_smooth = True
    if mat:
        me.materials.append(mat)
    ob = link(bpy.data.objects.new(name, me))
    if subsurf:
        mod = ob.modifiers.new("Subsurf", "SUBSURF")
        mod.levels = mod.render_levels = subsurf
    return ob


def nodes_of(mat):
    return mat.node_tree.nodes, mat.node_tree.links


def bsdf_of(mat):
    return next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")


def new_mat(name):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    return mat


# --- materials -----------------------------------------------------------------------------------


def pbr(name, texture, scale=1.0, tint=None, sat=1.0):
    mat = new_mat(name)
    n, l = nodes_of(mat)
    b = bsdf_of(mat)
    coord = n.new("ShaderNodeTexCoord")
    mapping = n.new("ShaderNodeMapping")
    mapping.inputs["Scale"].default_value = (scale, scale, scale)
    l.new(coord.outputs["Object"], mapping.inputs["Vector"])

    def img(kind, colorspace):
        t = n.new("ShaderNodeTexImage")
        t.image = bpy.data.images.load(os.path.join(TEX, f"{texture}_{kind}.jpg"), check_existing=True)
        t.image.colorspace_settings.name = colorspace
        t.projection = "BOX"
        t.projection_blend = 0.2
        l.new(mapping.outputs["Vector"], t.inputs["Vector"])
        return t

    diff, rough, nor = img("Diffuse", "sRGB"), img("Rough", "Non-Color"), img("nor_gl", "Non-Color")
    color = diff.outputs["Color"]
    if sat != 1.0:
        hsv = n.new("ShaderNodeHueSaturation")
        hsv.inputs["Saturation"].default_value = sat
        l.new(color, hsv.inputs["Color"])
        color = hsv.outputs["Color"]
    if tint:
        mix = n.new("ShaderNodeMix")
        mix.data_type = "RGBA"
        mix.blend_type = "MULTIPLY"
        mix.inputs["Factor"].default_value = 1.0
        mix.inputs["B"].default_value = (*tint, 1)
        l.new(color, mix.inputs["A"])
        color = mix.outputs["Result"]
    l.new(color, b.inputs["Base Color"])
    l.new(rough.outputs["Color"], b.inputs["Roughness"])
    nm = n.new("ShaderNodeNormalMap")
    l.new(nor.outputs["Color"], nm.inputs["Color"])
    l.new(nm.outputs["Normal"], b.inputs["Normal"])
    return mat


def brass(name="Brass", tarnish=0.35):
    """Polished brass that has seen a few festivals: fingerprints and dull patches in the shine."""
    mat = new_mat(name)
    n, l = nodes_of(mat)
    b = bsdf_of(mat)
    b.inputs["Metallic"].default_value = 1.0
    b.inputs["Base Color"].default_value = (0.92, 0.66, 0.3, 1)
    tex = n.new("ShaderNodeTexNoise")
    tex.inputs["Scale"].default_value = 9.0
    tex.inputs["Detail"].default_value = 8.0
    ramp = n.new("ShaderNodeMapRange")
    ramp.inputs["From Min"].default_value = 0.4
    ramp.inputs["From Max"].default_value = 0.7
    ramp.inputs["To Min"].default_value = 0.12
    ramp.inputs["To Max"].default_value = 0.12 + tarnish
    l.new(tex.outputs["Fac"], ramp.inputs["Value"])
    l.new(ramp.outputs["Result"], b.inputs["Roughness"])
    return mat


def solid(name, color, rough=0.5, sss=0.0, metal=0.0, coat=0.0):
    mat = new_mat(name)
    b = bsdf_of(mat)
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    if sss:
        b.inputs["Subsurface Weight"].default_value = sss
        b.inputs["Subsurface Radius"].default_value = (0.4, 0.2, 0.1)
        b.inputs["Subsurface Scale"].default_value = 0.01
    if coat:
        b.inputs["Coat Weight"].default_value = coat
    return mat


def bumpy(mat, scale, strength, detail=6.0):
    """Adds a noise bump to a material: powder, paste, skin, grain."""
    n, l = nodes_of(mat)
    tex = n.new("ShaderNodeTexNoise")
    tex.inputs["Scale"].default_value = scale
    tex.inputs["Detail"].default_value = detail
    bump = n.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = strength
    l.new(tex.outputs["Fac"], bump.inputs["Height"])
    l.new(bump.outputs["Normal"], bsdf_of(mat).inputs["Normal"])
    return mat


def vertex_color_mat(name, rough=0.5, translucency=0.25, sss=0.15, gloss=0.0):
    """Petals and leaves: colour from the Col attribute, light glowing through thin tissue."""
    mat = new_mat(name)
    n, l = nodes_of(mat)
    b = bsdf_of(mat)
    attr = n.new("ShaderNodeAttribute")
    attr.attribute_name = "Col"
    l.new(attr.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = rough
    b.inputs["Subsurface Weight"].default_value = sss
    b.inputs["Subsurface Radius"].default_value = (0.5, 0.25, 0.1)
    b.inputs["Subsurface Scale"].default_value = 0.003
    if gloss:
        b.inputs["Coat Weight"].default_value = gloss
    out = next(x for x in n if x.type == "OUTPUT_MATERIAL")
    trans = n.new("ShaderNodeBsdfTranslucent")
    l.new(attr.outputs["Color"], trans.inputs["Color"])
    mix = n.new("ShaderNodeMixShader")
    mix.inputs["Fac"].default_value = translucency
    l.new(b.outputs["BSDF"], mix.inputs[1])
    l.new(trans.outputs["BSDF"], mix.inputs[2])
    l.new(mix.outputs["Shader"], out.inputs["Surface"])
    mat.use_backface_culling = False
    return mat


def emission(name, color, strength):
    mat = new_mat(name)
    n, l = nodes_of(mat)
    for x in list(n):
        n.remove(x)
    out = n.new("ShaderNodeOutputMaterial")
    e = n.new("ShaderNodeEmission")
    e.inputs["Color"].default_value = (*color, 1)
    e.inputs["Strength"].default_value = strength
    l.new(e.outputs["Emission"], out.inputs["Surface"])
    return mat


def flame_material():
    """A candle flame: white-hot at the wick, orange towards the tip."""
    mat = new_mat("Flame")
    n, l = nodes_of(mat)
    for x in list(n):
        n.remove(x)
    out = n.new("ShaderNodeOutputMaterial")
    coord = n.new("ShaderNodeTexCoord")
    sep = n.new("ShaderNodeSeparateXYZ")
    l.new(coord.outputs["Generated"], sep.inputs["Vector"])
    ramp = n.new("ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].color = (1.0, 0.85, 0.55, 1)
    ramp.color_ramp.elements[1].position = 0.9
    ramp.color_ramp.elements[1].color = (1.0, 0.32, 0.04, 1)
    l.new(sep.outputs["Z"], ramp.inputs["Fac"])
    e = n.new("ShaderNodeEmission")
    e.inputs["Strength"].default_value = 45.0
    l.new(ramp.outputs["Color"], e.inputs["Color"])
    l.new(e.outputs["Emission"], out.inputs["Surface"])
    return mat


# --- shapes --------------------------------------------------------------------------------------


def lathe(name, profile, mat, segments=72, subsurf=1, location=(0, 0, 0), axis="Z"):
    """Turns a (radius, height) profile into a solid of revolution, the way a brass smith spins it."""
    bm = bmesh.new()
    rings = []
    for r, z in profile:
        ring = []
        for s in range(segments):
            a = 2 * math.pi * s / segments
            ring.append(bm.verts.new((r * math.cos(a), r * math.sin(a), z)))
        rings.append(ring)
    for i in range(len(rings) - 1):
        for s in range(segments):
            a, b = rings[i][s], rings[i][(s + 1) % segments]
            c, d = rings[i + 1][(s + 1) % segments], rings[i + 1][s]
            bm.faces.new((a, b, c, d))
    for ring, flip in ((rings[0], True), (rings[-1], False)):
        if ring[0].co.xy.length > 1e-4:
            f = bm.faces.new(ring[::-1] if flip else ring)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    if axis == "X":
        bmesh.ops.rotate(bm, verts=bm.verts, cent=(0, 0, 0), matrix=Matrix.Rotation(math.pi / 2, 3, "Y"))
    ob = mesh_object(name, bm, mat, subsurf=subsurf)
    ob.location = location
    return ob


def plane(name, sx, sy, mat, location=(0, 0, 0), rotation=(0, 0, 0)):
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=1)
    for v in bm.verts:
        v.co.x *= sx
        v.co.y *= sy
    ob = mesh_object(name, bm, mat, smooth=False)
    ob.location = location
    ob.rotation_euler = rotation
    return ob


def blob(name, radius, squash, mat, location, roughness=0.25, seed=0, res=3):
    """A heap of something soft: rice, curry, paste, powder."""
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=res, radius=radius)
    off = Vector((seed * 7.1, seed * 3.3, seed * 1.7))
    for v in bm.verts:
        d = 1 + roughness * noise.noise(v.co * (3.5 / radius) + off)
        v.co *= d
        v.co.z *= squash
        if v.co.z < 0:
            v.co.z *= 0.15
    ob = mesh_object(name, bm, mat, subsurf=1)
    ob.location = location
    return ob


class Petals:
    """Every petal and leaf in a scene, in one mesh with per-vertex colour."""

    def __init__(self, name, mat):
        self.name, self.mat = name, mat
        self.bm = bmesh.new()
        self.col = self.bm.loops.layers.color.new("Col")

    def card(self, base, along, side, length, width, color, curl=0.3, segs=3):
        """One curved strip: a petal, a leaf, a sliver of mango leaf."""
        normal = along.cross(side).normalized()
        verts = []
        for i in range(segs + 1):
            u = i / segs
            taper = math.sin(math.pi * min(0.98, 0.15 + u * 0.85)) if width > 0 else 1
            for v in (-1, 1):
                p = base + along * (length * u) + side * (width * v * taper)
                p += normal * (curl * length * u * u)
                verts.append(self.bm.verts.new(p))
        for i in range(segs):
            q = (verts[2 * i], verts[2 * i + 1], verts[2 * i + 3], verts[2 * i + 2])
            f = self.bm.faces.new(q)
            for loop in f.loops:
                loop[self.col] = (*color, 1)

    def marigold(self, center, radius, hue):
        """A marigold head: rings of ruffled petals packed into a dome."""
        center = Vector(center)
        count = int(160 * (radius / 0.03) ** 2)
        golden = math.pi * (3 - math.sqrt(5))
        for k in range(count):
            z = 1 - (k / (count - 1)) * 1.25
            if z < -0.25:
                break
            r = math.sqrt(max(0.0, 1 - z * z))
            a = golden * k
            d = Vector((math.cos(a) * r, math.sin(a) * r, z)).normalized()
            d += Vector((rng.uniform(-0.25, 0.25), rng.uniform(-0.25, 0.25), rng.uniform(-0.2, 0.2)))
            d.normalize()
            side = d.cross(Vector((0, 0, 1)))
            if side.length < 1e-3:
                side = Vector((1, 0, 0))
            side = (side.normalized() * math.cos(rng.uniform(0, 3)) + d.cross(side).normalized() * 0.5).normalized()
            shade = rng.uniform(0.75, 1.05)
            inner = 1 - 0.35 * max(0.0, z)
            color = (hue[0] * shade, hue[1] * shade * inner, hue[2] * shade)
            base = center + d * radius * 0.35
            self.card(base, d, side, radius * rng.uniform(0.6, 0.8), radius * 0.22, color, curl=rng.uniform(-0.3, 0.4), segs=2)

    def leaf(self, base, direction, up, length, width, color=(0.05, 0.2, 0.02), curl=0.15):
        direction = Vector(direction).normalized()
        side = direction.cross(Vector(up)).normalized()
        self.card(Vector(base), direction, side, length, width, color, curl=curl, segs=6)

    def loose_petal(self, pos, color, size=0.012):
        a = rng.uniform(0, 2 * math.pi)
        along = Vector((math.cos(a), math.sin(a), 0.05))
        side = Vector((-math.sin(a), math.cos(a), 0))
        self.card(Vector(pos), along, side, size, size * 0.45, color, curl=0.35, segs=2)

    def build(self):
        return mesh_object(self.name, self.bm, self.mat)


MARIGOLD_ORANGE = (1.0, 0.24, 0.0)
MARIGOLD_YELLOW = (1.0, 0.58, 0.0)
ROSE = (0.55, 0.0, 0.03)


def garland(petals, a, b, sag, radius, every=1.6):
    """A string of marigolds hanging between two points, alternating colours like the market ones."""
    a, b = Vector(a), Vector(b)
    length = (b - a).length
    n = max(2, int(length / (radius * every)))
    for i in range(n):
        t = (i + 0.5) / n
        p = a.lerp(b, t)
        p.z -= 4 * sag * t * (1 - t)
        petals.marigold(p, radius, MARIGOLD_ORANGE if (i // 3) % 2 == 0 else MARIGOLD_YELLOW)


def flame(location, height=0.03, light=8.0):
    """A wick flame plus the small light it throws."""
    prof = [(0.0, 0.0), (0.004, 0.002), (0.0065, height * 0.3), (0.005, height * 0.65), (0.0, height)]
    f = lathe("Flame", prof, flame_material(), segments=24, subsurf=1, location=location)
    f.visible_shadow = False
    l = bpy.data.lights.new("FlameLight", "POINT")
    l.color = (1.0, 0.55, 0.2)
    l.energy = light
    l.shadow_soft_size = 0.008
    lo = link(bpy.data.objects.new("FlameLight", l))
    lo.location = Vector(location) + Vector((0, 0, height * 0.4))
    return f


def bokeh_lights(center, width, height, count, color=(1.0, 0.7, 0.35), strength=40, radius=0.01, rows=3):
    """Fairy lights far behind the subject, there only to turn into out-of-focus discs."""
    mat = emission("Fairy", color, strength)
    bm = bmesh.new()
    cx, cy, cz = center
    for r in range(rows):
        z0 = cz + height * (r / max(1, rows - 1) - 0.5)
        sag = rng.uniform(0.1, 0.35)
        for i in range(count):
            t = i / (count - 1)
            x = cx + width * (t - 0.5)
            z = z0 - 4 * sag * t * (1 - t) + rng.uniform(-0.02, 0.02)
            ret = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=radius)
            for v in ret["verts"]:
                v.co += Vector((x, cy + rng.uniform(-0.3, 0.3), z))
    ob = mesh_object("Fairy", bm, mat)
    ob.visible_shadow = False
    return ob


def camera(location, target, lens, fstop, focus, shift_x=0.0, shift_y=0.0):
    cd = bpy.data.cameras.new("Camera")
    cd.lens = lens
    cd.shift_x, cd.shift_y = shift_x, shift_y
    cd.dof.use_dof = True
    cd.dof.aperture_fstop = fstop
    cd.dof.aperture_blades = 9
    cd.dof.focus_distance = focus
    cam = link(bpy.data.objects.new("Camera", cd))
    cam.location = location
    direction = Vector(target) - Vector(location)
    cam.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    bpy.context.scene.camera = cam
    return cam


def world_color(color, strength=1.0):
    w = bpy.data.worlds.new("World")
    bpy.context.scene.world = w
    w.use_nodes = True
    bg = next(n for n in w.node_tree.nodes if n.type == "BACKGROUND")
    bg.inputs["Color"].default_value = (*color, 1)
    bg.inputs["Strength"].default_value = strength
    return w


def sun(direction_deg, color, strength, angle=1.0):
    l = bpy.data.lights.new("Sun", "SUN")
    l.color = color
    l.energy = strength
    l.angle = math.radians(angle)
    ob = link(bpy.data.objects.new("Sun", l))
    ob.rotation_euler = Euler([math.radians(a) for a in direction_deg])
    return ob


def area(location, target, size, color, energy):
    l = bpy.data.lights.new("Area", "AREA")
    l.size = size
    l.color = color
    l.energy = energy
    ob = link(bpy.data.objects.new("Area", l))
    ob.location = location
    ob.rotation_euler = (Vector(target) - Vector(location)).to_track_quat("-Z", "Y").to_euler()
    return ob


# --- the four scenes -----------------------------------------------------------------------------

MODELS = os.environ.get("SCENE_MODELS", "")


def scan(asset, location=(0, 0, 0), rot_z=0.0, scale=1.0, only=None, drop=()):
    """Places a Poly Haven scan (real size, glTF) under one empty so it moves as a unit."""
    before = set(bpy.data.objects)
    path = os.path.join(MODELS, asset, f"{asset}_2k.gltf")
    bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    for o in list(new):
        if (only and o.type == "MESH" and not any(k in o.name for k in only)) or any(k in o.name for k in drop):
            bpy.data.objects.remove(o)
    new = [o for o in bpy.data.objects if o not in before]
    root = link(bpy.data.objects.new(asset, None))
    for o in new:
        if o.parent is None:
            o.parent = root
    root.location = location
    root.rotation_euler = (0, 0, rot_z)
    root.scale = (scale, scale, scale)
    return root


def laddoo(name, center, radius, seed):
    """A boondi laddoo the way it is made: hundreds of tiny fried pearls pressed into a rough ball."""
    local = random.Random(seed)
    bm = bmesh.new()
    col = bm.loops.layers.color.new("Col")
    core = bmesh.ops.create_icosphere(bm, subdivisions=3, radius=radius * 0.86)
    for v in core["verts"]:
        v.co *= 1 + 0.06 * noise.noise(v.co * 60 + Vector((seed, 0, 0)))
        v.co += Vector(center)
    for f in bm.faces:
        for loop in f.loops:
            loop[col] = (0.75, 0.2, 0.0, 1)
    n = int(900 * (radius / 0.03) ** 2)
    golden = math.pi * (3 - math.sqrt(5))
    for k in range(n):
        z = 1 - 2 * (k + 0.5) / n
        r = math.sqrt(1 - z * z)
        a = golden * k
        d = Vector((r * math.cos(a), r * math.sin(a), z))
        d += Vector((local.uniform(-0.08, 0.08), local.uniform(-0.08, 0.08), local.uniform(-0.08, 0.08)))
        d.normalize()
        # Hand-rolled: a little flattened, a little lopsided.
        squash = Vector((1.0, 0.97, 0.9))
        pearl = local.uniform(0.0016, 0.0024) * radius / 0.03
        pos = Vector(center) + Vector((d.x * squash.x, d.y * squash.y, d.z * squash.z)) * radius * local.uniform(0.94, 1.02)
        ret = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=pearl)
        shade = local.choice(((0.95, 0.45, 0.0), (0.9, 0.36, 0.0), (1.0, 0.58, 0.03), (0.85, 0.3, 0.0)))
        for v in ret["verts"]:
            v.co += pos
        for f in {f for v in ret["verts"] for f in v.link_faces}:
            for loop in f.loops:
                loop[col] = (*shade, 1)
    return mesh_object(name, bm, laddoo_mat())


_LADDOO_MAT = []


def laddoo_mat():
    """Sugar-syrup gloss over fried gram flour."""
    if not _LADDOO_MAT:
        mat = new_mat("Boondi")
        n, l = nodes_of(mat)
        b = bsdf_of(mat)
        attr = n.new("ShaderNodeAttribute")
        attr.attribute_name = "Col"
        l.new(attr.outputs["Color"], b.inputs["Base Color"])
        b.inputs["Roughness"].default_value = 0.32
        b.inputs["Subsurface Weight"].default_value = 0.15
        b.inputs["Subsurface Radius"].default_value = (0.6, 0.25, 0.05)
        b.inputs["Subsurface Scale"].default_value = 0.002
        _LADDOO_MAT.append(mat)
    return _LADDOO_MAT[0]


def laddoo_material():
    """Boondi laddoo: tiny fried pearls of gram flour pressed into a ball, saffron-orange and glossy."""
    mat = solid("Laddoo", (0.8, 0.22, 0.004), rough=0.55)
    bsdf_of(mat).inputs["Specular IOR Level"].default_value = 0.25
    n, l = nodes_of(mat)
    vor = n.new("ShaderNodeTexVoronoi")
    vor.inputs["Scale"].default_value = 170
    vor.feature = "SMOOTH_F1"
    bump = n.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.35
    bump.invert = True
    l.new(vor.outputs["Distance"], bump.inputs["Height"])
    l.new(bump.outputs["Normal"], bsdf_of(mat).inputs["Normal"])
    return mat


def mango_leaves(petals, center, count, length, spread=0.8, lift=0.55, radius=0.05):
    for k in range(count):
        a = 2 * math.pi * k / count + rng.uniform(-0.15, 0.15)
        d = (math.cos(a) * spread, math.sin(a) * spread, lift)
        base = (center[0] + math.cos(a) * radius, center[1] + math.sin(a) * radius, center[2])
        petals.leaf(base, d, (0, 0, 1), length * rng.uniform(1.0, 1.2), length * 0.16,
                    color=(0.02, 0.11 + rng.uniform(-0.02, 0.02), 0.01), curl=-0.42)


def haldi():
    """4:30 pm. The courtyard floor, a brass urli of fresh turmeric paste, marigolds, low sun."""
    plane("Floor", 3, 3, pbr("Granite", "granite_tile", 0.7, tint=(1.0, 0.86, 0.7)))
    plane("Wall", 3, 2, pbr("Wall", "beige_wall_001", 0.5, tint=(0.98, 0.8, 0.5), sat=0.4),
          location=(0, 1.0, 1.5), rotation=(math.radians(90), 0, 0))
    scan("brass_pot_02", (0, 0, 0), rot_z=math.radians(12))
    paste = solid("Haldi", (0.6, 0.33, 0.0), rough=0.62, sss=0.15)
    bumpy(paste, 70, 0.7, detail=12)
    p = blob("Paste", 0.135, 0.42, paste, (0, 0, 0.055), roughness=0.16, seed=1, res=4)
    p.scale = (1.0, 0.82, 1.0)
    p.rotation_euler = (0, 0, math.radians(12))
    kumkum = bumpy(solid("Kumkum", (0.42, 0.0, 0.03), rough=1.0), 420, 1.0, detail=12)
    scan("brass_pan_01", (0.3, -0.17, 0), rot_z=math.radians(-40))
    blob("Kumkum", 0.065, 0.42, kumkum, (0.3, -0.12, 0.018), roughness=0.22, seed=2, res=4)
    for x, y, r in ((-0.3, -0.1, 0.4), (-0.36, 0.06, 2.1), (0.38, 0.17, 1.2)):
        scan("lemon", (x, y, 0.034), rot_z=r).rotation_euler = (math.radians(90), 0, r)
    petals = Petals("Marigolds", vertex_color_mat("Petal"))
    spots = [(0.22, 0.2), (0.12, -0.27), (-0.2, -0.24), (0.48, -0.02), (-0.46, -0.18), (-0.05, 0.32),
             (0.55, 0.3), (-0.58, 0.26), (0.33, 0.38), (-0.33, 0.4)]
    for i, (x, y) in enumerate(spots):
        petals.marigold((x, y, 0.026), rng.uniform(0.028, 0.036), MARIGOLD_ORANGE if i % 2 else MARIGOLD_YELLOW)
    for _ in range(520):
        r = rng.uniform(0.24, 1.0)
        a = rng.uniform(0, 2 * math.pi)
        c = MARIGOLD_ORANGE if rng.random() < 0.6 else MARIGOLD_YELLOW
        petals.loose_petal((math.cos(a) * r, math.sin(a) * r, 0.002), c, size=0.014)
    for k in range(6):
        a = math.radians(150 + k * 25)
        petals.leaf((math.cos(a) * 0.26, math.sin(a) * 0.26, 0.005), (math.cos(a), math.sin(a), 0.03), (0, 0, 1),
                    0.17, 0.03, color=(0.03, 0.16, 0.015), curl=0.05)
    for gx in (-0.75, -0.45, 0.6, 0.9):
        garland(petals, (gx, 0.95, 1.6), (gx, 0.95, 0.3), 0.0, 0.032, every=1.45)
    petals.build()
    # Late-afternoon sun low across the courtyard, the sky bouncing warm light into the shadows.
    world_color((1.0, 0.72, 0.45), 0.9)
    sun((80, 0, -58), (1.0, 0.6, 0.28), 13.0, angle=0.6)
    area((-1.2, -1.2, 0.8), (0, 0, 0), 1.5, (1.0, 0.85, 0.65), 25)
    camera((0.25, -1.0, 0.62), (0.05, 0.02, 0.04), 50, 2.8, 1.17, shift_x=-0.1)


def dhurrie():
    """A flat-woven cotton rug in madder, saffron and indigo bands."""
    rug = new_mat("Dhurrie")
    n, l = nodes_of(rug)
    b = bsdf_of(rug)
    coord = n.new("ShaderNodeTexCoord")
    wave = n.new("ShaderNodeTexWave")
    wave.bands_direction = "X"
    wave.inputs["Scale"].default_value = 7.0
    wave.inputs["Distortion"].default_value = 0.15
    l.new(coord.outputs["Object"], wave.inputs["Vector"])
    ramp = n.new("ShaderNodeValToRGB")
    ramp.color_ramp.interpolation = "CONSTANT"
    ramp.color_ramp.elements[0].color = (0.22, 0.015, 0.02, 1)
    ramp.color_ramp.elements[1].position = 0.86
    ramp.color_ramp.elements[1].color = (0.62, 0.36, 0.08, 1)
    e = ramp.color_ramp.elements.new(0.93)
    e.color = (0.04, 0.035, 0.12, 1)
    l.new(wave.outputs["Fac"], ramp.inputs["Fac"])
    l.new(ramp.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.95
    b.inputs["Sheen Weight"].default_value = 0.7
    weave = n.new("ShaderNodeTexBrick")
    weave.inputs["Scale"].default_value = 220
    bump = n.new("ShaderNodeBump")
    bump.inputs["Strength"].default_value = 0.25
    l.new(weave.outputs["Fac"], bump.inputs["Height"])
    l.new(bump.outputs["Normal"], b.inputs["Normal"])
    return rug


def ghungroo(center):
    """
    A dancer's ankle bells: four rows of small brass bells, each with its slit mouth and the loop it
    is sewn on by, stitched to a padded cotton strap with its tie cords loose on the rug.
    """
    cotton = solid("Strap", (0.32, 0.03, 0.04), rough=0.85)
    bsdf_of(cotton).inputs["Sheen Weight"].default_value = 0.8
    bumpy(cotton, 900, 0.25)
    bell = brass("BellBrass", 0.22)
    mouth = solid("Mouth", (0.006, 0.004, 0.003), rough=0.9)
    cord = solid("Cord", (0.85, 0.78, 0.6), rough=0.9)
    cx, cy, cz = center
    # A gentle S along the rug, the way a pair is dropped after practice.
    path = []
    for i in range(48):
        t = i / 47
        x = cx - 0.17 + 0.34 * t
        y = cy + 0.045 * math.sin(t * math.pi * 1.4) - 0.02
        path.append(Vector((x, y, cz)))
    width = 0.05
    bm = bmesh.new()
    rows = []
    for i, p0 in enumerate(path):
        d = (path[min(i + 1, len(path) - 1)] - path[max(i - 1, 0)]).normalized()
        side = d.cross(Vector((0, 0, 1))).normalized()
        ring = []
        for k in range(7):
            v = -1 + 2 * k / 6
            # Padded: thickest along the middle, stitched flat at the edges.
            h = 0.007 * (1 - v * v) + 0.0015
            ring.append(bm.verts.new(p0 + side * (v * width / 2) + Vector((0, 0, h))))
        rows.append(ring)
    for i in range(len(rows) - 1):
        for k in range(6):
            bm.faces.new((rows[i][k], rows[i][k + 1], rows[i + 1][k + 1], rows[i + 1][k]))
    mesh_object("Strap", bm, cotton, subsurf=1)

    bells, mouths = bmesh.new(), bmesh.new()
    radius = 0.0068
    for i in range(2, len(path) - 2, 1):
        d = (path[i + 1] - path[i - 1]).normalized()
        side = d.cross(Vector((0, 0, 1))).normalized()
        for r in range(4):
            v = -0.75 + r * 0.5
            p0 = path[i] + side * (v * width / 2) + d * (0.003 * (r % 2))
            p0 += Vector((rng.uniform(-0.0012, 0.0012), rng.uniform(-0.0012, 0.0012), 0.0085 + radius))
            ret = bmesh.ops.create_icosphere(bells, subdivisions=2, radius=radius)
            for vtx in ret["verts"]:
                vtx.co.z *= 0.92
                vtx.co += p0
            # The loop it hangs from.
            ret = bmesh.ops.create_icosphere(bells, subdivisions=1, radius=radius * 0.32)
            for vtx in ret["verts"]:
                vtx.co += p0 + Vector((0, 0, radius * 0.95))
            # The slit: a dark sliver cut across the lower half, turned a little at random.
            a = rng.uniform(0, math.pi)
            ax = Vector((math.cos(a), math.sin(a), 0))
            ret = bmesh.ops.create_cube(mouths, size=1.0)
            for vtx in ret["verts"]:
                c = vtx.co.copy()
                vtx.co = ax * (c.x * radius * 2.02) + ax.cross(Vector((0, 0, 1))) * (c.y * radius * 0.28)
                vtx.co.z = c.z * radius * 0.9 - radius * 0.45
                vtx.co += p0
    mesh_object("Bells", bells, bell)
    mesh_object("Mouths", mouths, mouth, smooth=False)
    for end_i, sign in ((0, -1), (len(path) - 1, 1)):
        a = path[end_i]
        pts = [a + Vector((sign * 0.04 * t, 0.03 * math.sin(t * 2.5) * sign, 0.002)) for t in (0, 0.5, 1, 1.5, 2)]
        cu = bpy.data.curves.new("Tie", "CURVE")
        cu.dimensions = "3D"
        cu.bevel_depth = 0.0018
        sp = cu.splines.new("POLY")
        sp.points.add(len(pts) - 1)
        for k, q in enumerate(pts):
            sp.points[k].co = (*q, 1)
        cu.materials.append(cord)
        link(bpy.data.objects.new("Tie", cu))


def sangeet():
    """7:30 pm on the terrace. Floor cushions, a lit brass lantern, the fairy lights just on."""
    plane("Floor", 4, 4, pbr("Tiles", "granite_tile", 0.5, tint=(0.5, 0.46, 0.44)))
    plane("Rug", 1.3, 0.9, dhurrie(), location=(0, 0.05, 0.003), rotation=(0, 0, math.radians(6)))
    scan("throw_pillows_01", (-0.1, 0.55, 0.003), rot_z=math.radians(-8))
    plane("Parapet", 4, 0.22, pbr("Parapet", "beige_wall_001", 0.5, tint=(0.9, 0.82, 0.75)),
          location=(0, 1.05, 0.22), rotation=(math.radians(90), 0, 0))
    ghungroo((0.06, -0.06, 0.0))
    scan("brass_vase_03", (-0.4, -0.05, 0.003), rot_z=0.5)
    petals = Petals("Marigolds", vertex_color_mat("Petal"))
    garland(petals, (-2.0, 1.04, 0.5), (2.0, 1.04, 0.5), 0.12, 0.034)
    for _ in range(220):
        c = MARIGOLD_ORANGE if rng.random() < 0.5 else ROSE
        petals.loose_petal((rng.uniform(-1.0, 1.0), rng.uniform(-0.7, 0.4), 0.005), c, size=0.014)
    petals.build()
    bokeh_lights((0, 3.5, 0.95), 8, 0.6, 30, rows=2, strength=14, radius=0.014)
    world_color((0.006, 0.014, 0.04), 1.0)
    area((-1.4, -0.8, 1.3), (0, 0.1, 0.1), 1.0, (1.0, 0.65, 0.38), 22)
    area((1.4, 2.4, 1.4), (0, 0.3, 0.2), 2.5, (0.45, 0.58, 1.0), 30)
    camera((0.2, -0.36, 0.16), (0.05, -0.02, 0.0), 50, 2.2, 0.36, shift_x=-0.1, shift_y=0.04)


def ceremony():
    """10:00 pm. The kalash between two brass lamps; the only light is the flames."""
    plane("Floor", 3, 3, pbr("Marble", "marble_01", 0.6, tint=(0.9, 0.82, 0.72)))
    scan("brass_pot_01", (0, 0, 0), rot_z=0.4)
    coconut = solid("Coconut", (0.3, 0.16, 0.06), rough=0.85)
    bumpy(coconut, 90, 0.6, detail=10)
    blob("Coconut", 0.06, 1.25, coconut, (0, 0, 0.345), roughness=0.05, seed=4)
    petals = Petals("Flowers", vertex_color_mat("Petal"))
    mango_leaves(petals, (0, 0, 0.3), 9, 0.15, radius=0.045)
    for k in range(12):
        a = 2 * math.pi * k / 12
        c = MARIGOLD_ORANGE if k % 2 else MARIGOLD_YELLOW
        petals.marigold((math.cos(a) * 0.1, math.sin(a) * 0.1, 0.29), 0.022, c)
    lamp = brass("LampBrass", 0.22)
    for x in (-0.46, 0.46):
        lathe(
            "Vilakku",
            [(0.0, 0.0), (0.13, 0.0), (0.13, 0.02), (0.09, 0.04), (0.03, 0.07), (0.022, 0.12), (0.03, 0.14),
             (0.018, 0.16), (0.016, 0.45), (0.03, 0.47), (0.02, 0.49), (0.11, 0.52), (0.12, 0.54), (0.1, 0.545),
             (0.03, 0.53), (0.02, 0.6), (0.035, 0.62), (0.0, 0.67)],
            lamp, location=(x, 0.1, 0),
        )
        for k in range(5):
            a = 2 * math.pi * k / 5 + 0.3
            flame((x + math.cos(a) * 0.1, 0.1 + math.sin(a) * 0.1, 0.548), height=0.032, light=3.5)
    clay = bumpy(solid("Clay", (0.42, 0.15, 0.06), rough=0.85), 80, 0.3)
    for i, x in enumerate((-0.3, -0.15, 0.15, 0.3)):
        y = -0.24 + 0.04 * (i % 2)
        lathe("Diya", [(0.0, 0.0), (0.025, 0.0), (0.042, 0.012), (0.046, 0.024), (0.04, 0.026), (0.03, 0.016),
                       (0.0, 0.014)], clay, location=(x, y, 0))
        flame((x + 0.03, y, 0.024), height=0.022, light=1.4)
    for _ in range(600):
        r = rng.uniform(0.18, 1.1)
        a = rng.uniform(0, 2 * math.pi)
        c = ROSE if rng.random() < 0.45 else (MARIGOLD_ORANGE if rng.random() < 0.6 else MARIGOLD_YELLOW)
        petals.loose_petal((math.cos(a) * r, math.sin(a) * r * 0.8 + 0.1, 0.002), c, size=0.014)
    for i in range(26):
        gx = -1.5 + i * 0.12
        garland(petals, (gx, 1.1, 2.0), (gx, 1.1, 0.15), 0.0, 0.032, every=1.45)
    petals.build()
    world_color((0.012, 0.008, 0.006), 1.0)
    area((0, 0.6, 1.8), (0, 1.1, 0.8), 1.5, (1.0, 0.6, 0.3), 30)
    camera((0.1, -1.35, 0.42), (0.0, 0.1, 0.3), 45, 2.2, 1.45, shift_x=-0.08)


def dinner():
    """11:00 pm. Laddoos for the send-off, bananas and pomegranates on brass, the hall still lit."""
    plane("Table", 2.5, 1.5, pbr("Table", "dark_wood", 1.0, tint=(0.72, 0.55, 0.45)))
    scan("brass_pot_02", (0.0, 0.0, 0.0), rot_z=math.radians(-8))
    ladoo = laddoo_material()
    spots = [(0.0, 0.0), (0.065, 0.02), (-0.065, -0.015), (0.03, -0.06), (-0.03, 0.06), (0.1, -0.04), (-0.1, 0.035)]
    for i, (x, y) in enumerate(spots):
        laddoo(f"Laddoo{i}", (x, y, 0.045), rng.uniform(0.029, 0.033), 30 + i)
    for i, (x, y) in enumerate(((0.02, 0.0), (-0.03, 0.03))):
        laddoo(f"LaddooTop{i}", (x, y, 0.1), rng.uniform(0.029, 0.033), 40 + i)
    scan("bananas", (-0.42, 0.12, 0), rot_z=math.radians(70), only=("bunch",))
    for i, (x, y) in enumerate(((0.36, 0.12), (0.47, -0.02))):
        scan("food_pomegranate_01", (x, y, 0), rot_z=i * 1.7)
    scan("brass_pan_01", (0.25, -0.24, 0), rot_z=math.radians(30))
    for i, (x, y) in enumerate(((0.25, -0.2), (0.27, -0.24))):
        laddoo(f"Bowl{i}", (x, y, 0.032), 0.027, 50 + i)
    scan("brass_vase_03", (-0.25, -0.3, 0), rot_z=0.2)
    petals = Petals("Marigolds", vertex_color_mat("Petal"))
    for _ in range(160):
        c = MARIGOLD_ORANGE if rng.random() < 0.6 else ROSE
        petals.loose_petal((rng.uniform(-0.8, 0.8), rng.uniform(-0.5, 0.4), 0.002), c, size=0.014)
    petals.build()
    bokeh_lights((0, 3.2, 1.3), 6, 1.1, 44, rows=3, strength=22)
    # Nearly midnight: the hall lights are down, one warm lamp over the table, cool night at the edges.
    world_color((0.004, 0.006, 0.014), 1.0)
    area((-0.35, -0.25, 0.9), (0, 0, 0), 0.35, (1.0, 0.66, 0.38), 5)
    area((1.2, 1.4, 0.9), (0, 0, 0), 1.6, (0.35, 0.48, 1.0), 16)
    camera((0.15, -0.95, 0.55), (0.0, 0.03, 0.05), 50, 2.4, 1.1, shift_x=-0.08)


SCENES = {"haldi": haldi, "sangeet": sangeet, "ceremony": ceremony, "dinner": dinner}


def render_settings():
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = "OPTIX"
    prefs.get_devices()
    for d in prefs.devices:
        d.use = d.type == "OPTIX"
    scene.cycles.device = "GPU"
    scene.cycles.samples = int(os.environ.get("SCENE_SAMPLES", "256"))
    scene.cycles.use_denoising = True
    scene.cycles.max_bounces = 8
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.resolution_percentage = int(os.environ.get("SCENE_PCT", "100"))
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.exposure = float(os.environ.get("SCENE_EXPOSURE", "0"))
    # Daylight scenes keep their colour under the bright sun with AgX's punchier look.
    look = os.environ.get("SCENE_LOOK")
    if look:
        try:
            scene.view_settings.look = look
        except TypeError as e:
            print("look unavailable:", e)


if __name__ == "__main__" or os.environ.get("SCENE"):
    reset()
    SCENES[os.environ.get("SCENE", "haldi")]()
    render_settings()
    if os.environ.get("SCENE_OUT"):
        bpy.context.scene.render.filepath = os.environ["SCENE_OUT"]
        bpy.ops.render.render(write_still=True)
