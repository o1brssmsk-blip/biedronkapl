import { redirect } from "next/navigation";
import { resolveServerSessionIdentity } from "@/lib/session-id";

export const dynamic = 'force-dynamic';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function WheelByIdPage({ params }: Props) {
  const { id } = await params;
  const { routeSessionId } = await resolveServerSessionIdentity({
    routeSessionId: id,
  });

  const finalId = (routeSessionId && String(routeSessionId).trim() !== "")
    ? String(routeSessionId)
    : id;

  redirect(`/wheel?session=${encodeURIComponent(finalId)}`);
}
