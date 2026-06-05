#!/usr/bin/env bun

import { Command } from "commander";
import { runWakeup } from "./tui/wakeup";
import { ensureConfigDir, loadConfig, saveConfig, deleteConfig } from "./config/config.ts";
import { password, isCancel } from "@clack/prompts";
import chalk from "chalk";

ensureConfigDir();

const program = new Command();

program
  .name("vorexis-claw")
  .description("A self-evolving intelligent core that controls and connects everything.")
  .version("1.0.0");

program
  .command("wakeup")
  .description("A self-evolving command intelligence that awakens systems, binds workflows, and turns intent into execution.")
  .action(async () => {
    await runWakeup();
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
      }
    });

    if (isCancel(apiKey)) {
      console.log(chalk.yellow("Login cancelled."));
      process.exit(0);
    }

    saveConfig({ openrouterApiKey: apiKey.trim() });
    console.log(chalk.green("Success: API Key saved successfully."));
  });

program
  .command("logout")
  .description("Remove OpenRouter API key and configuration")
  .action(() => {
    deleteConfig();
    console.log(chalk.green("Successfully logged out. Configuration removed."));
  });

program
  .command("whoami")
  .description("Check OpenRouter API key configuration status")
  .action(() => {
    const apiKey = process.env.OPENROUTER_API_KEY ?? loadConfig().openrouterApiKey;
    if (apiKey && apiKey.trim() !== "") {
      console.log("Configured ✅");
    } else {
      console.log("Not Configured ❌");
    }
  });

await program.parseAsync(process.argv);

