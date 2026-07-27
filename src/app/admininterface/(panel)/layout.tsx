import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { DashShell } from "@/components/dashboard/dash-shell";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/admininterface/login");
  }

  if (!isPlatformAdmin(user)) {
    redirect("/dashboard");
  }

  return (
    <DashShell sidebar={<AdminSidebar userName={user.fullName} />}>{children}</DashShell>
  );
}
