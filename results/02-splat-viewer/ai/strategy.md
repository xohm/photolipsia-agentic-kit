# Strategy
## Goal
A full-window browser viewer for my own Gaussian splat file, built with three.js and Spark.
## Plan
- [x] 1. Scaffold: full-window canvas, WebGLRenderer with `antialias: false`, SparkRenderer in the scene, render only on dirty/resize, `window.__APP_READY__` after the first frame, `__APP_ERROR__` on failure.
- [x] 2. Load the test splat `public/splats/test.ply`: fetch with GET, verify status and content type (Vite serves index.html with 200 for missing files), pass bytes as `new SplatMesh({ fileBytes, fileName })`, await `initialized`, flip with `splat.quaternion.set(1, 0, 0, 0)`, frame the camera from `splat.getBoundingBox()`.
- [x] 3. Load my own splat file via `?file=` URL parameter (same fetch-and-bytes path, same flip handling); never open the files themselves, verify only via the running app and check report.
- [x] 4. Camera controls: OrbitControls from `three/addons`, render on `change`, sensible initial framing and limits.
- [x] 5. Orientation toggle: pressing F flips between the default orientation and the flipped quaternion, re-render on keypress.
- [x] 6. Checks: app checks for every visible feature (test splat drawn, orbit works, toggle works), keep `npm run check` fast with on-demand rendering.
- [x] 7. Open file: button + drag & drop so any splat file on the computer can be viewed without copying it into the project; validate the name, keep the current splat on failure.
- [x] 8. VR: "Enter VR" button with SparkXr that only appears when the browser can do VR; rig starts where the desktop camera is, splat shown about `vrSize` metres large, render every frame while presenting, controllers move the rig, desktop view restored on exit.
- [x] 9. Levels of detail for big scans: `SplatMesh({ lod: true })`, `?detail=` URL parameter to pick a splat budget, camera framing from the LoD splats, wait for the LoD build before declaring drawn.
## Decisions
- 2026-10-26 `npm test` was empty (no `tests/`), so I added unit tests for splat-choice (file resolution, format validation) because `npm test` must pass with real tests.
- 2026-10-26 One scene, one renderer; each job in its own small module (`renderer.js`, `controls.js`, `splat-loader.js`, `framing.js`, `orientation.js`, `message-view.js`, `config.js`) because AGENTS.md wants small files with one job.
- 2026-10-26 `?file=` URL parameter chooses the splat; empty/missing loads `test.ply` because the check needs a default.
- 2026-10-26 Fetch the splat bytes myself and reject `text/html` responses because Vite serves index.html with status 200 for missing public/ files.
- 2026-10-26 Press F to flip orientation (180° around X) because the test splat loads upside down and there is no visible UI yet.
- 2026-10-26 Wait until Spark finishes sorting (`activeSplats > 0`, not `sorting`, not `sortDirty`) before `__APP_READY__ = true` because early frames can be empty.
- 2026-10-26 FLIP_UPSIDE_DOWN default true (startup value, F toggles live) because the first check screenshot showed the flipped-off orientation: blue on top, yellow at the bottom.
- 2026-10-26 Camera framing: position along the splat's bounding box diagonal, target = box center, near/far = 1% and 100x of that distance, so any splat fits on screen.
- 2026-10-26 Open-file failures keep the current splat and show the message on the page because a failed pick should not blank the viewer.
- 2026-10-26 VR rig: camera lives in a `THREE.Group`; on enter, the rig copies the desktop camera pose, so VR starts where the desktop view was.
- 2026-10-26 Rig scale is `largest / vrSize` (largest dimension of the splat over the desired metres) because scaling the rig by s makes the world look 1/s as big — not `vrSize / largest`.
- 2026-10-26 `rigPose` is a pure function with unit tests because no check can see a wrong VR size without a headset.
- 2026-10-26 `VR_SIZE = 2` in `src/config.js`; 0 keeps the file's own scale, per the user's requirement.
- 2026-10-26 Fix: `rigPose` with an empty bounding box (largest = 0) returned scale 0 and would show nothing in VR; it now falls back to scale 1. Unit test added for the degenerate box because only the pure function can catch this without a headset.
- 2026-10-26 Render every frame only while `renderer.xr.isPresenting` (head never stops moving in VR) and keep on-demand rendering on desktop, because a permanent frame loop slows `npm run check`.
- 2026-10-26 App check: the Enter VR button must stay hidden in a headless browser without a headset, because SparkXr should only reveal it when WebXR is available.
- 2026-10-26 `?detail=` picks a splat budget (2 = twice as many) passed to `SparkRenderer({ lodSplatScale })` because ai/spark-facts.md says that is the only way to scale the LoD budget; unit-tested in splat-choice.
- 2026-10-26 After a lod load, wait until `packedSplats.lodSplats` has splats before framing, because right after `initialized` Spark still draws the plain splats and the build can swap them out mid-measurement.
- 2026-10-26 Fix: `waitUntilDrawn` requires the drawn state to hold across two polls because right after a splat swap the old splat's numbers could look drawn while the new one was still blank.
- 2026-10-26 A degenerate splat box (no size) falls back to scale 1 and `?detail=` falls back to the config default when invalid, because a bad file or URL must never blank the viewer.
## Next
- Nothing queued. Optional follow-ups: streamed `.rad` viewing (`paged: true`), a visible UI panel for the orientation toggle, verifying VR on a Quest (`npm run dev:vr`).
