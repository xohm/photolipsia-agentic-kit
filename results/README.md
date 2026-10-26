# Results: what GLM built

Two folders, one per example. In each is the app exactly as GLM-5.3 Flash built it in OpenCode on
26 October 2026, with the prompts from the guides, word for word. Nobody fixed or polished it.

| Folder | Example | The run |
|---|---|---|
| [`01-text-stats/`](01-text-stats/RUN.md) | Example 1, prompts 1 to 6 | 8.3 min of agent time, $0.11, check OK |
| [`02-splat-viewer/`](02-splat-viewer/RUN.md) | Example 2, prompts 1 to 8 | 23.9 min of agent time, $0.30, check OK |

Each folder has a `RUN.md`: every prompt, how long it took, what it cost, what `npm test` and the
check said after it, what the agent answered, and where it went wrong. And `screenshot.png`, the
last screenshot of the check.

## When you are stuck

- **Open `RUN.md` at the prompt where you are.** What did GLM do there, and what did the check say?
- **Compare one file at a time** with yours, for example `01-text-stats/src/stats.js`. Then tell
  your agent what you found, in your own words.
- **Run it** to see it working: `cd ~/photolipsia-agentic-kit/results/01-text-stats`, then
  `npm install` and `npm run dev`. `RUN.md` has the steps.

Don't copy these files into your project, and don't ask your agent to read them: then you learn
nothing about the loop, and your fork shows it. They are one run of one model, not the right
answer: yours can look different and be just as good.

## Not here

- Blender and Spirula: the agent works inside your Blender scene, so there are no files to keep.
- Your own scans: Example 2 ran with a copy of the generated test splat as "my scan".
