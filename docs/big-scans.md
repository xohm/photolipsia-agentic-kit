# Big scans: levels of detail and .rad files

Photolipsia · ZHdK · MA Interaction Design · HS 2026

A scan from a phone app or a training tool often has 1 to 10 million splats. No device draws all
of them every frame, least of all a Quest. Spark uses **levels of detail (LoD)**. It keeps a tree
of the splats: each parent is a softer merge of its children. It draws at most a fixed number:
fine close up, coarse far away.

| Device | Splats drawn at most |
|---|---|
| Quest (in the Quest browser) | 500,000 |
| Android phone | 1 million |
| iPhone or iPad | 1.5 million |
| Laptop or desktop, also PC VR over Quest Link | 2.5 million |

These are Spark 2.4.0's built-in limits. The file can be much bigger than that. Only what you see
gets drawn.

## What the viewer does by itself

- **`.ply`, `.spz`, `.splat`, `.ksplat`, `.sog`:** the viewer builds the levels of detail when the
  file loads (`lod: true` in `src/config.js`). In our test, a 500,000-splat file took about
  2 seconds.
- **`.rad`:** the file already contains the levels of detail. From `public/splats/` the viewer
  streams it: Spark only fetches the parts it needs, so a scan appears quickly (0.3 to 0.4 s for
  our 500,000-splat test) and gets sharper as the rest arrives. Opened from your disk, it loads as
  a whole.
- **More or less detail:** `detail` in `src/config.js`, or `?detail=` in the URL.
  `?detail=0.5` draws half as many splats (smoother on a Quest), `?detail=2` twice as many.

So for most scans you don't need to do anything. Convert to `.rad` when a scan is very large
(several million splats), when you show it on a Quest, or when it should load fast for others.

## Convert a scan to .rad

One command, the same on Mac and Windows. It needs only the Node.js you installed for the course
(22.12 or newer; check with `node --version`). The converter is `gaussian-splat-lite`, an
open-source tool (Apache-2.0) that writes Spark's `.rad` format. The first time, `npx` downloads it
and asks `Ok to proceed?`: answer `y`.

Use your own file name instead of `my-scan.ply`.

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

It writes `my-scan-lod.rad` next to your scan. Copy it into your project:

**Mac**
```bash
cp my-scan-lod.rad ~/photolipsia-agentic-kit/02-splat-viewer/public/splats/
```

**Windows**
```powershell
Copy-Item my-scan-lod.rad $HOME\photolipsia-agentic-kit\02-splat-viewer\public\splats\
```

Then, in `02-splat-viewer`, run `npm run dev` and open http://localhost:5173/?file=my-scan-lod.rad.

- It reads `.ply` and `.spz`. A `.sog`, `.splat` or `.ksplat` doesn't need converting: the viewer
  builds the levels of detail itself. Or export a `.ply` from your scanning app.
- It never overwrites a file: delete the old `.rad` first, or choose a name with `-o`.
- A name with spaces needs quotes: `"my scan.ply"`.
- Windows says running scripts is disabled? See "Windows only: allow npm to run" in
  [student-setup.md](student-setup.md#windows-only-allow-npm-to-run).
- Git does not save files in `public/splats/`: keep your own copy of the `.rad`.

Options, after the file name:

| Option | What it does |
|---|---|
| `--max-sh 0` | Drops the view-dependent colour detail: half the size, a little flatter look |
| `--rad-chunked` | Writes a small `.rad` plus `.radc` pieces, for very large scenes. Keep them in the same folder |
| `--memory-budget 2` | Uses at most about 2 GB of memory, for laptops with 8 GB. The default is 4 |
| `-o other-name.rad` | Another output name |

### Measured here

Measured on the Linux laptop the kit was built on. Test file: a generated `.ply` with 500,000
splats (124 MB, full colour detail), not a real scan. Converter: `gaussian-splat-lite` 1.4.2 on
Node 20 and 24 (same result). Viewer: the course viewer with Spark 2.4.0, on the laptop's graphics
chip.

| Step | Time | Result |
|---|---|---|
| Convert to `.rad` | 7 s, 0.7 GB memory | 30 MB, 4× smaller |
| Convert with `--max-sh 0` | not measured | 14 MB |
| Convert with `--rad-chunked` | not measured | 15 chunk files |
| Open the `.ply`, levels of detail built in the browser | 2.0 s | |
| Stream the `.rad` from `public/splats/` (all three variants) | 0.3 to 0.4 s | fetched in pieces (`206` range requests) |

The `.rad` files look like the original. Not tested: Mac and Windows, `.spz` input, real scans
from phone apps.

### Plan B: Spark's own converter

If the command above fails, Spark has its own converter, `build-lod`. It needs Rust, which you
install once, and Spark's source code; the first conversion also builds the converter (about 2 to
3 minutes). Plan B was only run on Linux.

- Rust: Mac `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh`, Windows
  `winget install --id Rustlang.Rustup -e` (accept the Visual Studio C++ build tools it offers).
  Then open a new terminal.
- Spark, once, in your home folder: `cd ~`, then
  `git clone --depth 1 --branch v2.4.0 https://github.com/sparkjsdev/spark.git`
- Every scan, in the `spark` folder: Mac `npm run build-lod -- --quick ~/Downloads/my-scan.ply`,
  Windows `npm.cmd run build-lod -- --quick $HOME\Downloads\my-scan.ply` (in PowerShell, plain
  `npm` can drop the `--`). Options: `--max-sh=0`, `--rad-chunked`.

Measured here (Linux only): building the converter 2 min 20 s, then the same 124 MB `.ply` in 32 s
(30 MB `.rad`).

## Checking big files

`npm run check` draws in software, without a graphics card. That is fine for the small test
splat, but too slow for a streamed multi-million-splat scan: the check times out. Look at big files
in the browser instead, with `npm run dev` and `?file=my-scan-lod.rad`.
