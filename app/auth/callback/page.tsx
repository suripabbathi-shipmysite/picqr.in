"use client";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

function AuthCallbackInner() {
  const router = useRouter();
  const search = useSearchParams();
  useEffect(() => {
    const run = async () => {
      const next = search.get("next") || localStorage.getItem("picqr_login_next") || "/dashboard";
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        // Profile lekapothe create chey - Google user
        const { data: profile } = await supabase.from("profiles").select("id").eq("id", session.user.id).maybeSingle();
        if (!profile) {
          await supabase.from("profiles").insert({
            id: session.user.id,
            email: session.user.email,
            full_name: session.user.user_metadata?.full_name || "",
            qr_id: `PQ-${session.user.id.slice(0, 6).toUpperCase()}`,
            country: "",
          });
        }
        localStorage.removeItem("picqr_login_next");
        router.replace(next);
      } else {
        router.replace("/login");
      }
    };
    run();
  }, [router, search]);
  return <div style={{ padding: 60, textAlign: "center" }}>Signing you in with Google...</div>;
}

export default function AuthCallback() {
  return (
    <Suspense fallback={<div style={{ padding: 60, textAlign: "center" }}>Signing you in with Google...</div>}>
      <AuthCallbackInner />
    </Suspense>
  );
}