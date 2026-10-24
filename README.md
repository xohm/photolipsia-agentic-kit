# Photolipsia · Agentic coding

ZHdK · MA Interaction Design · HS 2026

Two weeks of coding with an AI agent in the terminal. Most of you use OpenCode with the course
key (one shared OpenRouter account, with the model GLM-5.3 Flash). If you have your own Claude or
ChatGPT plan, you can use Claude Code or Codex CLI with it instead. You build two small apps with
your agent. You get **skeletons, not apps**: rules for the agent, a memory file and a check that
looks at the result. Your agent writes the code. You plan, decide and check.

Fork this repository: your fork is your copy, where you work and save every step. Your fork is
public: anyone can see it.

## Start here

1. **Setup:** [docs/student-setup.md](docs/student-setup.md): your fork, picking your tool and
   account, installing it.
2. **Example 1, your first agent loop:** [guides/01-text-stats.md](guides/01-text-stats.md)
3. **Example 2, a viewer for your own 3D scans:**
   - in class: [guides/02-splat-viewer.md](guides/02-splat-viewer.md)
   - on your own, step by step: [guides/02-splat-viewer-alone.md](guides/02-splat-viewer-alone.md)
4. **Big scans:** [docs/big-scans.md](docs/big-scans.md)
5. **Blender, MCP and your own splats:** [docs/blender-and-splats.md](docs/blender-and-splats.md)

Before you start, read two short sections of the setup guide:
[where your prompts go, who sees them](docs/student-setup.md#where-your-prompts-go-who-sees-them)
(and how to switch off training on your own plan) and
[what it costs](docs/student-setup.md#what-it-costs).

## Slides

- [Agentic Coding · Your first agent loop](https://xohm.github.io/photolipsia-agentic-kit/slides/01-agentic-coding-basics.html)
- [Radiance Fields in the Browser](https://xohm.github.io/photolipsia-agentic-kit/slides/02-radiance-field-viewer.html)

Arrow keys, space or the buttons at the bottom to move, F for full screen, P to save as PDF.
They are also in `slides/` in your fork: double-click to open them without GitHub.

## What's here

```
01-text-stats/      skeleton for example 1
02-splat-viewer/    skeleton for example 2
guides/             what to type into your agent, step by step
docs/               setup and background
slides/             the two slide decks
tools/              check-openrouter.mjs: tests the course key
                    blender/splats.py: Gaussian splats in Blender 5.3, for the agent
```

Each skeleton has the same few files:

- `AGENTS.md`: the rules every agent reads (Claude Code through `CLAUDE.md`)
- `ai/strategy.md`: the plan and the decisions, the agent's memory
- `scripts/check.mjs`: `npm run check` opens your page in a hidden browser and writes a report and a screenshot

A skeleton is also a blank template for your own projects: copy it and change the goal in
`ai/strategy.md`.

## The loop

**Plan → build → introspect → fix → log.** Small steps, every time.

You type three kinds of prompt: a plan, then `Go.`, then a check. "Introspect" means the agent
runs `npm run check` (the check), reads the report and looks at the screenshot. Then you look
yourself.

## Save your work

After every step that works, in your terminal:

```bash
git add -A
git commit -m "What you did"
git push
```

`git push` saves it in your fork on GitHub, where your teacher can follow it.
Splat files in `public/splats/` are not saved by git: keep your own copies.

## Licence and your work

- **The code** in this kit (the two skeletons and `tools/`) is under the MIT licence: see
  [LICENSE](LICENSE). If you copy a skeleton into another project, keep a copy of `LICENSE`
  with it.
- **The texts** (slides, guides, docs and this README) are under CC BY 4.0: see
  [LICENSE-CONTENT.md](LICENSE-CONTENT.md). You may share and change them if you name the source.
- **Your fork is public.** Anyone can see what you push: your code, your `ai/strategy.md`, your
  commit messages and your GitHub name.
- **The skeletons are yours to reuse.** They are MIT-licensed, so you may keep them in your own
  projects, also after the course.

## For teachers

[docs/teacher-setup.md](docs/teacher-setup.md): the OpenRouter account, the key and its
guardrail, testing the three tools, PC VR on Windows, the course checklist and the costs.
