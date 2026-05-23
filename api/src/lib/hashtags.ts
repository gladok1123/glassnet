import { prisma } from "./prisma.js";

const TAG_RE = /#([\w\u0400-\u04FF]{2,50})/gi;

export function extractHashtagTags(content: string): string[] {
  const found = new Set<string>();
  for (const match of content.matchAll(TAG_RE)) {
    const tag = match[1]?.toLowerCase();
    if (tag) found.add(tag);
  }
  return [...found];
}

export async function syncPostHashtags(postId: string, content: string) {
  const tags = extractHashtagTags(content);
  await prisma.postHashtag.deleteMany({ where: { postId } });
  for (const tag of tags) {
    const hashtag = await prisma.hashtag.upsert({
      where: { tag },
      create: { tag },
      update: {},
    });
    await prisma.postHashtag.create({
      data: { postId, hashtagId: hashtag.id },
    });
  }
}

export function sanitizeSearchQuery(q: string, max = 80): string {
  return q.trim().slice(0, max).replace(/[%_\\]/g, "");
}
