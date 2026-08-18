import {
  DEFAULT_USER_ID,
  getMessagesByConversationId,
  listConversations,
  createMessage,
} from "@/lib/db";
import { NextResponse } from "next/server";
import { z } from "zod";

const createMessageSchema = z.object({
  conversationId: z.string().cuid().optional(),
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");

    if (conversationId) {
      const messages = await getMessagesByConversationId(conversationId);
      return NextResponse.json({ messages });
    }

    const conversations = await listConversations(DEFAULT_USER_ID);
    return NextResponse.json({ conversations });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createMessageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    if (!parsed.data.conversationId) {
      return NextResponse.json(
        { error: "conversationId is required" },
        { status: 400 },
      );
    }
    const savedMessage = await createMessage(
      parsed.data.conversationId,
      parsed.data.role,
      parsed.data.content,
    );

    return NextResponse.json({ message: savedMessage }, { status: 201 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
