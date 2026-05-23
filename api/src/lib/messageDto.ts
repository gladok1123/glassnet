import type { Message, User } from "@prisma/client";
import { decryptMessage, encryptMessage, ENCRYPTED_PREVIEW } from "./crypto.js";
import { toPublicUser } from "./userPublic.js";

export function toMessageDto(
  m: Message & { sender: User },
  viewerId: string,
  preview = false
) {
  const content = decryptMessage({
    content: m.content,
    contentCipher: m.contentCipher,
    contentIv: m.contentIv,
    encrypted: m.encrypted,
    conversationId: m.conversationId,
  });
  return {
    id: m.id,
    content: preview && m.encrypted ? ENCRYPTED_PREVIEW : content,
    createdAt: m.createdAt,
    sender: toPublicUser(m.sender),
    isMine: m.senderId === viewerId,
    conversationId: m.conversationId,
    encrypted: m.encrypted,
  };
}

export function encryptedPayload(plaintext: string, conversationId: string) {
  return encryptMessage(plaintext, conversationId);
}
