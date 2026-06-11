#!/usr/bin/env node

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

  const helloResult = await client.callTool({
    name: "hello_mcp",
    arguments: { name: "DeepAgents" },
  });
  console.log("\nhello_mcp result:");
  console.log(JSON.stringify(helloResult, null, 2));

  const sumResult = await client.callTool({
    name: "sum_numbers",
    arguments: { a: 7, b: 11 },
  });
  console.log("\nsum_numbers result:");
  console.log(JSON.stringify(sumResult, null, 2));
} finally {
  await client.close();
}
