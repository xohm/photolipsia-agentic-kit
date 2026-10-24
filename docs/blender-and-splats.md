# Blender, MCP and your own splats

Photolipsia · ZHdK · MA Interaction Design · HS 2026

An **MCP** is a plug-in for your agent: it gives it tools that work inside another app. With the
Blender MCP, the agent can read your Blender scene, run Python inside Blender and look at the
viewport. This page goes with the Blender slides in deck 2 (after "Prompt 9: extensions"): set up
the Blender MCP, clean up a scan in Blender, and train splats from your own Blender scene.

**Tested on Linux only (October 2026), with a generated test scan and a small test scene.** It
was not tried on a Mac or Windows when this page was written. If something breaks there, tell
your teacher.

Every step works the same way: **plan first, then go, then check.** Commands are shown for
**Mac** (Terminal) and **Windows** (PowerShell). Where they are the same, there is one block.
Your setup must work first: [student-setup.md](student-setup.md). For sections 2 and 3 you also
need the viewer from Example 2, at least up to prompt 4 (`?file=`).

You need **Blender 5.3**. It is in beta until its release, planned for 10 Nov 2026: download the
5.3 beta from https://builder.blender.org/download/daily/. Blender 5.2 and older can't open splats.

## 1. Blender MCP

### Install uv and the Blender add-on (once)

The Blender MCP runs with `uvx`, which comes with the tool `uv`.

**Mac**
```bash
curl -LsSf https://astral.sh/uv/install.sh | sh
```

**Windows**
```powershell
winget install --id astral-sh.uv -e
```

**Close the terminal and open a new one.** Open Blender 5.3 once and close it again: that creates
Blender's folder for add-ons. Then, the same on both:

```bash
uvx mcp-for-blender@2.2.4 install-addon
```

Then in Blender:

1. **Edit → Preferences → Add-ons**: find **MCP for Blender** and turn it on.
2. Move the mouse over the 3D view and press **N**. In the side panel, open the tab
   **MCP for Blender**.
3. **Check:** it says "Connected on port 9876". If it says "Not connected", click
   **Connect to MCP server**.

### Tell OpenCode about it (once)

Open your OpenCode config file, the one from [student-setup.md](student-setup.md#config-file):
Mac `open -e ~/.config/opencode/opencode.json`, Windows
`notepad "$HOME\.config\opencode\opencode.json"`. Replace the whole file with this (paste it,
don't type it), and save:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "openrouter/z-ai/glm-5.3-flash",
  "small_model": "openrouter/z-ai/glm-5.3-flash",
  "provider": {
    "openrouter": {
      "models": {
        "z-ai/glm-5.3-flash": { "options": { "reasoning": { "effort": "high" } } },
        "z-ai/glm-5.3": { "options": { "reasoning": { "effort": "high" } } }
      }
    }
  },
  "mcp": {
    "blender": {
      "type": "local",
      "command": ["uvx", "mcp-for-blender@2.2.4"],
      "environment": { "DISABLE_TELEMETRY": "true" }
    }
  }
}
```

This is the config from the setup guide plus the `"mcp"` block. If you changed something in your
file before (for example the effort), change it here again.

`@2.2.4` is the course's version: keep it the same here and in `install-addon`.
`DISABLE_TELEMETRY` stops the MCP from sending usage data.

Then **restart OpenCode** (`/exit`, then `opencode`): it reads its config only at the start.

The Blender tools now load in every OpenCode session, also in Examples 1 and 2. Their
descriptions go to the model with every request, which costs a little. When you don't use
Blender, add the line `"enabled": false,` right after `"blender": {` and restart OpenCode.

### The loop in Blender

Blender is open and connected. Start OpenCode in your project folder, for example in
`02-splat-viewer`.

**Plan:**
```text
Use the Blender tools. Call get_scene_info and tell me what is in the scene. Then plan a ring of 12 cubes around the origin. Don't change anything yet.
```

Read the plan and change it if you want. **Go:**
```text
Go.
```

It writes Python and runs it inside Blender (`execute_blender_code`).

**Check:**
```text
Use look and tell me what you see.
```

Then look yourself in Blender. (`look` shows the agent the viewport, like the screenshot from
`npm run check`.)

**Be careful:**
- **Save your .blend first.** The agent can change or delete anything in your scene.
- **One agent at a time.** Only one agent session should use the Blender tools.
- **It runs Python inside Blender.** Python can read, write and delete files on your laptop.
  Read the plan before you say go.
- **OpenCode doesn't ask** before it uses the Blender tools: in our tests it ran them right away.
  Only "Don't change anything yet" holds it back.
- **`look` sends a picture** of your viewport to the model provider. Don't use it on scenes or
  scans you must keep private.

The agent logs its decisions in `ai/strategy.md`. Commit after each run that works, in your
terminal: `git add -A`, `git commit -m "Blender: ring of cubes"`, `git push`.

## 2. Gaussian splats in Blender

Blender 5.3 opens a splat `.ply` by itself: one point per splat, with position, rotation, size
and colour. **Material Preview** and **Rendered** draw it as splats. But it **can't save**
splats. The kit's `tools/blender/splats.py` can. The agent uses it through the MCP:

| Function | What it does |
|---|---|
| `splats.load(path)` | Imports a scan upright and returns the object |
| `splats.read(scan, 'position')` | One attribute as a numpy array, one row per splat |
| `splats.keep(scan, mask)` | Keeps only the splats where the mask is True |
| `splats.save(scan, path)` | Saves a standard 3DGS `.ply` that Spark, SuperSplat and others open |

### Which way is up

Blender is z-up. Most scans, and the course's test splat, are stored upside down (y-down). Your
viewer flips them (`flip: true` in `src/config.js`). `load()` flips the same way, by default.
For a file that is stored y-up: `splats.load(path, flip=False)`. `save()` turns it back, so the
file keeps its own up.

- To turn or move the scan, turn or move the **object**. `save()` bakes that into the file.
- **Don't use Apply Transform** on splats: in Blender 5.3 it moves the points but doesn't turn
  the splats.

### Clean up a scan

Your scan must be a `.ply` (`splats.load` imports only `.ply`). Copy it into `public/splats/` as
`scan.ply`, in your terminal in `02-splat-viewer`. Use your own file name instead of `my-scan.ply`.

**Mac**
```bash
cp ~/Downloads/my-scan.ply public/splats/scan.ply
```

**Windows**
```powershell
Copy-Item $HOME\Downloads\my-scan.ply public\splats\scan.ply
```

Open Blender 5.3, check that the MCP is connected, and start OpenCode in `02-splat-viewer`. The
agent itself never opens files in `public/splats/` (`AGENTS.md` and `opencode.json` block it).
Blender opens them, and the agent gets numbers back and the picture from `look`.

**Plan:**
```text
Use the Blender tools. In Blender, import ../tools/blender/splats.py and load public/splats/scan.ply with splats.load(). Use absolute paths. Tell me how many splats it has and how big it is. Then plan how to remove the floaters far away from the scan. Don't change anything yet.
```

**Go:**
```text
Go.
```

It picks the splats to keep (`splats.keep`).

**Check:**
```text
Use look in rendered mode. Is the scan still whole, and are the floaters gone?
```

**Save:**
```text
Save it with splats.save() as public/splats/scan-clean.ply.
```

Open it in your viewer from Example 2: `npm run dev`, then
http://localhost:5173/?file=scan-clean.ply.

## 3. Train splats from your own Blender scene

Blender renders your scene from many cameras, **Spirula Studio** trains splats from the pictures.

### Install Spirula Studio (once)

Spirula Studio v2026.10.16 is free (GPL-3.0). It runs on Mac with Apple Silicon (not Intel Macs),
Windows and Linux, with any GPU (it uses Vulkan). Download it from
https://github.com/harry7557558/spirula-studio/releases/tag/v2026.10.16:

- **Mac:** `spirula-2026.10.16-macos-vulkan-arm64.dmg`. Open it and drag **Spirula Studio** into
  **Applications**. The command-line program is
  `"/Applications/Spirula Studio.app/Contents/MacOS/spirula"`. macOS may block it the first time,
  also when you run it from Terminal. Then open **System Settings → Privacy & Security**, scroll
  down, click **Open Anyway**, and run it again.
- **Windows:** `spirula-2026.10.16-windows-vulkan-x86_64.zip`. Unzip it. The program is
  `spirula.exe` in the unzipped folder.
- **Linux:** `spirula-2026.10.16-ubuntu-vulkan-x86_64.zip`.

### Step 1: the agent renders the training set

Open your scene in Blender, **save your .blend**, check the MCP, start OpenCode in `02-splat-viewer`.

**Plan:**
```text
Use the Blender tools. Plan a training set for Spirula from the open scene: render it from 48 cameras on a sphere around the objects, with a transparent background, into public/splats/training/images/. Write public/splats/training/transforms.json with w, h, fl_x, fl_y, cx, cy and one frame per image: file_path with .png, and transform_matrix = the camera's matrix_world turned y-down like a scan (rotate +90 degrees about X). Use absolute paths. Don't change anything yet.
```

**Go:**
```text
Go.
```

Rendering 48 pictures takes a while; the agent may render them in batches. The agent can't open
files in `public/splats/` itself (the lock from Example 2), so it checks everything through
Blender.

**Check:**
```text
Check: count the images, check transforms.json, and use look on one of the images.
```

You want 48 images in `images/` and one frame per image in `transforms.json`. Look yourself: open
`public/splats/training/images/` in Finder or Explorer.

**Why y-down?** Blender is z-up, scans are stored y-down. The prompt turns the cameras y-down, so
Spirula stores the result like a scan. Then it needs no flip: your viewer shows it upright, like
your scans, and `splats.load()` loads it upright in Blender.

### Step 2: Spirula trains

In **your terminal**, in `02-splat-viewer`:

**Mac**
```bash
cd public/splats/training
"/Applications/Spirula Studio.app/Contents/MacOS/spirula" train synthetic --data . --output-dir-name scene
```

**Windows**
```powershell
cd public/splats/training
& "C:\path\to\spirula.exe" train synthetic --data . --output-dir-name scene
```

On Windows, right-click `spirula.exe` in Explorer (Windows 10: Shift + right-click) →
**Copy as path**. It copies the path *with* quotes: replace `"C:\path\to\spirula.exe"`, quotes
included, with what you copied. The `&` runs a program whose path is in quotes.

- Training took 9 to 11 minutes on a strong NVIDIA laptop GPU in our test. On a MacBook, or a
  laptop without a gaming GPU, it can take much longer (not measured).
- Meanwhile Spirula shows its progress at http://localhost:7007: open it in your browser. Anyone
  on the same Wi-Fi can open that page while it trains.
- When it says "Training complete", stop it with **Ctrl+C**.

**Check:** the result is `outputs/scene/step-000030000.ckpt/splat.ply`, inside
`public/splats/training/`. Copy it into `public/splats/` with a name you'll recognise. Still in
`public/splats/training`:

**Mac**
```bash
cp outputs/scene/step-000030000.ckpt/splat.ply ../my-scene.ply
```

**Windows**
```powershell
Copy-Item outputs\scene\step-000030000.ckpt\splat.ply ..\my-scene.ply
```

Open it in your viewer (`npm run dev`, then http://localhost:5173/?file=my-scene.ply), or in
Blender with `splats.load()`. Git does not save it: keep your own copy.

## 4. What was tested

Tested on Linux on 2026-10-24 with GLM-5.3 Flash in OpenCode, Blender 5.3 beta,
mcp-for-blender 2.2.4 and Spirula Studio v2026.10.16 on an NVIDIA RTX PRO 3000 laptop GPU.

| Run | Time | Cost |
|---|---|---|
| Ring of cubes (section 1): plan, go, check | 1 min 45 s | about $0.02 |
| Clean up a scan: a generated 500,000-splat test file with planted floaters, not a real scan. 2,545 floaters out | | $0.03 to $0.04 per run |
| Render the training set: 48 views of a small test scene | | about $0.07 |
| Spirula training: 48 renders → 0.92 million splats | 9 to 11 min | no API cost (your own GPU) |

**Not tested:** Mac and Windows, real scans from a phone app, `.spz` files, Codex and Claude Code.

## 5. What went wrong when we tried it

- **Spirula, first run: upside down.** Our first training set had y-up camera matrices. The
  result came out upside down in the viewer. We saw it by looking at it: no check caught it. The
  fix was one instruction in the prompt: turn the cameras y-down, like a scan.
- **`NameError` in Blender.** Each MCP call runs its Python on its own: variables from one call
  are gone in the next, so using one gives a `NameError`. Imported modules stay. The fix: import
  `splats.py` once, and find the object by its name in every call.
- **A refused command made it skip ahead.** In one clean-up run, a shell command (`ls`) was
  refused, because our test ran without a person to approve it. (In class, OpenCode asks you.)
  The agent then loaded the scan only at "go" and cut the floaters only at "save". The result was
  right, but the steps were not the ones in the plan. Read every plan, and check what each step
  did.

From our runs of Examples 1 and 2 with GLM-5.3 Flash:

- **Wrong tests, caught by the tests.** Its first tests in Example 1 expected the wrong numbers.
  `npm test` caught it before any page existed.
- **It blamed the tools.** In Example 2 its own orientation check failed. It said the browser was
  the problem and tried to delete files. One sentence fixed it: "Look at .check/screenshot.png and
  find out why the orientation check fails." Its check had sampled black areas of the canvas.
- **What no check sees.** It built the VR scale the wrong way round: the test splat would look about 5 m
  big instead of 2 m. No check can see that without a headset. The Spark facts now ask for the
  VR scale as a pure function with a unit test.
- **It went around a lock.** Asked to open a locked file, it tried the shell instead. A deny rule
  now blocks that too; read every permission question anyway.
- **An empty plan, a lazy session.** With nothing under `## Next`, a fresh session did nothing.
  Write the next step yourself before you quit.

## 6. Troubleshooting

| Problem | Fix |
|---|---|
| `install-addon`: "Could not find a Blender user addons directory" | Open Blender once and close it. Then run `install-addon` again. |
| The agent can't connect to Blender, or has no Blender tools | Blender is open, the add-on is on, the side panel (N) says "Connected on port 9876". Then restart OpenCode. |
| Blender doesn't show the scan as splats | You need Blender 5.3 or newer. Use **Material Preview** or **Rendered**. |
| The splats are upside down | In the viewer: press **F**. In Blender: `splats.load(path, flip=False)`, or the default flip. |
| macOS blocks Spirula | System Settings → Privacy & Security → scroll down → **Open Anyway**, then run it again. |
| Spirula's output folder is hidden, its name starts with `._` | Use `--output-dir-name scene`, as above. |
| Training is very slow | Close other programs that use the GPU. |
| `git push` doesn't upload my splats | On purpose: `public/splats/` is ignored by git. Keep your own copies. |
