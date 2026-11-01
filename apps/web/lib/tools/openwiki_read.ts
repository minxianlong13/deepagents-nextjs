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

export const openWikiRead = tool(
  async ({ repo, page, sections, wiki }) => {
    const connection = await createMcpClient();
    try {
      const result = await connection.client.callTool({
        name: "read_openwiki",
        arguments: {
          repo,
          page,
          sections,
          ...(wiki !== undefined ? { wiki } : {}),
        },
      });
      const resultRecord = asRecord(result);
      if (resultRecord.isError) {
        throw new Error(
          getTextContent(resultRecord.content) || "OpenWiki read failed.",
        );
      }
      return JSON.stringify(resultRecord);
    } finally {
      await connection.close().catch(() => undefined);
    }
  },
  {
    name: "openwiki_read",
    description:
      "Read OpenWiki sections. Parameters: repo, page, exact section anchors, and optional wiki ID.",
    schema: z.object({
      repo: z.string().trim().min(1).max(100),
      page: z.string().trim().min(1).max(1000),
      sections: z.array(z.string().trim().min(1).max(500)).min(1).max(20),
      wiki: z.string().trim().min(1).max(64).optional(),
    }),
  },
);
