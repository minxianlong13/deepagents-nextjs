import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { NextResponse } from "next/server";
import * as z from "zod/v4";

export const runtime = "nodejs";

const payloadSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
});

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
  const serverUrl = process.env.MCP_SERVER_URL ?? "http://127.0.0.1:8787/mcp";
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

    return NextResponse.json({
      input: { name },
      hello,
      sum,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to call MCP server";
    return NextResponse.json(
      {
        error: message,
      },
      { status: 500 },
    );
  } finally {
    await client.close();
  }
}
