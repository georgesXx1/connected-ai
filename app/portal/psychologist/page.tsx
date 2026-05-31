import { redirect } from "next/navigation";

import { PsychologistDashboard } from "@/components/portal/dashboards";
import { requirePortalRole } from "@/lib/portal/auth";

export default async function PortalPsychologistPage() {
  const { user, redirectTo } = await requirePortalRole("psychologist");

  if (redirectTo || !user) {
    redirect(redirectTo ?? "/login");
  }

  return <PsychologistDashboard user={user} />;
}
