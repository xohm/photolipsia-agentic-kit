# Strategy
## Goal
Build a web page with a textarea for pasted text and live counts of words, characters, sentences and reading time, with all counting logic as pure exported functions in `src/stats.js`.

## Plan
- [x] Step 1: Write `tests/stats.test.js` with node:test cases for `textStats(text)`: empty/whitespace-only input, plain words, punctuation, multiple sentences, and expected reading time (words / 200 wpm, rounded up to 1 decimal or 0 for empty).
- [x] Step 2: Implement `src/stats.js` as pure functions: count words (split on whitespace), count characters (all chars incl. spaces, trimmed input), count sentences (split on `.`/`!`/`?` sequences), and export combined `textStats(text)` returning `{ words, characters, sentences, readingMinutes }`.
- [x] Step 3: Run `npm test` until all stats tests pass.
- [x] Step 4: Build the UI in `src/main.js` (plus a minimal `index.html` if missing): textarea with an input listener, DOM elements showing words / characters / sentences / reading time, updating live on each keystroke or paste.
- [x] Step 5: Add an app-level check in `scripts/app-checks.mjs` that loads the page, types text into the textarea, and verifies the four counters render the expected values.
- [x] Step 6: Run `npm test` and `npm run check`, read `.check/report.json` and the screenshot, fix any issues, then update this file.

### Clear button
- [x] Step C1: Add a "Clear" button to `index.html` below the textarea (before the stats), with a small inline style matching the existing calm look.
- [x] Step C2: In `src/main.js`, wire the button to empty the textarea (set `.value = ''`) and re-render all counters to zero; `__APP_READY__` stays set after the first render.
- [x] Step C3: Run `npm test` (should stay 12/12) and `npm run check`, then tick off these steps and update `## Next`.

## Decisions
- 2026-10-26 Logic lives in pure functions in `src/stats.js` (no DOM access) so it is unit-testable with node:test, per user request.
- 2026-10-26 Reading time = words / 200 wpm (industry-standard average adult reading speed).

- 2026-10-26 Three initial test expectations were miscounted (10 words not 11; 13 chars not 11; 5 words not 6); fixed the tests, logic was correct.
- 2026-10-26 Word regex `[\p{L}\p{N}][\p{L}\p{N}'’-]*` so punctuation-only runs and multiple spaces don't count as words.

- 2026-10-26 Stats rendered into `<dd data-stat="...">` elements keyed by textStats() keys; `__APP_READY__` set after first render.
- 2026-10-26 Calm look: warm paper background (#f6f5f1), serif body, card stat tiles, 2.2rem tabular numbers.

- 2026-10-26 Clear button: quiet ghost button (muted text, card background, accent hover) below the textarea, so it doesn't compete with the stats.
- 2026-10-26 Clear button empties the textarea via `textarea.value = ''` and re-renders through the same `render()` path used by typing.
- 2026-10-26 Sentence case rule: the only uppercase text came from CSS `text-transform` on the stat labels; removed it and sized labels up slightly (0.85rem) to keep hierarchy.

### Sentence case rule
- [x] Step S1: Remove `text-transform: uppercase` from `.stat dt` so the stat labels render in sentence case; page text in `index.html` was already sentence case.
- [x] Step S2: Add app checks that the stat labels have no uppercase transform and that labels/button are sentence case; fix a buggy check helper (it returned a boolean instead of the transformed string).

## Next
- All steps done. Goal met: 12/12 unit tests and 11/11 app checks pass; all page text renders in sentence case.
