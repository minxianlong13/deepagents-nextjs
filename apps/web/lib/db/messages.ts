import prisma from "@/lib/prisma";

export async function getMessagesByConversationId(conversationId: string) {
  return prisma.message.findMany({
    where: {
      conversationId,
      role: { in: ["user", "assistant"] },
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, role: true, content: true },
  });
}

export async function createMessage(
  conversationId: string,
  role: "user" | "assistant",
  content: string,
) {
  return prisma.message.create({
    data: { conversationId, role, content },
    select: { id: true, role: true, content: true },
  });
}
