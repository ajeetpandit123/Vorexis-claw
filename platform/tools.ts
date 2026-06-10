import { createGitHubTools } from "./github/tools.ts";
import { createMcpTools } from "./mcp/tools.ts";
import { hasGitHubAuth } from "./github/service.ts";
import { mcpManager } from "./mcp/manager.ts";

export async function createPlatformTools(): Promise<Record<string, unknown>> {
  await mcpManager.autoConnectEnabled();

  const tools: Record<string, unknown> = {};

  if (hasGitHubAuth()) {
    Object.assign(tools, createGitHubTools());
  }

  Object.assign(tools, createMcpTools());

  return tools;
}

export function getPlatformToolSummary(): string {
  const parts: string[] = [];
  if (hasGitHubAuth()) parts.push("GitHub API");
  const mcp = mcpManager.getConnectedServers();
  if (mcp.length > 0) parts.push(`MCP (${mcp.join(", ")})`);
  return parts.length > 0 ? parts.join(", ") : "none (configure GitHub or MCP)";
}
