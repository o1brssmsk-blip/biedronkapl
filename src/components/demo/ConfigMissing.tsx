"use client";

export function ConfigMissing() {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-center text-amber-950">
      <p className="font-semibold">Supabase yapılandırması eksik</p>
      <p className="mt-2 text-sm">
        `.env.local` içinde `NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_ANON_KEY` tanımlayın.
      </p>
    </div>
  );
}
