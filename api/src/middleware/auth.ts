import type { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../lib/jwt.js";

export type AuthedRequest = Request & { userId?: string };

export function requireAuth(
  req: AuthedRequest,
  res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Требуется авторизация" });
    return;
  }
  try {
    const { userId } = verifyAccessToken(header.slice(7));
    req.userId = userId;
    next();
  } catch {
    res.status(401).json({ error: "Недействительный токен" });
  }
}
