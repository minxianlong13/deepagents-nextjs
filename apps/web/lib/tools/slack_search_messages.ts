import { tool } from "langchain";
import { z } from "zod";
import { createMcpClient } from "../mcp/client";

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function getTextContent(value: unknown): string {
  if (!Array.isArray(value)) return "";
  return value
    .map((item) => asRecord(item))
    .filter((item) => item.type === "text" && typeof item.text === "string")
    .map((item) => item.text as string)
    .join("\n");
}

export const searchSlackMessages = tool(
  async ({ keywords }) => {
    const uniqueKeywords = [
      ...new Set(keywords.map((keyword) => keyword.trim()).filter(Boolean)),
    ];
    if (uniqueKeywords.length === 0) {
      throw new Error("Provide at least one non-empty Slack search keyword.");
    }

    const connection = await createMcpClient();
    try {
      const result = asRecord(
        await connection.client.callTool({
          name: "search_slack_messages",
          arguments: {
            keywords: uniqueKeywords,
            query: uniqueKeywords.join(" "),
            natural_language_query: `Find Slack discussions about ${uniqueKeywords.join(" ")}`,
            limit: 8,
            sort: "score",
            response_format: "detailed",
            include_context: true,
            max_context_length: 1000,
            include_bots: false,
          },
        }),
      );

      if (result.isError === true) {
        throw new Error(
          getTextContent(result.content) || "Slack search failed.",
        );
      }

      return JSON.stringify(result.structuredContent ?? result.content);
    } finally {
      await connection.close().catch(() => undefined);
    }
  },
  {
    name: "search_slack_messages",
    description:
      "Search Slack using a short list of ticket-related keywords or technical phrases.",
    schema: z.object({
      keywords: z.array(z.string().trim().min(1)).min(1).max(5),
    }),
  },
);
