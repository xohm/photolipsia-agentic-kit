import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export function createControls(camera, canvas, requestRender) {
  const controls = new OrbitControls(camera, canvas);
  controls.addEventListener('change', requestRender);
  // Damping needs a frame loop, so keep it off; on-demand rendering only.
  controls.enableDamping = false;
  controls.update();
  return controls;
}
