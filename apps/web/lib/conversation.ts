import prisma from "@/lib/prisma";

export const DEFAULT_USER_ID = "local-user";

export async function getOrCreateConversation(userId = DEFAULT_USER_ID) {
  const existingConversation = await prisma.conversation.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
    },
  });

  if (existingConversation) {
    return existingConversation;
  }

  return prisma.conversation.create({
    data: {
      userId,
      title: "Search Conversation",
    },
    select: {
      id: true,
    },
  });
}
