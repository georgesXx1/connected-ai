import { redirect } from "next/navigation";

import { TeacherDashboard } from "@/components/portal/dashboards";
import { requirePortalRole } from "@/lib/portal/auth";

export default async function PortalTeacherPage() {
  const { user, redirectTo } = await requirePortalRole("teacher");

  if (redirectTo || !user) {
    redirect(redirectTo ?? "/login");
  }

  return <TeacherDashboard user={user} />;
}
