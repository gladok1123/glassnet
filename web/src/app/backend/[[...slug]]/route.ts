import type { NextRequest } from "next/server";
import { createMocks } from "node-mocks-http";
import type { Body, RequestMethod } from "node-mocks-http";
import type { Express } from "express";
import { createApp } from "../../../../../api/dist/app.js";
import { validateEnv } from "../../../../../api/dist/lib/env.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

let expressApp: Express | null = null;

function getApp() {
  if (!expressApp) {
    validateEnv();
    expressApp = createApp();
  }
  return expressApp;
}

function prepareMockRequest(request: NextRequest, raw: Buffer | undefined) {
  const headers = Object.fromEntries(request.headers.entries());
  if (!raw?.length) {
    return { headers, body: undefined as unknown };
  }
  const ct = (headers["content-type"] ?? "").toLowerCase();
  if (ct.includes("application/json")) {
    delete headers["content-length"];
    delete headers["Content-Length"];
    return { headers, body: JSON.parse(raw.toString("utf8")) as unknown };
  }
  if (ct.includes("application/x-www-form-urlencoded")) {
    delete headers["content-length"];
    delete headers["Content-Length"];
    return {
      headers,
      body: Object.fromEntries(new URLSearchParams(raw.toString("utf8"))),
    };
  }
  return { headers, body: raw };
}

async function handle(request: NextRequest): Promise<Response> {
  const url = new URL(request.url);
  const raw =
    request.method !== "GET" && request.method !== "HEAD"
      ? Buffer.from(await request.arrayBuffer())
      : undefined;
  const mock = prepareMockRequest(request, raw);

  const { req, res } = createMocks({
    method: request.method as RequestMethod,
    url: url.pathname + url.search,
    headers: mock.headers,
    body: mock.body as Body | undefined,
  });

  const app = getApp();
  await new Promise<void>((resolve, reject) => {
    res.on("finish", () => resolve());
    res.on("error", reject);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    app(req as any, res as any, (err: unknown) => {
      if (err) reject(err);
    });
  });

  const headers = new Headers();
  for (const [key, value] of Object.entries(res.getHeaders())) {
    if (value == null) continue;
    headers.set(key, Array.isArray(value) ? value.join(", ") : String(value));
  }

  const payload = res._getData();
  const bodyOut =
    payload instanceof Buffer
      ? payload
      : typeof payload === "string"
        ? payload
        : JSON.stringify(payload);

  return new Response(bodyOut, { status: res.statusCode, headers });
}

export async function GET(request: NextRequest) {
  return handle(request);
}
export async function POST(request: NextRequest) {
  return handle(request);
}
export async function PUT(request: NextRequest) {
  return handle(request);
}
export async function PATCH(request: NextRequest) {
  return handle(request);
}
export async function DELETE(request: NextRequest) {
  return handle(request);
}
export async function HEAD(request: NextRequest) {
  return handle(request);
}
export async function OPTIONS(request: NextRequest) {
  return handle(request);
}
