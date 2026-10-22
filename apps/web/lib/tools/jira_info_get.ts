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

export const jiraInfoGet = tool(
  async ({ issueKey }) => {
    const connection = await createMcpClient();
    try {
      const result = await connection.client.callTool({
        name: "get_jira_ticket",
        arguments: { issueKey },
      });
      const resultRecord = asRecord(result);
      if (resultRecord.isError) {
        const details = getTextContent(resultRecord.content);
        throw new Error(details || "Jira ticket retrieval failed.");
      }

      return JSON.stringify(resultRecord);
    } finally {
      await connection.close().catch(() => undefined);
    }
  },
  {
    name: "get_jira_ticket",
    description: "Fetch a Jira issue by its GROUP- or PROD- ticket key.",
    schema: z.object({
      issueKey: z.string().regex(/^(GROUP|PROD)-\d+$/),
    }),
  },
);
