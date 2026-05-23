"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Compass,
  Home,
  MessageCircle,
  PenLine,
  Headphones,
  Shield,
  User,
  type LucideIcon,
} from "lucide-react";
import { AppIcon } from "@/components/icons/AppIcon";
import { cn } from "@/lib/cn";

const tabs: {
  href: string;
  label: string;
  icon: LucideIcon;
  center?: boolean;
  match?: (path: string) => boolean;
}[] = [
  { href: "/feed", label: "Лента", icon: Home },
  {
    href: "/discover",
    label: "Обзор",
    icon: Compass,
    match: (p) => p.startsWith("/discover") || p.startsWith("/hashtag"),
  },
  { href: "/compose", label: "Пост", icon: PenLine, center: true },
  {
    href: "/voice",
    label: "Голос",
    icon: Headphones,
    match: (p) => p.startsWith("/voice"),
  },
  {
    href: "/clans",
    label: "Кланы",
    icon: Shield,
    match: (p) => p.startsWith("/clans"),
  },
  {
    href: "/messages",
    label: "Чаты",
    icon: MessageCircle,
    match: (p) => p.startsWith("/messages"),
  },
  {
    href: "/profile",
    label: "Профиль",
    icon: User,
    match: (p) => p.startsWith("/profile"),
  },
];

export function GlassNav() {
  const pathname = usePathname();

  return (
    <div className="nav-dock pointer-events-none fixed bottom-0 left-0 right-0 z-50 flex justify-center px-3">
      <nav
        className="glass-strong pointer-events-auto w-full max-w-md rounded-[clamp(20px,5vw,28px)] px-1 py-[clamp(6px,1.5vw,10px)]"
        style={{
          paddingBottom: "calc(clamp(6px, 1.5vw, 10px) + var(--safe-bottom))",
          marginBottom: "clamp(8px, 2vw, 14px)",
        }}
      >
        <ul className="flex items-end justify-around">
          {tabs.map((tab) => {
            const active =
              pathname === tab.href ||
              (pathname != null && tab.match?.(pathname) === true);

            return (
              <li key={tab.href} className="flex-1">
                <Link
                  href={tab.href}
                  className={cn(
                    "relative flex flex-col items-center justify-end gap-[clamp(2px,0.6vw,4px)] py-1",
                    tab.center && "-mt-[clamp(14px,4vw,22px)]"
                  )}
                >
                  {tab.center ? (
                    <span
                      className="flex items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-lg shadow-blue-500/40"
                      style={{
                        width: "clamp(52px, 14vw, 64px)",
                        height: "clamp(52px, 14vw, 64px)",
                      }}
                    >
                      <AppIcon
                        icon={tab.icon}
                        size="nav-center"
                        className="text-white"
                      />
                    </span>
                  ) : (
                    <>
                      <AppIcon
                        icon={tab.icon}
                        size="nav"
                        active={active}
                        className={
                          active ? "" : "text-[var(--text-secondary)]"
                        }
                      />
                      <span
                        className={cn(
                          "font-medium leading-none",
                          active
                            ? "text-[var(--accent)]"
                            : "text-[var(--text-secondary)]"
                        )}
                        style={{ fontSize: "var(--nav-label)" }}
                      >
                        {tab.label}
                      </span>
                      {active && (
                        <motion.span
                          layoutId="nav-dot"
                          className="absolute bottom-0 h-1 w-1 rounded-full bg-[var(--accent)]"
                        />
                      )}
                    </>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
