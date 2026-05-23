import { Router } from "express";
import {
  handleLogin,
  handleMe,
  handleRefresh,
  handleRegister,
} from "../handlers/auth.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { requireAuth } from "../middleware/auth.js";

export const authRouter = Router();

authRouter.post("/register", async (req, res) => {
  const result = await handleRegister(req.body);
  res.status(result.status).json(result.body);
});

authRouter.post("/login", async (req, res) => {
  const result = await handleLogin(req.body);
  res.status(result.status).json(result.body);
});

authRouter.post("/refresh", async (req, res) => {
  const result = await handleRefresh(req.body);
  res.status(result.status).json(result.body);
});

authRouter.get("/me", requireAuth, async (req: AuthedRequest, res) => {
  const result = await handleMe(req.userId!);
  res.status(result.status).json(result.body);
});
