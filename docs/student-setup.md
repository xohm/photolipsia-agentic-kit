# Student setup

Photolipsia · ZHdK · MA Interaction Design · HS 2026

You will use an AI coding agent in the terminal. It reads your project, plans, edits files,
runs commands and checks its own work. This page gets you from an empty laptop to a working agent.

Plan about 45 minutes. Do the steps in order. Commands are shown for **Mac** (Terminal, zsh)
and **Windows** (PowerShell). Where they are the same, there is one block.

You need one agent, not three. Most of you use OpenCode with the course key. If you have your
own Claude or ChatGPT plan, you can use Claude Code or Codex with it instead. Section 2 helps you
pick.

> **How tested is this?** The kit was built and tested on Linux. The Mac and Windows commands
> follow each tool's official instructions, but were not tried on a real Mac or Windows laptop
> when this kit was written. Both examples were first tried with other AI models standing in for
> GLM; our run with GLM-5.3 Flash in OpenCode is at the top of the Example 1 and Example 2 guides.
> Example 1 also ran with Claude Code and with Codex, each on its own plan and on the course key;
> the checks passed every time. Example 2 did not run with them.
>
> The Blender parts ran with GLM-5.3 Flash in OpenCode. If a step fails, ask in the course
> Discussions ([how](#ask-a-question)): you are probably the first to find it.

Contents

1. [Prerequisites](#1-prerequisites)
2. [Pick your tool and account](#2-pick-your-tool-and-account)
3. [Privacy and cost](#3-privacy-and-cost)
4. [The course key](#4-the-course-key)
5. [OpenCode](#5-opencode)
6. [Claude Code](#6-claude-code)
7. [Codex CLI](#7-codex-cli)
8. [Smoke test](#8-smoke-test)
9. [The project skeleton, explained](#9-the-project-skeleton-explained)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Prerequisites

### What you install, and why

| What | Why |
|---|---|
| Terminal | Where you type commands. The agent runs in it too. Already on your laptop. |
| Git | Saves every step of your work. Sends it to GitHub, brings your teacher's updates. |
| Node.js | Runs JavaScript on your laptop. Its `npm` installs the tools and the project's parts, and runs the check (`npm run check`) and your app (`npm run dev`). |
| A GitHub account | Your copy of the course, your fork, lives there. Questions go to its [Discussions](#ask-a-question). |
| The course key | Pays for the AI model, $3 a day ([section 4](#4-the-course-key)). With your own plan you don't need it. |
| One agent | OpenCode, Claude Code or Codex ([section 2](#2-pick-your-tool-and-account)): reads your files, writes the code, runs the check. |
| A browser for the check | Chromium, about 300 MB (`npx playwright install chromium`). The check opens your page in it, hidden, and takes a screenshot. |

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

### Mac only: npm says EACCES

OpenCode and Codex are installed with `npm install -g`. On a Mac this can fail with "EACCES" or
"permission denied": then npm can't write to its folder for global tools. Only if that happens,
run these four lines once (npm's own fix; not tested on a Mac), then the install line again:

```bash
mkdir -p ~/.npm-global
npm config set prefix ~/.npm-global
echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

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
   messages. Never commit a key or anything private.
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

If Git prints `CONFLICT`, type `git merge --abort` and [ask in the Discussions](#ask-a-question). That puts everything
back as it was before the pull.

---

## 2. Pick your tool and account

The agent is a program on your laptop. The AI model it talks to runs at a company, so the agent
needs an account there. There are two kinds:

- **The course key:** your own key from your teacher; the course pays for it. It reaches the model
  GLM-5.3 Flash through OpenRouter. Most of you use this.
- **Your own plan:** a paid Claude or ChatGPT subscription you already have. It costs you nothing
  extra, but it counts against your plan's limits.

| You have | Use | Read |
|---|---|---|
| No plan (most of you) | **OpenCode** with the course key | [section 4](#4-the-course-key), then [section 5](#5-opencode) |
| A Claude plan: Pro, Max, Team or Enterprise | **Claude Code** with your plan | [section 6](#6-claude-code) |
| A ChatGPT plan: Plus or higher | **Codex CLI** with your plan | [section 7](#7-codex-cli) |

The rule of thumb: no plan, the course key with OpenCode. A Claude plan: Claude Code. A ChatGPT
plan: Codex.

- OpenCode is the main tool of the course: all course examples were run with it. Claude Code and
  Codex are equal alternatives if you have a plan.
- The free Claude plan does not include Claude Code. For ChatGPT Free and Go, the Codex CLI is
  not listed: you need Plus or higher.
- Claude Code and Codex can also run on the course key: their sections show how. OpenCode is the
  simplest tool for it.
- The three tools do the same job in this course. They read the same rules (`AGENTS.md`), every
  project is set up for all three, and the guides work with any of them.
- Whatever you pick, read section 3 before day one: where your prompts go, how to switch off
  training on a plan, and what it costs.

### Commands in each tool

Your prompts are the same in every tool, and `/exit` quits all three. A few commands differ:

| | OpenCode | Claude Code | Codex CLI |
|---|---|---|---|
| Start it, in your project folder | `opencode` | `claude` | `codex` |
| Which account and model it uses | `/models` | `/status` | `/status` |
| Change the model | `/models` | `/model` | `/model` |
| New, empty session | `/new` | `/clear` | `/new` |
| Quit | `/exit` (or Ctrl+C) | `/exit` (or Ctrl+C twice) | `/exit` |
| What is left of your plan's limits | no plan: see [section 3](#what-it-costs) | `/usage` | `/usage` |

Always start the agent inside the folder you work in. For the examples that is `01-text-stats`
or `02-splat-viewer`, never your home folder or the main kit folder: the rules and deny rules are
in the project folder.

---

## 3. Privacy and cost

Read this whatever account you use.

### Where your prompts go, who sees them

Everything your agent sends to the model leaves your laptop: your prompts, the content of the
files it reads, the output of commands it runs, and screenshots. Where it goes depends on your
account.

**The course key (OpenCode, or Claude Code and Codex set up for it)** sends it to
**OpenRouter, Inc.** (USA), which passes each request to one of many companies that run
GLM-5.3 Flash or GLM-5.3. They are chosen by price, not by country, so a request can leave
Switzerland and the EU.

- **What OpenRouter stores:** for every request the model, tokens, cost, time and API key, but no
  content. It keeps content only if the account owner switches on input and output logging, or
  lets OpenRouter use the content in exchange for a 1% discount. Both are off by default.
- **Who can tell it was you:** these records show the key. Each of you has your own, so your
  teacher can see how much your key used. Whether Claude Code and Codex send anything else that names you, we didn't check.
- **Training:** OpenRouter does not train on your data, and every company listed for these two
  models says it doesn't either. A few keep prompts for a while (one says 30 days, the others
  don't say how long). The course account can exclude them with "zero data retention": ask your
  teacher whether it is on.
- **GLM-5.3 (not Flash) reads text only.** Screenshots go only to GLM-5.3 Flash.

(Facts from OpenRouter's documentation, October 2026.)

**Your Claude plan (Claude Code)** sends it to **Anthropic** (USA).

- **Training:** on Pro and Max, Anthropic trains its models on your chats and your Claude Code
  sessions if the setting "Help improve Claude" is on. Team and Enterprise: we didn't check.
- **How long it is kept** (Pro and Max): 5 years with that setting on, 30 days with it off.
- **Switch it off:** on claude.ai, **Settings → Privacy**
  (https://claude.ai/settings/data-privacy-controls).
- **Who can tell it was you:** Anthropic: it is your own account.
- **`/feedback`** in Claude Code sends your conversation to Anthropic.

(Source: code.claude.com/docs/en/data-usage, October 2026.)

**Your ChatGPT plan (Codex)** sends it to **OpenAI** (USA).

- **Training:** on personal plans (Plus, Pro), your ChatGPT and Codex content may be used to
  train models. On Business, Edu and Enterprise, not by default.
- **Switch it off:** in ChatGPT, **Settings → Data controls → "Improve the model for everyone"**.
  One switch covers ChatGPT and Codex.
- **How long it is kept:** we found no clear answer on OpenAI's pages.
- **Who can tell it was you:** OpenAI: it is your own account.
- **Usage data:** Codex also sends a little anonymous usage and health data to OpenAI, by
  default. Codex's docs say `enabled = false` under `[analytics]` in `~/.codex/config.toml`
  switches it off (we didn't test that).

(Sources: OpenAI help centre, help.openai.com/en/articles/5722486 and /7730893, and the Codex
docs, October 2026.)

**On a plan, switch training off before day one.** On the course key there is no switch for you
to set.

So, whatever the account: never give the agent passwords, keys, or other people's personal data,
such as interview notes or photos of people who didn't agree.

Two things follow from how the kit is built:

- **Your splat files are kept away from the agent.** OpenCode and Claude Code have deny rules
  for `public/splats/` (not perfect ones: see [section 9](#what-each-tool-reads-and-searches));
  Codex is only asked not to open it, in `AGENTS.md`. Git doesn't save them, and the viewer's
  "Open file" reads a file in the browser and uploads nothing. Pictures of your scans do leave:
  the check's screenshot, and every `look` picture from Blender, go to the model.
- **Two things show your laptop on the local network** while they run: `npm run dev:vr` (your
  page, for the Quest) and Spirula's progress page on port 7007. Stop them with Ctrl+C when you
  are done.

### What it costs

**The course key:** the course pays for it: you pay nothing. Each of you gets your own key, with
**$3 a day** and $25 for the whole course.

- A normal day of work with GLM-5.3 Flash costs about **$0.80 per person** (our estimate).
- GLM-5.3 costs more: up to about ten times as much.
- In tokens, Flash costs $0.15 per million tokens in and $0.50 per million out.
- When your key's $3 for the day are used up, every request gets a `403` until midnight UTC (1 or
  2 am in Zurich). Only your key stops; everyone else goes on.
- **A leaked key costs the course, not you.** Anyone who has your key can spend its budget until
  your teacher replaces it. So keep the rules in [section 4](#4-the-course-key), and don't share
  your key.

**Your own plan:** no extra cost. The agent's work counts against your plan's limits: a 5-hour
window and a weekly limit, shared with the chat app (Claude Pro and Max; ChatGPT Plus has a
5-hour window, and weekly limits may apply). Type `/usage` to see what is left. Big models use
the limit faster. When a limit is reached, you wait until it resets. (Claude also lets you switch
on paid usage credits to go on: that does cost extra.)

What costs the most, in money on the course key or in limits on a plan: long sessions (the agent
sends the whole conversation again with every step, so start a new session for each new task:
`/new` in OpenCode and Codex, `/clear` in Claude Code), a bigger model (GLM-5.3 instead of
Flash), agents left running, and agents that read big files.

### Energy

We have no reliable number for the energy one request uses, through OpenRouter or on a plan, so
we don't give one. What we know: by our estimate, a normal course day with GLM-5.3 Flash is about
4.5 million tokens of input per person, mostly the agent reading its own session again. The habits
that save money and limits also save computing: Flash by default, a new session for a new task,
no big files for the agent, effort `high` (never `max`). The heaviest job in the course runs on
your own laptop: training splats with Spirula took 9 to 11 minutes on a strong laptop GPU in our
test.

---

## 4. The course key

For everyone without a plan: most of you. Skip this section if you use your own Claude or
ChatGPT plan.

With the course key, your agent talks to one model provider, OpenRouter, through your own key.
Your teacher gives it to you privately. It looks like `sk-or-v1-…`.

**Rules for the key**

- Put it only in your environment (below) or in your personal tool config in your home folder.
- **Never** put it in a project folder, a commit, a screenshot, a chat or a prompt.
- Never ask the agent to print it.
- Don't share it, not even with classmates: it is yours, and so is its daily budget.

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

You want: the course model answers (`200 OK`), another model is blocked (`404 OK`), and the last
line says `All good.`

> **If the key changes** (your teacher hands out a new one), update it everywhere you put it:
> the line in `~/.zshrc` (Mac) or the command above again (Windows), `/connect` in OpenCode if
> you used it, and `ANTHROPIC_AUTH_TOKEN` in `~/.claude/settings.json` if you use Claude Code.
> Then open a new terminal.

Next, set up OpenCode for the key: [section 5](#5-opencode). Claude Code and Codex work on the
key too: "with the course key" in [section 6](#6-claude-code) and [section 7](#7-codex-cli).

---

## 5. OpenCode

OpenCode is the main tool of the course. Most of you use it with the course key: set that up
first ([section 4](#4-the-course-key)). All course examples were run with it, with GLM-5.3 Flash,
and so were the Blender parts.

### Install

Same on both:
```bash
npm install -g opencode-ai@1
opencode --version
```

You want version 1.x: `@1` makes sure of that. The course was tested with OpenCode 1.14; `@1`
installs the newest 1.x.

Mac: "EACCES" or "permission denied"? Use the fix in [section 1](#mac-only-npm-says-eacces), then
the install line again.

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

On Windows, Notepad asks whether to create the new file: click **Yes**.

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

In the course projects, `opencode.json` makes OpenCode ask before shell commands, except the loop
commands (`npm test`, `npm run check`, `node`, `git status`, `git diff`, `git log`, `ls`). Read
what it wants to run before you allow it.

Then do the smoke test, [section 8](#8-smoke-test).

---

## 6. Claude Code

Claude Code is Anthropic's agent. If you have a Claude plan, it is an equal alternative to
OpenCode: it uses Anthropic's Claude models through your plan. It can also run on the course key.

### Install

**Mac**
```bash
curl -fsSL https://claude.ai/install.sh | bash
```

**Windows**
```powershell
irm https://claude.ai/install.ps1 | iex
```

The installer puts `claude` in `.local/bin` in your home folder, a folder your terminal doesn't
search yet. Add it to your PATH (the list of folders where the terminal looks for commands), once:

**Mac**
```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
```

**Windows**, one line at a time
```powershell
$p = [Environment]::GetEnvironmentVariable('Path', 'User')
[Environment]::SetEnvironmentVariable('Path', "$p;$HOME\.local\bin", 'User')
```

Open a new terminal, then `claude --version`.

On Windows, Claude Code runs commands in PowerShell. Git for Windows is optional.

### Claude Code with your own plan

You need Claude Pro, Max, Team or Enterprise. The free plan does not include Claude Code.

There is nothing to configure. The first time you start `claude` (First run, below), it opens
your browser: sign in with the Claude account that has your plan, then go back to the terminal.
Type `/status`: it shows that you are logged in with your Claude account.

- Before day one, switch off training: see [section 3](#where-your-prompts-go-who-sees-them).
- `/usage` shows what is left of your plan's limits. `/model` changes the model: big models use
  the limit faster.

### Claude Code with the course key

Skip this if you use your plan. Set up the key first ([section 4](#4-the-course-key)).

Claude Code is built for Anthropic's models. OpenRouter supports it only with those, so with GLM
some features may not work.

**Tested** on Linux, 24 October 2026: Example 1 with these values, 4.7 min of agent time, $0.08 on
the key. The checks passed, and Claude Code looked at the screenshots.

Create the settings file and open it in a text editor.

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

On Windows, Notepad asks whether to create the new file: click **Yes**.

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
- **The key beats a plan.** As long as this `env` block is in the file, Claude Code uses the
  course key, even if you are signed in with a Claude account. If you ever signed in on this
  laptop, type `/logout` once at the first start, quit, and start `claude` again.
- Effort settings (`/effort`) are made for Anthropic models and probably have no effect on GLM.
- Back to a plan later: delete the `env` block, start `claude` again and check `/status`.

### First run

Make an empty test folder and start Claude Code in it.

**Mac**
```bash
mkdir -p ~/hello-agent && cd ~/hello-agent && claude
```

**Windows**
```powershell
New-Item -ItemType Directory -Force "$HOME\hello-agent"; cd "$HOME\hello-agent"; claude
```

- **Your plan:** the first time, sign in in the browser.
- Type `/status`. With your plan, it shows your Claude account. With the course key, it shows
  `Auth token: ANTHROPIC_AUTH_TOKEN` and the OpenRouter base URL, `https://openrouter.ai/api`.
- Quit with `/exit` (or Ctrl+C twice).

In the course projects, `.claude/settings.json` lets Claude Code run the loop commands without
asking: `npm test`, `npm run check`, `git status`, `git diff`, `git log` and `ls`. For anything
else it asks first: read what it wants to run before you allow it.

Then do the smoke test, [section 8](#8-smoke-test).

---

## 7. Codex CLI

Codex is OpenAI's agent. If you have a ChatGPT plan, it is an equal alternative to OpenCode: it
uses OpenAI's models through your plan. It can also run on the course key.

### Install

Same on both:
```bash
npm install -g @openai/codex
codex --version
```

Mac: "EACCES"? Use the fix in [section 1](#mac-only-npm-says-eacces), then try again.

### Codex with your own plan

You need ChatGPT Plus or higher: Plus, Pro, Business, Edu or Enterprise. For Free and Go, the
Codex CLI is not listed.

There is nothing to configure. The first time you start `codex` (First run, below), choose
**Sign in with ChatGPT**: your browser opens, sign in, then go back to the terminal. (Or run
`codex login` once before.) Type `/status`: it shows which account and model Codex uses.

- Before day one, switch off training: see [section 3](#where-your-prompts-go-who-sees-them).
- `/usage` shows what is left of your plan's limits. `/model` changes the model: big models use
  the limit faster.

### Codex with the course key

Skip this if you use your plan. Set up the key first ([section 4](#4-the-course-key)).

**Tested** on Linux, 24 October 2026: Example 1 with this file, 3.8 min of agent time, $0.11 on the
key. The checks passed, also when Codex ran them itself inside its sandbox.

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

On Windows, Notepad asks whether to create the new file: click **Yes**.

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

Make an empty test folder and start Codex in it.

**Mac**
```bash
mkdir -p ~/hello-agent && cd ~/hello-agent && codex
```

**Windows**
```powershell
New-Item -ItemType Directory -Force "$HOME\hello-agent"; cd "$HOME\hello-agent"; codex
```

- Codex asks "Do you trust this folder?" the first time in each folder. Answer **yes** in your
  project folders (`01-text-stats`, `02-splat-viewer`): otherwise Codex ignores the project's
  `.codex/config.toml`, and `npm run check` can't run.
- **Your plan:** the first time, choose **Sign in with ChatGPT**.
- Type `/status`: it shows which account and model Codex uses.
- Quit with `/exit`.

Codex runs commands in a **sandbox**: they can change files only inside the project. In the course
projects, `.codex/config.toml` lets `npm run check` start its local server inside the sandbox, and
lets commands use the internet (for `npm install`). Without it, every check crashed in our test
("listen EPERM") and the agent never saw a screenshot. When Codex asks to run something outside the
sandbox, read what it wants to run before you allow it.

Then do the smoke test, [section 8](#8-smoke-test).

---

## 8. Smoke test

Start your agent in the empty test folder from its first run. These commands also make the
folder if it is missing.

**Mac**
```bash
mkdir -p ~/hello-agent && cd ~/hello-agent
```

**Windows**
```powershell
New-Item -ItemType Directory -Force "$HOME\hello-agent"; cd "$HOME\hello-agent"
```

Then start your tool: `opencode`, `claude` or `codex`. Type:

```text
Create hello.js that prints "Hello from GLM", then run it with node.
```

The agent creates the file and runs `node hello.js`. Some tools ask first: allow it.
You should see `Hello from GLM` (also on a plan, where the model is not GLM: it is only the text
you asked for). If that works, you're set up.

---

## 9. The project skeleton, explained

Every project in this course, however small, has the same few files. They keep the agent
on track, keep secrets and big files away from it, and let it check its own work.

```
project/
├── AGENTS.md              rules for the agent
├── CLAUDE.md              one line: @AGENTS.md
├── ai/strategy.md         goal, plan, decisions, next step
├── .gitignore             what git never stores
├── .ignore                what agent search skips
├── opencode.json          what OpenCode may not read or edit, and may run without asking
├── .claude/settings.json  what Claude Code may not read or edit, and may run without asking
├── .codex/config.toml     lets Codex run the check inside its sandbox
├── package.json           npm run dev, npm test, npm run check
├── scripts/check.mjs      opens the app, reports, takes a screenshot
├── scripts/app-checks.mjs checks for this app only (optional)
├── src/                   your app, in small modules
├── tests/                 unit tests for pure logic
└── index.html             the page
```

**`AGENTS.md`** holds the rules, written once and read by every tool. Read the plan first,
work in small steps, run the checks after every change, never touch secrets. OpenCode and
Codex read it on their own.

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

**`opencode.json`** and **`.claude/settings.json`** are hard rules. They deny reading and
editing `.env*`, `node_modules/` and `public/splats/`. Rules in `AGENTS.md` are requests. The
tool enforces these. Both files also list the loop commands the agent may run without asking:
`npm test`, `npm run check`, `git status`, `git diff`, `git log` and `ls`. OpenCode also allows
`node`; Claude Code doesn't, because a `node` script can read past the deny rules.

**`.codex/config.toml`** is for Codex. Codex has no file deny rules: its sandbox lets commands
change files only inside the project. This file lets `npm run check` start its local server inside
the sandbox, and lets commands in the project use the internet (`npm install`). Codex reads it only
if you answered **yes** to "Do you trust this folder?".

**`package.json`** has three scripts: `npm run dev` starts the local server, `npm test` runs
the unit tests and `npm run check` checks the real page.

**`scripts/check.mjs`** is the agent's eyes. It starts the app, opens it in a hidden browser,
waits until the app says it is ready, then writes `.check/report.json` (errors, warnings,
failed requests, colours on screen, the page text) and `.check/screenshot.png`. The agent
reads both and fixes what it sees. **`scripts/app-checks.mjs`** adds checks only this app
needs, such as "the canvas is not blank".

### What each tool reads and searches

Background for the curious. You don't need it to work.

| | OpenCode | Claude Code | Codex CLI |
|---|---|---|---|
| Rules file | `AGENTS.md` (falls back to `CLAUDE.md`) | `CLAUDE.md`, which imports `AGENTS.md` | `AGENTS.md` |
| Project settings | `opencode.json` | `.claude/settings.json` | `.codex/config.toml` |
| Search skips `.gitignore` files | Yes, inside git repositories | Grep tool and `@` file picker: yes. Glob tool: no | `@` file search: yes, inside git repositories |
| Search skips `.ignore` files | Yes | Grep tool: yes. Bash `grep`: no | `@` file search: yes |
| Can open an ignored file by its path | Yes, unless denied | Yes, unless denied | Yes, with shell commands |
| Hard deny rules | `opencode.json` → `permission.read` / `edit` / `bash` | `.claude/settings.json` → `permissions.deny` | None. Beta "permission profiles" exist, not used here |
| `.env` files by default | Asks before reading | Readable | Readable |
| Looks at screenshots | Yes with GLM-5.3 Flash; GLM-5.3 can't | Yes, on a plan | Yes, on a plan |

What this means:

- **Ignore files hide things from search. They don't lock anything.** The agent can still open
  an ignored file by name. That is on purpose: it must read `.check/report.json`, which git ignores.
- **Deny rules lock files**, but only in OpenCode and Claude Code, and not perfectly.
  - **OpenCode** also blocks shell commands that name `.env` or `public/splats` (tested: in our run
    the agent tried `ls … public/splats` after the read tool refused). In OpenCode, `node` commands
    run without asking (they are loop commands), and a `node` script can open a denied file.
  - **Claude Code**'s rules block its own file tools and file commands like `cat`, `head`, `tail`
    and `sed`, but not a script it writes. In our test it refused to open a fake `.env`, quoting
    `AGENTS.md`.
  - **Codex** relies on `AGENTS.md`, `.gitignore` and `.ignore`, and on its sandbox. In our test it
    read a fake `.env` with a little script, and hid the value only because `AGENTS.md` says never
    to print secrets.
- **None of this is a vault.** A script the agent writes and runs can open any file. Keep secrets
  out of project folders altogether, and never give the agent passwords, keys or other people's
  data. That is one more reason the course key never goes into a project.

---

## 10. Troubleshooting

The same tables, with the Blender ones, as a web page that every slide links to:
[troubleshooting](https://xohm.github.io/photolipsia-agentic-kit/slides/troubleshooting.html).

**The course key**

| Problem | Fix |
|---|---|
| `404` "… matching your guardrail restrictions …", or `403` "not allowed" | The tool asked for a model the course key doesn't allow. Check the model name in your config. OpenCode: is `small_model` set? In `/models`, pick **GLM-5.3-Flash**, not FlashX or Prime. Claude Code: are all model variables set? |
| `403` "Budget limit exceeded" | Your key's $3 for today are used up. It resets at midnight UTC (1 or 2 am in Zurich). Tell your teacher if it happens often. |
| `401` "User not found" or "invalid key" | Typo in the key, or the terminal doesn't see it. Windows: open a new terminal after setting the key. Mac: `source ~/.zshrc`. Run `node tools/check-openrouter.mjs`. |
| `model_not_found`, `404` | Typo in the model name. OpenCode needs `openrouter/z-ai/glm-5.3-flash`, Claude Code and Codex need `z-ai/glm-5.3-flash`. |
| The agent can't see the screenshot, or images are rejected | GLM-5.3 can't see images, GLM-5.3 Flash can. OpenCode: `/models` → **GLM-5.3-Flash**. Claude Code, Codex: `/model`. |
| Claude Code still uses your Anthropic login | Is the `env` block in `~/.claude/settings.json`? Then `/logout`, quit, start again. `/status` must show `https://openrouter.ai/api` and `Auth token: ANTHROPIC_AUTH_TOKEN`. |
| Codex: "wire_api = chat is no longer supported" | Use `wire_api = "responses"`. |
| Codex ignores your provider | It must be in `~/.codex/config.toml` (Windows `$HOME\.codex\config.toml`), not in a project's `.codex/config.toml`. |

**Your own plan**

| Problem | Fix |
|---|---|
| Claude Code or Codex asks you to sign in again, or says you are not logged in | Claude Code: quit, start `claude` and sign in in the browser. Codex: `codex login`. Then check with `/status`. |
| The agent stops because a usage limit is reached | Your plan's 5-hour window or weekly limit is used up (shared with the chat app). `/usage` shows it. Wait until it resets. To make it last: a smaller model with `/model`, and a new session for each new task. |
| Claude Code doesn't work with your free Claude plan | The free plan does not include Claude Code. Use the course key with OpenCode: ask your teacher. |
| Codex doesn't work with ChatGPT Free or Go | The Codex CLI needs Plus or higher. Use the course key with OpenCode: ask your teacher. |
| Claude Code `/status` shows `Auth token` although you want your plan | The course key's `env` block is still in `~/.claude/settings.json`: the key beats a plan. Delete the block, then start `claude` again. |

**Any account**

| Problem | Fix |
|---|---|
| Codex: `npm run check` fails with "EPERM", "listen" or browser errors | Codex doesn't use the project's `.codex/config.toml`. Start Codex inside the project folder and answer **yes** to "Do you trust this folder?". If it still fails, approve running the check outside the sandbox when Codex asks. |
| Windows: "running scripts is disabled on this system" | `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned -Force`, then a new terminal. |
| `node` or `npm` "not recognized" / "command not found" | Open a new terminal after installing Node. Still not found: reinstall Node LTS. |
| `opencode`, `claude` or `codex` "not recognized" / "command not found" | Open a new terminal after installing the tool. `claude` still not found: add it to your PATH, see [section 6](#6-claude-code). |
| Mac: `npm install -g` fails with "EACCES" | See section 1, [Mac only: npm says EACCES](#mac-only-npm-says-eacces). |
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
| `git pull` prints `CONFLICT` | `git merge --abort`, then [ask in the Discussions](#ask-a-question). |
| `npm install` fails with "Cannot read properties of null (reading 'edgesOut')" | Old npm with a newer package. Update Node to the current LTS. |
| Windows: a firewall prompt when starting `npm run dev` | Allow on private networks, or cancel: the local page still works on your own laptop. |

### Ask a question

Not in these tables? Ask in writing, in the course
[Discussions](https://github.com/xohm/photolipsia-agentic-kit/discussions) on GitHub. Your teacher
answers there, and the next student finds the answer by searching.

1. Search the Discussions first: maybe someone asked already.
2. Not there? **New discussion**, category **Q&A**. The title: your problem in a few words.
3. Write what you did (the command or the prompt), what you see (copy the message as text, not only a
   screenshot), Mac or Windows, and your tool and account.
4. Discussions are public: never paste your key, or anything private.
5. Solved? Click **Mark as answer** under the reply that helped.
