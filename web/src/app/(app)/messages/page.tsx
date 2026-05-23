"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { messagesApi } from "@/lib/api";
import type { ConversationPreview } from "@/lib/types";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassInput } from "@/components/glass/GlassInput";
import { GlassButton } from "@/components/glass/GlassButton";
import { UserAvatar } from "@/components/UserAvatar";

function MessagesContent() {
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [newUser, setNewUser] = useState("");
  const [userError, setUserError] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();

  useEffect(() => {
    messagesApi.list().then((d) => setConversations(d.conversations));
  }, []);

  async function startChat() {
    const username = newUser.replace(/^@/, "").trim();
    if (!username) return;
    setUserError("");
    setPending(true);
    try {
      await messagesApi.check(username);
      const opened = await messagesApi.open(username);
      if (opened.conversation) {
        router.push(`/messages/${opened.conversation.id}`);
      } else {
        router.push(`/messages/new/${username}`);
      }
    } catch (err) {
      setUserError(
        err instanceof Error
          ? err.message
          : "Такого пользователя не существует"
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <header className="glass-strong px-4 py-3">
        <h1 className="text-title">Сообщения</h1>
        <div className="mt-3 flex gap-2">
          <GlassInput
            placeholder="@username"
            value={newUser}
            onChange={(e) => {
              setNewUser(e.target.value);
              setUserError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && startChat()}
          />
          <GlassButton onClick={startChat} disabled={pending}>
            {pending ? "…" : "Чат"}
          </GlassButton>
        </div>
        {userError && (
          <p className="mt-2 text-sm text-[var(--danger)]">{userError}</p>
        )}
      </header>
      <div className="scroll-y no-scrollbar flex-1 space-y-2 px-3 py-3">
        {conversations.map((c) => {
          const other = c.participants[0];
          if (!other) return null;
          return (
            <Link key={c.id} href={`/messages/${c.id}`}>
              <GlassCard className="flex items-center gap-3 p-4">
                <UserAvatar user={other} size="md" linked={false} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{other.displayName}</p>
                  <p className="truncate text-caption text-[var(--text-secondary)]">
                    {c.lastMessage?.content ?? ""}
                  </p>
                </div>
              </GlassCard>
            </Link>
          );
        })}
        {conversations.length === 0 && (
          <p className="text-center text-caption text-[var(--text-secondary)]">
            Здесь только диалоги, в которых уже есть сообщения
          </p>
        )}
      </div>
    </>
  );
}

export default function MessagesPage() {
  return (
    <div className="flex h-full flex-col">
      <Suspense
        fallback={
          <p className="p-6 text-center text-[var(--text-secondary)]">
            Загрузка…
          </p>
        }
      >
        <MessagesContent />
      </Suspense>
    </div>
  );
}
