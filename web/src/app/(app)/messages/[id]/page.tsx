import ChatPage from "./chat-client";

export async function generateStaticParams() {
  return [] as { id: string }[];
}

export const dynamic = "force-static";

export default async function MessageThreadPage() {
  return <ChatPage />;
}
