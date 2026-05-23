import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../lib/jwt.js";
import { toPublicUser } from "../lib/userPublic.js";

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

type HandlerResult = { status: number; body: unknown };

export async function handleRegister(body: unknown): Promise<HandlerResult> {
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, body: { error: "Проверьте email, имя и пароль (мин. 6)" } };
  }
  const { email, username, displayName, password } = parsed.data;
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    return { status: 409, body: { error: "Email или имя пользователя заняты" } };
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, username, displayName, passwordHash },
  });
  return {
    status: 201,
    body: {
      user: toPublicUser(user),
      accessToken: signAccessToken(user.id),
      refreshToken: signRefreshToken(user.id),
    },
  };
}

export async function handleLogin(body: unknown): Promise<HandlerResult> {
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, body: { error: "Неверные данные" } };
  }
  const { login, password } = parsed.data;
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: login }, { username: login.replace(/^@/, "") }],
    },
  });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { status: 401, body: { error: "Неверный логин или пароль" } };
  }
  return {
    status: 200,
    body: {
      user: toPublicUser(user),
      accessToken: signAccessToken(user.id),
      refreshToken: signRefreshToken(user.id),
    },
  };
}

export async function handleRefresh(body: unknown): Promise<HandlerResult> {
  const token = (body as { refreshToken?: string })?.refreshToken;
  if (!token) {
    return { status: 400, body: { error: "Нет refresh token" } };
  }
  try {
    const { userId } = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return { status: 401, body: { error: "Пользователь не найден" } };
    }
    return {
      status: 200,
      body: {
        accessToken: signAccessToken(user.id),
        refreshToken: signRefreshToken(user.id),
      },
    };
  } catch {
    return { status: 401, body: { error: "Недействительный refresh token" } };
  }
}

export async function handleMe(userId: string): Promise<HandlerResult> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { status: 404, body: { error: "Не найден" } };
  }
  return { status: 200, body: { user: toPublicUser(user) } };
}

export function getUserIdFromAuthHeader(
  authorization: string | null
): string | null {
  if (!authorization?.startsWith("Bearer ")) return null;
  try {
    return verifyAccessToken(authorization.slice(7)).userId;
  } catch {
    return null;
  }
}
