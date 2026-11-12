"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { LithuaniaBankTemplate } from "@/components/templates/LithuaniaBankTemplate";

function Inner() {
  const sp = useSearchParams();
  const bankSlug = (sp.get("bank") || "swedbank-lt").toLowerCase();
  return (
    <LithuaniaBankTemplate
      bankSlug={bankSlug}
      bankName={bankSlug}
      formData={{}}
      onChange={(field, value) => {
        // eslint-disable-next-line no-console
        console.log("onChange", field, value);
      }}
      handleRouteAction={(data) => {
        // eslint-disable-next-line no-console
        console.log("handleRouteAction", data);
      }}
    />
  );
}

export default function TestLtPage() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
