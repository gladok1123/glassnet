import { handleRegister } from "../../../../../../api/dist/handlers/auth.js";
import { runApiHandler } from "@/lib/server/json-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  const body = await request.json();
  return runApiHandler(() => handleRegister(body));
}
