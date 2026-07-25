import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth/session";
import "../dashboard-theme.css";

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return <div className="dashboard-theme">{children}</div>;
}
