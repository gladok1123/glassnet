import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../lib/jwt.js";
import { toPublicUser } from "../lib/userPublic.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";

const registerSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_]+$/),
  displayName: z.string().min(1).max(50),
  password: z.string().min(6),
});

const loginSchema = z.object({
  login: z.string().min(1),
  password: z.string().min(1),
});

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }
  const { email, username, displayName, password } = parsed.data;
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    res.status(409).json({ error: "Email или имя пользователя заняты" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, username, displayName, passwordHash },
  });
  const accessToken = signAccessToken(user.id);
  const refreshToken = signRefreshToken(user.id);
  res.status(201).json({
    user: toPublicUser(user),
    accessToken,
    refreshToken,
  });
});

authRouter.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Неверные данные" });
    return;
  }
  const { login, password } = parsed.data;
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: login }, { username: login.replace(/^@/, "") }],
    },
  });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: "Неверный логин или пароль" });
    return;
  }
  res.json({
    user: toPublicUser(user),
    accessToken: signAccessToken(user.id),
    refreshToken: signRefreshToken(user.id),
  });
});

authRouter.post("/refresh", async (req, res) => {
  const token = req.body?.refreshToken as string | undefined;
  if (!token) {
    res.status(400).json({ error: "Нет refresh token" });
    return;
  }
  try {
    const { userId } = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      res.status(401).json({ error: "Пользователь не найден" });
      return;
    }
    res.json({
      accessToken: signAccessToken(user.id),
      refreshToken: signRefreshToken(user.id),
    });
  } catch {
    res.status(401).json({ error: "Недействительный refresh token" });
  }
});

authRouter.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
  });
  if (!user) {
    res.status(404).json({ error: "Не найден" });
    return;
  }
  res.json({ user: toPublicUser(user) });
});
