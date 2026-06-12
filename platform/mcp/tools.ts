import { tool } from "ai";
import { z } from "zod";

import { mcpManager } from "./manager.ts";

export function createMcpTools() {
  const mcpTools: Record<string, unknown> = {};

  const registered = mcpManager.getAllTools();

  for (const { server, tool: mcpTool } of registered) {
    const toolName = `mcp_${server}_${mcpTool.name}`.replace(/[^a-zA-Z0-9_]/g, "_");

    const properties: Record<string, { type: string; description?: string }> = {};
    const required: string[] = [];

    const schema = mcpTool.inputSchema as {
      properties?: Record<string, { type?: string; description?: string }>;
      required?: string[];
    } | undefined;

    if (schema?.properties) {
      for (const [key, prop] of Object.entries(schema.properties)) {
        properties[key] = { type: prop.type ?? "string", description: prop.description };
        if (schema.required?.includes(key)) required.push(key);
      }
    }

    const zodShape: Record<string, z.ZodTypeAny> = {};
    for (const [key, prop] of Object.entries(properties)) {
      zodShape[key] = z.string().describe(prop.description ?? key);
    }

    mcpTools[toolName] = tool({
      description: `[MCP:${server}] ${mcpTool.description ?? mcpTool.name}`,
      inputSchema: z.object(zodShape),
      execute: async (args: Record<string, unknown>) => mcpManager.callTool(server, mcpTool.name, args),
    });
  }

  if (Object.keys(mcpTools).length === 0) {
    mcpTools.mcp_status = tool({
      description: "Check which MCP servers are connected and available.",
      inputSchema: z.object({}),
      execute: async () => {
        const servers = mcpManager.getConnectedServers();
        if (servers.length === 0) {
          return "No MCP servers connected. Configure ~/.vorexis-claw/mcp.json and run: vorexis-claw mcp connect <name>";
        }
        return `Connected MCP servers: ${servers.join(", ")}`;
      },
    });
  }

  return mcpTools;
}
