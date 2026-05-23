import { getApiUrl } from "@/lib/api";

/** REST-сигналинг для Vercel (без WebSocket). Локально — Socket.IO. */
export function useRestSignaling(): boolean {
  if (process.env.NEXT_PUBLIC_SIGNALING === "rest") return true;
  if (process.env.NEXT_PUBLIC_SIGNALING === "socket") return false;
  const base = getApiUrl();
  return base.startsWith("/") || base.includes("/backend");
}
