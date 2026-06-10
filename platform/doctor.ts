import { execSync } from "node:child_process";
import chalk from "chalk";

import { resolveApiKey, loadConfig } from "../config/config.ts";
import { hasGitHubAuth, getAuthenticatedUser } from "./github/service.ts";
import { mcpManager } from "./mcp/manager.ts";
import { loadMcpConfig } from "./mcp/config.ts";
import {
  getModelProvider,
  hasProviderCredentials,
  checkLocalProviderHealth,
  listOllamaModels,
} from "./providers/manager.ts";
import { isVoiceEnabled } from "../modes/voice/prompt-input.ts";

interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
  fix?: string;
}

function commandExists(cmd: string): boolean {
  try {
    if (process.platform === "win32") {
      execSync(`where ${cmd}`, { stdio: "ignore" });
    } else {
      execSync(`which ${cmd}`, { stdio: "ignore" });
    }
    return true;
  } catch {
    return false;
  }
}

async function runChecks(): Promise<CheckResult[]> {
  const config = loadConfig();
  const provider = getModelProvider();
  const results: CheckResult[] = [];

  const apiKey = resolveApiKey();
  results.push({
    name: "OpenRouter API Key",
    ok: !!apiKey,
    detail: apiKey ? "Configured" : "Missing",
    fix: "vorexis-claw login",
  });

  results.push({
    name: "Model Provider",
    ok: hasProviderCredentials(provider),
    detail: `${provider}${config.modelName ? ` (${config.modelName})` : ""}`,
    fix: provider === "ollama" || provider === "lmstudio"
      ? "vorexis-claw provider set ollama"
      : "vorexis-claw provider set openrouter",
  });

  if (provider === "ollama") {
    const healthy = await checkLocalProviderHealth("ollama");
    const models = await listOllamaModels();
    results.push({
      name: "Ollama",
      ok: healthy,
      detail: healthy ? `${models.length} model(s)` : "Not reachable",
      fix: "Start Ollama: ollama serve",
    });
  }

  if (provider === "lmstudio") {
    const healthy = await checkLocalProviderHealth("lmstudio");
    results.push({
      name: "LM Studio",
      ok: healthy,
      detail: healthy ? "Reachable" : "Not reachable",
      fix: "Start LM Studio local server on port 1234",
    });
  }

  results.push({
    name: "GitHub Auth",
    ok: hasGitHubAuth(),
    detail: hasGitHubAuth() ? "Token configured" : "Not configured",
    fix: "vorexis-claw github login",
  });

  if (hasGitHubAuth()) {
    try {
      const user = await getAuthenticatedUser();
      results[results.length - 1] = {
        name: "GitHub Auth",
        ok: true,
        detail: `Authenticated as ${user.login}`,
      };
    } catch {
      results[results.length - 1].ok = false;
      results[results.length - 1].detail = "Token invalid";
      results[results.length - 1].fix = "vorexis-claw github login";
    }
  }

  const mcpConfig = loadMcpConfig();
  const mcpCount = Object.keys(mcpConfig.servers).length;
  const connected = mcpManager.getConnectedServers();
  results.push({
    name: "MCP Servers",
    ok: mcpCount > 0,
    detail: `${connected.length}/${mcpCount} connected`,
    fix: "vorexis-claw mcp connect <name>",
  });

  results.push({
    name: "Voice Input",
    ok: isVoiceEnabled(),
    detail: isVoiceEnabled() ? `STT: ${config.speechToTextProvider ?? "whisper"}` : "Disabled",
    fix: "vorexis-claw settings",
  });

  results.push({
    name: "Voice Output",
    ok: config.voiceOutput !== false,
    detail: config.voiceOutput !== false ? `TTS: ${config.textToSpeechProvider ?? "edge-tts"}` : "Disabled",
    fix: "vorexis-claw settings",
  });

  results.push({
    name: "Bun Runtime",
    ok: !!process.versions.bun,
    detail: process.versions.bun ? `v${process.versions.bun}` : "Not running on Bun",
    fix: "Install Bun: https://bun.sh",
  });

  results.push({
    name: "Node.js",
    ok: !!process.version,
    detail: process.version,
  });

  results.push({
    name: "Git",
    ok: commandExists("git"),
    detail: commandExists("git") ? "Available" : "Not found",
    fix: "Install Git: https://git-scm.com",
  });

  return results;
}

export async function runDoctor(): Promise<void> {
  console.log(chalk.hex("#5b4d9e").bold("\n⚡ Vorexis-Claw Doctor\n"));

  const results = await runChecks();
  let failures = 0;

  for (const check of results) {
    const icon = check.ok ? chalk.green("✓") : chalk.red("✗");
    console.log(`${icon} ${chalk.bold(check.name)}: ${check.detail}`);
    if (!check.ok) {
      failures++;
      if (check.fix) console.log(chalk.dim(`    Fix: ${check.fix}`));
    }
  }

  console.log();
  if (failures === 0) {
    console.log(chalk.green("All checks passed.\n"));
  } else {
    console.log(chalk.yellow(`${failures} check(s) need attention.\n`));
  }
}
