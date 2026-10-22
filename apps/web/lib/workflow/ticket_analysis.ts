import { z } from "zod";
import {
  runGetJiraTicketAgent,
  type JiraTicketGetAgentResult,
} from "../agents/get_jira_ticket_agent";
import {
  runSlackSearchAgent,
  type SlackSearchAgentResult,
} from "../agents/slack_search_agent";
import {
  runTicketTechnicalAnalysisAgent,
  type TicketTechnicalAnalysis,
} from "../agents/ticket_analysis_agent";

export const ticketKeySchema = z
  .string()
  .trim()
  .transform((ticketKey) => ticketKey.toUpperCase())
  .pipe(
    z.string().regex(/^(GROUP|PROD)-\d+$/, {
      message: "Enter a Jira ticket key starting with GROUP- or PROD-.",
    }),
  );

type SlackReference = {
  available: boolean;
  keywords: string[];
  summary: string;
  findings: SlackSearchAgentResult["findings"];
  originalSlackOutput: unknown;
};

async function searchSlackReference(
  keywords: string[],
): Promise<SlackReference> {
  if (keywords.length === 0) {
    return {
      available: false,
      keywords,
      summary: "No keywords were available for Slack search.",
      findings: [],
      originalSlackOutput: null,
    };
  }

  try {
    return {
      available: true,
      ...(await runSlackSearchAgent(keywords)),
    };
  } catch {
    return {
      available: false,
      keywords,
      summary: "Slack search could not be completed.",
      findings: [],
      originalSlackOutput: null,
    };
  }
}

export async function runAnalyzeTicketWorkflow(ticketKeyInput: string): Promise<
  JiraTicketGetAgentResult & {
    slackReference: SlackReference;
    finalAnalysis: TicketTechnicalAnalysis;
  }
> {
  // Step 1: fetch Jira and derive a problem summary, keywords, and repo.
  const ticketKey = ticketKeySchema.parse(ticketKeyInput);
  const jiraAnalysis = await runGetJiraTicketAgent(ticketKey);

  // Step 2: use the Jira agent's keywords to gather Slack references.
  const slackReference = await searchSlackReference(jiraAnalysis.keywords);

  // Step 3: analyze Jira, Slack, and retrieved documentation together.
  const finalAnalysis = await runTicketTechnicalAnalysisAgent({
    jira: jiraAnalysis,
    slack: slackReference,
  });

  return { ...jiraAnalysis, slackReference, finalAnalysis };
}
