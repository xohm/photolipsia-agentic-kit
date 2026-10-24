# Example 1: text stats, your first agent loop

A tiny app: paste text, see words, characters, sentences and reading time.
The app is not the point. The loop is: **plan → build → introspect → fix → log**.

Our run with GLM-5.3 Flash (24 October 2026): all six prompts in 2.7 minutes of agent time, for
$0.05. Its first tests expected the wrong numbers; `npm test` caught that before any page existed.
Same prompts on our own plans: Claude Code with Claude Opus 5.5 took 12.5 minutes, Codex with
GPT-6 Astra 5.8 minutes; both ended with passing checks.

Every prompt ends the same way: the agent runs `npm test` and `npm run check`,
reads `.check/report.json`, looks at `.check/screenshot.png` and tells you what it sees.

Each prompt is one of three moves: plan, go, check. `AGENTS.md` tells the agent to write a plan
for every new task and then stop. When it stops with a plan, read the plan, then type:

```text
Go.
```

## Two terminals

Keep two terminal windows or tabs open in your project folder:

- **Agent terminal:** runs your agent: `opencode`, `claude` or `codex`. You type prompts here.
- **Your terminal:** your own commands: `git`, `npm run dev`, opening files.
  New tab: **Cmd+T** in Mac Terminal, **Ctrl+Shift+T** in Windows Terminal.

Never ask the agent to run `npm run dev`: the server never ends, and the agent waits forever.

## Setup (once)

You work in your own fork of the course repository: see
[docs/student-setup.md](../docs/student-setup.md#git-and-github-your-own-fork). The folder
`01-text-stats` in it is a skeleton: the rules, the memory, the checks, and no app yet. You build
the app.

In your terminal (the same on Mac and Windows):

```bash
cd ~/photolipsia-agentic-kit/01-text-stats
npm install
npx playwright install chromium
npm run check
```

`npx playwright install chromium` downloads the hidden browser for `npm run check`
(about 300 MB, once per laptop). `npm run check` should then say **FAILED: Nothing rendered yet**,
followed by a few `npm error` lines. That is correct: there is no page yet.

Now open your agent terminal (a new tab) and go to the same folder (the same on Mac and Windows):

```bash
cd ~/photolipsia-agentic-kit/01-text-stats
```

Start your agent there and check what it uses:

- **OpenCode** (most of you): `opencode`. Type `/models` and check that **GLM-5.3-Flash** is
  selected (not FlashX, not Prime: the course key blocks them).
- **Claude Code:** `claude`. Type `/status`: it shows your plan, or the course key if you set
  Claude Code up for it.
- **Codex:** `codex`. The first time, it asks "Do you trust this folder?": answer **yes**, or
  `npm run check` can't run. Type `/status` to see the account and model.

Always start the agent inside `01-text-stats`, never in the main kit folder or your home folder:
the rules and deny rules are in the project folder. The few commands that differ between the tools
are in [the setup guide](../docs/student-setup.md#commands-in-each-tool).

## Prompt 1: plan

```text
Read AGENTS.md and ai/strategy.md. We are building a small web page: a text box
where I paste text, and below it live counts of words, characters and sentences,
plus the reading time. Put the counting logic in src/stats.js as pure functions
and export textStats(text), which returns { words, characters, sentences,
readingMinutes }. Test it with node:test in tests/stats.test.js. Fill in the
Goal and a plan of 4 to 6 small steps in ai/strategy.md. Don't write code yet.
```

Read the plan: open `ai/strategy.md` in VS Code (or, in your terminal, Mac
`open -e ai/strategy.md`, Windows `notepad ai\strategy.md`). Change it if you disagree. The plan
is yours.

## Prompt 2: build, tests first

```text
Go with step 1. Write the tests in tests/stats.test.js first, run npm test and
show me that they fail. Then write src/stats.js until they pass. npm run check
will still say "Nothing rendered yet": that is fine until the page exists.
Tick off the step in ai/strategy.md and stop.
```

Tests that fail first prove that they test something. When `npm test` passes, commit, in your
terminal:

```bash
git add -A
git commit -m "Prompt 2: stats with tests"
git push
```

Then continue:

```text
Continue with the next steps: index.html and src/main.js, so the page shows the
four numbers live while I type. Mark each number with data-stat="<key>", using
the keys from textStats(). Then simple styling: calm, readable, large numbers.
Set window.__APP_READY__ = true when the page is ready. One step at a time.
After each step run npm test and npm run check, tick it off in ai/strategy.md
and tell me what you see in the screenshot.
```

If it stops after a step or with a plan, read what it wrote and type `Go.`

With only `index.html` and no `main.js` yet, the check waits 10 seconds and says
**App not ready**. That is expected: nothing sets `window.__APP_READY__` yet.

**Check yourself:** in your terminal, run `npm run dev` and open http://localhost:5173. Type a
sentence: do the numbers change? Stop the server with **Ctrl+C**. Then commit:

```bash
git add -A
git commit -m "Prompt 2: page"
git push
```

## Prompt 3: introspect and fix

```text
Run npm run check. Read .check/report.json and look at .check/screenshot.png.
Describe the page in two sentences. Then add scripts/app-checks.mjs (see the top
of scripts/check.mjs for the format): type a sample sentence into the text box
and check that each [data-stat] number on the page matches textStats() from
src/stats.js. Run the check until it passes.
```

If it stops with a plan, read it and type `Go.`

**Check yourself:** open the screenshot (Mac: `open .check/screenshot.png`, Windows:
`start .check\screenshot.png`). Does it match what the agent described? Then commit:

```bash
git add -A
git commit -m "Prompt 3: app checks"
git push
```

## Prompt 4: break it

Break the app on purpose and watch the check catch it.

1. Open `index.html` in VS Code (on a Mac not in TextEdit: it shows the page, not the code).
   Change `data-stat="sentences"` to `data-stat="sentence"`. Save.
2. In your terminal, run `npm test`. It **passes**: the counting logic is fine.
3. Run `npm run check`. It **fails**. Read the `summary` at the top of `.check/report.json`.
   Depending on how `main.js` was written, it is a page error
   (`Cannot set properties of null … (at /src/main.js:…)`) or a failed app check
   (`page shows undefined`).

Unit tests check the logic. The check looks at the real page. You need both.

```text
npm run check fails. Read .check/report.json, find the cause and fix it.
Don't change the tests or scripts/app-checks.mjs.
```

When it says it is fixed, see exactly what it changed, in your terminal: `git diff` (scroll with
the arrow keys, **q** to leave). No output, or only a new line in `ai/strategy.md`? Then
`index.html` is back as it was at your last commit: the agent fixed only what you broke. Other
changes? Ask the agent why.

Then try a feature that touches several files:

```text
Add a "Clear" button that empties the text box and resets all numbers.
Plan it in ai/strategy.md first and wait for my "go".
```

Read the plan in `ai/strategy.md`. Then type:

```text
Go.
```

**Check yourself:** open `scripts/app-checks.mjs`. Is there a check for the button? `AGENTS.md`
says every feature you can see gets one. If it is missing, ask for it. Don't commit yet: Prompt 5
is the review before that commit.

**Undo:** if the agent made a mess, `git restore .` puts every committed file back as it was
at the last commit. New files stay: `git status` lists them. That is why you commit after every
prompt that works.

## Prompt 5: review and commit

```text
Summarise what changed since the last commit in five lines.
```

Then read for yourself, in your terminal. `git add -A` first, so new files show up too:

```bash
git add -A
git status
git diff --cached
```

The diff opens in a viewer: scroll with the arrow keys, press **q** to leave.
Read `ai/strategy.md`: are the decisions written down, each with a "because"? Then commit and
push, so your work is saved in your fork on GitHub:

```bash
git commit -m "Text stats"
git push
```

(`git` commands are the same on Mac and Windows.)

## Prompt 6: change the rules, start fresh

The rules and the strategy file only matter if they survive a new session. Try it.

1. Add one line of your own to `AGENTS.md`, under `## Code style`, for example:
   `- All text on the page is in sentence case.` Commit it: `git commit -am "My own rule"`,
   then `git push`.
   Then open `ai/strategy.md`: under `## Next` there must be a real step. Write it yourself, for
   example `- Apply my new rule to the page.` In our run `## Next` was empty, so the fresh session
   found nothing to do and never used the new rule.
2. Quit the agent with `/exit` (the same in all three tools) and start it again. It now
   remembers nothing.
3. Ask:

```text
Read AGENTS.md and ai/strategy.md, then do the step under ## Next.
```

Does the new session know where you stopped? Does it follow your new rule?
That is what the two files are for: the agent forgets, the files don't.

## What agents often get wrong

The rules in `AGENTS.md` are there because of mistakes like these:

- **It says "done" or "I looked at the screenshot" when it didn't.** `AGENTS.md` forbids this.
  Check yourself anyway.
- **It starts `npm run dev` and waits forever.** Press Esc and run it in your own terminal.
- **It changes the test instead of the code** to make a check pass. Say "Don't change the
  tests".
- **It knows an old version of a library.** That is why Example 2 has `ai/spark-facts.md`.
- **It goes in circles or gets slow in long sessions.** Stop it, commit what works, start a new
  session (`/new` in OpenCode and Codex, `/clear` in Claude Code).

What went wrong in our own runs: [docs/blender-and-splats.md](../docs/blender-and-splats.md#5-what-went-wrong-when-we-tried-it).

## Done when

- `npm test` passes
- `npm run check` says **OK** and the screenshot shows your page
- `ai/strategy.md` has the plan ticked off, one line per decision and a current `## Next`
