#!/usr/bin/env node

import "dotenv/config";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const serverUrl = process.env.MCP_SERVER_URL ?? "http://127.0.0.1:8787/mcp";

const transport = new StreamableHTTPClientTransport(new URL(serverUrl));

const client = new Client({
  name: "deepagents-mcp-example-client",
  version: "0.1.0",
});

try {
  await client.connect(transport);

  console.log(`Connected to ${serverUrl}`);

  const tools = await client.listTools();
  console.log("Available tools:");
  for (const tool of tools.tools) {
    console.log(`- ${tool.name}: ${tool.description ?? "no description"}`);
  }
} finally {
  await client.close();
}
