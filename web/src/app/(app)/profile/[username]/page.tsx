import ProfilePage from "./profile-client";

export async function generateStaticParams() {
  return [] as { username: string }[];
}

export const dynamic = "force-static";

export default async function ProfileByUsernamePage() {
  return <ProfilePage />;
}
