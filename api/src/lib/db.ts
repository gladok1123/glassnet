import { prisma } from "./prisma.js";

export async function checkDatabase(): Promise<{ ok: true } | { ok: false; message: string }> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "database_unreachable";
    return { ok: false, message };
  }
}
