"use client";

import { motion } from "framer-motion";
import { type ReactNode } from "react";

type Props = {
  children: ReactNode;
  variant?: "primary" | "ghost" | "danger";
  full?: boolean;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: () => void;
};

export function GlassButton({
  children,
  variant = "primary",
  full,
  className = "",
  disabled,
  type = "button",
  onClick,
}: Props) {
  const base =
    "rounded-full px-5 py-2.5 text-sm font-semibold transition disabled:opacity-50";
  const variants = {
    primary: "bg-[var(--accent)] text-white shadow-lg shadow-blue-500/30",
    ghost: "glass text-[var(--text-primary)]",
    danger: "bg-[var(--danger)] text-white",
  };
  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={onClick}
      whileTap={{ scale: 0.96 }}
      className={`${base} ${variants[variant]} ${full ? "w-full" : ""} ${className}`}
    >
      {children}
    </motion.button>
  );
}
