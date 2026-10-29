import { JiraTicketAgentError } from "@/lib/agents/get_jira_ticket_agent";
import { JiraTicketAnalysisError } from "@/lib/agents/analysis_jira_ticket_agent";
import {
  runTicketAnalysis,
  ticketKeySchema,
} from "@/lib/workflow/ticket_analysis";
import { NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({ ticketKey: z.string() });

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "A valid JSON request is required." },
      { status: 400 },
    );
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "A Jira ticket key is required." },
      { status: 400 },
    );
  }

  const ticketKey = ticketKeySchema.safeParse(parsed.data.ticketKey);
  if (!ticketKey.success) {
    return NextResponse.json(
      {
        error: ticketKey.error.issues[0]?.message ?? "Invalid Jira ticket key.",
      },
      { status: 400 },
    );
  }

  try {
    const result = await runTicketAnalysis(ticketKey.data);
    return NextResponse.json({ ticketKey: ticketKey.data, result });
  } catch (error) {
    if (error instanceof JiraTicketAgentError) {
      const notFound = /\(404\)/.test(error.message);
      return NextResponse.json(
        {
          error: notFound
            ? "Jira ticket was not found or is not accessible."
            : "Unable to retrieve or analyze the Jira ticket. Check Jira and model configuration, then try again.",
        },
        { status: notFound ? 404 : 502 },
      );
    }
    if (error instanceof JiraTicketAnalysisError) {
      return NextResponse.json({ error: error.message }, { status: 502 });
    }
    return NextResponse.json(
      {
        error:
          "Unable to analyze this Jira ticket. Check the model configuration and try again.",
      },
      { status: 502 },
    );
  }
}
