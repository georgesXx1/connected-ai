import { NextResponse } from "next/server";

import { getAdminSessionUser } from "@/lib/admin-auth";
import { generateNvidiaText, getGeminiClients, getNvidiaClient } from "@/lib/gemini";
import type { GeminiClient } from "@/lib/gemini";

export const runtime = "nodejs";

type Language = "en" | "fr" | "ar";

type AssistantResponsePayload = {
  review: string;
  draft: string;
  suggestedTitle: string;
  note?: string;
};

function buildAssistantError(message: string, status = 503) {
  return NextResponse.json({ error: message }, { status });
}

function buildAiDraftFailureMessage(message: string) {
  if (/RESOURCE_EXHAUSTED|quota|rate-limits|429/i.test(message)) {
    return "The AI drafting quota is temporarily exhausted. Please wait a moment, then try again. No automatic rule draft was created.";
  }

  return `The AI writing assistant could not generate the Arabic rule right now: ${message}`;
}

function isQuotaFailure(message: string) {
  return /RESOURCE_EXHAUSTED|quota|rate-limits|429/i.test(message);
}

function containsArabic(text: string) {
  return /[\u0600-\u06FF]/.test(text);
}

function containsLatinLetters(text: string) {
  return /[A-Za-z]/.test(text);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

async function generateAssistantDraft(clients: GeminiClient[], prompt: string) {
  const models = ["gemini-2.5-flash", "gemini-2.5-flash-lite"];
  const errors: string[] = [];

  for (const client of clients) {
    for (const model of models) {
      try {
        const response = await client.ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            temperature: 0.18,
            topP: 0.8,
            responseMimeType: "application/json",
          },
        });
        const text = typeof response.text === "string" ? response.text.trim() : "";

        if (text) {
          return { text, model, key: client.label };
        }

        errors.push(`${client.label}/${model}: empty response`);
      } catch (error) {
        errors.push(`${client.label}/${model}: ${getErrorMessage(error)}`);
      }
    }
  }

  const nvidia = getNvidiaClient();

  if (nvidia) {
    try {
      const text = await generateNvidiaText(nvidia, prompt, {
        temperature: 0.18,
        topP: 0.8,
        json: true,
      });

      return { text, model: "z-ai/glm4.7", key: nvidia.label };
    } catch (error) {
      errors.push(`${nvidia.label}/z-ai/glm4.7: ${getErrorMessage(error)}`);
    }
  }

  throw new Error(errors.join(" | "));
}

function normalizeSuggestedTitle(value: string, fallback: string) {
  const next = value.trim();
  return next || fallback;
}

function hasPlaceholderDraft(text: string) {
  return /نقترح صياغة|وفق الطلب الإداري|الطلب الإداري المقدم|تتم مراجعتها واعتمادها|تتم مراجعته واعتماده/.test(
    text,
  );
}

function extractMeasurableDetails(text: string) {
  return {
    numbers: [...new Set(text.match(/\b\d+(?:[.,/]\d+)?\b/g) ?? [])],
    gradeLevels: [...new Set(text.match(/\bgrade\s*\d+\b/gi) ?? [])].map((grade) =>
      grade.toLowerCase().replace(/\s+/g, " "),
    ),
    bacTerms: [...new Set(text.match(/\bbac\s*[a-z]+\b/gi) ?? [])].map((term) =>
      term.toLowerCase().replace(/\s+/g, " "),
    ),
  };
}

function preservesMeasurableDetails(sourceText: string, draft: string) {
  const sourceDetails = extractMeasurableDetails(sourceText);
  const normalizedDraft = normalizeSourceForMatching(draft);

  const hasNumbers = sourceDetails.numbers.every((number) => {
    if (normalizedDraft.includes(number.toLowerCase())) {
      return true;
    }

    if (number.includes("/")) {
      return number
        .split("/")
        .filter(Boolean)
        .every((part) => normalizedDraft.includes(part));
    }

    return false;
  });

  const hasBacTerms = sourceDetails.bacTerms.every((term) => {
    if (term === "bac scientifique") {
      return /البكالوريا العلمية|بكالوريا علمية|علمي|scientifique/.test(normalizedDraft);
    }

    if (term === "bac e") {
      return /بكالوريا اقتصادية|bac e|اقتصادية|اقتصادي/.test(normalizedDraft);
    }

    return normalizedDraft.includes(term);
  });

  const hasGradeLevels = sourceDetails.gradeLevels.every((grade) => {
    if (grade === "grade 10") {
      return /الصف العاشر|grade 10|العاشر/.test(normalizedDraft);
    }

    if (grade === "grade 11") {
      return /الصف الحادي عشر|grade 11|الحادي عشر/.test(normalizedDraft);
    }

    return normalizedDraft.includes(grade);
  });

  return hasNumbers && hasBacTerms && hasGradeLevels;
}

function isGenericDisciplineDraft(text: string) {
  const normalized = text.replace(/\s+/g, " ").trim();

  return (
    normalized ===
      "على التلاميذ الالتزام بالتوجيه المدرسي المحدّد من قبل الإدارة والهيئة التعليمية، والتصرّف بما يحافظ على النظام والاحترام وحسن سير الحياة المدرسية." ||
    /الالتزام بالتوجيه المدرسي المحد[ّد]* من قبل الإدارة والهيئة التعليمية/.test(
      normalized,
    )
  );
}

function isInvalidArabicRuleDraft(sourceText: string, draft: string) {
  return (
    !containsArabic(draft) ||
    containsLatinLetters(draft) ||
    hasPlaceholderDraft(draft) ||
    isGenericDisciplineDraft(draft) ||
    !preservesMeasurableDetails(sourceText, draft)
  );
}

function normalizeSourceForMatching(text: string) {
  return text.toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, " ").trim();
}

function includesAny(text: string, patterns: readonly RegExp[]) {
  return patterns.some((pattern) => pattern.test(text));
}

function normalizeScore(value: string) {
  const compact = value.replace(",", ".").replace(/\s+/g, "");

  if (compact.includes("/")) {
    return compact;
  }

  return `${compact}/20`;
}

function pickFirstMatch<T extends { patterns: readonly RegExp[] }>(
  normalized: string,
  entries: readonly T[],
) {
  return entries.find((entry) => includesAny(normalized, entry.patterns)) ?? null;
}

const DAY_TERMS = [
  { patterns: [/monday|الاثنين|الإثنين|يوم الاثنين|يوم الإثنين/], value: "يوم الاثنين" },
  { patterns: [/tuesday|الثلاثاء/], value: "يوم الثلاثاء" },
  { patterns: [/wednesday|الأربعاء|الاربعاء/], value: "يوم الأربعاء" },
  { patterns: [/thursday|الخميس/], value: "يوم الخميس" },
  { patterns: [/friday|الجمعة/], value: "يوم الجمعة" },
  { patterns: [/saturday|السبت/], value: "يوم السبت" },
  { patterns: [/sunday|الأحد|الاحد/], value: "يوم الأحد" },
] as const;

const COLOR_TERMS = [
  { patterns: [/green|أخضر|اخضر|خضراء/], value: "خضراء", title: "الخضراء" },
  { patterns: [/blue|أزرق|ازرق|زرقاء/], value: "زرقاء اللون", title: "الزرقاء" },
  { patterns: [/black|أسود|اسود|سوداء/], value: "سوداء اللون", title: "السوداء" },
  { patterns: [/white|أبيض|ابيض|بيضاء/], value: "بيضاء اللون", title: "البيضاء" },
  { patterns: [/red|أحمر|احمر|حمراء/], value: "حمراء اللون", title: "الحمراء" },
  { patterns: [/yellow|أصفر|اصفر|صفراء/], value: "صفراء اللون", title: "الصفراء" },
] as const;

const ITEM_TERMS = [
  {
    patterns: [/shirt|shirts|قميص|قمصان/],
    plural: "قمصان",
    verbObject: "ارتداء قمصان",
    title: "القمصان",
    type: "clothing",
  },
  {
    patterns: [/shoe|shoes|حذاء|أحذية|احذية/],
    plural: "أحذية",
    verbObject: "ارتداء أحذية",
    title: "الأحذية",
    type: "clothing",
  },
  {
    patterns: [/uniform|زي|لباس/],
    plural: "الزي المدرسي",
    verbObject: "ارتداء الزي المدرسي",
    title: "الزي المدرسي",
    type: "clothing",
  },
  {
    patterns: [/laptop|laptops|computer|computers|حاسوب|حواسيب|كمبيوتر|أجهزة الكمبيوتر المحمولة|اجهزة الكمبيوتر المحمولة/],
    plural: "أجهزة الكمبيوتر المحمولة",
    verbObject: "إحضار أجهزة الكمبيوتر المحمولة",
    title: "أجهزة الكمبيوتر المحمولة",
    type: "device",
  },
  {
    patterns: [/phone|phones|mobile|cellphone|smartphone|هاتف|هواتف|جوال|موبايل/],
    plural: "الهواتف",
    verbObject: "إحضار الهواتف أو استخدامها",
    title: "الهواتف",
    type: "device",
  },
  {
    patterns: [/class|classroom|room|صف|الصف|غرفة الصف/],
    plural: "الصفوف",
    verbObject: "البقاء داخل الصف",
    title: "البقاء داخل الصف",
    type: "place",
  },
] as const;

function inferFallbackTitle(sourceText: string, fallback: string) {
  const normalized = normalizeSourceForMatching(sourceText);
  const item = pickFirstMatch(normalized, ITEM_TERMS);
  const day = pickFirstMatch(normalized, DAY_TERMS);
  const color = pickFirstMatch(normalized, COLOR_TERMS);

  if (/recess|break|فرصة|استراحة/.test(normalized)) {
    return "تنظيم وقت الفرصة";
  }

  if (item?.type === "clothing" && color) {
    return day
      ? `الالتزام بـ ${item.title} ${color.title} ${day.value}`
      : `الالتزام بـ ${item.title} ${color.title}`;
  }

  if (item) {
    return item.title;
  }

  if (/teacher|teachers|معلم|معلمين|معلّم|معلّمين/.test(normalized)) {
    return "احترام الهيئة التعليمية";
  }

  return fallback;
}

function buildLocalArabicRuleDraft(sourceText: string, existingRuleText: string) {
  const existing = existingRuleText.trim();

  if (existing) {
    return existing;
  }

  const normalized = normalizeSourceForMatching(sourceText);
  const forbids = /not allowed|must not|can't|cannot|forbidden|prohibited|ban|banned|prevent|يمنع|ممنوع|لا يجوز/.test(
    normalized,
  );
  const requires = /must|required|obligated|obligatory|mandatory|have to|should|يجب|يلتزم|يطلب/.test(normalized);
  const allowsOnly = /only allowed|allowed only|only if|except|unless|إلا|فقط/.test(
    normalized,
  );
  const students = /student|students|pupil|pupils|learner|learners|تلميذ|تلاميذ|طلاب|طالب/.test(
    normalized,
  );
  const day = pickFirstMatch(normalized, DAY_TERMS);
  const color = pickFirstMatch(normalized, COLOR_TERMS);
  const item = pickFirstMatch(normalized, ITEM_TERMS);
  const teacherNeeded = /needed by teachers|required by teachers|requested by teachers|teacher needs|teacher requires|teacher|teachers|معلم|معلمين|معلّم|معلّمين|هيئة تعليمية/.test(
    normalized,
  );
  const grade11Scientific =
    /grade\s*11|الحادي عشر|11/.test(normalized) &&
    /scientifique|scientific|علمي|العلمية/.test(normalized);
  const grade10FinalReport =
    /grade\s*10|العاشر|10/.test(normalized) &&
    /final report|report card|الشهادة النهائية|الافادة النهائية|العلامات النهائية/.test(
      normalized,
    );
  const flexibleGeneralAverage = normalized.match(
    /(?:general|overall)(?:\s+(?:average|grade|mark|score))?(?:\s+of)?\s+(\d+(?:[.,]\d+)?(?:\/\d+)?)/,
  );
  const flexibleScientificAverage = normalized.match(
    /(?:scientific)(?:\s+(?:average|grade|mark|score))?(?:\s+of)?\s+(\d+(?:[.,]\d+)?(?:\/\d+)?)/,
  );
  const grade11Economics =
    /grade\s*11|11/.test(normalized) &&
    /economics|economic|bac\s*e|اقتصاد/.test(normalized);

  if (
    grade11Scientific &&
    (flexibleGeneralAverage || flexibleScientificAverage || grade10FinalReport || grade11Economics)
  ) {
    const general = normalizeScore(flexibleGeneralAverage?.[1] || "10/20");
    const scientific = normalizeScore(flexibleScientificAverage?.[1] || "12/20");
    const fallback = grade11Economics
      ? "وإذا لم يستوفِ التلميذ هذين الشرطين، يُوجَّه إلى الصف الحادي عشر – بكالوريا اقتصادية."
      : "وإذا لم يستوفِ التلميذ هذين الشرطين، تحدد الإدارة المسار الأنسب له وفق نتائجه النهائية.";

    return `يُشترط لانتقال التلميذ إلى الصف الحادي عشر – البكالوريا العلمية أن يحصل على معدل عام لا يقل عن ${general} ومعدل في المواد العلمية لا يقل عن ${scientific}${grade10FinalReport ? " في الشهادة النهائية للصف العاشر" : ""}. ${fallback}`;
  }

  const generalAverage = normalized.match(
    /general average(?:\s+of)?\s+(\d+(?:[.,/]\d+)?(?:\/\d+)?)/,
  );
  const scientificAverage = normalized.match(
    /scientific average(?:\s+of)?\s+(\d+(?:[.,/]\d+)?(?:\/\d+)?)/,
  );
  const fallbackBacE = /bac\s*e|بكالوريا اقتصادية|اقتصاد/.test(normalized);

  if (grade11Scientific && (generalAverage || scientificAverage || grade10FinalReport)) {
    const general = generalAverage?.[1] || "10/20";
    const scientific = scientificAverage?.[1] || "12/20";
    const fallback = fallbackBacE
      ? "وإذا لم يستوفِ التلميذ هذين الشرطين، يُوجَّه إلى الصف الحادي عشر – بكالوريا اقتصادية."
      : "وإذا لم يستوفِ التلميذ هذين الشرطين، تحدد الإدارة المسار الأنسب له وفق نتائجه النهائية.";

    return `يُشترط لانتقال التلميذ إلى الصف الحادي عشر – البكالوريا العلمية أن يحصل في الشهادة النهائية للصف العاشر على معدل عام لا يقل عن ${general} ومعدل في المواد العلمية لا يقل عن ${scientific}. ${fallback}`;
  }

  if (
    /recess|break|فرصة|استراحة/.test(normalized) &&
    /class|classroom|room|صف|غرفة/.test(normalized) &&
    (forbids || /stay|remain|البقاء/.test(normalized))
  ) {
    return "يُمنع على التلاميذ البقاء داخل الصف خلال وقت الفرصة، وعليهم مغادرة الصف والتوجّه إلى الأماكن المخصّصة لذلك تحت إشراف الإدارة أو الهيئة التعليمية.";
  }

  if (item?.type === "device" && allowsOnly && teacherNeeded) {
    return `يُمنع إحضار ${item.plural} إلى المدرسة إلا عندما تكون مطلوبة لأغراض تعليمية بإشراف الهيئة التعليمية أو بموافقة الإدارة.`;
  }

  if (item?.type === "clothing" && (requires || color || day)) {
    const colorText = color ? ` ${color.value}` : "";
    const dayText = day ? ` ${day.value}` : "";

    return `يُطلب من التلاميذ ${item.verbObject}${colorText}${dayText} ضمن التعليمات المعتمدة من المدرسة.`;
  }

  if (item?.type === "device" && forbids) {
    return `يُمنع على التلاميذ ${item.verbObject} داخل المدرسة أو خلال أي نشاط مدرسي إلا بموافقة صريحة من الإدارة أو الهيئة التعليمية.`;
  }

  if (/teacher|teachers|معلم|معلمين|معلّم|معلّمين/.test(normalized) && forbids) {
    return "يُمنع على التلاميذ القيام بأي تصرّف غير لائق تجاه المعلّمين أو الهيئة التعليمية، وعليهم الالتزام بالاحترام والمحافظة على بيئة تعليمية منظّمة وآمنة.";
  }

  if (forbids) {
    if (item) {
      return `يُمنع على التلاميذ ${item.verbObject} داخل المدرسة أو خلال أي نشاط مدرسي، وعليهم الالتزام بتوجيهات الإدارة والهيئة التعليمية.`;
    }

    return students
      ? "يُمنع على التلاميذ القيام بالفعل المحدّد في هذا القانون داخل المدرسة أو خلال أي نشاط مدرسي، ويُطبّق هذا المنع وفق الصيغة الرسمية المعتمدة من الإدارة."
      : "يُمنع القيام بالفعل المحدّد في هذا القانون داخل المدرسة أو خلال أي نشاط مدرسي، ويُطبّق هذا المنع وفق الصيغة الرسمية المعتمدة من الإدارة.";
  }

  if (requires) {
    if (item) {
      const dayText = day ? ` ${day.value}` : "";
      return `يُطلب من التلاميذ ${item.verbObject}${dayText} ضمن التعليمات المعتمدة من المدرسة.`;
    }

    return students
      ? "يُطلب من التلاميذ الالتزام بالقاعدة المحدّدة في هذا القانون وفق الصيغة الرسمية المعتمدة من الإدارة والهيئة التعليمية."
      : "يُطلب الالتزام بالقاعدة المحدّدة في هذا القانون وفق الصيغة الرسمية المعتمدة من الإدارة والهيئة التعليمية.";
  }

  if (item) {
    return `يلتزم التلاميذ بالتعليمات المدرسية المتعلقة بـ ${item.plural}، ويتم تطبيقها وفق ما تحدّده الإدارة والهيئة التعليمية.`;
  }

  if (containsArabic(sourceText) && !containsLatinLetters(sourceText)) {
    const officializedRequest = sourceText.trim().replace(/[.،؛\s]+$/, "");

    return `يُعتمد ضمن القوانين المدرسية ما يأتي: ${officializedRequest}. وعلى التلاميذ الالتزام به وفق التعليمات الرسمية الصادرة عن الإدارة والهيئة التعليمية.`;
  }

  return "تُعتمد القاعدة المدرسية المحدّدة من الإدارة ضمن القوانين الرسمية، وتُطبّق على التلاميذ وفق الصياغة المعتمدة والتعليمات الصادرة عن الإدارة والهيئة التعليمية.";
}

function buildFallbackResponse(
  language: Language,
  sourceText: string,
  existingRuleText: string,
  kind: string,
  suggestedTitle: string,
  note?: string,
): AssistantResponsePayload {
  const fallbackDraft = buildFallbackDraft(sourceText, existingRuleText, kind);

  return {
    review: buildFallbackReview(language, Boolean(existingRuleText)),
    draft: fallbackDraft,
    suggestedTitle: inferFallbackTitle(sourceText, suggestedTitle),
    note,
  };
}

function shouldRequireAiDraft(kind: string) {
  return kind === "rule";
}

function extractJsonPayload(raw: string) {
  const trimmed = raw.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const match = trimmed.match(/\{[\s\S]*\}/);
  return match?.[0] ?? trimmed;
}

function buildFallbackReview(language: Language, hasExistingRule: boolean) {
  if (language === "fr") {
    return hasExistingRule
      ? "Cette demande semble modifier une regle existante. Relisez la formulation arabe proposee, puis confirmez-la ou ajustez-la avant l'enregistrement officiel."
      : "Cette demande semble proposer une nouvelle regle. Relisez la formulation arabe proposee, puis confirmez-la ou ajustez-la avant l'enregistrement officiel.";
  }

  if (language === "ar") {
    return hasExistingRule
      ? "يبدو أن هذا الطلب يهدف إلى تعديل قانون قائم. راجع الصياغة العربية المقترحة ثم أكّدها أو عدّلها قبل الحفظ الرسمي."
      : "يبدو أن هذا الطلب يهدف إلى إضافة قانون جديد. راجع الصياغة العربية المقترحة ثم أكّدها أو عدّلها قبل الحفظ الرسمي.";
  }

  return hasExistingRule
    ? "This request appears to revise an existing rule. Review the proposed Arabic wording, then confirm or edit it before the official save."
    : "This request appears to add a new rule. Review the proposed Arabic wording, then confirm or edit it before the official save.";
}

function buildFallbackDraft(
  sourceText: string,
  existingRuleText: string,
  kind: string,
) {
  if (kind === "rule") {
    return buildLocalArabicRuleDraft(sourceText, existingRuleText);
  }

  if (existingRuleText.trim()) {
    return existingRuleText.trim();
  }

  if (containsArabic(sourceText) && !containsLatinLetters(sourceText)) {
    return sourceText.trim();
  }

  if (kind === "rule") {
    return "تُقترح صياغة قانون رسمي جديد وفق الطلب الإداري المقدم، على أن تتم مراجعته واعتماده قبل النشر.";
  }

  return "تُقترح صياغة عربية رسمية جديدة وفق الطلب الإداري المقدم، على أن تتم مراجعتها واعتمادها قبل النشر.";
}

async function repairArabicRuleDraft(
  clients: GeminiClient[],
  language: Language,
  sourceText: string,
  invalidDraft: string,
  fallbackTitle: string,
) {
  const repairPrompt = `
You are rewriting a school rule for the official Arabic rulebook.

The previous draft was too generic or missed details.

Administrator request:
${sourceText}

Invalid previous draft:
${invalidDraft || "None"}

Rewrite it now as one formal Arabic school rule.

Strict requirements:
- Arabic only in the draft.
- Preserve every number, grade level, average, condition, exception, and fallback path from the administrator request.
- Do not summarize the request.
- Do not write a moral/general discipline sentence.
- Do not use English or French terms in the Arabic draft.
- Convert "Grade 11 scientific" or "bac scientifique" into Arabic school-rule wording.
- Convert "Economics" or "Bac E" into Arabic school-rule wording.
- If the rule is about academic eligibility, use a formal شرط/يُشترط structure.

Return strict JSON only:
{
  "review": "short review in ${language}",
  "draft": "formal Arabic rule only",
  "suggestedTitle": "short title"
}
  `.trim();

  const { text } = await generateAssistantDraft(clients, repairPrompt);
  const parsed = JSON.parse(extractJsonPayload(text)) as {
    review?: unknown;
    draft?: unknown;
    suggestedTitle?: unknown;
  };

  if (typeof parsed.review !== "string" || typeof parsed.draft !== "string") {
    return null;
  }

  const draft = parsed.draft.trim();

  if (isInvalidArabicRuleDraft(sourceText, draft)) {
    return null;
  }

  return {
    review: parsed.review.trim(),
    draft,
    suggestedTitle:
      typeof parsed.suggestedTitle === "string"
        ? normalizeSuggestedTitle(parsed.suggestedTitle, fallbackTitle)
        : fallbackTitle,
  } satisfies AssistantResponsePayload;
}

export async function POST(request: Request) {
  const username = await getAdminSessionUser();

  if (!username) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const sourceText =
    typeof (body as { sourceText?: unknown })?.sourceText === "string"
      ? (body as { sourceText: string }).sourceText.trim()
      : "";
  const instructions =
    typeof (body as { instructions?: unknown })?.instructions === "string"
      ? (body as { instructions: string }).instructions.trim()
      : "";
  const kind =
    typeof (body as { kind?: unknown })?.kind === "string"
      ? (body as { kind: string }).kind
      : "general";
  const language =
    (body as { language?: unknown })?.language === "fr" ||
    (body as { language?: unknown })?.language === "ar"
      ? ((body as { language: Language }).language as Language)
      : "en";
  const existingRuleText =
    typeof (body as { existingRuleText?: unknown })?.existingRuleText === "string"
      ? (body as { existingRuleText: string }).existingRuleText.trim()
      : "";
  const existingRuleTitle =
    typeof (body as { existingRuleTitle?: unknown })?.existingRuleTitle === "string"
      ? (body as { existingRuleTitle: string }).existingRuleTitle.trim()
      : "";
  const category =
    typeof (body as { category?: unknown })?.category === "string"
      ? (body as { category: string }).category.trim()
      : "";

  if (!sourceText) {
    return NextResponse.json({ error: "Source text is required." }, { status: 400 });
  }

  const geminiClients = getGeminiClients();
  const fallbackTitle = normalizeSuggestedTitle(
    existingRuleTitle || category || "Official rule draft",
    "Official rule draft",
  );
  const requireAiDraft = shouldRequireAiDraft(kind);

  if (geminiClients.length === 0) {
    if (requireAiDraft) {
      return buildAssistantError(
        "The AI rule drafting key is missing. Add a valid GEMINI_API_KEY before generating official Arabic rule drafts.",
      );
    }

    return NextResponse.json(
      buildFallbackResponse(
        language,
        sourceText,
        existingRuleText,
        kind,
        fallbackTitle,
        "AI key missing, so a basic local draft was returned.",
      ),
    );
  }

  const prompt = `
You are an Arabic institutional writing assistant for a school administration portal.

Task:
- Understand the administrator's requested rule or content change.
- Give a short review of what the request means and what kind of official wording it implies.
- Produce a formal, polished Arabic draft.
- The Arabic draft must be the actual rule text requested by the administrator.
- Extract the concrete obligation, prohibition, permission, time, condition, object, color, place, and people from the administrator request, then preserve those details in Arabic.
- If the request says green shirts on Monday, the draft must mention green shirts and Monday.
- If the request says laptops only when needed by teachers, the draft must mention laptops and the teacher/educational-need condition.
- If the request includes numbers, grade levels, averages, conditions, exceptions, comparisons, or fallback tracks, the draft must preserve every one of those details exactly.
- If the request says Grade 10 final report card, Grade 11 scientific track, 10/20, 12/20, and Bac E, the draft must mention all of them.
- The official draft must be Arabic only.
- Never write the official draft in English or French.
- Never mix languages inside the official draft.
- Do not simply translate the administrator's sentence word-for-word.
- Rewrite the idea in the same formal Arabic style as the official school rules.
- Prefer rulebook-style formulations such as "يُطلب من التلاميذ...", "يُمنع على التلاميذ...", "يُشترط...", "لا يجوز...", and "على التلاميذ..." when they fit the request.
- If the administrator writes in Arabic, still polish it into official rule wording instead of copying the raw sentence.
- Match the syntax, sentence rhythm, and professional administrative wording of the existing official Arabic rules.
- Preserve the administrator's exact legal meaning while making the result sound like it belongs in the official rulebook.
- The result should be a context-aware official rule, not a literal translation and not a generic moral statement.
- Never output a placeholder or meta sentence as the official draft.
- The draft must not say "نقترح صياغة", "وفق الطلب الإداري", or anything that merely describes drafting.
- Do not use a generic discipline/order sentence when the admin gave a specific rule.
- Do not replace concrete details with vague wording such as "this school instruction" or "the requested administrative rule".
- Keep the meaning accurate.
- Sound official, calm, and school-appropriate.
- Do not add invented facts or policy details that were not requested or supported by the context.
- If there is existing rule wording, treat it as editing context instead of ignoring it.

Examples:
- If the administrator asks "Students are not allowed to stay in class during recess time.", a good draft is:
  "يُمنع على التلاميذ البقاء داخل الصف خلال وقت الفرصة، وعليهم مغادرة الصف والتوجّه إلى الأماكن المخصّصة لذلك تحت إشراف الإدارة أو الهيئة التعليمية."
- If the administrator asks "Students must wear blue shoes on Monday.", a good draft is:
  "يُطلب من التلاميذ ارتداء أحذية زرقاء اللون يوم الاثنين ضمن الزيّ المدرسيّ المعتمد."
- If the administrator asks "on mondays, wearing green shirts is obligated", a good draft is:
  "يُطلب من التلاميذ ارتداء قمصان خضراء يوم الاثنين ضمن التعليمات المعتمدة من المدرسة."
- If the administrator asks "laptops are only allowed if they are needed by teachers", a good draft is:
  "يُمنع إحضار أجهزة الكمبيوتر المحمولة إلى المدرسة إلا عندما تكون مطلوبة لأغراض تعليمية بإشراف الهيئة التعليمية أو بموافقة الإدارة."
- If the administrator asks "to go to grade 11 bac scientifique the student must have a general average of 10/20 and a scientific average of 12/20 from the grade 10 final report card, otherwise he goes to Bac E", a good draft is:
  "يُشترط لانتقال التلميذ إلى الصف الحادي عشر – البكالوريا العلمية أن يحصل في الشهادة النهائية للصف العاشر على معدل عام لا يقل عن 10/20 ومعدل في المواد العلمية لا يقل عن 12/20. وإذا لم يستوفِ التلميذ هذين الشرطين، يُوجَّه إلى الصف الحادي عشر – بكالوريا اقتصادية."

Target content type: ${kind}
Requested review language: ${language}
Category hint: ${category || "None"}
Existing rule title: ${existingRuleTitle || "None"}
Existing rule wording:
${existingRuleText || "None"}

Optional instructions: ${instructions || "None"}

Return strict JSON only in this shape:
{
  "review": "short review in the requested review language",
  "draft": "formal Arabic draft only, preserving the concrete details from the administrator request",
  "suggestedTitle": "short title for the rule or content"
}

Administrator request:
${sourceText}
  `.trim();

  try {
    const { text: raw } = await generateAssistantDraft(geminiClients, prompt);

    if (!raw) {
      if (requireAiDraft) {
        return buildAssistantError(
          "The AI writing assistant returned an empty response. Please try again.",
          502,
        );
      }

      return NextResponse.json(
        buildFallbackResponse(
          language,
          sourceText,
          existingRuleText,
          kind,
          fallbackTitle,
          "The writing assistant returned an empty draft, so a local Arabic fallback was used.",
        ),
      );
    }

    let parsed: {
      review?: unknown;
      draft?: unknown;
      suggestedTitle?: unknown;
    };

    try {
      parsed = JSON.parse(extractJsonPayload(raw)) as {
        review?: unknown;
        draft?: unknown;
        suggestedTitle?: unknown;
      };
    } catch {
      if (requireAiDraft) {
        try {
          const repaired = await repairArabicRuleDraft(
            geminiClients,
            language,
            sourceText,
            raw,
            fallbackTitle,
          );

          if (repaired) {
            return NextResponse.json(repaired);
          }
        } catch (repairError) {
          console.error(`Arabic rule repair failed: ${getErrorMessage(repairError)}`);
        }

        return buildAssistantError(
          "The AI writing assistant returned malformed text and could not repair it. Please try again.",
          502,
        );
      }

      return NextResponse.json(
        buildFallbackResponse(
          language,
          sourceText,
          existingRuleText,
          kind,
          fallbackTitle,
          "The writing assistant returned malformed JSON, so a local Arabic fallback was used.",
        ),
      );
    }

    if (typeof parsed.review !== "string" || typeof parsed.draft !== "string") {
      if (requireAiDraft) {
        return buildAssistantError(
          "The AI writing assistant returned an invalid draft payload. Please try again.",
          502,
        );
      }

      return NextResponse.json(
        buildFallbackResponse(
          language,
          sourceText,
          existingRuleText,
          kind,
          fallbackTitle,
          "The writing assistant returned an invalid payload, so a local Arabic fallback was used.",
        ),
      );
    }

    const draft = parsed.draft.trim();

    if (isInvalidArabicRuleDraft(sourceText, draft)) {
      try {
        const repaired = await repairArabicRuleDraft(
          geminiClients,
          language,
          sourceText,
          draft,
          fallbackTitle,
        );

        if (repaired) {
          return NextResponse.json(repaired);
        }
      } catch (repairError) {
        console.error(`Arabic rule repair failed: ${getErrorMessage(repairError)}`);
      }

      if (requireAiDraft) {
        return buildAssistantError(
          "The AI writing assistant could not produce a formal Arabic rule that preserved the request details. Please try again with the same request or a slightly clearer wording.",
          502,
        );
      }

      return NextResponse.json(
        buildFallbackResponse(
          language,
          sourceText,
          existingRuleText,
          kind,
          fallbackTitle,
          "The writing assistant returned a generic or invalid draft, so a local Arabic fallback was used.",
        ),
      );
    }

    return NextResponse.json({
      review: parsed.review.trim(),
      draft,
      suggestedTitle:
        typeof parsed.suggestedTitle === "string"
          ? normalizeSuggestedTitle(parsed.suggestedTitle, fallbackTitle)
          : fallbackTitle,
    });
  } catch (error) {
    const message = getErrorMessage(error);

    if (requireAiDraft && isQuotaFailure(message)) {
      return NextResponse.json(
        buildFallbackResponse(
          language,
          sourceText,
          existingRuleText,
          kind,
          fallbackTitle,
          "The AI provider is temporarily quota-limited, so GEMAI generated a formal Arabic draft locally to avoid blocking the Rules Manager.",
        ),
      );
    }

    if (requireAiDraft) {
      return buildAssistantError(
        buildAiDraftFailureMessage(message),
        503,
      );
    }

    return NextResponse.json(
      buildFallbackResponse(
        language,
        sourceText,
        existingRuleText,
        kind,
        fallbackTitle,
        `Writing assistant failed, so a local Arabic fallback was used: ${message}`,
      ),
    );
  }
}
