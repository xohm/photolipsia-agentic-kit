import { Group, Vector3 } from 'three';
import { SparkXr } from '@sparkjsdev/spark';

// Pure helper for tests: the rig transform that makes the splat look vrSize
// metres large. Scaling the rig by s makes the world look 1/s as big, so the
// scale is largest / vrSize (largest = the splat's biggest dimension), not
// vrSize / largest. vrSize 0 keeps the file's own scale.
export function rigPose(pose, boundingBox, vrSize) {
  const size = new Vector3();
  boundingBox.getSize(size);
  const largest = Math.max(size.x, size.y, size.z);
  // An empty box (no size yet) must not scale the world to zero.
  const scale = vrSize > 0 && largest > 0 ? largest / vrSize : 1;
  return {
    position: pose.position.clone(),
    quaternion: pose.quaternion.clone(),
    scale: new Vector3(scale, scale, scale),
  };
}

// Enter VR button + camera rig. In VR the headset moves the camera inside the
// rig; the rig is moved, turned and scaled to place the viewer.
export function createVr({ view, controls, vrSize, getBoundingBox }) {
  const { renderer, scene, camera, setLoopHook, requestRender } = view;
  const rig = new Group();
  rig.add(camera);
  scene.add(rig);

  // The desktop view, restored when VR ends.
  const desktop = {
    position: camera.position.clone(),
    quaternion: camera.quaternion.clone(),
    target: controls.target.clone(),
  };

  function applyPose() {
    const box = getBoundingBox();
    if (!box) return;
    const pose = rigPose(desktop, box, vrSize);
    rig.position.copy(pose.position);
    rig.quaternion.copy(pose.quaternion);
    rig.scale.copy(pose.scale);
  }

  const sparkXr = new SparkXr({
    renderer,
    element: document.getElementById('enter-vr'),
    mode: 'vr',
    referenceSpaceType: 'local-floor',
    controllers: {},
    onEnterXr: () => {
      // Start where the desktop camera is.
      desktop.position.copy(camera.position);
      desktop.quaternion.copy(camera.quaternion);
      desktop.target.copy(controls.target);
      applyPose();
      controls.enabled = false;
      requestRender();
    },
    onExitXr: () => {
      rig.scale.set(1, 1, 1);
      rig.position.set(0, 0, 0);
      rig.quaternion.identity();
      camera.position.copy(desktop.position);
      camera.quaternion.copy(desktop.quaternion);
      controls.target.copy(desktop.target);
      controls.enabled = true;
      controls.update();
      requestRender();
    },
  });

  // In VR the head never stops moving, so render every frame. The loop only
  // draws when the hook says so or a render was requested.
  setLoopHook(() => {
    if (!renderer.xr.isPresenting) return false;
    sparkXr.updateControllers(camera);
    return true;
  });

  return {
    // Re-place the viewer when a different splat is loaded in VR.
    onSplatChanged() {
      if (!renderer.xr.isPresenting) return;
      applyPose();
      requestRender();
    },
  };
}
