const requiredProd = ["JWT_SECRET", "JWT_REFRESH_SECRET", "MESSAGE_ENCRYPTION_KEY"];

export function validateEnv() {
  if (process.env.NODE_ENV !== "production") return;

  for (const key of requiredProd) {
    if (!process.env[key]) {
      throw new Error(`Missing required env: ${key}`);
    }
  }
  const encKey = process.env.MESSAGE_ENCRYPTION_KEY ?? "";
  if (encKey.length < 32) {
    throw new Error("MESSAGE_ENCRYPTION_KEY must be at least 32 characters");
  }
  if ((process.env.JWT_SECRET?.length ?? 0) < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters in production");
  }
}
