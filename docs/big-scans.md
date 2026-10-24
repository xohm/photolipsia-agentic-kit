# Big scans: levels of detail and .rad files

Photolipsia · ZHdK · MA Interaction Design · HS 2026

A scan from a phone app or a training tool easily has 1 to 10 million splats. Nobody can draw
all of them every frame, least of all a Quest. Spark solves this with **levels of detail (LoD)**:
it keeps a tree of the splats, where each parent is a softer merge of its children, and draws at
most a fixed number of them, fine close up and coarse far away.

| Device | Splats drawn at most |
|---|---|
| Quest (in the Quest browser) | 500,000 |
| Phone | 1 to 1.5 million |
| Laptop or desktop, also PC VR over Quest Link | 2.5 million |

The file can be much bigger than that. Only what you see gets drawn.

## What the viewer does by itself

- **`.ply`, `.spz`, `.splat`, `.ksplat`, `.sog`:** the viewer builds the levels of detail when the
  file loads (`lod: true` in `src/config.js`). That takes about 1 to 3 seconds per million splats.
- **`.rad`:** the file already contains the levels of detail. From `public/splats/` the viewer
  streams it: Spark only fetches the parts it needs, so a huge scan appears in seconds and gets
  sharper as the rest arrives. Opened from your disk, it loads as a whole.
- **More or less detail:** `detail` in `src/config.js`, or `?detail=` in the URL.
  `?detail=0.5` draws half as many splats (smoother on a Quest), `?detail=2` twice as many.

So for most scans you don't need to do anything. Convert to `.rad` when a scan is very large
(several million splats), when you show it on a Quest, or when it should load fast for others.

## Convert a scan to .rad

One command, the same on Mac and Windows. It only needs Node.js 20.19 or newer, which you already
installed for the course (check with `node --version`). The converter is `gaussian-splat-lite`, an
open-source tool (Apache-2.0) that writes Spark's `.rad` format. The first time, `npx` downloads it
and asks `Ok to proceed?`: answer `y`.

**Mac**
```bash
cd ~/Downloads
npx --package gaussian-splat-lite@1.4.2 gsl-build-lod my-scan.ply
```

**Windows** (PowerShell)
```powershell
cd $HOME\Downloads
npx --package gaussian-splat-lite@1.4.2 gsl-build-lod my-scan.ply
```

It writes `my-scan-lod.rad` next to your scan. Copy it into your project's `public/splats/` and
open it with `?file=my-scan-lod.rad`.

- It reads `.ply` and `.spz`. A `.sog`, `.splat` or `.ksplat` doesn't need converting: the viewer
  builds the levels of detail itself. Or export a `.ply` from your scanning app.
- It never overwrites a file: delete the old `.rad` first, or choose a name with `-o`.
- A name with spaces needs quotes: `"my scan.ply"`.
- Windows says running scripts is disabled? See "Windows only: allow npm to run" in
  [student-setup.md](student-setup.md).

Options, after the file name:

| Option | What it does |
|---|---|
| `--max-sh 0` | Drops the view-dependent colour detail: half the size, a little flatter look |
| `--rad-chunked` | Writes a small `.rad` plus `.radc` pieces, for very large scenes. Keep them in the same folder |
| `--memory-budget 2` | Uses at most about 2 GB of memory, for laptops with 8 GB. The default is 4 |
| `-o other-name.rad` | Another output name |

### Measured here

On the Linux laptop the kit was built on, `gaussian-splat-lite` 1.4.2, Node 20 and 24 (same
result), with a generated 500,000-splat `.ply` (124 MB, full colour detail), opened in the course's
viewer with Spark 2.4.0 on the laptop's graphics chip:

| Step | Time | Result |
|---|---|---|
| Convert to `.rad` | 7 s, 0.7 GB memory | 30 MB, 4× smaller |
| Convert with `--max-sh 0` | 7 to 11 s | 14 MB |
| Convert with `--rad-chunked` | 7 s | 15 chunk files |
| Open the `.ply`, levels of detail built in the browser | 2.0 s | |
| Stream the `.rad` from `public/splats/` (all three variants) | 0.3 to 0.4 s | fetched in pieces (`206` range requests) |

The `.rad` files look like the original. Not tested: Mac and Windows, `.spz` input, real scans
from phone apps.

### Plan B: Spark's own converter

If the command above fails, Spark has its own converter, `build-lod`. It needs Rust, which you
install once, and Spark's source code; the first conversion also builds the converter (about 2 to
3 minutes).

- Rust: Mac `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`, Windows
  `winget install --id Rustlang.Rustup -e` (accept the Visual Studio C++ build tools it offers).
  Then open a new terminal.
- Spark: `git clone --depth 1 --branch v2.4.0 https://github.com/sparkjsdev/spark.git`
- Every scan: in the `spark` folder, `npm run build-lod -- --quick ~/Downloads/my-scan.ply`
  (Windows: `$HOME\Downloads\my-scan.ply`). Options: `--max-sh=0`, `--rad-chunked`.

Measured here: building the converter 2 min 20 s, then the same 124 MB `.ply` in 32 s (30 MB `.rad`).

## Checking big files

`npm run check` draws in software, without a graphics card. That is fine for the small test
splat, but too slow for a streamed multi-million-splat scan: the check times out. Look at big files
in the browser instead, with `npm run dev` and `?file=my-scan-lod.rad`.
