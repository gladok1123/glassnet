import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { syncPostHashtags } from "../lib/hashtags.js";
import { postInclude, toPostDto } from "../lib/postDto.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { paramString } from "../lib/params.js";

const createPostSchema = z
  .object({
    content: z.string().max(500).default(""),
    parentId: z.string().optional(),
    imageUrl: z.string().optional(),
    audioUrl: z.string().optional(),
    repostOfId: z.string().optional(),
    postType: z.enum(["text", "poll", "voice"]).optional(),
    pollQuestion: z.string().max(200).optional(),
    pollOptions: z.array(z.string().min(1).max(80)).min(2).max(4).optional(),
  })
  .refine(
    (d) => {
      if (d.postType === "poll") {
        return (
          Boolean(d.pollQuestion?.trim()) &&
          Boolean(d.pollOptions && d.pollOptions.length >= 2)
        );
      }
      if (d.postType === "voice") return Boolean(d.audioUrl);
      return (
        d.content.trim().length > 0 || d.imageUrl || d.repostOfId || d.audioUrl
      );
    },
    { message: "Нужен текст, фото, голос, опрос или репост" }
  );

export const postsRouter = Router();

async function enrichPosts(postIds: string[], viewerId: string) {
  const posts = await prisma.post.findMany({
    where: { id: { in: postIds } },
    include: postInclude(viewerId),
    orderBy: { createdAt: "desc" },
  });
  const map = new Map(posts.map((p) => [p.id, toPostDto(p, viewerId)]));
  return postIds
    .map((id) => map.get(id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
}

postsRouter.get("/feed", requireAuth, async (req: AuthedRequest, res) => {
  const tab = (req.query.tab as string) ?? "home";
  const cursor = req.query.cursor as string | undefined;
  const limit = 20;

  let where: Record<string, unknown> = { parentId: null };

  if (tab === "following") {
    const following = await prisma.follow.findMany({
      where: { followerId: req.userId! },
      select: { followingId: true },
    });
    const ids = following.map((f) => f.followingId);
    where = {
      parentId: null,
      authorId: { in: ids.length ? ids : ["__none__"] },
    };
  }

  const posts = await prisma.post.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  });

  const slice = posts.slice(0, limit);
  const nextCursor = posts.length > limit ? posts[limit]?.id : null;

  res.json({
    posts: await enrichPosts(
      slice.map((p) => p.id),
      req.userId!
    ),
    nextCursor,
  });
});

postsRouter.post("/", requireAuth, async (req: AuthedRequest, res) => {
  const parsed = createPostSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: parsed.error.flatten().formErrors[0] ?? "Неверные данные",
    });
    return;
  }
  const {
    content,
    parentId,
    imageUrl,
    audioUrl,
    repostOfId,
    postType,
    pollQuestion,
    pollOptions,
  } = parsed.data;

  if (parentId) {
    const parent = await prisma.post.findUnique({ where: { id: parentId } });
    if (!parent) {
      res.status(404).json({ error: "Пост не найден" });
      return;
    }
  }
  if (repostOfId) {
    const original = await prisma.post.findUnique({
      where: { id: repostOfId, parentId: null },
    });
    if (!original) {
      res.status(404).json({ error: "Пост для репоста не найден" });
      return;
    }
  }

  const type = postType ?? (audioUrl ? "voice" : "text");

  const post = await prisma.post.create({
    data: {
      content: content.trim(),
      authorId: req.userId!,
      parentId: parentId ?? null,
      imageUrl: imageUrl ?? null,
      audioUrl: audioUrl ?? null,
      postType: type,
      pollQuestion: type === "poll" ? pollQuestion?.trim() : null,
      repostOfId: repostOfId ?? null,
      pollOptions:
        type === "poll" && pollOptions
          ? {
              create: pollOptions.map((text, i) => ({
                text: text.trim(),
                sortOrder: i,
              })),
            }
          : undefined,
    },
  });

  if (!parentId) {
    await syncPostHashtags(post.id, post.content);
  }

  if (parentId) {
    const parent = await prisma.post.findUnique({
      where: { id: parentId },
      select: { authorId: true },
    });
    if (parent && parent.authorId !== req.userId) {
      await prisma.notification.create({
        data: {
          userId: parent.authorId,
          type: "comment",
          actorId: req.userId,
          postId: post.id,
        },
      });
    }
  }

  if (repostOfId) {
    const original = await prisma.post.findUnique({
      where: { id: repostOfId },
      select: { authorId: true },
    });
    if (original && original.authorId !== req.userId) {
      await prisma.notification.create({
        data: {
          userId: original.authorId,
          type: "repost",
          actorId: req.userId,
          postId: post.id,
        },
      });
    }
  }

  const [enriched] = await enrichPosts([post.id], req.userId!);
  res.status(201).json({ post: enriched });
});

postsRouter.get("/:id", requireAuth, async (req: AuthedRequest, res) => {
  const post = await prisma.post.findUnique({
    where: { id: paramString(req.params.id) },
    include: postInclude(req.userId!),
  });
  if (!post) {
    res.status(404).json({ error: "Не найден" });
    return;
  }
  const comments = await prisma.post.findMany({
    where: { parentId: post.id },
    orderBy: { createdAt: "asc" },
    select: { id: true },
  });
  res.json({
    post: toPostDto(post, req.userId!),
    comments: await enrichPosts(
      comments.map((c) => c.id),
      req.userId!
    ),
  });
});

postsRouter.post(
  "/:id/poll/vote",
  requireAuth,
  async (req: AuthedRequest, res) => {
    const postId = paramString(req.params.id);
    const body = z.object({ optionId: z.string() }).safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: "Укажите вариант" });
      return;
    }
    const { optionId } = body.data;
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { pollOptions: true },
    });
    if (!post || post.postType !== "poll") {
      res.status(404).json({ error: "Опрос не найден" });
      return;
    }
    if (!post.pollOptions.some((o) => o.id === optionId)) {
      res.status(400).json({ error: "Неверный вариант" });
      return;
    }
    await prisma.pollVote.upsert({
      where: { userId_postId: { userId: req.userId!, postId } },
      create: { userId: req.userId!, postId, optionId },
      update: { optionId },
    });
    const [enriched] = await enrichPosts([postId], req.userId!);
    res.json({ post: enriched });
  }
);

postsRouter.post("/:id/like", requireAuth, async (req: AuthedRequest, res) => {
  const postId = paramString(req.params.id);
  const existing = await prisma.like.findUnique({
    where: { userId_postId: { userId: req.userId!, postId } },
  });
  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
    res.json({ liked: false });
    return;
  }
  await prisma.like.create({
    data: { userId: req.userId!, postId },
  });
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true },
  });
  if (post && post.authorId !== req.userId) {
    await prisma.notification.create({
      data: {
        userId: post.authorId,
        type: "like",
        actorId: req.userId,
        postId,
      },
    });
  }
  res.json({ liked: true });
});
