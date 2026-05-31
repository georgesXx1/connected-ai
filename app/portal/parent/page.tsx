import { redirect } from "next/navigation";

import { ParentDashboard } from "@/components/portal/dashboards";
import { requirePortalRole } from "@/lib/portal/auth";

export default async function PortalParentPage() {
  const { user, redirectTo } = await requirePortalRole("parent");

  if (redirectTo || !user) {
    redirect(redirectTo ?? "/login");
  }

  return <ParentDashboard user={user} />;
}
