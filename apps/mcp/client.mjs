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

  const issueKey = process.env.JIRA_ISSUE_KEY ?? "GROUP-110376";
  console.log(`\nCalling get_jira_ticket with issueKey=${issueKey}`);
  const result = await client.callTool({
    name: "get_jira_ticket",
    arguments: { issueKey },
  });
  console.log("Result:");
  for (const content of result.content) {
    console.log(content.type === "text" ? content.text : content);
  }
} finally {
  await client.close();
}
