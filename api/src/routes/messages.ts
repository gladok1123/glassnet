import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { createEncryptedMessage, formatMessage } from "../lib/messages.js";
import { toMessageDto } from "../lib/messageDto.js";
import { toPublicUser } from "../lib/userPublic.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { paramString } from "../lib/params.js";

export const messagesRouter = Router();

async function findDmConversation(userA: string, userB: string) {
  const candidates = await prisma.conversation.findMany({
    where: {
      AND: [
        { members: { some: { userId: userA } } },
        { members: { some: { userId: userB } } },
      ],
    },
    include: {
      members: true,
      _count: { select: { messages: true } },
    },
  });
  return (
    candidates.find(
      (c) =>
        c.members.length === 2 &&
        c.members.every((m) => [userA, userB].includes(m.userId)) &&
        c._count.messages > 0
    ) ?? null
  );
}

async function findOrCreateDm(userA: string, userB: string) {
  const existing = await prisma.conversation.findMany({
    where: {
      AND: [
        { members: { some: { userId: userA } } },
        { members: { some: { userId: userB } } },
      ],
    },
    include: { members: true },
  });
  const match = existing.find(
    (c) =>
      c.members.length === 2 &&
      c.members.every((m) => [userA, userB].includes(m.userId))
  );
  if (match) return match;
  return prisma.conversation.create({
    data: {
      members: { create: [{ userId: userA }, { userId: userB }] },
    },
  });
}

messagesRouter.get("/check/:username", requireAuth, async (req, res) => {
  const username = paramString(req.params.username).replace(/^@/, "");
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    res.status(404).json({ error: "Такого пользователя не существует" });
    return;
  }
  if (user.id === (req as AuthedRequest).userId) {
    res.status(400).json({ error: "Нельзя написать себе" });
    return;
  }
  res.json({ user: toPublicUser(user) });
});

messagesRouter.get("/", requireAuth, async (req: AuthedRequest, res) => {
  await prisma.conversation.deleteMany({
    where: {
      members: { some: { userId: req.userId! } },
      messages: { none: {} },
    },
  });

  const memberships = await prisma.conversationMember.findMany({
    where: {
      userId: req.userId!,
      conversation: { messages: { some: {} } },
    },
    include: {
      conversation: {
        include: {
          members: { include: { user: true } },
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1,
            include: { sender: true },
          },
        },
      },
    },
    orderBy: { conversation: { updatedAt: "desc" } },
  });

  res.json({
    conversations: memberships.map((m) => {
      const others = m.conversation.members
        .filter((x) => x.userId !== req.userId)
        .map((x) => toPublicUser(x.user));
      const last = m.conversation.messages[0];
      return {
        id: m.conversation.id,
        participants: others,
        lastMessage: last
          ? {
              id: last.id,
              content: toMessageDto(last, req.userId!).content,
              createdAt: last.createdAt,
              senderId: last.senderId,
            }
          : null,
        updatedAt: m.conversation.updatedAt,
      };
    }),
  });
});

const directSchema = z.object({
  username: z.string().min(1),
  content: z.string().min(1).max(2000),
});

messagesRouter.post("/direct", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = directSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Неверные данные" });
    return;
  }
  const username = parsed.data.username.replace(/^@/, "");
  const other = await prisma.user.findUnique({ where: { username } });
  if (!other) {
    res.status(404).json({ error: "Такого пользователя не существует" });
    return;
  }
  if (other.id === req.userId) {
    res.status(400).json({ error: "Нельзя написать себе" });
    return;
  }

  const conversation = await findOrCreateDm(req.userId!, other.id);
  const message = await createEncryptedMessage(
    conversation.id,
    req.userId!,
    parsed.data.content
  );

  res.status(201).json({
    conversationId: conversation.id,
    message: formatMessage(message, req.userId!),
  });
});

const openSchema = z.object({ username: z.string().min(1) });

messagesRouter.post("/open", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = openSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Укажите username" });
    return;
  }
  const username = parsed.data.username.replace(/^@/, "");
  const other = await prisma.user.findUnique({ where: { username } });
  if (!other) {
    res.status(404).json({ error: "Такого пользователя не существует" });
    return;
  }
  if (other.id === req.userId) {
    res.status(400).json({ error: "Нельзя написать себе" });
    return;
  }

  const conversation = await findOrCreateDm(req.userId!, other.id);
  res.json({
    conversation: {
      id: conversation.id,
      participants: [toPublicUser(other)],
    },
  });
});

messagesRouter.get("/:id", requireAuth, async (req: AuthedRequest, res) => {
  const member = await prisma.conversationMember.findFirst({
    where: { conversationId: paramString(req.params.id), userId: req.userId! },
  });
  if (!member) {
    res.status(403).json({ error: "Нет доступа" });
    return;
  }
  const messages = await prisma.message.findMany({
    where: { conversationId: paramString(req.params.id) },
    orderBy: { createdAt: "asc" },
    include: { sender: true },
  });
  res.json({
    messages: messages.map((m) => toMessageDto(m, req.userId!)),
  });
});

const sendSchema = z.object({ content: z.string().min(1).max(2000) });

messagesRouter.post("/:id", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = sendSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Пустое сообщение" });
    return;
  }
  const member = await prisma.conversationMember.findFirst({
    where: { conversationId: paramString(req.params.id), userId: req.userId! },
  });
  if (!member) {
    res.status(403).json({ error: "Нет доступа" });
    return;
  }
  const message = await createEncryptedMessage(
    paramString(req.params.id),
    req.userId!,
    parsed.data.content
  );
  res.status(201).json({
    message: formatMessage(message, req.userId!),
  });
});
