# Teacher setup

Photolipsia · ZHdK · MA Interaction Design · HS 2026

One OpenRouter account, one shared API key with a hard credit limit, and a guardrail that only
allows the two course models and caps daily spending. 15 students, two weeks.

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
  $0.08 / $1.40. Flash costs $0.15 / $0.50 at Z.AI and at most other providers.
- **Optional filter:** with an organisation account, **Settings → Privacy → "Filter the model
  catalog for API keys"** makes the model list show students only the allowed models. That is
  nice in `/models` pickers.

---

## 4. Test it

Set the key in your own terminal (same commands as the students, see
[student-setup.md](student-setup.md#2-your-api-key)), then in the course kit folder:

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
| Codex CLI | `base_url` in `~/.codex/config.toml` | `https://eu.openrouter.ai/api/v1` |
| Claude Code | `ANTHROPIC_BASE_URL` in `~/.claude/settings.json` | `https://eu.openrouter.ai/api` |
| `tools/check-openrouter.mjs` | `API` constant at the top | `https://eu.openrouter.ai/api/v1` |

Check on the model pages that both GLM models have EU endpoints before switching.

---

## 6. Set up and test the three tools yourself

Use exactly the student configs: [student-setup.md](student-setup.md), sections 3 to 6. Then, on
your own machine and ideally on one Windows laptop:

Versions used to prepare the kit: OpenCode 1.14.39 locally (npm `opencode-ai@1` was 1.19.4),
Codex CLI 0.155.1, Claude Code 2.1.302. Students install the current versions.

1. Smoke test in each tool (section 6 of the student guide).
2. Run both examples in OpenCode in a fork of this kit, following
   [guides/01-text-stats.md](../guides/01-text-stats.md) and
   [guides/02-splat-viewer.md](../guides/02-splat-viewer.md).
3. Repeat Example 1 in Codex and in Claude Code.
4. On the OpenRouter **Logs** page (https://openrouter.ai/logs), check that every request used one
   of the two models and none got a 403. A 403 means a tool calls a hidden extra model. The
   configs set `small_model` (OpenCode) and all model variables (Claude Code) to prevent that.
5. Ask the agent in each tool to look at `.check/screenshot.png` and describe it. GLM-5.3 Flash
   can see images, GLM-5.3 cannot. Note which tools pass the image through: see "Untested" in
   `NOTES.md` in the solutions repository.

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

Known differences

- **OpenCode** reads `AGENTS.md`, honours `opencode.json` deny rules and is the most reliable with GLM.
- **Codex** runs commands in a sandbox without network. `npm install` and `npm run check` need
  approval to run outside it. Decide before the course whether students should approve each
  time or start Codex with more permissive settings.
- **Claude Code** is only guaranteed with Anthropic models on OpenRouter. Effort settings
  probably don't reach GLM.

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
check script) match the finished apps. Students get updates with `git pull upstream main`.

**The slides** are served from this repository with GitHub Pages (*Settings → Pages*: branch
`main`, folder `/`; the empty `.nojekyll` file serves the HTML as it is). Link to the addresses at
the top of this guide.

**Your own course:** fork the kit (and ask for the solutions), then replace `xohm/photolipsia-agentic-kit`
and `xohm.github.io/photolipsia-agentic-kit` with your names in `README.md`, `docs/` and `slides/`.

- **Forks of a public repository are public:** everyone can see the students' work. For private
  work, mark the kit as a template (*Settings → Template repository*) and let students use
  *Use this template* with a private repository, or use GitHub Classroom.
- **Following the class:** on GitHub, *Insights → Forks* lists every fork. Students push after
  every step, so you see where everyone is.
- Never hand out a zip of your own working folder: it contains installed packages and check output.

**The key:**

- Hand it out **individually**: printed on a slip, or through a shared password-manager item.
  Never in a group chat, an email to the class, a slide or the repository.
- Tell students the rules from the student guide: environment variable or home-folder config
  only, never in a project, a commit, a screenshot or a prompt.
- Remind them on day one that a leaked key costs the course budget, not them.

---

## 8. Course checklist

### Before

- [ ] Credits bought, auto top-up off, low-balance alert at ~$40
- [ ] Key created with a $350 limit (and an expiry, if offered)
- [ ] Guardrail with both models, $40 daily budget, assigned to the key
- [ ] `node tools/check-openrouter.mjs` says "All good"
- [ ] All three tools tested on your machine; both examples run in OpenCode
- [ ] One Windows laptop tested (PowerShell execution policy, `setx`, OpenCode, `npm run check`)
- [ ] Students got the kit link and the setup guide before day one
- [ ] Blender MCP (deck 1, slide 24) tried once on a Mac and a Windows laptop: open Blender once,
      `uvx mcp-for-blender@2.2.4 install-addon`, the OpenCode `mcp` entry, then the slide's prompt.
      Tested on Linux only (2026-10-24, Blender 5.3 beta, GLM-5.3 Flash in OpenCode).
- [ ] Gaussian splats in Blender (deck 1, slide 25): students need **Blender 5.3** (release planned for
      10 Nov 2026; until then the beta). It opens splat `.ply` files itself; `tools/blender/splats.py`
      saves them again. Blender 5.2 and older can't open splats.
- [ ] Spirula Studio (deck 1, slide 26) opened once on a Mac and a Windows laptop. The Mac app may
      not be notarized (then: right-click → Open). While training it serves a preview on port 7007
      to the whole network. Tested on Linux only (2026-10-24).
- [ ] Key slips or password-manager items prepared

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
   "If the key changes" in [student-setup.md](student-setup.md#2-your-api-key).
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
| `403`, `permission_denied`, model not allowed | The tool requested a model outside the allowlist: OpenCode without `small_model`, Claude Code without all model variables, or a typo | Fix the student's config (student guide, sections 3 to 5) |
| `403` "Budget limit exceeded (daily limit)…" | Guardrail budget reached today | Wait until midnight UTC, or raise the budget in the guardrail |
| `402` or `403` "Key limit exceeded" | The key's $350 limit is used up | Raise the key's credit limit |
| `402` "insufficient credits" | Account balance empty | Buy credits |
| `401` "User not found" | Wrong or deleted key, or the terminal doesn't see the variable | Run `node tools/check-openrouter.mjs` in the student's terminal |
| Guardrail page greyed out | Free plan | Buy credits (pay-as-you-go plan) |
| Other models still answer | Guardrail not assigned to the key | Guardrail → API Keys → add the key |
| Images rejected or ignored | GLM-5.3 is text-only | Use GLM-5.3 Flash when the agent needs to look at screenshots |
| Responses API `400` about `store` or `previous_response_id` | OpenRouter's Responses API is stateless | Should not happen with current Codex. Update Codex |
| Slow answers | `max` reasoning | Set effort `high` or `low` in the tool config |

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

Biggest cost drivers: long sessions (start fresh for each task), GLM-5.3 instead of Flash, idle
agents that keep summarising, and agents reading large files (that's what the ignore and deny
rules prevent).
