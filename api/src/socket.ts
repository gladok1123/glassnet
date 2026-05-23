import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { verifyAccessToken } from "./lib/jwt.js";
import { prisma } from "./lib/prisma.js";
import { createEncryptedMessage, formatMessage } from "./lib/messages.js";
import { decryptMessage, ENCRYPTED_PREVIEW } from "./lib/crypto.js";

export function attachSocket(httpServer: HttpServer) {
  const origin = process.env.CORS_ORIGIN ?? "http://localhost:3000";
  const io = new Server(httpServer, {
    cors: { origin, credentials: true },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      next(new Error("Unauthorized"));
      return;
    }
    try {
      const { userId } = verifyAccessToken(token);
      socket.data.userId = userId;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;
    socket.join(`user:${userId}`);

    socket.on("conversation:join", (conversationId: string) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on("voice:join", (roomId: string) => {
      if (typeof roomId !== "string" || !roomId) return;
      socket.join(`voice:${roomId}`);
      socket.to(`voice:${roomId}`).emit("voice:peer-joined", { userId });
    });

    socket.on("voice:leave", (roomId: string) => {
      if (typeof roomId !== "string" || !roomId) return;
      socket.leave(`voice:${roomId}`);
      socket.to(`voice:${roomId}`).emit("voice:peer-left", { userId });
    });

    socket.on(
      "voice:signal",
      (payload: { roomId: string; toUserId: string; signal: unknown }) => {
        if (!payload?.roomId || !payload?.toUserId) return;
        io.to(`user:${payload.toUserId}`).emit("voice:signal", {
          roomId: payload.roomId,
          fromUserId: userId,
          signal: payload.signal,
        });
      }
    );

    socket.on(
      "message:send",
      async (
        payload: { conversationId: string; content: string },
        ack?: (result: unknown) => void
      ) => {
        try {
          const member = await prisma.conversationMember.findFirst({
            where: { conversationId: payload.conversationId, userId },
          });
          if (!member) {
            ack?.({ error: "Нет доступа" });
            return;
          }
          const message = await createEncryptedMessage(
            payload.conversationId,
            userId,
            payload.content.slice(0, 2000)
          );
          const data = formatMessage(message, userId);
          socket
            .to(`conversation:${payload.conversationId}`)
            .emit("message:new", { ...data, isMine: false });
          const members = await prisma.conversationMember.findMany({
            where: { conversationId: payload.conversationId },
          });
          const preview = message.encrypted
            ? ENCRYPTED_PREVIEW
            : decryptMessage({
                content: message.content,
                contentCipher: message.contentCipher,
                contentIv: message.contentIv,
                encrypted: message.encrypted,
                conversationId: payload.conversationId,
              });
          for (const m of members) {
            if (m.userId !== userId) {
              io.to(`user:${m.userId}`).emit("inbox:update", {
                conversationId: payload.conversationId,
                preview,
              });
            }
          }
          ack?.({ message: { ...data, isMine: true } });
        } catch {
          ack?.({ error: "Ошибка отправки" });
        }
      }
    );
  });

  return io;
}
