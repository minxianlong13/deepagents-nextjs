// app/api/chat/route.ts
import { agent } from "@/lib/agents";
import { getOrCreateConversation } from "@/lib/conversation";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  input: z.string().trim().min(1),
});

const fallbackAssistantMessage =
  "I couldn't reach the search service right now. Try again in a moment.";

function normalizeAgentContent(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

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

    const { input } = parsed.data;
    const conversation = await getOrCreateConversation();

    const userMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "user",
        content: input,
      },
      select: {
        id: true,
        role: true,
        content: true,
      },
    });

    let assistantOutput = fallbackAssistantMessage;

    try {
      const result = await agent.invoke({
        messages: [{ role: "user", content: input }],
      });
      const lastMessage = result.messages[result.messages.length - 1];
      assistantOutput =
        normalizeAgentContent(lastMessage?.content) || "No response received.";
    } catch (e) {
      console.error("Error invoking agent:", e);
      assistantOutput = fallbackAssistantMessage;
    }

    const assistantMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: "assistant",
        content: assistantOutput,
      },
      select: {
        id: true,
        role: true,
        content: true,
      },
    });

    return NextResponse.json({
      output: assistantMessage.content,
      userMessage,
      assistantMessage,
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
