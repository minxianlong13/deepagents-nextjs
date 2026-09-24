#!/usr/bin/env node

import "dotenv/config";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
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
const DEFAULT_WIKI_BASE_URL = "https://wiki.cvent.com";
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

function getWikiAuthHeaders() {
  const authType = (process.env.WIKI_AUTH_TYPE ?? "bearer").toLowerCase();

  if (authType === "bearer") {
    const token = process.env.WIKI_BEARER_TOKEN;
    if (!token) {
      throw new Error("WIKI_BEARER_TOKEN is not configured");
    }

    return { Authorization: `Bearer ${token}` };
  }

  if (authType === "basic") {
    const username = process.env.WIKI_USERNAME;
    const password = process.env.WIKI_PASSWORD;
    if (!username || !password) {
      throw new Error(
        "WIKI_USERNAME and WIKI_PASSWORD are required when WIKI_AUTH_TYPE=basic",
      );
    }

    const encodedCredentials = Buffer.from(`${username}:${password}`).toString(
      "base64",
    );
    return { Authorization: `Basic ${encodedCredentials}` };
  }

  throw new Error(
    `Unsupported WIKI_AUTH_TYPE '${authType}'. Use 'bearer' or 'basic'.`,
  );
}

async function fetchWikiJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...getWikiAuthHeaders(),
    },
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(
      `Wiki request failed (${response.status}) for ${url.pathname}: ${
        responseText || response.statusText
      }`,
    );
  }

  return response.json();
}

async function getWikiChildPageIds(wikiBaseUrl, parentContentId) {
  const childPageIds = [];
  let start = 0;

  while (true) {
    const childrenUrl = new URL(
      `/rest/api/content/${encodeURIComponent(parentContentId)}/child/page`,
      `${wikiBaseUrl}/`,
    );
    childrenUrl.searchParams.set("limit", "100");
    childrenUrl.searchParams.set("start", String(start));

    const children = await fetchWikiJson(childrenUrl);
    const results = Array.isArray(children.results) ? children.results : [];
    childPageIds.push(
      ...results
        .map((page) => page?.id)
        .filter((id) => typeof id === "string" && /^\d+$/.test(id)),
    );

    const nextPage = children._links?.next;
    if (nextPage) {
      const nextUrl = new URL(nextPage, `${wikiBaseUrl}/`);
      start = Number.parseInt(nextUrl.searchParams.get("start") ?? "0", 10);
      if (!Number.isFinite(start)) {
        break;
      }
      continue;
    }

    if (results.length < 100) {
      break;
    }
    start += results.length;
  }

  return [...new Set(childPageIds)];
}

function getWikiContentUrl(wikiBaseUrl, contentId) {
  const contentUrl = new URL(
    `/rest/api/content/${encodeURIComponent(contentId)}`,
    `${wikiBaseUrl}/`,
  );
  contentUrl.searchParams.set(
    "expand",
    "body.storage,version,space,ancestors",
  );
  return contentUrl;
}

async function fetchWikiPage(wikiBaseUrl, contentId) {
  const wikiContent = await fetchWikiJson(
    getWikiContentUrl(wikiBaseUrl, contentId),
  );
  const content = wikiContent.body?.storage?.value;
  if (typeof content !== "string") {
    throw new Error(
      `Wiki response for content ${contentId} did not contain body.storage.value`,
    );
  }

  return {
    contentId,
    title: wikiContent.title ?? contentId,
    content,
  };
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

  server.registerTool(
    "get_wiki_content",
    {
      title: "Get Wiki Content",
      description:
        "Fetch all child Confluence pages by parent ID, retrieve their storage content, and export each page to a Markdown file.",
      inputSchema: {
        contentId: z
          .string()
          .regex(/^\d+$/)
          .describe("Confluence content ID, for example 65655871"),
      },
    },
    async ({ contentId }) => {
      const wikiBaseUrl = (
        process.env.WIKI_BASE_URL ?? DEFAULT_WIKI_BASE_URL
      ).replace(/\/$/, "");
      const parentPage = await fetchWikiPage(wikiBaseUrl, contentId);
      const childPageIds = await getWikiChildPageIds(wikiBaseUrl, contentId);
      const childPages = await Promise.all(
        childPageIds.map(async (childPageId) => {
          return fetchWikiPage(wikiBaseUrl, childPageId);
        }),
      );
      const pages = [parentPage, ...childPages];

      const outputDirectory = process.env.WIKI_OUTPUT_DIR ?? process.cwd();
      await mkdir(outputDirectory, { recursive: true });
      const files = await Promise.all(
        pages.map(async (page) => {
          const outputPath = join(
            outputDirectory,
            `wiki-${page.contentId}.md`,
          );
          await writeFile(outputPath, page.content, "utf8");
          return {
            contentId: page.contentId,
            title: page.title,
            filePath: outputPath,
          };
        }),
      );
      const combinedContent = pages
        .map((page) => `<!-- ${page.title} (${page.contentId}) -->\n${page.content}`)
        .join("\n\n");

      return {
        content: [
          {
            type: "text",
            text: combinedContent,
          },
        ],
        structuredContent: {
          parentContentId: contentId,
          childPageIds,
          files,
        },
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
