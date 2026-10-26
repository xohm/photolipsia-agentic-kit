import { createView } from './renderer.js';
import { createControls } from './controls.js';
import { createVr } from './vr.js';
import { resolveSplatFile, resolveDetail, loadModeFor, validateSplatName, SPLATS_DIR } from './splat-choice.js';
import { fetchSplatBytes, addSplat } from './splat-loader.js';
import { frameCamera, boxOfSplat, boundingBoxOf } from './framing.js';
import { applyOrientation, isFlipKey } from './orientation.js';
import { showMessage, hideMessage } from './message-view.js';
import { createFileOpener } from './open-file.js';
import { SPLAT_FILE, FLIP_UPSIDE_DOWN, VR_SIZE, LOD, DETAIL } from './config.js';

const DRAWN_TIMEOUT_MS = 20_000;
const POLL_MS = 100;

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

// Sorting runs in a worker, so early frames can be empty. The splats are on
// screen when activeSplats > 0 and Spark is neither sorting nor dirty — except
// for a stream, which keeps sorting while pages arrive: ignore sort state there.
function isDrawn(view, { ignoreSortState = false } = {}) {
  const { spark } = view;
  return spark.activeSplats > 0 && (ignoreSortState || (!spark.sorting && !spark.sortDirty));
}

async function waitUntilDrawn(view, { ignoreSortState = false } = {}) {
  const deadline = Date.now() + DRAWN_TIMEOUT_MS;
  // The drawn state must hold across two polls: right after a swap (old splat
  // removed, new one still sorting) the old splat's numbers can look drawn.
  let stable = false;
  while (Date.now() < deadline) {
    view.requestRender();
    if (isDrawn(view, { ignoreSortState })) {
      if (stable) {
        view.requestRender();
        return;
      }
      stable = true;
    } else {
      stable = false;
    }
    await sleep(POLL_MS);
  }
  throw new Error('Splat did not finish sorting and drawing in time');
}

// Waits for the splat's data to be ready, while keeping renders going:
// - a stream has no splats until the first pages arrive, and Spark only
//   fetches pages while it draws;
// - a lod build runs in a worker; the splats move to packedSplats.lodSplats
//   when it finishes (right after initialized, Spark still draws the plain
//   splats, so waiting only for "drawn" would return too early).
async function waitUntilSplatReady(view, splat, { paged = false, lod = false } = {}) {
  const deadline = Date.now() + DRAWN_TIMEOUT_MS;
  while (Date.now() < deadline) {
    view.requestRender();
    if (paged && !(splat.paged?.getNumSplats() > 0)) { await sleep(POLL_MS); continue; }
    if (lod && !(splat.packedSplats?.lodSplats?.getNumSplats() > 0)) { await sleep(POLL_MS); continue; }
    return;
  }
  throw new Error(paged ? 'Stream did not deliver any splats in time' : 'LoD build did not finish in time');
}

try {
  const canvas = document.getElementById('stage');
  const detail = resolveDetail(window.location.search, DETAIL);
  const view = createView(canvas, { onFirstRender: () => {}, lodSplatScale: detail });
  const controls = createControls(view.camera, canvas, view.requestRender);
  let flipped = FLIP_UPSIDE_DOWN;
  let currentSplat = null;
  let loading = false;
  window.__SPLAT_LOADS__ = 0;

  const vr = createVr({
    view,
    controls,
    vrSize: VR_SIZE,
    getBoundingBox: () => (currentSplat ? boundingBoxOf(currentSplat) : null),
  });

  window.addEventListener('keydown', (event) => {
    if (!isFlipKey(event) || !currentSplat) return;
    flipped = !flipped;
    applyOrientation(currentSplat, flipped);
    view.requestRender();
  });

  // Loads a splat and shows it, replacing the current splat only on success.
  // A failure leaves the current splat in place.
  async function loadSplat(name, bytes) {
    const mode = loadModeFor(name, LOD);
    const paged = mode.paged && !bytes;
    const splat = await addSplat(view.scene, {
      url: `/splats/${name}`,
      fileBytes: bytes,
      fileName: name,
      lod: mode.lod,
      paged,
    });
    if (currentSplat) view.scene.remove(currentSplat);
    currentSplat = splat;
    flipped = FLIP_UPSIDE_DOWN;
    applyOrientation(splat, flipped);
    if (paged || mode.lod) await waitUntilSplatReady(view, splat, { paged, lod: mode.lod });
    frameCamera(view.camera, boxOfSplat(splat));
    controls.update();
    vr.onSplatChanged();
    view.requestRender();
    await waitUntilDrawn(view, { ignoreSortState: paged });
    window.__SPLAT_LOADS__ += 1;
    window.__SPLAT_NAME__ = name;
    window.__SPLAT_MODE__ = paged ? 'paged' : mode.lod ? 'lod' : 'plain';
    hideMessage();
  }

  // A file from the button or a drop: validate the name, read it, show it.
  // Keep the current splat and show a message if anything goes wrong.
  function handleFile(file) {
    if (loading) return;
    loading = true;
    (async () => {
      try {
        const { name } = validateSplatName(file.name);
        const bytes = await file.arrayBuffer();
        await loadSplat(name, bytes);
      } catch (error) {
        showMessage(error?.message ?? String(error));
      } finally {
        loading = false;
      }
    })();
  }

  createFileOpener({ onFile: handleFile });

  const { name, url } = resolveSplatFile(SPLAT_FILE, window.location.search);
  const mode = loadModeFor(name, LOD);
  // .rad files stream with HTTP range requests, so no bytes are fetched here.
  const bytes = mode.paged ? null : await fetchSplatBytes(url, `${SPLATS_DIR}/${name}`);
  await loadSplat(name, bytes);
  window.__APP_READY__ = true;
} catch (error) {
  const message = error?.message ?? String(error);
  showMessage(message);
  window.__APP_ERROR__ = message;
}
