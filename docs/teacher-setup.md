# Teacher setup

Photolipsia · ZHdK · MA Interaction Design · HS 2026

One OpenRouter account, one shared API key with a hard credit limit, and a guardrail that only
allows the two course models and caps daily spending. 15 students, two weeks.

Most students use **OpenCode on the course key**: that is the main path, and all course examples
were run with it. The key is for every student **without** a Claude or ChatGPT plan (Claude Code
and Codex can also be set up for it). Students with their own plan may use Claude Code or Codex on
that plan instead; they don't use the key, and the key's budget and guardrail don't cover them. See
[Students on their own plans](#students-on-their-own-plans) in section 7.

Facts below were checked against the OpenRouter docs on 2026-10-23. Dashboard labels change;
the links go to the current pages.

**Slides:** [deck 1](https://xohm.github.io/photolipsia-agentic-kit/slides/01-agentic-coding-basics.html) ·
[deck 2](https://xohm.github.io/photolipsia-agentic-kit/slides/02-radiance-field-viewer.html) (open in the browser).

Contents

1. [Account and credits](#1-account-and-credits)
2. [The shared key](#2-the-shared-key)
3. [The guardrail](#3-the-guardrail)
4. [Test it](#4-test-it)
5. [Optional: EU routing](#5-optional-eu-routing)
6. [Set up and test the three tools yourself](#6-set-up-and-test-the-three-tools-yourself)
7. [Distribute the key and the kit](#7-distribute-the-key-and-the-kit)
8. [Course checklist](#8-course-checklist)
9. [Troubleshooting](#9-troubleshooting)
10. [Cost estimate](#10-cost-estimate)

---

## 1. Account and credits

1. Sign up at https://openrouter.ai with the course or teaching email.
2. Buy credits at **Settings → Credits** (https://openrouter.ai/settings/credits).
   - The fee is **5.5% on card payments** (minimum $0.80) and 5% with crypto.
   - Credits can expire after one year. Purchases are refundable only within 24 hours.
   - Buy about $150 to start. Top up after the first days if the Activity page says so.
3. **Auto top-up** (same page) refills when the balance drops below a threshold. For a course, a
   fixed budget is easier to reason about: leave auto top-up **off** and use the alert instead.
4. **Low balance alert:** **Settings → Notifications**. Email only. The default threshold is
   $100: set it to about $40, one day of course budget.

Spending controls (budgets and guardrails) are not available on the **Free** plan. Once you buy
credits you are on the pay-as-you-go plan, which includes them. Check https://openrouter.ai/pricing
if the Guardrails page is greyed out.

---

## 2. The shared key

**Settings → API Keys** (https://openrouter.ai/settings/keys) → **Create API Key**.

| Field | Value |
|---|---|
| Name | `photolipsia-hs26` |
| Credit limit | `350` (dollars) |
| Reset | none: the limit is for the whole course |
| Expiry | a few days after the last course day, if offered |

Copy the key when it is shown: it is shown only once. It starts with `sk-or-v1-`.
Keep it in your password manager.

The credit limit is the hard ceiling for the whole course. The guardrail (next step) adds a
daily ceiling and the model allowlist.

---

## 3. The guardrail

**Workspaces → Default → Guardrails** (https://openrouter.ai/workspaces/default/guardrails)
→ **New Guardrail**.

| Setting | Value |
|---|---|
| Name | `photolipsia` |
| Budget limit | `$40`, reset **daily** (resets at midnight UTC) |
| Model allowlist | `z-ai/glm-5.3-flash` and `z-ai/glm-5.3` |
| Provider allowlist | empty (all providers), or see the note below |

Save it, then **assign** it: open the guardrail and add the course key under **API Keys**.
A guardrail does nothing until it is assigned. A key can have one directly assigned guardrail.

Notes

- Each workspace also has a **default guardrail** that applies to all its traffic. The docs only
  show how to edit it through the API, so assigning to the key is simpler.
- If you add more guardrails, their allowlists intersect and each budget is checked on its own.
- **Reasoning effort:** both models reason by default at `max`. The student configs set `high`.
  Ask students to use GLM-5.3 (not Flash) only for hard problems, and never at `max`.
- **Provider allowlist (optional):** OpenRouter routes to the cheapest provider by default. For
  GLM-5.3 that can be a heavily quantised (fp4) endpoint. Restricting providers to `Z.AI` gives
  the original model, but GLM-5.3 then costs $1.40 / $4.40 per million tokens instead of about
  $0.08 / $1.40. Flash costs $0.15 / $0.50 at Z.AI and at most other providers; by default it,
  too, can go to a cheaper quantised (fp4 or fp8) endpoint.
- **GLM-5.3 against Flash:** with all providers allowed, GLM-5.3 costs about 3× Flash for output
  (and less for input); restricted to Z.AI, about 10×. The student docs say "up to about ten
  times".
- **Optional filter:** with an organisation account, **Settings → Privacy → "Filter the model
  catalog for API keys"** makes the model list show students only the allowed models. That is
  nice in `/models` pickers.
- **Look-alike models:** OpenCode's own model catalog (`~/.cache/opencode/models.json`) lists
  "GLM 5.3 FlashX" and "GLM 5.3 Prime" next to GLM-5.3-Flash and GLM-5.3. The guardrail blocks
  them (403); the student docs tell students to pick GLM-5.3-Flash.
- **Privacy:** check **Settings → Privacy** for the options on providers that may log prompts or
  train on them, and decide before day one what students are told. The student guide has a
  section for it ("Where your prompts go, who sees them" in
  [student-setup.md](student-setup.md#where-your-prompts-go-who-sees-them)). The labels here come
  from the docs, not from clicking through.

---

## 4. Test it

Set the key in your own terminal (same commands as the students, see
[student-setup.md](student-setup.md#4-the-course-key)), then in the course kit folder:

```bash
node tools/check-openrouter.mjs
```

Same command on Mac and Windows. Expected:

```
key: sk-or-v1-... (NN characters)
key info: limit $350.00, used $0.00, left $350.00
z-ai/glm-5.3-flash (should work): 200 OK "hello"
<some other model> (should be blocked): 403 OK "..."

All good.
```

If the other model answers with `200`, the guardrail is not assigned to this key.

---

## 5. Optional: EU routing

`https://eu.openrouter.ai` keeps requests on EU infrastructure. It requires the **Business**
(self-serve, 8% fee instead of 5.5%) or Enterprise plan: **Settings → Manage plan**.

If you use it, every base URL changes:

| Tool | Setting | EU value |
|---|---|---|
| OpenCode | `provider.openrouter.options.baseURL` in `opencode.json` | `https://eu.openrouter.ai/api/v1` |
| Claude Code | `ANTHROPIC_BASE_URL` in `~/.claude/settings.json` | `https://eu.openrouter.ai/api` |
| Codex CLI | `base_url` in `~/.codex/config.toml` | `https://eu.openrouter.ai/api/v1` |
| `tools/check-openrouter.mjs` | `API` constant at the top | `https://eu.openrouter.ai/api/v1` |

Check on the model pages that both GLM models have EU endpoints before switching.

---

## 6. Set up and test the three tools yourself

Use exactly the student configs: [student-setup.md](student-setup.md), sections 4 to 8 (the
course key, OpenCode, Claude Code, Codex, the smoke test). Then, on your own machine and ideally
on one Windows laptop:

Versions used to prepare the kit: OpenCode 1.14.39 locally (npm `opencode-ai@1` was 1.19.4),
Claude Code 2.1.302, Codex CLI 0.155.1. Students install the current versions.

1. Smoke test in each tool (section 8 of the student guide).
2. Run both examples in OpenCode in a fork of this kit, following
   [guides/01-text-stats.md](../guides/01-text-stats.md) and
   [guides/02-splat-viewer.md](../guides/02-splat-viewer.md).
3. Repeat Example 1 in Claude Code and in Codex: on the course key, and on a plan if you have one.
4. On the OpenRouter **Logs** page (https://openrouter.ai/logs), check that every request used one
   of the two models and none got a 403. A 403 means a tool calls a hidden extra model. The
   configs set `small_model` (OpenCode) and all model variables (Claude Code) to prevent that.
5. Ask the agent in each tool to look at `.check/screenshot.png` and describe it. GLM-5.3 Flash
   can see images, GLM-5.3 cannot. Note which tools pass the image through: see "Untested" in
   `NOTES.md` in the solutions repository (private).

**VR with a Quest 3** (Example 2, prompt 7). PC VR, where the computer renders and the headset
only displays, needs Windows: Quest Link, Air Link and SteamVR don't run on macOS. Mac students
use the Quest's own browser instead (`npm run dev:vr`, https on the local network). There the
Quest draws at most 500,000 splats; big scans should be `.rad` files ([big-scans.md](big-scans.md)).
Test before class whether your room's Wi-Fi lets a Quest reach a laptop. Many university networks
isolate devices; a small router or a phone hotspot solves it.

**PC VR on Windows, checklist per PC** (documented by Chromium and Meta, not tested here):

1. The GPU must be supported by Link: workstation GPUs and Intel Arc are not. Installing Link and
   setting the OpenXR runtime needs admin rights.
2. Meta Horizon Link app: the cable test passes; *Settings → General → OpenXR Runtime → Set Meta
   Horizon Link as active*; *Unknown Sources* on; SteamVR closed.
3. Chrome (stable): open https://immersive-web.github.io/webxr-samples/immersive-vr-session.html and
   press Enter VR. The scene must appear in the headset. Chrome asks for VR permission on the
   **monitor**; allow it (or allow it in advance at `chrome://settings/content/vr`).
4. `npm run dev` in the splat viewer and http://localhost:5173: the button reads Enter VR.
   `localhost` counts as secure, so no https is needed on the PC itself.
5. Enter and exit VR three times. If it hangs for more than 15 s: close every Chrome window,
   restart Link, then reboot. A user report (Aug 2026) describes requestSession hanging over
   Link in Edge; Chrome over a USB cable is the most reliable combination.
6. Write down the Chrome version, the Link version and the GPU driver of each PC that works.

**Our runs of Example 1** (24 October 2026, Linux, the same prompts and student steps):

| Tool and account | Agent time | Result | Notes |
|---|---|---|---|
| OpenCode, course key (GLM-5.3 Flash) | 2.7 min | checks pass, $0.05 | the run on the slides |
| Claude Code, Max plan (Claude Opus 5.5) | 12.5 min | checks pass | looked at every screenshot; refused a fake `.env`; asked before piped commands |
| Codex, ChatGPT plan (GPT-6 Astra) | 5.8 min | checks pass | its check couldn't run in the sandbox (fixed in the skeleton since); read the fake `.env` with a script but hid the value |
| Claude Code, course key | not run yet | | |
| Codex, course key | not run yet | | |

Example 2 and the Blender parts ran only in OpenCode with GLM-5.3 Flash.

Known differences

- **OpenCode** reads `AGENTS.md`, honours `opencode.json` deny rules (also for shell commands that
  name the files) and is the most reliable with GLM.
- **Claude Code** reads `CLAUDE.md`, which imports `AGENTS.md`. `.claude/settings.json` denies
  reading and editing `.env*`, `node_modules/` and `public/splats/`: that blocks its own file tools
  and commands like `cat`, `head`, `tail`, `sed`, not a script it writes. The skeleton lets it run
  `npm test`, `npm run check`, `git status/diff/log` and `ls` without asking, but not `node` (a
  script could read past the deny rules). On OpenRouter it is supported only with Anthropic
  models; effort settings probably don't reach GLM.
- **Codex** has no file deny rules. Its sandbox lets commands write only inside the project. The
  skeleton's `.codex/config.toml` lets `npm run check` start its local server inside the sandbox
  (without it every check crashed with "listen EPERM" and the agent never saw a screenshot) and
  lets commands in the project use the internet (`npm install`). Codex reads that file only in a
  folder the student trusted: they must answer **yes** to "Do you trust this folder?".

---

## 7. Distribute the key and the kit

**One public kit.** This repository is the whole course for students: the two skeletons, the
guides, the setup docs, the slides and this guide. Students fork it and build the apps with their
own agent ([student-setup.md](student-setup.md#git-and-github-your-own-fork)). They use the
Fork button on github.com, then plain git:

```bash
git clone https://github.com/YOUR-NAME/photolipsia-agentic-kit.git
git remote add upstream https://github.com/xohm/photolipsia-agentic-kit.git
```

They use `gh` only on a Mac, once, for `gh auth login` (so `git push` can log in); Git for Windows
logs in through the browser by itself.

**The solutions stay private**, in a separate repository: both finished apps, the single-file
viewer and the notes on what was tested (`xohm/photolipsia-solutions`, ask for access). Clone it
next to the kit and run its check before every push to the kit:

```bash
cd photolipsia-solutions
node tools/check-kit.mjs
```

It refuses if app code, the single-file viewer, a hint at the solutions or something that looks
like a real API key would land in the kit, and it checks that the skeleton files (rules, ignores,
check script) match the finished apps.

**Updates during the course.** Students commit their own work, then run
`git pull --no-edit upstream main` and `git push` (the setup sets `pull.rebase false`, so the pull
merges and doesn't stop with "divergent branches"). Push updates only to `docs/`, `guides/`,
`slides/` and `tools/` during the course: a change to a skeleton file (`AGENTS.md`,
`ai/strategy.md`, `scripts/check.mjs`) can conflict with students' own edits. On `CONFLICT` the
student docs say `git merge --abort` and ask you.

**The slides** are served from this repository with GitHub Pages (*Settings → Pages*: branch
`main`, folder `/`; the empty `.nojekyll` file serves the HTML as it is). Link to the addresses at
the top of this guide. The decks are built from sources in the solutions repository: edit
`slides-src/` there, never the HTML in `slides/`, and run its `npm run check` (see its README).

**Your own course:** fork the kit (and ask for the solutions), then replace `xohm/photolipsia-agentic-kit`
and `xohm.github.io/photolipsia-agentic-kit` with your names in `README.md`, `docs/` and the slide
sources (`slides-src/` in the solutions), then rebuild the slides.

- **Forks of a public repository are public:** everyone can see the students' work. For private
  work, mark the kit as a template (*Settings → Template repository*) and let students use
  *Use this template* with a private repository, or use GitHub Classroom. With a template,
  students can't pull your updates with git ("refusing to merge unrelated histories"): plan
  updates as files they copy.
- **Following the class:** on GitHub, *Insights → Forks* lists every fork. Students push after
  every step, so you see where everyone is.
- Never hand out a zip of your own working folder: it contains installed packages and check output.

**The key:**

- Hand it out **individually**: printed on a slip, or through a shared password-manager item.
  Never in a group chat, an email to the class, a slide or the repository.
- Tell students the rules from the student guide: environment variable or home-folder config
  only, never in a project, a commit, a screenshot or a prompt.
- Remind them on day one that a leaked key costs the course budget, not them.

### Students on their own plans

A student with a Claude plan (Pro, Max, Team or Enterprise) may use Claude Code with it; with a
ChatGPT plan (Plus or higher), Codex. The free Claude plan doesn't include Claude Code, and ChatGPT
Free and Go don't list the Codex CLI. These students don't get the key.

- **Outside your setup.** Their requests don't go through OpenRouter: the guardrail, the daily
  budget, Activity and Logs don't see them. Their prompts, files and screenshots go to Anthropic
  or OpenAI (USA), under their own account.
- **Training switches.** Ask them to switch training off before day one:
  - Claude (Pro, Max): claude.ai → **Settings → Privacy**, "Help improve Claude". With it on,
    Anthropic trains on their chats and Claude Code sessions and keeps them 5 years; with it off,
    30 days.
  - ChatGPT (Plus, Pro): **Settings → Data controls → "Improve the model for everyone"**. One
    switch covers ChatGPT and Codex. Business, Edu and Enterprise: no training by default.
- **Limits.** Their work counts against the plan: a 5-hour window and a weekly limit, shared with
  the chat app (ChatGPT Plus: a 5-hour window, weekly limits may apply). `/usage` shows what is
  left; big models use it faster. When a limit is reached, they wait for the reset (or switch on
  Claude's paid usage credits, at their own cost).
- **Tested less.** Example 1 ran with both tools on a plan (section 6). Example 2 and the Blender
  parts did not.

---

## 8. Course checklist

### Before

- [ ] Credits bought, auto top-up off, low-balance alert at ~$40
- [ ] Key created with a $350 limit (and an expiry, if offered)
- [ ] Guardrail with both models, $40 daily budget, assigned to the key
- [ ] Privacy settings of the course account (students read about them in student-setup.md,
      "Where your prompts go"). Recommended:
      - Settings › Observability: **Input & Output Logging off** (off by default; when on,
        OpenRouter keeps prompts and answers for at least 3 months and you can read them).
      - Settings › Privacy: **"OpenRouter use of inputs/outputs" off** (the 1% discount; when on,
        you grant OpenRouter a licence to the content).
      - Settings › Privacy: **training off**: don't allow providers that may train on your data,
        for paid and for free models (the docs suggest that is the default; the exact labels were
        not checked).
      - Settings › Privacy: **Zero Data Retention on** for "All other models" (or on the course
        guardrail). It removes the providers that keep prompts: 7 of 48 for GLM-5.3, 6 of 38 for
        GLM-5.3 Flash (October 2026). Then tell students it is on.
      - No Broadcast destinations.
      OpenRouter's terms require users to be 18 or older.
- [ ] `node tools/check-openrouter.mjs` says "All good"
- [ ] All three tools tested on your machine; both examples run in OpenCode
- [ ] One Windows laptop tested (PowerShell execution policy with `-Force`, the key command from
      [student-setup.md](student-setup.md#4-the-course-key) section 4, OpenCode, `npm run check`)
- [ ] Students got the kit link and the setup guide before day one, and know which account to
      use (student-setup.md section 2: no plan, the course key with OpenCode)
- [ ] Students on their own Claude or ChatGPT plan switched training off and know `/usage`
      ([Students on their own plans](#students-on-their-own-plans))
- [ ] Blender MCP (the Blender slides in deck 2) tried once on a Mac and a Windows laptop: open Blender once,
      `uvx mcp-for-blender@2.2.4 install-addon`, the MCP entry for the tool
      ([blender-and-splats.md](blender-and-splats.md)), then the slide's prompt.
      Tested on Linux only (2026-10-24, Blender 5.3 beta, GLM-5.3 Flash in OpenCode).
      Claude Code and Codex with the Blender MCP: not tested yet.
- [ ] Gaussian splats in Blender (deck 2): students need **Blender 5.3** (release planned for
      10 Nov 2026; until then the beta from https://builder.blender.org/download/daily/). It opens
      splat `.ply` files itself; `tools/blender/splats.py` saves them again. Blender 5.2 and older
      can't open splats.
- [ ] Spirula Studio (deck 2) opened once on a Mac and a Windows laptop. If macOS blocks the app or
      the `spirula` command: System Settings → Privacy & Security → **Open Anyway** (right-click →
      Open no longer works on macOS 15 and later). While training it serves a preview on port 7007
      to the whole network. Tested on Linux only (2026-10-24).
- [ ] Key slips or password-manager items prepared, for every student without a plan

### During

- [ ] **After day 1 and day 2:** **Activity** (https://openrouter.ai/activity), filtered by the key.
      Is daily spend well below $40? Any requests from unexpected models?
- [ ] **Logs** (https://openrouter.ai/logs): many 403s mean a student's tool config is wrong.
      Many 402s mean the key limit or balance is reached.
- [ ] Remind students to quit idle agents and to start a new session for a new task (long
      sessions resend a long history with every request).
- [ ] Adjust the daily budget if the cohort needs more or less.

**If the key leaks** (posted, committed, screenshotted):

1. **Settings → API Keys**: delete or disable the key right away.
2. Create a new key with the remaining budget as its limit and assign the guardrail to it.
3. Check **Activity** for requests after the leak.
4. Hand out the new key privately. Students update it everywhere they put it: see the box
   "If the key changes" in [student-setup.md](student-setup.md#4-the-course-key).
5. If the key was committed, deleting the file is not enough: it stays in the history. Treat
   the old key as public. Revoking it (step 1) is what protects the budget.

### After

- [ ] Delete the key.
- [ ] Export the Activity as CSV for the course report.
- [ ] Check that auto top-up is off and note the remaining credits.

---

## 9. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `403`, `permission_denied`, model not allowed | The tool requested a model outside the allowlist: OpenCode without `small_model`, Claude Code without all model variables, or a typo | Fix the student's config (student guide, sections 5 to 7) |
| `403` "Budget limit exceeded (daily limit)…" | Guardrail budget reached today | Wait until midnight UTC, or raise the budget in the guardrail |
| `402` or `403` "Key limit exceeded" | The key's $350 limit is used up | Raise the key's credit limit |
| `402` "insufficient credits" | Account balance empty | Buy credits |
| `401` "User not found" | Wrong or deleted key, or the terminal doesn't see the variable | Run `node tools/check-openrouter.mjs` in the student's terminal |
| Guardrail page greyed out | Free plan | Buy credits (pay-as-you-go plan) |
| Other models still answer | Guardrail not assigned to the key | Guardrail → API Keys → add the key |
| Images rejected or ignored | GLM-5.3 is text-only | Use GLM-5.3 Flash when the agent needs to look at screenshots |
| Responses API `400` about `store` or `previous_response_id` | OpenRouter's Responses API is stateless | Should not happen with current Codex. Update Codex |
| Slow answers | `max` reasoning | Set effort `high` or `low` in the tool config |
| Codex: `npm run check` fails with "listen EPERM", no screenshot | The folder isn't trusted, so Codex ignores the project's `.codex/config.toml` | Start Codex in the project folder and answer yes to "Do you trust this folder?" |
| A student on a plan: the agent stops, usage limit reached | The plan's 5-hour window or weekly limit is used up | `/usage` shows it. Wait for the reset; a smaller model (`/model`) and new sessions make it last longer |

---

## 10. Cost estimate

**Prices** (OpenRouter, 2026-10-23, per million tokens):

| Model | Input | Output | Cached input | Images |
|---|---|---|---|---|
| `z-ai/glm-5.3-flash` | $0.15 | $0.50 | $0.03 | yes |
| `z-ai/glm-5.3` (Z.AI) | $1.40 | $4.40 | | no |

**One student-day with Flash**, as a rough guide. An agent session resends its history on every
step, so input dominates:

- about 150 agent steps × 30,000 tokens of context ≈ 4.5 M input tokens. Much of it is cached,
  but without caching that is $0.68.
- about 0.3 M output tokens including reasoning: $0.15
- total: **about $0.80**

**15 students × 10 days ≈ $120**, plus the 5.5% fee. Heavy days, long sessions and some GLM-5.3
use can double or triple that, so plan for **$100–300**. The $40 daily
budget is about $2.70 per student per day, three times the estimate, with room for heavy days.
That assumes all 15 students use the key. Students on their own plan cost the course nothing:
count only those without a plan.

Biggest cost drivers: long sessions (start fresh for each task), GLM-5.3 instead of Flash, idle
agents that keep summarising, and agents reading large files (that's what the ignore and deny
rules prevent).
