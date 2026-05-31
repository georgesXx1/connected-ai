import { kv } from "@vercel/kv";

import {
  type SchoolScheduleData,
  readSchoolScheduleData,
} from "@/lib/school-schedule";

export type AdminRuleStatus = "draft" | "published" | "trashed";

export type AdminRule = {
  id: string;
  title: string;
  arabicText: string;
  category: string;
  createdAt: string;
  updatedAt: string;
  status: AdminRuleStatus;
};

export type LocalizedContent = {
  en: string;
  fr: string;
  ar: string;
};

export type PublicInfoKey =
  | "overview"
  | "contact"
  | "officeHours"
  | "tuition"
  | "programs";

export type PublicInfoEntry = {
  key: PublicInfoKey;
  title: LocalizedContent;
  content: LocalizedContent;
  updatedAt: string;
};

export type AdminPublicInfo = Record<PublicInfoKey, PublicInfoEntry>;

export type GradeBookStatus = "active" | "trashed";

export type GradeBook = {
  id: string;
  name: string;
  status: GradeBookStatus;
  createdAt: string;
  updatedAt: string;
};

export type MoneyCurrency = "USD" | "LBP";

export type GradePublicInfo = {
  id: string;
  className: string;
  ageRange?: string;
  tuitionAmount: string;
  tuitionCurrency: MoneyCurrency;
  stationeryAmount: string;
  stationeryCurrency: MoneyCurrency;
  books: GradeBook[];
  updatedAt: string;
};

export type AdminContent = {
  rules: AdminRule[];
  publicInfo: AdminPublicInfo;
  gradeInfo: GradePublicInfo[];
  schoolSchedule: SchoolScheduleData;
  updatedAt: string;
};

type AdminPublicContent = Omit<AdminContent, "rules" | "schoolSchedule">;

const RULES_RESET_AT = new Date("2026-05-20T00:00:00.000Z").getTime();
const ADMIN_RULES_KEY = "admin_rules";
const PUBLIC_INFO_KEY = "public_info";

const PUBLIC_INFO_KEYS: PublicInfoKey[] = [
  "overview",
  "contact",
  "officeHours",
  "tuition",
  "programs",
];

const SCHOOL_NAME = "1ere Ecole Officielle - Jbeil";
const SCHOOL_PHONE = "09/540409";
const SCHOOL_EMAIL = "Ecolefarhat@gmail.com";
const SCHOOL_LOCATION = "4MC2+X2X, Byblos";
const SCHOOL_MAPS_URL =
  "https://www.google.com/maps/search/?api=1&query=4MC2%2BX2X%2C%20Byblos";

const DEFAULT_GRADE_SEEDS: Array<{
  id: string;
  className: string;
  ageRange?: string;
}> = [];

function nowIso() {
  return new Date().toISOString();
}

function normalizeText(text: string) {
  return text.replace(/\r/g, "").trim();
}

function replaceLegacyBranding(text: string) {
  return text
    .replace(/Collège des Sœurs du Rosaire Blat-Jbeil/g, SCHOOL_NAME)
    .replace(/College des Soeurs du Rosaire Blat-Jbeil/g, SCHOOL_NAME)
    .replace(/مدرسة راهبات الوردية بلاط - جبيل/g, SCHOOL_NAME)
    .replace(/\+961 09 945 190/g, SCHOOL_PHONE)
    .replace(/cs\.jbeil@rosaire\.edu\.lb/g, SCHOOL_EMAIL)
    .replace(/Blat, Jbeil District, Mount Lebanon, Lebanon/g, SCHOOL_LOCATION)
    .replace(/Blat, district de Jbeil, Mont-Liban, Liban/g, SCHOOL_LOCATION)
    .replace(/بلاط، قضاء جبيل، جبل لبنان، لبنان/g, SCHOOL_LOCATION);
}

function replaceLegacyLocalizedContent(content: LocalizedContent): LocalizedContent {
  return {
    en: replaceLegacyBranding(content.en),
    fr: replaceLegacyBranding(content.fr),
    ar: replaceLegacyBranding(content.ar),
  };
}

export function inferCategory(text: string) {
  if (/تغيب|تأخر|غياب|دوام|attendance|absence|lateness/i.test(text)) {
    return "Attendance";
  }

  if (/مغادرة|الخروج|appointment|leave/i.test(text)) {
    return "Leaving School";
  }

  if (/اختبار|امتحان|evaluation|exam/i.test(text)) {
    return "Exams";
  }

  if (/زي|لباس|uniform|tenue/i.test(text)) {
    return "Uniform";
  }

  if (/هاتف|هاتف نقال|smart|phone|mobile/i.test(text)) {
    return "Devices";
  }

  if (/سلوك|احترام|bullying|conduct|behavior/i.test(text)) {
    return "Behavior";
  }

  if (/صحة|health|medical/i.test(text)) {
    return "Health";
  }

  return "General";
}

export function deriveTitle(chunk: string, index: number) {
  const firstLine = chunk.split("\n")[0]?.trim() || "";
  const numberedTitle = firstLine.match(/^\d+\s*[-–]\s*(.+?)(:)?$/);

  if (numberedTitle?.[1]) {
    return numberedTitle[1].trim();
  }

  const compact = firstLine.replace(/^[-*]\s*/, "").trim();
  if (compact.length > 0) {
    return compact.slice(0, 72);
  }

  return `Rule ${index + 1}`;
}

function isLegacyRule(rule: AdminRule) {
  const createdAt = Date.parse(rule.createdAt);
  return Number.isFinite(createdAt) && createdAt < RULES_RESET_AT;
}

function createPublicInfoEntry(
  key: PublicInfoKey,
  title: LocalizedContent,
  content: LocalizedContent,
  updatedAt = nowIso(),
): PublicInfoEntry {
  return {
    key,
    title,
    content,
    updatedAt,
  };
}

function buildDefaultPublicInfo(): AdminPublicInfo {
  return {
    overview: createPublicInfoEntry(
      "overview",
      {
        en: "School Overview",
        fr: "Presentation de l'ecole",
        ar: "نظرة عامة على المدرسة",
      },
      {
        en: `connected AI supports ${SCHOOL_NAME} with official school information, clear communication, and practical guidance for families and visitors.`,
        fr: `connected AI accompagne ${SCHOOL_NAME} avec des informations officielles, une communication claire et des indications pratiques pour les familles et les visiteurs.`,
        ar: `تقدّم connected AI معلومات مدرسية رسمية وتواصلًا واضحًا وإرشادًا عمليًا للعائلات والزوار في ${SCHOOL_NAME}.`,
      },
    ),
    contact: createPublicInfoEntry(
      "contact",
      {
        en: "Contact Information",
        fr: "Coordonnees",
        ar: "معلومات التواصل",
      },
      {
        en: `Phone: ${SCHOOL_PHONE}\nEmail: ${SCHOOL_EMAIL}\nLocation: ${SCHOOL_LOCATION}\nGoogle Maps: ${SCHOOL_MAPS_URL}`,
        fr: `Telephone : ${SCHOOL_PHONE}\nE-mail : ${SCHOOL_EMAIL}\nLieu : ${SCHOOL_LOCATION}\nGoogle Maps : ${SCHOOL_MAPS_URL}`,
        ar: `الهاتف: ${SCHOOL_PHONE}\nالبريد الالكتروني: ${SCHOOL_EMAIL}\nالموقع: ${SCHOOL_LOCATION}\nخرائط Google: ${SCHOOL_MAPS_URL}`,
      },
    ),
    officeHours: createPublicInfoEntry(
      "officeHours",
      {
        en: "Office Hours",
        fr: "Horaires administratifs",
        ar: "ساعات الدوام",
      },
      {
        en: "Please contact the school office to confirm current administrative hours before visiting.",
        fr: "Veuillez contacter le bureau de l'ecole pour confirmer les horaires administratifs avant votre visite.",
        ar: "يرجى التواصل مع مكتب المدرسة لتأكيد ساعات الدوام الإداري الحالية قبل الزيارة.",
      },
    ),
    tuition: createPublicInfoEntry(
      "tuition",
      {
        en: "Tuition",
        fr: "Frais de scolarite",
        ar: "الاقساط",
      },
      {
        en: "Tuition details are not published yet. Please contact the school office for current information.",
        fr: "Les frais de scolarite ne sont pas encore publies. Veuillez contacter le bureau de l'ecole pour les informations actuelles.",
        ar: "لم تُنشر تفاصيل الأقساط بعد. يرجى التواصل مع مكتب المدرسة للحصول على المعلومات الحالية.",
      },
    ),
    programs: createPublicInfoEntry(
      "programs",
      {
        en: "Programs",
        fr: "Programmes",
        ar: "البرامج",
      },
      {
        en: "Program details can be published by the administration when ready.",
        fr: "Les details des programmes pourront etre publies par l'administration lorsqu'ils seront prets.",
        ar: "يمكن للإدارة نشر تفاصيل البرامج عندما تصبح جاهزة.",
      },
    ),
  };
}

function buildDefaultGradeInfo(): GradePublicInfo[] {
  const timestamp = nowIso();

  return DEFAULT_GRADE_SEEDS.map((grade, index) => ({
    id: grade.id,
    className: grade.className,
    ageRange: grade.ageRange,
    tuitionAmount: String(1800 + index * 120),
    tuitionCurrency: "USD",
    stationeryAmount: String(90 + index * 8),
    stationeryCurrency: "USD",
    books: [],
    updatedAt: timestamp,
  }));
}

function buildDefaultPublicContent(): AdminPublicContent {
  return {
    publicInfo: buildDefaultPublicInfo(),
    gradeInfo: buildDefaultGradeInfo(),
    updatedAt: nowIso(),
  };
}

function isLocalizedContent(value: unknown): value is LocalizedContent {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as LocalizedContent).en === "string" &&
    typeof (value as LocalizedContent).fr === "string" &&
    typeof (value as LocalizedContent).ar === "string"
  );
}

function isPublicInfoKey(value: string): value is PublicInfoKey {
  return PUBLIC_INFO_KEYS.includes(value as PublicInfoKey);
}

function sanitizeRule(rule: Partial<AdminRule>, index: number): AdminRule {
  const timestamp = nowIso();
  const nextStatus =
    rule.status === "draft" || rule.status === "trashed" ? rule.status : "published";

  return {
    id: typeof rule.id === "string" && rule.id.trim()
      ? rule.id.trim()
      : `rule-${String(index + 1).padStart(3, "0")}`,
    title:
      typeof rule.title === "string" && rule.title.trim()
        ? rule.title.trim()
        : `Rule ${index + 1}`,
    arabicText:
      typeof rule.arabicText === "string" ? normalizeText(rule.arabicText) : "",
    category:
      typeof rule.category === "string" && rule.category.trim()
        ? rule.category.trim()
        : "General",
    createdAt:
      typeof rule.createdAt === "string" && rule.createdAt ? rule.createdAt : timestamp,
    updatedAt:
      typeof rule.updatedAt === "string" && rule.updatedAt ? rule.updatedAt : timestamp,
    status: nextStatus,
  };
}

function pickLegacyEntry(
  rawPublicInfo: Record<string, unknown>,
  key: string,
): PublicInfoEntry | null {
  const entry = rawPublicInfo[key];

  if (!entry || typeof entry !== "object") {
    return null;
  }

  const candidate = entry as Partial<PublicInfoEntry>;

  if (!isLocalizedContent(candidate.title) || !isLocalizedContent(candidate.content)) {
    return null;
  }

  return {
    key: isPublicInfoKey(key) ? key : "overview",
    title: candidate.title,
    content: candidate.content,
    updatedAt: typeof candidate.updatedAt === "string" ? candidate.updatedAt : nowIso(),
  };
}

function sanitizePublicInfo(rawPublicInfo: unknown): AdminPublicInfo {
  const defaults = buildDefaultPublicInfo();

  if (!rawPublicInfo || typeof rawPublicInfo !== "object") {
    return defaults;
  }

  const legacyEntries = rawPublicInfo as Record<string, unknown>;
  const overviewEntry = pickLegacyEntry(legacyEntries, "overview");
  const contactEntry = pickLegacyEntry(legacyEntries, "contact");
  const officeHoursEntry = pickLegacyEntry(legacyEntries, "officeHours");
  const tuitionEntry =
    pickLegacyEntry(legacyEntries, "tuition") ?? pickLegacyEntry(legacyEntries, "fees");
  const programsEntry = pickLegacyEntry(legacyEntries, "programs");
  const locationEntry = pickLegacyEntry(legacyEntries, "location");

  const latestContactTimestamp = [contactEntry?.updatedAt, locationEntry?.updatedAt]
    .filter(Boolean)
    .sort()
    .at(-1);

  return {
    overview: createPublicInfoEntry(
      "overview",
      defaults.overview.title,
      replaceLegacyLocalizedContent(overviewEntry?.content ?? defaults.overview.content),
      overviewEntry?.updatedAt ?? defaults.overview.updatedAt,
    ),
    contact: createPublicInfoEntry(
      "contact",
      defaults.contact.title,
      defaults.contact.content,
      latestContactTimestamp ?? defaults.contact.updatedAt,
    ),
    officeHours: createPublicInfoEntry(
      "officeHours",
      defaults.officeHours.title,
      replaceLegacyLocalizedContent(officeHoursEntry?.content ?? defaults.officeHours.content),
      officeHoursEntry?.updatedAt ?? defaults.officeHours.updatedAt,
    ),
    tuition: createPublicInfoEntry(
      "tuition",
      defaults.tuition.title,
      replaceLegacyLocalizedContent(tuitionEntry?.content ?? defaults.tuition.content),
      tuitionEntry?.updatedAt ?? defaults.tuition.updatedAt,
    ),
    programs: createPublicInfoEntry(
      "programs",
      defaults.programs.title,
      replaceLegacyLocalizedContent(programsEntry?.content ?? defaults.programs.content),
      programsEntry?.updatedAt ?? defaults.programs.updatedAt,
    ),
  };
}

function sanitizeBook(book: Partial<GradeBook>, gradeId: string, index: number): GradeBook {
  const timestamp = nowIso();
  const status = book.status === "trashed" ? "trashed" : "active";

  return {
    id:
      typeof book.id === "string" && book.id.trim()
        ? book.id.trim()
        : `${gradeId}-book-${index + 1}`,
    name:
      typeof book.name === "string" && book.name.trim()
        ? book.name.trim()
        : `Book ${index + 1}`,
    status,
    createdAt:
      typeof book.createdAt === "string" && book.createdAt
        ? book.createdAt
        : timestamp,
    updatedAt:
      typeof book.updatedAt === "string" && book.updatedAt
        ? book.updatedAt
        : timestamp,
  };
}

function isMoneyCurrency(value: unknown): value is MoneyCurrency {
  return value === "USD" || value === "LBP";
}

function parseLegacyMoney(
  value: unknown,
  fallbackAmount: string,
  fallbackCurrency: MoneyCurrency,
) {
  if (typeof value !== "string" || !value.trim()) {
    return {
      amount: fallbackAmount,
      currency: fallbackCurrency,
    };
  }

  const trimmed = value.trim();
  const currency = /\bLBP\b/i.test(trimmed)
    ? "LBP"
    : /\bUSD\b/i.test(trimmed)
      ? "USD"
      : fallbackCurrency;
  const amount = trimmed.replace(/\b(USD|LBP)\b/gi, "").trim();

  return {
    amount: amount || fallbackAmount,
    currency,
  };
}

function sanitizeGradeInfo(
  rawGradeInfo: unknown,
  fallbackGradeInfo: GradePublicInfo[] = buildDefaultGradeInfo(),
): GradePublicInfo[] {
  const defaults = buildDefaultGradeInfo();

  if (Array.isArray(rawGradeInfo) && rawGradeInfo.length === 0) {
    return [];
  }

  const fallbackById = new Map(
    fallbackGradeInfo
      .filter((entry): entry is GradePublicInfo => !!entry && typeof entry === "object")
      .map((entry) => [entry.id, entry]),
  );
  const baseGrades = defaults.map((defaultGrade, index) => {
    const fallbackGrade = fallbackById.get(defaultGrade.id);

    if (!fallbackGrade) {
      return defaultGrade;
    }

    return {
      ...defaultGrade,
      ...fallbackGrade,
      id: defaultGrade.id,
      className: fallbackGrade.className || defaultGrade.className,
      ageRange: fallbackGrade.ageRange || defaultGrade.ageRange,
      books:
        fallbackGrade.books.length > 0
          ? fallbackGrade.books.map((book, bookIndex) =>
              sanitizeBook(book, defaultGrade.id, bookIndex),
            )
          : defaultGrade.books,
      updatedAt: fallbackGrade.updatedAt || defaults[index].updatedAt,
    };
  });

  if (!Array.isArray(rawGradeInfo)) {
    return baseGrades;
  }

  const byId = new Map(
    rawGradeInfo
      .filter((entry): entry is Partial<GradePublicInfo> => !!entry && typeof entry === "object")
      .map((entry) => [typeof entry.id === "string" ? entry.id : "", entry]),
  );

  return baseGrades.map((defaultGrade) => {
    const entry = byId.get(defaultGrade.id);

    if (!entry) {
      return defaultGrade;
    }

    const legacyTuition = parseLegacyMoney(
      (entry as Partial<GradePublicInfo> & { tuition?: unknown }).tuition,
      defaultGrade.tuitionAmount,
      defaultGrade.tuitionCurrency,
    );
    const legacyStationery = parseLegacyMoney(
      (entry as Partial<GradePublicInfo> & { stationeryFee?: unknown }).stationeryFee,
      defaultGrade.stationeryAmount,
      defaultGrade.stationeryCurrency,
    );

    const books = Array.isArray(entry.books)
      ? entry.books.map((book, bookIndex) =>
          sanitizeBook(
            book && typeof book === "object" ? (book as Partial<GradeBook>) : {},
            defaultGrade.id,
            bookIndex,
          ),
        )
      : defaultGrade.books;

    return {
      id: defaultGrade.id,
      className:
        typeof entry.className === "string" && entry.className.trim()
          ? entry.className.trim()
          : defaultGrade.className,
      ageRange:
        typeof entry.ageRange === "string" && entry.ageRange.trim()
          ? entry.ageRange.trim()
          : defaultGrade.ageRange,
      tuitionAmount:
        typeof entry.tuitionAmount === "string" && entry.tuitionAmount.trim()
          ? entry.tuitionAmount.trim()
          : legacyTuition.amount,
      tuitionCurrency: isMoneyCurrency(entry.tuitionCurrency)
        ? entry.tuitionCurrency
        : legacyTuition.currency,
      stationeryAmount:
        typeof entry.stationeryAmount === "string" && entry.stationeryAmount.trim()
          ? entry.stationeryAmount.trim()
          : legacyStationery.amount,
      stationeryCurrency: isMoneyCurrency(entry.stationeryCurrency)
        ? entry.stationeryCurrency
        : legacyStationery.currency,
      books,
      updatedAt:
        typeof entry.updatedAt === "string" && entry.updatedAt
          ? entry.updatedAt
          : defaultGrade.updatedAt,
    };
  });
}

async function readAdminRules() {
  try {
    const rules = await kv.get<AdminRule[]>(ADMIN_RULES_KEY);

    if (Array.isArray(rules) && rules.length > 0) {
      const currentRules = rules.map(sanitizeRule).filter((rule) => !isLegacyRule(rule));

      if (currentRules.length !== rules.length) {
        await kv.set(ADMIN_RULES_KEY, currentRules);
      }

      return currentRules;
    }
    return [];
  } catch {
    return [];
  }
}

async function readAdminPublicContent(): Promise<AdminPublicContent> {
  const defaults = buildDefaultPublicContent();

  try {
    const content = await kv.get<Partial<AdminPublicContent>>(PUBLIC_INFO_KEY);

    if (!content || typeof content !== "object") {
      return defaults;
    }

    const publicInfo = sanitizePublicInfo(content.publicInfo);
    const gradeInfo = sanitizeGradeInfo(content.gradeInfo, defaults.gradeInfo);

    return {
      publicInfo,
      gradeInfo,
      updatedAt: typeof content.updatedAt === "string" ? content.updatedAt : defaults.updatedAt,
    };
  } catch {
    return defaults;
  }
}

export async function readAdminContent() {
  const [rules, publicContent, schoolSchedule] = await Promise.all([
    readAdminRules(),
    readAdminPublicContent(),
    readSchoolScheduleData(),
  ]);

  return {
    rules,
    publicInfo: publicContent.publicInfo,
    gradeInfo: publicContent.gradeInfo,
    schoolSchedule,
    updatedAt: publicContent.updatedAt,
  };
}

export async function saveAdminRules(rules: AdminRule[]) {
  const updatedRules = rules.map(sanitizeRule);

  await kv.set(ADMIN_RULES_KEY, updatedRules);
  return readAdminContent();
}

export async function saveAdminPublicInfo(
  publicInfo: AdminPublicInfo,
  gradeInfo?: GradePublicInfo[],
) {
  const current = await readAdminContent();

  const nextPublicContent: AdminPublicContent = {
    publicInfo: sanitizePublicInfo(publicInfo),
    gradeInfo: sanitizeGradeInfo(gradeInfo ?? current.gradeInfo, current.gradeInfo),
    updatedAt: nowIso(),
  };

  await kv.set(PUBLIC_INFO_KEY, nextPublicContent);

  return {
    ...nextPublicContent,
    rules: current.rules,
    schoolSchedule: current.schoolSchedule,
  };
}

export async function getPublishedRules() {
  const rules = await readAdminRules();
  return rules.filter((rule) => rule.status === "published");
}

export function getOriginalRulebookText() {
  return "";
}

export async function getPublishedRulesText() {
  const publishedRules = await getPublishedRules();

  if (publishedRules.length === 0) {
    return "";
  }

  return publishedRules.map((rule) => rule.arabicText).join("\n\n");
}

export async function getGuestPublicInfoContext(mode: string) {
  const content = await readAdminContent();
  const publicInfo = content.publicInfo;

  const sectionMap: Record<string, PublicInfoKey[]> = {
    guest_general: ["overview", "programs", "contact"],
    guest_admissions: ["overview", "tuition", "contact", "officeHours"],
    guest_policies: ["overview", "officeHours", "programs"],
    guest_contact: ["contact", "officeHours", "overview"],
  };

  const keys = sectionMap[mode] || ["overview", "contact", "officeHours", "tuition"];

  const lines = keys.map((key) => {
    const entry = publicInfo[key];

    return [
      `[${entry.title.en}]`,
      `English: ${entry.content.en}`,
      `French: ${entry.content.fr}`,
      `Arabic: ${entry.content.ar}`,
    ].join("\n");
  });

  const publicInfoText = lines.join("\n\n");

  if (mode !== "guest_admissions") {
    return publicInfoText;
  }

  const gradeTuitionText = content.gradeInfo.length === 0
    ? "No grade tuition, stationery, class, schedule, teacher, or book details are currently published."
    : content.gradeInfo.map((grade) => {
      const activeBooks = grade.books
        .filter((book) => book.status === "active")
        .map((book) => `- ${book.name}`)
        .join("\n");

      return [
        `[Grade tuition and books: ${grade.className}]`,
        grade.ageRange ? `Age range: ${grade.ageRange}` : null,
        `Tuition: ${grade.tuitionAmount} ${grade.tuitionCurrency}`,
        `Stationery: ${grade.stationeryAmount} ${grade.stationeryCurrency}`,
        activeBooks ? `Required active books:\n${activeBooks}` : "Required active books: None currently listed.",
        `Last updated: ${grade.updatedAt}`,
      ]
        .filter(Boolean)
        .join("\n");
    }).join("\n\n");

  return [
    publicInfoText,
    "OFFICIAL GRADE TUITION AND BOOKS - use this for admissions questions about a child's grade, tuition, stationery, and required books:",
    gradeTuitionText,
  ].join("\n\n");
}

export async function getGradePublicInfo() {
  const publicContent = await readAdminPublicContent();
  return publicContent.gradeInfo;
}
