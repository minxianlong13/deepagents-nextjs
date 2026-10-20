#!/usr/bin/env node

import "dotenv/config";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const serverUrl = process.env.MCP_SERVER_URL ?? "http://127.0.0.1:8787/mcp";
const toolAliases = {
  jira: "get_jira_ticket",
  get_jira_ticket: "get_jira_ticket",
  wiki: "get_wiki_content",
  get_wiki_content: "get_wiki_content",
  slack: "search_slack_messages",
  search_slack_messages: "search_slack_messages",
  webpage: "ingest_webpage",
  ingest_webpage: "ingest_webpage",
};

function printUsage() {
  console.log(`Usage:
  pnpm test list
  pnpm test <tool> [arguments]

Tools and examples:
  jira [issueKey]       pnpm test jira GROUP-132015
  wiki [contentId]      pnpm test wiki 1106609325
  slack <keywords...>   pnpm test slack XSS acknowledgement email
  webpage [url]         pnpm test webpage https://example.com/article

You can also pass a JSON object matching the selected tool's input schema:
  pnpm test get_jira_ticket '{"issueKey":"GROUP-132015"}'
  pnpm test get_wiki_content '{"contentId":"1106609325"}'
  pnpm test search_slack_messages '{"keywords":["XSS"]}'
  pnpm test ingest_webpage '{"url":"https://example.com/article"}'`);
}

function parseToolArguments(toolName, suppliedArguments) {
  if (suppliedArguments.length === 0) {
    if (toolName === "get_jira_ticket") {
      return { issueKey: process.env.JIRA_ISSUE_KEY ?? "GROUP-132015" };
    }
    if (toolName === "get_wiki_content") {
      return { contentId: process.env.WIKI_CONTENT_ID ?? "1106609325" };
    }
    if (toolName === "ingest_webpage") {
      const url = process.env.WEBPAGE_URL;
      if (!url) {
        throw new Error(
          "Webpage ingestion requires a URL argument or WEBPAGE_URL.",
        );
      }
      return { url };
    }
    throw new Error(
      "Slack search requires keywords or filters. Pass JSON arguments or one or more keywords.",
    );
  }

  if (suppliedArguments.length === 1 && suppliedArguments[0].startsWith("{")) {
    const parsed = JSON.parse(suppliedArguments[0]);
    if (!parsed || Array.isArray(parsed) || typeof parsed !== "object") {
      throw new Error("Tool arguments must be a JSON object.");
    }
    return parsed;
  }

  if (toolName === "get_jira_ticket") {
    if (suppliedArguments.length !== 1) {
      throw new Error("Jira accepts one positional argument: issueKey.");
    }
    return { issueKey: suppliedArguments[0] };
  }

  if (toolName === "get_wiki_content") {
    if (suppliedArguments.length !== 1) {
      throw new Error("Wiki accepts one positional argument: contentId.");
    }
    return { contentId: suppliedArguments[0] };
  }

  if (toolName === "ingest_webpage") {
    if (suppliedArguments.length !== 1) {
      throw new Error(
        "Webpage ingestion accepts one positional argument: url.",
      );
    }
    return { url: suppliedArguments[0] };
  }

  return {
    keywords: suppliedArguments,
    natural_language_query: suppliedArguments.join(" "),
  };
}

const [selection, ...suppliedArguments] = process.argv.slice(2);

if (
  !selection ||
  selection === "help" ||
  selection === "--help" ||
  selection === "-h"
) {
  printUsage();
  process.exit(selection ? 0 : 1);
}

const client = new Client({
  name: "deepagents-mcp-local-client",
  version: "0.1.0",
});
const transport = new StreamableHTTPClientTransport(new URL(serverUrl));

try {
  await client.connect(transport);
  console.log(`Connected to ${serverUrl}`);

  const { tools } = await client.listTools();
  if (selection === "list") {
    console.log("Available tools:");
    for (const tool of tools) {
      console.log(`- ${tool.name}: ${tool.description ?? "no description"}`);
    }
  } else {
    const toolName = toolAliases[selection];
    if (!toolName) {
      throw new Error(`Unknown tool selector '${selection}'.`);
    }

    const tool = tools.find(({ name }) => name === toolName);
    if (!tool) {
      throw new Error(`Server does not expose the '${toolName}' tool.`);
    }

    const args = parseToolArguments(toolName, suppliedArguments);
    console.log(`Calling ${toolName} with ${JSON.stringify(args)}`);

    const result = await client.callTool({ name: toolName, arguments: args });
    if (result.isError) {
      throw new Error(
        result.content
          .filter((item) => item.type === "text")
          .map((item) => item.text)
          .join("\n") || `${toolName} failed`,
      );
    }

    if (toolName === "ingest_webpage") {
      const markdown = result.content
        .filter((item) => item.type === "text")
        .map((item) => item.text)
        .join("\n");
      console.log(markdown || result.structuredContent?.markdown || "");
    } else if (
      ["get_jira_ticket", "get_wiki_content", "search_slack_messages"].includes(
        toolName,
      ) &&
      result.structuredContent
    ) {
      console.log(JSON.stringify(result.structuredContent, null, 2));
    } else {
      console.log(result);
    }
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await client.close().catch(() => {});
  await transport.close().catch(() => {});
}
