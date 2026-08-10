import { getOrCreateConversation } from "@/lib/conversation";
import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const createMessageSchema = z.object({
  conversationId: z.string().cuid().optional(),
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1),
});

export async function GET() {
  try {
    const conversation = await getOrCreateConversation();

    const messages = await prisma.message.findMany({
      where: {
        conversationId: conversation.id,
        role: {
          in: ["user", "assistant"],
        },
      },
      orderBy: [{ createdAt: "asc" }],
      select: {
        id: true,
        role: true,
        content: true,
      },
    });

    return NextResponse.json({ messages });
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

    const conversation = parsed.data.conversationId
      ? { id: parsed.data.conversationId }
      : await getOrCreateConversation();

    const savedMessage = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: parsed.data.role,
        content: parsed.data.content,
      },
      select: {
        id: true,
        role: true,
        content: true,
      },
    });

    return NextResponse.json({ message: savedMessage }, { status: 201 });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
