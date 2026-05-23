import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { toPublicUser } from "../lib/userPublic.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { paramString } from "../lib/params.js";

export const voiceRouter = Router();

voiceRouter.get("/", requireAuth, async (_req, res) => {
  const rooms = await prisma.voiceRoom.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      owner: true,
      _count: { select: { members: true } },
    },
    take: 50,
  });
  res.json({
    rooms: rooms.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      maxMembers: r.maxMembers,
      membersCount: r._count.members,
      owner: toPublicUser(r.owner),
      createdAt: r.createdAt,
    })),
  });
});

const createSchema = z.object({
  name: z.string().min(2).max(48),
  description: z.string().max(200).optional(),
});

voiceRouter.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Неверные данные" });
    return;
  }
  const room = await prisma.voiceRoom.create({
    data: {
      name: parsed.data.name.trim(),
      description: parsed.data.description?.trim() ?? "",
      ownerId: req.userId!,
      members: { create: { userId: req.userId! } },
    },
    include: { owner: true, _count: { select: { members: true } } },
  });
  res.status(201).json({
    room: {
      id: room.id,
      name: room.name,
      description: room.description,
      maxMembers: room.maxMembers,
      membersCount: room._count.members,
      owner: toPublicUser(room.owner),
      createdAt: room.createdAt,
    },
  });
});

voiceRouter.get("/:id", requireAuth, async (req: AuthedRequest, res) => {
  const room = await prisma.voiceRoom.findUnique({
    where: { id: paramString(req.params.id) },
    include: {
      owner: true,
      members: { include: { user: true } },
    },
  });
  if (!room) {
    res.status(404).json({ error: "Комната не найдена" });
    return;
  }
  res.json({
    room: {
      id: room.id,
      name: room.name,
      description: room.description,
      maxMembers: room.maxMembers,
      owner: toPublicUser(room.owner),
      members: room.members.map((m) => ({
        user: toPublicUser(m.user),
        joinedAt: m.joinedAt,
      })),
    },
  });
});

voiceRouter.post("/:id/join", requireAuth, async (req: AuthedRequest, res) => {
  const roomId = paramString(req.params.id);
  const room = await prisma.voiceRoom.findUnique({
    where: { id: roomId },
    include: { _count: { select: { members: true } } },
  });
  if (!room) {
    res.status(404).json({ error: "Комната не найдена" });
    return;
  }
  if (room._count.members >= room.maxMembers) {
    res.status(403).json({ error: "Комната заполнена" });
    return;
  }
  await prisma.voiceRoomMember.upsert({
    where: {
      roomId_userId: { roomId, userId: req.userId! },
    },
    create: { roomId, userId: req.userId! },
    update: {},
  });
  res.json({ joined: true, roomId });
});

voiceRouter.post("/:id/leave", requireAuth, async (req: AuthedRequest, res) => {
  const roomId = paramString(req.params.id);
  await prisma.voiceRoomMember.deleteMany({
    where: { roomId, userId: req.userId! },
  });
  const left = await prisma.voiceRoomMember.count({ where: { roomId } });
  if (left === 0) {
    await prisma.voiceRoom.delete({ where: { id: roomId } });
  }
  res.json({ left: true });
});

const signalSchema = z.object({
  roomId: z.string().min(1),
  toUserId: z.string().min(1),
  signal: z.unknown(),
});

voiceRouter.post("/signal", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = signalSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Неверные данные" });
    return;
  }
  const { roomId, toUserId, signal } = parsed.data;
  const member = await prisma.voiceRoomMember.findFirst({
    where: { roomId, userId: req.userId! },
  });
  if (!member) {
    res.status(403).json({ error: "Вы не в комнате" });
    return;
  }
  await prisma.voiceSignal.create({
    data: {
      roomId,
      toUserId,
      fromUserId: req.userId!,
      signal: JSON.stringify(signal),
    },
  });
  res.json({ ok: true });
});

voiceRouter.get("/signals", requireAuth, async (req: AuthedRequest, res) => {
  const sinceRaw = typeof req.query.since === "string" ? req.query.since : "";
  const since = sinceRaw ? new Date(sinceRaw) : new Date(0);
  if (Number.isNaN(since.getTime())) {
    res.status(400).json({ error: "Неверный since" });
    return;
  }
  const rows = await prisma.voiceSignal.findMany({
    where: { toUserId: req.userId!, createdAt: { gt: since } },
    orderBy: { createdAt: "asc" },
    take: 200,
  });
  if (rows.length > 0) {
    const ids = rows.map((r) => r.id);
    await prisma.voiceSignal.deleteMany({ where: { id: { in: ids } } });
  }
  res.json({
    signals: rows.map((r) => ({
      roomId: r.roomId,
      fromUserId: r.fromUserId,
      signal: JSON.parse(r.signal) as unknown,
      at: r.createdAt.toISOString(),
    })),
  });
});
