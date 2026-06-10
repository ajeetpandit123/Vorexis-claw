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
import { runGitHubLogin, runGitHubLogout, runGitHubStatus } from "./platform/github/commands.ts";
import { runMcpList, runMcpConnect, runMcpDisconnect, runMcpStatus, ensureMcpConfigFile } from "./platform/mcp/commands.ts";
import { runProviderList, runProviderSet, runProviderStatus } from "./platform/providers/commands.ts";
import { runDoctor } from "./platform/doctor.ts";

ensureConfigDir();
ensureMcpConfigFile();

const program = new Command();

program
  .name("vorexis-claw")
  .description("AI Engineering Platform — single-prompt interface")
  .version("3.0.0");

program
  .command("wakeup", { isDefault: true })
  .description("Start the Vorexis-Claw AI engineering session")
  .action(async () => {
    await runWakeup();
  });

program.command("start").description("Start session (alias)").action(async () => {
  await runSession();
});

program.command("telegram").description("Start Telegram bot").action(async () => {
  await runTelegramMode();
});

program.command("settings").description("Configure voice and settings").action(async () => {
  await runSettingsFlow();
});

program.command("doctor").description("Run platform health checks").action(async () => {
  await runDoctor();
});

const github = program.command("github").description("GitHub integration");

github.command("login").description("Store GitHub Personal Access Token").action(runGitHubLogin);
github.command("logout").description("Remove GitHub token").action(runGitHubLogout);
github.command("status").description("Show GitHub auth status").action(runGitHubStatus);

const mcp = program.command("mcp").description("MCP server management");

mcp.command("list").description("List configured MCP servers").action(runMcpList);
mcp.command("connect [name]").description("Connect an MCP server").action(runMcpConnect);
mcp.command("disconnect [name]").description("Disconnect an MCP server").action(runMcpDisconnect);
mcp.command("status").description("Show MCP connection status").action(runMcpStatus);

const provider = program.command("provider").description("Model provider management");

provider.command("list").description("List available providers").action(runProviderList);
provider.command("set [name]").description("Set active provider").action(runProviderSet);
provider.command("status").description("Show provider status").action(runProviderStatus);

program.command("login").description("Log in to OpenRouter").action(async () => {
  const apiKey = await password({
    message: "Enter your OpenRouter API Key:",
    validate: (value) => (!value?.trim() ? "API Key cannot be empty." : undefined),
  });

  if (isCancel(apiKey)) {
    console.log(chalk.yellow("Login cancelled."));
    process.exit(0);
  }

  const key = apiKey.trim();
  saveConfig({
    ...loadConfig(),
    provider: "openrouter",
    modelProvider: "openrouter",
    apiKey: key,
    openrouterApiKey: key,
  });
  console.log(chalk.green("Success: API Key saved successfully."));
});

program.command("logout").description("Remove credentials").action(() => {
  deleteConfig();
  console.log(chalk.green("Successfully logged out. Configuration removed."));
});

program.command("whoami").description("Check API key status").action(() => {
  const apiKey = resolveApiKey();
  console.log(`Provider: ${getProvider()}`);
  console.log(`API Key: ${apiKey?.trim() ? "Configured ✅" : "Not Configured ❌"}`);
});

program.option("--help", "Show help");
program.helpOption(false);
program.addHelpCommand(false);

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  printHelp();
  process.exit(0);
}

await program.parseAsync(process.argv);
