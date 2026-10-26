import { Quaternion } from 'three';

// The two orientations: upside down (Spark's usual import) or flipped 180°.
const UPSIDE_DOWN = new Quaternion();
const FLIPPED = new Quaternion(1, 0, 0, 0);

export function applyOrientation(splat, flipped) {
  splat.quaternion.copy(flipped ? FLIPPED : UPSIDE_DOWN);
}

export function isFlipKey(event) {
  return event.key === 'f' || event.key === 'F';
}
