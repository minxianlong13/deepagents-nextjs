import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { NextResponse } from "next/server";
import * as z from "zod/v4";

export const runtime = "nodejs";

const payloadSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
});

const DEFAULT_LOCAL_MCP_URL = "http://127.0.0.1:8787/mcp";

function normalizeMcpUrl(rawUrl: string) {
  const trimmed = rawUrl.trim();
  const parsed = new URL(trimmed);

  if (parsed.pathname === "/") {
    parsed.pathname = "/mcp";
  }

  return parsed.toString();
}

async function callMcpTools(serverUrl: string, name: string) {
  const transport = new StreamableHTTPClientTransport(new URL(serverUrl));
  const client = new Client({
    name: "nextjs-mcp-demo-client",
    version: "0.1.0",
  });

  try {
    await client.connect(transport);

    const hello = await client.callTool({
      name: "hello_mcp",
      arguments: { name },
    });

    const sum = await client.callTool({
      name: "sum_numbers",
      arguments: { a: 2, b: 3 },
    });

    return { hello, sum };
  } finally {
    await client.close();
  }
}

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

  const name = parsed.data.name ?? "DeepAgents";
  const candidateUrls = [process.env.MCP_SERVER_URL, DEFAULT_LOCAL_MCP_URL]
    .filter((value): value is string =>
      Boolean(value && value.trim().length > 0),
    )
    .map(normalizeMcpUrl)
    .filter((value, index, all) => all.indexOf(value) === index);

  const errors: string[] = [];

  for (const serverUrl of candidateUrls) {
    try {
      const { hello, sum } = await callMcpTools(serverUrl, name);

      return NextResponse.json({
        input: { name },
        serverUrl,
        hello,
        sum,
      });
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to call MCP server";
      errors.push(`${serverUrl}: ${message}`);
    }
  }

  return NextResponse.json(
    {
      error: "Failed to call MCP server for all configured endpoints.",
      attempts: errors,
    },
    { status: 500 },
  );
}
