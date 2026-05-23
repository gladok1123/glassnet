"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { clansApi } from "@/lib/api";
import type { Clan } from "@/lib/types";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { UserAvatar } from "@/components/UserAvatar";
import { BackButton } from "@/components/BackButton";

export default function ClanDetailPage() {
  const id = String(useParams()?.id ?? "");
  const router = useRouter();
  const [clan, setClan] = useState<Clan | null>(null);

  const load = () => clansApi.get(id as string).then((d) => setClan(d.clan));

  useEffect(() => {
    load();
  }, [id]);

  if (!clan) {
    return (
      <p className="p-6 text-center text-[var(--text-secondary)]">Загрузка…</p>
    );
  }

  async function toggleMember() {
    if (!clan) return;
    if (clan.isMember) {
      await clansApi.leave(clan.id);
    } else {
      await clansApi.join(clan.id);
    }
    load();
  }

  return (
    <div className="scroll-y no-scrollbar h-full pb-4">
      <header className="px-4 py-3">
        <BackButton onClick={() => router.push("/clans")} />
      </header>
      <GlassCard className="mx-3 p-4">
        <h1 className="text-title">{clan.name}</h1>
        <p className="text-[var(--accent)]">[{clan.tag}]</p>
        <p className="mt-2 text-sm leading-relaxed">{clan.description}</p>
        <p className="mt-2 text-caption text-[var(--text-secondary)]">
          {clan.membersCount} участников · владелец {clan.owner.displayName}
        </p>
        {clan.myRole !== "owner" && (
          <GlassButton className="mt-4" onClick={toggleMember}>
            {clan.isMember ? "Покинуть клан" : "Вступить"}
          </GlassButton>
        )}
      </GlassCard>
      <div className="mt-4 space-y-2 px-3">
        {clan.members?.map((m) => (
          <GlassCard key={m.user.id} className="flex items-center gap-3 p-3">
            <UserAvatar user={m.user} size="sm" />
            <div>
              <p className="font-semibold">{m.user.displayName}</p>
              <p className="text-caption text-[var(--text-secondary)]">
                {m.role}
              </p>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
