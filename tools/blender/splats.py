# Gaussian splats in Blender 5.3 or newer: load a scan, keep some splats, save it for the web.
#
# Blender 5.3 imports a 3DGS .ply as a point cloud with one point per splat:
#   position          FLOAT_VECTOR  x y z
#   rotation          QUATERNION    w x y z
#   scale             FLOAT_VECTOR  size of the splat in x y z (metres, not log)
#   radiance:base     FLOAT4        colour (spherical harmonics degree 0) and opacity 0..1
#   radiance:sh_0..   FLOAT_VECTOR  view-dependent colour, if the scan has it
# It can draw them (Solid, Material Preview, Rendered), but it can't save them. save() does.
# To turn or move the scan, turn or move the object: save() bakes that into the file.
# Don't use Apply Transform on splats: in Blender 5.3 it moves the points but doesn't turn the splats.
#
# In Blender, through the MCP (execute_blender_code), with absolute paths. Every call starts with
# fresh variables, but Blender keeps imported modules, so import this file once:
#   import sys; sys.path.append('/path/to/tools/blender'); import splats
#   scan = splats.load('/path/to/scan.ply')       # upside down? splats.load(path, flip=False)
# and in later calls:
#   import splats; scan = bpy.data.objects['scan']
#   p = splats.read(scan, 'position')                 # numpy array, one row per splat
#   splats.keep(scan, (abs(p) < 3).all(axis=1))       # keep only the splats inside a 6 m box
#   splats.save(scan, '/path/to/scan-clean.ply')

import bpy
import numpy as np
from mathutils import Matrix

WIDTH = {'FLOAT': 1, 'FLOAT_VECTOR': 3, 'FLOAT4': 4, 'QUATERNION': 4}

# Blender is z-up. Most scans, and the course's test splat, are stored y-down: that's why the
# viewer flips them (flip: true in src/config.js). load() flips the same way. A y-up file: flip=False.
Y_UP_TO_Z_UP = Matrix.Rotation(np.pi / 2, 4, 'X')


def load(path, flip=True):
    """Imports a .ply scan upright and returns the object, flipped like the viewer's flip setting.

    Only the object is turned, not the data. save() turns it back, so the file keeps its own up.
    """
    if flip:
        bpy.ops.wm.ply_import(filepath=path, forward_axis='Z', up_axis='NEGATIVE_Y')
    else:
        bpy.ops.wm.ply_import(filepath=path, forward_axis='NEGATIVE_Z', up_axis='Y')
    obj = bpy.context.selected_objects[0]
    obj['splats_axes'] = [value for row in obj.matrix_world for value in row]
    return obj


def read(obj, name):
    """One attribute as a numpy array with one row per splat, e.g. read(scan, 'position')."""
    attribute = obj.data.attributes[name]
    width = WIDTH[attribute.data_type]
    values = np.empty(len(obj.data.points) * width, np.float32)
    attribute.data.foreach_get(_field(attribute), values)
    return values.reshape(-1, width) if width > 1 else values


def keep(obj, mask):
    """Keeps only the splats where mask is True. Returns how many are left."""
    old = obj.data
    mask = np.asarray(mask, bool)
    new = bpy.data.pointclouds.new(old.name)
    new.type = old.type
    new.resize(int(mask.sum()))
    for attribute in old.attributes:
        if attribute.name.startswith('.') or attribute.data_type not in WIDTH:
            continue
        if attribute.name not in new.attributes:
            new.attributes.new(attribute.name, attribute.data_type, 'POINT')
        target = new.attributes[attribute.name]
        target.data.foreach_set(_field(target), read(obj, attribute.name)[mask].ravel())
    obj.data = new
    return int(mask.sum())


def save(obj, path):
    """Saves the splats as a standard 3DGS .ply that Spark, SuperSplat and others open.

    Moving, turning or scaling the object is baked into the file, with the same up as the scan
    it was loaded from. View-dependent colour (sh_0..) is not turned with the object.
    """
    cloud = obj.evaluated_get(bpy.context.evaluated_depsgraph_get())
    position, rotation, scale = read(cloud, 'position'), read(cloud, 'rotation'), read(cloud, 'scale')
    base = read(cloud, 'radiance:base')
    sh = []
    while f'radiance:sh_{len(sh)}' in cloud.data.attributes:
        sh.append(read(cloud, f'radiance:sh_{len(sh)}'))

    axes = Matrix([obj['splats_axes'][i:i + 4] for i in range(0, 16, 4)]) if 'splats_axes' in obj else Y_UP_TO_Z_UP
    matrix = axes.inverted() @ obj.matrix_world
    location, turn, size = matrix.decompose()
    position = position @ np.array(matrix.to_3x3(), np.float32).T + np.array(location, np.float32)
    rotation = _turn(np.array(turn, np.float32), rotation)
    scale = scale * (sum(size) / 3)

    opacity = np.clip(base[:, 3], 1e-6, 1 - 1e-6)
    names = ['x', 'y', 'z', 'f_dc_0', 'f_dc_1', 'f_dc_2']
    columns = [position, base[:, :3]]
    if sh:
        rest = np.stack(sh, axis=1)  # splats x coefficients x rgb; the file stores all red, then green, then blue
        names += [f'f_rest_{i}' for i in range(3 * len(sh))]
        columns += [rest[:, :, channel] for channel in range(3)]
    names += ['opacity', 'scale_0', 'scale_1', 'scale_2', 'rot_0', 'rot_1', 'rot_2', 'rot_3']
    columns += [np.log(opacity / (1 - opacity))[:, None], np.log(np.maximum(scale, 1e-12)), rotation]

    header = ['ply', 'format binary_little_endian 1.0', f'element vertex {len(position)}']
    header += [f'property float {name}' for name in names] + ['end_header', '']
    with open(path, 'wb') as file:
        file.write('\n'.join(header).encode())
        file.write(np.hstack(columns).astype('<f4').tobytes())
    return len(position)


def _field(attribute):
    return {'FLOAT': 'value', 'QUATERNION': 'value'}.get(attribute.data_type, 'vector')


def _turn(q, rotations):
    """Quaternion product q * r for every row r (w x y z)."""
    w, x, y, z = q
    a, b, c, d = rotations.T
    return np.stack([
        w * a - x * b - y * c - z * d,
        w * b + x * a + y * d - z * c,
        w * c - x * d + y * a + z * b,
        w * d + x * c - y * b + z * a,
    ], axis=1)
