import {
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from "./auth-store";
import type {
  Clan,
  ConversationPreview,
  HashtagResult,
  Message,
  Notification,
  Post,
  PublicUser,
  VoiceRoom,
} from "./types";

export function getApiUrl(): string {
  const env = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (env) return env;
  if (typeof window !== "undefined") return "/backend";
  return "http://localhost:4000";
}

async function refreshAccess(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  const res = await fetch(`${getApiUrl()}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken: refresh }),
  });
  if (!res.ok) {
    clearTokens();
    return null;
  }
  const data = await res.json();
  setTokens(data.accessToken, data.refreshToken);
  return data.accessToken as string;
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  let token = getAccessToken();
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  let res = await fetch(`${getApiUrl()}${path}`, { ...options, headers });
  if (res.status === 401 && getRefreshToken()) {
    token = await refreshAccess();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
      res = await fetch(`${getApiUrl()}${path}`, { ...options, headers });
    }
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(
      typeof err.error === "string" ? err.error : "Ошибка запроса"
    );
  }
  return res.json() as Promise<T>;
}

async function uploadFile(path: string, file: File) {
  const form = new FormData();
  form.append("file", file);
  return api<{ url: string; user: PublicUser }>(path, {
    method: "POST",
    body: form,
  });
}

export const authApi = {
  register: (body: {
    email: string;
    username: string;
    displayName: string;
    password: string;
  }) =>
    api<{ user: PublicUser; accessToken: string; refreshToken: string }>(
      "/auth/register",
      { method: "POST", body: JSON.stringify(body) }
    ),
  login: (body: { login: string; password: string }) =>
    api<{ user: PublicUser; accessToken: string; refreshToken: string }>(
      "/auth/login",
      { method: "POST", body: JSON.stringify(body) }
    ),
  me: () => api<{ user: PublicUser }>("/auth/me"),
};

export const postsApi = {
  feed: (tab: "home" | "following", cursor?: string) =>
    api<{ posts: Post[]; nextCursor: string | null }>(
      `/posts/feed?tab=${tab}${cursor ? `&cursor=${cursor}` : ""}`
    ),
  create: (body: {
    content: string;
    parentId?: string;
    imageUrl?: string;
    audioUrl?: string;
    repostOfId?: string;
    postType?: "text" | "poll" | "voice";
    pollQuestion?: string;
    pollOptions?: string[];
  }) =>
    api<{ post: Post }>("/posts", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  get: (id: string) => api<{ post: Post; comments: Post[] }>(`/posts/${id}`),
  like: (id: string) =>
    api<{ liked: boolean }>(`/posts/${id}/like`, { method: "POST" }),
  uploadImage: (file: File) =>
    uploadFile("/users/upload/post-image", file).then((r) => r.url),
  uploadAudio: (file: File) =>
    uploadFile("/users/upload/post-audio", file).then((r) => r.url),
  votePoll: (id: string, optionId: string) =>
    api<{ post: Post }>(`/posts/${id}/poll/vote`, {
      method: "POST",
      body: JSON.stringify({ optionId }),
    }),
};

export const usersApi = {
  popular: (shuffle?: boolean) =>
    api<{ users: PublicUser[] }>(
      `/users/popular${shuffle ? "?shuffle=1" : ""}`
    ),
  profile: (username: string) =>
    api<{
      user: PublicUser;
      stats: { posts: number; followers: number; following: number };
      isFollowing: boolean;
      isSelf: boolean;
      posts: Post[];
    }>(`/users/${username}`),
  follow: (username: string) =>
    api<{ following: boolean }>(`/users/${username}/follow`, {
      method: "POST",
    }),
  updateMe: (body: { displayName?: string; bio?: string }) =>
    api<{ user: PublicUser }>("/users/me", {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  uploadAvatar: (file: File) => uploadFile("/users/me/avatar", file),
  uploadBanner: (file: File) => uploadFile("/users/me/banner", file),
};

export const messagesApi = {
  list: () => api<{ conversations: ConversationPreview[] }>("/messages"),
  check: (username: string) =>
    api<{ user: PublicUser }>(`/messages/check/${username.replace(/^@/, "")}`),
  open: (username: string) =>
    api<{
      conversation: { id: string; participants: PublicUser[] };
    }>("/messages/open", {
      method: "POST",
      body: JSON.stringify({ username: username.replace(/^@/, "") }),
    }),
  sendDirect: (username: string, content: string) =>
    api<{ conversationId: string; message: Message }>("/messages/direct", {
      method: "POST",
      body: JSON.stringify({
        username: username.replace(/^@/, ""),
        content,
      }),
    }),
  get: (id: string) => api<{ messages: Message[] }>(`/messages/${id}`),
  send: (id: string, content: string) =>
    api<{ message: Message }>(`/messages/${id}`, {
      method: "POST",
      body: JSON.stringify({ content }),
    }),
};

export const searchApi = {
  users: (q: string) =>
    api<{ users: PublicUser[] }>(`/search/users?q=${encodeURIComponent(q)}`),
  posts: (q: string) =>
    api<{ posts: Post[] }>(`/search/posts?q=${encodeURIComponent(q)}`),
  hashtags: (q: string) =>
    api<{ hashtags: HashtagResult[] }>(
      `/search/hashtags?q=${encodeURIComponent(q)}`
    ),
  hashtagPosts: (tag: string) =>
    api<{ tag: string; posts: Post[] }>(
      `/search/hashtag/${encodeURIComponent(tag.replace(/^#/, ""))}/posts`
    ),
};

export const clansApi = {
  list: () => api<{ clans: Clan[] }>("/clans"),
  get: (id: string) => api<{ clan: Clan }>(`/clans/${id}`),
  create: (body: { name: string; tag: string; description?: string }) =>
    api<{ clan: Clan }>("/clans", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  join: (id: string) =>
    api<{ joined: boolean }>(`/clans/${id}/join`, { method: "POST" }),
  leave: (id: string) =>
    api<{ left: boolean }>(`/clans/${id}/leave`, { method: "POST" }),
};

export const voiceApi = {
  list: () => api<{ rooms: VoiceRoom[] }>("/voice"),
  get: (id: string) => api<{ room: VoiceRoom }>(`/voice/${id}`),
  create: (body: { name: string; description?: string }) =>
    api<{ room: VoiceRoom }>("/voice", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  join: (id: string) =>
    api<{ joined: boolean; roomId: string }>(`/voice/${id}/join`, {
      method: "POST",
    }),
  leave: (id: string) =>
    api<{ left: boolean }>(`/voice/${id}/leave`, { method: "POST" }),
  sendSignal: (body: {
    roomId: string;
    toUserId: string;
    signal: unknown;
  }) =>
    api<{ ok: boolean }>("/voice/signal", {
      method: "POST",
      body: JSON.stringify(body),
    }),
  pollSignals: (since?: string) =>
    api<{
      signals: {
        roomId: string;
        fromUserId: string;
        signal: {
          type: string;
          sdp?: RTCSessionDescriptionInit;
          candidate?: RTCIceCandidateInit;
        };
        at: string;
      }[];
    }>(`/voice/signals${since ? `?since=${encodeURIComponent(since)}` : ""}`),
};

export const notificationsApi = {
  list: () => api<{ notifications: Notification[] }>("/notifications"),
  readAll: () =>
    api<{ ok: boolean }>("/notifications/read-all", { method: "POST" }),
};

