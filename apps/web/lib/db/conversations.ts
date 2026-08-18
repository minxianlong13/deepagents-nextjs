import prisma from "@/lib/prisma";

export const DEFAULT_USER_ID = "local-user";

export async function getOrCreateConversation(userId = DEFAULT_USER_ID) {
  const existing = await prisma.conversation.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: { id: true },
  });

  if (existing) return existing;

  return prisma.conversation.create({
    data: { userId, title: "Search Conversation" },
    select: { id: true },
  });
}

export async function createConversation(
  title: string,
  userId = DEFAULT_USER_ID,
) {
  return prisma.conversation.create({
    data: { userId, title },
    select: { id: true },
  });
}

export async function listConversations(userId = DEFAULT_USER_ID) {
  return prisma.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      messages: {
        orderBy: { createdAt: "asc" },
        take: 1,
        select: { content: true, role: true },
      },
    },
  });
}
