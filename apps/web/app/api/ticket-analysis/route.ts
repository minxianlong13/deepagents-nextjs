import { JiraTicketAgentError } from "@/lib/agents/get_jira_ticket_agent";
import {
  ticketKeySchema,
  runAnalyzeTicketStep,
  ticketAnalysisStepSchema,
} from "@/lib/workflow/ticket_analysis";
import { NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  ticketKey: z.string(),
  step: ticketAnalysisStepSchema,
  jira: z.unknown().optional(),
  ticketContract: z.unknown().optional(),
  slackReference: z.unknown().optional(),
});

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Request body must be valid JSON." },
        { status: 400 },
      );
    }
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "A Jira ticket key and workflow step are required.",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const ticketKey = ticketKeySchema.safeParse(parsed.data.ticketKey);
    if (!ticketKey.success) {
      return NextResponse.json(
        {
          error:
            ticketKey.error.issues[0]?.message ??
            "Enter a Jira ticket key starting with GROUP- or PROD-.",
          details: ticketKey.error.flatten(),
        },
        { status: 400 },
      );
    }

    const result = await runAnalyzeTicketStep({
      step: parsed.data.step,
      ticketKey: ticketKey.data,
      jira: parsed.data.jira,
      ticketContract: parsed.data.ticketContract,
      slackReference: parsed.data.slackReference,
    });

    return NextResponse.json({
      ticketKey: ticketKey.data,
      step: parsed.data.step,
      result,
    });
  } catch (error: unknown) {
    if (error instanceof JiraTicketAgentError) {
      const ticketNotFound = /\(404\)/.test(error.message);
      return NextResponse.json(
        {
          error: ticketNotFound
            ? "Jira ticket was not found or is not accessible."
            : "Unable to retrieve the Jira ticket. Check Jira access and try again.",
        },
        { status: ticketNotFound ? 404 : 502 },
      );
    }

    return NextResponse.json(
      {
        error:
          "Ticket analysis could not be completed. Check the MCP server and model configuration, then try again.",
      },
      { status: 502 },
    );
  }
}
