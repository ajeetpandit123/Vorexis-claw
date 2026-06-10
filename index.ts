#!/usr/bin/env bun

import { Command } from "commander";
import { runWakeup } from "./tui/wakeup.ts";
import { runSession } from "./tui/session.ts";
import {
  ensureConfigDir,
  loadConfig,
  saveConfig,
  deleteConfig,
  resolveApiKey,
  getProvider,
  runSettingsFlow,
} from "./config/config.ts";
import { runTelegramMode } from "./modes/telegram/index.ts";
import { password, isCancel } from "@clack/prompts";
import chalk from "chalk";
import { printHelp } from "./tui/help.ts";

ensureConfigDir();

const program = new Command();

program
  .name("vorexis-claw")
  .description("Autonomous Software Engineer AI — single-prompt interface")
  .version("2.0.0");

program
  .command("wakeup", { isDefault: true })
  .description("Start the Vorexis-Claw AI engineering session")
  .action(async () => {
    await runWakeup();
  });

program
  .command("start")
  .description("Start an interactive session (alias for wakeup)")
  .action(async () => {
    await runSession();
  });

program
  .command("telegram")
  .description("Start the Telegram bot interface")
  .action(async () => {
    await runTelegramMode();
  });

program
  .command("settings")
  .description("Configure voice and other settings")
  .action(async () => {
    await runSettingsFlow();
  });

program
  .command("login")
  .description("Log in to OpenRouter and store your API key")
  .action(async () => {
    const apiKey = await password({
      message: "Enter your OpenRouter API Key:",
      validate: (value) => {
        if (!value || value.trim() === "") {
          return "API Key cannot be empty.";
        }
      },
    });

    if (isCancel(apiKey)) {
      console.log(chalk.yellow("Login cancelled."));
      process.exit(0);
    }

    const key = apiKey.trim();
    saveConfig({
      ...loadConfig(),
      provider: "openrouter",
      apiKey: key,
      openrouterApiKey: key,
    });
    console.log(chalk.green("Success: API Key saved successfully."));
  });

program
  .command("logout")
  .description("Remove credentials and configuration")
  .action(() => {
    deleteConfig();
    console.log(chalk.green("Successfully logged out. Configuration removed."));
  });

program
  .command("whoami")
  .description("Check API key configuration status")
  .action(() => {
    const apiKey = resolveApiKey();
    console.log(`Provider: ${getProvider()}`);
    if (apiKey && apiKey.trim() !== "") {
      console.log("API Key: Configured ✅");
    } else {
      console.log("API Key: Not Configured ❌");
    }
  });

program.option("--help", "Show help");
program.helpOption(false);
program.addHelpCommand(false);

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  printHelp();
  process.exit(0);
}

await program.parseAsync(process.argv);
