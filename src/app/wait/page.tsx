import { SessionRealtimeGate } from "@/components/demo/SessionRealtimeGate";
import { resolveServerSessionIdentity } from "@/lib/session-id";
import { WaitClient } from "./wait-client";

type Props = {
  searchParams: Promise<{ session?: string }>;
};

export default async function WaitPage({ searchParams }: Props) {
  const { sessionId, routeSessionId } = await resolveServerSessionIdentity({
    searchParams: await searchParams,
  });

  return (
    <>
      <SessionRealtimeGate sessionId={sessionId ?? ""} routeSessionId={routeSessionId ?? undefined} />
      <WaitClient sessionId={sessionId} routeSessionId={routeSessionId} />
    </>
  );
}
