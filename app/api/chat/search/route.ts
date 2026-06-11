// app/api/chat/route.ts
import { agent } from "@/lib/agents";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { input } = await req.json();

    const result = await agent.invoke({
      messages: [{ role: "user", content: input }],
    });
    return NextResponse.json({
      output: result.messages[result.messages.length - 1].content,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
