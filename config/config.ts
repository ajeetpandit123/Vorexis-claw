import { homedir } from "node:os";
import path from "node:path";
import fs from "node:fs";
import chalk from "chalk";
import crypto from "node:crypto";
import { select, confirm, text as clackText, isCancel } from "@clack/prompts";

export interface VorexisConfig {
  provider?: string;
  apiKey?: string;
  openrouterApiKey?: string;
  modelProvider?: "openrouter" | "openai" | "anthropic" | "google" | "ollama" | "lmstudio";
  modelName?: string;
  autoModelRouting?: boolean;
  fallbackModel?: string;
  ollamaBaseUrl?: string;
  lmstudioBaseUrl?: string;
  githubToken?: string;
  anthropicApiKey?: string;
  googleApiKey?: string;
  voiceEnabled?: boolean;
  speechToTextProvider?: "whisper" | "deepgram" | "assemblyai" | "whisper.cpp";
  textToSpeechProvider?: "edge-tts" | "openai" | "elevenlabs" | "azure" | "none";
  voiceOutput?: boolean;
  autoListen?: boolean;
  openaiApiKey?: string;
  deepgramApiKey?: string;
  assemblyaiApiKey?: string;
  elevenlabsApiKey?: string;
  azureApiKey?: string;
  azureRegion?: string;
}

export function getConfigPath(): string {
  return path.join(
    homedir(),
    ".vorexis-claw",
    "config.json"
  );
}

export function ensureConfigDir(): void {
  const dir = path.dirname(getConfigPath());

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function loadConfig(): VorexisConfig {
  const configPath = getConfigPath();
  const defaults: VorexisConfig = {
    voiceEnabled: true,
    speechToTextProvider: "whisper",
    textToSpeechProvider: "edge-tts",
    voiceOutput: true,
    autoListen: true
  };
  if (!fs.existsSync(configPath)) {
    return defaults;
  }
  try {
    const data = fs.readFileSync(configPath, "utf-8");
    return { ...defaults, ...JSON.parse(data) } as VorexisConfig;
  } catch (error) {
    return defaults;
  }
}

export function resolveApiKey(): string | undefined {
  const SHIPPED_KEY_HASH = "eca60bcada1114973fae8d6654b43d607982d66d6386bb2a9d238a4e3881ace3";
  let envKey = process.env.OPENROUTER_API_KEY;
  if (envKey) {
    const hash = crypto.createHash("sha256").update(envKey).digest("hex");
    if (hash === SHIPPED_KEY_HASH) {
      envKey = undefined;
    }
  }
  const config = loadConfig();
  return envKey ?? config.apiKey ?? config.openrouterApiKey;
}

export function getProvider(): string {
  return loadConfig().provider ?? "openrouter";
}

export function saveConfig(config: VorexisConfig): void {
  ensureConfigDir();
  const configPath = getConfigPath();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
}

export function deleteConfig(): void {
  const configPath = getConfigPath();
  if (fs.existsSync(configPath)) {
    fs.unlinkSync(configPath);
  }
}

export function showOnboardingError(): void {
  try {
    // Write to clipboard natively in Bun
    Bun.write("clipboard", "vorexis-claw login");
  } catch (e) {
    // Ignore clipboard access errors if sandbox or environment restricts it
  }

  const formatLine = (leftText: string, style: (s: string) => string = (s) => s): string => {
    const width = 56;
    const border = chalk.hex("#5b4d9e")("│");
    const visibleLength = leftText.length;
    const padding = " ".repeat(Math.max(0, width - visibleLength));
    return `${border}${style(leftText)}${padding}${border}`;
  };

  console.log();
  console.log(chalk.hex("#5b4d9e")(`┌${"─".repeat(56)}┐`));
  console.log(formatLine("  [!] No model provider configured.", chalk.hex("#ff9e3b").bold));
  console.log(formatLine(""));
  console.log(formatLine("  Cloud:  vorexis-claw login"));
  console.log(formatLine("  Local:  vorexis-claw provider set ollama", chalk.hex("#e8dcf8").bold));
  console.log(formatLine(""));
  console.log(formatLine("  (Copied to clipboard! Just paste and run)", chalk.dim));
  console.log(chalk.hex("#5b4d9e")(`└${"─".repeat(56)}┘`));
  console.log();
}

export async function runSettingsFlow() {
  const currentConfig = loadConfig();
  console.log(chalk.hex("#5b4d9e").bold("\n⚙️ Vorexis-Claw Config & Voice Settings\n"));

  const voiceEnabled = await confirm({
    message: "Enable voice input?",
    initialValue: currentConfig.voiceEnabled ?? true
  });
  if (isCancel(voiceEnabled)) return;

  let speechToTextProvider =
    currentConfig.speechToTextProvider === "browser"
      ? "whisper"
      : currentConfig.speechToTextProvider;
  let textToSpeechProvider = currentConfig.textToSpeechProvider;
  let voiceOutput = currentConfig.voiceOutput ?? true;
  let autoListen = currentConfig.autoListen;
  let openaiApiKey = currentConfig.openaiApiKey;
  let deepgramApiKey = currentConfig.deepgramApiKey;
  let assemblyaiApiKey = currentConfig.assemblyaiApiKey;
  let elevenlabsApiKey = currentConfig.elevenlabsApiKey;
  let azureApiKey = currentConfig.azureApiKey;
  let azureRegion = currentConfig.azureRegion;

  if (voiceEnabled) {
    const stt = await select({
      message: "Select Speech-to-Text (STT) Provider:",
      options: [
        { value: "whisper", label: "OpenAI Whisper (Requires API Key)" },
        { value: "whisper.cpp", label: "whisper.cpp (Requires local whisper-cli)" },
        { value: "deepgram", label: "Deepgram (Requires API Key)" },
        { value: "assemblyai", label: "AssemblyAI (Requires API Key)" }
      ],
      initialValue: speechToTextProvider ?? "whisper"
    });
    if (isCancel(stt)) return;
    speechToTextProvider = stt as any;

    const tts = await select({
      message: "Select Text-to-Speech (TTS) Provider:",
      options: [
        { value: "edge-tts", label: "Microsoft Edge TTS (Free, Keyless)" },
        { value: "openai", label: "OpenAI TTS (Requires API Key)" },
        { value: "elevenlabs", label: "ElevenLabs (Requires API Key)" },
        { value: "azure", label: "Azure Speech (Requires API Key & Region)" },
        { value: "none", label: "None (Silent Terminal)" }
      ],
      initialValue: currentConfig.textToSpeechProvider ?? "edge-tts"
    });
    if (isCancel(tts)) return;
    textToSpeechProvider = tts as any;

    const speak = await confirm({
      message: "Speak AI responses aloud?",
      initialValue: voiceOutput
    });
    if (isCancel(speak)) return;
    voiceOutput = speak;

    const listen = await confirm({
      message: "Enable continuous conversation loop?",
      initialValue: currentConfig.autoListen ?? true
    });
    if (isCancel(listen)) return;
    autoListen = listen;

    if (speechToTextProvider === "whisper" || textToSpeechProvider === "openai") {
      const key = await clackText({
        message: "Enter OpenAI API Key (leave empty to keep current):",
        placeholder: currentConfig.openaiApiKey ? "••••••••" : "sk-..."
      });
      if (isCancel(key)) return;
      if (key.trim()) openaiApiKey = key.trim();
    }

    if (speechToTextProvider === "deepgram") {
      const key = await clackText({
        message: "Enter Deepgram API Key (leave empty to keep current):",
        placeholder: currentConfig.deepgramApiKey ? "••••••••" : "api key..."
      });
      if (isCancel(key)) return;
      if (key.trim()) deepgramApiKey = key.trim();
    }

    if (speechToTextProvider === "assemblyai") {
      const key = await clackText({
        message: "Enter AssemblyAI API Key (leave empty to keep current):",
        placeholder: currentConfig.assemblyaiApiKey ? "••••••••" : "api key..."
      });
      if (isCancel(key)) return;
      if (key.trim()) assemblyaiApiKey = key.trim();
    }

    if (textToSpeechProvider === "elevenlabs") {
      const key = await clackText({
        message: "Enter ElevenLabs API Key (leave empty to keep current):",
        placeholder: currentConfig.elevenlabsApiKey ? "••••••••" : "api key..."
      });
      if (isCancel(key)) return;
      if (key.trim()) elevenlabsApiKey = key.trim();
    }

    if (textToSpeechProvider === "azure") {
      const key = await clackText({
        message: "Enter Azure Speech Key (leave empty to keep current):",
        placeholder: currentConfig.azureApiKey ? "••••••••" : "api key..."
      });
      if (isCancel(key)) return;
      if (key.trim()) azureApiKey = key.trim();

      const reg = await clackText({
        message: "Enter Azure Speech Region (leave empty to keep current):",
        placeholder: currentConfig.azureRegion || "eastus"
      });
      if (isCancel(reg)) return;
      if (reg.trim()) azureRegion = reg.trim();
    }
  }

  const newConfig: VorexisConfig = {
    ...currentConfig,
    voiceEnabled,
    speechToTextProvider,
    textToSpeechProvider,
    voiceOutput,
    autoListen,
    openaiApiKey,
    deepgramApiKey,
    assemblyaiApiKey,
    elevenlabsApiKey,
    azureApiKey,
    azureRegion
  };

  saveConfig(newConfig);
  console.log(chalk.green("\n✅ Settings saved successfully!\n"));
}
