"use client";

import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

import type {
  PublicTeacherAccount,
  ScheduleDay,
  TeacherScheduleEntry,
} from "@/lib/school-schedule";

type Role = "user" | "assistant";
type TeacherMode = "teacher_activity" | "teacher_grades" | "teacher_schedule";
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
  sidebarNote?: string;
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
  modes: Record<Exclude<TeacherMode, "teacher_schedule">, ModeConfig> &
    Partial<Record<"teacher_schedule", ModeConfig>>;
};

const STORAGE_KEY = "gemai-language";
const TEACHER_MODES: TeacherMode[] = [
  "teacher_activity",
  "teacher_grades",
  "teacher_schedule",
];
const DAY_LABELS: Record<ScheduleDay, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
};

const LOCALIZED_DAY_LABELS: Record<Language, Record<ScheduleDay, string>> = {
  en: DAY_LABELS,
  fr: {
    monday: "Lundi",
    tuesday: "Mardi",
    wednesday: "Mercredi",
    thursday: "Jeudi",
    friday: "Vendredi",
  },
  ar: {
    monday: "الاثنين",
    tuesday: "الثلاثاء",
    wednesday: "الأربعاء",
    thursday: "الخميس",
    friday: "الجمعة",
  },
};

const SCHEDULE_TEXT: Record<
  Language,
  {
    loading: string;
    teacherAccount: string;
    logout: string;
    mySchedule: string;
    noSchedule: string;
    day: string;
    period: string;
    class: string;
    subject: string;
    signInEyebrow: string;
    signInTitle: string;
    signInDescription: string;
    username: string;
    password: string;
    signIn: string;
    signingIn: string;
    loginError: string;
  }
> = {
  en: {
    loading: "Loading teacher schedule...",
    teacherAccount: "Teacher account",
    logout: "Log out",
    mySchedule: "My Schedule",
    noSchedule: "No schedule entries have been assigned to this teacher yet.",
    day: "Day",
    period: "Period",
    class: "Class",
    subject: "Subject",
    signInEyebrow: "Teacher sign in",
    signInTitle: "Open your schedule",
    signInDescription:
      "Use the username and password created by Administration.",
    username: "Username",
    password: "Password",
    signIn: "Sign in",
    signingIn: "Signing in...",
    loginError: "The username or password is incorrect.",
  },
  fr: {
    loading: "Chargement de l'emploi du temps...",
    teacherAccount: "Compte enseignant",
    logout: "Se deconnecter",
    mySchedule: "Mon emploi du temps",
    noSchedule:
      "Aucun cours n'a encore ete attribue a cet enseignant.",
    day: "Jour",
    period: "Periode",
    class: "Classe",
    subject: "Matiere",
    signInEyebrow: "Connexion enseignant",
    signInTitle: "Ouvrir mon emploi du temps",
    signInDescription:
      "Utilisez le nom d'utilisateur et le mot de passe crees par l'administration.",
    username: "Nom d'utilisateur",
    password: "Mot de passe",
    signIn: "Se connecter",
    signingIn: "Connexion...",
    loginError: "Le nom d'utilisateur ou le mot de passe est incorrect.",
  },
  ar: {
    loading: "جاري تحميل جدول المعلم...",
    teacherAccount: "حساب المعلم",
    logout: "تسجيل الخروج",
    mySchedule: "جدولي الأسبوعي",
    noSchedule: "لم يتم تعيين أي حصص لهذا المعلم حتى الآن.",
    day: "اليوم",
    period: "الحصة",
    class: "الصف",
    subject: "المادة",
    signInEyebrow: "تسجيل دخول المعلم",
    signInTitle: "افتح جدولك",
    signInDescription:
      "استخدم اسم المستخدم وكلمة المرور اللذين أنشأتهما الإدارة.",
    username: "اسم المستخدم",
    password: "كلمة المرور",
    signIn: "تسجيل الدخول",
    signingIn: "جاري تسجيل الدخول...",
    loginError: "اسم المستخدم أو كلمة المرور غير صحيح.",
  },
};

const TRANSLATIONS: Record<Language, TranslationSet> = {
  en: {
    portalTitle: "Teacher Portal",
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
      "I could not generate a reliable teacher response right now. Please try again in a moment.",
    responseFailed:
      "I could not reach the assistant just now. Please try again in a moment.",
    modes: {
      teacher_activity: {
        label: "Activity Planning",
        shortLabel: "Planning",
        eyebrow: "AI teaching support",
        title: "Plan a classroom activity",
        description:
          "Ask for activities, lesson structures, discussion formats, or classroom exercises and GEMAI will help you shape them into practical teaching plans.",
        placeholder: "Describe the activity you want to build...",
        suggestions: [
          "Plan a biology group activity.",
          "Create a classroom debate outline.",
          "Suggest a grammar revision activity.",
          "Design a science reflection activity.",
        ],
        icon: "A",
      },
      teacher_grades: {
        label: "Performance Support",
        shortLabel: "Support",
        eyebrow: "Teaching and student support",
        sidebarNote: "Grade boosting",
        title: "Support student performance and classroom engagement",
        description:
          "Ask about grades, focus, engagement, classroom atmosphere, or support for struggling students and GEMAI will help you think through practical and fair teaching strategies.",
        placeholder:
          "Ask about grades, focus, engagement, or classroom improvement...",
        suggestions: [
          "How can I help weak students improve steadily?",
          "Give me scientific ways to improve focus in class.",
          "How can I increase engagement in a quiet class?",
          "Suggest a fair grade-boosting formula for these grades.",
        ],
        icon: "G",
      },
      teacher_schedule: {
        label: "My Schedule",
        shortLabel: "Schedule",
        eyebrow: "Teacher timetable",
        title: "My weekly schedule",
        description:
          "Sign in with the teacher account created by Administration to view your assigned classes.",
        placeholder: "",
        suggestions: [],
        icon: "S",
      },
    },
  },
  fr: {
    portalTitle: "Portail Enseignant",
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
      "Je n'ai pas pu générer une réponse fiable pour l'enseignant pour le moment. Veuillez réessayer dans un instant.",
    responseFailed:
      "Je n'ai pas pu joindre l'assistant pour le moment. Veuillez réessayer dans un instant.",
    modes: {
      teacher_activity: {
        label: "Planification d’activité",
        shortLabel: "Planification",
        eyebrow: "Accompagnement pédagogique par IA",
        title: "Planifier une activité de classe",
        description:
          "Demandez une activité, une structure de séance, un format d’échange ou un exercice de classe, et GEMAI vous aidera à en faire un plan concret et exploitable.",
        placeholder: "Décrivez l’activité que vous souhaitez construire...",
        suggestions: [
          "Planifie une activité de groupe en biologie.",
          "Crée le plan d’un débat en classe.",
          "Suggère une activité de révision grammaticale.",
          "Conçois une activité de réflexion en sciences.",
        ],
        icon: "A",
      },
      teacher_grades: {
        label: "Soutien à la performance",
        shortLabel: "Soutien",
        sidebarNote: "Ajustement des notes",
        eyebrow: "Soutien pédagogique et scolaire",
        title: "Améliorer les performances et l’engagement en classe",
        description:
          "Posez des questions sur les notes, la concentration, l’engagement, l’ambiance de classe ou le soutien aux élèves en difficulté, et GEMAI vous aidera avec des pistes concrètes et équilibrées.",
        placeholder:
          "Posez une question sur les notes, la concentration, l’engagement ou l’amélioration de la classe...",
        suggestions: [
          "Comment aider les élèves faibles à progresser régulièrement ?",
          "Donne-moi des moyens scientifiques d’améliorer l’attention en classe.",
          "Comment augmenter l’engagement dans une classe peu participative ?",
          "Suggère une mise à l’échelle équitable pour ces notes.",
        ],
        icon: "N",
      },
      teacher_schedule: {
        label: "Mon emploi du temps",
        shortLabel: "Emploi du temps",
        eyebrow: "Emploi du temps enseignant",
        title: "Mon emploi du temps hebdomadaire",
        description:
          "Connectez-vous avec le compte cree par l'administration pour consulter vos cours.",
        placeholder: "",
        suggestions: [],
        icon: "S",
      },
    },
  },
  ar: {
    portalTitle: "بوابة المعلّم",
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
      "تعذّر إنشاء رد موثوق للمعلّم الآن. يرجى المحاولة مرة أخرى بعد قليل.",
    responseFailed:
      "تعذّر الوصول إلى المساعد الآن. يرجى المحاولة مرة أخرى بعد قليل.",
    modes: {
      teacher_activity: {
        label: "تخطيط النشاط",
        shortLabel: "النشاط",
        eyebrow: "دعم تعليمي بالذكاء الاصطناعي",
        title: "خطّط لنشاط صفي",
        description:
          "اطلب نشاطًا، أو هيكل حصة، أو صيغة نقاش، أو تمرينًا صفيًا، وسيساعدك GEMAI على تحويله إلى خطة عملية واضحة.",
        placeholder: "صف النشاط الذي تريد بناءه...",
        suggestions: [
          "خطّط لنشاط جماعي في الأحياء.",
          "أنشئ مخططًا لمناظرة صفية.",
          "اقترح نشاطًا لمراجعة القواعد.",
          "صمّم نشاط تأمل في العلوم.",
        ],
        icon: "ن",
      },
      teacher_grades: {
        label: "دعم الأداء",
        shortLabel: "الدعم",
        eyebrow: "دعم تعليمي وسلوكي",
        title: "تحسين أداء الطلاب وتفاعلهم داخل الصف",
        description:
          "اسأل عن الدرجات، أو التركيز، أو التفاعل، أو أجواء الصف، أو دعم الطلاب الضعفاء، وسيساعدك GEMAI باقتراحات عملية ومتوازنة.",
        placeholder:
          "اسأل عن الدرجات، أو التركيز، أو التفاعل، أو تحسين الصف...",
        suggestions: [
          "كيف أساعد الطلاب الضعفاء على التحسن تدريجيًا؟",
          "أعطني طرقًا علمية لزيادة التركيز داخل الصف.",
          "كيف أرفع التفاعل في صف هادئ؟",
          "اقترح تعديلًا عادلًا لهذه الدرجات.",
        ],
        icon: "د",
      },
      teacher_schedule: {
        label: "جدولي",
        shortLabel: "الجدول",
        eyebrow: "جدول المعلم",
        title: "جدولي الأسبوعي",
        description:
          "سجّل الدخول باستخدام حساب المعلم الذي أنشأته الإدارة لعرض الحصص المخصصة لك.",
        placeholder: "",
        suggestions: [],
        icon: "ج",
      },
    },
  },
};

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getModeConfig(translation: TranslationSet, mode: TeacherMode): ModeConfig {
  return (
    translation.modes[mode] ??
    TRANSLATIONS.en.modes[mode] ??
    TRANSLATIONS.en.modes.teacher_activity
  );
}

function isLanguage(value: string | null): value is Language {
  return value === "en" || value === "fr" || value === "ar";
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

function TeacherPageContent() {
  const searchParams = useSearchParams();
  const [selectedLanguage] = useState<Language>(() => {
    if (typeof window === "undefined") {
      return "en";
    }

    const storedLanguage = window.localStorage.getItem(STORAGE_KEY);
    return isLanguage(storedLanguage) ? storedLanguage : "en";
  });
  const [activeMode, setActiveMode] = useState<TeacherMode>("teacher_activity");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [chats, setChats] = useState<Record<TeacherMode, Message[]>>({
    teacher_activity: [],
    teacher_grades: [],
    teacher_schedule: [],
  });
  const [teacherLoginForm, setTeacherLoginForm] = useState({
    username: "",
    password: "",
  });
  const [teacherLoginError, setTeacherLoginError] = useState("");
  const [teacherAccount, setTeacherAccount] = useState<PublicTeacherAccount | null>(null);
  const [teacherSchedule, setTeacherSchedule] = useState<TeacherScheduleEntry[]>([]);
  const [isTeacherSessionLoading, setIsTeacherSessionLoading] = useState(true);
  const [isTeacherSigningIn, setIsTeacherSigningIn] = useState(false);

  const endRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const streamTimerRef = useRef<number | null>(null);

  const queryLanguage = searchParams.get("lang");
  const language = isLanguage(queryLanguage) ? queryLanguage : selectedLanguage;

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const translation = TRANSLATIONS[language];
  const scheduleText = SCHEDULE_TEXT[language];
  const dayLabels = LOCALIZED_DAY_LABELS[language];
  const currentConfig = getModeConfig(translation, activeMode);
  const activeMessages = chats[activeMode];
  const hasMessages = activeMessages.length > 0;
  const textDirection = language === "ar" ? "rtl" : "ltr";
  const textAlignClass = language === "ar" ? "text-right" : "text-left";
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [activeMessages, activeMode, isLoading]);

  useEffect(() => {
    const textarea = textareaRef.current;

    if (!textarea) {
      return;
    }

    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
  }, [input]);

  useEffect(() => {
    return () => {
      if (streamTimerRef.current) {
        window.clearInterval(streamTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadTeacherSession() {
      try {
        const response = await fetch("/api/teacher/me");
        const payload = await response.json().catch(() => null);

        if (!cancelled && response.ok && payload?.teacher) {
          setTeacherAccount(payload.teacher);
          setTeacherSchedule(Array.isArray(payload.schedule) ? payload.schedule : []);
        }
      } finally {
        if (!cancelled) {
          setIsTeacherSessionLoading(false);
        }
      }
    }

    void loadTeacherSession();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleTeacherLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTeacherLoginError("");
    setIsTeacherSigningIn(true);

    try {
      const response = await fetch("/api/teacher/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(teacherLoginForm),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.teacher) {
        throw new Error(scheduleText.loginError);
      }

      const scheduleResponse = await fetch("/api/teacher/me");
      const schedulePayload = await scheduleResponse.json().catch(() => null);

      setTeacherAccount(payload.teacher);
      setTeacherSchedule(
        Array.isArray(schedulePayload?.schedule) ? schedulePayload.schedule : [],
      );
      setTeacherLoginForm({ username: "", password: "" });
    } catch (loginError) {
      setTeacherLoginError(
        loginError instanceof Error
          ? loginError.message
          : scheduleText.loginError,
      );
    } finally {
      setIsTeacherSigningIn(false);
    }
  }

  async function handleTeacherLogout() {
    await fetch("/api/teacher/logout", { method: "POST" });
    setTeacherAccount(null);
    setTeacherSchedule([]);
  }

  function streamAssistantReply(mode: TeacherMode, fullText: string) {
    if (streamTimerRef.current) {
      window.clearInterval(streamTimerRef.current);
    }

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

    streamTimerRef.current = window.setInterval(() => {
      const remaining = fullText.length - visibleLength;

      if (remaining <= 0) {
        if (streamTimerRef.current) {
          window.clearInterval(streamTimerRef.current);
          streamTimerRef.current = null;
        }
        return;
      }

      const chunkSize =
        remaining > 420 ? 24 : remaining > 220 ? 18 : remaining > 120 ? 10 : 6;

      visibleLength = Math.min(fullText.length, visibleLength + chunkSize);
      const nextContent = fullText.slice(0, visibleLength);

      setChats((current) => ({
        ...current,
        [mode]: current[mode].map((message) =>
          message.id === assistantId
            ? { ...message, content: nextContent }
            : message,
        ),
      }));

      if (visibleLength >= fullText.length && streamTimerRef.current) {
        window.clearInterval(streamTimerRef.current);
        streamTimerRef.current = null;
      }
    }, 24);
  }

  async function sendMessage(rawText: string) {
    if (activeMode === "teacher_schedule") {
      return;
    }

    const trimmed = rawText.trim();

    if (!trimmed || isLoading) {
      return;
    }

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
        typeof data?.reply === "string" && data.reply.trim().length > 0
          ? data.reply.trim()
          : translation.requestFailed;

      streamAssistantReply(mode, reply);
    } catch (error) {
      console.error("Teacher chat request failed:", error);
      streamAssistantReply(mode, translation.responseFailed);
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
              mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
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
                {TEACHER_MODES.map((mode) => {
                  const config = getModeConfig(translation, mode);
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
                          {config.sidebarNote ? (
                            <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-cyan-300/80">
                              {config.sidebarNote}
                            </p>
                          ) : null}
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
                {activeMode === "teacher_schedule" ? (
                  <div className={`${textAlignClass}`} dir={textDirection}>
                    {isTeacherSessionLoading ? (
                      <div className="gem-panel rounded-[30px] p-7 text-sm text-slate-500">
                        {scheduleText.loading}
                      </div>
                    ) : teacherAccount ? (
                      <div className="space-y-6">
                        <div className="gem-panel rounded-[30px] p-7">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <p className="gem-eyebrow">{scheduleText.teacherAccount}</p>
                              <h3 className="mt-3 text-2xl font-black text-slate-950">
                                {teacherAccount.fullName}
                              </h3>
                              <p className="mt-2 text-sm font-medium text-slate-500">
                                @{teacherAccount.username}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={handleTeacherLogout}
                              className="gem-soft-button inline-flex h-10 items-center justify-center rounded-2xl px-4 text-sm font-semibold"
                            >
                              {scheduleText.logout}
                            </button>
                          </div>
                        </div>

                        <div className="gem-panel overflow-hidden rounded-[30px]">
                          <div className="border-b border-blue-900/10 px-6 py-5">
                            <p className="gem-eyebrow">{scheduleText.mySchedule}</p>
                          </div>
                          {teacherSchedule.length === 0 ? (
                            <div className="p-6 text-sm leading-7 text-slate-500">
                              {scheduleText.noSchedule}
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="min-w-[760px] w-full border-collapse text-left">
                                <thead>
                                  <tr className="border-b border-blue-900/10 bg-white/50">
                                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
                                      {scheduleText.day}
                                    </th>
                                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
                                      {scheduleText.period}
                                    </th>
                                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
                                      {scheduleText.class}
                                    </th>
                                    <th className="px-5 py-4 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
                                      {scheduleText.subject}
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {teacherSchedule.map((entry) => (
                                    <tr
                                      key={entry.id}
                                      className="border-b border-blue-900/10 last:border-b-0"
                                    >
                                      <td className="px-5 py-4 text-sm font-semibold text-slate-950">
                                        {dayLabels[entry.dayOfWeek]}
                                      </td>
                                      <td className="px-5 py-4 text-sm text-slate-600">
                                        <span className="font-semibold text-slate-800">
                                          {entry.periodLabel}
                                        </span>
                                        {entry.startTime && entry.endTime ? (
                                          <span className="mt-1 block text-xs text-slate-500">
                                            {entry.startTime} - {entry.endTime}
                                          </span>
                                        ) : null}
                                      </td>
                                      <td className="px-5 py-4 text-sm font-semibold text-slate-950">
                                        {entry.className}
                                      </td>
                                      <td className="px-5 py-4 text-sm text-slate-600">
                                        {entry.subject}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <form
                        onSubmit={handleTeacherLogin}
                        className="gem-panel mx-auto max-w-xl rounded-[30px] p-7"
                      >
                        <p className="gem-eyebrow">{scheduleText.signInEyebrow}</p>
                        <h3 className="mt-3 text-2xl font-black text-slate-950">
                          {scheduleText.signInTitle}
                        </h3>
                        <p className="mt-3 text-sm leading-7 text-slate-500">
                          {scheduleText.signInDescription}
                        </p>
                        <div className="mt-6 space-y-4">
                          <input
                            value={teacherLoginForm.username}
                            onChange={(event) =>
                              setTeacherLoginForm((current) => ({
                                ...current,
                                username: event.target.value,
                              }))
                            }
                            placeholder={scheduleText.username}
                            className="gem-input h-12 w-full rounded-2xl px-4 text-sm outline-none"
                          />
                          <input
                            type="password"
                            value={teacherLoginForm.password}
                            onChange={(event) =>
                              setTeacherLoginForm((current) => ({
                                ...current,
                                password: event.target.value,
                              }))
                            }
                            placeholder={scheduleText.password}
                            className="gem-input h-12 w-full rounded-2xl px-4 text-sm outline-none"
                          />
                          {teacherLoginError ? (
                            <div className="rounded-2xl border border-rose-500/20 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                              {teacherLoginError}
                            </div>
                          ) : null}
                          <button
                            type="submit"
                            disabled={isTeacherSigningIn}
                            className="gem-button inline-flex h-12 w-full items-center justify-center rounded-2xl text-sm font-bold disabled:opacity-60"
                          >
                            {isTeacherSigningIn ? scheduleText.signingIn : scheduleText.signIn}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                ) : null}

                {activeMode !== "teacher_schedule" && !hasMessages && (
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

                {activeMode !== "teacher_schedule" ? (
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
                ) : null}

                <div ref={endRef} />
              </div>
            </section>

            {activeMode !== "teacher_schedule" ? (
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
            ) : null}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function TeacherPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09090b]" />}>
      <TeacherPageContent />
    </Suspense>
  );
}
