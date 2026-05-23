import Database from "better-sqlite3";
import { resolveDatabaseUrl } from "./database.js";

const globalSqlite = globalThis as unknown as { glassnetSqlite?: Database.Database };

function dbPathFromUrl(): string {
  resolveDatabaseUrl();
  const url = process.env.DATABASE_URL ?? "file:./glassnet.db";
  return url.startsWith("file:") ? url.slice(5) : url;
}

export function getSqlite(): Database.Database {
  if (globalSqlite.glassnetSqlite) return globalSqlite.glassnetSqlite;
  const db = new Database(dbPathFromUrl());
  db.pragma("journal_mode = WAL");
  globalSqlite.glassnetSqlite = db;
  return db;
}

export function sqliteHealthCheck(): { ok: true } | { ok: false; message: string } {
  try {
    getSqlite().prepare("SELECT 1 AS ok").get();
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "database_unreachable";
    return { ok: false, message };
  }
}
