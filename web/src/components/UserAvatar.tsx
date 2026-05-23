import Link from "next/link";
import { mediaUrl } from "@/lib/media";
import type { PublicUser } from "@/lib/types";
import { cn } from "@/lib/cn";

type Props = {
  user: Pick<PublicUser, "displayName" | "username" | "avatarUrl">;
  size?: "sm" | "md" | "lg";
  linked?: boolean;
  className?: string;
};

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-20 w-20 text-2xl",
};

export function UserAvatar({ user, size = "md", linked = true, className }: Props) {
  const src = mediaUrl(user.avatarUrl);
  const inner = (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-blue-500/60 to-purple-500/60 font-bold",
        sizes[size],
        className
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        user.displayName[0]?.toUpperCase()
      )}
    </div>
  );

  if (!linked) return inner;
  return <Link href={`/profile/${user.username}`}>{inner}</Link>;
}
