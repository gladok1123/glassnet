"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { messagesApi } from "@/lib/api";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassInput } from "@/components/glass/GlassInput";
import { BackButton } from "@/components/BackButton";
import { AppIcon } from "@/components/icons/AppIcon";
import { Send } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import type { PublicUser } from "@/lib/types";

export default function NewChatPage() {
  const params = useParams();
  const username = params.username as string;
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const sent = useRef(false);

  useEffect(() => {
    let cancelled = false;
    messagesApi
      .open(username)
      .then(({ conversation }) => {
        if (!cancelled) router.replace(`/messages/${conversation.id}`);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Пользователь не найден"
          );
        }
      });
    messagesApi
      .check(username)
      .then((d) => {
        if (!cancelled) setUser(d.user);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [username, router]);

  async function sendFirst() {
    const content = text.trim();
    if (!content || sent.current) return;
    setPending(true);
    setError("");
    try {
      const { conversationId } = await messagesApi.sendDirect(
        username,
        content
      );
      sent.current = true;
      router.replace(`/messages/${conversationId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка отправки");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <header className="glass-strong flex items-center gap-2 px-4 py-3">
        <BackButton onClick={() => router.push("/messages")} label="Назад" />
        <h1 className="text-title">Новый чат</h1>
      </header>
      {user && (
        <div className="flex items-center gap-3 px-4 py-3">
          <UserAvatar user={user} size="md" linked={false} />
          <div>
            <p className="font-semibold">{user.displayName}</p>
            <p className="text-caption text-[var(--text-secondary)]">
              @{user.username}
            </p>
          </div>
        </div>
      )}
      <div className="flex flex-1 flex-col justify-end px-3 pb-3">
        <p className="mb-3 text-center text-caption text-[var(--text-secondary)]">
          Открываем диалог…
        </p>
        {error && (
          <p className="mb-2 text-center text-sm text-[var(--danger)]">{error}</p>
        )}
        <div className="glass-strong flex gap-2 rounded-2xl p-3">
          <GlassInput
            placeholder="Сообщение…"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendFirst()}
          />
          <GlassButton
            onClick={sendFirst}
            disabled={pending || !text.trim()}
            className="!px-4"
          >
            <AppIcon icon={Send} size="md" className="text-white" />
          </GlassButton>
        </div>
      </div>
    </div>
  );
}
