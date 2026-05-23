"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { GlassNav } from "./glass/GlassNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <div className="relative z-10 flex h-full items-center justify-center">
        <div className="glass rounded-2xl px-6 py-4 text-sm text-[var(--text-secondary)]">
          Загрузка…
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative z-10 flex h-full flex-col"
      style={{ paddingBottom: "clamp(88px, 22vw, 110px)" }}
    >
      {children}
      <GlassNav />
    </div>
  );
}
