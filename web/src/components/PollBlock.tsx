"use client";

import type { Post } from "@/lib/types";
import { postsApi } from "@/lib/api";
import { GlassButton } from "@/components/glass/GlassButton";
import { cn } from "@/lib/cn";

type Props = {
  post: Post;
  onVoted: () => void;
};

export function PollBlock({ post, onVoted }: Props) {
  if (post.postType !== "poll" || !post.pollOptions?.length) return null;

  const total = post.pollTotalVotes || 0;
  const voted = Boolean(post.myPollVoteId);

  async function vote(optionId: string) {
    await postsApi.votePoll(post.id, optionId);
    onVoted();
  }

  return (
    <div className="mt-3 space-y-2 rounded-2xl border border-white/10 bg-white/5 p-3">
      <p className="font-semibold">{post.pollQuestion}</p>
      {post.pollOptions.map((opt) => {
        const pct =
          total > 0 ? Math.round((opt.votesCount / total) * 100) : 0;
        const selected = post.myPollVoteId === opt.id;
        return (
          <div key={opt.id} className="relative overflow-hidden rounded-xl">
            {voted && (
              <div
                className="absolute inset-y-0 left-0 bg-[var(--accent-soft)]"
                style={{ width: `${pct}%` }}
              />
            )}
            {voted ? (
              <div
                className={cn(
                  "relative flex justify-between px-3 py-2 text-sm",
                  selected && "font-semibold text-[var(--accent)]"
                )}
              >
                <span>{opt.text}</span>
                <span className="text-caption">{pct}%</span>
              </div>
            ) : (
              <GlassButton
                variant="ghost"
                full
                className="relative !justify-start !text-left"
                onClick={() => vote(opt.id)}
              >
                {opt.text}
              </GlassButton>
            )}
          </div>
        );
      })}
      <p className="text-caption text-[var(--text-secondary)]">
        {total} {total === 1 ? "голос" : total < 5 ? "голоса" : "голосов"}
      </p>
    </div>
  );
}
