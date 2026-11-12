import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import {
  ACTIVE_ROUTE_SESSION_COOKIE,
  ACTIVE_SESSION_COOKIE,
} from "@/lib/session-constants";
import {
  isNumericSessionIdentifier,
  isUuidSessionIdentifier,
  normalizeSessionIdentifier,
} from "@/lib/session-identifiers";
import { createServerSupabaseClient } from "@/lib/supabase/server";

function createServiceRoleSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  try {
    return createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  } catch {
    return null;
  }
}

async function resolveSessionIdentifier(identifier?: string | null) {
  const normalized = normalizeSessionIdentifier(identifier);
  if (!normalized) {
    return {
      sessionId: "",
      routeSessionId: "",
    };
  }

  const supabaseAnon = await createServerSupabaseClient();
  const supabaseAdmin = createServiceRoleSupabase();

  if (isUuidSessionIdentifier(normalized)) {
    // Once Service Role (RLS'siz) dene — en garanti yol
    if (supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from("sessions")
        .select("id, public_id")
        .eq("id", normalized)
        .maybeSingle();
      if (data?.id) {
        const shortPublicId =
          data.public_id != null && String(data.public_id).trim() !== ""
            ? String(data.public_id)
            : normalized;
        return {
          sessionId: data.id,
          routeSessionId: shortPublicId,
        };
      }
    }
    // Fallback: Anon key ile dene
    if (supabaseAnon) {
      const { data } = await supabaseAnon
        .from("sessions")
        .select("id, public_id")
        .eq("id", normalized)
        .maybeSingle();
      if (data?.id) {
        const shortPublicId =
          data.public_id != null && String(data.public_id).trim() !== ""
            ? String(data.public_id)
            : normalized;
        return {
          sessionId: data.id,
          routeSessionId: shortPublicId,
        };
      }
    }
    return {
      sessionId: normalized,
      routeSessionId: normalized,
    };
  }

  const publicIdValue = isNumericSessionIdentifier(normalized)
    ? Number(normalized)
    : normalized;

  if (supabaseAdmin) {
    const { data } = await supabaseAdmin
      .from("sessions")
      .select("id, public_id")
      .eq("public_id", publicIdValue)
      .maybeSingle();
    if (data?.id) {
      return {
        sessionId: data.id,
        routeSessionId: String(data.public_id ?? normalized),
      };
    }
  }

  if (supabaseAnon) {
    const { data } = await supabaseAnon
      .from("sessions")
      .select("id, public_id")
      .eq("public_id", publicIdValue)
      .maybeSingle();
    if (data?.id) {
      return {
        sessionId: data.id,
        routeSessionId: String(data.public_id ?? normalized),
      };
    }
  }

  return {
    sessionId: normalized,
    routeSessionId: normalized,
  };
}

export async function resolveServerSessionIdentity(options?: {
  searchParams?: { session?: string | null };
  routeSessionId?: string | null;
}) {
  const fromRoute = await resolveSessionIdentifier(options?.routeSessionId);
  if (fromRoute.sessionId) {
    return fromRoute;
  }

  const fromQuery = await resolveSessionIdentifier(options?.searchParams?.session);
  if (fromQuery.sessionId) {
    return fromQuery;
  }

  const cookieStore = await cookies();
  const cookieSessionId = normalizeSessionIdentifier(
    cookieStore.get(ACTIVE_SESSION_COOKIE)?.value,
  );
  const cookieRouteSessionId = normalizeSessionIdentifier(
    cookieStore.get(ACTIVE_ROUTE_SESSION_COOKIE)?.value,
  );

  return {
    sessionId: cookieSessionId,
    routeSessionId: cookieRouteSessionId || cookieSessionId,
  };
}

export async function resolveServerSessionId(searchParams?: { session?: string | null }) {
  const { sessionId } = await resolveServerSessionIdentity({ searchParams });
  return sessionId;
}
