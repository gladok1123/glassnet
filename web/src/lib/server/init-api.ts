import { resolveDatabaseUrl } from "../../../../api/dist/lib/database.js";

let initialized = false;

/** Только путь к БД; открытие — при первом запросе (не на этапе next build). */
export function initApi() {
  if (initialized) return;
  resolveDatabaseUrl();
  initialized = true;
}
