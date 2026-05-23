"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { voiceApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { VoiceRoom } from "@/lib/types";
import { VoiceCallRoom } from "@/components/VoiceCallRoom";
import { BackButton } from "@/components/BackButton";

export default function VoiceRoomPage() {
  const id = String(useParams()?.id ?? "");
  const roomId = id as string;
  const router = useRouter();
  const { user } = useAuth();
  const [room, setRoom] = useState<VoiceRoom | null>(null);

  const load = useCallback(async () => {
    const data = await voiceApi.get(roomId);
    setRoom(data.room);
    await voiceApi.join(roomId);
  }, [roomId]);

  useEffect(() => {
    load().catch(() => router.replace("/voice"));
  }, [load, router]);

  async function onLeave() {
    try {
      await voiceApi.leave(roomId);
    } catch {
      /* ignore */
    }
    router.push("/voice");
  }

  if (!room || !user) {
    return (
      <p className="p-6 text-center text-[var(--text-secondary)]">Загрузка…</p>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="px-3 pt-2">
        <BackButton onClick={() => void onLeave()} label="Комнаты" />
      </div>
      <VoiceCallRoom
        room={room}
        myUserId={user.id}
        onLeave={() => void onLeave()}
      />
    </div>
  );
}
