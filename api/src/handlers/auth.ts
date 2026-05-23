import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "../lib/jwt.js";
import { getSqlite } from "../lib/sqlite.js";
import type { PublicUser } from "../lib/userPublic.js";

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

type UserRow = {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
};

function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    bio: row.bio,
    avatarUrl: row.avatarUrl,
    bannerUrl: row.bannerUrl,
    createdAt: new Date(row.createdAt),
  };
}

export async function handleRegister(body: unknown): Promise<HandlerResult> {
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, body: { error: "Проверьте email, имя и пароль (мин. 6)" } };
  }
  const { email, username, displayName, password } = parsed.data;
  const db = getSqlite();
  const existing = db
    .prepare(
      `SELECT id FROM User WHERE email = ? OR username = ? LIMIT 1`
    )
    .get(email, username) as { id: string } | undefined;
  if (existing) {
    return { status: 409, body: { error: "Email или имя пользователя заняты" } };
  }
  const passwordHash = await bcrypt.hash(password, 8);
  const id = randomUUID();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO User (id, email, username, displayName, bio, passwordHash, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, '', ?, ?, ?)`
  ).run(id, email, username, displayName, passwordHash, now, now);
  const row = db.prepare(`SELECT * FROM User WHERE id = ?`).get(id) as UserRow;
  return {
    status: 201,
    body: {
      user: toPublicUser(row),
      accessToken: signAccessToken(id),
      refreshToken: signRefreshToken(id),
    },
  };
}

export async function handleLogin(body: unknown): Promise<HandlerResult> {
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return { status: 400, body: { error: "Неверные данные" } };
  }
  const { login, password } = parsed.data;
  const username = login.replace(/^@/, "");
  const db = getSqlite();
  const row = db
    .prepare(
      `SELECT * FROM User WHERE email = ? OR username = ? LIMIT 1`
    )
    .get(login, username) as UserRow | undefined;
  if (!row || !(await bcrypt.compare(password, row.passwordHash))) {
    return { status: 401, body: { error: "Неверный логин или пароль" } };
  }
  return {
    status: 200,
    body: {
      user: toPublicUser(row),
      accessToken: signAccessToken(row.id),
      refreshToken: signRefreshToken(row.id),
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
    const row = getSqlite()
      .prepare(`SELECT * FROM User WHERE id = ?`)
      .get(userId) as UserRow | undefined;
    if (!row) {
      return { status: 401, body: { error: "Пользователь не найден" } };
    }
    return {
      status: 200,
      body: {
        accessToken: signAccessToken(row.id),
        refreshToken: signRefreshToken(row.id),
      },
    };
  } catch {
    return { status: 401, body: { error: "Недействительный refresh token" } };
  }
}

export async function handleMe(userId: string): Promise<HandlerResult> {
  const row = getSqlite()
    .prepare(`SELECT * FROM User WHERE id = ?`)
    .get(userId) as UserRow | undefined;
  if (!row) {
    return { status: 404, body: { error: "Не найден" } };
  }
  return { status: 200, body: { user: toPublicUser(row) } };
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
