import { homedir } from "node:os";
import path from "node:path";
import fs from "node:fs";

import { ensureConfigDir } from "../../config/config.ts";

export interface McpServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
  enabled?: boolean;
  connected?: boolean;
}

export interface McpConfig {
  servers: Record<string, McpServerConfig>;
}

const DEFAULT_MCP: McpConfig = {
  servers: {
    filesystem: {
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", process.cwd()],
      enabled: false,
    },
  },
};

export function getMcpConfigPath(): string {
  return path.join(homedir(), ".vorexis-claw", "mcp.json");
}

export function loadMcpConfig(): McpConfig {
  const configPath = getMcpConfigPath();
  if (!fs.existsSync(configPath)) {
    return structuredClone(DEFAULT_MCP);
  }
  try {
    const data = JSON.parse(fs.readFileSync(configPath, "utf-8")) as McpConfig;
    return { servers: { ...DEFAULT_MCP.servers, ...data.servers } };
  } catch {
    return structuredClone(DEFAULT_MCP);
  }
}

export function saveMcpConfig(config: McpConfig): void {
  ensureConfigDir();
  fs.writeFileSync(getMcpConfigPath(), JSON.stringify(config, null, 2), "utf-8");
}
