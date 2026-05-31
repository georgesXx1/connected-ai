"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

type Role = "user" | "assistant";
type Mode = "rules" | "scenario";
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

const TRANSLATIONS: Record<Language, TranslationSet> = {
  en: {
    portalTitle: "Student Portal",
    gemaiShort: "connected AI",
    back: "Back to connected AI",
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
      rules: {
        label: "Rules Assistant",
        shortLabel: "Rules",
        eyebrow: "Official handbook answers",
        title: "Ask about school rules",
        description:
          "Get grounded answers with the relevant handbook guidance, a clear explanation, and a simple conclusion.",
        placeholder: "Ask a question about school rules...",
        suggestions: [
          "Can I leave school early for an appointment?",
          "What happens if I miss an exam because I was sick?",
          "Are phones allowed in school?",
          "Can I eat or drink inside the classroom?",
        ],
        icon: "R",
      },
      scenario: {
        label: "Scenario Checker",
        shortLabel: "Scenario",
        eyebrow: "Practical next-step support",
        title: "Talk through a student situation",
        description:
          "Describe what happened and connected AI will help you think through the best action, the risks, and the clearest next step.",
        placeholder: "Describe your situation...",
        suggestions: [
          "I missed an exam because I was sick for two days.",
          "A student is bullying me. What should I do?",
          "I was late to school for the third time this month.",
          "I brought my phone by mistake. What happens now?",
        ],
        icon: "S",
      },
    },
  },
  fr: {
    portalTitle: "Portail Élève",
    gemaiShort: "connected AI",
    back: "Retour a connected AI",
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
      rules: {
        label: "Assistant Règlement",
        shortLabel: "Règlement",
        eyebrow: "Réponses du manuel officiel",
        title: "Poser une question sur le règlement",
        description:
          "Obtenez une réponse fondée sur le règlement, avec une explication claire et une conclusion simple.",
        placeholder: "Posez une question sur le règlement scolaire...",
        suggestions: [
          "Puis-je quitter l'école plus tôt pour un rendez-vous ?",
          "Que se passe-t-il si j'ai manqué un examen parce que j'étais malade ?",
          "Les téléphones sont-ils autorisés à l'école ?",
          "Puis-je manger ou boire en classe ?",
        ],
        icon: "R",
      },
      scenario: {
        label: "Analyseur de Situation",
        shortLabel: "Situation",
        eyebrow: "Aide concrète pour la suite",
        title: "Parler d'une situation d'élève",
        description:
          "Décrivez ce qui s'est passé et connected AI vous aidera à réfléchir à la meilleure action, aux risques et à l'étape suivante la plus claire.",
        placeholder: "Décrivez votre situation...",
        suggestions: [
          "J'ai manqué un examen parce que j'étais malade pendant deux jours.",
          "Un élève me harcèle. Que dois-je faire ?",
          "Je suis arrivé en retard à l'école pour la troisième fois ce mois-ci.",
          "J'ai apporté mon téléphone par erreur. Que se passe-t-il maintenant ?",
        ],
        icon: "S",
      },
    },
  },
  ar: {
    portalTitle: "بوابة الطالب",
    gemaiShort: "connected AI",
    back: "العودة إلى connected AI",
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
      rules: {
        label: "مساعد القوانين",
        shortLabel: "القوانين",
        eyebrow: "إجابات من الدليل الرسمي",
        title: "اسأل عن القوانين المدرسية",
        description:
          "احصل على إجابات دقيقة مع الإرشاد المناسب من الدليل، وشرح واضح، وخلاصة بسيطة.",
        placeholder: "اكتب سؤالًا عن القوانين المدرسية...",
        suggestions: [
          "هل يمكنني مغادرة المدرسة مبكرًا بسبب موعد؟",
          "ماذا يحدث إذا تغيبت عن امتحان لأنني كنت مريضًا؟",
          "هل الهواتف مسموح بها في المدرسة؟",
          "هل يمكنني الأكل أو الشرب داخل الصف؟",
        ],
        icon: "ق",
      },
      scenario: {
        label: "محلل المواقف",
        shortLabel: "المواقف",
        eyebrow: "دعم عملي للخطوة التالية",
        title: "تحدّث عن موقف طلابي",
        description:
          "صف ما حدث وسيساعدك connected AI على التفكير في أفضل إجراء، والمخاطر، والخطوة التالية الأكثر وضوحًا.",
        placeholder: "صف حالتك...",
        suggestions: [
          "فاتني امتحان لأنني كنت مريضًا لمدة يومين.",
          "أحد الطلاب يتنمّر عليّ. ماذا أفعل؟",
          "تأخرت عن المدرسة للمرة الثالثة هذا الشهر.",
          "أحضرت هاتفي إلى المدرسة عن طريق الخطأ. ماذا سيحدث الآن؟",
        ],
        icon: "م",
      },
    },
  },
};

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

function StudentPageContent() {
  const searchParams = useSearchParams();
  const [selectedLanguage] = useState<Language>(() => {
    if (typeof window === "undefined") {
      return "en";
    }

    const storedLanguage = window.localStorage.getItem(STORAGE_KEY);
    return isLanguage(storedLanguage) ? storedLanguage : "en";
  });
  const [activeMode, setActiveMode] = useState<Mode>("rules");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [chats, setChats] = useState<Record<Mode, Message[]>>({
    rules: [],
    scenario: [],
  });

  const endRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const streamTimerRef = useRef<number | null>(null);

  const queryLanguage = searchParams.get("lang");
  const language = isLanguage(queryLanguage) ? queryLanguage : selectedLanguage;

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, language);
  }, [language]);

  const translation = TRANSLATIONS[language];
  const currentConfig = translation.modes[activeMode];
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

  function streamAssistantReply(mode: Mode, fullText: string) {
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
      console.error("Student chat request failed:", error);
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
                <div className={`min-w-0 ${textAlignClass}`} dir={textDirection}>
                  <p className="gem-eyebrow">{translation.gemaiShort}</p>
                  <h1 className="mt-1 text-base font-bold text-slate-950">
                    {translation.portalTitle}
                  </h1>
                </div>
              </div>

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

export default function StudentPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#09090b]" />}>
      <StudentPageContent />
    </Suspense>
  );
}
