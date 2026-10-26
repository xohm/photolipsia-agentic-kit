import { Box3, Vector3 } from 'three';

// The splat should fill about 70% of the window's shorter axis.
const FIT_MARGIN = 1 / 0.7;
const ELEVATION = 0.35; // radians above the horizon

// Points the camera at the splat's centre, slightly above, from a distance
// that makes the splat fill about 70% of the window.
export function frameCamera(camera, box) {
  const centre = new Vector3();
  const size = new Vector3();
  box.getCenter(centre);
  box.getSize(size);
  const radius = Math.max(size.x, size.y, size.z) * 0.5;
  const fov = (camera.fov * Math.PI) / 180;
  const distance = (radius / Math.sin(fov / 2)) * FIT_MARGIN;
  camera.position.set(
    centre.x,
    centre.y + distance * Math.sin(ELEVATION),
    centre.z + distance * Math.cos(ELEVATION),
  );
  camera.lookAt(centre);
  camera.near = Math.max(distance / 1000, 0.01);
  camera.far = distance * 20;
  camera.updateProjectionMatrix();
  return { centre, distance };
}

export function boundingBoxOf(splat) {
  return splat.getBoundingBox() ?? new Box3();
}

// Where this splat's data lives: the pager for a stream, the LoD levels for a
// lod build, or the plain splat list.
export function splatSourceOf(splat) {
  return splat.paged ?? splat.packedSplats?.lodSplats ?? splat.splats;
}

// A Box3 from the splat centres (up to maxSplats of them). For a stream this
// is the first splats that arrived; enough to frame the camera.
export function boxFromSplats(source, box = new Box3(), maxSplats = 50_000) {
  const centre = new Vector3();
  let count = 0;
  source.forEachSplat((index, center) => {
    if (count >= maxSplats) return;
    box.expandByPoint(centre.copy(center));
    count++;
  });
  return box;
}

// The splat's box: getBoundingBox() when it has content, otherwise the first
// splats (a stream or an empty box).
export function boxOfSplat(splat) {
  const box = boundingBoxOf(splat);
  if (!box.isEmpty()) return box;
  const source = splatSourceOf(splat);
  if (source) boxFromSplats(source, box);
  return box;
}
