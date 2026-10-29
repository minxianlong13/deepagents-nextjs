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

export const searchSlackMessages = tool(
  async ({ keywords }) => {
    const connection = await createMcpClient();
    try {
      const result = await connection.client.callTool({
        name: "search_slack_messages",
        arguments: { keywords, query: keywords.join(" ") },
      });
      const resultRecord = asRecord(result);
      if (resultRecord.isError) {
        throw new Error(
          getTextContent(resultRecord.content) || "Slack search failed.",
        );
      }
      return JSON.stringify(resultRecord);
    } finally {
      await connection.close().catch(() => undefined);
    }
  },
  {
    name: "search_slack_messages",
    description: "Search Slack messages using a short list of keywords.",
    schema: z.object({
      keywords: z.array(z.string().trim().min(1)).min(1).max(5),
    }),
  },
);
