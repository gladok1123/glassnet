import type { Post, User } from "@prisma/client";
import { toPublicUser } from "./userPublic.js";

type PollOptionRow = {
  id: string;
  text: string;
  sortOrder: number;
  _count: { votes: number };
};

type PostWithRelations = Post & {
  author: User;
  repostOf?:
    | (Post & {
        author: User;
      })
    | null;
  hashtags?: { hashtag: { tag: string } }[];
  pollOptions?: PollOptionRow[];
  pollVotes?: { optionId: string }[];
  _count: { likes: number; reposts: number; comments: number; quotes: number };
  likes: { id: string }[];
  reposts: { id: string }[];
};

export function toPostDto(post: PostWithRelations, viewerId: string) {
  const pollOptions = post.pollOptions?.map((o) => ({
    id: o.id,
    text: o.text,
    votesCount: o._count.votes,
  }));
  const totalPollVotes =
    pollOptions?.reduce((s, o) => s + o.votesCount, 0) ?? 0;
  const myVote = post.pollVotes?.[0]?.optionId ?? null;

  return {
    id: post.id,
    content: post.content,
    imageUrl: post.imageUrl,
    audioUrl: post.audioUrl,
    postType: post.postType ?? "text",
    pollQuestion: post.pollQuestion,
    pollOptions: pollOptions ?? null,
    pollTotalVotes: totalPollVotes,
    myPollVoteId: myVote,
    parentId: post.parentId,
    repostOfId: post.repostOfId,
    createdAt: post.createdAt,
    author: toPublicUser(post.author),
    repostOf: post.repostOf
      ? {
          id: post.repostOf.id,
          content: post.repostOf.content,
          imageUrl: post.repostOf.imageUrl,
          createdAt: post.repostOf.createdAt,
          author: toPublicUser(post.repostOf.author),
        }
      : null,
    counts: {
      likes: post._count.likes,
      reposts: post._count.quotes,
      comments: post._count.comments,
    },
    liked: post.likes.length > 0,
    reposted: post.reposts.length > 0,
    hashtags: post.hashtags?.map((h) => h.hashtag.tag) ?? [],
  };
}

export const postInclude = (viewerId: string) => ({
  author: true,
  repostOf: { include: { author: true } },
  hashtags: { include: { hashtag: true } },
  pollOptions: {
    orderBy: { sortOrder: "asc" as const },
    include: { _count: { select: { votes: true } } },
  },
  pollVotes: {
    where: { userId: viewerId },
    select: { optionId: true },
    take: 1,
  },
  _count: {
    select: {
      likes: true,
      reposts: true,
      comments: true,
      quotes: true,
    },
  },
  likes: { where: { userId: viewerId }, select: { id: true } },
  reposts: { where: { userId: viewerId }, select: { id: true } },
});
