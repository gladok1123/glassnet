import ClanDetailPage from "./clan-client";

export async function generateStaticParams() {
  return [] as { id: string }[];
}

export const dynamic = "force-static";

export default async function ClanPage() {
  return <ClanDetailPage />;
}
