import { ragAgent } from "@/lib/agents/rag_agent";
import { NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  input: z.string().trim().min(1),
});

function normalizeAgentContent(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") return item;
        if (
          typeof item === "object" &&
          item !== null &&
          "text" in item &&
          typeof (item as { text: unknown }).text === "string"
        ) {
          return (item as { text: string }).text;
        }
        return "";
      })
      .join("\n")
      .trim();
  }

  return "";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await ragAgent.invoke({
      messages: [{ role: "user", content: parsed.data.input }],
    });

    const lastMessage = result.messages[result.messages.length - 1];
    const output = normalizeAgentContent(lastMessage?.content);

    return NextResponse.json({
      output: output || "No response received.",
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unable to invoke the RAG agent";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
