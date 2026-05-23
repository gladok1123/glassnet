"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import { clearTokens, getAccessToken, setTokens } from "@/lib/auth-store";
import type { PublicUser } from "@/lib/types";

type AuthContextValue = {
  user: PublicUser | null;
  loading: boolean;
  login: (login: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    username: string;
    displayName: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      return;
    }
    try {
      const { user: me } = await authApi.me();
      setUser(me);
    } catch {
      clearTokens();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser().finally(() => setLoading(false));
  }, [refreshUser]);

  const login = async (loginStr: string, password: string) => {
    const data = await authApi.login({ login: loginStr, password });
    setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    router.replace("/feed");
  };

  const register = async (body: {
    email: string;
    username: string;
    displayName: string;
    password: string;
  }) => {
    const data = await authApi.register(body);
    setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    router.replace("/feed");
  };

  const logout = () => {
    clearTokens();
    setUser(null);
    router.replace("/login");
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth вне AuthProvider");
  return ctx;
}
