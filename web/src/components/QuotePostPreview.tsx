import Link from "next/link";
import type { Post, PostQuote } from "@/lib/types";
import { mediaUrl } from "@/lib/media";
import { GlassCard } from "./glass/GlassCard";
import { UserAvatar } from "./UserAvatar";

type Quote = PostQuote | NonNullable<Post["repostOf"]>;

export function QuotePostPreview({ quote }: { quote: Quote }) {
  const img = mediaUrl(quote.imageUrl);
  return (
    <GlassCard className="mt-2 border border-white/10 p-3">
      <div className="flex gap-2">
        <UserAvatar user={quote.author} size="sm" linked={false} />
        <div className="min-w-0 flex-1">
          <p className="text-caption font-semibold">{quote.author.displayName}</p>
          <p className="text-caption text-[var(--text-secondary)]">
            @{quote.author.username}
          </p>
          {quote.content && (
            <p className="mt-1 line-clamp-3 text-caption leading-relaxed">
              {quote.content}
            </p>
          )}
          {img && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={img}
              alt=""
              className="mt-2 max-h-40 w-full rounded-xl object-cover"
            />
          )}
        </div>
      </div>
      <Link
        href={`/post/${quote.id}`}
        className="mt-2 block text-caption text-[var(--accent)]"
      >
        Открыть оригинал
      </Link>
    </GlassCard>
  );
}
