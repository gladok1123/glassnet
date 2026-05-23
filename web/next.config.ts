import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";

const isStaticExport = process.env.STATIC_EXPORT === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";
const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const nextConfig: NextConfig = {
  outputFileTracingRoot: repoRoot,
  serverExternalPackages: ["@prisma/client", "better-sqlite3"],
  outputFileTracingIncludes: {
    "/backend/[[...slug]]": [
      "./api/prisma/glassnet.db",
      "./api/dist/**",
      "./node_modules/.prisma/client/**",
    ],
    "/backend/auth/login": [
      "./api/prisma/glassnet.db",
      "./api/dist/**",
      "./node_modules/.prisma/client/**",
    ],
    "/backend/auth/register": [
      "./api/prisma/glassnet.db",
      "./api/dist/**",
      "./node_modules/.prisma/client/**",
    ],
    "/backend/health": [
      "./api/prisma/glassnet.db",
      "./api/dist/**",
      "./node_modules/.prisma/client/**",
    ],
  },
  devIndicators: false,
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  ...(isStaticExport
    ? {
        output: "export",
        images: { unoptimized: true },
        trailingSlash: true,
      }
    : {}),
};

export default nextConfig;
