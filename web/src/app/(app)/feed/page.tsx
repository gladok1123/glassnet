"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { postsApi } from "@/lib/api";
import type { Post } from "@/lib/types";
import { PostCard } from "@/components/PostCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { AppIcon } from "@/components/icons/AppIcon";
import { cn } from "@/lib/cn";

export default function FeedPage() {
  const [tab, setTab] = useState<"home" | "following">("home");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await postsApi.feed(tab);
      setPosts(data.posts);
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleLike(id: string) {
    await postsApi.like(id);
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              liked: !p.liked,
              counts: {
                ...p.counts,
                likes: p.counts.likes + (p.liked ? -1 : 1),
              },
            }
          : p
      )
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-20 flex items-center justify-between gap-2 px-3 pb-2 pt-3">
        <div className="flex gap-2">
          {(["home", "following"] as const).map((t) => (
            <GlassButton
              key={t}
              variant={tab === t ? "primary" : "ghost"}
              onClick={() => setTab(t)}
              className="!py-1.5 !text-xs"
            >
              {t === "home" ? "Для вас" : "Подписки"}
            </GlassButton>
          ))}
        </div>
        <Link
          href="/notifications"
          className={cn("icon-btn !min-h-0 !min-w-0 shrink-0")}
          aria-label="Уведомления"
        >
          <AppIcon icon={Bell} size="md" />
        </Link>
      </div>
      <div className="scroll-y no-scrollbar flex-1 space-y-3 px-3 pb-3">
        {loading && (
          <p className="text-center text-sm text-[var(--text-secondary)]">
            Загрузка…
          </p>
        )}
        {!loading && posts.length === 0 && (
          <p className="glass rounded-2xl p-6 text-center text-sm text-[var(--text-secondary)]">
            Пока пусто. Напишите первый пост или подпишитесь на кого-нибудь.
          </p>
        )}
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onLike={() => toggleLike(post.id)}
            onUpdate={load}
          />
        ))}
      </div>
    </div>
  );
}
