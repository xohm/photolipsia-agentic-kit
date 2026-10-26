import test from 'node:test';
import assert from 'node:assert/strict';
import { Box3, Quaternion, Vector3 } from 'three';
import { rigPose } from '../src/vr.js';

// A splat 4 x 2 x 2 metres, largest dimension 4.
const BOX = new Box3(new Vector3(-2, -1, -1), new Vector3(2, 1, 1));
const POSE = { position: new Vector3(0, 3, 6), quaternion: new Quaternion() };

test('vrSize makes the splat look vrSize metres large: scale is largest / vrSize', () => {
  const result = rigPose(POSE, BOX, 2);
  // 4 / 2 = 2, not 2 / 4 = 0.5 (the wrong way round).
  assert.deepEqual(result.scale, new Vector3(2, 2, 2));
});

test('vrSize 0 keeps the file scale', () => {
  const result = rigPose(POSE, BOX, 0);
  assert.deepEqual(result.scale, new Vector3(1, 1, 1));
});

test('the rig starts where the desktop camera is', () => {
  const result = rigPose(POSE, BOX, 2);
  assert.deepEqual(result.position, new Vector3(0, 3, 6));
  assert.deepEqual(result.quaternion, new Quaternion());
});

test('a degenerate box (no size) gives scale 1 for any vrSize', () => {
  const result = rigPose(POSE, new Box3(), 2);
  assert.deepEqual(result.scale, new Vector3(1, 1, 1));
});
