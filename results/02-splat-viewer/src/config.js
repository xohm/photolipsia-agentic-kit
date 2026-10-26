// The splat to show. An empty name loads the test splat public/splats/test.ply.
// A ?file=<name> URL parameter overrides this.
export const SPLAT_FILE = '';

// Some captures load upside down. true rotates the splat 180° around X.
// Pressing F in the viewer toggles this live; this is the startup value.
// The test splat loads upside down, so it starts flipped.
export const FLIP_UPSIDE_DOWN = true;

// How large the splat looks in VR, in metres. 0 keeps the file's own scale.
export const VR_SIZE = 2;

// Levels of detail for big scans: Spark builds them in a background worker and
// draws at most a fixed splat budget. .rad files already contain LoD and are
// streamed instead (see loadModeFor in splat-choice.js).
export const LOD = true;

// Scales Spark's splat budget: 2 = twice as many splats on screen. ?detail=
// in the URL overrides this.
export const DETAIL = 1;
