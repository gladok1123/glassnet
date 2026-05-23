import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DB_NAME = "glassnet.db";

/** Путь к файлу БД в репозитории (коммитится в GitHub). */
export function bundledDatabasePath(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const fromDist = path.resolve(here, "../../prisma", DB_NAME);
  if (fs.existsSync(fromDist)) return fromDist;
  const fromApi = path.resolve(process.cwd(), "prisma", DB_NAME);
  if (fs.existsSync(fromApi)) return fromApi;
  return path.resolve(process.cwd(), "api/prisma", DB_NAME);
}

/** На Vercel — копия в /tmp (только там можно писать). Локально — файл из репо. */
export function resolveDatabaseUrl(): string {
  const bundled = bundledDatabasePath();
  const runtime = path.join("/tmp", DB_NAME);

  if (process.env.VERCEL) {
    if (!fs.existsSync(runtime) && fs.existsSync(bundled)) {
      fs.copyFileSync(bundled, runtime);
    }
    const url = `file:${runtime}`;
    process.env.DATABASE_URL = url;
    return url;
  }

  const url =
    process.env.DATABASE_URL?.trim() ||
    (fs.existsSync(bundled) ? `file:${bundled}` : "file:./glassnet.db");
  process.env.DATABASE_URL = url;
  return url;
}
