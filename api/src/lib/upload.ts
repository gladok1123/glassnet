import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import type { Request } from "express";
import multer from "multer";
import type { FileFilterCallback } from "multer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveUploadDir() {
  if (process.env.VERCEL) {
    return "/tmp/glassnet-uploads";
  }
  return path.join(__dirname, "../../uploads");
}

export const UPLOAD_DIR = resolveUploadDir();

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

type StorageCallback = (error: Error | null, value: string) => void;

const storage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: StorageCallback) =>
    cb(null, UPLOAD_DIR),
  filename: (_req: Request, file: Express.Multer.File, cb: StorageCallback) => {
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    const safe = [".jpg", ".jpeg", ".png", ".webp", ".gif"].includes(ext)
      ? ext
      : ".jpg";
    cb(null, `${Date.now()}-${randomBytes(6).toString("hex")}${safe}`);
  },
});

export const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Только изображения"));
      return;
    }
    cb(null, true);
  },
});

const audioStorage = multer.diskStorage({
  destination: (_req: Request, _file: Express.Multer.File, cb: StorageCallback) =>
    cb(null, UPLOAD_DIR),
  filename: (_req: Request, file: Express.Multer.File, cb: StorageCallback) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safe = [".webm", ".ogg", ".mp3", ".m4a", ".wav"].includes(ext)
      ? ext
      : ".webm";
    cb(null, `${Date.now()}-${randomBytes(6).toString("hex")}${safe}`);
  },
});

export const uploadAudio = multer({
  storage: audioStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (!file.mimetype.startsWith("audio/")) {
      cb(new Error("Только аудио"));
      return;
    }
    cb(null, true);
  },
});

export function publicUploadPath(filename: string) {
  return `/uploads/${filename}`;
}
