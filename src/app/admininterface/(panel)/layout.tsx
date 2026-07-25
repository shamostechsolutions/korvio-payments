import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

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
    return (
      <div className="dashboard-theme flex min-h-screen items-center justify-center px-4">
        <div className="dash-card max-w-md p-8 text-center">
          <h1 className="text-xl font-bold text-[var(--dash-ink)]">Platform admin only</h1>
          <p className="mt-2 text-sm text-[var(--dash-muted)]">
            You&apos;re signed in as{" "}
            <span className="font-semibold text-[var(--dash-ink)]">
              {user.email || user.phoneNumber}
            </span>
            , which is not a platform admin account.
          </p>
          <p className="mt-3 text-sm text-[var(--dash-muted)]">
            Use the{" "}
            <Link href="/admininterface/login" className="font-semibold text-teal-400">
              admin login
            </Link>{" "}
            with an authorised email such as{" "}
            <span className="font-semibold text-teal-400">shamos@korvio.com</span>.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/dashboard" className="dash-btn-secondary">
              Organiser dashboard
            </Link>
            <Link href="/admininterface/login" className="dash-btn-primary">
              Admin login
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
