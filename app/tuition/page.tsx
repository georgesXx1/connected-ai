import Link from "next/link";
import Image from "next/image";

import { getGradePublicInfo } from "@/lib/admin-content";

export const dynamic = "force-dynamic";

type Language = "en" | "fr" | "ar";

type TuitionPageProps = {
  searchParams: Promise<{
    lang?: string | string[];
    [key: string]: string | string[] | undefined;
  }>;
};

const TRANSLATIONS = {
  en: {
    title: "Tuition and Books",
    subtitle:
      "Review grade-based tuition, stationery fees, and required books published by the school.",
    back: "Back to GEMAI",
    tuition: "Tuition",
    stationery: "قرطاسيّة / Stationery",
    books: "Required books",
    noBooks: "No active books listed yet.",
  },
  fr: {
    title: "Frais de scolarite et livres",
    subtitle:
      "Consultez les frais par classe, la قرطاسيّة et les livres requis publies par l'ecole.",
    back: "Retour a GEMAI",
    tuition: "Frais de scolarite",
    stationery: "قرطاسيّة / Fournitures",
    books: "Livres requis",
    noBooks: "Aucun livre actif n'est encore indique.",
  },
  ar: {
    title: "الأقساط والكتب المطلوبة",
    subtitle:
      "اطّلع على الأقساط بحسب الصف، والقرطاسيّة، والكتب المطلوبة كما تنشرها المدرسة.",
    back: "العودة إلى GEMAI",
    tuition: "القسط",
    stationery: "قرطاسيّة",
    books: "الكتب المطلوبة",
    noBooks: "لا توجد كتب منشورة بعد.",
  },
} as const;

function normalizeLanguage(value: string | undefined): Language {
  return value === "fr" || value === "ar" ? value : "en";
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatMoney(amount: string, currency: string) {
  return `${amount} ${currency}`.trim();
}

export default async function TuitionPage({ searchParams }: TuitionPageProps) {
  const resolvedSearchParams = await searchParams;
  const language = normalizeLanguage(getSingleParam(resolvedSearchParams.lang));
  const t = TRANSLATIONS[language];
  const textDirection = language === "ar" ? "rtl" : "ltr";
  const textAlignClass = language === "ar" ? "text-right" : "text-left";
  const gradeInfo = getGradePublicInfo();

  return (
    <main
      className="gem-page text-slate-950"
      dir={textDirection}
    >
      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="gem-shell relative overflow-hidden rounded-[30px]">
          <Image src="/school-logo.png" alt="" width={420} height={420} className="gem-watermark absolute -right-16 top-6 hidden object-contain lg:block" aria-hidden="true" />
          <section className="relative border-b border-blue-900/10 px-6 py-8 sm:px-8 lg:px-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className={textAlignClass}>
                <div className="flex items-center gap-3">
                  <span className="gem-logo-mark flex h-12 w-12 items-center justify-center rounded-2xl border border-white/80 p-2">
                    <Image src="/school-logo.png" alt="" width={36} height={36} className="object-contain" />
                  </span>
                  <p className="gem-eyebrow">GEMAI</p>
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

          <section className="grid gap-4 px-6 py-7 sm:px-8 lg:grid-cols-2 lg:px-10 xl:grid-cols-3">
            {gradeInfo.map((grade) => {
              const activeBooks = grade.books.filter((book) => book.status === "active");

              return (
                <article
                  key={grade.id}
                  className="gem-card rounded-[28px] p-6"
                >
                  <div className={textAlignClass}>
                    <h2 className="text-xl font-black text-slate-950">
                      {grade.className}
                    </h2>
                    {grade.ageRange ? (
                      <p className="mt-2 text-sm font-medium text-slate-500">{grade.ageRange}</p>
                    ) : null}
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-blue-900/10 bg-white/70 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700">
                        {t.tuition}
                      </p>
                      <p className="mt-3 text-lg font-black text-slate-950">
                        {formatMoney(grade.tuitionAmount, grade.tuitionCurrency)}
                      </p>
                    </div>
                    <div className="rounded-2xl border border-blue-900/10 bg-white/70 p-4">
                      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700">
                        {t.stationery}
                      </p>
                      <p className="mt-3 text-lg font-black text-slate-950">
                        {formatMoney(grade.stationeryAmount, grade.stationeryCurrency)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-blue-900/10 bg-white/70 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700">
                      {t.books}
                    </p>
                    {activeBooks.length > 0 ? (
                      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
                        {activeBooks.map((book) => (
                          <li key={book.id}>{book.name}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-3 text-sm text-slate-500">{t.noBooks}</p>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        </div>
      </div>
    </main>
  );
}
