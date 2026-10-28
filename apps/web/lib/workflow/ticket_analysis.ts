import { z } from "zod";
import { runGetJiraTicketAgent } from "../agents/get_jira_ticket_agent";

export const ticketKeySchema = z
  .string()
  .trim()
  .transform((ticketKey) => ticketKey.toUpperCase())
  .pipe(
    z.string().regex(/^(GROUP|PROD)-\d+$/, {
      message: "Enter a Jira ticket key starting with GROUP- or PROD-.",
    }),
  );

export function runTicketAnalysis(ticketKey: string) {
  return runGetJiraTicketAgent(ticketKeySchema.parse(ticketKey));
}
