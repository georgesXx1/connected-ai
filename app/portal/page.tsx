import { redirect } from "next/navigation";

import { getPortalSessionUser } from "@/lib/portal/auth";
import { roleHomePaths } from "@/lib/portal/utils";

export default async function PortalIndexPage() {
  const user = await getPortalSessionUser();

  if (!user) {
    redirect("/login");
  }

  redirect(roleHomePaths[user.role]);
}
