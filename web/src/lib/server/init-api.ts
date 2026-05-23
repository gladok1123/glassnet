import { resolveDatabaseUrl } from "../../../../api/dist/lib/database.js";
import { getSqlite } from "../../../../api/dist/lib/sqlite.js";

let initialized = false;

export function initApi() {
  if (initialized) return;
  resolveDatabaseUrl();
  getSqlite();
  initialized = true;
}

initApi();
