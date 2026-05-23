"use client";

import { useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  PhoneOff,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useVoiceCall } from "@/hooks/useVoiceCall";
import { GlassButton } from "@/components/glass/GlassButton";
import { AppIcon } from "@/components/icons/AppIcon";
import { UserAvatar } from "@/components/UserAvatar";
import type { PublicUser, VoiceRoom } from "@/lib/types";

function RemoteAudio({
  stream,
  userId,
  deafened,
}: {
  stream: MediaStream;
  userId: string;
  deafened: boolean;
}) {
  const ref = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.srcObject = stream;
    el.muted = deafened;
    void el.play().catch(() => undefined);
  }, [stream, deafened]);
  return (
    <audio
      ref={ref}
      data-voice-remote
      autoPlay
      playsInline
      className="hidden"
      aria-label={`Аудио ${userId}`}
    />
  );
}

type Props = {
  room: VoiceRoom;
  myUserId: string;
  onLeave: () => void;
};

export function VoiceCallRoom({ room, myUserId, onLeave }: Props) {
  const {
    remoteStreams,
    muted,
    deafened,
    screenSharing,
    connected,
    error,
    join,
    leave,
    toggleMute,
    toggleDeafen,
    toggleScreen,
  } = useVoiceCall(room.id, myUserId);

  const memberMap = new Map(
    room.members?.map((m) => [m.user.id, m.user]) ?? []
  );

  useEffect(() => {
    void join();
  }, [join]);

  function handleLeave() {
    leave();
    onLeave();
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-white/10 px-4 py-3">
        <h2 className="text-title">{room.name}</h2>
        <p className="text-caption text-[var(--text-secondary)]">
          {connected ? "Подключено · DTLS-SRTP (E2E)" : "Подключение…"}
        </p>
        {room.description && (
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {room.description}
          </p>
        )}
      </div>

      <div className="scroll-y no-scrollbar flex-1 space-y-2 p-3">
        {error && (
          <p className="text-center text-sm text-[var(--danger)]">{error}</p>
        )}
        {Array.from(remoteStreams.entries()).map(([uid, stream]) => {
          const user = memberMap.get(uid);
          return (
            <div
              key={uid}
              className="glass flex items-center gap-3 rounded-2xl p-4"
            >
              {user ? (
                <UserAvatar user={user} size="md" linked={false} />
              ) : (
                <div className="h-12 w-12 rounded-full bg-white/10" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold">
                  {user?.displayName ?? "Участник"}
                </p>
                <p className="text-caption text-emerald-400">В эфире</p>
              </div>
              <RemoteAudio
                stream={stream}
                userId={uid}
                deafened={deafened}
              />
            </div>
          );
        })}
        {remoteStreams.size === 0 && connected && (
          <p className="py-8 text-center text-caption text-[var(--text-secondary)]">
            Ожидание участников… Пригласите друзей в эту комнату
          </p>
        )}
      </div>

      <div className="glass-strong flex flex-wrap items-center justify-center gap-2 border-t border-white/10 p-4">
        <GlassButton
          variant={muted ? "primary" : "ghost"}
          onClick={toggleMute}
          aria-label={muted ? "Включить микрофон" : "Выключить микрофон"}
        >
          <AppIcon icon={muted ? MicOff : Mic} size="md" />
        </GlassButton>
        <GlassButton
          variant={deafened ? "primary" : "ghost"}
          onClick={toggleDeafen}
          aria-label={deafened ? "Включить звук" : "Заглушить всех"}
        >
          <AppIcon icon={deafened ? VolumeX : Volume2} size="md" />
        </GlassButton>
        <GlassButton
          variant={screenSharing ? "primary" : "ghost"}
          onClick={() => void toggleScreen()}
          aria-label="Демонстрация экрана"
        >
          <AppIcon
            icon={screenSharing ? MonitorOff : Monitor}
            size="md"
          />
        </GlassButton>
        <GlassButton variant="ghost" onClick={handleLeave} className="!text-[var(--danger)]">
          <AppIcon icon={PhoneOff} size="md" />
          <span className="ml-1 text-sm">Выйти</span>
        </GlassButton>
      </div>
    </div>
  );
}
