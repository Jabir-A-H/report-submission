import { Suspense } from "react";
import { createClient } from "@/utils/supabase/server";
import { HelpDiagramClient } from "./help-diagram-client";

export default async function HelpPage() {
  let isAdmin = false;

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from("people")
        .select("role")
        .eq("supabase_uid", user.id)
        .single();

      if (profile?.role === "admin" || profile?.role === "superadmin") {
        isAdmin = true;
      }
    }
  } catch {
    isAdmin = false;
  }

  return (
    <Suspense
      fallback={
        <div className="container py-12 max-w-3xl px-4 flex flex-col items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin mb-4" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
            নির্দেশিকা লোড হচ্ছে...
          </p>
        </div>
      }
    >
      <HelpDiagramClient initialIsAdmin={isAdmin} />
    </Suspense>
  );
}
