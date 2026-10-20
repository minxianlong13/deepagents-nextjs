import * as z from "zod/v4";
import {
  connectToSlackMcp,
  normalizeSlackSearchResult,
} from "../lib/slack.mjs";

const DEFAULT_SLACK_MCP_URL =
  "https://aide-agents.core.cvent.org/api/mcp/slack/mcp";
const SLACK_TOOL_NAME = "slack_search_public_and_private";

const slackSearchInputSchema = {
  query: z.string().optional(),
  channel_types: z.string().optional(),
  content_types: z.string().optional(),
  context_channel_id: z.string().optional(),
  cursor: z.string().optional(),
  limit: z.number().int().min(1).max(1000).optional(),
  after: z.string().optional(),
  before: z.string().optional(),
  include_bots: z.boolean().optional(),
  sort: z.enum(["score", "timestamp"]).optional(),
  sort_dir: z.enum(["asc", "desc"]).optional(),
  response_format: z.enum(["detailed", "concise"]).optional(),
  include_context: z.boolean().optional(),
  max_context_length: z.number().int().positive().optional(),
  only_my_channels: z.boolean().optional(),
  keywords: z.array(z.string()).optional(),
  filters: z.string().optional(),
  natural_language_query: z.string().optional(),
};

export function registerSlackTools(server, redirectUrl) {
  server.registerTool(
    "search_slack_messages",
    {
      title: "Search Slack Messages",
      description:
        "Search public and private Slack messages using the Cvent Slack MCP server.",
      inputSchema: slackSearchInputSchema,
    },
    async (input) => {
      if (
        !input.keywords?.length &&
        !input.filters?.trim() &&
        !input.query?.trim()
      ) {
        throw new Error(
          "Provide a query, at least one search keyword, or a Slack search filter.",
        );
      }

      const slackMcpUrl = process.env.SLACK_MCP_URL ?? DEFAULT_SLACK_MCP_URL;
      const { client, transport } = await connectToSlackMcp(
        slackMcpUrl,
        redirectUrl,
      );

      try {
        const { tools } = await client.listTools();
        const searchTool = tools.find((tool) => tool.name === SLACK_TOOL_NAME);
        if (!searchTool) {
          throw new Error(
            `The configured Slack MCP server does not expose ${SLACK_TOOL_NAME}`,
          );
        }

        const result = await client.callTool({
          name: SLACK_TOOL_NAME,
          arguments: Object.fromEntries(
            Object.entries(input).filter(([, value]) => value !== undefined),
          ),
        });

        if (result.isError) {
          throw new Error(
            result.content
              .filter((item) => item.type === "text")
              .map((item) => item.text)
              .join("\n") || "Slack MCP search failed",
          );
        }

        const normalizedResult = normalizeSlackSearchResult(
          result.content
            .filter((item) => item.type === "text")
            .map((item) => item.text),
          input,
        );

        return {
          content: [{ type: "text", text: JSON.stringify(normalizedResult) }],
          structuredContent: normalizedResult,
        };
      } finally {
        await client.close();
        await transport.close();
      }
    },
  );
}
