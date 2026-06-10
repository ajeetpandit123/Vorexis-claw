# Vorexis-Claw

**Autonomous Software Engineer AI** — a terminal-native CLI for building, planning, and understanding codebases. Inspired by Claude Code, Cursor Agent, and modern AI coding assistants.

Vorexis-Claw uses a **single-prompt architecture**: you describe what you want, and the system automatically routes your request to the right engine. No mode menus. No browser. Everything runs in the terminal.

---

## Features

- **Single prompt interface** — type or speak; intent is detected automatically
- **Ask engine** — read files, search the codebase, explain code and architecture
- **Plan engine** — generate roadmaps, feature plans, and step-by-step execution plans
- **Agent engine** — create/edit files, run commands, refactor, and fix bugs (with approval flow)
- **Voice input** — press `V` to record; speech-to-text feeds the same pipeline as typing
- **Optional voice output** — TTS for responses (Edge TTS, OpenAI, and more)
- **Session memory** — follow-up prompts retain conversation context
- **Project intelligence** — auto-detects framework, language, package manager, and git status on startup
- **Slash commands** — `/help`, `/history`, `/status`, `/context`, `/reset`, and more
- **Telegram bot** — optional remote interface via `vorexis-claw telegram`

---

## Requirements

- [Bun](https://bun.sh) 1.0+
- OpenRouter API key ([get one here](https://openrouter.ai))
- Optional: OpenAI API key (for Whisper STT / OpenAI TTS)
- Optional: `TELEGRAM_BOT_TOKEN` and `TELEGRAM_OWNER_ID` (for Telegram mode)

---

## Installation

```bash
git clone <your-repo-url>
cd coffee-claw
bun install
bun run build
```

Link the CLI globally (optional):

```bash
bun link
```

---

## Quick Start

### 1. Log in

```bash
vorexis-claw login
```

Your API key is stored at:

- **Windows:** `C:\Users\<user>\.vorexis-claw\config.json`
- **Linux/macOS:** `~/.vorexis-claw/config.json`

### 2. Start a session

```bash
vorexis-claw
```

or:

```bash
vorexis-claw wakeup
```

### 3. Describe what you want

```
What would you like to build, fix, understand, or plan?

> What's inside README.md?
```

The system detects intent and routes automatically — you never pick Ask, Plan, or Agent manually.

---

## How Intent Routing Works

| You say… | Routed to |
|----------|-----------|
| `What's inside README.md?` | **Ask** — read-only codebase Q&A |
| `Explain how auth.ts works` | **Ask** |
| `Create a roadmap for a MERN ecommerce app` | **Plan** — architecture & execution planning |
| `Plan JWT authentication` | **Plan** |
| `Build JWT authentication` | **Agent** — autonomous file edits & commands |
| `Fix the login bug in auth.ts` | **Agent** |

Flow:

```
User Input (type or voice)
      ↓
Intent Detection
      ↓
Ask / Plan / Agent Engine
      ↓
Response (+ optional TTS)
      ↓
Session Memory
```

---

## Voice Input

Voice is an **input method**, not a separate mode.

At the `>` prompt:

| Key | Action |
|-----|--------|
| **V** | Start recording |
| **ENTER** | Stop recording and submit |
| **ESC** | Cancel recording |
| **Ctrl+C** | Exit session |

Configure voice in settings:

```bash
vorexis-claw settings
```

STT providers (priority): OpenAI Whisper → whisper.cpp → Deepgram → AssemblyAI

---

## Slash Commands

| Command | Description |
|---------|-------------|
| `/help` | Show help and examples |
| `/clear` | Clear terminal |
| `/history` | Show session history |
| `/status` | Project status summary |
| `/context` | Full project context |
| `/reset` | Clear session memory |
| `/exit` | Exit session |

---

## CLI Commands

| Command | Description |
|---------|-------------|
| `vorexis-claw` | Start interactive session (default) |
| `vorexis-claw wakeup` | Start interactive session |
| `vorexis-claw start` | Alias for wakeup |
| `vorexis-claw login` | Save OpenRouter API key |
| `vorexis-claw logout` | Remove stored credentials |
| `vorexis-claw whoami` | Show provider and API key status |
| `vorexis-claw settings` | Configure voice, STT, and TTS |
| `vorexis-claw telegram` | Start Telegram bot |
| `vorexis-claw --help` | Show help |

---

## Configuration

Config file: `~/.vorexis-claw/config.json`

```json
{
  "provider": "openrouter",
  "apiKey": "sk-or-...",
  "voiceEnabled": true,
  "speechToTextProvider": "whisper",
  "textToSpeechProvider": "edge-tts",
  "voiceOutput": true,
  "autoListen": true
}
```

**API key resolution order:**

1. `OPENROUTER_API_KEY` environment variable
2. `apiKey` in config file
3. Error — run `vorexis-claw login`

---

## Project Structure

```
coffee-claw/
├── index.ts                 # CLI entry point
├── config/config.ts         # Config persistence & settings
├── core/
│   ├── project-context.ts   # Auto-detect project metadata
│   └── session-memory.ts    # Conversation memory
├── engine/
│   ├── intent.ts            # detectIntent()
│   └── router.ts            # Routes to Ask / Plan / Agent
├── tui/
│   ├── session.ts           # Main REPL loop
│   ├── banner.ts            # Startup UI
│   └── help.ts              # Help & slash command docs
├── modes/
│   ├── agent/               # Agent engine (tools, approval, execution)
│   ├── ask/                 # Ask engine (read-only Q&A)
│   ├── plan/                # Plan engine (planning & step execution)
│   ├── voice/               # STT, TTS, mic capture, prompt input
│   └── telegram/            # Telegram bot interface
└── AI/                      # OpenRouter model configuration
```

---

## Agent Approval Flow

When the Agent engine modifies files or runs commands, changes are **staged** first. You review and approve before anything is written to disk:

- Approve all
- Review individual changes (with diffs)
- Cancel and discard

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `OPENROUTER_API_KEY` | Primary LLM API key |
| `OPENROUTER_DEFAULT_MODEL` | Override default model |
| `OPENAI_API_KEY` | Whisper STT / OpenAI TTS |
| `DEEPGRAM_API_KEY` | Deepgram STT |
| `FIRECRAWL_API_KEY` | Web search & crawl tools |
| `TELEGRAM_BOT_TOKEN` | Telegram bot token |
| `TELEGRAM_OWNER_ID` | Authorized Telegram user ID |

---

## Development

```bash
bun run build          # Build to dist/
bun ./index.ts         # Run from source
bun ./index.ts wakeup  # Start session
```

Default model: `google/gemini-2.5-flash` via OpenRouter (configurable in `AI/ai.config.ts`).

---

## License

Private project.
