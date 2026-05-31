import Link from "next/link";

import { getPublishedRules, type AdminRule } from "@/lib/admin-content";

export const dynamic = "force-dynamic";

type Language = "en" | "fr" | "ar";

type RulesPageProps = {
  searchParams: Promise<{
    lang?: string | string[];
    category?: string | string[];
    sort?: string | string[];
    [key: string]: string | string[] | undefined;
  }>;
};

const TRANSLATIONS = {
  en: {
    title: "Official School Rules",
    subtitle:
      "Published rules only. This page is view-only and reflects the current official rule set used by connected AI.",
    back: "Back to connected AI",
    filter: "Category",
    allCategories: "All categories",
    sort: "Sort",
    newest: "Newest first",
    oldest: "Oldest first",
    publishedOnly: "Published rules",
    noRules: "No published rules match this filter.",
  },
  fr: {
    title: "Regles officielles de l'ecole",
    subtitle:
      "Cette page affiche uniquement les regles publiees. Elle est en consultation seule et reflète l'ensemble officiel utilise par connected AI.",
    back: "Retour a connected AI",
    filter: "Categorie",
    allCategories: "Toutes les categories",
    sort: "Tri",
    newest: "Plus recentes",
    oldest: "Plus anciennes",
    publishedOnly: "Regles publiees",
    noRules: "Aucune regle publiee ne correspond a ce filtre.",
  },
  ar: {
    title: "القوانين المدرسية الرسمية",
    subtitle:
      "تعرض هذه الصفحة القوانين المنشورة فقط. وهي مخصّصة للعرض وتعكس مجموعة القوانين الرسمية الحالية المستخدمة في connected AI.",
    back: "العودة إلى connected AI",
    filter: "الفئة",
    allCategories: "كل الفئات",
    sort: "الترتيب",
    newest: "الأحدث أولًا",
    oldest: "الأقدم أولًا",
    publishedOnly: "القوانين المنشورة",
    updated: "آخر تحديث",
    noRules: "لا توجد قوانين منشورة ضمن هذه التصفية.",
  },
} as const;

function normalizeLanguage(value: string | undefined): Language {
  return value === "fr" || value === "ar" ? value : "en";
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildHref(
  language: Language,
  category: string | null,
  sort: "newest" | "oldest",
) {
  const params = new URLSearchParams();
  params.set("lang", language);

  if (category) {
    params.set("category", category);
  }

  params.set("sort", sort);
  return `/rules?${params.toString()}`;
}

export default async function RulesPage({ searchParams }: RulesPageProps) {
  const resolvedSearchParams = await searchParams;
  const language = normalizeLanguage(getSingleParam(resolvedSearchParams.lang));
  const requestedCategory = getSingleParam(resolvedSearchParams.category);
  const sort = getSingleParam(resolvedSearchParams.sort) === "oldest" ? "oldest" : "newest";

  const t = TRANSLATIONS[language];
  const textDirection = language === "ar" ? "rtl" : "ltr";
  const textAlignClass = language === "ar" ? "text-right" : "text-left";

  const publishedRules = await getPublishedRules();
  const categories = [...new Set(publishedRules.map((rule) => rule.category))].sort((a, b) =>
    a.localeCompare(b),
  );
  const activeCategory =
    requestedCategory && categories.includes(requestedCategory)
      ? requestedCategory
      : null;

  const filteredRules = (activeCategory
    ? publishedRules.filter((rule) => rule.category === activeCategory)
    : publishedRules
  ).sort((a, b) => {
    const categoryCompare = a.category.localeCompare(b.category);

    if (categoryCompare !== 0) {
      return categoryCompare;
    }

    return sort === "newest"
      ? a.title.localeCompare(b.title)
      : b.title.localeCompare(a.title);
  });

  return (
    <main
      className="gem-page text-slate-950"
      dir={textDirection}
    >
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="gem-shell relative overflow-hidden rounded-[30px]">
          <section className="relative border-b border-blue-900/10 px-6 py-8 sm:px-8 lg:px-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className={textAlignClass}>
                <div className="flex items-center gap-3">
                  <p className="gem-eyebrow">connected AI</p>
                </div>
                <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  {t.title}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                  {t.subtitle}
                </p>
              </div>

              <Link
                href={{ pathname: "/", query: { lang: language } }}
                className="gem-soft-button inline-flex h-10 shrink-0 items-center justify-center rounded-2xl px-4 text-sm font-semibold"
              >
                {t.back}
              </Link>
            </div>
          </section>

          <section className="px-6 py-7 sm:px-8 sm:py-8 lg:px-10">
            <div className="flex flex-wrap gap-3">
              <div className="gem-panel rounded-2xl px-4 py-3 text-sm font-semibold text-blue-900">
                {t.publishedOnly}: {publishedRules.length}
              </div>
            </div>

            <div className="gem-panel mt-7 rounded-[30px] p-6">
              <div>
                <p className="text-sm font-bold text-slate-950">{t.filter}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    href={buildHref(language, null, sort)}
                    className={`rounded-full border px-3 py-2 text-xs transition ${
                      activeCategory === null
                        ? "border-blue-500/30 bg-blue-600 text-white"
                        : "gem-soft-button"
                    }`}
                  >
                    {t.allCategories}
                  </Link>
                  {categories.map((category) => (
                    <Link
                      key={category}
                      href={buildHref(language, category, sort)}
                      className={`rounded-full border px-3 py-2 text-xs transition ${
                        activeCategory === category
                          ? "border-blue-500/30 bg-blue-600 text-white"
                          : "gem-soft-button"
                      }`}
                    >
                      {category}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-7 space-y-4">
                {filteredRules.length === 0 ? (
                  <div className="gem-panel rounded-[30px] p-7 text-sm leading-7 text-slate-500">
                    {t.noRules}
                  </div>
                ) : (
                  filteredRules.map((rule: AdminRule) => (
                    <article
                      key={rule.id}
                      className="gem-card rounded-[30px] p-7"
                    >
                      <div className={textAlignClass}>
                        <h2 className="text-lg font-bold text-slate-950">
                          {rule.title}
                        </h2>
                        <p className="mt-2 text-xs font-semibold text-blue-700">
                          {rule.category}
                        </p>
                      </div>
                      <p
                        className="mt-6 whitespace-pre-wrap rounded-[26px] border border-blue-900/10 bg-white/70 px-6 py-6 text-right text-[1.02rem] leading-9 text-slate-800"
                        dir="rtl"
                      >
                        {rule.arabicText}
                      </p>
                    </article>
                  ))
                )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
