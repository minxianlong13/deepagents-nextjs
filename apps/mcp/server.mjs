#!/usr/bin/env node

import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import * as z from "zod/v4";

// Respect Cloud Run's PORT env var (8080) or fall back to MCP_PORT (local dev), then default to 8787.
const PORT = Number.parseInt(
  process.env.PORT ?? process.env.MCP_PORT ?? "8787",
  10,
);
const HOST = process.env.MCP_HOST ?? "0.0.0.0";
const MCP_PATH = "/mcp";
const JIRA_FIELDS = [
  "summary",
  "description",
  "comment",
  "status",
  "priority",
  "assignee",
  "reporter",
  "labels",
  "components",
  "attachment",
  "issuelinks",
  "created",
  "updated",
];

function removeAvatarUrls(value) {
  if (Array.isArray(value)) {
    return value.map(removeAvatarUrls);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => key !== "avatarUrls")
        .map(([key, nestedValue]) => [key, removeAvatarUrls(nestedValue)]),
    );
  }

  return value;
}

function createServer() {
  const server = new McpServer({
    name: "deepagents-local-mcp",
    version: "0.1.0",
  });

  server.registerTool(
    "get_jira_ticket",
    {
      title: "Get Jira Ticket",
      description:
        "Fetch selected fields from a Jira issue using bearer-token authorization.",
      inputSchema: {
        issueKey: z
          .string()
          .regex(/^[A-Z][A-Z0-9]+-\d+$/)
          .describe("Jira issue key, for example GROUP-123445"),
      },
    },
    async ({ issueKey }) => {
      const jiraBaseUrl = process.env.JIRA_BASE_URL?.replace(/\/$/, "");
      const bearerToken = process.env.JIRA_BEARER_TOKEN;

      if (!jiraBaseUrl) {
        throw new Error("JIRA_BASE_URL is not configured");
      }
      if (!bearerToken) {
        throw new Error("JIRA_BEARER_TOKEN is not configured");
      }

      const issueUrl = new URL(
        `/rest/api/2/issue/${encodeURIComponent(issueKey)}`,
        `${jiraBaseUrl}/`,
      );
      issueUrl.searchParams.set("fields", JIRA_FIELDS.join(","));

      const response = await fetch(issueUrl, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${bearerToken}`,
        },
      });

      if (!response.ok) {
        const responseText = await response.text();
        let detail = responseText;
        try {
          const errorBody = JSON.parse(responseText);
          detail = errorBody.errorMessages?.join(" ") || responseText;
        } catch {
          // Keep the plain response text when Jira does not return JSON.
        }
        throw new Error(
          `Jira request failed (${response.status}): ${detail || response.statusText}`,
        );
      }

      const issue = await response.json();
      const result = removeAvatarUrls({
        "ticketNo.": issueKey,
        fields: Object.fromEntries(
          JIRA_FIELDS.map((field) => [field, issue.fields?.[field] ?? null]),
        ),
      });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
        structuredContent: result,
      };
    },
  );

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
