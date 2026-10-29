import { z } from "zod";
import { jiraInfoGet } from "../tools/jira_info_get";

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

export type JiraTicketDetails = {
  ticketKey: string;
  originalJiraOutput: Record<string, unknown>;
};

export async function runGetJiraTicketAgent(
  ticketKeyInput: string,
): Promise<JiraTicketDetails> {
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

  return { ticketKey, originalJiraOutput };
}
