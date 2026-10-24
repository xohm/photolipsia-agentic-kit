# Student setup

Photolipsia · ZHdK · MA Interaction Design · HS 2026

You will use an AI coding agent in the terminal. It reads your project, plans, edits files,
runs commands and checks its own work. This page gets you from an empty laptop to a working agent.

Plan about 45 minutes. Do the steps in order. Commands are shown for **Mac** (Terminal, zsh)
and **Windows** (PowerShell). Where they are the same, there is one block.

You need only OpenCode (section 3). Codex and Claude Code (sections 4 and 5) are optional.

> **How tested is this?** The kit was built and tested on Linux. The Mac and Windows commands
> follow each tool's official instructions, but were not tried on a real Mac or Windows laptop
> when this kit was written. Both examples were first tried with other AI models standing in for
> GLM; our run with GLM-5.3 Flash is at the top of the Example 1 and Example 2 guides. The Blender
> parts ran with GLM-5.3 Flash. If a step fails, tell your teacher: you are probably the first to
> find it.

Contents

1. [Prerequisites](#1-prerequisites)
2. [Your API key](#2-your-api-key)
3. [OpenCode (recommended)](#3-opencode-recommended)
4. [Codex CLI (optional)](#4-codex-cli-optional)
5. [Claude Code (optional)](#5-claude-code-optional)
6. [Smoke test](#6-smoke-test)
7. [The project skeleton, explained](#7-the-project-skeleton-explained)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Prerequisites

### Terminal basics

- **Mac:** open *Terminal*: press Cmd+Space, type Terminal, press Enter.
- **Windows:** open *Terminal* (Start menu: Terminal). It starts PowerShell.

You need four commands: `cd folder` (go into a folder), `cd ..` (go up), `ls` (list files,
works in PowerShell too) and `pwd` (where am I?). Stop a running program with **Ctrl+C**.

In the course you keep **two terminals** open: one for the agent, one for your own commands
(`git`, `npm run dev`). New tab: **Cmd+T** in Mac Terminal, **Ctrl+Shift+T** in Windows Terminal.

### Windows only: allow npm to run

PowerShell blocks scripts by default, which breaks `npm`. Run this once:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned -Force
```

`-Force` skips the yes/no question. Without it, pressing Enter answers "No".

### Node.js (LTS) and Git

**Mac**
```bash
xcode-select --install
```
This installs Git and other developer tools (a dialog opens; click Install, and wait until it is
done). If it says "command line tools are already installed", that is fine. Then install Node.js
LTS with the installer from https://nodejs.org (the "LTS" button). If you already use Homebrew,
`brew install node gh` installs Node.js and the GitHub tool you need later in one go.

**Windows**
```powershell
winget install --id OpenJS.NodeJS.LTS -e
winget install --id Git.Git -e
```
The first time, winget asks you to accept the source agreements: type **Y** and Enter. Windows
may also ask "Do you want to allow this app to make changes to your device?": click **Yes**.
PowerShell says winget is not recognized? Install **App Installer** from the Microsoft Store,
then try again.

**Close the terminal and open a new one** after installing. Then check:

```bash
node -v
npm -v
git --version
```

You want Node `v22.12` or newer (the current LTS is fine), npm 10 or newer, and any Git version.

Tell Git who you are (once, same on both):

```bash
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
git config --global pull.rebase false
```

Use the email of your GitHub account. It is public in every commit you push: to keep it private,
see step 1 under "Git and GitHub" below. The third line makes `git pull` merge your teacher's
updates into your work.

### VS Code (recommended)

An editor to read and change what the agent writes. On a Mac, don't edit code in TextEdit: it
opens `.html` files as a page, not as text. In VS Code, **File → Open Folder** opens a project.
**Mac:** download from https://code.visualstudio.com.
**Windows:** `winget install --id Microsoft.VisualStudioCode -e`

### Git and GitHub: your own fork

You keep your work on GitHub, in your own copy of the course repository: a **fork**.
Every `git push` saves your progress there, and your teacher can follow it.

1. Make a free account on https://github.com, then click the link in the email GitHub sends you.
   You can't fork until your email is verified.
   To keep your email private: on GitHub, **Settings → Emails**, turn on **Keep my email addresses
   private** and copy the address that ends in `@users.noreply.github.com`. Then run the
   `git config --global user.email` line from above again, with that address.
2. **Fork:** open https://github.com/xohm/photolipsia-agentic-kit, press **Fork** (top right), then
   **Create fork**. Now GitHub has your own copy: `https://github.com/YOUR-NAME/photolipsia-agentic-kit`,
   where `YOUR-NAME` is your GitHub user name.
   Your fork is **public**: anyone can see your code, your `ai/strategy.md` and your commit
   messages. Never commit the key or anything private.
3. **Clone** your fork into your home folder, and connect it to the course repository, so you can
   get updates later. Same on both:
   ```bash
   cd ~
   git clone https://github.com/YOUR-NAME/photolipsia-agentic-kit.git
   cd photolipsia-agentic-kit
   git remote add upstream https://github.com/xohm/photolipsia-agentic-kit.git
   ```
4. **Log in, so `git push` works.** Once.
   - **Windows:** nothing to install. At your first `git push`, Git opens a GitHub login in your
     browser.
   - **Mac:** Git on a Mac can't log in through the browser, so install the GitHub tool once: the
     installer from https://cli.github.com (with Homebrew: `brew install gh`). Then, in a new
     terminal:
     ```bash
     gh auth login
     ```
     Answer: GitHub.com, HTTPS, Yes, Login with a web browser. It shows a one-time code like
     `ABCD-1234`: copy it, press Enter, paste it in the browser and click **Authorize**. From then
     on, `git push` works. You don't need `gh` for anything else.

You now have the folder `photolipsia-agentic-kit`: the skeletons `01-text-stats` and
`02-splat-viewer`, the guides in `guides/` and these docs in `docs/`. The skeletons have no app
in them: you build the apps with your agent.

`npm run check` also needs a hidden browser. `npx playwright install chromium` downloads it once,
about 300 MB, during the Example 1 setup.

### Get your teacher's updates

When your teacher updates the course repository, **commit your own work first**
(`git add -A`, then `git commit -m "My work"`). Then, same on both:

```bash
cd ~/photolipsia-agentic-kit
git pull --no-edit upstream main
git push
```

If Git prints `CONFLICT`, type `git merge --abort` and ask your teacher. That puts everything
back as it was before the pull.

---

## 2. Your API key

All agents talk to one model provider, OpenRouter, through a shared course key.
Your teacher gives you the key privately. It looks like `sk-or-v1-…`.

**Rules for the key**

- Put it only in your environment (below) or in your personal tool config in your home folder.
- **Never** put it in a project folder, a commit, a screenshot, a chat or a prompt.
- Never ask the agent to print it.

Don't type the key into a command: commands are saved in your shell history.

**Mac**: open your shell settings file in TextEdit:
```bash
touch ~/.zshrc
open -e ~/.zshrc
```
Paste this line at the end. Paste it, don't type it: TextEdit can turn typed quotes into curly
ones, which break the line. Replace `sk-or-...` with the real key, save, close TextEdit, then
reload:
```text
export OPENROUTER_API_KEY="sk-or-..."
```
```bash
source ~/.zshrc
```

**Windows**: this asks for the key and stores it for your user. Paste the key when asked:
```powershell
[Environment]::SetEnvironmentVariable('OPENROUTER_API_KEY', (Read-Host 'Paste the key'), 'User')
```
Then **open a new terminal**: old ones don't see it.

Then test it, in your fork:

```bash
cd ~/photolipsia-agentic-kit
node tools/check-openrouter.mjs
```

You want: the course model answers (`200 OK`), another model is blocked (`403 OK`), and the last
line says `All good.`

> **If the key changes** (your teacher hands out a new one), update it everywhere you put it:
> the line in `~/.zshrc` (Mac) or the command above again (Windows), `ANTHROPIC_AUTH_TOKEN` in
> `~/.claude/settings.json` if you use Claude Code, and `/connect` in OpenCode if you used it.
> Then open a new terminal.

### Where your prompts go, who sees them

Everything your agent sends to the model leaves your laptop: your prompts, the content of the
files it reads, the output of commands it runs, and screenshots. It goes to **OpenRouter, Inc.**
(USA), which passes each request to one of many companies that run GLM-5.3 Flash or GLM-5.3. They
are chosen by price, not by country, so a request can leave Switzerland and the EU.

- **What OpenRouter stores:** for every request the model, tokens, cost, time and API key, but no
  content. Content is stored only if the account owner switches on input and output logging; it is
  off by default.
- **Who can tell it was you:** nobody, from these records. The class shares one key.
- **Training:** every company listed for these two models says it does not train on your data.
  A few keep prompts for a while (one says 30 days). The course account can exclude them with
  "zero data retention": ask your teacher whether it is on.
- **GLM-5.3 (not Flash) reads text only.** Screenshots go only to GLM-5.3 Flash.

So: never give the agent passwords, keys, or other people's personal data, such as interview
notes or photos of people who didn't agree. (Facts from OpenRouter's documentation, October 2026.)

Two things follow from how the kit is built:

- **Your splat files stay on your laptop.** The agent is locked out of `public/splats/`, and the
  viewer's "Open file" reads a file in the browser and uploads nothing. Pictures of your scans do
  leave: the check's screenshot, and every `look` picture from Blender, go to the model.
- **Two things show your laptop on the local network** while they run: `npm run dev:vr` (your
  page, for the Quest) and Spirula's progress page on port 7007. Stop them with Ctrl+C when you
  are done.

### What it costs

The course pays for the key: you pay nothing. The whole class shares one key and one budget:
**$40 a day for everyone together**, and $350 for the whole course. That is about $2.70 per person
per day.

- A normal day of work with GLM-5.3 Flash costs about **$0.80 per person** (our estimate).
- GLM-5.3 costs more: up to about ten times as much.
- In tokens, Flash costs $0.15 per million tokens in and $0.50 per million out.
- When the day's budget is used up, every request gets a `403` until midnight UTC (1 or 2 am in
  Zurich), for the whole class.
- **A leaked key costs the course, not you.** Anyone who has it can spend the budget until your
  teacher replaces it. So keep the rules above.

What costs the most: long sessions (the agent sends the whole conversation again with every step,
so start a new session for each new task), GLM-5.3 instead of Flash, agents left running, and
agents that read big files.

### Energy

We have no reliable number for the energy one GLM request uses through OpenRouter, so we don't
give one. What we know: by our estimate, a normal course day is about 4.5 million tokens of input
per person, mostly the agent reading its own session again. The habits that save money also save
computing: Flash by default, a new session for a new task, no big files for the agent, effort
`high` (never `max`). The heaviest job in the course runs on your own laptop: training splats with
Spirula took 9 to 11 minutes on a strong laptop GPU in our test.

---

## 3. OpenCode (recommended)

Use OpenCode: all guides use it, and it is the tool we tested with GLM.

### Install

Same on both:
```bash
npm install -g opencode-ai@1
opencode --version
```

You want version 1.x: `@1` makes sure of that. The course was tested with OpenCode 1.14; `@1`
installs the newest 1.x.

**Mac: "EACCES" or "permission denied"?** Then npm can't write to its folder for global tools.
Run these four lines once (npm's own fix; not tested on a Mac), then the install line again:

```bash
mkdir -p ~/.npm-global
npm config set prefix ~/.npm-global
echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

> Don't use `brew install opencode`: it installs OpenCode 2, which works differently
> from what this course shows.

### Config file

Create the config file and open it in a text editor.

**Mac**
```bash
mkdir -p ~/.config/opencode
touch ~/.config/opencode/opencode.json
open -e ~/.config/opencode/opencode.json
```

**Windows**
```powershell
New-Item -ItemType Directory -Force "$HOME\.config\opencode"
notepad "$HOME\.config\opencode\opencode.json"
```

Paste this (don't type it) and save:

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
  }
}
```

- `model` is the default model: GLM-5.3 Flash. Cheap, fast and it can look at screenshots.
- `small_model` is used for small background jobs such as session titles. Without it, OpenCode
  picks another model, which the course key blocks.
- `effort: "high"` keeps thinking shorter than the default (`max`). Use `"low"` for faster answers.

On Windows, Notepad asks whether to create the new file: click **Yes**. The same happens for the
Codex and Claude Code config files below.

### Connect the key

OpenCode reads `OPENROUTER_API_KEY` from your environment. If it still asks for a key,
start `opencode` and type `/connect`, choose **OpenRouter** and paste the key.

### First run

Make an empty test folder and start OpenCode in it.

**Mac**
```bash
mkdir -p ~/hello-agent && cd ~/hello-agent && opencode
```

**Windows**
```powershell
New-Item -ItemType Directory -Force "$HOME\hello-agent"; cd "$HOME\hello-agent"; opencode
```

Type `/models` and check that **GLM-5.3-Flash** (OpenRouter) is selected. Not "GLM 5.3 FlashX"
and not "GLM 5.3 Prime": they look alike, but the course key blocks them. For a hard problem,
switch to **GLM-5.3** with `/models` and switch back afterwards: it costs more (up to about ten
times) and **cannot see images**. Quit with `/exit` or **Ctrl+C**.

Always start the agent inside the folder you work in. For the examples that is `01-text-stats`
or `02-splat-viewer`, never your home folder or the main kit folder: the rules and locks are in
the project folder.

The project's `opencode.json` makes OpenCode ask before shell commands, except the loop
commands (`npm test`, `npm run check`, `node`, `git status`, `git diff`, `git log`, `ls`). Read
what it wants to run before you allow it.

---

## 4. Codex CLI (optional)

You don't need Codex for the course. Install it only if you want to compare tools.

### Install

Same on both:
```bash
npm install -g @openai/codex
codex --version
```

Mac: "EACCES"? Use the fix in section 3, then try again.

### Config file

Codex only reads providers from your user config, never from a project folder.

**Mac**
```bash
mkdir -p ~/.codex
touch ~/.codex/config.toml
open -e ~/.codex/config.toml
```

**Windows**
```powershell
New-Item -ItemType Directory -Force "$HOME\.codex"
notepad "$HOME\.codex\config.toml"
```

Paste and save:

```toml
model = "z-ai/glm-5.3-flash"
model_provider = "openrouter"
model_reasoning_effort = "high"

[model_providers.openrouter]
name = "OpenRouter"
base_url = "https://openrouter.ai/api/v1"
wire_api = "responses"
env_key = "OPENROUTER_API_KEY"

[tui]
auto_recap = false
```

- `wire_api = "responses"` is the only value Codex supports.
- `env_key` reads the key from your environment, so nothing secret is in this file.
- `auto_recap = false` stops Codex from writing summaries in the background, which costs tokens.
- Codex may warn about an "unknown model" and use default settings for it. That is fine.

### First run

In a project folder (for example `01-text-stats`):

```bash
codex
```

Codex asks whether you trust the folder: yes, for your project folders.
Switch models with `/model`. Quit with `/quit` or **Ctrl+C**.

Codex runs commands in a **sandbox without network**. `npm install` and `npm run check`
(it starts a local server and a browser) may need to run outside it: when Codex asks,
approve. For `npm run check`, choose the option that stops it asking again.

---

## 5. Claude Code (optional)

You don't need Claude Code for the course. Claude Code is built for Anthropic's models.
OpenRouter supports it only with those, so with GLM some features may not work.
**OpenCode is the safer choice in this course.**

### Install

**Mac**
```bash
curl -fsSL https://claude.ai/install.sh | bash
```

**Windows**
```powershell
irm https://claude.ai/install.ps1 | iex
```

Open a new terminal, then `claude --version`.

### Settings file

**Mac**
```bash
mkdir -p ~/.claude
touch ~/.claude/settings.json
open -e ~/.claude/settings.json
```

**Windows**
```powershell
New-Item -ItemType Directory -Force "$HOME\.claude"
notepad "$HOME\.claude\settings.json"
```

Paste and save. If the file already has content, add the `env` block to it instead.

```json
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://openrouter.ai/api",
    "ANTHROPIC_AUTH_TOKEN": "sk-or-...",
    "ANTHROPIC_API_KEY": "",
    "ANTHROPIC_MODEL": "z-ai/glm-5.3-flash",
    "ANTHROPIC_DEFAULT_FABLE_MODEL": "z-ai/glm-5.3-flash",
    "ANTHROPIC_DEFAULT_OPUS_MODEL": "z-ai/glm-5.3-flash",
    "ANTHROPIC_DEFAULT_SONNET_MODEL": "z-ai/glm-5.3-flash",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "z-ai/glm-5.3-flash",
    "CLAUDE_CODE_SUBAGENT_MODEL": "z-ai/glm-5.3-flash"
  }
}
```

- Replace `sk-or-...` with the course key. This file is in your home folder, not in a
  project, so that is fine. Never copy it into a project.
- `ANTHROPIC_API_KEY` must stay an empty string.
- Every model name points to GLM-5.3 Flash, so background jobs and helpers also use it.

### First run

In a project folder (for example `01-text-stats`):

```bash
claude
```

- If you ever logged in with an Anthropic account: type `/logout`, quit, start `claude` again.
- Type `/status`: it should show the OpenRouter base URL and an auth token.
- Effort settings (`/effort`) are made for Anthropic models and probably have no effect on GLM.
- On Windows, Claude Code runs commands in PowerShell. Git for Windows is optional.

Quit with `/exit` or **Ctrl+C**.

---

## 6. Smoke test

Start your agent in the empty test folder from section 3. These commands also make the folder if
it is missing.

**Mac**
```bash
mkdir -p ~/hello-agent && cd ~/hello-agent && opencode
```

**Windows**
```powershell
New-Item -ItemType Directory -Force "$HOME\hello-agent"; cd "$HOME\hello-agent"; opencode
```

(Use `codex` or `claude` instead of `opencode` to test those.) Type:

```text
Create hello.js that prints "Hello from GLM", then run it with node.
```

The agent creates the file and runs `node hello.js`. Some tools ask first: allow it.
You should see `Hello from GLM`. If that works, you're set up.

---

## 7. The project skeleton, explained

Every project in this course, however small, has the same few files. They keep the agent
on track, keep secrets and big files away from it, and let it check its own work.

```
project/
├── AGENTS.md              rules for the agent
├── CLAUDE.md              one line: @AGENTS.md
├── ai/strategy.md         goal, plan, decisions, next step
├── .gitignore             what git never stores
├── .ignore                what agent search skips
├── .claude/settings.json  files Claude Code may not read or edit
├── opencode.json          files OpenCode may not read or edit
├── package.json           npm run dev, npm test, npm run check
├── scripts/check.mjs      opens the app, reports, takes a screenshot
├── scripts/app-checks.mjs checks for this app only (optional)
├── src/                   your app, in small modules
├── tests/                 unit tests for pure logic
└── index.html             the page
```

**`AGENTS.md`** holds the rules, written once and read by every tool. Read the plan first,
work in small steps, run the checks after every change, never touch secrets. Codex and
OpenCode read it on their own.

**`CLAUDE.md`** contains one line, `@AGENTS.md`. Claude Code reads `CLAUDE.md`, and the line
imports the same rules. The rules exist once, so they can't get out of step.

**`ai/strategy.md`** is the agent's memory, and you can read it: the goal in one sentence,
the plan as checkboxes, one line per decision ("because …") and the next step. A new session
starts by reading it. Read it yourself when you come back tomorrow.

**`.gitignore`** lists what git never stores: `node_modules/` (reinstall with `npm install`),
`.check/` (generated), `.env*` (secrets), `dist/`, system files and large assets like
`public/splats/*`.

**`.ignore`** lists what the agent's search skips, even outside git. Here it also hides
`package-lock.json`: git keeps it, but for the agent it is only noise.

**`.claude/settings.json`** and **`opencode.json`** are hard rules. They deny reading and
editing `.env*`, `node_modules/` and `public/splats/`. Rules in `AGENTS.md` are requests. The
tool enforces these.

**`package.json`** has three scripts: `npm run dev` starts the local server, `npm test` runs
the unit tests and `npm run check` checks the real page.

**`scripts/check.mjs`** is the agent's eyes. It starts the app, opens it in a hidden browser,
waits until the app says it is ready, then writes `.check/report.json` (errors, warnings,
failed requests, colours on screen, the page text) and `.check/screenshot.png`. The agent
reads both and fixes what it sees. **`scripts/app-checks.mjs`** adds checks only this app
needs, such as "the canvas is not blank".

### What each tool reads and searches

Background for the curious. You don't need it to work.

| | OpenCode | Codex CLI | Claude Code |
|---|---|---|---|
| Rules file | `AGENTS.md` (falls back to `CLAUDE.md`) | `AGENTS.md` | `CLAUDE.md`, which imports `AGENTS.md` |
| Search skips `.gitignore` files | Yes, inside git repositories | `@` file search: yes, inside git repositories | Grep tool and `@` file picker: yes. Glob tool: no |
| Search skips `.ignore` files | Yes | `@` file search: yes | Grep tool: yes. Bash `grep`: no |
| Can open an ignored file by its path | Yes, unless denied | Yes, with shell commands | Yes, unless denied |
| Hard deny rules | `opencode.json` → `permission.read` / `edit` / `bash` | Beta "permission profiles" only, not used here | `.claude/settings.json` → `permissions.deny` |
| `.env` files by default | Asks before reading | Readable | Readable |

What this means:

- **Ignore files hide things from search. They don't lock anything.** The agent can still open
  an ignored file by name. That is on purpose: it must read `.check/report.json`, which git ignores.
- **Deny rules lock files**, but only in OpenCode and Claude Code, and not perfectly. OpenCode
  also blocks shell commands that name `.env` or `public/splats` (tested: in our run the agent
  tried `ls … public/splats` after the read tool refused). But a script the agent writes and runs
  can still open any file. Keep secrets out of projects altogether.
- In OpenCode, `node` commands run without asking (they are loop commands). A `node` script can
  open a denied file. That is one more reason the key never goes into a project.
- **Codex** relies on `AGENTS.md`, `.gitignore` and `.ignore`, and on its sandbox.

---

## 8. Troubleshooting

| Problem | Fix |
|---|---|
| `403` "permission denied" or a model "not allowed" | The tool asked for a model the course key doesn't allow. Check the model name in your config. OpenCode: is `small_model` set? In `/models`, pick **GLM-5.3-Flash**, not FlashX or Prime. Claude Code: are all model variables set? |
| `403` "Budget limit exceeded" | Today's course budget is used up. It resets at midnight UTC (1 or 2 am in Zurich). Tell your teacher. |
| `401` "User not found" or "invalid key" | Typo in the key, or the terminal doesn't see it. Windows: open a new terminal after setting the key. Mac: `source ~/.zshrc`. Run `node tools/check-openrouter.mjs`. |
| `model_not_found`, `404` | Typo in the model name. OpenCode needs `openrouter/z-ai/glm-5.3-flash`, Codex and Claude Code need `z-ai/glm-5.3-flash`. |
| Images are rejected or ignored | GLM-5.3 can't see images. Switch back to GLM-5.3 Flash. |
| Codex: "wire_api = chat is no longer supported" | Use `wire_api = "responses"`. |
| Codex ignores your provider | It must be in `~/.codex/config.toml` (Windows `$HOME\.codex\config.toml`), not in a project's `.codex/config.toml`. |
| Codex: `npm run check` fails with "EPERM", "listen" or browser errors | The sandbox blocks the local server or the browser. Approve running it outside the sandbox. |
| Claude Code still uses your Anthropic login | `/logout`, quit, start again. `/status` must show `https://openrouter.ai/api`. |
| Windows: "running scripts is disabled on this system" | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned -Force`, then a new terminal. |
| `node` or `npm` "not recognized" / "command not found" | Open a new terminal after installing Node. Still not found: reinstall Node LTS. |
| Mac: `npm install -g` fails with "EACCES" | See section 3, "Install". |
| `npm run check`: "Chromium for Playwright is missing" | `npx playwright install chromium` (about 300 MB, once). |
| `npm run check` says FAILED and npm adds many `npm error` lines | Normal: npm reports that the check failed. Read the lines that start with `check:` and `-`. |
| `npm run dev`: "Port 5173 is in use" | Another dev server is still running. Find its terminal and press Ctrl+C. Vite also tries 5174 by itself: read the URL it prints. |
| The agent hangs after starting `npm run dev` | The server never ends, so the agent waits. Press Esc (or Ctrl+C) in the agent, and run `npm run dev` in your own terminal. |
| `npm run check`: "App not ready … within 10000 ms" | The page never set `window.__APP_READY__ = true`. Look for a page error above it in the report. |
| A big scan is slow or jerky | Convert it to `.rad` and/or lower the detail with `?detail=0.5`. See [big-scans.md](big-scans.md). |
| No **Enter VR** button in the splat viewer | The browser can't do VR. Mac browsers never can: use the Quest browser with `npm run dev:vr`. On Windows, Quest Link plus Chrome also works. See Example 2, prompt 7. |
| The Quest can't open the `https://…` address from `npm run dev:vr` | Same Wi-Fi? University Wi-Fi often isolates devices: try a phone hotspot. Allow `node` through the firewall (Mac), or private networks (Windows). |
| Mac: `git push` asks for a username and password | Git isn't logged in yet: `gh auth login` (section 1, [Git and GitHub](#git-and-github-your-own-fork)). A GitHub password never works here. |
| Windows: `git add` prints "LF will be replaced by CRLF" | Harmless. Git stores the file correctly. |
| `git pull`: "Need to specify how to reconcile divergent branches" | Run `git config --global pull.rebase false`, then `git pull --no-edit upstream main` again. |
| `git pull`: "Your local changes … would be overwritten" | Commit your work first (`git add -A`, `git commit -m "My work"`), then pull again. |
| `git pull` prints `CONFLICT` | `git merge --abort`, then ask your teacher. |
| `npm install` fails with "Cannot read properties of null (reading 'edgesOut')" | Old npm with a newer package. Update Node to the current LTS. |
| Windows: a firewall prompt when starting `npm run dev` | Allow on private networks, or cancel: the local page still works on your own laptop. |
