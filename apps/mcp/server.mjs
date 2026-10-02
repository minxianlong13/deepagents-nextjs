#!/usr/bin/env node

import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { registerJiraTools } from "./tools/jira.mjs";
import { registerWikiTools } from "./tools/wiki.mjs";

// Respect Cloud Run's PORT env var (8080) or fall back to MCP_PORT (local dev), then default to 8787.
const PORT = Number.parseInt(
  process.env.PORT ?? process.env.MCP_PORT ?? "8787",
  10,
);
const HOST = process.env.MCP_HOST ?? "0.0.0.0";
const MCP_PATH = "/mcp";

function createServer() {
  const server = new McpServer({
    name: "deepagents-local-mcp",
    version: "0.1.0",
  });

  registerJiraTools(server);
  registerWikiTools(server);

  return server;
}

const app = createMcpExpressApp({ host: HOST });

app.post(MCP_PATH, async (req, res) => {
  const server = createServer();

  try {
    // Stateless transport keeps HTTP requests simple for local demos.
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);

    res.on("close", () => {
      void transport.close();
      void server.close();
    });
  } catch (error) {
    console.error("Failed to handle MCP request:", error);

    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Internal MCP server error",
        },
        id: null,
      });
    }
  }
});

// Health check endpoint for Cloud Run
app.get("/", (_req, res) => {
  res.status(200).json({ status: "healthy" });
});

app.get(MCP_PATH, (_req, res) => {
  res.writeHead(405).end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed.",
      },
      id: null,
    }),
  );
});

app.delete(MCP_PATH, (_req, res) => {
  res.writeHead(405).end(
    JSON.stringify({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed.",
      },
      id: null,
    }),
  );
});

app.listen(PORT, HOST, (error) => {
  if (error) {
    console.error("Failed to start MCP server:", error);
    process.exit(1);
  }

  console.log(`MCP HTTP server listening at http://${HOST}:${PORT}${MCP_PATH}`);
});
