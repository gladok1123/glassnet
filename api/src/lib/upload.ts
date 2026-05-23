import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";
import { randomBytes } from "node:crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveUploadDir() {
  const db = process.env.DATABASE_URL ?? "";
  if (db.startsWith("file:/data")) {
    return "/data/uploads";
  }
  return path.join(__dirname, "../../uploads");
}

export const UPLOAD_DIR = resolveUploadDir();

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
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
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Только изображения"));
      return;
    }
    cb(null, true);
  },
});

const audioStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
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
  fileFilter: (_req, file, cb) => {
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
