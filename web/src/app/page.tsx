"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getAccessToken } from "@/lib/auth-store";

export default function HomePage() {
  const router = useRouter();
  const { loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    router.replace(getAccessToken() ? "/feed" : "/login");
  }, [loading, router]);

  return null;
}
