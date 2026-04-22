"use client";

import Image from "next/image";
import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type Language = "en" | "fr" | "ar";

type HomePageProps = {
  searchParams: Promise<{
    lang?: string | string[];
    [key: string]: string | string[] | undefined;
  }>;
};

type PublicGradeInfo = {
  id: string;
  className: string;
  tuitionAmount: string;
  tuitionCurrency: string;
  stationeryAmount: string;
  stationeryCurrency: string;
};

const STORAGE_KEY = "gemai-language";
const supportedLangs = ["en", "fr", "ar"] as const;
const ROLE_ORDER = [
  "/student",
  "/teacher",
  "/rules",
  "/guest",
  "/tuition",
  "/schedule",
  "/administration",
] as const;

const translations = {
  en: {
    languageButtons: {
      ar: "العربية",
      en: "English",
      fr: "Français",
    },
    schoolName: "Collège des Sœurs du Rosaire Blat-Jbeil",
    alt: "School logo",
    welcome: "Welcome to GEMAI",
    description:
      "AI assistant for Collège des Sœurs du Rosaire Blat-Jbeil, designed to help students first while still offering guided access for teachers, administration, and guests.",
    supporting:
      "Clear answers, practical school guidance, and one consistent workspace for the whole school community.",
    roles: [
      {
        title: "Student",
        description:
          "Ask about school rules, real situations, activities, and student support tools.",
        href: "/student",
      },
      {
        title: "Administration",
        description: "Manage rules, school data, and internal workflows.",
        href: "/administration",
      },
      {
        title: "Teacher",
        description: "Get policy help, classroom guidance, and support tools.",
        href: "/teacher",
      },
      {
        title: "Guest",
        description: "Explore official school information and general guidance.",
        href: "/guest",
      },
      {
        title: "School Rules",
        description:
          "Open the public official rules page and browse the current published rule set.",
        href: "/rules",
      },
      {
        title: "Tuition",
        description:
          "Review grade-based tuition, stationery fees, and required books.",
        href: "/tuition",
      },
      {
        title: "School Schedule",
        description:
          "View weekly class timetables with period times, subjects, teachers, and recess.",
        href: "/schedule",
      },
    ],
    open: "Open",
    contactEyebrow: "Contact Information",
    contactTitle: "Reach the school directly",
    phone: "Phone",
    email: "Email",
    location: "Location",
    footer:
      "Developed by Elias Daher, Georges Mansour and Marcelino Geara.",
  },
  fr: {
    languageButtons: {
      ar: "العربية",
      en: "English",
      fr: "Français",
    },
    schoolName: "Collège des Sœurs du Rosaire Blat-Jbeil",
    alt: "Logo de l'école",
    welcome: "Bienvenue sur GEMAI",
    description:
      "Assistant IA pour le Collège des Sœurs du Rosaire Blat-Jbeil, conçu d'abord pour aider les élèves tout en offrant un accès guidé aux enseignants, à l'administration et aux visiteurs.",
    supporting:
      "Des réponses claires, une aide scolaire pratique et un espace cohérent pour toute la communauté scolaire.",
    roles: [
      {
        title: "Élève",
        description:
          "Posez des questions sur le règlement scolaire, des situations réelles, les activités et les outils d'accompagnement des élèves.",
        href: "/student",
      },
      {
        title: "Administration",
        description:
          "Gérez le règlement, les données scolaires et les flux de travail internes.",
        href: "/administration",
      },
      {
        title: "Enseignant",
        description:
          "Obtenez de l'aide sur les politiques, la gestion de classe et les outils de soutien.",
        href: "/teacher",
      },
      {
        title: "Visiteur",
        description:
          "Consultez les informations officielles de l'école et les indications générales.",
        href: "/guest",
      },
      {
        title: "Règlement scolaire",
        description:
          "Ouvrez la page publique des règles officielles et consultez la version publiée actuelle.",
        href: "/rules",
      },
      {
        title: "Frais de scolarite",
        description:
          "Consultez les frais par classe, la قرطاسيّة et les livres requis.",
        href: "/tuition",
      },
      {
        title: "School Schedule",
        description:
          "Consultez les emplois du temps par classe avec horaires, matieres, enseignants et recreations.",
        href: "/schedule",
      },
    ],
    open: "Ouvrir",
    contactEyebrow: "Coordonnées",
    contactTitle: "Contacter l'école",
    phone: "Téléphone",
    email: "E-mail",
    location: "Localisation",
    footer:
      "Développé par Elias Daher, Georges Mansour et Marcelino Geara.",
  },
  ar: {
    languageButtons: {
      ar: "العربية",
      en: "English",
      fr: "Français",
    },
    schoolName: "مدرسة راهبات الورديّة",
    alt: "شعار المدرسة",
    welcome: "مرحبًا بكم في GEMAI",
    description:
      "مساعد ذكاء اصطناعي لمدرسة راهبات الورديّة، صُمم لمساعدة الطلاب أولًا مع إتاحة وصول موجّه للمعلمين والإدارة والزوار.",
    supporting:
      "إجابات واضحة، وإرشاد مدرسي عملي، ومساحة موحّدة لكل أفراد المجتمع المدرسي.",
    roles: [
      {
        title: "الطالب",
        description:
          "اسأل عن القوانين المدرسية، والمواقف الواقعية، والأنشطة، وأدوات دعم الطالب.",
        href: "/student",
      },
      {
        title: "الإدارة",
        description: "إدارة القوانين والبيانات المدرسية وسير العمل الداخلي.",
        href: "/administration",
      },
      {
        title: "المعلّم",
        description: "احصل على مساعدة حول السياسات، وإرشاد الصف، وأدوات الدعم.",
        href: "/teacher",
      },
      {
        title: "الزائر",
        description: "اطّلع على معلومات المدرسة الرسمية والإرشادات العامة.",
        href: "/guest",
      },
      {
        title: "القوانين المدرسية",
        description:
          "افتح الصفحة العامة للقوانين الرسمية واطّلع على النسخة المنشورة الحالية.",
        href: "/rules",
      },
      {
        title: "الأقساط",
        description:
          "اطّلع على الأقساط بحسب الصف، والقرطاسيّة، والكتب المطلوبة.",
        href: "/tuition",
      },
      {
        title: "School Schedule",
        description:
          "View class timetables with period times, subjects, teachers, and recess.",
        href: "/schedule",
      },
    ],
    open: "فتح",
    contactEyebrow: "معلومات التواصل",
    contactTitle: "تواصل مع المدرسة مباشرة",
    phone: "الهاتف",
    email: "البريد الإلكتروني",
    location: "الموقع",
    footer: "تم تطويره بواسطة Elias Daher و Georges Mansour و Marcelino Geara.",
  },
} satisfies Record<
  Language,
  {
    languageButtons: Record<Language, string>;
    schoolName: string;
    alt: string;
    welcome: string;
    description: string;
    supporting: string;
    roles: Array<{
      title: string;
      description: string;
      href: string;
    }>;
    open: string;
    contactEyebrow: string;
    contactTitle: string;
    phone: string;
    email: string;
    location: string;
    footer: string;
  }
>;

function normalizeLang(value: string | undefined): Language {
  if (value === "fr" || value === "ar" || value === "en") {
    return value;
  }

  return "en";
}

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function buildQueryString(
  params: Record<string, string | string[] | undefined>,
  language: Language,
) {
  const nextParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (key === "lang" || value === undefined) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((entry) => nextParams.append(key, entry));
      return;
    }

    nextParams.set(key, value);
  });

  nextParams.set("lang", language);
  return nextParams.toString();
}

function formatMoney(amount: string, currency: string) {
  return `${amount} ${currency}`.trim();
}

function buildTuitionSummary(grade: PublicGradeInfo | null, language: Language) {
  if (!grade) {
    return null;
  }

  const tuition = formatMoney(grade.tuitionAmount, grade.tuitionCurrency);
  const stationery = formatMoney(grade.stationeryAmount, grade.stationeryCurrency);

  if (language === "fr") {
    return `${grade.className}: ${tuition}. Fournitures: ${stationery}.`;
  }

  if (language === "ar") {
    return `${grade.className}: ${tuition}. Ø§Ù„Ù‚Ø±Ø·Ø§Ø³ÙŠÙ‘Ø©: ${stationery}.`;
  }

  return `${grade.className}: ${tuition}. Stationery: ${stationery}.`;
}

export default function HomePage({ searchParams }: HomePageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const resolvedSearchParams = use(searchParams);
  const language = normalizeLang(getSingleParam(resolvedSearchParams.lang));
  const [gradeInfo, setGradeInfo] = useState<PublicGradeInfo[]>([]);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  useEffect(() => {
    let ignore = false;

    async function loadPublicInfo() {
      try {
        const response = await fetch("/api/public-info", { cache: "no-store" });
        const payload = (await response.json()) as { gradeInfo?: PublicGradeInfo[] };

        if (!ignore && response.ok && Array.isArray(payload.gradeInfo)) {
          setGradeInfo(payload.gradeInfo);
        }
      } catch {
        if (!ignore) {
          setGradeInfo([]);
        }
      }
    }

    void loadPublicInfo();

    return () => {
      ignore = true;
    };
  }, []);

  function handleLanguageChange(nextLanguage: Language) {
    window.localStorage.setItem(STORAGE_KEY, nextLanguage);
    const queryString = buildQueryString(resolvedSearchParams, nextLanguage);
    router.replace(`${pathname}?${queryString}`, { scroll: false });
  }

  const t = translations[language];
  const textDirection = language === "ar" ? "rtl" : "ltr";
  const textAlignClass = language === "ar" ? "text-right" : "text-left";
  const arabicBodyClass =
    language === "ar" ? "text-base leading-8 sm:text-[1.05rem]" : "";
  const arabicButtonClass = language === "ar" ? "text-[15px]" : "";
  const arabicContactClass = language === "ar" ? "text-[15px] leading-7" : "";
  const gradeOneInfo =
    gradeInfo.find((grade) => grade.id === "grade-1") ?? gradeInfo[0] ?? null;
  const tuitionSummary = buildTuitionSummary(gradeOneInfo, language);
  const roleCards = useMemo(
    () =>
      t.roles
        .map((card) =>
          card.href === "/tuition" && tuitionSummary
            ? { ...card, description: tuitionSummary }
            : card,
        )
        .toSorted(
          (a, b) =>
            ROLE_ORDER.indexOf(a.href as (typeof ROLE_ORDER)[number]) -
            ROLE_ORDER.indexOf(b.href as (typeof ROLE_ORDER)[number]),
        ),
    [t.roles, tuitionSummary],
  );
  const roleCardRows = [
    roleCards.slice(0, 2),
    roleCards.slice(2, 4),
    roleCards.slice(4, 6),
    roleCards.slice(6, 7),
  ];

  return (
    <main className="gem-page text-slate-950" dir={textDirection}>
      <div className="relative z-10 mx-auto max-w-7xl px-5 py-5 sm:px-8 sm:py-7">
        <nav className="gem-panel sticky top-4 z-30 flex items-center justify-between gap-4 rounded-3xl px-4 py-3 sm:px-5">
          <Link
            href={{ pathname: "/", query: { lang: language } }}
            className="flex min-w-0 items-center gap-3"
          >
            <span className="gem-logo-mark flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/80 p-2">
              <Image
                src="/school-logo.png"
                alt={t.alt}
                width={36}
                height={36}
                className="object-contain"
                priority
              />
            </span>
            <span className={`min-w-0 ${textAlignClass}`} dir={textDirection}>
              <span className="gem-eyebrow block">GEMAI</span>
              <span className="mt-1 block truncate text-sm font-semibold text-slate-900">
                {t.schoolName}
              </span>
            </span>
          </Link>

          <div className="hidden items-center gap-2 md:flex">
            <a
              href="#roles"
              className="gem-soft-button rounded-2xl px-4 py-2 text-sm font-semibold"
            >
              {language === "fr" ? "Portails" : language === "ar" ? "البوابات" : "Portals"}
            </a>
            <a
              href="#contact"
              className="gem-soft-button rounded-2xl px-4 py-2 text-sm font-semibold"
            >
              {t.contactEyebrow}
            </a>
          </div>
        </nav>

        <div className="gem-shell relative mt-5 overflow-hidden rounded-[32px]">
          <Image
            src="/school-logo.png"
            alt=""
            width={520}
            height={520}
            className="gem-watermark absolute -right-24 top-12 hidden object-contain lg:block"
            aria-hidden="true"
          />
          <section className="relative px-6 py-12 sm:px-10 sm:py-16 lg:px-14 lg:py-20">
            <div className="mx-auto max-w-5xl text-center">
              <div className="gem-fade-up inline-flex items-center gap-4 rounded-full border border-white/80 bg-white/70 px-4 py-3 shadow-[0_18px_42px_-34px_rgba(11,47,134,0.72)] backdrop-blur">
                <div className="gem-logo-mark flex h-16 w-16 items-center justify-center rounded-2xl border border-white/80 p-2">
                  <Image
                    src="/school-logo.png"
                    alt={t.alt}
                    width={50}
                    height={50}
                    className="object-contain"
                    priority
                  />
                </div>

                <div className={textAlignClass} dir={textDirection}>
                  <p className="gem-eyebrow">
                    GEMAI
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {t.schoolName}
                  </p>
                </div>
              </div>

              <h1
                className="gem-fade-up gem-delay-1 mx-auto mt-8 max-w-4xl text-5xl font-black tracking-tight text-slate-950 sm:text-6xl lg:text-7xl"
                dir={textDirection}
              >
                {t.welcome}
              </h1>

              <p
                className={`gem-fade-up gem-delay-2 mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-700 sm:text-xl ${language === "ar" ? "text-xl sm:text-[1.35rem]" : ""}`}
                dir={textDirection}
              >
                {t.description}
              </p>

              <p
                className={`gem-fade-up gem-delay-2 mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base ${arabicBodyClass}`}
                dir={textDirection}
              >
                {t.supporting}
              </p>

              <div className="gem-fade-up gem-delay-3 mt-8 flex flex-wrap justify-center gap-3">
                <a
                  href="#roles"
                  className="gem-button inline-flex min-h-12 items-center justify-center rounded-2xl px-5 text-sm font-bold"
                >
                  {language === "fr" ? "Explorer GEMAI" : language === "ar" ? "استكشف GEMAI" : "Explore GEMAI"}
                </a>
                <a
                  href="#contact"
                  className="gem-soft-button inline-flex min-h-12 items-center justify-center rounded-2xl px-5 text-sm font-bold"
                >
                  {t.contactTitle}
                </a>
              </div>

              <div className="gem-fade-up gem-delay-3 mt-7 flex flex-wrap justify-center gap-3">
                {(supportedLangs.slice().reverse() as Language[]).map((code) => {
                  const active = language === code;

                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => handleLanguageChange(code)}
                      dir={code === "ar" ? "rtl" : "ltr"}
                      className={`rounded-2xl border px-4 py-2 text-sm font-semibold transition ${
                        active
                          ? "border-blue-500/30 bg-blue-600 text-white shadow-[0_14px_30px_-22px_rgba(11,47,134,0.9)]"
                          : "gem-soft-button"
                      } ${code === "ar" ? arabicButtonClass : ""}`}
                    >
                      {t.languageButtons[code]}
                    </button>
                  );
                })}
              </div>
            </div>
          </section>

          <section
            id="roles"
            className="relative border-t border-blue-900/10 px-6 py-8 sm:px-10 sm:py-10 lg:px-14"
          >
            <div className="mx-auto max-w-5xl">
              <div className="mb-5 flex items-end justify-between gap-4">
                <div className={textAlignClass} dir={textDirection}>
                  <p className="gem-eyebrow">Workspaces</p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                    {language === "fr" ? "Choisissez votre portail" : language === "ar" ? "اختر بوابتك" : "Choose your portal"}
                  </h2>
                </div>
              </div>

              <div className="space-y-4">
                {roleCardRows.map((row, rowIndex) => (
                  <div
                    key={row.map((card) => card.href).join("-")}
                    className={
                      row.length === 1
                        ? "flex justify-center"
                        : "grid gap-4 sm:grid-cols-2"
                    }
                  >
                    {row.map((card) => (
                  <Link
                    key={card.title}
                    href={{ pathname: card.href, query: { lang: language } }}
                    dir={textDirection}
                    className={`gem-card gem-fade-up flex min-h-[220px] flex-col rounded-3xl p-5 ${
                      rowIndex === 3 ? "w-full sm:w-[calc(50%_-_0.5rem)]" : ""
                    }`}
                  >
                    <h2
                      className={`text-2xl font-black tracking-tight text-slate-950 ${textAlignClass}`}
                    >
                      {card.title}
                    </h2>
                    <p
                      className={`mt-3 flex-1 text-sm leading-7 text-slate-600 ${textAlignClass} ${arabicBodyClass}`}
                    >
                      {card.description}
                    </p>
                    <div
                      className={`mt-5 text-sm font-bold text-blue-700 ${textAlignClass} ${
                        language === "ar" ? "text-base" : ""
                      }`}
                    >
                      {t.open} {language === "ar" ? "←" : "→"}
                    </div>
                  </Link>
                    ))}
                  </div>
                ))}
              </div>

              <div id="contact" className="gem-panel mt-6 rounded-3xl px-5 py-6 sm:px-7">
                <div className="text-center" dir={textDirection}>
                  <p className="gem-eyebrow">
                    {t.contactEyebrow}
                  </p>
                  <h3 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                    {t.contactTitle}
                  </h3>
                </div>

                <div className="mx-auto mt-5 max-w-3xl">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border border-blue-900/10 bg-white/70 px-4 py-3 text-center">
                      <p
                        className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700"
                        dir={textDirection}
                      >
                        {t.phone}
                      </p>
                      <a
                        href="tel:+96109945190"
                        dir="ltr"
                        className={`mt-2 block text-sm font-semibold leading-6 text-slate-700 transition hover:text-blue-700 ${arabicContactClass}`}
                      >
                        +961 09 945 190
                      </a>
                    </div>

                    <div className="rounded-2xl border border-blue-900/10 bg-white/70 px-4 py-3 text-center">
                      <p
                        className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700"
                        dir={textDirection}
                      >
                        {t.email}
                      </p>
                      <a
                        href="mailto:rosairejbeilofficial@gmail.com"
                        dir="ltr"
                        className={`mt-2 block text-sm font-semibold leading-6 text-slate-700 transition hover:text-blue-700 ${arabicContactClass}`}
                      >
                        rosairejbeilofficial@gmail.com
                      </a>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-center">
                    <div className="w-full max-w-[22rem] rounded-2xl border border-blue-900/10 bg-white/70 px-4 py-3 text-center">
                      <p
                        className="text-[11px] font-bold uppercase tracking-[0.18em] text-blue-700"
                        dir={textDirection}
                      >
                        {t.location}
                      </p>
                      <p
                        className={`mt-2 text-sm font-semibold leading-6 text-slate-700 ${arabicContactClass}`}
                        dir={textDirection}
                      >
                        Blat, Jbeil District, Mount Lebanon, Lebanon
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <footer
                className="mt-6 border-t border-blue-900/10 pt-5 text-center text-xs font-medium text-slate-500"
                dir={textDirection}
              >
                {t.footer}
              </footer>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
