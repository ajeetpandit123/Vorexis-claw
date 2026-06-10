import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

import { loadMcpConfig, saveMcpConfig, type McpServerConfig } from "./config.ts";

interface ConnectedServer {
  name: string;
  client: Client;
  transport: StdioClientTransport;
  tools: Tool[];
}

class McpManager {
  private connections = new Map<string, ConnectedServer>();

  async connect(name: string, config?: McpServerConfig): Promise<void> {
    if (this.connections.has(name)) return;

    const mcpConfig = loadMcpConfig();
    const serverConfig = config ?? mcpConfig.servers[name];
    if (!serverConfig) {
      throw new Error(`MCP server '${name}' not found in mcp.json`);
    }

    const transport = new StdioClientTransport({
      command: serverConfig.command,
      args: serverConfig.args ?? [],
      env: { ...process.env, ...serverConfig.env } as Record<string, string>,
    });

    const client = new Client({ name: "vorexis-claw", version: "3.0.0" });
    await client.connect(transport);

    const listed = await client.listTools();
    this.connections.set(name, { name, client, transport, tools: listed.tools });

    mcpConfig.servers[name] = { ...serverConfig, enabled: true, connected: true };
    saveMcpConfig(mcpConfig);
  }

  async disconnect(name: string): Promise<void> {
    const conn = this.connections.get(name);
    if (!conn) return;

    await conn.client.close();
    this.connections.delete(name);

    const mcpConfig = loadMcpConfig();
    if (mcpConfig.servers[name]) {
      mcpConfig.servers[name].connected = false;
      saveMcpConfig(mcpConfig);
    }
  }

  async disconnectAll(): Promise<void> {
    for (const name of [...this.connections.keys()]) {
      await this.disconnect(name);
    }
  }

  getConnectedServers(): string[] {
    return [...this.connections.keys()];
  }

  getAllTools(): Array<{ server: string; tool: Tool }> {
    const result: Array<{ server: string; tool: Tool }> = [];
    for (const [server, conn] of this.connections) {
      for (const t of conn.tools) {
        result.push({ server, tool: t });
      }
    }
    return result;
  }

  async callTool(server: string, toolName: string, args: Record<string, unknown>): Promise<string> {
    const conn = this.connections.get(server);
    if (!conn) {
      throw new Error(`MCP server '${server}' is not connected. Run: vorexis-claw mcp connect ${server}`);
    }

    const result = await conn.client.callTool({ name: toolName, arguments: args });
    const content = result.content;
    if (!Array.isArray(content)) return JSON.stringify(result);

    return content
      .map((c) => {
        if (typeof c === "object" && c !== null && "text" in c) return String((c as { text: string }).text);
        return JSON.stringify(c);
      })
      .join("\n");
  }

  async autoConnectEnabled(): Promise<void> {
    const config = loadMcpConfig();
    for (const [name, server] of Object.entries(config.servers)) {
      if (server.enabled && !this.connections.has(name)) {
        try {
          await this.connect(name, server);
        } catch {
          // Skip unreachable servers at startup
        }
      }
    }
  }
}

export const mcpManager = new McpManager();
