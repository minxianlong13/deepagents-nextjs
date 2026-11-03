import { tool } from "langchain";
import { z } from "zod";
import { createMcpClient } from "../mcp/client";

function asRecord(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function getTextContent(value: unknown): string {
  if (!Array.isArray(value)) return "";
  return value
    .map(asRecord)
    .filter((item) => item.type === "text" && typeof item.text === "string")
    .map((item) => item.text as string)
    .join("\n");
}

export const openWikiSearch = tool(
  async ({ repo, query, workspace, paths, limit }) => {
    const connection = await createMcpClient();
    try {
      const toolArguments = {
        repo,
        query,
        ...(workspace !== undefined ? { workspace } : {}),
        ...(paths !== undefined ? { paths } : {}),
        ...(limit !== undefined ? { limit } : {}),
      };
      console.log(
        "query_openwiki arguments:",
        JSON.stringify(toolArguments, null, 2),
      );
      const result = await connection.client.callTool({
        name: "query_openwiki",
        arguments: toolArguments,
      });
      const resultRecord = asRecord(result);
      if (resultRecord.isError) {
        throw new Error(
          getTextContent(resultRecord.content) || "OpenWiki search failed.",
        );
      }
      return JSON.stringify(resultRecord);
    } finally {
      await connection.close().catch(() => undefined);
    }
  },
  {
    name: "openwiki_search",
    description:
      "Search OpenWiki and automatically read matching sections. Returns references, detailed reads, and read errors. Parameters: repo, query, workspace, optional repository-relative paths, and optional result limit.",
    schema: z.object({
      repo: z.string().trim().min(1).max(100),
      query: z.string().trim().min(1).max(2000),
      workspace: z.string().trim().min(1).max(80).optional(),
      paths: z.array(z.string().trim().min(1).max(500)).max(20).optional(),
      limit: z.number().int().min(1).max(20).optional(),
    }),
  },
);
