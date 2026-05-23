"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassInput } from "@/components/glass/GlassInput";

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    email: "",
    username: "",
    displayName: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      await register(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка регистрации");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="scroll-y h-full px-5 py-8">
      <h1 className="text-title mb-6">Регистрация</h1>
      <GlassCard strong className="p-6">
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <GlassInput
            placeholder="Email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <GlassInput
            placeholder="Имя пользователя (латиница)"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
          />
          <GlassInput
            placeholder="Отображаемое имя"
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
          />
          <GlassInput
            type="password"
            placeholder="Пароль (мин. 6)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          {error && (
            <p className="text-sm text-[var(--danger)]">{error}</p>
          )}
          <GlassButton type="submit" full disabled={pending}>
            {pending ? "Создание…" : "Создать аккаунт"}
          </GlassButton>
        </form>
        <p className="mt-4 text-center text-sm text-[var(--text-secondary)]">
          <Link href="/login" className="text-[var(--accent)]">
            Уже есть аккаунт
          </Link>
        </p>
      </GlassCard>
    </div>
  );
}
