import { createMcpClient } from "@/lib/mcp/client";
import { NextResponse } from "next/server";
import * as z from "zod/v4";

export const runtime = "nodejs";

const payloadSchema = z.object({
  issueKey: z
    .string()
    .trim()
    .regex(/^[A-Z][A-Z0-9]+-\d+$/)
    .optional(),
});

const MCP_JIRA_TOOL_NAME = "get_jira_ticket";

export async function POST(req: Request) {
  const rawBody = await req.json().catch(() => null);

  if (rawBody === null) {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = payloadSchema.safeParse(rawBody);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Payload validation failed.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  if (!parsed.data.issueKey) {
    return NextResponse.json(
      {
        warning: "issueKey is required to retrieve a Jira ticket.",
      },
      { status: 400 },
    );
  }

  const issueKey = parsed.data.issueKey;
  try {
    const connection = await createMcpClient();

    try {
      const jiraTicket = await connection.client.callTool({
        name: MCP_JIRA_TOOL_NAME,
        arguments: { issueKey },
      });

      return NextResponse.json({
        input: { issueKey },
        serverName: connection.serverName,
        serverUrl: connection.server.url,
        jiraTicket,
      });
    } finally {
      await connection.close();
    }
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to call MCP server";

    return NextResponse.json(
      {
        error: "Failed to call configured MCP server.",
        details: message,
      },
      { status: 500 },
    );
  }
}
