import PostDetailPage from "./post-client";

export async function generateStaticParams() {
  return [] as { id: string }[];
}

export const dynamic = "force-static";

export default async function PostPage() {
  return <PostDetailPage />;
}
