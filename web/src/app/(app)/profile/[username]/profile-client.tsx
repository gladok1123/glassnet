"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Camera } from "lucide-react";
import { usersApi, postsApi, messagesApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { mediaUrl } from "@/lib/media";
import type { Post, PublicUser } from "@/lib/types";
import { PostCard } from "@/components/PostCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassInput } from "@/components/glass/GlassInput";
import { UserAvatar } from "@/components/UserAvatar";
import { AppIcon } from "@/components/icons/AppIcon";

export default function ProfilePage() {
  const router = useRouter();
  const username = String(useParams()?.username ?? "");
  const { logout, refreshUser } = useAuth();
  const avatarRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<PublicUser | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState({ posts: 0, followers: 0, following: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [isSelf, setIsSelf] = useState(false);
  const [bioEdit, setBioEdit] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const data = await usersApi.profile(username);
    setUser(data.user);
    setBioEdit(data.user.bio);
    setPosts(data.posts);
    setStats(data.stats);
    setIsFollowing(data.isFollowing);
    setIsSelf(data.isSelf);
  }, [username]);

  useEffect(() => {
    load();
  }, [load]);

  async function openDm() {
    try {
      const { conversation } = await messagesApi.open(username);
      router.push(`/messages/${conversation.id}`);
    } catch {
      /* ignore */
    }
  }

  async function follow() {
    const { following } = await usersApi.follow(username);
    setIsFollowing(following);
    setStats((s) => ({
      ...s,
      followers: s.followers + (following ? 1 : -1),
    }));
  }

  async function saveBio() {
    setSaving(true);
    try {
      await usersApi.updateMe({ bio: bioEdit });
      await load();
      await refreshUser();
    } finally {
      setSaving(false);
    }
  }

  async function onAvatar(file: File | undefined) {
    if (!file) return;
    const res = await usersApi.uploadAvatar(file);
    if (res.user) setUser(res.user);
    await load();
    await refreshUser();
  }

  async function onBanner(file: File | undefined) {
    if (!file) return;
    const res = await usersApi.uploadBanner(file);
    if (res.user) setUser(res.user);
    await load();
    await refreshUser();
  }

  if (!user) {
    return (
      <p className="p-6 text-center text-[var(--text-secondary)]">Загрузка…</p>
    );
  }

  const bannerSrc = mediaUrl(user.bannerUrl);

  return (
    <div className="scroll-y no-scrollbar h-full pb-4">
      <div className="relative h-36 overflow-hidden rounded-b-3xl sm:h-44">
        {bannerSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={bannerSrc} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-blue-600/50 via-purple-600/40 to-pink-500/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-deep)]/80 to-transparent" />
        {isSelf && (
          <>
            <input
              ref={bannerRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onBanner(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => bannerRef.current?.click()}
              className="absolute right-3 top-3 rounded-full bg-black/40 p-2 backdrop-blur-md"
              aria-label="Сменить баннер"
            >
              <AppIcon icon={Camera} size="sm" className="text-white" />
            </button>
          </>
        )}
      </div>

      <div className="relative -mt-14 px-4">
        <div className="relative inline-block">
          <UserAvatar
            user={user}
            size="lg"
            linked={false}
            className="border-4 border-[var(--bg-deep)]"
          />
          {isSelf && (
            <>
              <input
                ref={avatarRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => onAvatar(e.target.files?.[0])}
              />
              <button
                type="button"
                onClick={() => avatarRef.current?.click()}
                className="absolute bottom-0 right-0 rounded-full bg-[var(--accent)] p-2 shadow-lg"
                aria-label="Сменить аватар"
              >
                <AppIcon icon={Camera} size="xs" className="text-white" />
              </button>
            </>
          )}
        </div>

        <h1 className="mt-2 text-title">{user.displayName}</h1>
        <p className="text-[var(--text-secondary)]">@{user.username}</p>

        {isSelf ? (
          <div className="mt-3 space-y-2">
            <GlassInput
              value={bioEdit}
              onChange={(e) => setBioEdit(e.target.value)}
              placeholder="О себе"
              maxLength={160}
            />
            <GlassButton onClick={saveBio} disabled={saving} variant="ghost">
              {saving ? "Сохранение…" : "Сохранить bio"}
            </GlassButton>
          </div>
        ) : (
          user.bio && (
            <p className="mt-2 text-sm leading-relaxed">{user.bio}</p>
          )
        )}

        <div className="mt-3 flex gap-4 text-sm">
          <span>
            <strong>{stats.posts}</strong>{" "}
            <span className="text-[var(--text-secondary)]">постов</span>
          </span>
          <span>
            <strong>{stats.followers}</strong>{" "}
            <span className="text-[var(--text-secondary)]">подписчиков</span>
          </span>
          <span>
            <strong>{stats.following}</strong>{" "}
            <span className="text-[var(--text-secondary)]">подписок</span>
          </span>
        </div>

        <div className="mt-4 flex gap-2">
          {isSelf ? (
            <GlassButton variant="ghost" onClick={logout}>
              Выйти
            </GlassButton>
          ) : (
            <>
              <GlassButton onClick={follow}>
                {isFollowing ? "Отписаться" : "Подписаться"}
              </GlassButton>
              <GlassButton variant="ghost" onClick={openDm}>
                Написать
              </GlassButton>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 space-y-3 px-3">
        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onLike={async () => {
              await postsApi.like(post.id);
              load();
            }}
            onUpdate={load}
          />
        ))}
        {posts.length === 0 && (
          <GlassCard className="p-6 text-center text-caption text-[var(--text-secondary)]">
            Нет постов
          </GlassCard>
        )}
      </div>
    </div>
  );
}
