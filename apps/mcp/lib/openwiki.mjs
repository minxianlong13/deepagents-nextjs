import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

export async function callOpenWikiTool(name, args) {
  if (!["openwiki_search", "openwiki_read"].includes(name)) {
    throw new Error("Only OpenWiki search and read operations are supported.");
  }

  const host = process.env.OPENWIKI_MCP_HOST ?? "aoe-rag-server";
  if (!/^[a-z][a-z0-9-]*$/.test(host)) {
    throw new Error("OPENWIKI_MCP_HOST must be a lowercase host identifier.");
  }

  const transport = new StdioClientTransport({
    command: process.env.OPENWIKI_COMMAND ?? "openwiki",
    args: ["mcp", "--host", host],
    stderr: "inherit",
  });
  const client = new Client({
    name: "deepagents-openwiki-client",
    version: "0.1.0",
  });

  try {
    await client.connect(transport);
    const { tools } = await client.listTools();
    if (!tools.some((tool) => tool.name === name)) {
      throw new Error(
        `The installed OpenWiki MCP server does not expose ${name}. Install a version with retrieval tools.`,
      );
    }

    return await client.callTool({ name, arguments: args });
  } finally {
    await client.close().catch(() => {});
    await transport.close().catch(() => {});
  }
}
