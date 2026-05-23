import { initApi } from "./init-api";
import { validateEnv } from "../../../../api/dist/lib/env.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function runApiHandler(
  fn: () => Promise<{ status: number; body: unknown }>
): Promise<Response> {
  try {
    initApi();
    if (process.env.NODE_ENV === "production") validateEnv();
    const result = await fn();
    return Response.json(result.body, { status: result.status });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal error";
    console.error("[api]", message);
    return Response.json(
      {
        error: message,
        hint: message.includes("JWT") || message.includes("ENCRYPTION")
          ? "Задайте JWT_SECRET, JWT_REFRESH_SECRET, MESSAGE_ENCRYPTION_KEY в Vercel"
          : message.includes("Unable to open") || message.includes("database")
            ? "База glassnet.db не найдена в деплое — сделайте Redeploy"
            : undefined,
      },
      { status: 500 }
    );
  }
}
