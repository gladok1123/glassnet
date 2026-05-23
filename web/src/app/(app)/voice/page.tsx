"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Headphones, Plus } from "lucide-react";
import { voiceApi } from "@/lib/api";
import type { VoiceRoom } from "@/lib/types";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassInput } from "@/components/glass/GlassInput";
import { AppIcon } from "@/components/icons/AppIcon";

export default function VoiceHubPage() {
  const [rooms, setRooms] = useState<VoiceRoom[]>([]);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  function load() {
    voiceApi.list().then((d) => setRooms(d.rooms));
  }

  useEffect(() => {
    load();
  }, []);

  async function createRoom() {
    const n = name.trim();
    if (n.length < 2) return;
    setCreating(true);
    try {
      await voiceApi.create({ name: n });
      setName("");
      setShowForm(false);
      load();
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <header className="sticky top-0 z-20 glass-strong px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AppIcon icon={Headphones} size="md" className="text-[var(--accent)]" />
            <div>
              <h1 className="text-title">Голосовые</h1>
              <p className="text-caption text-[var(--text-secondary)]">
                E2E · демонстрация экрана
              </p>
            </div>
          </div>
          <GlassButton
            variant="ghost"
            onClick={() => setShowForm((v) => !v)}
            className="!px-3"
          >
            <AppIcon icon={Plus} size="sm" />
          </GlassButton>
        </div>
        {showForm && (
          <div className="mt-3 flex gap-2">
            <GlassInput
              placeholder="Название комнаты"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={48}
            />
            <GlassButton
              onClick={createRoom}
              disabled={creating || name.trim().length < 2}
            >
              Создать
            </GlassButton>
          </div>
        )}
      </header>

      <div className="scroll-y no-scrollbar flex-1 space-y-2 p-3">
        {rooms.map((room) => (
          <Link key={room.id} href={`/voice/${room.id}`}>
            <GlassCard className="p-4">
              <p className="font-semibold">{room.name}</p>
              {room.description && (
                <p className="mt-1 text-caption text-[var(--text-secondary)] line-clamp-2">
                  {room.description}
                </p>
              )}
              <p className="mt-2 text-caption text-[var(--accent)]">
                {room.membersCount} / {room.maxMembers} · @{room.owner.username}
              </p>
            </GlassCard>
          </Link>
        ))}
        {rooms.length === 0 && (
          <GlassCard className="p-8 text-center text-caption text-[var(--text-secondary)]">
            Нет комнат. Создайте первую — как сервер в Discord
          </GlassCard>
        )}
      </div>
    </div>
  );
}
