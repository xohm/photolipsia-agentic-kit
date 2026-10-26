import { SplatMesh } from '@sparkjsdev/spark';

// Vite serves index.html with status 200 for missing files in public/,
// so fetch the splat ourselves and check what came back before decoding it.
export async function fetchSplatBytes(url, displayPath) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`File not found: ${displayPath} (HTTP ${response.status})`);
  const type = response.headers.get('content-type') ?? '';
  if (type.includes('text/html')) throw new Error(`File not found: ${displayPath}`);
  return response.arrayBuffer();
}

export async function addSplat(scene, { url, fileBytes, fileName, lod, paged }) {
  // .rad files stream from the server with HTTP range requests; everything
  // else is decoded from bytes. lod: true builds levels of detail in a worker.
  const splat = paged
    ? new SplatMesh({ url, paged: true })
    : new SplatMesh({ fileBytes, fileName, lod: lod || undefined });
  scene.add(splat);
  try {
    await splat.initialized;
  } catch (error) {
    scene.remove(splat);
    throw error instanceof Error ? error : new Error(String(error));
  }
  // Orientation is handled in src/orientation.js (config + F key).
  return splat;
}
