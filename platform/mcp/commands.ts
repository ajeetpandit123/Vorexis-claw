import chalk from "chalk";
import { select, isCancel } from "@clack/prompts";

import { loadMcpConfig, saveMcpConfig } from "./config.ts";
import { mcpManager } from "./manager.ts";

export async function runMcpList(): Promise<void> {
  const config = loadMcpConfig();
  const connected = new Set(mcpManager.getConnectedServers());

  console.log(chalk.hex("#5b4d9e").bold("\n⚡ MCP Servers\n"));

  const entries = Object.entries(config.servers);
  if (entries.length === 0) {
    console.log(chalk.dim("No MCP servers configured. Edit ~/.vorexis-claw/mcp.json\n"));
    return;
  }

  for (const [name, server] of entries) {
    const status = connected.has(name)
      ? chalk.green("connected")
      : server.enabled
        ? chalk.yellow("enabled")
        : chalk.dim("disabled");
    console.log(`${chalk.bold(name)} — ${status}`);
    console.log(chalk.dim(`  ${server.command} ${(server.args ?? []).join(" ")}`));
  }
  console.log();
}

export async function runMcpConnect(serverName?: string): Promise<void> {
  const config = loadMcpConfig();
  let name = serverName;

  if (!name) {
    const choice = await select({
      message: "Select MCP server to connect:",
      options: Object.keys(config.servers).map((s) => ({ value: s, label: s })),
    });
    if (isCancel(choice)) return;
    name = choice;
  }

  if (!config.servers[name]) {
    console.log(chalk.red(`Unknown MCP server: ${name}`));
    return;
  }

  try {
    await mcpManager.connect(name);
    const tools = mcpManager.getAllTools().filter((t) => t.server === name);
    console.log(chalk.green(`\n✓ Connected to '${name}' (${tools.length} tool(s))\n`));
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(chalk.red(`\nFailed to connect: ${msg}\n`));
  }
}

export async function runMcpDisconnect(serverName?: string): Promise<void> {
  const connected = mcpManager.getConnectedServers();

  if (connected.length === 0) {
    console.log(chalk.dim("No MCP servers connected.\n"));
    return;
  }

  let name = serverName;
  if (!name) {
    const choice = await select({
      message: "Select MCP server to disconnect:",
      options: connected.map((s) => ({ value: s, label: s })),
    });
    if (isCancel(choice)) return;
    name = choice;
  }

  await mcpManager.disconnect(name);
  console.log(chalk.green(`\n✓ Disconnected from '${name}'\n`));
}

export async function runMcpStatus(): Promise<void> {
  const config = loadMcpConfig();
  const connected = mcpManager.getConnectedServers();

  console.log(chalk.hex("#5b4d9e").bold("\n⚡ MCP Status\n"));
  console.log(`Config File : ${chalk.dim("~/.vorexis-claw/mcp.json")}`);
  console.log(`Configured  : ${chalk.white(String(Object.keys(config.servers).length))} server(s)`);
  console.log(`Connected   : ${chalk.white(connected.length > 0 ? connected.join(", ") : "none")}`);

  const tools = mcpManager.getAllTools();
  console.log(`Tools       : ${chalk.white(String(tools.length))} available\n`);
}

export function ensureMcpConfigFile(): void {
  const config = loadMcpConfig();
  saveMcpConfig(config);
}
