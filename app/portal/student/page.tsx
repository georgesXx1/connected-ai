import { redirect } from "next/navigation";

import { StudentDashboard } from "@/components/portal/dashboards";
import { requirePortalRole } from "@/lib/portal/auth";

export default async function PortalStudentPage() {
  const { user, redirectTo } = await requirePortalRole("student");

  if (redirectTo || !user) {
    redirect(redirectTo ?? "/login");
  }

  return <StudentDashboard user={user} />;
}
