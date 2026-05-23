import helmet from "helmet";
import rateLimit from "express-rate-limit";
import type { Express } from "express";

export function applySecurity(app: Express) {
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 600,
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  app.use(
    "/auth",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 40,
      message: { error: "Слишком много попыток, подождите" },
    })
  );
}
