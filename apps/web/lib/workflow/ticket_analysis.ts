import { z } from "zod";
import {
  runGetJiraTicketAgent,
  jiraTicketGetAgentOutputSchema,
  type JiraTicketGetAgentResult,
} from "../agents/get_jira_ticket_agent";
import {
  runSlackSearchAgent,
  slackSearchAgentOutputSchema,
  type SlackSearchAgentResult,
} from "../agents/slack_search_agent";
import {
  runTicketTechnicalAnalysisAgent,
  type TicketTechnicalAnalysis,
} from "../agents/ticket_analysis_agent";
import {
  ticketContractSchema,
  runTicketContractAgent,
  type TicketContract,
} from "../agents/ticket_contract_agent";

export const ticketKeySchema = z
  .string()
  .trim()
  .transform((ticketKey) => ticketKey.toUpperCase())
  .pipe(
    z.string().regex(/^(GROUP|PROD)-\d+$/, {
      message: "Enter a Jira ticket key starting with GROUP- or PROD-.",
    }),
  );

export const ticketAnalysisStepSchema = z.enum([
  "jira",
  "contract",
  "slack",
  "analysis",
]);

export type TicketAnalysisStep = z.infer<typeof ticketAnalysisStepSchema>;

export type SlackReference = {
  available: boolean;
  keywords: string[];
  summary: string;
  findings: SlackSearchAgentResult["findings"];
  originalSlackOutput: unknown;
};

const jiraTicketGetAgentResultSchema = jiraTicketGetAgentOutputSchema.extend({
  originalJiraOutput: z.record(z.unknown()),
});

const slackReferenceSchema = z.object({
  available: z.boolean(),
  keywords: z.array(z.string()),
  summary: z.string(),
  findings: slackSearchAgentOutputSchema.shape.findings,
  originalSlackOutput: z.any(),
});

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

function parseJiraResult(value: unknown): JiraTicketGetAgentResult {
  const parsed = jiraTicketGetAgentResultSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error("The Jira result is invalid or incomplete for this step.");
  }
  return parsed.data;
}

function parseTicketContract(value: unknown): TicketContract {
  const parsed = ticketContractSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error(
      "The ticket contract is invalid or incomplete for this step.",
    );
  }
  return parsed.data;
}

function parseSlackReference(value: unknown): SlackReference {
  const parsed = slackReferenceSchema.safeParse(value);
  if (!parsed.success) {
    throw new Error(
      "The Slack reference is invalid or incomplete for this step.",
    );
  }
  return {
    ...parsed.data,
    originalSlackOutput: parsed.data.originalSlackOutput ?? null,
  };
}

export async function runAnalyzeTicketStep(input: {
  step: TicketAnalysisStep;
  ticketKey?: string;
  jira?: unknown;
  ticketContract?: unknown;
  slackReference?: unknown;
}): Promise<
  | JiraTicketGetAgentResult
  | TicketContract
  | SlackReference
  | TicketTechnicalAnalysis
> {
  switch (input.step) {
    case "jira":
      if (!input.ticketKey) {
        throw new Error("A Jira ticket key is required for the Jira step.");
      }
      return runGetJiraTicketAgent(ticketKeySchema.parse(input.ticketKey));
    case "contract":
      return runTicketContractAgent(parseJiraResult(input.jira));
    case "slack":
      return searchSlackReference(parseJiraResult(input.jira).keywords);
    case "analysis":
      return runTicketTechnicalAnalysisAgent({
        jira: parseJiraResult(input.jira),
        contract: parseTicketContract(input.ticketContract),
        slack: parseSlackReference(input.slackReference),
      });
  }
}
