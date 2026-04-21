import AdminPortal from "@/app/components/admin/admin-portal";
import { getAdminSessionUser } from "@/lib/admin-auth";
import { readAdminContent } from "@/lib/admin-content";

export const dynamic = "force-dynamic";

type Language = "en" | "fr" | "ar";

type AdministrationPageProps = {
  searchParams: Promise<{
    lang?: string | string[];
    [key: string]: string | string[] | undefined;
  }>;
};

function normalizeLanguage(value: string | undefined): Language {
  return value === "fr" || value === "ar" ? value : "en";
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdministrationPage({
  searchParams,
}: AdministrationPageProps) {
  const resolvedSearchParams = await searchParams;
  const language = normalizeLanguage(getSingleParam(resolvedSearchParams.lang));
  const username = await getAdminSessionUser();
  const initialContent = username ? readAdminContent() : null;

  return (
    <AdminPortal
      authenticated={Boolean(username)}
      language={language}
      username={username}
      initialContent={initialContent}
    />
  );
}
