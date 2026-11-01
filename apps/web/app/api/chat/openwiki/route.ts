import {
  runOpenWikiAgent,
  openWikiChatInputSchema,
} from "@/lib/agents/openwiki_agent";
import { NextResponse } from "next/server";

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

  const parsed = openWikiChatInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "A question, repository, and workspace are required." },
      { status: 400 },
    );
  }

  try {
    const output = await runOpenWikiAgent(parsed.data);
    return NextResponse.json({ output });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to search OpenWiki. Check the MCP and model configuration.",
      },
      { status: 502 },
    );
  }
}
