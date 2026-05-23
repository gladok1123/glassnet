import crypto from "node:crypto";

function masterKey(): Buffer {
  const hex = process.env.MESSAGE_ENCRYPTION_KEY;
  if (hex?.length === 64) {
    return Buffer.from(hex, "hex");
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "MESSAGE_ENCRYPTION_KEY must be 64 hex chars (32 bytes) in production"
    );
  }
  return crypto
    .createHash("sha256")
    .update(process.env.JWT_SECRET ?? "glassnet-dev-key")
    .digest();
}

function conversationKey(conversationId: string): Buffer {
  return crypto
    .createHmac("sha256", masterKey())
    .update(`dm:${conversationId}`)
    .digest();
}

export function encryptMessage(plaintext: string, conversationId: string) {
  const key = conversationKey(conversationId);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return {
    content: "",
    contentCipher: Buffer.concat([encrypted, tag]).toString("base64"),
    contentIv: iv.toString("base64"),
    encrypted: true,
  };
}

type MessageRow = {
  content: string;
  contentCipher: string | null;
  contentIv: string | null;
  encrypted: boolean;
  conversationId: string;
};

export function decryptMessage(row: MessageRow): string {
  if (!row.encrypted) return row.content;
  if (!row.contentCipher || !row.contentIv) return row.content;
  try {
    const key = conversationKey(row.conversationId);
    const iv = Buffer.from(row.contentIv, "base64");
    const data = Buffer.from(row.contentCipher, "base64");
    const tag = data.subarray(data.length - 16);
    const enc = data.subarray(0, data.length - 16);
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString(
      "utf8"
    );
  } catch {
    return "🔒 Не удалось расшифровать";
  }
}

export const ENCRYPTED_PREVIEW = "🔒 Зашифрованное сообщение";
