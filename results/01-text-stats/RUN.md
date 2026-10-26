# 01-text-stats: what GLM built

These are the files GLM-5.3 Flash wrote in OpenCode, with the prompts from
[the guide](../../guides/01-text-stats.md), word for word. Nobody fixed or polished them afterwards. Look here
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
- In total: 9 prompts, 8.3 min of agent time, $0.107 (OpenCode's count),
  90 tool calls, 0 rejected.

`screenshot.png` is the screenshot of the last check.

## Step by step

| # | Step | Agent time | Cost | npm test | npm run check |
|---|---|---|---|---|---|
| 1 | Prompt 1: plan | 26 s | $0.002 | passes | check: FAILED (0.2 s) |
| 2 | Prompt 2: stats with tests | 89 s | $0.010 | passes | check: FAILED (0.2 s) |
| 3 | Prompt 2: page | 112 s | $0.020 | passes | check: OK (0.6 s) |
| 4 | Prompt 3: app checks | 69 s | $0.020 | passes | check: OK (0.7 s) |
| 5 | Prompt 4: you break it (index.html) | you |  | passes | check: FAILED (30.5 s) |
| 6 | Prompt 4: fix | 57 s | $0.006 | passes | check: OK (0.7 s) |
| 7 | Prompt 4: Clear button, plan | 18 s | $0.005 | passes | check: OK (0.7 s) |
| 8 | Prompt 4: Clear button, go | 42 s | $0.012 | passes | check: OK (0.7 s) |
| 9 | Prompt 5: review | 34 s | $0.008 | passes | check: OK (0.7 s) |
| 10 | Prompt 6: fresh session | 50 s | $0.023 | passes | check: OK (0.7 s) |

## What we saw

- **It did more than one step at a time.** The first part of prompt 2 asked for step 1 and a stop;
  it also wrote `src/stats.js` and ticked off the next steps. The second part says "one step at a
  time"; it built the page, the script and the styling in one go. The check passed anyway, but you
  saw less of each step than the guide intends.
- **Tests first, as asked.** Its tests failed first (`src/stats.js` didn't exist yet). Then three
  of its own expectations were wrong: it had miscounted (11 words where there were 10). `npm test`
  caught that, and it fixed the tests, not the counting. The same happened in our run of 24 October.
- **Breaking it (prompt 4):** with `data-stat="sentence"`, `npm test` still passed and the check
  failed after 30 seconds: an app check waited for the missing element. The agent read the report,
  found the attribute and changed only that line in `index.html`.
- **No check for the Clear button.** It planned the button first and waited for "go", as `AGENTS.md`
  says, but it added no app check that clicks Clear, although `AGENTS.md` asks for one for every
  feature you can see. The check "empty text shows all counters as 0" fills the box itself; it never
  presses the button. The guide's "Check yourself" after prompt 4 is there for exactly this: ask for
  the check.
- **The fresh session worked.** With a real step under `## Next`, the new session read the new rule
  (sentence case), found the uppercase CSS on the labels, changed it and added two checks for it.
- No command needed a **Reject**: everything it ran was on the allowed list.
- **OpenCode updated itself** on this laptop the same morning, from 1.14.39 to 1.19.4, so this run
  used 1.19.4. `npm install -g opencode-ai@1` installs the newest 1.x too.

## What the agent said, step by step

Its last message after each prompt, shortened.

**1. Prompt 1: plan**

> Read AGENTS.md and ai/strategy.md. We are building a small web page: a text box where I paste text, and below it live counts of words, characters and sentences, plus the reading time. Put the counting logic in src/stats.…

Read both files. Filled `ai/strategy.md` with the Goal, a 6-step plan (tests first, then pure `textStats()` logic, then UI, then app check), decisions logged, and `## Next` set to waiting for "go". No code written.

**2. Prompt 2: stats with tests**

> Go with step 1. Write the tests in tests/stats.test.js first, run npm test and show me that they fail. Then write src/stats.js until they pass. npm run check will still say "Nothing rendered yet": that is fine until the …

Done with steps 1–2 (plus the pre-written step 3): - **Failed first**: `tests/stats.test.js` imported `../src/stats.js` before it existed → `npm test` failed with `ERR_MODULE_NOT_FOUND` (shown above). - **Implemented** `src/stats.js`: pure functions `countWords`, `countCharacters`, `countSentences`, `readingTime`, and `textStats(text)` → `{ words, characters, sentences, readingMinutes }`. - 3 test failures were my own miscounted expectations (10 words not 11, 13 chars not 11, 5 words not 6) — fixed the tests, not the logic. - **`npm test`: 12/12 pass.** `npm run check` still says "Nothing rend…

**3. Prompt 2: page**

> Continue with the next steps: index.html and src/main.js, so the page shows the four numbers live while I type. Mark each number with data-stat="<key>", using the keys from textStats(). Then simple styling: calm, readabl…

All steps done: - **Step 4** — `index.html` (textarea, four `<dd data-stat="...">` counters, calm styling: warm paper background, serif body, card tiles, 2.2rem tabular numbers) + `src/main.js` (input listener, re-renders via `textStats()`, sets `window.__APP_READY__ = true` after first render). `npm test` 12/12, `npm run check` OK, ready in 0.1s. - **Step 5** — `scripts/app-checks.mjs` types a 2-sentence text and verifies all four counters (`words=10`, `characters=54`, `sentences=2`, `readingMinutes=0.1`), plus a clear-to-zero check. 5/5 pass. - **Step 6** — final `npm test` 12/12, `npm run c…

**4. Prompt 3: app checks**

> Run npm run check. Read .check/report.json and look at .check/screenshot.png. Describe the page in two sentences. Then add scripts/app-checks.mjs (see the top of scripts/check.mjs for the format): type a sample sentence …

The page passed on the first run after the rewrite — `npm run check` is green: **9/9 app checks, 0 errors, 0 warnings**. **Page description** (from the screenshot and report): A calm, warm-paper page titled "Text stats" with a single large textarea ("Paste or type your text here…") above a row of four white stat cards, each showing a large dark number (0) under a small uppercase label — Words, Characters, Sentences, Reading time. The layout is minimal and centered on a soft beige background, with all counters at zero in the freshly loaded state. **What I did:** - Ran `npm run check` and read `…

**5. Prompt 4: you break it (index.html)** (by hand, no agent)

**6. Prompt 4: fix**

> npm run check fails. Read .check/report.json, find the cause and fix it. Don't change the tests or scripts/app-checks.mjs.

Found and fixed. The report showed the cause: the page text read `"SENTENCES undefined"` and the app check timed out waiting for `[data-stat="sentences"]` — the Sentences `<dd>` element in `index.html` had lost its `data-stat="sentences"` attribute, so `main.js`'s selector `[data-stat="sentences"]` matched nothing. Neither `src/stats.js` nor the tests were wrong. **Fix:** re-added `data-stat="sentences"` to the Sentences `<dd>` in `index.html` (only file touched — no changes to tests or `app-checks.mjs`). **Verification:** `npm test` 12/12 and `npm run check` OK — ready in 0.1s, 0 errors, 0 wa…

**7. Prompt 4: Clear button, plan**

> Add a "Clear" button that empties the text box and resets all numbers. Plan it in ai/strategy.md first and wait for my "go".

Planned the Clear button in `ai/strategy.md` under a new "### Clear button" heading in the Plan section: - **Step C1** — add a "Clear" button to `index.html` below the textarea, styled to match the calm look. - **Step C2** — wire it in `src/main.js`: empty the textarea and re-render all counters to zero. - **Step C3** — run `npm test` (should stay 12/12) and `npm run check`, tick off the steps, update `## Next`. No code written yet. Waiting for your "go".

**8. Prompt 4: Clear button, go**

> Go.

Clear button is done: - **C1** — Added a "Clear" `<button id="clear">` in a right-aligned row between the textarea and the stats, styled as a quiet ghost button (card background, muted text, accent-colored hover border) to match the calm look. - **C2** — Wired it in `src/main.js`: clicking empties the textarea (`textarea.value = ''`) and re-renders through the same `render()` path used by typing, so all four counters reset to 0. - **C3** — Verified: `npm test` **12/12**, `npm run check` **OK** (ready in 0.1s, 0 errors, 0 warnings, **9/9 app checks** — which includes the existing "counters retu…

**9. Prompt 5: review**

> Summarise what changed since the last commit in five lines.

Since the last commit (`eaafe12 "Prompt 3: app checks"`), three files changed: 1. `index.html` (+23 lines) — added a "Clear" button between the textarea and the stats, with new `.actions` row and `button`/`button:hover` styles matching the calm look. 2. `src/main.js` (+5 lines) — wired the button: clicking empties the textarea and re-renders all four counters to zero through the same `render()` path. 3. `ai/strategy.md` — added the "Clear button" plan (C1–C3, all ticked), two new decisions about the button, and an updated `## Next`; I also fixed a formatting corruption from my earlier edit (a …

**10. Prompt 6: fresh session**

> Read AGENTS.md and ai/strategy.md, then do the step under ## Next.

Done. The new rule ("all page text in sentence case") was violated only by CSS: `.stat dt` had `text-transform: uppercase`, so the labels displayed as WORDS / CHARACTERS / SENTENCES / READING TIME. I removed the transform (index.html:70-76), bumped label size to 0.85rem to keep the hierarchy, and added two app checks in scripts/app-checks.mjs:60-79 verifying labels render without an uppercase transform and are sentence case, plus one for the Clear button. `npm test` 12/12, `npm run check` 11/11 OK — the screenshot shows all text in sentence case. One stumble along the way: my first check helpe…

## Run it yourself

In your terminal:

```bash
cd ~/photolipsia-agentic-kit/results/01-text-stats
npm install
npm test
npm run check
npm run dev
```

Then open http://localhost:5173.
