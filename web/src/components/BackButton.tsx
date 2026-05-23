"use client";

import { ChevronLeft } from "lucide-react";
import { AppIcon } from "./icons/AppIcon";

type Props = {
  onClick: () => void;
  label?: string;
};

export function BackButton({ onClick, label = "Назад" }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="icon-btn -ml-2 text-[var(--accent)]"
    >
      <AppIcon icon={ChevronLeft} size="lg" className="text-[var(--accent)]" />
      <span className="text-caption font-medium">{label}</span>
    </button>
  );
}
