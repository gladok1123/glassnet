"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { notificationsApi } from "@/lib/api";
import type { Notification } from "@/lib/types";
import { GlassCard } from "@/components/glass/GlassCard";
import { NotificationIcon } from "@/components/icons/NotificationIcon";
import { AppIcon } from "@/components/icons/AppIcon";

const labels: Record<string, string> = {
  like: "лайкнул ваш пост",
  comment: "прокомментировал",
  follow: "подписался на вас",
  repost: "сделал репост",
};

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);

  useEffect(() => {
    notificationsApi.list().then((d) => setItems(d.notifications));
    notificationsApi.readAll();
  }, []);

  return (
    <div className="flex h-full flex-col">
      <header className="glass-strong px-4 py-3">
        <h1 className="text-title">Уведомления</h1>
      </header>
      <div className="scroll-y no-scrollbar flex-1 space-y-2 px-3 py-3">
        {items.length === 0 && (
          <p className="text-center text-caption text-[var(--text-secondary)]">
            Пока нет уведомлений
          </p>
        )}
        {items.map((n) => (
          <GlassCard
            key={n.id}
            className={`flex items-start gap-3 p-4 ${
              !n.read ? "border-[var(--accent)]/40" : ""
            }`}
          >
            <NotificationIcon type={n.type} />
            <div className="min-w-0 flex-1">
              {n.actor ? (
                <p className="text-caption leading-relaxed sm:text-[var(--text-body)]">
                  <Link
                    href={`/profile/${n.actor.username}`}
                    className="font-semibold text-[var(--accent)]"
                  >
                    {n.actor.displayName}
                  </Link>{" "}
                  {labels[n.type] ?? n.type}
                </p>
              ) : (
                <p className="text-caption">{n.type}</p>
              )}
            </div>
            {n.postId && (
              <Link
                href={`/post/${n.postId}`}
                className="icon-btn shrink-0 !min-h-0 !min-w-0 !p-2"
                aria-label="Открыть пост"
              >
                <AppIcon icon={ChevronRight} size="md" className="text-[var(--accent)]" />
              </Link>
            )}
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
