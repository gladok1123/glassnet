import HashtagPage from "./hashtag-client";

export async function generateStaticParams() {
  return [] as { tag: string }[];
}

export const dynamic = "force-static";

export default async function HashtagRoutePage() {
  return <HashtagPage />;
}
