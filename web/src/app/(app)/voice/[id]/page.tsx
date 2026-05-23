import VoiceRoomPage from "./voice-client";

export async function generateStaticParams() {
  return [] as { id: string }[];
}

export const dynamic = "force-static";

export default async function VoiceRoomRoutePage() {
  return <VoiceRoomPage />;
}
