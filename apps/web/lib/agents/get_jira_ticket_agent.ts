import { createDeepAgent } from "deepagents";
import { toolStrategy } from "langchain";
import { readFileSync } from "node:fs";
import { z } from "zod";
import { createDeterministicGPT6LunaModel } from "../llm/model.js";
import { GET_JIRA_TICKET_INFO_PROMPT } from "../skill/jira_analysis";
import { jiraInfoGet } from "../tools/jira_info_get";

export const jiraTicketGetAgentOutputSchema = z.object({
  problemSummary: z.string().min(1),
  keywords: z.array(z.string().min(1)).max(5),
  repo: z.string().nullable(),
});

export type JiraTicketGetAgentOutput = z.infer<
  typeof jiraTicketGetAgentOutputSchema
>;

export class JiraTicketAgentError extends Error {
  readonly source = "get_jira_ticket";

  constructor(message: string) {
    super(message);
    this.name = "JiraTicketAgentError";
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function parseOriginalJiraOutput(content: unknown): Record<string, unknown> {
  if (typeof content === "string") {
    try {
      return asRecord(JSON.parse(content));
    } catch {
      throw new JiraTicketAgentError(
        "The get_jira_ticket tool response was not valid JSON.",
      );
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
    return parseOriginalJiraOutput(text);
  }
  return asRecord(content);
}

function loadRepositoryNames(): string[] {
  const repositories = JSON.parse(
    readFileSync(new URL("../../config/repos.json", import.meta.url), "utf8"),
  ) as unknown;
  if (
    !Array.isArray(repositories) ||
    !repositories.every((repository) => typeof repository === "string")
  ) {
    throw new Error(
      "config/repos.json must contain an array of repository names.",
    );
  }
  return repositories;
}

export type JiraTicketGetAgentResult = JiraTicketGetAgentOutput & {
  originalJiraOutput: Record<string, unknown>;
};

export async function runGetJiraTicketAgent(
  ticketKeyInput: string,
): Promise<JiraTicketGetAgentResult> {
  const ticketKey = z
    .string()
    .trim()
    .transform((key) => key.toUpperCase())
    .pipe(z.string().regex(/^(GROUP|PROD)-\d+$/))
    .parse(ticketKeyInput);
  const repositories = loadRepositoryNames();
  const agent = createDeepAgent({
    name: "get_jira_ticket",
    model: createDeterministicGPT6LunaModel(),
    tools: [jiraInfoGet],
    systemPrompt: GET_JIRA_TICKET_INFO_PROMPT,
    responseFormat: toolStrategy(jiraTicketGetAgentOutputSchema),
  });
  const result = await agent.invoke({
    messages: [
      {
        role: "user",
        content: JSON.stringify({ ticketKey, repositories }),
      },
    ],
  });

  const toolCalls = result.messages.flatMap((message) => {
    const calls = asRecord(message).tool_calls;
    return Array.isArray(calls) ? calls.map(asRecord) : [];
  });
  const jiraCalls = toolCalls.filter((call) => call.name === "get_jira_ticket");
  if (
    toolCalls[0]?.name !== "get_jira_ticket" ||
    jiraCalls.length !== 1 ||
    asRecord(jiraCalls[0]?.args).issueKey !== ticketKey
  ) {
    throw new JiraTicketAgentError(
      "The Jira agent must first call get_jira_ticket exactly once with the requested ticket key.",
    );
  }

  const jiraToolMessage = result.messages.find(
    (message) =>
      message.getType() === "tool" &&
      (message as { name?: string }).name === "get_jira_ticket",
  );
  if (!jiraToolMessage) {
    throw new JiraTicketAgentError(
      "The Jira agent did not receive a get_jira_ticket result.",
    );
  }
  const originalJiraOutput = parseOriginalJiraOutput(jiraToolMessage.content);

  const parsed = jiraTicketGetAgentOutputSchema.safeParse(
    result.structuredResponse,
  );
  if (!parsed.success) {
    throw new Error(
      "The Jira ticket agent returned invalid structured output.",
    );
  }

  return {
    ...parsed.data,
    originalJiraOutput,
    repo: repositories.includes(parsed.data.repo ?? "")
      ? parsed.data.repo
      : null,
  };
}
