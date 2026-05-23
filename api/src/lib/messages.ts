import { prisma } from "./prisma.js";
import { encryptedPayload } from "./messageDto.js";
import { toMessageDto } from "./messageDto.js";

export async function createEncryptedMessage(
  conversationId: string,
  senderId: string,
  plaintext: string
) {
  const payload = encryptedPayload(plaintext, conversationId);
  const message = await prisma.message.create({
    data: {
      conversationId,
      senderId,
      ...payload,
    },
    include: { sender: true },
  });
  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });
  return message;
}

export function formatMessage(
  message: Awaited<ReturnType<typeof createEncryptedMessage>>,
  viewerId: string
) {
  return toMessageDto(message, viewerId);
}
