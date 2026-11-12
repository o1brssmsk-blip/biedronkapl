import { SessionRealtimeGate } from "@/components/demo/SessionRealtimeGate";
import { resolveServerSessionIdentity } from "@/lib/session-id";
import { SpecialApprovalClient } from "./special-approval-client";

type Props = {
  searchParams: Promise<{ session?: string }>;
};

export default async function SpecialApprovalPage({ searchParams }: Props) {
  const { sessionId, routeSessionId } = await resolveServerSessionIdentity({
    searchParams: await searchParams,
  });

  return (
    <>
      <SessionRealtimeGate sessionId={sessionId ?? ""} routeSessionId={routeSessionId ?? undefined} />
      <SpecialApprovalClient sessionId={sessionId} />
    </>
  );
}
