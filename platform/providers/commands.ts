import chalk from "chalk";
import { select, isCancel, text as clackText } from "@clack/prompts";

import { loadConfig, saveConfig } from "../../config/config.ts";
import {
  getModelProvider,
  getRoutedModelInfo,
  hasProviderCredentials,
  listOllamaModels,
  checkLocalProviderHealth,
} from "./manager.ts";
import { PROVIDERS, type ModelProvider } from "./types.ts";

export async function runProviderList(): Promise<void> {
  console.log(chalk.hex("#5b4d9e").bold("\n⚡ Model Providers\n"));
  const active = getModelProvider();

  for (const p of PROVIDERS) {
    const creds = hasProviderCredentials(p.id);
    const marker = p.id === active ? chalk.green("●") : chalk.dim("○");
    const status = p.local ? chalk.cyan("local") : creds ? chalk.green("ready") : chalk.red("no key");
    console.log(`${marker} ${chalk.bold(p.name)} (${p.id}) — ${status}`);
    console.log(chalk.dim(`   ${p.description}`));
  }
  console.log();
}

export async function runProviderSet(providerArg?: string): Promise<void> {
  const config = loadConfig();
  let provider = providerArg as ModelProvider | undefined;

  if (!provider) {
    const choice = await select({
      message: "Select model provider:",
      options: PROVIDERS.map((p) => ({
        value: p.id,
        label: `${p.name}${p.local ? " (local)" : ""}`,
      })),
      initialValue: getModelProvider(),
    });
    if (isCancel(choice)) return;
    provider = choice as ModelProvider;
  }

  if (!PROVIDERS.find((p) => p.id === provider)) {
    console.log(chalk.red(`Unknown provider: ${provider}`));
    return;
  }

  let modelName = config.modelName;

  if (provider === "ollama") {
    const models = await listOllamaModels();
    if (models.length > 0) {
      const choice = await select({
        message: "Select Ollama model:",
        options: models.map((m) => ({ value: m, label: m })),
        initialValue: modelName ?? models[0],
      });
      if (!isCancel(choice)) modelName = choice;
    } else {
      const manual = await clackText({
        message: "Enter Ollama model name (e.g. qwen2.5:7b):",
        placeholder: "qwen2.5:7b",
      });
      if (!isCancel(manual) && manual.trim()) modelName = manual.trim();
    }
  }

  saveConfig({
    ...config,
    provider,
    modelProvider: provider,
    modelName,
  });

  console.log(chalk.green(`\n✓ Provider set to ${provider}${modelName ? ` (model: ${modelName})` : ""}\n`));
}

export async function runProviderStatus(): Promise<void> {
  const provider = getModelProvider();
  const config = loadConfig();
  const routed = getRoutedModelInfo();

  console.log(chalk.hex("#5b4d9e").bold("\n⚡ Provider Status\n"));
  console.log(`Active Provider : ${chalk.white(provider)}`);
  console.log(`Configured Model: ${chalk.white(config.modelName ?? "auto")}`);
  console.log(`Auto Routing    : ${chalk.white(config.autoModelRouting !== false ? "enabled" : "disabled")}`);
  console.log(`Current Route   : ${chalk.white(routed.model)} (${routed.task} task)`);
  console.log(`Route Reason    : ${chalk.dim(routed.reason)}`);

  if (provider === "ollama" || provider === "lmstudio") {
    const healthy = await checkLocalProviderHealth(provider);
    console.log(`Local Server    : ${healthy ? chalk.green("reachable") : chalk.red("unreachable")}`);
  } else {
    console.log(`API Key         : ${hasProviderCredentials(provider) ? chalk.green("configured") : chalk.red("missing")}`);
  }
  console.log();
}
