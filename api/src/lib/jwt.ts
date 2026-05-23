import jwt from "jsonwebtoken";

const accessSecret = process.env.JWT_SECRET ?? "dev-secret";
const refreshSecret = process.env.JWT_REFRESH_SECRET ?? "dev-refresh";

export type TokenPayload = { userId: string };

export function signAccessToken(userId: string) {
  return jwt.sign({ userId } satisfies TokenPayload, accessSecret, {
    expiresIn: "15m",
  });
}

export function signRefreshToken(userId: string) {
  return jwt.sign({ userId } satisfies TokenPayload, refreshSecret, {
    expiresIn: "30d",
  });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, accessSecret) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, refreshSecret) as TokenPayload;
}
