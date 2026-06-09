import { createClient } from "@/utils/supabase/server";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { UserDashboard } from "@/components/dashboard/user-dashboard";
import { redirect } from "next/navigation";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/home");
  }

  // Fetch real role from people table
  const { data: profile } = await supabase
    .from("people")
    .select("role")
    .eq("auth_user_id", user.id)
    .single();

  const isAdmin = profile?.role === "admin" || profile?.role === "superadmin";

  return (
    <div className="min-h-screen">
      {isAdmin ? <AdminDashboard /> : <UserDashboard />}
    </div>
  );
}
