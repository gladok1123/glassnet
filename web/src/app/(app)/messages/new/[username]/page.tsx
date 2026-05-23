import NewChatPage from "./new-chat-client";

export async function generateStaticParams() {
  return [] as { username: string }[];
}

export const dynamic = "force-static";

export default async function NewMessagePage() {
  return <NewChatPage />;
}
