import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { postInclude, toPostDto } from "../lib/postDto.js";
import { toPublicUser } from "../lib/userPublic.js";
import { uploadAudio, uploadImage, publicUploadPath } from "../lib/upload.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { paramString } from "../lib/params.js";

export const usersRouter = Router();

const updateSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  bio: z.string().max(160).optional(),
});

usersRouter.patch("/me", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const user = await prisma.user.update({
    where: { id: req.userId! },
    data: parsed.data,
  });
  res.json({ user: toPublicUser(user) });
});

usersRouter.post(
  "/me/avatar",
  requireAuth,
  uploadImage.single("file"),
  async (req: AuthedRequest, res) => {
    if (!req.file) {
      res.status(400).json({ error: "Файл не выбран" });
      return;
    }
    const avatarUrl = publicUploadPath(req.file.filename);
    const user = await prisma.user.update({
      where: { id: req.userId! },
      data: { avatarUrl },
    });
    res.json({ user: toPublicUser(user), url: avatarUrl });
  }
);

usersRouter.post(
  "/me/banner",
  requireAuth,
  uploadImage.single("file"),
  async (req: AuthedRequest, res) => {
    if (!req.file) {
      res.status(400).json({ error: "Файл не выбран" });
      return;
    }
    const bannerUrl = publicUploadPath(req.file.filename);
    const user = await prisma.user.update({
      where: { id: req.userId! },
      data: { bannerUrl },
    });
    res.json({ user: toPublicUser(user), url: bannerUrl });
  }
);

usersRouter.get("/popular", requireAuth, async (req: AuthedRequest, res) => {
  const shuffle = req.query.shuffle === "1";
  const users = await prisma.user.findMany({
    where: { NOT: { id: req.userId! } },
    take: shuffle ? 60 : 30,
    include: {
      _count: { select: { followers: true, posts: true } },
    },
    orderBy: { followers: { _count: "desc" } },
  });
  let list = users.map((u) => ({
    ...toPublicUser(u),
    followers: u._count.followers,
    posts: u._count.posts,
  }));
  if (shuffle) {
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    list = list.slice(0, 30);
  }
  res.json({ users: list });
});

usersRouter.post(
  "/upload/post-image",
  requireAuth,
  uploadImage.single("file"),
  async (req: AuthedRequest, res) => {
    if (!req.file) {
      res.status(400).json({ error: "Файл не выбран" });
      return;
    }
    res.json({ url: publicUploadPath(req.file.filename) });
  }
);

usersRouter.post(
  "/upload/post-audio",
  requireAuth,
  uploadAudio.single("file"),
  async (req: AuthedRequest, res) => {
    if (!req.file) {
      res.status(400).json({ error: "Файл не выбран" });
      return;
    }
    res.json({ url: publicUploadPath(req.file.filename) });
  }
);

usersRouter.get("/:username", requireAuth, async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { username: paramString(req.params.username) },
  });
  if (!user) {
    res.status(404).json({ error: "Пользователь не найден" });
    return;
  }

  const [postsCount, followersCount, followingCount, isFollowing] =
    await Promise.all([
      prisma.post.count({
        where: { authorId: user.id, parentId: null },
      }),
      prisma.follow.count({ where: { followingId: user.id } }),
      prisma.follow.count({ where: { followerId: user.id } }),
      prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: req.userId!,
            followingId: user.id,
          },
        },
      }),
    ]);

  const posts = await prisma.post.findMany({
    where: { authorId: user.id, parentId: null },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: postInclude(req.userId!),
  });

  res.json({
    user: toPublicUser(user),
    stats: {
      posts: postsCount,
      followers: followersCount,
      following: followingCount,
    },
    isFollowing: Boolean(isFollowing),
    isSelf: user.id === req.userId,
    posts: posts.map((p) => toPostDto(p, req.userId!)),
  });
});

usersRouter.post(
  "/:username/follow",
  requireAuth,
  async (req: AuthedRequest, res) => {
    const target = await prisma.user.findUnique({
      where: { username: paramString(req.params.username) },
    });
    if (!target) {
      res.status(404).json({ error: "Пользователь не найден" });
      return;
    }
    if (target.id === req.userId) {
      res.status(400).json({ error: "Нельзя подписаться на себя" });
      return;
    }
    const existing = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: req.userId!,
          followingId: target.id,
        },
      },
    });
    if (existing) {
      await prisma.follow.delete({ where: { id: existing.id } });
      res.json({ following: false });
      return;
    }
    await prisma.follow.create({
      data: { followerId: req.userId!, followingId: target.id },
    });
    await prisma.notification.create({
      data: {
        userId: target.id,
        type: "follow",
        actorId: req.userId,
      },
    });
    res.json({ following: true });
  }
);
