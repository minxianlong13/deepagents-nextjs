import { createDeepAgent } from "deepagents";
import { toolStrategy } from "langchain";
import { z } from "zod";
import { createDeterministicClaudeSonnetModel } from "../llm/model.js";
import { SLACK_SEARCH_AGENT_PROMPT } from "../skill/jira_analysis";
import { searchSlackMessages } from "../tools/slack_search_messages";

const slackFindingSchema = z.object({
  channel: z.string().nullable(),
  author: z.string().nullable(),
  time: z.string().nullable(),
  permalink: z.string().nullable(),
  text: z.string(),
  relevance: z.string(),
});

export const slackSearchAgentOutputSchema = z.object({
  keywords: z.array(z.string()).max(5),
  summary: z.string(),
  findings: z.array(slackFindingSchema),
});

export type SlackSearchAgentOutput = z.infer<
  typeof slackSearchAgentOutputSchema
>;

export type SlackSearchAgentResult = SlackSearchAgentOutput & {
  originalSlackOutput: unknown;
};

const slackSearchAgent = createDeepAgent({
  name: "search_slack_messages",
  model: createDeterministicClaudeSonnetModel(),
  tools: [searchSlackMessages],
  systemPrompt: SLACK_SEARCH_AGENT_PROMPT,
  responseFormat: toolStrategy(slackSearchAgentOutputSchema),
});

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function parseOriginalSlackOutput(content: unknown): unknown {
  if (typeof content === "string") {
    try {
      return JSON.parse(content) as unknown;
    } catch {
      return content;
    }
  }
  if (Array.isArray(content)) {
    const text = content
      .map((block) => asRecord(block))
      .filter(
        (block) => block.type === "text" && typeof block.text === "string",
      )
      .map((block) => block.text as string)
      .join("\n");
    return parseOriginalSlackOutput(text);
  }
  return content;
}

export async function runSlackSearchAgent(
  keywordInputs: string[],
): Promise<SlackSearchAgentResult> {
  const keywords = [
    ...new Set(keywordInputs.map((keyword) => keyword.trim()).filter(Boolean)),
  ].slice(0, 5);
  if (keywords.length === 0) {
    throw new Error("Provide one or more keywords for Slack search.");
  }

  const result = await slackSearchAgent.invoke({
    messages: [
      {
        role: "user",
        content: JSON.stringify({ keywords }),
      },
    ],
  });

  const toolCalls = result.messages.flatMap((message) => {
    const calls = asRecord(message).tool_calls;
    return Array.isArray(calls) ? calls.map(asRecord) : [];
  });
  const slackCalls = toolCalls.filter(
    (call) => call.name === "search_slack_messages",
  );
  if (
    toolCalls[0]?.name !== "search_slack_messages" ||
    slackCalls.length !== 1 ||
    JSON.stringify(asRecord(slackCalls[0]?.args).keywords) !==
      JSON.stringify(keywords)
  ) {
    throw new Error(
      "The Slack agent must first search once using the supplied keywords.",
    );
  }

  const toolMessage = result.messages.find(
    (message) =>
      message.getType() === "tool" &&
      (message as { name?: string }).name === "search_slack_messages",
  );
  if (!toolMessage) {
    throw new Error("The Slack agent did not receive search results.");
  }

  const parsed = slackSearchAgentOutputSchema.safeParse(
    result.structuredResponse,
  );
  if (!parsed.success) {
    throw new Error("The Slack agent returned invalid structured output.");
  }

  return {
    ...parsed.data,
    originalSlackOutput: parseOriginalSlackOutput(toolMessage.content),
  };
}
