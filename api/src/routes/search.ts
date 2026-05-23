import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { postInclude, toPostDto } from "../lib/postDto.js";
import { sanitizeSearchQuery } from "../lib/hashtags.js";
import { toPublicUser } from "../lib/userPublic.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";
import { paramString } from "../lib/params.js";

export const searchRouter = Router();

searchRouter.get("/users", requireAuth, async (req: AuthedRequest, res) => {
  const q = sanitizeSearchQuery((req.query.q as string) ?? "");
  if (q.length < 2) {
    res.json({ users: [] });
    return;
  }
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: q } },
        { displayName: { contains: q } },
      ],
      NOT: { id: req.userId! },
    },
    take: 25,
    orderBy: { createdAt: "desc" },
  });
  const withCounts = await Promise.all(
    users.map(async (u) => {
      const followers = await prisma.follow.count({
        where: { followingId: u.id },
      });
      return { ...toPublicUser(u), followers };
    })
  );
  res.json({ users: withCounts });
});

searchRouter.get("/posts", requireAuth, async (req: AuthedRequest, res) => {
  const q = sanitizeSearchQuery((req.query.q as string) ?? "");
  if (q.length < 2) {
    res.json({ posts: [] });
    return;
  }
  const posts = await prisma.post.findMany({
    where: {
      parentId: null,
      content: { contains: q },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: postInclude(req.userId!),
  });
  res.json({ posts: posts.map((p) => toPostDto(p, req.userId!)) });
});

searchRouter.get("/hashtags", requireAuth, async (req: AuthedRequest, res) => {
  const q = sanitizeSearchQuery((req.query.q as string) ?? "").replace(/^#/, "");
  if (q.length < 1) {
    res.json({ hashtags: [] });
    return;
  }
  const tags = await prisma.hashtag.findMany({
    where: { tag: { contains: q.toLowerCase() } },
    take: 20,
    include: { _count: { select: { posts: true } } },
    orderBy: { posts: { _count: "desc" } },
  });
  res.json({
    hashtags: tags.map((t) => ({
      tag: t.tag,
      postsCount: t._count.posts,
    })),
  });
});

searchRouter.get(
  "/hashtag/:tag/posts",
  requireAuth,
  async (req: AuthedRequest, res) => {
    const tag = paramString(req.params.tag).replace(/^#/, "").toLowerCase();
    const hashtag = await prisma.hashtag.findUnique({ where: { tag } });
    if (!hashtag) {
      res.json({ tag, posts: [] });
      return;
    }
    const links = await prisma.postHashtag.findMany({
      where: { hashtagId: hashtag.id },
      orderBy: { post: { createdAt: "desc" } },
      take: 40,
      include: {
        post: { include: postInclude(req.userId!) },
      },
    });
    res.json({
      tag,
      posts: links
        .filter((l) => l.post.parentId === null)
        .map((l) => toPostDto(l.post, req.userId!)),
    });
  }
);
