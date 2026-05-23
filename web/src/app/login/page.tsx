"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { GlassCard } from "@/components/glass/GlassCard";
import { GlassButton } from "@/components/glass/GlassButton";
import { GlassInput } from "@/components/glass/GlassInput";

export default function LoginPage() {
  const { login } = useAuth();
  const [loginVal, setLoginVal] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setPending(true);
    try {
      await login(loginVal, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка входа");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex h-full flex-col justify-center px-5 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-display tracking-tight">GlassNet</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Лента, лайки, репосты — в стиле iOS
        </p>
      </div>
      <GlassCard strong className="p-6">
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <GlassInput
            placeholder="Email или @username"
            value={loginVal}
            onChange={(e) => setLoginVal(e.target.value)}
            autoComplete="username"
          />
          <GlassInput
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          {error && (
            <p className="text-center text-sm text-[var(--danger)]">{error}</p>
          )}
          <GlassButton type="submit" full disabled={pending}>
            {pending ? "Вход…" : "Войти"}
          </GlassButton>
        </form>
        <p className="mt-4 text-center text-sm text-[var(--text-secondary)]">
          Нет аккаунта?{" "}
          <Link href="/register" className="text-[var(--accent)]">
            Регистрация
          </Link>
        </p>
      </GlassCard>
    </div>
  );
}
