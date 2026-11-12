import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const sessionId: string = String(payload?.session_id ?? payload?.id ?? "").trim();

    if (!sessionId) {
      return NextResponse.json(
        { ok: false, error: "Missing session_id" },
        { status: 400 },
      );
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      return NextResponse.json(
        { ok: false, error: "Missing Supabase credentials" },
        { status: 500 },
      );
    }

    const supabase = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    let publicId: string | number | null = null;
    let realSessionId: string | null = null;

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      sessionId,
    );
    const isNumeric = /^\d+$/.test(sessionId);

    if (isUuid) {
      const { data } = await supabase
        .from("sessions")
        .select("id, public_id")
        .eq("id", sessionId)
        .maybeSingle();
      if (data?.id) {
        realSessionId = data.id;
        if (data.public_id != null && String(data.public_id).trim() !== "") {
          publicId = data.public_id;
        }
      }
    }

    if (!publicId && isNumeric) {
      const { data } = await supabase
        .from("sessions")
        .select("id, public_id")
        .eq("public_id", Number(sessionId))
        .maybeSingle();
      if (data?.id) {
        realSessionId = data.id;
        if (data.public_id != null && String(data.public_id).trim() !== "") {
          publicId = data.public_id;
        }
      }
    }

    if (!publicId && !isUuid && !isNumeric) {
      const { data } = await supabase
        .from("sessions")
        .select("id, public_id")
        .or(`id.eq.${sessionId},public_id.eq.${sessionId}`)
        .limit(1)
        .maybeSingle();
      if (data?.id) {
        realSessionId = data.id;
        if (data.public_id != null && String(data.public_id).trim() !== "") {
          publicId = data.public_id;
        }
      }
    }

    return NextResponse.json({
      ok: true,
      session_id: realSessionId ?? sessionId,
      route_session_id: publicId != null ? String(publicId) : sessionId,
      public_id: publicId != null ? String(publicId) : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { ok: false, error: message, session_id: "", route_session_id: "", public_id: null },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const sessionId = String(searchParams.get("id") ?? searchParams.get("session_id") ?? "").trim();
  if (!sessionId) {
    return NextResponse.json(
      { ok: false, error: "Missing id or session_id query param" },
      { status: 400 },
    );
  }
  const fakeReq = {
    json: async () => ({ session_id: sessionId }),
  } as Request;
  return POST(fakeReq);
}
