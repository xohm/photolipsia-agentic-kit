// Decides which splat file to load. Pure: no browser, no fetch, easy to test.
// Formats supported by Spark 2.4.0 (see ai/spark-facts.md).

export const SUPPORTED_FORMATS = ['ply', 'spz', 'splat', 'ksplat', 'sog', 'rad'];
export const TEST_SPLAT = 'test.ply';
export const SPLATS_DIR = 'public/splats';

// Validates a file picked or dropped into the app (its name cannot contain a
// path, so only the extension rules apply). Pure, for unit tests.
export function validateSplatName(name) {
  const trimmed = name.trim();
  const extension = trimmed.includes('.') ? trimmed.split('.').pop().toLowerCase() : '';
  if (!SUPPORTED_FORMATS.includes(extension)) {
    const list = SUPPORTED_FORMATS.map((format) => `.${format}`).join(', ');
    throw new Error(
      `Unsupported splat format: ".${extension}" in "${name}". Supported formats: ${list}`,
    );
  }
  return { name: trimmed, extension };
}

// Picks the file: ?file= in the URL wins over config, an empty name means the
// test splat. Throws for anything that cannot be a splat file name.
export function resolveSplatFile(configName, search = '') {
  const override = new URLSearchParams(search).get('file');
  const requested = (override ?? configName ?? '').trim();
  if (requested === '') return { name: TEST_SPLAT, url: `/splats/${TEST_SPLAT}` };
  if (requested.includes('/') || requested.includes('\\')) {
    throw new Error(`Not a file name: "${requested}". Splat files live in ${SPLATS_DIR}/ — use just the name.`);
  }
  const extension = requested.includes('.') ? requested.split('.').pop().toLowerCase() : '';
  if (!SUPPORTED_FORMATS.includes(extension)) {
    const list = SUPPORTED_FORMATS.map((format) => `.${format}`).join(', ');
    throw new Error(
      `Unsupported splat format: "${extension || requested}" in "${requested}". Supported formats: ${list}`,
    );
  }
  return { name: requested, url: `/splats/${requested}` };
}

// ?detail= scales Spark's splat budget. Pure, for unit tests.
export function resolveDetail(search, defaultDetail) {
  const raw = new URLSearchParams(search).get('detail');
  if (raw === null || raw.trim() === '') return defaultDetail;
  const value = Number(raw);
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`Invalid detail: "${raw}". Detail must be a positive number, e.g. ?detail=2`);
  }
  return value;
}

// How a file gets loaded. .rad files already contain levels of detail and are
// streamed with HTTP range requests; everything else uses the lod setting.
export function loadModeFor(name, lod) {
  const extension = name.split('.').pop().toLowerCase();
  if (extension === 'rad') return { paged: true, lod: false };
  return { paged: false, lod };
}
