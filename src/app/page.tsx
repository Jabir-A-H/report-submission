import { createClient } from "@/utils/supabase/server";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { UserDashboard } from "@/components/dashboard/user-dashboard";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  // Middleware guarantees auth on this route, but guard defensively
  // to prevent a runtime crash if user is somehow null.
  if (!user) redirect('/home')

  // Fetch real role from people table
  const { data: profile } = await supabase
    .from("people")
    .select("role")
    .eq("supabase_uid", user.id)
    .single();

  const isAdmin = profile?.role === "admin" || profile?.role === "superadmin";

  return (
    <div className="flex-1 flex flex-col">
      {isAdmin ? <AdminDashboard /> : <UserDashboard />}
    </div>
  );
}
