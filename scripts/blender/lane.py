"""
Builds the hero scene in Blender: a narrow Indian residential lane at night, dressed for a wedding
with serial lights across the street and jhalar curtains down the house fronts.

Every bulb belongs to a Cycles light group, so one render gives a separate image per group. The
landing page adds those images back together in WebGL with time-varying weights: the lights chase
and twinkle, and the walls, wet road and haze brighten and dim with them, because the light spill
was path traced along with the bulbs.

Run inside Blender (5.x):  exec(open(r"<repo>/scripts/blender/lane.py").read())
Set TEX to the folder holding the Poly Haven 2k maps (see scripts/blender/README.md).
"""

import math
import os
import random

import bmesh
import bpy
from mathutils import Vector

TEX = os.environ.get("LANE_TEX", "")
SEED = 7
LANE_HALF = 3.0
DEPTH = 70.0

# Light groups: four chase phases for the strands across the street, two twinkle sets for the
# curtains, and everything that doesn't blink (sky, windows, the far street lamp).
CHASE = ["chase0", "chase1", "chase2", "chase3"]
CURTAIN = ["curtain0", "curtain1"]
AMBIENT = "ambient"

# Serial lights from a market stall: saturated LEDs plus warm white, never pastel.
STRAND_COLORS = [
    (1.0, 0.18, 0.05),
    (0.08, 1.0, 0.25),
    (0.15, 0.3, 1.0),
    (1.0, 0.55, 0.08),
    (1.0, 0.1, 0.45),
    (1.0, 0.78, 0.45),
]
# Jhalar curtains on houses are mostly warm white or amber.
CURTAIN_COLORS = {
    "warm": [(1.0, 0.72, 0.38), (1.0, 0.66, 0.3)],
    "amber": [(1.0, 0.45, 0.08), (1.0, 0.55, 0.15)],
    "gold": [(1.0, 0.6, 0.2), (1.0, 0.78, 0.45), (1.0, 0.5, 0.12)],
}
# Painted plaster the way lanes in Madurai or Jaipur actually look: faded, sun-bleached colours.
WALL_TINTS = [
    (0.93, 0.83, 0.62),
    (0.62, 0.82, 0.8),
    (0.95, 0.72, 0.68),
    (0.92, 0.9, 0.84),
    (0.98, 0.78, 0.45),
    (0.7, 0.74, 0.9),
    (0.85, 0.62, 0.48),
]
WALL_TEXTURES = ["beige_wall_001", "blue_plaster_weathered", "clay_plaster", "painted_plaster_wall"]

rand = random.Random(SEED)


# --- helpers -------------------------------------------------------------------------------------


def reset():
    """Clear the file in place (not factory settings, which would also unload add-ons)."""
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
    view_layer = bpy.context.scene.view_layers[0]
    for g in list(view_layer.lightgroups):
        view_layer.lightgroups.remove(g)


def link(obj, coll=None):
    (coll or bpy.context.scene.collection).objects.link(obj)
    return obj


def node(nodes, kind):
    return nodes.new(kind)


def principled(mat):
    return next(n for n in mat.node_tree.nodes if n.type == "BSDF_PRINCIPLED")


def tex_image(nodes, path, colorspace="sRGB"):
    n = node(nodes, "ShaderNodeTexImage")
    n.image = bpy.data.images.load(path, check_existing=True)
    n.image.colorspace_settings.name = colorspace
    return n


def box_mesh(name, size, location, mat=None):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=2.0)  # unit half-extents, scaled below
    for v in bm.verts:
        v.co = Vector((v.co.x * size[0], v.co.y * size[1], v.co.z * size[2]))
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    ob.location = location
    if mat:
        me.materials.append(mat)
    return ob


# --- materials -----------------------------------------------------------------------------------


def plaster_material(name, texture, tint):
    """Scanned plaster with a coat of paint: tint multiplies the scan, triplanar-free box mapping."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nodes, links = nt.nodes, nt.links
    bsdf = principled(mat)
    coord = node(nodes, "ShaderNodeTexCoord")
    mapping = node(nodes, "ShaderNodeMapping")
    mapping.inputs["Scale"].default_value = (0.5, 0.5, 0.5)
    links.new(coord.outputs["Object"], mapping.inputs["Vector"])
    diff = tex_image(nodes, os.path.join(TEX, f"{texture}_Diffuse.jpg"))
    rough = tex_image(nodes, os.path.join(TEX, f"{texture}_Rough.jpg"), "Non-Color")
    nor = tex_image(nodes, os.path.join(TEX, f"{texture}_nor_gl.jpg"), "Non-Color")
    for t in (diff, rough, nor):
        t.projection = "BOX"
        t.projection_blend = 0.25
        links.new(mapping.outputs["Vector"], t.inputs["Vector"])
    # Desaturate the scan, then paint it.
    hsv = node(nodes, "ShaderNodeHueSaturation")
    hsv.inputs["Saturation"].default_value = 0.25
    links.new(diff.outputs["Color"], hsv.inputs["Color"])
    paint = node(nodes, "ShaderNodeMix")
    paint.data_type = "RGBA"
    paint.blend_type = "MULTIPLY"
    paint.inputs["Factor"].default_value = 1.0
    paint.inputs["B"].default_value = (*tint, 1.0)
    links.new(hsv.outputs["Color"], paint.inputs["A"])
    # Grime gathers towards the ground.
    sep = node(nodes, "ShaderNodeSeparateXYZ")
    links.new(coord.outputs["Object"], sep.inputs["Vector"])
    noise = node(nodes, "ShaderNodeTexNoise")
    noise.inputs["Scale"].default_value = 1.2
    links.new(coord.outputs["Object"], noise.inputs["Vector"])
    grime = node(nodes, "ShaderNodeMapRange")
    grime.inputs["From Min"].default_value = -3.5
    grime.inputs["From Max"].default_value = -1.0
    links.new(sep.outputs["Z"], grime.inputs["Value"])
    grime_mix = node(nodes, "ShaderNodeMix")
    grime_mix.data_type = "RGBA"
    grime_mix.blend_type = "MULTIPLY"
    grime_mix.inputs["B"].default_value = (0.45, 0.4, 0.36, 1.0)
    inv = node(nodes, "ShaderNodeMath")
    inv.operation = "MULTIPLY"
    one_minus = node(nodes, "ShaderNodeMath")
    one_minus.operation = "SUBTRACT"
    one_minus.inputs[0].default_value = 1.0
    links.new(grime.outputs["Result"], one_minus.inputs[1])
    links.new(one_minus.outputs["Value"], inv.inputs[0])
    links.new(noise.outputs["Fac"], inv.inputs[1])
    links.new(inv.outputs["Value"], grime_mix.inputs["Factor"])
    links.new(paint.outputs["Result"], grime_mix.inputs["A"])
    links.new(grime_mix.outputs["Result"], bsdf.inputs["Base Color"])
    links.new(rough.outputs["Color"], bsdf.inputs["Roughness"])
    nmap = node(nodes, "ShaderNodeNormalMap")
    nmap.inputs["Strength"].default_value = 0.8
    links.new(nor.outputs["Color"], nmap.inputs["Color"])
    links.new(nmap.outputs["Normal"], bsdf.inputs["Normal"])
    return mat


def road_material():
    """Worn asphalt, damp from an evening wash: glossy puddles catch every bulb."""
    mat = bpy.data.materials.new("Road")
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    bsdf = principled(mat)
    coord = node(nodes, "ShaderNodeTexCoord")
    mapping = node(nodes, "ShaderNodeMapping")
    mapping.inputs["Scale"].default_value = (0.35, 0.35, 0.35)
    links.new(coord.outputs["Object"], mapping.inputs["Vector"])
    diff = tex_image(nodes, os.path.join(TEX, "asphalt_02_Diffuse.jpg"))
    rough = tex_image(nodes, os.path.join(TEX, "asphalt_02_Rough.jpg"), "Non-Color")
    nor = tex_image(nodes, os.path.join(TEX, "asphalt_02_nor_gl.jpg"), "Non-Color")
    for t in (diff, rough, nor):
        links.new(mapping.outputs["Vector"], t.inputs["Vector"])
    puddles = node(nodes, "ShaderNodeTexNoise")
    puddles.inputs["Scale"].default_value = 0.22
    puddles.inputs["Detail"].default_value = 6.0
    links.new(coord.outputs["Object"], puddles.inputs["Vector"])
    wet = node(nodes, "ShaderNodeMapRange")
    wet.inputs["From Min"].default_value = 0.48
    wet.inputs["From Max"].default_value = 0.56
    links.new(puddles.outputs["Fac"], wet.inputs["Value"])
    r_mix = node(nodes, "ShaderNodeMix")
    r_mix.inputs["B"].default_value = 0.04
    links.new(wet.outputs["Result"], r_mix.inputs["Factor"])
    links.new(rough.outputs["Color"], r_mix.inputs["A"])
    links.new(r_mix.outputs["Result"], bsdf.inputs["Roughness"])
    darken = node(nodes, "ShaderNodeMix")
    darken.data_type = "RGBA"
    darken.blend_type = "MULTIPLY"
    darken.inputs["B"].default_value = (0.45, 0.45, 0.45, 1)
    links.new(wet.outputs["Result"], darken.inputs["Factor"])
    links.new(diff.outputs["Color"], darken.inputs["A"])
    links.new(darken.outputs["Result"], bsdf.inputs["Base Color"])
    nmap = node(nodes, "ShaderNodeNormalMap")
    links.new(nor.outputs["Color"], nmap.inputs["Color"])
    n_mix = node(nodes, "ShaderNodeMix")
    n_mix.data_type = "VECTOR"
    links.new(wet.outputs["Result"], n_mix.inputs["Factor"])
    links.new(nmap.outputs["Normal"], n_mix.inputs[4])
    links.new(coord.outputs["Normal"], n_mix.inputs[5])
    links.new(n_mix.outputs[1], bsdf.inputs["Normal"])
    return mat


def flat_material(name, color, rough=0.6, metal=0.0):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    b = principled(mat)
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    return mat


def bulb_material(name, strength):
    """Tinted glass envelope around a bright filament: colour comes from the Col attribute."""
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    for n in list(nodes):
        nodes.remove(n)
    out = node(nodes, "ShaderNodeOutputMaterial")
    attr = node(nodes, "ShaderNodeAttribute")
    attr.attribute_name = "Col"
    emit = node(nodes, "ShaderNodeEmission")
    emit.inputs["Strength"].default_value = strength
    links.new(attr.outputs["Color"], emit.inputs["Color"])
    # An unlit bulb is still a bead of coloured glass that catches its neighbours' light.
    glass = node(nodes, "ShaderNodeBsdfPrincipled")
    glass.inputs["Roughness"].default_value = 0.08
    glass.inputs["Coat Weight"].default_value = 1.0
    tint = node(nodes, "ShaderNodeMix")
    tint.data_type = "RGBA"
    tint.blend_type = "MULTIPLY"
    tint.inputs["Factor"].default_value = 1.0
    tint.inputs["B"].default_value = (0.35, 0.35, 0.35, 1)
    links.new(attr.outputs["Color"], tint.inputs["A"])
    links.new(tint.outputs["Result"], glass.inputs["Base Color"])
    add = node(nodes, "ShaderNodeAddShader")
    links.new(emit.outputs["Emission"], add.inputs[0])
    links.new(glass.outputs["BSDF"], add.inputs[1])
    links.new(add.outputs["Shader"], out.inputs["Surface"])
    return mat


def emission_material(name, color, strength):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    nodes, links = mat.node_tree.nodes, mat.node_tree.links
    for n in list(nodes):
        nodes.remove(n)
    out = node(nodes, "ShaderNodeOutputMaterial")
    emit = node(nodes, "ShaderNodeEmission")
    emit.inputs["Color"].default_value = (*color, 1)
    emit.inputs["Strength"].default_value = strength
    links.new(emit.outputs["Emission"], out.inputs["Surface"])
    return mat


# --- geometry ------------------------------------------------------------------------------------


class Bulbs:
    """Collects bulbs into one mesh per light group, colour per vertex."""

    def __init__(self):
        self.groups = {}

    def add(self, group, pos, color, radius):
        self.groups.setdefault(group, []).append((pos, color, radius))

    def build(self, mat, coll):
        for group, items in self.groups.items():
            bm = bmesh.new()
            col = bm.loops.layers.color.new("Col")
            for pos, color, radius in items:
                ret = bmesh.ops.create_icosphere(bm, subdivisions=1, radius=radius)
                # Rice bulbs are a little longer than they are wide, and hang from the wire.
                for v in ret["verts"]:
                    v.co.z *= 1.5
                    v.co += Vector(pos)
                faces = {f for v in ret["verts"] for f in v.link_faces}
                for f in faces:
                    for loop in f.loops:
                        loop[col] = (*color, 1.0)
            me = bpy.data.meshes.new(f"Bulbs_{group}")
            bm.to_mesh(me)
            bm.free()
            # One material per group, so a bake can switch groups on and off independently.
            me.materials.append(mat.copy())
            ob = link(bpy.data.objects.new(f"Bulbs_{group}", me), coll)
            ob.lightgroup = group
            ob.visible_shadow = False


def catenary(a, b, sag, t):
    p = a.lerp(b, t)
    p.z -= 4 * sag * t * (1 - t)
    return p


def wire(name, points, radius, mat, coll):
    cu = bpy.data.curves.new(name, "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = radius
    cu.bevel_resolution = 1
    sp = cu.splines.new("POLY")
    sp.points.add(len(points) - 1)
    for i, p in enumerate(points):
        sp.points[i].co = (*p, 1)
    ob = link(bpy.data.objects.new(name, cu), coll)
    cu.materials.append(mat)
    return ob


def build():
    reset()
    scene = bpy.context.scene
    coll = scene.collection
    view_layer = scene.view_layers[0]
    for g in CHASE + CURTAIN + [AMBIENT]:
        view_layer.lightgroups.add(name=g)

    walls = [
        plaster_material(f"Wall{i}", WALL_TEXTURES[i % len(WALL_TEXTURES)], tint)
        for i, tint in enumerate(WALL_TINTS)
    ]
    trim = flat_material("Trim", (0.55, 0.52, 0.48), 0.8)
    dark = flat_material("Opening", (0.012, 0.01, 0.01), 0.9)
    iron = flat_material("Iron", (0.03, 0.03, 0.035), 0.45, 0.6)
    cable = flat_material("Cable", (0.01, 0.01, 0.01), 0.5)
    shutter = flat_material("Shutter", (0.07, 0.08, 0.085), 0.55, 0.7)
    sn, sl = shutter.node_tree.nodes, shutter.node_tree.links
    ribs = node(sn, "ShaderNodeTexWave")
    ribs.bands_direction = "Z"
    ribs.inputs["Scale"].default_value = 12.0
    rib_bump = node(sn, "ShaderNodeBump")
    rib_bump.inputs["Strength"].default_value = 0.4
    sl.new(ribs.outputs["Fac"], rib_bump.inputs["Height"])
    sl.new(rib_bump.outputs["Normal"], principled(shutter).inputs["Normal"])
    window_warm = emission_material("WindowWarm", (1.0, 0.62, 0.3), 2.2)
    window_cool = emission_material("WindowCool", (0.75, 0.85, 1.0), 1.2)
    road = road_material()

    # Road and a kerb-less concrete edge on either side, like most residential lanes.
    me = bpy.data.meshes.new("Road")
    bm = bmesh.new()
    bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=1)
    # Real dimensions in the mesh, not the object scale, so the texture keeps its proportions.
    for v in bm.verts:
        v.co.x *= 12
        v.co.y *= DEPTH
    bm.to_mesh(me)
    bm.free()
    ground = link(bpy.data.objects.new("Road", me), coll)
    ground.location = (0, -DEPTH / 2 + 8, 0)
    me.materials.append(road)

    # Houses on both sides.
    for side in (-1, 1):
        y = 6.0
        k = 0
        while y > -DEPTH:
            front = rand.uniform(3.2, 6.0)
            floors = rand.choice([2, 2, 3, 3, 3, 4])
            floor_h = rand.uniform(2.9, 3.4)
            height = floors * floor_h + rand.uniform(0.4, 1.2)
            setback = rand.uniform(0.0, 0.35)
            depth = 8.0
            x_face = side * (LANE_HALF + setback)
            cy = y - front / 2
            mat = walls[(k * 3 + (side > 0) * 2) % len(walls)]
            house = link(
                box_mesh(
                    f"House{side}_{k}",
                    (depth / 2, front / 2 - 0.04, height / 2),
                    (x_face + side * depth / 2, cy, height / 2),
                    mat,
                ),
                coll,
            )
            house.name = f"House{side}_{k}"
            # Floor ledges (chajja): the strongest cue in the facade, they catch the light.
            for f in range(1, floors + 1):
                if rand.random() < 0.2:
                    continue
                z = f * floor_h - 0.15
                link(
                    box_mesh(
                        "Ledge",
                        (0.32, front / 2 - 0.02, 0.06),
                        (x_face - side * 0.3, cy, z),
                        trim,
                    ),
                    coll,
                )
            # Parapet on the roof.
            link(
                box_mesh(
                    "Parapet", (0.12, front / 2, 0.45), (x_face - side * 0.06, cy, height + 0.45), mat
                ),
                coll,
            )
            # Windows and doors.
            for f in range(floors):
                base = f * floor_h
                n_win = max(1, int(front // 1.9))
                for w in range(n_win):
                    wy = y - front * (w + 0.5) / n_win
                    if f == 0 and w == 0 and front > 3.5:
                        # A rolling shutter shop front or a door at street level.
                        link(
                            box_mesh(
                                "Shutter", (0.03, 0.9, 1.15), (x_face - side * 0.02, wy, 1.15), shutter
                            ),
                            coll,
                        )
                        continue
                    wz = base + 1.55
                    lit = rand.random() < 0.38
                    pane_mat = (window_warm if rand.random() < 0.8 else window_cool) if lit else dark
                    pane = link(
                        box_mesh("Pane", (0.02, 0.5, 0.65), (x_face + side * 0.08, wy, wz), pane_mat),
                        coll,
                    )
                    if lit:
                        pane.lightgroup = AMBIENT
                    # Recessed frame.
                    for dz in (-0.7, 0.7):
                        link(
                            box_mesh("Sill", (0.1, 0.62, 0.05), (x_face - side * 0.05, wy, wz + dz), trim),
                            coll,
                        )
                    # Grille bars.
                    for b in range(-3, 4):
                        link(
                            box_mesh(
                                "Bar", (0.01, 0.01, 0.65), (x_face - side * 0.02, wy + b * 0.14, wz), iron
                            ),
                            coll,
                        )
                    # A small balcony on some upper floors.
                    if f > 0 and rand.random() < 0.3:
                        link(
                            box_mesh(
                                "Balcony", (0.5, 0.9, 0.06), (x_face - side * 0.5, wy, base + 0.1), trim
                            ),
                            coll,
                        )
                        for b in range(-6, 7):
                            link(
                                box_mesh(
                                    "Rail",
                                    (0.012, 0.012, 0.45),
                                    (x_face - side * 0.98, wy + b * 0.15, base + 0.55),
                                    iron,
                                ),
                                coll,
                            )
            y -= front
            k += 1

    # The lane turns at the far end: a building closes the view, a few windows still lit.
    end_mat = walls[2]
    end_glow = emission_material("EndWindow", (1.0, 0.6, 0.28), 0.35)
    link(box_mesh("EndHouse", (LANE_HALF + 4, 3, 6), (0, -DEPTH - 1, 6), end_mat), coll)
    for wx in (-2.2, -0.6, 1.0, 2.4):
        for wz in (1.6, 4.7, 7.8):
            if rand.random() < 0.45:
                pane = link(box_mesh("EndPane", (0.45, 0.02, 0.6), (wx, -DEPTH + 2.02, wz), end_glow), coll)
                pane.lightgroup = AMBIENT

    bulbs = Bulbs()

    # Strands of serial lights across the street, zig-zagging and sagging like the real thing.
    y = 3.0
    i = 0
    while y > -DEPTH + 10:
        za = rand.uniform(5.2, 6.6)
        zb = za + rand.uniform(-0.7, 0.7)
        a = Vector((-LANE_HALF + 0.05, y, za))
        b = Vector((LANE_HALF - 0.05, y + rand.uniform(-2.2, 2.2), zb))
        sag = rand.uniform(0.7, 1.3)
        pts = [catenary(a, b, sag, t / 40) for t in range(41)]
        wire(f"Strand{i}", pts, 0.0035, cable, coll)
        count = int((b - a).length / 0.1)
        for n in range(count):
            p = catenary(a, b, sag, (n + 0.5) / count)
            p.z -= 0.025
            # A few dead bulbs in every strand, as there always are.
            if rand.random() < 0.04:
                continue
            color = STRAND_COLORS[(n + i) % len(STRAND_COLORS)]
            bulbs.add(CHASE[n % 4], p, color, 0.011)
        y -= rand.uniform(2.6, 4.0)
        i += 1

    # Jhalar curtains down a few house fronts.
    curtains = [h for h in coll.objects if h.name.startswith("House") and -45 < h.location.y < 3]
    rand.shuffle(curtains)
    palettes = list(CURTAIN_COLORS)
    for c, h in enumerate(curtains[:9]):
        side = 1 if h.location.x > 0 else -1
        half = h.dimensions.y / 2
        x = h.location.x - side * (h.dimensions.x / 2 + 0.08)
        top = h.dimensions.z - 0.1
        colors = CURTAIN_COLORS[palettes[c % len(palettes)]]
        bottom_base = rand.uniform(1.2, 2.6)
        n_strings = int(h.dimensions.y / 0.16)
        for s in range(n_strings):
            sy = h.location.y + half - (s + 0.5) * (2 * half / n_strings)
            bottom = bottom_base + rand.uniform(-0.25, 0.25)
            wire(
                "Jhalar",
                [Vector((x, sy, top)), Vector((x + side * 0.01, sy, bottom))],
                0.002,
                cable,
                coll,
            )
            z = top - rand.uniform(0, 0.1)
            while z > bottom:
                if rand.random() > 0.05:
                    bulbs.add(
                        CURTAIN[rand.random() < 0.5],
                        (x, sy + rand.uniform(-0.01, 0.01), z),
                        rand.choice(colors),
                        0.009,
                    )
                z -= 0.14

    # Overhead power and cable TV lines, the tangle every lane has.
    for w in range(14):
        ya = rand.uniform(-DEPTH + 5, 4)
        yb = ya + rand.uniform(-6, 6)
        za = rand.uniform(6.5, 8.5)
        a = Vector((-LANE_HALF - 0.2, ya, za))
        b = Vector((LANE_HALF + 0.2, yb, za + rand.uniform(-0.5, 0.5)))
        pts = [catenary(a, b, rand.uniform(0.2, 0.8), t / 20) for t in range(21)]
        wire("Overhead", pts, rand.uniform(0.006, 0.012), cable, coll)
    for w in range(6):
        side = rand.choice([-1, 1])
        x = side * (LANE_HALF - 0.3)
        ya = rand.uniform(-DEPTH + 5, 0)
        pts = [
            Vector((x, ya - t * 0.5, 7.3 - 0.12 * math.sin(math.pi * (t % 6) / 6))) for t in range(37)
        ]
        wire("Along", pts, 0.01, cable, coll)

    bulbs.build(bulb_material("Bulb", 60.0), coll)

    # A far sodium street lamp: the only light in the lane that isn't for the wedding.
    lamp = bpy.data.lights.new("Sodium", "POINT")
    lamp.color = (1.0, 0.55, 0.22)
    lamp.energy = 350
    lamp.shadow_soft_size = 0.15
    lamp_ob = link(bpy.data.objects.new("Sodium", lamp), coll)
    lamp_ob.location = (2.4, -48, 6.2)
    lamp_ob.lightgroup = AMBIENT

    # Night sky with a hint of city glow, and a thin haze so bulbs read through the air.
    world = bpy.data.worlds.new("Night")
    scene.world = world
    world.use_nodes = True
    wn, wl = world.node_tree.nodes, world.node_tree.links
    bg = next(n for n in wn if n.type == "BACKGROUND")
    sky = node(wn, "ShaderNodeTexGradient")
    coord = node(wn, "ShaderNodeTexCoord")
    sep = node(wn, "ShaderNodeSeparateXYZ")
    wl.new(coord.outputs["Generated"], sep.inputs["Vector"])
    ramp = node(wn, "ShaderNodeValToRGB")
    ramp.color_ramp.elements[0].position = 0.5
    ramp.color_ramp.elements[0].color = (0.012, 0.011, 0.025, 1)
    ramp.color_ramp.elements[1].position = 0.75
    ramp.color_ramp.elements[1].color = (0.002, 0.003, 0.01, 1)
    wl.new(sep.outputs["Z"], ramp.inputs["Fac"])
    wl.new(ramp.outputs["Color"], bg.inputs["Color"])
    bg.inputs["Strength"].default_value = 1.0
    world.lightgroup = AMBIENT
    del sky

    haze = bpy.data.materials.new("Haze")
    haze.use_nodes = True
    hn, hl = haze.node_tree.nodes, haze.node_tree.links
    for n in list(hn):
        hn.remove(n)
    hout = node(hn, "ShaderNodeOutputMaterial")
    scatter = node(hn, "ShaderNodeVolumeScatter")
    scatter.inputs["Density"].default_value = 0.005
    scatter.inputs["Anisotropy"].default_value = 0.6
    hl.new(scatter.outputs["Volume"], hout.inputs["Volume"])
    # Volumetric haze is slow to bake per light group; the page adds a cheaper glow instead.
    if os.environ.get("LANE_HAZE"):
        vol = link(
            box_mesh("Haze", (LANE_HALF + 0.5, DEPTH / 2 + 4, 6), (0, -DEPTH / 2 + 4, 6), haze), coll
        )
        vol.visible_shadow = False

    # Camera: eye level, a fast 35mm, focused on the nearest strand so the far ones turn to bokeh.
    cam_data = bpy.data.cameras.new("Camera")
    cam_data.lens = 30
    cam_data.shift_x = -0.11
    cam_data.shift_y = 0.12
    cam_data.dof.use_dof = True
    cam_data.dof.focus_distance = 6.0
    cam_data.dof.aperture_fstop = 1.4
    cam_data.dof.aperture_blades = 7
    cam = link(bpy.data.objects.new("Camera", cam_data), coll)
    cam.location = (-0.4, 7.5, 1.65)
    cam.rotation_euler = (math.radians(92), 0, math.radians(180 - 1.5))
    if os.environ.get("LANE_CAM") == "midnight":
        # The closing shot: standing under the strands looking up, every bulb lit and out of focus,
        # so the end of the page is not a repeat of its opening.
        cam.location = (0.6, -2.0, 1.4)
        cam.rotation_euler = (math.radians(128), 0, math.radians(180 + 4))
        cam_data.lens = 24
        cam_data.shift_x, cam_data.shift_y = -0.08, 0.0
        cam_data.dof.focus_distance = 1.6
        cam_data.dof.aperture_fstop = 1.4
    scene.camera = cam

    # Render settings.
    scene.render.engine = "CYCLES"
    prefs = bpy.context.preferences.addons["cycles"].preferences
    prefs.compute_device_type = "OPTIX"
    prefs.get_devices()
    for d in prefs.devices:
        d.use = d.type == "OPTIX"
    scene.cycles.device = "GPU"
    scene.cycles.samples = 256
    scene.cycles.use_denoising = True
    scene.cycles.light_sampling_threshold = 0.005
    scene.cycles.max_bounces = 6
    scene.cycles.volume_bounces = 1
    scene.cycles.volume_step_rate = 4.0
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.view_settings.view_transform = "AgX"
    scene.view_settings.exposure = -1.6
    view_layer.cycles.denoising_store_passes = True
    print("built", len(bpy.data.objects), "objects;", {g: len(v) for g, v in bulbs.groups.items()})


build()

def emitters():
    """Everything that gives off light, with the group it belongs to and how to set its level."""
    out = []
    for ob in bpy.data.objects:
        if ob.name.startswith("Bulbs_"):
            emit = next(n for n in ob.data.materials[0].node_tree.nodes if n.type == "EMISSION")
            out.append((ob.lightgroup, emit.inputs["Strength"]))
    for name in ("WindowWarm", "WindowCool", "EndWindow"):
        emit = next(n for n in bpy.data.materials[name].node_tree.nodes if n.type == "EMISSION")
        out.append((AMBIENT, emit.inputs["Strength"]))
    bg = next(n for n in bpy.context.scene.world.node_tree.nodes if n.type == "BACKGROUND")
    out.append((AMBIENT, bg.inputs["Strength"]))
    return out


def bake(folder):
    """
    One render per light group with every other group switched off. Light adds linearly, so the
    layers sum back to the full scene, and each one is denoised on its own by Cycles.
    """
    scene = bpy.context.scene
    lamp = bpy.data.lights["Sodium"]
    lamp_energy = lamp.energy
    levels = [(g, socket, socket.default_value) for g, socket in emitters()]
    scene.render.image_settings.file_format = "OPEN_EXR"
    scene.render.image_settings.color_depth = "16"
    for group in CHASE + CURTAIN + [AMBIENT]:
        for g, socket, value in levels:
            socket.default_value = value if g == group else 0.0
        lamp.energy = lamp_energy if group == AMBIENT else 0.0
        scene.render.filepath = os.path.join(folder, f"{group}.exr")
        bpy.ops.render.render(write_still=True)
        print("baked", group, flush=True)
    for g, socket, value in levels:
        socket.default_value = value
    lamp.energy = lamp_energy


if os.environ.get("LANE_BAKE"):
    scene = bpy.context.scene
    scene.cycles.samples = int(os.environ.get("LANE_SAMPLES", "384"))
    scene.render.resolution_percentage = int(os.environ.get("LANE_PCT", "100"))
    bake(os.environ["LANE_BAKE"])

# Headless preview:  LANE_PREVIEW=out.png blender -b -P scripts/blender/lane.py
if os.environ.get("LANE_PREVIEW"):
    scene = bpy.context.scene
    scene.cycles.samples = int(os.environ.get("LANE_SAMPLES", "96"))
    scene.render.resolution_percentage = int(os.environ.get("LANE_PCT", "100"))
    scene.render.filepath = os.environ["LANE_PREVIEW"]
    bpy.ops.render.render(write_still=True)
