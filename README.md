# Vorexis-Claw

**Autonomous Software Engineer AI** — a terminal-native AI engineering platform for building, planning, and understanding codebases.

Single-prompt architecture: describe what you want, and Vorexis-Claw automatically routes to the right engine. No mode menus. No browser. Everything runs in the terminal.

**Version:** 3.0.0

---

## Table of Contents

- [Features](#features)
- [Requirements](#requirements)
- [Installation](#installation)
- [Complete Setup Guide](#complete-setup-guide)
- [Session Usage](#session-usage)
- [Intent Routing](#intent-routing)
- [All CLI Commands](#all-cli-commands)
- [Slash Commands (in-session)](#slash-commands-in-session)
- [Voice Input & Output](#voice-input--output)
- [GitHub Integration](#github-integration)
- [MCP Integration](#mcp-integration)
- [Model Providers](#model-providers)
- [Doctor Health Checks](#doctor-health-checks)
- [Telegram Bot](#telegram-bot)
- [Configuration Reference](#configuration-reference)
- [Environment Variables](#environment-variables)
- [Project Structure](#project-structure)
- [Development](#development)

---

## Features

| Feature | Description |
|---------|-------------|
| Single prompt | Type or speak — no Agent/Plan/Ask menu |
| Intent router | Auto-detects Ask, Plan, or Agent from your prompt |
| Ask engine | Read files, search codebase, explain architecture |
| Plan engine | Roadmaps, feature plans, step-by-step execution |
| Agent engine | Create/edit files, run commands, fix bugs (with approval) |
| Voice input | Press `V` to record; STT feeds the same pipeline |
| Voice output | Optional TTS for spoken responses |
| Session memory | Follow-up prompts retain conversation context |
| Project intelligence | Auto-detects framework, language, git branch on startup |
| GitHub integration | PRs, issues, branches, repo search via agent tools |
| MCP support | Connect external tool servers (database, browser, docker, etc.) |
| Local models | Ollama & LM Studio — no cloud API required |
| Model router | Auto-selects best model per task type |
| Doctor | Health checks for all platform components |

---

## Requirements

- [Bun](https://bun.sh) 1.0+
- [Git](https://git-scm.com) (recommended)
- **One of:**
  - OpenRouter API key ([openrouter.ai](https://openrouter.ai)) — cloud
  - Ollama or LM Studio — local, no API key needed
- **Optional:**
  - GitHub Personal Access Token — for PR/issue workflows
  - OpenAI API key — Whisper STT / OpenAI TTS
  - Deepgram / AssemblyAI keys — alternative STT
  - Firecrawl API key — web search tools
  - Telegram bot token — remote bot mode

---

## Installation

```bash
git clone <your-repo-url>
cd coffee-claw
bun install
bun run build
```

Link globally (optional):

```bash
bun link
```

---

## Complete Setup Guide

### Step 1 — Choose a model provider

**Option A: Cloud (OpenRouter)**

```bash
vorexis-claw login
```

**Option B: Local (Ollama — no API key)**

```bash
# Install Ollama: https://ollama.ai
ollama pull qwen2.5:7b
vorexis-claw provider set ollama
```

**Option C: Local (LM Studio)**

```bash
# Start LM Studio local server on port 1234
vorexis-claw provider set lmstudio
```

Verify:

```bash
vorexis-claw provider status
vorexis-claw whoami
```

### Step 2 — Configure voice (optional)

```bash
vorexis-claw settings
```

Interactive prompts for STT provider, TTS provider, voice input/output.

### Step 3 — Configure GitHub (optional)

```bash
vorexis-claw github login
vorexis-claw github status
```

### Step 4 — Configure MCP servers (optional)

Edit `~/.vorexis-claw/mcp.json`, then:

```bash
vorexis-claw mcp list
vorexis-claw mcp connect filesystem
vorexis-claw mcp status
```

### Step 5 — Run health check

```bash
vorexis-claw doctor
```

### Step 6 — Start a session

```bash
vorexis-claw
```

---

## Session Usage

When you start a session you see:

```
⚡ VOREXIS CLAW

Project        : coffee-claw
Framework      : Bun
Language       : TypeScript
Git Branch     : main
Git Status     : clean

────────────────────────────────────

What would you like to build, fix, understand, or plan?

>
```

**Type** your prompt and press **ENTER**, or press **V** to speak.

### Example prompts

```
> What's inside README.md?
> Explain how the agent orchestrator works
> Create a roadmap for a MERN ecommerce app
> Build JWT authentication with refresh tokens
> Review my open pull requests
> Fix issue #42
> Add forgot password to the auth flow
```

After each response, you stay in the session. Type or speak again — session memory carries context forward.

---

## Intent Routing

You never pick a mode. The system routes automatically:

| Prompt style | Engine | What it does |
|--------------|--------|--------------|
| Questions, explain, what's inside | **Ask** | Read-only codebase Q&A |
| Plan, roadmap, architecture, strategy | **Plan** | Generate & execute step-by-step plan |
| Build, fix, create, implement, PR/issue | **Agent** | Autonomous edits + approval flow |

```
User Input (type or voice)
      ↓
Intent Detection
      ↓
Ask / Plan / Agent Engine
      ↓
Platform Tools (GitHub, MCP)
      ↓
Response (+ optional TTS)
      ↓
Session Memory
```

---

## All CLI Commands

### Session

| Command | Description |
|---------|-------------|
| `vorexis-claw` | Start interactive session (default command) |
| `vorexis-claw wakeup` | Start interactive session |
| `vorexis-claw start` | Alias for wakeup |
| `vorexis-claw --help` | Show in-terminal help |

### Authentication

| Command | Description |
|---------|-------------|
| `vorexis-claw login` | Save OpenRouter API key to config |
| `vorexis-claw logout` | Delete entire config file |
| `vorexis-claw whoami` | Show active provider and API key status |

**Usage:**

```bash
vorexis-claw login          # prompts for OpenRouter key
vorexis-claw whoami         # Provider: openrouter / API Key: Configured ✅
vorexis-claw logout         # removes ~/.vorexis-claw/config.json
```

### Settings

| Command | Description |
|---------|-------------|
| `vorexis-claw settings` | Interactive voice/STT/TTS configuration wizard |

Configures: voice input on/off, STT provider, TTS provider, voice output, continuous loop.

### GitHub

| Command | Description |
|---------|-------------|
| `vorexis-claw github login` | Store GitHub Personal Access Token |
| `vorexis-claw github logout` | Remove GitHub token from config |
| `vorexis-claw github status` | Show authenticated user and remote repo |

**Usage:**

```bash
vorexis-claw github login
# Enter token when prompted (ghp_...)

vorexis-claw github status
# User: your-username
# Remote Repo: owner/repo

vorexis-claw github logout
```

**In-session prompts (after login):**

```
> Review my open pull requests
> Create a PR for the authentication feature
> Fix issue #42
> List open issues on this repo
```

### MCP (Model Context Protocol)

| Command | Description |
|---------|-------------|
| `vorexis-claw mcp list` | List all configured MCP servers |
| `vorexis-claw mcp connect [name]` | Connect to an MCP server |
| `vorexis-claw mcp disconnect [name]` | Disconnect from an MCP server |
| `vorexis-claw mcp status` | Show connected servers and tool count |

**Usage:**

```bash
vorexis-claw mcp list
vorexis-claw mcp connect filesystem
vorexis-claw mcp connect database
vorexis-claw mcp status
vorexis-claw mcp disconnect filesystem
```

**In-session prompts (after connect):**

```
> Check the production database schema
> Open homepage and check for console errors
> List files in the project root via MCP
```

### Model Providers

| Command | Description |
|---------|-------------|
| `vorexis-claw provider list` | List all supported providers |
| `vorexis-claw provider set [name]` | Set active provider (interactive if no name) |
| `vorexis-claw provider status` | Show active provider, model, and routing info |

**Usage:**

```bash
vorexis-claw provider list

vorexis-claw provider set openrouter    # cloud (default)
vorexis-claw provider set ollama         # local
vorexis-claw provider set lmstudio       # local
vorexis-claw provider set openai        # direct OpenAI
vorexis-claw provider set anthropic       # direct Anthropic
vorexis-claw provider set google          # direct Google Gemini

vorexis-claw provider status
# Active Provider : ollama
# Configured Model: qwen2.5:7b
# Current Route   : qwen2.5-coder:7b (code task)
```

**Supported providers:**

| Provider | Type | API Key needed |
|----------|------|----------------|
| `openrouter` | Cloud | Yes — `vorexis-claw login` |
| `openai` | Cloud | Yes — `openaiApiKey` in config |
| `anthropic` | Cloud | Yes — `anthropicApiKey` in config |
| `google` | Cloud | Yes — `googleApiKey` in config |
| `ollama` | Local | No — requires Ollama running |
| `lmstudio` | Local | No — requires LM Studio server |

### Doctor

| Command | Description |
|---------|-------------|
| `vorexis-claw doctor` | Run all platform health checks with fix suggestions |

Checks: API keys, model provider, Ollama/LM Studio, GitHub auth, MCP connections, voice system, Bun, Node, Git.

```bash
vorexis-claw doctor
```

### Telegram

| Command | Description |
|---------|-------------|
| `vorexis-claw telegram` | Start the Telegram bot interface |

Requires `TELEGRAM_BOT_TOKEN` and `TELEGRAM_OWNER_ID` in environment.

---

## Slash Commands (in-session)

Use these at the `>` prompt during a session:

| Command | Description |
|---------|-------------|
| `/help` | Show help, examples, and keyboard shortcuts |
| `/clear` | Clear terminal and redraw startup banner |
| `/history` | Show conversation history for this session |
| `/status` | Project name, framework, branch, memory turns |
| `/context` | Full project context (paths, git, package manager) |
| `/reset` | Clear session memory |
| `/exit` | Exit the session |

Also works: type `help` or `--help` at the prompt.

---

## Voice Input & Output

Voice is an **input method** built into the session — not a separate mode.

### Keyboard shortcuts (at `>` prompt)

| Key | Action |
|-----|--------|
| **V** | Start voice recording |
| **ENTER** | Stop recording and submit (while recording) or submit typed text |
| **ESC** | Cancel recording |
| **Ctrl+C** | Exit session |

### Configure voice

```bash
vorexis-claw settings
```

Or edit `config.json` directly (see [Configuration Reference](#configuration-reference)).

### STT providers (Speech-to-Text)

| Provider | Config value | Requires |
|----------|-------------|----------|
| OpenAI Whisper | `"whisper"` | `openaiApiKey` |
| whisper.cpp | `"whisper.cpp"` | Local `whisper-cli` install |
| Deepgram | `"deepgram"` | `deepgramApiKey` |
| AssemblyAI | `"assemblyai"` | `assemblyaiApiKey` |

### TTS providers (Text-to-Speech)

| Provider | Config value | Requires |
|----------|-------------|----------|
| Microsoft Edge TTS | `"edge-tts"` | Nothing (free, keyless) |
| OpenAI TTS | `"openai"` | `openaiApiKey` |
| ElevenLabs | `"elevenlabs"` | `elevenlabsApiKey` |
| Azure Speech | `"azure"` | `azureApiKey` + `azureRegion` |
| None (silent) | `"none"` | — |

Set `"voiceOutput": true` to speak AI responses aloud.

---

## GitHub Integration

### Setup

1. Create a token at [github.com/settings/tokens](https://github.com/settings/tokens)
2. Required scopes: `repo` (classic) or Contents + Issues + Pull requests (fine-grained)
3. Login:

```bash
vorexis-claw github login
```

**Alternative:** set environment variable:

```bash
GITHUB_TOKEN=ghp_your_token_here
# or
GH_TOKEN=ghp_your_token_here
```

### Agent tools available after login

| Tool | What it does |
|------|-------------|
| `github_search_repos` | Search repositories |
| `github_get_repo` | Get repo metadata |
| `github_list_prs` | List pull requests (uses git remote if no owner/repo given) |
| `github_get_pr` | Get PR details and changed files |
| `github_create_pr` | Create a pull request |
| `github_list_issues` | List issues |
| `github_get_issue` | Get issue details |
| `github_comment_issue` | Post comment on issue/PR |
| `github_create_branch` | Create a branch |
| `github_list_branches` | List branches |

### Example workflows

```
> Review my open pull requests
> What's in issue #42?
> Create a PR for the auth feature branch
> List all branches on this repo
```

---

## MCP Integration

MCP (Model Context Protocol) lets the agent use external tool servers.

### Config file

**Path:** `~/.vorexis-claw/mcp.json`

**Windows:** `C:\Users\<user>\.vorexis-claw\mcp.json`

```json
{
  "servers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "C:/path/to/project"],
      "enabled": false
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_..." },
      "enabled": false
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres", "postgresql://localhost/mydb"],
      "enabled": false
    },
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"],
      "enabled": false
    }
  }
}
```

### Connect and use

```bash
vorexis-claw mcp list
vorexis-claw mcp connect postgres
vorexis-claw mcp status
```

Connected MCP tools appear automatically in Ask, Plan, and Agent engines.

Set `"enabled": true` in `mcp.json` to auto-connect on session start.

---

## Model Providers

### Auto model routing (OpenRouter)

When `modelName` is not set, Vorexis-Claw picks a model based on task type:

| Task type | Model used |
|-----------|-----------|
| Small / quick | `google/gemini-2.5-flash` |
| Code generation | `deepseek/deepseek-chat-v3-0324` |
| Planning | `anthropic/claude-sonnet-4` |
| Analysis | `google/gemini-2.5-pro` |
| General | `google/gemini-2.5-flash` |

### Auto model routing (Ollama)

| Task type | Model used |
|-----------|-----------|
| Small | `qwen2.5:3b` |
| Code | `qwen2.5-coder:7b` |
| Planning / Analysis | `qwen2.5:7b` |

### Manual model override

Set in `config.json`:

```json
{
  "modelProvider": "openrouter",
  "modelName": "anthropic/claude-sonnet-4"
}
```

Or for Ollama:

```json
{
  "modelProvider": "ollama",
  "modelName": "qwen2.5:7b",
  "ollamaBaseUrl": "http://127.0.0.1:11434/v1"
}
```

---

## Doctor Health Checks

```bash
vorexis-claw doctor
```

| Check | What it verifies |
|-------|-----------------|
| OpenRouter API Key | Cloud auth configured |
| Model Provider | Active provider reachable |
| Ollama / LM Studio | Local server running |
| GitHub Auth | Token valid and user authenticated |
| MCP Servers | Configured and connected count |
| Voice Input | STT provider configured |
| Voice Output | TTS provider configured |
| Bun Runtime | Bun version |
| Node.js | Node version |
| Git | Git installed and available |

Failed checks show a **Fix:** command to resolve the issue.

---

## Telegram Bot

```bash
# Set in .env or environment
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_OWNER_ID=your_telegram_user_id

vorexis-claw telegram
```

Supports `/ask`, `/agent`, `/plan` commands via Telegram.

---

## Configuration Reference

### Config file paths

| OS | Path |
|----|------|
| Windows | `C:\Users\<user>\.vorexis-claw\config.json` |
| Linux/macOS | `~/.vorexis-claw/config.json` |

### `config.json` — all fields

```json
{
  "provider": "openrouter",
  "apiKey": "sk-or-...",
  "openrouterApiKey": "sk-or-...",

  "modelProvider": "openrouter",
  "modelName": "google/gemini-2.5-flash",
  "autoModelRouting": true,
  "fallbackModel": "google/gemini-2.5-flash",
  "ollamaBaseUrl": "http://127.0.0.1:11434/v1",
  "lmstudioBaseUrl": "http://127.0.0.1:1234/v1",

  "githubToken": "ghp_...",

  "openaiApiKey": "sk-...",
  "anthropicApiKey": "sk-ant-...",
  "googleApiKey": "AI...",
  "deepgramApiKey": "...",
  "assemblyaiApiKey": "...",
  "elevenlabsApiKey": "...",
  "azureApiKey": "...",
  "azureRegion": "eastus",

  "voiceEnabled": true,
  "speechToTextProvider": "whisper",
  "textToSpeechProvider": "edge-tts",
  "voiceOutput": true,
  "autoListen": true
}
```

### Field reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `provider` | string | `"openrouter"` | Legacy provider alias |
| `apiKey` | string | — | Primary API key |
| `openrouterApiKey` | string | — | OpenRouter key (legacy alias) |
| `modelProvider` | string | `"openrouter"` | Active model provider |
| `modelName` | string | auto | Manual model override |
| `autoModelRouting` | boolean | `true` | Auto-select model by task type |
| `fallbackModel` | string | — | Fallback if routing fails |
| `ollamaBaseUrl` | string | `http://127.0.0.1:11434/v1` | Ollama API endpoint |
| `lmstudioBaseUrl` | string | `http://127.0.0.1:1234/v1` | LM Studio API endpoint |
| `githubToken` | string | — | GitHub Personal Access Token |
| `openaiApiKey` | string | — | OpenAI key (Whisper STT, TTS, provider) |
| `anthropicApiKey` | string | — | Anthropic key (direct provider) |
| `googleApiKey` | string | — | Google key (direct provider) |
| `deepgramApiKey` | string | — | Deepgram STT key |
| `assemblyaiApiKey` | string | — | AssemblyAI STT key |
| `elevenlabsApiKey` | string | — | ElevenLabs TTS key |
| `azureApiKey` | string | — | Azure Speech key |
| `azureRegion` | string | — | Azure Speech region |
| `voiceEnabled` | boolean | `true` | Enable voice input in session |
| `speechToTextProvider` | string | `"whisper"` | STT provider |
| `textToSpeechProvider` | string | `"edge-tts"` | TTS provider |
| `voiceOutput` | boolean | `true` | Speak AI responses aloud |
| `autoListen` | boolean | `true` | Continuous session loop |

### API key resolution order

**OpenRouter:**
1. `OPENROUTER_API_KEY` environment variable
2. `apiKey` in config
3. `openrouterApiKey` in config

**GitHub:**
1. `GITHUB_TOKEN` or `GH_TOKEN` environment variable
2. `githubToken` in config

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `OPENROUTER_API_KEY` | Primary LLM API key (OpenRouter) |
| `OPENROUTER_DEFAULT_MODEL` | Override default model ID |
| `OPENAI_API_KEY` | OpenAI provider, Whisper STT, OpenAI TTS |
| `ANTHROPIC_API_KEY` | Anthropic direct provider |
| `GOOGLE_API_KEY` | Google Gemini direct provider |
| `GITHUB_TOKEN` | GitHub API access |
| `GH_TOKEN` | GitHub API access (alias) |
| `DEEPGRAM_API_KEY` | Deepgram STT |
| `ASSEMBLYAI_API_KEY` | AssemblyAI STT |
| `ELEVENLABS_API_KEY` | ElevenLabs TTS |
| `AZURE_SPEECH_KEY` | Azure TTS |
| `AZURE_SPEECH_REGION` | Azure TTS region |
| `OLLAMA_BASE_URL` | Ollama API endpoint override |
| `LMSTUDIO_BASE_URL` | LM Studio API endpoint override |
| `FIRECRAWL_API_KEY` | Web search & crawl tools |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token |
| `TELEGRAM_OWNER_ID` | Authorized Telegram user ID |
| `SKILLS_DIRS` | Custom skill directories for agent |

You can use a `.env` file in the project root for local development.

---

## Project Structure

```
coffee-claw/
├── index.ts                    # CLI entry point (all commands)
├── config/config.ts            # Config persistence & settings wizard
├── core/
│   ├── project-context.ts      # Auto-detect project metadata
│   └── session-memory.ts       # Conversation memory
├── engine/
│   ├── intent.ts               # detectIntent() → ASK/PLAN/AGENT
│   └── router.ts               # Routes prompts to engines
├── platform/
│   ├── github/                 # GitHub API service, tools, CLI commands
│   ├── mcp/                    # MCP client manager, tools, CLI commands
│   ├── providers/              # Model provider abstraction & router
│   ├── tools.ts                # Unified platform tool builder
│   └── doctor.ts               # Health checks
├── tui/
│   ├── session.ts              # Main REPL loop
│   ├── banner.ts               # Startup UI
│   └── help.ts                 # Help text
├── modes/
│   ├── agent/                  # Agent engine (tools, approval, execution)
│   ├── ask/                    # Ask engine (read-only Q&A)
│   ├── plan/                   # Plan engine (planning & step execution)
│   ├── voice/                  # STT, TTS, mic capture, prompt input
│   └── telegram/               # Telegram bot interface
└── AI/                         # Model provider exports
```

---

## Agent Approval Flow

When the Agent engine modifies files or runs shell commands, changes are **staged** first:

1. Agent completes the task
2. You review pending changes
3. Choose: **Approve all** / **Review individually** (with diffs) / **Cancel**
4. Approved changes are written to disk

---

## Development

```bash
bun install
bun run build              # Build to dist/
bun ./index.ts             # Run from source
bun ./index.ts wakeup      # Start session
bun ./index.ts doctor      # Health check
bun ./index.ts github login
```

---

## License

Private project.
