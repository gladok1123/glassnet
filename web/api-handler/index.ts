import type { VercelRequest, VercelResponse } from "@vercel/node";
import serverless from "serverless-http";
import { createApp } from "../../api/dist/app.js";
import { validateEnv } from "../../api/dist/lib/env.js";

validateEnv();
const app = createApp();
const handler = serverless(app);

export default async function apiHandler(
  req: VercelRequest,
  res: VercelResponse
) {
  await handler(req, res);
}
