"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Repeat2 } from "lucide-react";
import type { Post } from "@/lib/types";
import { mediaUrl } from "@/lib/media";
import { GlassCard } from "./glass/GlassCard";
import { AppIcon } from "./icons/AppIcon";
import { UserAvatar } from "./UserAvatar";
import { QuotePostPreview } from "./QuotePostPreview";
import { PollBlock } from "./PollBlock";
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

function ActionCount({ value }: { value: number }) {
  if (!value) return null;
  return (
    <span className="text-caption font-medium tabular-nums">{value}</span>
  );
}

type Props = {
  post: Post;
  onLike: () => void;
  onUpdate?: () => void;
  compact?: boolean;
};

export function PostCard({ post, onLike, onUpdate, compact }: Props) {
  const router = useRouter();
  const imageSrc = mediaUrl(post.imageUrl);
  const audioSrc = mediaUrl(post.audioUrl);

  function handleRepost() {
    router.push(`/compose?repost=${post.id}`);
  }

  return (
    <GlassCard className="p-[clamp(14px,3.5vw,18px)]">
      <div className="flex gap-[clamp(10px,2.5vw,14px)]">
        <UserAvatar user={post.author} size="md" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-1 text-caption">
            <Link
              href={`/profile/${post.author.username}`}
              className="font-semibold hover:underline"
              style={{ fontSize: "var(--text-body)" }}
            >
              {post.author.displayName}
            </Link>
            <span className="text-[var(--text-secondary)]">
              @{post.author.username}
            </span>
            <span className="text-[var(--text-secondary)]">·</span>
            <span className="text-[var(--text-secondary)]">
              {timeAgo(post.createdAt)}
            </span>
          </div>
          {post.content && (
            <Link href={`/post/${post.id}`}>
              <p className="mt-1 whitespace-pre-wrap leading-relaxed">
                {post.content}
              </p>
            </Link>
          )}
          {post.hashtags?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {post.hashtags.map((tag) => (
                <Link
                  key={tag}
                  href={`/hashtag/${tag}`}
                  className="text-caption font-medium text-[var(--accent)] hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  #{tag}
                </Link>
              ))}
            </div>
          )}
          {imageSrc && (
            <Link href={`/post/${post.id}`} className="mt-2 block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageSrc}
                alt=""
                className="max-h-80 w-full rounded-2xl object-cover"
              />
            </Link>
          )}
          {audioSrc && (
            <audio
              controls
              src={audioSrc}
              className="mt-2 w-full max-w-md"
              preload="metadata"
            />
          )}
          <PollBlock post={post} onVoted={() => onUpdate?.()} />
          {post.repostOf && <QuotePostPreview quote={post.repostOf} />}
          {!compact && (
            <div className="mt-3 flex max-w-sm justify-between gap-1">
              <Link
                href={`/post/${post.id}`}
                className={cn("icon-btn", "hover:text-[var(--accent)]")}
              >
                <AppIcon icon={MessageCircle} size="action" />
                <ActionCount value={post.counts.comments} />
              </Link>
              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={handleRepost}
                className="icon-btn hover:text-emerald-400"
                aria-label="Репост"
              >
                <AppIcon icon={Repeat2} size="action" />
                <ActionCount value={post.counts.reposts} />
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={onLike}
                className={cn(
                  "icon-btn",
                  post.liked && "icon-btn-active text-pink-400"
                )}
              >
                <Heart
                  className={cn(
                    "icon-size-action shrink-0 transition-colors",
                    post.liked ? "text-pink-400" : "text-current"
                  )}
                  strokeWidth={2}
                  fill={post.liked ? "currentColor" : "none"}
                />
                <ActionCount value={post.counts.likes} />
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
