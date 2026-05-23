"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shuffle } from "lucide-react";
import { searchApi, usersApi } from "@/lib/api";
import { AppIcon } from "@/components/icons/AppIcon";
import type { HashtagResult, Post, PublicUser } from "@/lib/types";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassInput } from "@/components/glass/GlassInput";
import { GlassCard } from "@/components/glass/GlassCard";
import { PostCard } from "@/components/PostCard";
import { UserAvatar } from "@/components/UserAvatar";
import { postsApi } from "@/lib/api";

type MainTab = "popular" | "search";
type SearchTab = "users" | "posts" | "hashtags";

export default function DiscoverPage() {
  const [mainTab, setMainTab] = useState<MainTab>("popular");
  const [searchTab, setSearchTab] = useState<SearchTab>("users");
  const [query, setQuery] = useState("");
  const [popular, setPopular] = useState<PublicUser[]>([]);
  const [users, setUsers] = useState<PublicUser[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [hashtags, setHashtags] = useState<HashtagResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [shuffling, setShuffling] = useState(false);

  useEffect(() => {
    usersApi.popular().then((d) => setPopular(d.users));
  }, []);

  async function shufflePopular() {
    setShuffling(true);
    try {
      const d = await usersApi.popular(true);
      setPopular(d.users);
    } finally {
      setShuffling(false);
    }
  }

  async function runSearch() {
    const q = query.trim();
    if (q.length < 2 && searchTab !== "hashtags") return;
    if (searchTab === "hashtags" && q.length < 1) return;
    setLoading(true);
    try {
      if (searchTab === "users") {
        const d = await searchApi.users(q);
        setUsers(d.users);
      } else if (searchTab === "posts") {
        const d = await searchApi.posts(q);
        setPosts(d.posts);
      } else {
        const d = await searchApi.hashtags(q);
        setHashtags(d.hashtags);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="sticky top-0 z-20 space-y-2 px-3 pb-2 pt-3">
        <div className="flex gap-2">
          {(["popular", "search"] as const).map((t) => (
            <GlassButton
              key={t}
              variant={mainTab === t ? "primary" : "ghost"}
              onClick={() => setMainTab(t)}
              className="flex-1 !py-2 !text-xs"
            >
              {t === "popular" ? "Популярные" : "Поиск"}
            </GlassButton>
          ))}
        </div>
        {mainTab === "search" && (
          <>
            <div className="flex gap-1">
              {(["users", "posts", "hashtags"] as const).map((t) => (
                <GlassButton
                  key={t}
                  variant={searchTab === t ? "primary" : "ghost"}
                  onClick={() => setSearchTab(t)}
                  className="!px-2 !py-1 !text-[10px]"
                >
                  {t === "users"
                    ? "Люди"
                    : t === "posts"
                      ? "Посты"
                      : "Хештеги"}
                </GlassButton>
              ))}
            </div>
            <div className="flex gap-2">
              <GlassInput
                placeholder={
                  searchTab === "hashtags" ? "#тег" : "Поиск…"
                }
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSearch()}
              />
              <GlassButton onClick={runSearch}>Найти</GlassButton>
            </div>
          </>
        )}
      </div>

      <div className="scroll-y no-scrollbar flex-1 space-y-2 px-3 pb-3">
        {mainTab === "popular" && (
          <div className="flex justify-end pb-1">
            <GlassButton
              variant="ghost"
              onClick={shufflePopular}
              disabled={shuffling}
              className="!py-2 !text-xs"
            >
              <AppIcon icon={Shuffle} size="sm" className="mr-1" />
              {shuffling ? "Перемешиваем…" : "Перемешать"}
            </GlassButton>
          </div>
        )}
        {mainTab === "popular" &&
          popular.map((u) => (
            <Link key={u.id} href={`/profile/${u.username}`}>
              <GlassCard className="flex items-center gap-3 p-4">
                <UserAvatar user={u} size="md" linked={false} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{u.displayName}</p>
                  <p className="text-caption text-[var(--text-secondary)]">
                    @{u.username}
                  </p>
                </div>
                <span className="text-caption text-[var(--accent)]">
                  {u.followers ?? 0} подп.
                </span>
              </GlassCard>
            </Link>
          ))}

        {mainTab === "search" && loading && (
          <p className="text-center text-caption text-[var(--text-secondary)]">
            Поиск…
          </p>
        )}

        {mainTab === "search" &&
          searchTab === "users" &&
          users.map((u) => (
            <Link key={u.id} href={`/profile/${u.username}`}>
              <GlassCard className="flex items-center gap-3 p-4">
                <UserAvatar user={u} linked={false} />
                <div>
                  <p className="font-semibold">{u.displayName}</p>
                  <p className="text-caption text-[var(--text-secondary)]">
                    @{u.username}
                  </p>
                </div>
              </GlassCard>
            </Link>
          ))}

        {mainTab === "search" &&
          searchTab === "posts" &&
          posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={async () => {
                await postsApi.like(post.id);
                runSearch();
              }}
            />
          ))}

        {mainTab === "search" &&
          searchTab === "hashtags" &&
          hashtags.map((h) => (
            <Link key={h.tag} href={`/hashtag/${h.tag}`}>
              <GlassCard className="flex items-center justify-between p-4">
                <span className="font-semibold text-[var(--accent)]">
                  #{h.tag}
                </span>
                <span className="text-caption text-[var(--text-secondary)]">
                  {h.postsCount} постов
                </span>
              </GlassCard>
            </Link>
          ))}
      </div>
    </div>
  );
}
