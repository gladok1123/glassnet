"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type IconSize =
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "nav"
  | "nav-center"
  | "action";

type Props = {
  icon: LucideIcon;
  size?: IconSize;
  className?: string;
  active?: boolean;
  label?: string;
};

const sizeClass: Record<IconSize, string> = {
  xs: "icon-size-xs",
  sm: "icon-size-sm",
  md: "icon-size-md",
  lg: "icon-size-lg",
  xl: "icon-size-xl",
  nav: "icon-size-nav",
  "nav-center": "icon-size-nav-center",
  action: "icon-size-action",
};

export function AppIcon({
  icon: Icon,
  size = "md",
  className,
  active,
  label,
}: Props) {
  return (
    <Icon
      aria-hidden={label ? undefined : true}
      aria-label={label}
      strokeWidth={active ? 2.35 : 2}
      className={cn(
        "shrink-0 transition-colors duration-200",
        sizeClass[size],
        active && "text-[var(--accent)]",
        className
      )}
    />
  );
}
