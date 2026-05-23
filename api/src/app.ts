import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { postsRouter } from "./routes/posts.js";
import { usersRouter } from "./routes/users.js";
import { messagesRouter } from "./routes/messages.js";
import { notificationsRouter } from "./routes/notifications.js";
import { searchRouter } from "./routes/search.js";
import { clansRouter } from "./routes/clans.js";
import { voiceRouter } from "./routes/voice.js";
import { UPLOAD_DIR } from "./lib/upload.js";
import { applySecurity } from "./lib/security.js";

export function createApp() {
  const app = express();
  const origin = process.env.CORS_ORIGIN ?? "http://localhost:3000";

  app.use((req, _res, next) => {
    if (req.url.startsWith("/backend")) {
      req.url = req.url.slice("/backend".length) || "/";
    }
    next();
  });

  applySecurity(app);

  app.use(
    cors({
      origin,
      credentials: true,
      methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Authorization", "Content-Type"],
    })
  );
  const parseJson = express.json({ limit: "256kb" });
  app.use((req, res, next) => {
    if (req.body !== undefined && req.body !== null) {
      next();
      return;
    }
    parseJson(req, res, next);
  });
  app.use("/uploads", express.static(UPLOAD_DIR, { maxAge: "7d" }));

  app.get("/health", (_req, res) => {
    res.json({
      ok: true,
      name: "GlassNet API",
      version: process.env.npm_package_version ?? "1.0.0",
    });
  });

  app.use("/auth", authRouter);
  app.use("/posts", postsRouter);
  app.use("/users", usersRouter);
  app.use("/messages", messagesRouter);
  app.use("/notifications", notificationsRouter);
  app.use("/search", searchRouter);
  app.use("/clans", clansRouter);
  app.use("/voice", voiceRouter);

  app.use((_req, res) => {
    res.status(404).json({ error: "Не найдено" });
  });

  return app;
}
