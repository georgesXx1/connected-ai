import Link from "next/link";

export const dynamic = "force-dynamic";

type Language = "en" | "fr" | "ar";

type RegistrationPageProps = {
  searchParams: Promise<{
    lang?: string | string[];
    [key: string]: string | string[] | undefined;
  }>;
};

const DOCUMENTS = {
  newStudents: "/documents/new-students-registration.pdf",
  returningStudents: "/documents/returning-students-registration.pdf",
} as const;

const TRANSLATIONS = {
  en: {
    brand: "connected AI",
    back: "Back to connected AI",
    eyebrow: "Registration Desk",
    title: "Student Registration",
    subtitle:
      "A clear place for families to find the official documents needed before visiting the school office.",
    open: "Open document",
    download: "Download PDF",
    sections: [
      {
        key: "newStudents",
        label: "New Students",
        title: "First-time registration",
        description:
          "For families registering a student at the school for the first time. Open the official checklist before preparing the file.",
        details: ["Official required documents", "Family file preparation", "Office-ready checklist"],
      },
      {
        key: "returningStudents",
        label: "Returning Students",
        title: "Renewal registration",
        description:
          "For students already enrolled who are renewing their registration for the next school year.",
        details: ["Renewal documents", "Updated family information", "Quick yearly file review"],
      },
    ],
  },
  fr: {
    brand: "connected AI",
    back: "Retour a connected AI",
    eyebrow: "Bureau des inscriptions",
    title: "Inscription des eleves",
    subtitle:
      "Un espace clair pour retrouver les documents officiels a preparer avant de passer au bureau de l'ecole.",
    open: "Ouvrir le document",
    download: "Telecharger le PDF",
    sections: [
      {
        key: "newStudents",
        label: "Nouveaux eleves",
        title: "Premiere inscription",
        description:
          "Pour les familles qui inscrivent un eleve a l'ecole pour la premiere fois. Consultez la liste officielle avant de preparer le dossier.",
        details: ["Documents officiels requis", "Preparation du dossier familial", "Liste prete pour le bureau"],
      },
      {
        key: "returningStudents",
        label: "Eleves deja inscrits",
        title: "Renouvellement d'inscription",
        description:
          "Pour les eleves deja inscrits qui renouvellent leur inscription pour la prochaine annee scolaire.",
        details: ["Documents de renouvellement", "Informations familiales mises a jour", "Verification rapide du dossier annuel"],
      },
    ],
  },
  ar: {
    brand: "connected AI",
    back: "العودة إلى connected AI",
    eyebrow: "مكتب التسجيل",
    title: "تسجيل التلاميذ",
    subtitle:
      "مساحة واضحة للعائلات للاطلاع على المستندات الرسمية المطلوبة قبل مراجعة مكتب المدرسة.",
    open: "فتح المستند",
    download: "تحميل PDF",
    sections: [
      {
        key: "newStudents",
        label: "التلاميذ الجدد",
        title: "تسجيل للمرة الأولى",
        description:
          "للعائلات التي تسجل تلميذًا في المدرسة للمرة الأولى. افتحوا اللائحة الرسمية قبل تحضير الملف.",
        details: ["المستندات الرسمية المطلوبة", "تحضير ملف العائلة", "لائحة جاهزة لمكتب المدرسة"],
      },
      {
        key: "returningStudents",
        label: "التلاميذ القدامى",
        title: "تجديد التسجيل",
        description:
          "للتلاميذ المسجلين سابقًا والذين يجددون تسجيلهم للسنة الدراسية المقبلة.",
        details: ["مستندات التجديد", "تحديث معلومات العائلة", "مراجعة سريعة للملف السنوي"],
      },
    ],
  },
} as const;

function normalizeLanguage(value: string | undefined): Language {
  return value === "fr" || value === "ar" ? value : "en";
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function RegistrationPage({ searchParams }: RegistrationPageProps) {
  const resolvedSearchParams = await searchParams;
  const language = normalizeLanguage(getSingleParam(resolvedSearchParams.lang));
  const t = TRANSLATIONS[language];
  const textDirection = language === "ar" ? "rtl" : "ltr";
  const textAlignClass = language === "ar" ? "text-right" : "text-left";

  return (
    <main className="gem-page min-h-screen text-slate-950" dir={textDirection}>
      <div className="relative z-10 mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="gem-shell relative overflow-hidden rounded-[30px]">
          <section className="relative border-b border-blue-900/10 px-6 py-8 sm:px-8 lg:px-10">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className={textAlignClass}>
                <div className="flex items-center gap-3">
                  <p className="gem-eyebrow">{t.brand}</p>
                </div>

                <p className="gem-eyebrow mt-6">{t.eyebrow}</p>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 sm:text-5xl">
                  {t.title}
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
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

          <section className="grid gap-4 px-6 py-7 sm:px-8 lg:grid-cols-2 lg:px-10">
            {t.sections.map((section) => {
              const documentHref = DOCUMENTS[section.key];

              return (
                <article key={section.key} className="gem-card flex min-h-[360px] flex-col rounded-[28px] p-6">
                  <div className={textAlignClass}>
                    <p className="gem-eyebrow">{section.label}</p>
                    <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                      {section.title}
                    </h2>
                    <p className="mt-4 text-sm leading-7 text-slate-600">
                      {section.description}
                    </p>
                  </div>

                  <div className="mt-6 grid gap-3">
                    {section.details.map((detail) => (
                      <div
                        key={detail}
                        className="rounded-2xl border border-blue-900/10 bg-white/75 px-4 py-3 text-sm font-semibold text-slate-700"
                      >
                        {detail}
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto flex flex-wrap gap-3 pt-7">
                    <a
                      href={documentHref}
                      target="_blank"
                      rel="noreferrer"
                      className="gem-button inline-flex min-h-11 items-center justify-center rounded-2xl px-4 text-sm font-bold"
                    >
                      {t.open}
                    </a>
                    <a
                      href={documentHref}
                      download
                      className="gem-soft-button inline-flex min-h-11 items-center justify-center rounded-2xl px-4 text-sm font-bold"
                    >
                      {t.download}
                    </a>
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
