import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { toPublicUser } from "../lib/userPublic.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { paramString } from "../lib/params.js";

export const clansRouter = Router();

const createSchema = z.object({
  name: z.string().min(2).max(40),
  tag: z
    .string()
    .min(2)
    .max(8)
    .regex(/^[a-zA-Z0-9_]+$/),
  description: z.string().max(300).optional(),
});

clansRouter.get("/", requireAuth, async (_req, res) => {
  const clans = await prisma.clan.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      owner: true,
      _count: { select: { members: true } },
    },
  });
  res.json({
    clans: clans.map((c) => ({
      id: c.id,
      name: c.name,
      tag: c.tag,
      description: c.description,
      avatarUrl: c.avatarUrl,
      owner: toPublicUser(c.owner),
      membersCount: c._count.members,
    })),
  });
});

clansRouter.get("/:id", requireAuth, async (req: AuthedRequest, res) => {
  const clan = await prisma.clan.findUnique({
    where: { id: paramString(req.params.id) },
    include: {
      owner: true,
      members: { include: { user: true } },
      _count: { select: { members: true } },
    },
  });
  if (!clan) {
    res.status(404).json({ error: "Клан не найден" });
    return;
  }
  const myMembership = clan.members.find((m) => m.userId === req.userId);
  res.json({
    clan: {
      id: clan.id,
      name: clan.name,
      tag: clan.tag,
      description: clan.description,
      avatarUrl: clan.avatarUrl,
      owner: toPublicUser(clan.owner),
      membersCount: clan._count.members,
      isMember: Boolean(myMembership),
      myRole: myMembership?.role ?? null,
      members: clan.members.map((m) => ({
        role: m.role,
        user: toPublicUser(m.user),
      })),
    },
  });
});

clansRouter.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Неверные данные" });
    return;
  }
  const tag = parsed.data.tag.toUpperCase();
  const existing = await prisma.clan.findUnique({ where: { tag } });
  if (existing) {
    res.status(409).json({ error: "Тег клана занят" });
    return;
  }
  const clan = await prisma.clan.create({
    data: {
      name: parsed.data.name,
      tag,
      description: parsed.data.description ?? "",
      ownerId: req.userId!,
      members: {
        create: { userId: req.userId!, role: "owner" },
      },
    },
    include: { owner: true, _count: { select: { members: true } } },
  });
  res.status(201).json({
    clan: {
      id: clan.id,
      name: clan.name,
      tag: clan.tag,
      description: clan.description,
      owner: toPublicUser(clan.owner),
      membersCount: clan._count.members,
    },
  });
});

clansRouter.post("/:id/join", requireAuth, async (req: AuthedRequest, res) => {
  const clan = await prisma.clan.findUnique({
    where: { id: paramString(req.params.id) },
  });
  if (!clan) {
    res.status(404).json({ error: "Клан не найден" });
    return;
  }
  const exists = await prisma.clanMember.findUnique({
    where: {
      clanId_userId: { clanId: clan.id, userId: req.userId! },
    },
  });
  if (exists) {
    res.json({ joined: true });
    return;
  }
  await prisma.clanMember.create({
    data: { clanId: clan.id, userId: req.userId!, role: "member" },
  });
  res.json({ joined: true });
});

clansRouter.post("/:id/leave", requireAuth, async (req: AuthedRequest, res) => {
  const clan = await prisma.clan.findUnique({
    where: { id: paramString(req.params.id) },
  });
  if (!clan) {
    res.status(404).json({ error: "Клан не найден" });
    return;
  }
  if (clan.ownerId === req.userId) {
    res.status(400).json({ error: "Владелец не может выйти — передайте клан" });
    return;
  }
  await prisma.clanMember.deleteMany({
    where: { clanId: clan.id, userId: req.userId! },
  });
  res.json({ left: true });
});
