import { createClient } from "@/utils/supabase/server";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { UserDashboard } from "@/components/dashboard/user-dashboard";
import { AuthView } from "@/components/auth/auth-view";

export default async function Home() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return <AuthView />;
  }

  // Determine role (simplified for now, check metadata/database)
  const isAdmin = user.user_metadata?.role === "admin" || user.email?.includes("admin");

  return (
    <div className="min-h-screen">
      {isAdmin ? <AdminDashboard /> : <UserDashboard />}
    </div>
  );
}
