import { redirect } from "next/navigation";

import { AdminDashboard } from "@/components/portal/dashboards";
import { requirePortalRole } from "@/lib/portal/auth";

export default async function PortalAdminPage() {
  const { user, redirectTo } = await requirePortalRole("admin");

  if (redirectTo || !user) {
    redirect(redirectTo ?? "/login");
  }

  return <AdminDashboard user={user} />;
}
