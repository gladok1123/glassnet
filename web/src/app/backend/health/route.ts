import { initApi } from "@/lib/server/init-api";
import { checkDatabase } from "../../../../../api/dist/lib/db.js";
import { validateEnv } from "../../../../../api/dist/lib/env.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET() {
  try {
    initApi();
    if (process.env.NODE_ENV === "production") validateEnv();
    const db = checkDatabase();
    if (!db.ok) {
      return Response.json(
        {
          ok: false,
          db: false,
          error: "database_unreachable",
          message: db.message,
        },
        { status: 503 }
      );
    }
    return Response.json({
      ok: true,
      db: true,
      name: "GlassNet API",
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "init_failed";
    return Response.json({ ok: false, error: message }, { status: 500 });
  }
}
