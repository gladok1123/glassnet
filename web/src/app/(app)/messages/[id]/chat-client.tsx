"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { io, type Socket } from "socket.io-client";
import { messagesApi, getApiUrl } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-store";
import { useRestSignaling } from "@/lib/signaling";
import type { Message } from "@/lib/types";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassInput } from "@/components/glass/GlassInput";
import { BackButton } from "@/components/BackButton";
import { AppIcon } from "@/components/icons/AppIcon";
import { Send } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

function upsertMessage(prev: Message[], incoming: Message): Message[] {
  const index = prev.findIndex((m) => m.id === incoming.id);
  if (index >= 0) {
    const next = [...prev];
    next[index] = { ...next[index], ...incoming };
    return next;
  }
  return [...prev, incoming];
}

export default function ChatPage() {
  const conversationId = String(useParams()?.id ?? "");
  const router = useRouter();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const restSignaling = useRestSignaling();

  const load = useCallback(async () => {
    const data = await messagesApi.get(conversationId);
    setMessages(data.messages);
  }, [conversationId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (restSignaling) return;
    const token = getAccessToken();
    if (!token) return;
    const socket = io(getApiUrl(), { auth: { token } });
    socketRef.current = socket;
    socket.emit("conversation:join", conversationId);
    socket.on("message:new", (msg: Message) => {
      if (msg.conversationId && msg.conversationId !== conversationId) return;
      const isMine = msg.sender.id === user?.id;
      setMessages((prev) => upsertMessage(prev, { ...msg, isMine }));
    });
    return () => {
      socket.disconnect();
    };
  }, [conversationId, restSignaling, user?.id]);

  useEffect(() => {
    if (!restSignaling) return;
    const id = setInterval(() => void load(), 3000);
    return () => clearInterval(id);
  }, [load, restSignaling]);

  async function fallbackHttp(content: string) {
    const res = await messagesApi.send(conversationId, content);
    setMessages((prev) => upsertMessage(prev, res.message));
  }

  function send() {
    const content = text.trim();
    if (!content) return;
    setText("");
    const socket = socketRef.current;
    if (!restSignaling && socket?.connected) {
      socket.emit(
        "message:send",
        { conversationId, content },
        (res: { message?: Message; error?: string }) => {
          if (res.message) {
            setMessages((prev) => upsertMessage(prev, res.message!));
          } else if (res.error) {
            void fallbackHttp(content);
          }
        }
      );
    } else {
      void fallbackHttp(content);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <header className="glass-strong flex items-center gap-2 px-4 py-3">
        <BackButton onClick={() => router.push("/messages")} label="Чаты" />
        <h1 className="text-title">Диалог</h1>
      </header>
      <div className="scroll-y no-scrollbar flex-1 space-y-2 px-3 py-3">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`max-w-[85%] rounded-2xl px-4 py-2 ${
              m.isMine
                ? "ml-auto bg-[var(--accent)] text-white"
                : "glass mr-auto"
            }`}
          >
            <p className="whitespace-pre-wrap text-sm">{m.content}</p>
            {m.encrypted && (
              <p className="mt-1 text-[10px] opacity-70">🔒 зашифровано</p>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="glass-strong flex gap-2 p-3">
        <GlassInput
          placeholder="Сообщение…"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <GlassButton onClick={send} disabled={!text.trim()} className="!px-4">
          <AppIcon icon={Send} size="md" className="text-white" />
        </GlassButton>
      </div>
    </div>
  );
}
