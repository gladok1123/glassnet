import { sqliteHealthCheck } from "./sqlite.js";

export function checkDatabase(): { ok: true } | { ok: false; message: string } {
  return sqliteHealthCheck();
}
