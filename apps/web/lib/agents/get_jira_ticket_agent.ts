import { createDeepAgent } from "deepagents";
import { toolStrategy } from "langchain";
import { readFileSync } from "node:fs";
import { z } from "zod";
import { createDeterministicGPT6LunaModel } from "../llm/model.js";
import { GET_JIRA_TICKET_INFO_PROMPT } from "../skill/jira_analysis";
import { jiraInfoGet } from "../tools/jira_info_get";
import { backend, documentSearch } from "../tools/rag_search";

export const jiraTicketGetAgentOutputSchema = z.object({
  problemSummary: z.string().min(1),
  keywords: z.array(z.string().trim().min(1).max(100)).max(8),
  projectName: z.string(),
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

export type JiraTicketGetAgentResult = JiraTicketGetAgentOutput & {
  ticketKey: string;
  originalJiraOutput: Record<string, unknown>;
};

function loadRepositoryNames(): string[] {
  const repositories = JSON.parse(
    readFileSync(new URL("../../config/repos.json", import.meta.url), "utf8"),
  ) as unknown;
  if (
    !Array.isArray(repositories) ||
    !repositories.every((repository) => typeof repository === "string")
  ) {
    throw new JiraTicketAgentError(
      "The configured repository list is invalid.",
    );
  }
  return repositories;
}

const jiraTicketAgent = createDeepAgent({
  name: "analyze_jira_ticket",
  model: createDeterministicGPT6LunaModel(),
  tools: [documentSearch],
  backend,
  systemPrompt: GET_JIRA_TICKET_INFO_PROMPT,
  responseFormat: toolStrategy(jiraTicketGetAgentOutputSchema),
});

export async function runGetJiraTicketAgent(
  ticketKeyInput: string,
): Promise<JiraTicketGetAgentResult> {
  const ticketKey = z
    .string()
    .trim()
    .transform((key) => key.toUpperCase())
    .pipe(z.string().regex(/^(GROUP|PROD)-\d+$/))
    .parse(ticketKeyInput);
  let originalJiraOutput: Record<string, unknown>;
  try {
    const toolOutput = parseOriginalJiraOutput(
      await jiraInfoGet.invoke({ issueKey: ticketKey }),
    );
    originalJiraOutput = asRecord(toolOutput.structuredContent);
    if (!Object.keys(originalJiraOutput).length) {
      originalJiraOutput = parseOriginalJiraOutput(toolOutput.content);
    }
  } catch (error) {
    throw new JiraTicketAgentError(
      error instanceof Error ? error.message : "Jira ticket retrieval failed.",
    );
  }
  if (!Object.keys(originalJiraOutput).length) {
    throw new JiraTicketAgentError(
      "The get_jira_ticket tool returned no ticket details.",
    );
  }

  const repositories = loadRepositoryNames();
  const result = await jiraTicketAgent.invoke(
    {
      messages: [
        {
          role: "user",
          content: JSON.stringify({
            ticketKey,
            ticket: originalJiraOutput,
            allowedProjectNames: repositories,
          }),
        },
      ],
    },
    { recursionLimit: 20 },
  );

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
    ticketKey,
    projectName: repositories.includes(parsed.data.projectName)
      ? parsed.data.projectName
      : "",
    originalJiraOutput,
  };
}
