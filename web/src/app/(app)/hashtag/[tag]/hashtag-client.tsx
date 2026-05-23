"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { searchApi, postsApi } from "@/lib/api";
import type { Post } from "@/lib/types";
import { PostCard } from "@/components/PostCard";

export default function HashtagPage() {
  const tag = (useParams().tag as string).replace(/^#/, "");
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    searchApi.hashtagPosts(tag).then((d) => setPosts(d.posts));
  }, [tag]);

  return (
    <div className="flex h-full flex-col">
      <header className="px-4 py-3">
        <h1 className="text-title text-[var(--accent)]">#{tag}</h1>
      </header>
      <div className="scroll-y no-scrollbar flex-1 space-y-3 px-3 pb-3">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onLike={async () => {
              await postsApi.like(post.id);
              const d = await searchApi.hashtagPosts(tag);
              setPosts(d.posts);
            }}
            onUpdate={async () => {
              const d = await searchApi.hashtagPosts(tag);
              setPosts(d.posts);
            }}
          />
        ))}
        {posts.length === 0 && (
          <p className="text-center text-caption text-[var(--text-secondary)]">
            Нет постов с этим хештегом
          </p>
        )}
      </div>
    </div>
  );
}
