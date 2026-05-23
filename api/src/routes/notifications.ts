import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { toPublicUser } from "../lib/userPublic.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";

export const notificationsRouter = Router();

notificationsRouter.get("/", requireAuth, async (req: AuthedRequest, res) => {
  const items = await prisma.notification.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const actorIds = items.map((n) => n.actorId).filter(Boolean) as string[];
  const actors = await prisma.user.findMany({
    where: { id: { in: actorIds } },
  });
  const actorMap = new Map(actors.map((a) => [a.id, toPublicUser(a)]));

  res.json({
    notifications: items.map((n) => ({
      id: n.id,
      type: n.type,
      read: n.read,
      createdAt: n.createdAt,
      postId: n.postId,
      actor: n.actorId ? actorMap.get(n.actorId) ?? null : null,
    })),
  });
});

notificationsRouter.post(
  "/read-all",
  requireAuth,
  async (req: AuthedRequest, res) => {
    await prisma.notification.updateMany({
      where: { userId: req.userId!, read: false },
      data: { read: true },
    });
    res.json({ ok: true });
  }
);
