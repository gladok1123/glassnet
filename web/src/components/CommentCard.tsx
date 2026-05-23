"use client";

import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import type { Post } from "@/lib/types";
import { UserAvatar } from "./UserAvatar";
import { cn } from "@/lib/cn";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "сейчас";
  if (m < 60) return `${m} мин`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч`;
  return `${Math.floor(h / 24)} д`;
}

type Props = {
  comment: Post;
  onLike: () => void;
};

export function CommentCard({ comment, onLike }: Props) {
  return (
    <div className="relative pl-3">
      <span
        className="absolute left-0 top-0 bottom-0 w-0.5 rounded-full bg-white/15"
        aria-hidden
      />
      <div className="glass rounded-2xl p-3">
        <div className="flex gap-2.5">
          <UserAvatar user={comment.author} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-1 text-caption">
              <span className="font-semibold">{comment.author.displayName}</span>
              <span className="text-[var(--text-secondary)]">
                @{comment.author.username}
              </span>
              <span className="text-[var(--text-secondary)]">· {timeAgo(comment.createdAt)}</span>
            </div>
            <p className="mt-1 text-caption leading-relaxed sm:text-[var(--text-body)]">
              {comment.content}
            </p>
            <motion.button
              type="button"
              whileTap={{ scale: 0.92 }}
              onClick={onLike}
              className={cn(
                "icon-btn mt-2 !min-h-0 !min-w-0 !px-2 !py-1",
                comment.liked && "text-pink-400"
              )}
            >
              <Heart
                className="icon-size-sm"
                strokeWidth={2}
                fill={comment.liked ? "currentColor" : "none"}
              />
              {comment.counts.likes > 0 && (
                <span className="text-caption tabular-nums">
                  {comment.counts.likes}
                </span>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
