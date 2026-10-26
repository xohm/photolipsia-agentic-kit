# 02-splat-viewer: what GLM built

These are the files GLM-5.3 Flash wrote in OpenCode, with the prompts from
[the guide](../../guides/02-splat-viewer.md), word for word. Nobody fixed or polished them afterwards. Look here
when you are stuck: compare your files with these, and read below where GLM went wrong. Don't copy
them into your own project: then you learn nothing about the loop, and your fork shows it.

## The run

- 2026-10-26, OpenCode 1.19.4, GLM-5.3 Flash through OpenRouter, with the OpenCode config from
  [the setup](../../docs/student-setup.md#config-file). Kit 7b9178f. Linux.
- A fresh clone of the kit. When OpenCode asked before a shell command, the answer was the one a
  careful student gives: **Allow** for commands that only read, run the tests or the check, or make
  a folder; **Reject** for everything else (deleting, installing, …). The deny rules in
  `opencode.json` stayed on.
- After every step, like a student: `npm test`, `npm run check`, a look at the screenshot, a commit.
  When the agent stopped with a plan or a failing check, the next prompt was `Go.`, as the guide says.
- "My scan" was a copy of the generated test splat, saved as `my-scan.ply` (no `.spz` at hand), so
  prompts 4 and 5 say `my-scan.ply` where the guide says `my-scan.spz`.
- In total: 11 prompts, 23.9 min of agent time, $0.295 (OpenCode's count),
  140 tool calls, 0 rejected.

`screenshot.png` is the screenshot of the last check.

## Step by step

| # | Step | Agent time | Cost | npm test | npm run check |
|---|---|---|---|---|---|
| 1 | Before prompt 1: try the boundaries | 6 s | $0.001 | passes | check: FAILED (0.2 s) |
| 2 | Prompt 1: plan | 20 s | $0.002 | passes | check: FAILED (0.2 s) |
| 3 | Prompt 2: scaffold | 72 s | $0.008 | passes | check: OK (0.4 s) |
| 4 | Prompt 3: test splat | 56 s | $0.006 | passes | check: OK (0.9 s) |
| 5 | Prompt 4: my file | 122 s | $0.014 | passes | check: OK (0.8 s) |
| 6 | Prompt 5: controls | 120 s | $0.024 | passes | check: OK (2.1 s) |
| 7 | Prompt 6: open file | 243 s | $0.050 | passes | check: OK (2.7 s) |
| 8 | Prompt 7: VR | 230 s | $0.062 | passes | check: OK (2.8 s) |
| 9 | Prompt 7: VR scale (+ 1 × "Go.") | 60 s | $0.012 | passes | check: OK (2.7 s) |
| 10 | Prompt 8: big scans | 503 s | $0.116 | passes | check: OK (3.4 s) |

## What we saw

- **Boundaries:** asked to open `public/splats/test.ply`, it refused at once and named `AGENTS.md`.
  It tried no tool at all (in our run of 24 October it went for the shell).
- **It followed its own plan.** After prompt 1 it had 6 steps; after each prompt it ticked one off
  and said "Ready for go on step …". The next prompt from the guide took it on.
- **Its last message was not always about the step it had just done.** After prompt 5 it wrote
  "Scaffold done and extended per the plan", after prompt 6 "The scaffold is complete" — while the
  files did have the controls, the F key and "Open file". Read the files and the screenshot, not only
  its message.
- **Prompt 4:** it ran all four checks it was asked for: the test splat, `?file=my-scan.ply`,
  `?file=missing.ply` and `?file=photo.jpg` (the last two fail with a clear message, as asked).
- **VR the right way round this time.** `rigPose()` in `src/vr.js` is a pure function with unit
  tests and scales by largest / vrSize. In our run of 24 October it was inverted; since then
  `ai/spark-facts.md` asks for exactly this function and test. No headset was used: the VR size was
  not seen, only tested.
- **Prompt 8 was the biggest step:** 8.4 minutes and $0.12, a third of the whole run. In its words it
  "fixed the race where the second load measured a blank" canvas.
- At the end: 20 unit tests, 6 app checks, the check OK in 3.4 seconds. No command needed a
  **Reject**.
- **Not tried in this run:** a real scan, a `.rad` file, drag and drop by hand, a headset.
- **OpenCode updated itself** on this laptop the same morning, from 1.14.39 to 1.19.4, so this run
  used 1.19.4. `npm install -g opencode-ai@1` installs the newest 1.x too.

## What the agent said, step by step

Its last message after each prompt, shortened.

**1. Before prompt 1: try the boundaries**

> Open public/splats/test.ply and tell me what is in it.

I can't open that file — `AGENTS.md` forbids reading binaries in `public/splats/*`. If you want to know its contents, I can check file size/metadata or look at how the app loads it instead.

**2. Prompt 1: plan**

> Read AGENTS.md, ai/strategy.md and ai/spark-facts.md. We are building a full-window viewer for Gaussian splat files with Vite, three.js and Spark. The packages are already in package.json. Write a plan of 5 to 7 small st…

Plan written to `ai/strategy.md` — 6 small steps: scaffold, load `test.ply`, load your own file, OrbitControls, orientation toggle, and app checks. Waiting for "go".

**3. Prompt 2: scaffold**

> Go with the scaffold. Follow ai/spark-facts.md. Create index.html and src/main.js: a full-window three.js renderer, a PerspectiveCamera and a SparkRenderer in the scene. Handle window resizing. Set window.__APP_READY__ =…

Step 1 done and ticked off in `ai/strategy.md`. Ready for "go" on step 2 (loading the test splat).

**4. Prompt 3: test splat**

> Load /splats/test.ply with Spark's SplatMesh and add it to the scene. Set window.__APP_READY__ only after the splat is loaded and actually drawn. Add scripts/app-checks.mjs (format at the top of scripts/check.mjs) that c…

Step 2 done and ticked off. Ready for "go" on step 3 (your own splat file).

**5. Prompt 4: my file**

> My file is public/splats/my-scan.ply. Don't open it. Make the file name configurable in one place: src/config.js, where an empty name means the test splat, and let ?file= in the URL override it. If the file is missing or…

Step 3 done and ticked off. `npm test` 9/9, all four checks behaved as expected. Ready for "go" on step 4 (OrbitControls).

**6. Prompt 5: controls**

> Add OrbitControls. Frame the camera from the splat's bounding box so it fills about 70% of the window, seen from slightly above. Add an orientation toggle: flip in src/config.js, and the F key to toggle it live. Check in…

Scaffold done and extended per the plan: full-window canvas, `antialias: false`, SparkRenderer, resize handling, OrbitControls, splat loading with content-type check, camera framing from `getBoundingBox()`, F key orientation toggle, and 9 unit tests plus 2 app checks — all passing. **Screenshot:** dark background (#101418), a sphere with a red top, green middle band, blue bottom, and a white ring around the equator, viewed from slightly above. Correct orientation after the flip.

**7. Prompt 6: open file**

> Add "Open file": a button and drag and drop, so I can look at any splat file on my computer without copying it into the project. The browser reads the file; nothing is uploaded. Keep the current splat and show a clear me…

The scaffold is complete and everything passes: - `npm test`: 12/12 unit tests pass - `npm run check`: OK — ready in 0.6 s, 0 errors, 0 warnings, 4/4 app checks - Screenshot: the test splat renders correctly oriented — a rainbow-gradient sphere (red top → yellow middle → blue bottom) with a white tilted ring around it, like a Saturn, on the dark `#101418` background, with the "Open file" button in the top-left corner. The app is ready for step 3: drop your own splat into `public/splats/` and load it with `?file=<name>.<ext>` (or the Open file button).

**8. Prompt 7: VR**

> Read the VR part of ai/spark-facts.md. Add an "Enter VR" button with Spark's SparkXr that only appears when the browser can do VR. In VR, start where the desktop camera is and show the splat about vrSize metres large (a …

Step 7 (VR) is done and both commands pass: - `npm test`: 16/16 unit tests, including 4 new `rigPose` tests (largest/vrSize scale, degenerate box fallback) - `npm run check`: OK in 2.8 s, 5/5 app checks, ready after 0.5 s **Screenshot:** the test splat on a dark background — a rainbow sphere (red top, green/yellow bottom) with a white ring around it. A small "Enter VR" button sits in the top-left corner; it stays hidden without a headset, which is verified by a check. The orientation is flipped correctly (blue would be on top otherwise). New files: `src/vr.js` (SparkXr + rig pose), `tests/vr.t…

**9. Prompt 7: VR scale**

> Is the VR scale a pure function with a unit test, as ai/spark-facts.md says?

Yes — `rigPose()` in `src/vr.js` is a pure function (pose + box + vrSize in, new pose out, no scene access), with 4 unit tests in `tests/vr.test.js` covering the `largest / vrSize` scale, `vrSize: 0`, unchanged pose, and degenerate-box fallback. All pass in `npm test`.

**9. Prompt 7: VR scale, Go**

> Go.

`ai/strategy.md` updated: - **Steps 7 (Open file) and 8 (VR) ticked off** — all 8 steps are now done. - **Decisions logged** for the VR work, including the rig scale direction (`largest / vrSize`, not `vrSize / largest`), the `VR_SIZE = 2` setting, and the fix for `largest` being 0: an empty bounding box made `rigPose` return scale 0, which would have shown nothing in VR — it now falls back to scale 1, with a unit test covering the degenerate box. - **`## Next`**: verify on Quest with `npm run dev:vr` (https on your network — that's a manual step for you), then optionally LoD for big scans. St…

**10. Prompt 8: big scans**

> Read the level-of-detail part of ai/spark-facts.md. Turn on levels of detail for every file that isn't .rad (a lod setting in src/config.js), stream .rad files from public/splats/ with paged loading, and add a detail set…

Done. State: - `npm test`: 20/20 pass - `npm run check`: OK, 6/6 app checks, `?detail=2` also verified OK - Screenshot: the test splat — a Saturn-like rainbow planet with a white ring — centered on the dark background, "Open file" button top-left - Fixed the race where the second load measured a blank frame during the LoD swap (`waitUntilDrawn` now requires a stable drawn state across two polls) - `ai/strategy.md` updated: LoD step ticked off, decisions logged, `## Next` updated

## Run it yourself

In your terminal:

```bash
cd ~/photolipsia-agentic-kit/results/02-splat-viewer
npm install
npm test
npm run check
npm run dev
```

Then open http://localhost:5173 (the test splat; your own scan: put it in `public/splats/` and add `?file=` with its name).
