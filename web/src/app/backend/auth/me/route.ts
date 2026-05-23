import {
  getUserIdFromAuthHeader,
  handleMe,
} from "../../../../../../api/dist/handlers/auth.js";
import { runApiHandler } from "@/lib/server/json-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const userId = getUserIdFromAuthHeader(request.headers.get("authorization"));
  if (!userId) {
    return Response.json({ error: "Требуется авторизация" }, { status: 401 });
  }
  return runApiHandler(() => handleMe(userId));
}
