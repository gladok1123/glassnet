"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { clansApi } from "@/lib/api";
import type { Clan } from "@/lib/types";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassInput } from "@/components/glass/GlassInput";

export default function ClansPage() {
  const [clans, setClans] = useState<Clan[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [desc, setDesc] = useState("");
  const [error, setError] = useState("");

  const load = () => clansApi.list().then((d) => setClans(d.clans));

  useEffect(() => {
    load();
  }, []);

  async function create() {
    setError("");
    try {
      await clansApi.create({ name, tag, description: desc });
      setShowCreate(false);
      setName("");
      setTag("");
      setDesc("");
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-4 py-3">
        <h1 className="text-title">Кланы</h1>
        <GlassButton variant="ghost" onClick={() => setShowCreate((v) => !v)}>
          {showCreate ? "Отмена" : "Создать"}
        </GlassButton>
      </div>

      {showCreate && (
        <GlassCard className="mx-3 mb-3 space-y-2 p-4">
          <GlassInput
            placeholder="Название"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <GlassInput
            placeholder="Тег (TAG)"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
          />
          <GlassInput
            placeholder="Описание"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
          />
          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <GlassButton full onClick={create}>
            Создать клан
          </GlassButton>
        </GlassCard>
      )}

      <div className="scroll-y no-scrollbar flex-1 space-y-2 px-3 pb-3">
        {clans.map((c) => (
          <Link key={c.id} href={`/clans/${c.id}`}>
            <GlassCard className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-bold">{c.name}</p>
                  <p className="text-caption text-[var(--accent)]">[{c.tag}]</p>
                  <p className="mt-1 line-clamp-2 text-caption text-[var(--text-secondary)]">
                    {c.description || "Без описания"}
                  </p>
                </div>
                <span className="text-caption text-[var(--text-secondary)]">
                  {c.membersCount} уч.
                </span>
              </div>
            </GlassCard>
          </Link>
        ))}
        {clans.length === 0 && (
          <p className="text-center text-caption text-[var(--text-secondary)]">
            Пока нет кланов — создайте первый
          </p>
        )}
      </div>
    </div>
  );
}
