import { resolveDatabaseUrl } from "../../../../api/dist/lib/database.js";

let initialized = false;

export function initApi() {
  if (initialized) return;
  resolveDatabaseUrl();
  initialized = true;
}

initApi();
