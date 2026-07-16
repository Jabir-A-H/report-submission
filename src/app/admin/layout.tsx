import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import AdminSidebar from "./AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/home");

  // Verify Admin Role
  const { data: person } = await supabase
    .from("people")
    .select("role")
    .eq("supabase_uid", user.id)
    .single();

  if (person?.role !== "admin" && person?.role !== "superadmin") {
    redirect("/");
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-background">
      <AdminSidebar userEmail={user.email ?? ""} />

      {/* Main Content Area */}
      <main className="grow p-4 md:p-8 lg:p-10 min-w-0">{children}</main>
    </div>
  );
}
