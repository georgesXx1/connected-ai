"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

type Role = "user" | "assistant";

type Mode =
  | "guest_general"
  | "guest_admissions"
  | "guest_policies"
  | "guest_contact";

type Language = "en" | "fr" | "ar";

type Message = {
  id: string;
  role: Role;
  content: string;
};

type ModeConfig = {
  label: string;
  shortLabel: string;
  eyebrow: string;
  title: string;
  description: string;
  placeholder: string;
  suggestions: string[];
  icon: string;
};

type TranslationSet = {
  portalTitle: string;
  gemaiShort: string;
  back: string;
  you: string;
  assistant: string;
  send: string;
  collapseSidebar: string;
  expandSidebar: string;
  openSidebar: string;
  closeSidebarOverlay: string;
  requestFailed: string;
  responseFailed: string;
  modes: Record<Mode, ModeConfig>;
};

const STORAGE_KEY = "gemai-language";

const EMPTY_CHATS: Record<Mode, Message[]> = {
  guest_general: [],
  guest_admissions: [],
  guest_policies: [],
  guest_contact: [],
};

const TRANSLATIONS: Record<Language, TranslationSet> = {
  en: {
    portalTitle: "Guest Portal",
    gemaiShort: "GEMAI",
    back: "Back to GEMAI",
    you: "You",
    assistant: "AI",
    send: "Send",
    collapseSidebar: "Collapse sidebar",
    expandSidebar: "Expand sidebar",
    openSidebar: "Open sidebar",
    closeSidebarOverlay: "Close sidebar overlay",
    requestFailed:
      "I could not generate a reliable answer right now. Please try again in a moment.",
    responseFailed:
      "I could not reach the assistant just now. Please try again in a moment.",
    modes: {
      guest_general: {
        label: "School Overview",
        shortLabel: "Overview",
        eyebrow: "General school information",
        title: "Explore the school overview",
        description:
          "Ask about the school, its identity, general academic environment, and what guests should know first.",
        placeholder: "Ask about the school overview...",
        suggestions: [
          "Tell me about the school.",
          "What makes this school special?",
          "What kind of learning environment does the school offer?",
          "Give me a general overview of the school.",
        ],
        icon: "O",
      },
      guest_admissions: {
        label: "Admissions",
        shortLabel: "Admissions",
        eyebrow: "Enrollment and joining information",
        title: "Ask about admissions",
        description:
          "Get guidance about joining the school, admissions expectations, and the kind of information a prospective family may want to ask.",
        placeholder: "Ask about admissions...",
        suggestions: [
          "How can a new student apply?",
          "What should families ask during admissions?",
          "What information is usually needed for enrollment?",
          "How should I prepare for an admissions visit?",
        ],
        icon: "A",
      },
      guest_policies: {
        label: "Policies & School Life",
        shortLabel: "Policies",
        eyebrow: "Rules, expectations, and daily life",
        title: "Ask about policies and school life",
        description:
          "Learn about school expectations, student life, daily routines, and the general rules guests often want to understand.",
        placeholder: "Ask about policies or school life...",
        suggestions: [
          "What is student life like at the school?",
          "What rules should families know about?",
          "How does the school handle discipline and expectations?",
          "What should I know about daily school life?",
        ],
        icon: "P",
      },
      guest_contact: {
        label: "Contact & Visit",
        shortLabel: "Contact",
        eyebrow: "Communication and visiting support",
        title: "Ask about contact and visits",
        description:
          "Ask about contacting the school, planning a visit, and the kind of practical information guests may need before coming.",
        placeholder: "Ask about contact or visiting the school...",
        suggestions: [
          "How can I contact the school?",
          "What should I ask before visiting?",
          "How do I arrange a school visit?",
          "What information should guests prepare before contacting the school?",
        ],
        icon: "C",
      },
    },
  },
  fr: {
    portalTitle: "Portail Visiteur",
    gemaiShort: "GEMAI",
    back: "Retour a GEMAI",
    you: "Vous",
    assistant: "IA",
    send: "Envoyer",
    collapseSidebar: "Réduire la barre latérale",
    expandSidebar: "Développer la barre latérale",
    openSidebar: "Ouvrir la barre latérale",
    closeSidebarOverlay: "Fermer le panneau latéral",
    requestFailed:
      "Je n'ai pas pu générer une réponse fiable pour le moment. Veuillez réessayer dans un instant.",
    responseFailed:
      "Je n'ai pas pu joindre l'assistant pour le moment. Veuillez réessayer dans un instant.",
    modes: {
      guest_general: {
        label: "Aperçu de l’école",
        shortLabel: "Aperçu",
        eyebrow: "Informations générales sur l’école",
        title: "Découvrir l’école",
        description:
          "Posez des questions sur l’école, son identité, son environnement académique général et ce qu’un visiteur devrait savoir en premier.",
        placeholder: "Posez une question sur l’école...",
        suggestions: [
          "Présente-moi l’école.",
          "Qu’est-ce qui distingue cette école ?",
          "Quel type d’environnement d’apprentissage propose-t-elle ?",
          "Donne-moi un aperçu général de l’école.",
        ],
        icon: "O",
      },
      guest_admissions: {
        label: "Admission",
        shortLabel: "Admission",
        eyebrow: "Informations pour rejoindre l’école",
        title: "Poser une question sur l’admission",
        description:
          "Obtenez une aide sur l’inscription, les attentes liées à l’admission et les questions utiles qu’une famille intéressée peut poser.",
        placeholder: "Posez une question sur l’admission...",
        suggestions: [
          "Comment un nouvel élève peut-il s’inscrire ?",
          "Quelles questions une famille devrait-elle poser lors de l’admission ?",
          "Quelles informations sont généralement demandées pour l’inscription ?",
          "Comment préparer une visite d’admission ?",
        ],
        icon: "A",
      },
      guest_policies: {
        label: "Politiques et vie scolaire",
        shortLabel: "Politiques",
        eyebrow: "Règles, attentes et vie quotidienne",
        title: "Poser une question sur les politiques et la vie scolaire",
        description:
          "Découvrez les attentes de l’école, la vie des élèves, les routines quotidiennes et les règles générales que les visiteurs souhaitent souvent comprendre.",
        placeholder: "Posez une question sur les politiques ou la vie scolaire...",
        suggestions: [
          "À quoi ressemble la vie scolaire ?",
          "Quelles règles les familles devraient-elles connaître ?",
          "Comment l’école gère-t-elle la discipline et les attentes ?",
          "Que faut-il savoir sur la vie quotidienne à l’école ?",
        ],
        icon: "P",
      },
      guest_contact: {
        label: "Contact et visite",
        shortLabel: "Contact",
        eyebrow: "Aide pour communiquer et visiter",
        title: "Poser une question sur le contact et la visite",
        description:
          "Posez des questions sur la prise de contact avec l’école, l’organisation d’une visite et les informations pratiques utiles avant de venir.",
        placeholder: "Posez une question sur le contact ou la visite...",
        suggestions: [
          "Comment puis-je contacter l’école ?",
          "Que devrais-je demander avant une visite ?",
          "Comment organiser une visite de l’école ?",
          "Quelles informations préparer avant de contacter l’école ?",
        ],
        icon: "C",
      },
    },
  },
  ar: {
    portalTitle: "بوابة الزائر",
    gemaiShort: "GEMAI",
    back: "العودة إلى GEMAI",
    you: "أنت",
    assistant: "AI",
    send: "إرسال",
    collapseSidebar: "طي الشريط الجانبي",
    expandSidebar: "توسيع الشريط الجانبي",
    openSidebar: "فتح الشريط الجانبي",
    closeSidebarOverlay: "إغلاق تراكب الشريط الجانبي",
    requestFailed:
      "تعذّر إنشاء إجابة موثوقة الآن. يرجى المحاولة مرة أخرى بعد قليل.",
    responseFailed:
      "تعذّر الوصول إلى المساعد الآن. يرجى المحاولة مرة أخرى بعد قليل.",
    modes: {
      guest_general: {
        label: "نظرة عامة على المدرسة",
        shortLabel: "نظرة عامة",
        eyebrow: "معلومات عامة عن المدرسة",
        title: "استكشف نظرة عامة على المدرسة",
        description:
          "اسأل عن المدرسة، وهويتها، وبيئتها التعليمية العامة، وما الذي ينبغي على الزائر معرفته أولًا.",
        placeholder: "اسأل عن نظرة عامة على المدرسة...",
        suggestions: [
          "عرّفني بالمدرسة.",
          "ما الذي يميز هذه المدرسة؟",
          "ما نوع البيئة التعليمية التي تقدمها المدرسة؟",
          "أعطني نظرة عامة عن المدرسة.",
        ],
        icon: "ن",
      },
      guest_admissions: {
        label: "القبول",
        shortLabel: "القبول",
        eyebrow: "معلومات الالتحاق والانضمام",
        title: "اسأل عن القبول",
        description:
          "احصل على إرشادات حول الالتحاق بالمدرسة، وتوقعات القبول، ونوع المعلومات التي قد ترغب الأسرة المهتمة في السؤال عنها.",
        placeholder: "اسأل عن القبول...",
        suggestions: [
          "كيف يمكن لطالب جديد التقديم؟",
          "ما الذي يجب على العائلات السؤال عنه أثناء القبول؟",
          "ما المعلومات المطلوبة عادة للتسجيل؟",
          "كيف أستعد لزيارة تتعلق بالقبول؟",
        ],
        icon: "ق",
      },
      guest_policies: {
        label: "السياسات والحياة المدرسية",
        shortLabel: "السياسات",
        eyebrow: "القواعد والتوقعات والحياة اليومية",
        title: "اسأل عن السياسات والحياة المدرسية",
        description:
          "تعرّف على توقعات المدرسة، وحياة الطلاب، والروتين اليومي، والقواعد العامة التي يرغب الزوار عادة في فهمها.",
        placeholder: "اسأل عن السياسات أو الحياة المدرسية...",
        suggestions: [
          "كيف تبدو الحياة المدرسية في هذه المدرسة؟",
          "ما القواعد التي ينبغي على العائلات معرفتها؟",
          "كيف تتعامل المدرسة مع الانضباط والتوقعات؟",
          "ماذا ينبغي أن أعرف عن الحياة اليومية في المدرسة؟",
        ],
        icon: "س",
      },
      guest_contact: {
        label: "التواصل والزيارة",
        shortLabel: "التواصل",
        eyebrow: "مساعدة في التواصل وترتيب الزيارة",
        title: "اسأل عن التواصل والزيارة",
        description:
          "اسأل عن التواصل مع المدرسة، وترتيب زيارة، ونوع المعلومات العملية التي قد يحتاجها الزائر قبل الحضور.",
        placeholder: "اسأل عن التواصل أو زيارة المدرسة...",
        suggestions: [
          "كيف يمكنني التواصل مع المدرسة؟",
          "ما الذي يجب أن أسأل عنه قبل الزيارة؟",
          "كيف يمكنني ترتيب زيارة للمدرسة؟",
          "ما المعلومات التي ينبغي تجهيزها قبل التواصل مع المدرسة؟",
        ],
        icon: "ت",
      },
    },
  },
};

function isLanguage(value: string | null | undefined): value is Language {
  return value === "en" || value === "fr" || value === "ar";
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function PanelIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
    >
      {open ? (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 6 3 12l6 6" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 4H11v16h10z" />
        </>
      ) : (
        <>
          <path strokeLinecap="round" strokeLinejoin="round" d="m15 6 6 6-6 6" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h10v16H3z" />
        </>
      )}
    </svg>
  );
}

function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none text-slate-800 prose-p:my-0 prose-pre:overflow-x-auto prose-pre:rounded-2xl prose-pre:border prose-pre:border-blue-900/10 prose-pre:bg-slate-950 prose-code:text-slate-100 prose-strong:text-slate-950 prose-headings:text-slate-950">
      <ReactMarkdown
        components={{
          p: ({ children }) => (
            <p className="whitespace-pre-wrap break-words leading-7 text-slate-800 not-first:mt-3">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="mt-3 list-disc space-y-2 pl-5 text-slate-800">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-slate-800">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="leading-7">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="mt-3 border-l-2 border-blue-500/70 pl-4 text-slate-600">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function GuestPageContent() {
  const searchParams = useSearchParams();

  const [language, setLanguage] = useState<Language>("en");
  const [activeMode, setActiveMode] = useState<Mode>("guest_general");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [chats, setChats] = useState<Record<Mode, Message[]>>(EMPTY_CHATS);

  const endRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const streamTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const queryLanguage = searchParams.get("lang");
    if (isLanguage(queryLanguage)) {
      setLanguage(queryLanguage);
      try {
        window.localStorage.setItem(STORAGE_KEY, queryLanguage);
      } catch {
        // Ignore storage errors
      }
      return;
    }

    try {
      const storedLanguage = window.localStorage.getItem(STORAGE_KEY);
      if (isLanguage(storedLanguage)) {
        setLanguage(storedLanguage);
      }
    } catch {
      // Ignore storage errors
    }
  }, [searchParams]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Ignore storage errors
    }
  }, [language]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeMode, chats, isLoading]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  }, [input]);

  useEffect(() => {
    return () => {
      if (streamTimerRef.current) {
        clearInterval(streamTimerRef.current);
        streamTimerRef.current = null;
      }
    };
  }, []);

  const translation = useMemo(() => TRANSLATIONS[language], [language]);
  const currentConfig = translation.modes[activeMode];
  const activeMessages = chats[activeMode];
  const hasMessages = activeMessages.length > 0;
  const textDirection = language === "ar" ? "rtl" : "ltr";
  const textAlignClass = language === "ar" ? "text-right" : "text-left";
  function stopStreaming() {
    if (streamTimerRef.current) {
      clearInterval(streamTimerRef.current);
      streamTimerRef.current = null;
    }
  }

  function appendAssistantMessage(mode: Mode, content: string) {
    const assistantId = createId();

    setChats((current) => ({
      ...current,
      [mode]: [
        ...current[mode],
        {
          id: assistantId,
          role: "assistant",
          content: "",
        },
      ],
    }));

    let visibleLength = 0;

    stopStreaming();

    streamTimerRef.current = setInterval(() => {
      const remaining = content.length - visibleLength;

      if (remaining <= 0) {
        stopStreaming();
        return;
      }

      const chunkSize =
        remaining > 420 ? 24 : remaining > 220 ? 18 : remaining > 120 ? 10 : 6;

      visibleLength = Math.min(content.length, visibleLength + chunkSize);
      const nextContent = content.slice(0, visibleLength);

      setChats((current) => ({
        ...current,
        [mode]: current[mode].map((message) =>
          message.id === assistantId
            ? { ...message, content: nextContent }
            : message,
        ),
      }));

      if (visibleLength >= content.length) {
        stopStreaming();
      }
    }, 24);
  }

  async function sendMessage(rawText: string) {
    const trimmed = rawText.trim();
    if (!trimmed || isLoading) return;

    const mode = activeMode;

    const userMessage: Message = {
      id: createId(),
      role: "user",
      content: trimmed,
    };

    const nextMessages = [...chats[mode], userMessage];

    setChats((current) => ({
      ...current,
      [mode]: nextMessages,
    }));

    setInput("");
    setIsLoading(true);
    setMobileSidebarOpen(false);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content }) => ({
            role,
            content,
          })),
          mode,
          language,
        }),
      });

      const data = await response.json().catch(() => null);

      const reply =
        response.ok &&
        typeof data?.reply === "string" &&
        data.reply.trim().length > 0
          ? data.reply.trim()
          : translation.requestFailed;

      appendAssistantMessage(mode, reply);
    } catch (error) {
      console.error("Guest chat request failed:", error);
      appendAssistantMessage(mode, translation.responseFailed);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit() {
    void sendMessage(input);
  }

  function handleSuggestionClick(suggestion: string) {
    setInput(suggestion);
    setMobileSidebarOpen(false);

    window.requestAnimationFrame(() => {
      const textarea = textareaRef.current;

      if (!textarea) {
        return;
      }

      textarea.focus();
      textarea.setSelectionRange(suggestion.length, suggestion.length);
    });
  }

  function handleTextareaKeyDown(
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="gem-app-bg h-screen overflow-hidden">
      <div className="mx-auto h-full max-w-[1540px] p-3 md:p-5">
        <div className="gem-shell relative flex h-full min-h-0 overflow-hidden rounded-[30px]">
          {mobileSidebarOpen && (
            <button
              type="button"
              aria-label={translation.closeSidebarOverlay}
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute inset-0 z-20 bg-black/45 md:hidden"
            />
          )}

          <aside
            className={`absolute inset-y-0 left-0 z-30 flex min-h-0 flex-col border-r border-blue-900/10 bg-white/70 backdrop-blur-2xl transition-all duration-300 md:relative md:z-0 ${
              mobileSidebarOpen
                ? "translate-x-0"
                : "-translate-x-full md:translate-x-0"
            } ${sidebarOpen ? "w-[280px] xl:w-[300px]" : "w-[88px]"}`}
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-4">
              <div className={`${sidebarOpen ? "flex" : "hidden"} min-w-0 items-center gap-3`}>
                <span className="gem-logo-mark flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/80 p-2">
                  <Image src="/school-logo.png" alt="" width={32} height={32} className="object-contain" />
                </span>
                <div className={`min-w-0 ${textAlignClass}`} dir={textDirection}>
                  <p className="gem-eyebrow">{translation.gemaiShort}</p>
                  <h1 className="mt-1 text-base font-bold text-slate-950">
                    {translation.portalTitle}
                  </h1>
                </div>
              </div>

              {!sidebarOpen && (
                <div className="gem-logo-mark mx-auto flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 p-2">
                  <Image src="/school-logo.png" alt="" width={30} height={30} className="object-contain" />
                </div>
              )}

              <button
                type="button"
                onClick={() => setSidebarOpen((current) => !current)}
                aria-label={
                  sidebarOpen
                    ? translation.collapseSidebar
                    : translation.expandSidebar
                }
                className="gem-soft-button inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              >
                <PanelIcon open={sidebarOpen} />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col px-3 py-4">
              <nav className="space-y-2">
                {(Object.keys(translation.modes) as Mode[]).map((mode) => {
                  const config = translation.modes[mode];
                  const isActive = mode === activeMode;

                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => {
                        setActiveMode(mode);
                        setMobileSidebarOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                        isActive
                          ? "border-blue-500/25 bg-blue-600/10 shadow-[0_16px_50px_-35px_rgba(11,47,134,0.8)]"
                          : "border-blue-900/10 bg-white/45 hover:border-blue-500/20 hover:bg-white/80"
                      } ${sidebarOpen ? "justify-start" : "justify-center"}`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-semibold ${
                          isActive
                            ? "bg-blue-600 text-white"
                            : "bg-white/70 text-blue-800"
                        }`}
                      >
                        {config.icon}
                      </span>

                      {sidebarOpen && (
                        <div className={`min-w-0 ${textAlignClass}`} dir={textDirection}>
                          <p className="text-sm font-bold text-slate-950">
                            {config.label}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-slate-500">
                            {config.eyebrow}
                          </p>
                        </div>
                      )}
                    </button>
                  );
                })}
              </nav>

              <div className="mt-auto pt-4" />
            </div>
          </aside>

          <main className="relative flex min-h-0 min-w-0 flex-1 flex-col bg-white/35">
            <Image src="/school-logo.png" alt="" width={360} height={360} className="gem-watermark absolute right-10 top-24 hidden object-contain lg:block" aria-hidden="true" />
            <header className="relative z-10 shrink-0 border-b border-blue-900/10 bg-white/55 px-5 py-4 backdrop-blur-xl sm:px-7">
              <div className="mx-auto flex w-full max-w-5xl items-start justify-between gap-4">
                <div className={`min-w-0 ${textAlignClass}`} dir={textDirection}>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setMobileSidebarOpen(true)}
                      className="gem-soft-button inline-flex h-9 w-9 items-center justify-center rounded-xl md:hidden"
                      aria-label={translation.openSidebar}
                    >
                      <PanelIcon open={false} />
                    </button>

                    <p className="gem-eyebrow">
                      {currentConfig.eyebrow}
                    </p>
                  </div>

                  <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                    {currentConfig.title}
                  </h2>

                  {!hasMessages && (
                    <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500">
                      {currentConfig.description}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Link
                    href={{ pathname: "/", query: { lang: language } }}
                    className="gem-soft-button inline-flex h-10 items-center justify-center rounded-2xl px-4 text-sm font-semibold"
                    dir={textDirection}
                  >
                    {translation.back}
                  </Link>
                  <div
                    className="hidden rounded-full border border-blue-900/10 bg-white/70 px-3 py-1.5 text-xs font-semibold text-blue-800 sm:block"
                    dir={textDirection}
                  >
                    {currentConfig.shortLabel}
                  </div>
                </div>
              </div>
            </header>

            <section className="min-h-0 flex-1 overflow-y-auto">
              <div className="mx-auto flex w-full max-w-5xl flex-col px-5 py-6 sm:px-7 sm:py-8">
                {!hasMessages && (
                  <div className={`max-w-3xl ${textAlignClass}`} dir={textDirection}>
                    <div className="flex flex-wrap gap-2">
                      {currentConfig.suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => handleSuggestionClick(suggestion)}
                          disabled={isLoading}
                          dir={textDirection}
                          className="gem-soft-button rounded-2xl px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className={`${hasMessages ? "mt-0" : "mt-8"} flex flex-col gap-7`}>
                  {activeMessages.map((message) => {
                    const isUser = message.role === "user";

                    return (
                      <div
                        key={message.id}
                        className={`gem-chat-message flex w-full ${isUser ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`flex w-full max-w-3xl items-end gap-3 ${
                            isUser ? "flex-row-reverse" : "flex-row"
                          }`}
                        >
                          <div
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                              isUser
                                ? "bg-blue-600 text-white shadow-[0_14px_30px_-24px_rgba(11,47,134,0.9)]"
                                : "border border-blue-900/10 bg-white/80 text-blue-900"
                            }`}
                            dir={textDirection}
                          >
                            {isUser ? translation.you : translation.assistant}
                          </div>

                          <div
                            className={`min-w-0 max-w-[min(100%,46rem)] rounded-[24px] px-4 py-3.5 shadow-[0_16px_50px_-40px_rgba(0,0,0,0.95)] sm:px-5 ${
                              isUser
                                ? "rounded-br-md bg-[linear-gradient(135deg,#0b2f86,#1147b7_58%,#3f8cff)] text-white"
                                : "rounded-bl-md border border-blue-900/10 bg-white/82 text-slate-800 backdrop-blur"
                            }`}
                          >
                            {isUser ? (
                              <p
                                className={`whitespace-pre-wrap break-words text-[15px] leading-7 ${
                                  language === "ar" ? "text-right" : "text-left"
                                }`}
                                dir={textDirection}
                              >
                                {message.content}
                              </p>
                            ) : (
                              <div dir={textDirection} className={textAlignClass}>
                                <MarkdownMessage content={message.content} />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {isLoading && (
                    <div className="flex w-full justify-start">
                      <div className="flex w-full max-w-3xl items-end gap-3">
                        <div
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-blue-900/10 bg-white/80 text-[11px] font-bold text-blue-900"
                          dir={textDirection}
                        >
                          {translation.assistant}
                        </div>
                        <div className="gem-shimmer rounded-[24px] rounded-bl-md border border-blue-900/10 bg-white/80 px-4 py-4 shadow-[0_16px_50px_-40px_rgba(11,47,134,0.7)]">
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 animate-bounce rounded-full bg-blue-600 [animation-delay:-0.2s]" />
                            <span className="h-2 w-2 animate-bounce rounded-full bg-blue-500 [animation-delay:-0.1s]" />
                            <span className="h-2 w-2 animate-bounce rounded-full bg-blue-400" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div ref={endRef} />
              </div>
            </section>

            <div className="relative z-10 shrink-0 border-t border-blue-900/10 bg-white/55 px-5 py-4 backdrop-blur-xl sm:px-7 sm:py-5">
              <div className="mx-auto w-full max-w-5xl">
                <div className="gem-input rounded-[28px] p-2.5 shadow-[0_22px_70px_-40px_rgba(11,47,134,0.75)]">
                  <div className="flex items-end gap-3">
                    <textarea
                      ref={textareaRef}
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      onKeyDown={handleTextareaKeyDown}
                      placeholder={currentConfig.placeholder}
                      rows={1}
                      dir={textDirection}
                      disabled={isLoading}
                      className={`min-h-[52px] max-h-[180px] flex-1 resize-none bg-transparent px-3 py-3 text-[15px] leading-6 text-slate-900 outline-none placeholder:text-slate-400 ${
                        language === "ar" ? "text-right" : "text-left"
                      }`}
                    />

                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isLoading || input.trim().length === 0}
                      dir={textDirection}
                      className="gem-button inline-flex h-11 shrink-0 items-center justify-center rounded-2xl px-4 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {translation.send}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default function GuestPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09090b]" />}>
      <GuestPageContent />
    </Suspense>
  );
}
