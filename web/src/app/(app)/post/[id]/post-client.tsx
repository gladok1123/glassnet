"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { postsApi } from "@/lib/api";
import type { Post } from "@/lib/types";
import { PostCard } from "@/components/PostCard";
import { CommentCard } from "@/components/CommentCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassTextarea } from "@/components/glass/GlassInput";
import { GlassCard } from "@/components/glass/GlassCard";
import { BackButton } from "@/components/BackButton";
import { AppIcon } from "@/components/icons/AppIcon";

export default function PostDetailPage() {
  const id = String(useParams()?.id ?? "");
  const router = useRouter();
  const postId = id as string;
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Post[]>([]);
  const [reply, setReply] = useState("");
  const [pending, setPending] = useState(false);

  const load = useCallback(async () => {
    const data = await postsApi.get(postId);
    setPost(data.post);
    setComments(data.comments);
  }, [postId]);

  useEffect(() => {
    load();
  }, [load]);

  async function sendComment() {
    if (!reply.trim()) return;
    setPending(true);
    try {
      await postsApi.create({ content: reply.trim(), parentId: postId });
      setReply("");
      await load();
    } finally {
      setPending(false);
    }
  }

  if (!post) {
    return (
      <p className="p-6 text-center text-[var(--text-secondary)]">Загрузка…</p>
    );
  }

  return (
    <div className="scroll-y no-scrollbar flex h-full flex-col">
      <header className="glass sticky top-0 z-20 px-4 py-3">
        <BackButton onClick={() => router.back()} />
      </header>
      <div className="space-y-4 px-3 py-3">
        <PostCard
          post={post}
          onLike={async () => {
            await postsApi.like(post.id);
            load();
          }}
          onUpdate={load}
          compact
        />

        <GlassCard className="p-4">
          <div className="mb-3 flex items-center gap-2 text-caption font-semibold text-[var(--text-secondary)]">
            <AppIcon icon={MessageCircle} size="sm" />
            Комментарии · {comments.length}
          </div>
          <GlassTextarea
            rows={2}
            placeholder="Написать комментарий…"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
          />
          <GlassButton
            className="mt-3"
            full
            disabled={pending || !reply.trim()}
            onClick={sendComment}
          >
            Ответить
          </GlassButton>
        </GlassCard>

        <div className="space-y-3 border-t border-white/10 pt-2">
          {comments.map((c) => (
            <CommentCard
              key={c.id}
              comment={c}
              onLike={async () => {
                await postsApi.like(c.id);
                load();
              }}
            />
          ))}
          {comments.length === 0 && (
            <p className="py-4 text-center text-caption text-[var(--text-secondary)]">
              Пока нет комментариев
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
