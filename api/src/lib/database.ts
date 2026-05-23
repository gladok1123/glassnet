import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DB_NAME = "glassnet.db";

function findBundledDatabase(): string | null {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const candidates = [
    path.resolve(here, "../../prisma", DB_NAME),
    path.resolve(process.cwd(), "api/prisma", DB_NAME),
    path.resolve(process.cwd(), "prisma", DB_NAME),
    path.resolve(process.cwd(), "../api/prisma", DB_NAME),
    path.join("/var/task", "api/prisma", DB_NAME),
    path.join("/var/task", "web", "../api/prisma", DB_NAME),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

/** Путь к файлу БД в репозитории (коммитится в GitHub). */
export function bundledDatabasePath(): string {
  return findBundledDatabase() ?? path.resolve(process.cwd(), "api/prisma", DB_NAME);
}

/** На Vercel — копия в /tmp (только там можно писать). Локально — файл из репо. */
export function resolveDatabaseUrl(): string {
  const bundled = findBundledDatabase();
  const runtime = path.join("/tmp", DB_NAME);

  if (process.env.VERCEL) {
    if (!fs.existsSync(runtime)) {
      if (bundled) {
        fs.copyFileSync(bundled, runtime);
      } else {
        console.error(
          "[glassnet] glassnet.db not found in serverless bundle. Checked api/prisma paths."
        );
      }
    }
    const url = `file:${runtime}`;
    process.env.DATABASE_URL = url;
    return url;
  }

  const url =
    process.env.DATABASE_URL?.trim() ||
    (bundled ? `file:${bundled}` : "file:./glassnet.db");
  process.env.DATABASE_URL = url;
  return url;
}
