# Example 2: a radiance field viewer

A full-window viewer for your own Gaussian splat (radiance field) file,
built with Vite, three.js and Spark.

Our run with GLM-5.3 Flash (24 October 2026): prompts 1 to 8 in 11.6 minutes of agent time, for
$0.26, with a copy of the generated test splat as "my scan". Two things needed a person: the agent
blamed the browser for a check it had written wrong, and it built the VR scale the wrong way round (see
prompt 7). Example 2 has not been run with Claude Code or Codex yet.

Same loop as Example 1: **plan → build → introspect → fix → log**. Every prompt ends the same
way: the agent runs `npm test` and `npm run check`, reads `.check/report.json`, looks at
`.check/screenshot.png` and tells you what it sees.

Keep two terminals open, as in Example 1. Each prompt below is one step: plan, go, check. If the
agent writes a plan and stops (`AGENTS.md` tells it to), read the plan and type `Go.` When the
check says OK, look at the screenshot yourself, then commit.

> Working alone? Use [the step-by-step guide](02-splat-viewer-alone.md): the same project in eight small steps, with three short prompts you repeat for each: plan, go, check.

## Setup (once)

You work in the folder `02-splat-viewer` of your fork: a skeleton with no app yet. In your
terminal (the same on Mac and Windows):

```bash
cd ~/photolipsia-agentic-kit/02-splat-viewer
npm install
npm run check
```

Skipped Example 1? Run `npx playwright install chromium` once before `npm run check` (about
300 MB).

`npm run check` first writes a small test splat to `public/splats/test.ply`, then
says **FAILED: Nothing rendered yet**. Correct: there is no page yet.

`public/splats/` is ignored by git and off limits for the agent: deny rules in OpenCode and
Claude Code, only `AGENTS.md` in Codex (see below). Splat files are large
binaries: reading them wastes tokens and money and tells the agent nothing. Git does not save
them either: keep your own copies of your scans.

New in this project: `ai/spark-facts.md`. Models may know an older version of Spark, the
splat library. This file tells the agent how the current version works. Giving the agent the
docs as a file is good prompting.

## Try the boundaries

In your agent terminal, go to the project folder (the same on Mac and Windows):

```bash
cd ~/photolipsia-agentic-kit/02-splat-viewer
```

Start your agent there: `opencode`, `claude` or `codex`. In OpenCode, check with `/models` that
**GLM-5.3-Flash** is selected. Codex asks "Do you trust this folder?" the first time: answer
**yes**, or `npm run check` can't run.

Always start it inside `02-splat-viewer`, never in the main kit folder: the rules and deny rules
are in the project folder. Then ask:

```text
Open public/splats/test.ply and tell me what is in it.
```

OpenCode's read tool refuses: `opencode.json` denies the folder. In our test the agent then tried
the shell instead (`ls … public/splats`). That is denied too: OpenCode blocks shell commands that
name `public/splats` or `.env`. Claude Code refuses through `.claude/settings.json`. Codex has no
such file, so it may read the folder anyway; only `AGENTS.md` asks it not to. (Its sandbox limits
where commands can change files, not what they read.)

Rules in `AGENTS.md` are requests; deny rules are locks. Not perfect ones: a script the agent
writes and runs can still open any file. Read every permission question before you answer.

## Prompt 1: plan

```text
Read AGENTS.md, ai/strategy.md and ai/spark-facts.md. We are building a
full-window viewer for Gaussian splat files with Vite, three.js and Spark. The
packages are already in package.json. Write a plan of 5 to 7 small steps into
ai/strategy.md: scaffold, load the test splat in public/splats/test.ply, then
my own file, then camera controls and an orientation toggle. Never open files
in public/splats/. Don't write code yet.
```

Read the plan in `ai/strategy.md`. Change it if you disagree.

## Prompt 2: scaffold

```text
Go with the scaffold. Follow ai/spark-facts.md. Create index.html and
src/main.js: a full-window three.js renderer, a PerspectiveCamera and a
SparkRenderer in the scene. Handle window resizing. Set
window.__APP_READY__ = true after the first frame. Small files. Run npm test and
npm run check, then describe the screenshot.
```

**Check:** the screenshot should be an empty dark page, and the check should say **OK** in a
second or two.

After every prompt that works, commit and push in your terminal. Name the commit after the
prompt:

```bash
git add -A
git commit -m "Prompt 2: scaffold"
git push
```

## Prompt 3: load the test splat

```text
Load /splats/test.ply with Spark's SplatMesh and add it to the scene. Set
window.__APP_READY__ only after the splat is loaded and actually drawn. Add
scripts/app-checks.mjs (format at the top of scripts/check.mjs) that checks the
canvas is not blank, using measure('canvas') and nonBackgroundRatio. Run the
check, look at the screenshot and describe what you see.
```

**Check yourself:** open the screenshot (Mac: `open .check/screenshot.png`, Windows:
`start .check\screenshot.png`). The test splat is a rainbow sphere with a light ring: red on top,
violet at the bottom. If violet is on top, the orientation is flipped. Keep that in mind for
prompt 5. Then commit ("Prompt 3: test splat").

If the check takes more than about 5 seconds, ask: "The check is slow. Render only when
something changed, as ai/spark-facts.md says."

## Prompt 4: your own file

Copy your file into the project, in your terminal. Use your own file name instead of
`my-scan.spz`.

**Mac**
```bash
cp ~/Downloads/my-scan.spz public/splats/
```

**Windows**
```powershell
Copy-Item $HOME\Downloads\my-scan.spz public\splats\
```

```text
My file is public/splats/my-scan.spz. Don't open it. Make the file name
configurable in one place: src/config.js, where an empty name means the test
splat, and let ?file= in the URL override it. If the file is missing or not a
supported format, show a clear message on the page ("File not found:
public/splats/<name>" or the list of supported formats) and set
window.__APP_ERROR__ to it. Put the file-choice logic in a pure function with
tests. Run npm test and npm run check, then npm run check "?file=my-scan.spz",
npm run check "?file=missing.ply" and npm run check "?file=photo.jpg".
```

**Check:** `?file=missing.ply` and `?file=photo.jpg` should **fail**, each with a clear message.
That is correct: you asked for those messages.

`?file=my-scan.spz` may fail too, with **App not ready**. That is expected for a big scan: the
check draws without a graphics card and can't keep up (our 500,000-splat test file failed the
same way). Your scan is not broken: look at it with `npm run dev` (below). If the agent starts
"fixing" the app because of it, tell it:

```text
My scan is too big for npm run check. Use the test splat for checks.
```

Keep `file` in `src/config.js` empty while you build. Then every `npm run check` uses the small
test splat and stays fast.

Now look at your capture yourself, in your terminal:

```bash
npm run dev
```

Open http://localhost:5173/?file=my-scan.spz in your browser. Leave the server running: the page
reloads when files change. Stop it with **Ctrl+C**. On Windows, a firewall prompt may appear the
first time: "Allow" on private networks is fine. Then commit ("Prompt 4: my file").

## Prompt 5: controls and orientation

```text
Add OrbitControls. Frame the camera from the splat's bounding box so it fills
about 70% of the window, seen from slightly above. Add an orientation toggle:
flip in src/config.js, and the F key to toggle it live. Check in the screenshot
that the test splat is the right way up (red on top). Then run
npm run check "?file=my-scan.spz" and describe my capture.
```

A big scan can fail that last check with **App not ready**, as in prompt 4: look at it in the
browser instead.

Real captures often have a few stray splats far away ("floaters"). They make the bounding
box huge and the splat tiny. If that happens: "Frame on the middle 96% of the splats, not
the whole bounding box."

**Check yourself**, in the browser: drag to orbit, scroll to zoom, right-drag (or Shift + drag)
to pan, F to flip. Then commit ("Prompt 5: controls").

## Prompt 6: open any file

```text
Add "Open file": a button and drag and drop, so I can look at any splat file on
my computer without copying it into the project. The browser reads the file;
nothing is uploaded. Keep the current splat and show a clear message if the
file can't be read. Add an app check that opens public/splats/test.ply through
the file input.
```

**Check:** the check says OK, with one more app check than before. Then, with `npm run dev`, drop
your own scans on the page, one after the other. Commit ("Prompt 6: open file").

## Prompt 7: VR with a Quest 3

```text
Read the VR part of ai/spark-facts.md. Add an "Enter VR" button with Spark's
SparkXr that only appears when the browser can do VR. In VR, start where the
desktop camera is and show the splat about vrSize metres large (a setting in
src/config.js, 0 keeps the file's own scale). Draw every frame while in VR,
move with the controllers, and go back to the desktop view when VR ends. Add a
check that the button stays hidden in a browser without VR.
```

**Check:** the check says OK. Its hidden browser can't do VR, so there the button must stay
hidden. That also means **no check sees the VR size**. In our run the agent built it the wrong way round:
the test splat would have looked about 5 m big instead of 2 m. So ask: "Is the VR scale a pure
function with a unit test, as ai/spark-facts.md says?" Commit ("Prompt 7: VR"), then try it in the
headset: is the splat about vrSize metres big?

There are two ways to see it in the headset. Which one works depends on your computer.

**Windows PC + Quest Link (PC VR).** The PC renders, the headset only displays.

1. In the **Meta Horizon Link** app on the PC: *Settings → General → OpenXR Runtime → Set as active*,
   and turn on *Unknown Sources*. Connect the Quest with a USB-C cable (Link). Air Link over Wi-Fi
   works too, but the cable is more reliable.
2. Run `npm run dev` and open http://localhost:5173 in **Chrome** on the PC.
3. Press **Enter VR**. Chrome asks for VR permission **on the monitor**, not in the headset:
   allow it, or it looks as if nothing happens.

**Mac (or Windows) → the Quest's own browser.** PC VR does not exist on a Mac: Quest Link, Air
Link and SteamVR are Windows only. Instead the Quest renders the page itself:

```bash
npm run dev:vr
```

It prints a `Network: https://…:5173` address. Open exactly that address in the Quest browser,
accept the certificate warning (**Advanced → Proceed**: the dev server makes its own certificate),
then press **Enter VR**.

- While `npm run dev:vr` runs, anyone on the same Wi-Fi can open your page. Stop it with
  **Ctrl+C** when you are done.
- The Quest and the computer must be on the same Wi-Fi, and that Wi-Fi must let devices see each
  other. University networks often don't: use a phone hotspot or a small router.
- Allow incoming connections when your firewall asks (Mac: for `node`; Windows: private networks).
- Windows with a phone hotspot: Windows often marks a new network as Public. Set it to Private
  (Settings → Network & internet → Wi-Fi → the network), or the firewall blocks the Quest. (Not
  tested.)
- In standalone mode the Quest does the rendering and draws at most 500,000 splats (prompt 8).
  Put the file in `public/splats/` and add `?file=my-scan.spz`. A `.rad` file streams best.

**In VR:** left stick moves, right stick turns, left trigger and grip go up and down, right
trigger is fast, right grip is slow. You start where the desktop camera was. No headset at hand?
Meta's **Immersive Web Emulator** extension for Chrome makes the button appear on the desktop.

## Prompt 8: big scans

```text
Read the level-of-detail part of ai/spark-facts.md. Turn on levels of detail for
every file that isn't .rad (a lod setting in src/config.js), stream .rad files
from public/splats/ with paged loading, and add a detail setting that scales
Spark's splat budget, overridable with ?detail= in the URL. Frame the camera on
the first splats of a stream. Check that the test splat still passes
npm run check.
```

**Check:** the test splat still passes `npm run check`. Commit ("Prompt 8: big scans").

Then convert your scan to `.rad` (see [docs/big-scans.md](../docs/big-scans.md)), put it in
`public/splats/` and look at it with `npm run dev` and `?file=my-scan-lod.rad`. Try `&detail=0.5`
and `&detail=2`. Don't use `npm run check` on a big `.rad`: it times out.

## Prompt 9: extensions

Pick one at a time. Plan first, then build, then check.

```text
Plan, then build: a background colour setting in src/config.js.
```

```text
Plan, then build: auto-rotate, toggled with the A key.
```

```text
Plan, then build: a list of the files I name in src/config.js that switches
between them without reloading the page.
```

```text
Plan, then build: a "Save image" button that downloads the current view as PNG.
```

These prompts say "Plan, then build", but `AGENTS.md` makes the agent stop after the plan. Read
the plan, then type `Go.` **Check:** does `scripts/app-checks.mjs` have a check for the new
feature? Look at it in the browser. Then commit.

## When it breaks

The `summary` at the top of `.check/report.json` tells you why. Common cases (the exact
"App error" text is whatever your agent wrote):

| Report says | Meaning |
|---|---|
| `App error: File not found: public/splats/…` | Wrong file name, or the file is not in `public/splats/` |
| `App error: "x.jpg" is not a splat file…` | Unsupported format. Export .ply, .spz, .splat, .ksplat, .sog or .rad |
| `App error: Could not read x.ply (…)` | The file is broken or in a variant Spark can't read, e.g. ASCII `.ply`. Export it again |
| `check "canvas is not blank" failed` | Nothing drawn: camera points away, splat too small, or no SparkRenderer |
| `App error: WebGL unavailable…` | The browser could not start WebGL. Close other 3D apps and try another browser; if it persists, ask your teacher |
| `App not ready: … within … ms` | Large file in software WebGL. Check with the test splat: `npm run check "?file=test.ply"` |
| `check "app checks ran" failed: … Timeout` with a big streamed file | `npm run check` draws in software and can't keep up. Check big files in the browser with `npm run dev` |
| No **Enter VR** button | The browser can't do VR: a Mac browser never can. Use the Quest browser with `npm run dev:vr`, or a Windows PC with Quest Link |
| The Quest can't open the `https://…` address | Not the same Wi-Fi, a network that isolates devices, or the firewall. Try a phone hotspot |
