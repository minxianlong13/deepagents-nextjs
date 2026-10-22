import { z } from "zod";
import {
  runGetJiraTicketAgent,
  type JiraTicketGetAgentResult,
} from "../agents/get_jira_ticket_agents";

export const ticketKeySchema = z
  .string()
  .trim()
  .transform((ticketKey) => ticketKey.toUpperCase())
  .pipe(
    z.string().regex(/^(GROUP|PROD)-\d+$/, {
      message: "Enter a Jira ticket key starting with GROUP- or PROD-.",
    }),
  );

export async function runAnalyzeTicketWorkflow(
  ticketKeyInput: string,
): Promise<JiraTicketGetAgentResult> {
  // Step 1: The Jira agent fetches the ticket and returns its analysis.
  const ticketKey = ticketKeySchema.parse(ticketKeyInput);
  return runGetJiraTicketAgent(ticketKey);
}
