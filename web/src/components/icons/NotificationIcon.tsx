import {
  Bell,
  Heart,
  MessageCircle,
  Repeat2,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { AppIcon } from "./AppIcon";

const map: Record<string, LucideIcon> = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  repost: Repeat2,
};

export function NotificationIcon({ type }: { type: string }) {
  const Icon = map[type] ?? Bell;
  return (
    <AppIcon
      icon={Icon}
      size="md"
      className="text-[var(--accent)] opacity-90"
    />
  );
}
