import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import "../dashboard-theme.css";

export default async function AdminInterfaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) {
    redirect("/login?redirect=/admininterface");
  }

  if (!isPlatformAdmin(user)) {
    return (
      <div className="dashboard-theme flex min-h-screen items-center justify-center px-4">
        <div className="dash-card max-w-md p-8 text-center">
          <h1 className="text-xl font-bold text-[var(--dash-ink)]">Access denied</h1>
          <p className="mt-2 text-sm text-[var(--dash-muted)]">
            This area is for Korvio platform admins only. Ask the team to add your email to{" "}
            <code className="text-teal-400">PLATFORM_ADMIN_EMAILS</code> on Vercel.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/dashboard" className="dash-btn-secondary">
              Organiser dashboard
            </Link>
            <Link href="/" className="dash-btn-primary">
              Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-theme flex min-h-screen">
      <AdminSidebar userName={user.fullName} />
      <main className="min-w-0 flex-1 overflow-auto p-4 md:p-6 lg:p-8">{children}</main>
    </div>
  );
}
