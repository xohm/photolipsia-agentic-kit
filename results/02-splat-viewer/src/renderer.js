import { Color, PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { SparkRenderer } from '@sparkjsdev/spark';

export function createView(canvas, { onFirstRender = () => {}, lodSplatScale = 1 } = {}) {
  const renderer = new WebGLRenderer({ canvas, antialias: false });
  const scene = new Scene();
  scene.background = new Color('#101418');
  const camera = new PerspectiveCamera(60, 1, 0.01, 1000);
  camera.position.set(0, 0, 5);

  const spark = new SparkRenderer({ renderer, lodSplatScale, onDirty: requestRender });
  scene.add(spark);

  let renderQueued = false;
  let rendered = false;
  let frameHook = null;
  function render() {
    renderQueued = false;
    renderer.render(scene, camera);
    if (!rendered) {
      rendered = true;
      onFirstRender();
    }
  }
  function requestRender() {
    renderQueued = true;
  }
  // VR needs renderer.setAnimationLoop; the hook returns true when a frame
  // must be drawn regardless of the dirty flag (in VR, every frame).
  function tick() {
    if (renderQueued || frameHook?.() === true) render();
  }
  renderer.setAnimationLoop(tick);

  function resize() {
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight, false);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    requestRender();
  }
  window.addEventListener('resize', resize);
  resize();

  return { renderer, scene, camera, spark, requestRender, setLoopHook: (fn) => (frameHook = fn) };
}
