import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type Database from "better-sqlite3";

const MIGRATION_DIR = "20250523120000_init";

function findMigrationSql(): string | null {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(here, "../../prisma/migrations", MIGRATION_DIR, "migration.sql"),
    path.resolve(process.cwd(), "prisma/migrations", MIGRATION_DIR, "migration.sql"),
    path.resolve(process.cwd(), "api/prisma/migrations", MIGRATION_DIR, "migration.sql"),
    path.join("/var/task", "api/prisma/migrations", MIGRATION_DIR, "migration.sql"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return fs.readFileSync(p, "utf8");
  }
  return null;
}

export function ensureSchema(db: Database.Database): void {
  const hasUser = db
    .prepare(
      `SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'User'`
    )
    .get();
  if (hasUser) return;

  const sql = findMigrationSql();
  if (!sql) {
    throw new Error(
      "Таблицы не найдены и migration.sql отсутствует в деплое. Проверьте api/prisma/migrations в репозитории."
    );
  }
  db.exec(sql);
}
