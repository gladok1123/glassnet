"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ImagePlus, Mic, Plus, Trash2, X, BarChart3 } from "lucide-react";
import { postsApi } from "@/lib/api";
import { mediaUrl } from "@/lib/media";
import type { Post } from "@/lib/types";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassTextarea, GlassInput } from "@/components/glass/GlassInput";
import { QuotePostPreview } from "@/components/QuotePostPreview";
import { AppIcon } from "@/components/icons/AppIcon";

type Mode = "text" | "poll" | "voice";

function ComposeForm() {
  const repostId = useSearchParams()?.get("repost") ?? null;
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const mediaRecRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [mode, setMode] = useState<Mode>("text");
  const [content, setContent] = useState("");
  const [quote, setQuote] = useState<Post | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!repostId) return;
    postsApi.get(repostId).then((d) => setQuote(d.post));
  }, [repostId]);

  async function onPickImage(file: File | undefined) {
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const url = await postsApi.uploadImage(file);
      setImageUrl(url);
      setPreview(mediaUrl(url));
      setMode("text");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setUploading(false);
    }
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setUploading(true);
        try {
          const file = new File([blob], "voice.webm", { type: "audio/webm" });
          const url = await postsApi.uploadAudio(file);
          setAudioUrl(url);
          setMode("voice");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Ошибка записи");
        } finally {
          setUploading(false);
        }
      };
      mediaRecRef.current = rec;
      rec.start();
      setRecording(true);
      setMode("voice");
    } catch {
      setError("Нет доступа к микрофону");
    }
  }

  function stopRecording() {
    mediaRecRef.current?.stop();
    setRecording(false);
  }

  async function publish() {
    setPending(true);
    setError("");
    try {
      if (mode === "poll") {
        const opts = pollOptions.map((o) => o.trim()).filter(Boolean);
        if (!pollQuestion.trim() || opts.length < 2) {
          setError("Заполните вопрос и минимум 2 варианта");
          return;
        }
        await postsApi.create({
          content: content.trim() || pollQuestion.trim(),
          postType: "poll",
          pollQuestion: pollQuestion.trim(),
          pollOptions: opts,
        });
      } else if (mode === "voice") {
        if (!audioUrl) {
          setError("Запишите голосовое сообщение");
          return;
        }
        await postsApi.create({
          content: content.trim() || "🎙 Голосовое",
          postType: "voice",
          audioUrl,
        });
      } else {
        const text = content.trim();
        if (!text && !imageUrl && !repostId) return;
        await postsApi.create({
          content: text,
          imageUrl: imageUrl ?? undefined,
          repostOfId: repostId ?? undefined,
        });
      }
      router.push("/feed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setPending(false);
    }
  }

  const canPublish =
    mode === "poll"
      ? pollQuestion.trim().length > 0 &&
        pollOptions.filter((o) => o.trim()).length >= 2
      : mode === "voice"
        ? Boolean(audioUrl)
        : Boolean(content.trim() || imageUrl || repostId) && !uploading;

  return (
    <div className="flex h-full flex-col px-4 py-4">
      <h1 className="text-title mb-4">
        {repostId ? "Репост" : "Новый пост"}
      </h1>
      {!repostId && (
        <div className="mb-3 flex gap-1">
          {(
            [
              ["text", "Текст", ImagePlus],
              ["poll", "Опрос", BarChart3],
              ["voice", "Голос", Mic],
            ] as const
          ).map(([m, label, Icon]) => (
            <GlassButton
              key={m}
              variant={mode === m ? "primary" : "ghost"}
              onClick={() => setMode(m)}
              className="flex-1 !py-2 !text-xs"
            >
              <AppIcon icon={Icon} size="xs" className="mr-1 inline" />
              {label}
            </GlassButton>
          ))}
        </div>
      )}
      <GlassCard strong className="flex flex-1 flex-col p-4">
        {quote && <QuotePostPreview quote={quote} />}
        {mode !== "poll" && (
          <GlassTextarea
            rows={5}
            maxLength={500}
            placeholder={
              repostId
                ? "Комментарий к репосту…"
                : mode === "voice"
                  ? "Подпись к голосовому (необязательно)"
                  : "Что нового?"
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="mt-3 flex-1"
          />
        )}
        {mode === "poll" && (
          <div className="mt-3 space-y-2">
            <GlassInput
              placeholder="Вопрос опроса"
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              maxLength={200}
            />
            {pollOptions.map((opt, i) => (
              <div key={i} className="flex gap-2">
                <GlassInput
                  placeholder={`Вариант ${i + 1}`}
                  value={opt}
                  onChange={(e) => {
                    const next = [...pollOptions];
                    next[i] = e.target.value;
                    setPollOptions(next);
                  }}
                  maxLength={80}
                />
                {pollOptions.length > 2 && (
                  <button
                    type="button"
                    onClick={() =>
                      setPollOptions(pollOptions.filter((_, j) => j !== i))
                    }
                    className="icon-btn text-[var(--danger)]"
                    aria-label="Удалить вариант"
                  >
                    <Trash2 className="icon-size-sm" />
                  </button>
                )}
              </div>
            ))}
            {pollOptions.length < 4 && (
              <GlassButton
                variant="ghost"
                onClick={() => setPollOptions([...pollOptions, ""])}
                className="!text-xs"
              >
                <AppIcon icon={Plus} size="xs" className="mr-1" />
                Вариант
              </GlassButton>
            )}
          </div>
        )}
        {mode === "voice" && (
          <div className="mt-3 flex flex-col items-center gap-3 py-4">
            {audioUrl ? (
              <audio
                controls
                src={mediaUrl(audioUrl) ?? undefined}
                className="w-full max-w-sm"
              />
            ) : (
              <p className="text-caption text-[var(--text-secondary)]">
                {recording ? "Идёт запись…" : "Нажмите, чтобы записать"}
              </p>
            )}
            <GlassButton
              variant={recording ? "primary" : "ghost"}
              onClick={recording ? stopRecording : startRecording}
              disabled={uploading}
            >
              <AppIcon icon={Mic} size="md" className="mr-1" />
              {recording
                ? "Остановить"
                : audioUrl
                  ? "Перезаписать"
                  : "Записать"}
            </GlassButton>
            {audioUrl && (
              <button
                type="button"
                className="text-caption text-[var(--danger)]"
                onClick={() => setAudioUrl(null)}
              >
                Удалить запись
              </button>
            )}
          </div>
        )}
        {preview && mode === "text" && (
          <div className="relative mt-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt=""
              className="max-h-56 w-full rounded-2xl object-cover"
            />
            <button
              type="button"
              onClick={() => {
                setImageUrl(null);
                setPreview(null);
              }}
              className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5"
              aria-label="Убрать фото"
            >
              <X className="icon-size-sm text-white" />
            </button>
          </div>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onPickImage(e.target.files?.[0])}
        />
        {mode === "text" && (
          <div className="mt-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="icon-btn text-[var(--accent)]"
            >
              <AppIcon icon={ImagePlus} size="md" />
              <span className="text-caption">
                {uploading ? "Загрузка…" : "Фото"}
              </span>
            </button>
            <p className="text-caption text-[var(--text-secondary)]">
              {content.length}/500
            </p>
          </div>
        )}
        {error && (
          <p className="mt-2 text-sm text-[var(--danger)]">{error}</p>
        )}
        <GlassButton
          className="mt-4"
          full
          disabled={pending || !canPublish}
          onClick={publish}
        >
          {pending ? "Публикация…" : "Опубликовать"}
        </GlassButton>
      </GlassCard>
    </div>
  );
}

export default function ComposePage() {
  return (
    <Suspense
      fallback={
        <p className="p-6 text-center text-[var(--text-secondary)]">
          Загрузка…
        </p>
      }
    >
      <ComposeForm />
    </Suspense>
  );
}
