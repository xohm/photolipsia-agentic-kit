# Blender, MCP and your own splats

Photolipsia · ZHdK · MA Interaction Design · HS 2026

An **MCP** gives your agent hands in another app. With the Blender MCP, the agent can see your
Blender scene, run Python inside Blender and look at the viewport. This page is what slides 31
to 36 of deck 1 show: set up the Blender MCP, clean up a scan in Blender, and train splats from
your own Blender scene.

Every step works the same way: **plan first, then go, then check.** Commands are shown for
**Mac** (Terminal) and **Windows** (PowerShell). Where they are the same, there is one block.
Your setup must work first: [student-setup.md](student-setup.md).

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

**Close the terminal and open a new one.** Open Blender once and close it again: that creates
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
`notepad "$HOME\.config\opencode\opencode.json"`. Add this block inside the outer `{ }`, after
the `provider` block. Put a comma after the `}` that closes `provider`.

```json
"mcp": {
  "blender": {
    "type": "local",
    "command": ["uvx", "mcp-for-blender@2.2.4"],
    "environment": { "DISABLE_TELEMETRY": "true" }
  }
}
```

`@2.2.4` is the course's version: keep it the same here and in `install-addon`.
`DISABLE_TELEMETRY` stops the MCP from sending usage data.

Save. Then **restart OpenCode** (`/exit`, then `opencode`): it reads its config only at the start.

### The loop in Blender

Blender is open and connected. Start OpenCode, for example in `02-splat-viewer`.

**Plan:**
```text
Use the Blender tools. Call get_scene_info and tell me what is in the scene. Then plan a ring of 12 cubes around the origin. Don't change anything yet.
```

Read the plan and change it if you want. **Go:** tell the agent to go. It writes Python and runs
it inside Blender (`execute_blender_code`).

**Check:** the tool `look` shows the agent the viewport, like the screenshot from
`npm run check`. Ask it to use `look` and tell you what it sees. Then look yourself.

**Be careful:**
- **Save your .blend first.** The agent can change or delete anything in your scene.
- **One agent at a time.** Only one agent session should use the Blender tools.
- **It runs Python inside Blender.** Python can read, write and delete files on your laptop.
  Read the plan before you say go.

## 2. Gaussian splats in Blender

You need **Blender 5.3 or newer**. Its release is planned for 10 Nov 2026; before that, use the
5.3 beta. Blender 5.2 and older can't open splats.
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

Copy your scan into `public/splats/` as `scan.ply`. Open Blender 5.3, check that the MCP is
connected, and start OpenCode in `02-splat-viewer`. The agent itself never opens files in
`public/splats/` (`AGENTS.md` and `opencode.json` block it). Blender opens them, and the agent
gets numbers back and the picture from `look`.

**Plan:**
```text
Use the Blender tools. In Blender, import ../tools/blender/splats.py and load public/splats/scan.ply with splats.load(). Use absolute paths. Tell me how many splats it has and how big it is. Then plan how to remove the floaters far away from the scan. Don't change anything yet.
```

**Go:** tell it to go. It picks the splats to keep (`splats.keep`).

**Check:**
```text
Use look in rendered mode. Is the scan still whole, and are the floaters gone?
```

**Save:**
```text
Save it with splats.save() as public/splats/scan-clean.ply.
```

Open `scan-clean.ply` in your viewer: `npm run dev`, then `?file=scan-clean.ply`.

## 3. Train splats from your own Blender scene

Blender renders your scene from many cameras, **Spirula Studio** trains splats from the pictures.

### Install Spirula Studio (once)

Spirula Studio v2026.10.16 is free (GPL-3.0). It runs on Mac (Apple Silicon), Windows and Linux,
with any GPU (it uses Vulkan). Download it from
https://github.com/harry7557558/spirula-studio/releases/tag/v2026.10.16:

- **Mac:** `spirula-2026.10.16-macos-vulkan-arm64.dmg`. Open it and drag **Spirula Studio** into
  **Applications**. The command-line program is
  `"/Applications/Spirula Studio.app/Contents/MacOS/spirula"`. The app may not be notarized: if
  macOS refuses to open it, right-click the app → **Open**.
- **Windows:** `spirula-2026.10.16-windows-vulkan-x86_64.zip`. Unzip it. The program is
  `spirula.exe` in the unzipped folder.
- **Linux:** `spirula-2026.10.16-ubuntu-vulkan-x86_64.zip`.

### Step 1: the agent renders the training set

Open your scene in Blender, **save your .blend**, check the MCP, start OpenCode in `02-splat-viewer`.

**Plan:**
```text
Use the Blender tools. Plan a training set for Spirula from the open scene: render it from 48 cameras on a sphere around the objects, with a transparent background, into public/splats/training/images/. Write public/splats/training/transforms.json with w, h, fl_x, fl_y, cx, cy and one frame per image: file_path with .png, and transform_matrix = the camera's matrix_world turned y-down like a scan (rotate +90 degrees about X). Use absolute paths. Don't change anything yet.
```

**Go:** tell it to go.

**Check:**
```text
Check: count the images, check transforms.json, and use look on one of the images.
```

You want 48 images in `images/` and one frame per image in `transforms.json`.

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

On Windows, put the full path of your `spirula.exe` in the quotes (Shift + right-click it in
Explorer → **Copy as path**). The `&` runs a program whose path is in quotes.

- Training takes about 10 minutes on a laptop GPU. Meanwhile Spirula shows its progress at
  http://localhost:7007: open it in your browser. That page is reachable from the network too.
- When it says "Training complete", stop it with **Ctrl+C**.

**Check:** the result is `outputs/scene/step-000030000.ckpt/splat.ply`, inside
`public/splats/training/`. Copy `splat.ply` into `public/splats/` (Finder or Explorer). Open it
in your viewer (`?file=splat.ply`), or in Blender with `splats.load()`.

## 4. What was tested

Tested on Linux on 2026-10-24 with GLM-5.3 Flash in OpenCode, Blender 5.3 beta,
mcp-for-blender 2.2.4 and Spirula Studio v2026.10.16 on an NVIDIA laptop GPU. Cleaning up a scan:
500,000 splats in, 2,545 floaters out, about $0.03. Training: 48 renders → 0.92 million splats in
about 10 minutes. **Not tested: Mac and Windows.**

## 5. Troubleshooting

| Problem | Fix |
|---|---|
| `install-addon`: "Could not find a Blender user addons directory" | Open Blender once and close it. Then run `install-addon` again. |
| The agent can't connect to Blender, or has no Blender tools | Blender is open, the add-on is on, the side panel (N) says "Connected on port 9876". Then restart OpenCode. |
| Blender doesn't show the scan as splats | You need Blender 5.3 or newer. Use **Material Preview** or **Rendered**. |
| The splats are upside down | In the viewer: press **F**. In Blender: `splats.load(path, flip=False)`, or the default flip. |
| Spirula's output folder is hidden, its name starts with `._` | Use `--output-dir-name scene`, as above. |
| Training is very slow | Close other programs that use the GPU. |
