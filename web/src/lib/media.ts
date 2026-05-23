const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function mediaUrl(path: string | null | undefined) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `${API}${path}`;
}
