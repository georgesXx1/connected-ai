import fs from "fs";
import path from "path";
import { kv } from "@vercel/kv";

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
  updatedAt: string;
};

const LEGACY_RULES_PATH = path.join(process.cwd(), "data", "school_rules.txt");
const ADMIN_RULES_KEY = "admin_rules";
const PUBLIC_INFO_KEY = "public_info";

const PUBLIC_INFO_KEYS: PublicInfoKey[] = [
  "overview",
  "contact",
  "officeHours",
  "tuition",
  "programs",
];

const DEFAULT_GRADE_SEEDS: Array<{
  id: string;
  className: string;
  ageRange?: string;
}> = [
  { id: "kg1", className: "Kindergarten 1", ageRange: "ages 3-4" },
  { id: "kg2", className: "Kindergarten 2", ageRange: "ages 4-5" },
  { id: "kg3", className: "Kindergarten 3", ageRange: "ages 5-6" },
  { id: "grade-1", className: "Grade 1", ageRange: "ages 6-7" },
  { id: "grade-2", className: "Grade 2", ageRange: "ages 7-8" },
  { id: "grade-3", className: "Grade 3", ageRange: "ages 8-9" },
  { id: "grade-4", className: "Grade 4", ageRange: "ages 9-10" },
  { id: "grade-5", className: "Grade 5", ageRange: "ages 10-11" },
  { id: "grade-6", className: "Grade 6", ageRange: "ages 11-12" },
  { id: "grade-7", className: "Grade 7", ageRange: "ages 12-13" },
  { id: "grade-8", className: "Grade 8", ageRange: "ages 13-14" },
  { id: "grade-9", className: "Grade 9", ageRange: "ages 14-15" },
  { id: "grade-10", className: "Grade 10", ageRange: "ages 15-16" },
  { id: "grade-11", className: "Grade 11", ageRange: "ages 16-17" },
  { id: "grade-12", className: "Grade 12", ageRange: "ages 17-18" },
];

function nowIso() {
  return new Date().toISOString();
}

function readLegacyRulesText() {
  try {
    return fs.readFileSync(LEGACY_RULES_PATH, "utf8");
  } catch {
    return "";
  }
}

function normalizeText(text: string) {
  return text.replace(/\r/g, "").trim();
}

function mergeTextBlocks(...parts: Array<string | undefined>) {
  const nextParts = parts
    .map((part) => normalizeText(part || ""))
    .filter(Boolean);

  return [...new Set(nextParts)].join("\n\n");
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

function buildRulesFromOriginalRulebook() {
  const chunks = readLegacyRulesText()
    .split(/\n\s*\n/)
    .map((chunk) => normalizeText(chunk))
    .filter(Boolean);
  const timestamp = nowIso();

  return chunks.map((chunk, index) => ({
    id: `rule-${String(index + 1).padStart(3, "0")}`,
    title: deriveTitle(chunk, index),
    arabicText: chunk,
    category: inferCategory(chunk),
    createdAt: timestamp,
    updatedAt: timestamp,
    status: "published" as const,
  }));
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
        en: "GEMAI supports the school with official information, clear communication, and practical guidance for families and visitors.",
        fr: "GEMAI soutient l'ecole avec des informations officielles, une communication claire et des indications pratiques pour les familles et les visiteurs.",
        ar: "تقدّم GEMAI معلومات مدرسية رسمية وتواصلًا واضحًا وإرشادًا عمليًا للعائلات والزوار.",
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
        en: "Phone: +961 09 945 190\nEmail: rosairejbeilofficial@gmail.com\nLocation: Blat, Jbeil District, Mount Lebanon, Lebanon.",
        fr: "Telephone : +961 09 945 190\nE-mail : rosairejbeilofficial@gmail.com\nLieu : Blat, district de Jbeil, Mont-Liban, Liban.",
        ar: "الهاتف: +961 09 945 190\nالبريد الالكتروني: rosairejbeilofficial@gmail.com\nالموقع: بلاط، قضاء جبيل، جبل لبنان، لبنان.",
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
        en: "The school day begins at 7:35 AM and ends at 2:40 PM. Visitors should confirm administrative office availability before coming.",
        fr: "La journee scolaire commence a 7h35 et se termine a 14h40. Les visiteurs devraient confirmer les horaires du bureau administratif avant de venir.",
        ar: "يبدأ الدوام المدرسي عند الساعة 7:35 صباحا وينتهي عند الساعة 2:40 بعد الظهر. يفضّل على الزوار تأكيد دوام الإدارة قبل الحضور.",
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
        en: "Public tuition details can be published here whenever the school wants families to review official fee guidance.",
        fr: "Les details publics des frais de scolarite peuvent etre publies ici lorsque l'ecole souhaite partager des indications officielles avec les familles.",
        ar: "يمكن نشر تفاصيل الاقساط هنا عندما ترغب المدرسة في مشاركة توضيحات رسمية مع العائلات.",
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
        en: "This section can describe the curriculum, learning tracks, and official programs followed by the school.",
        fr: "Cette section peut decrire le cursus, les parcours d'apprentissage et les programmes officiels suivis par l'ecole.",
        ar: "يمكن أن يشرح هذا القسم المنهج المعتمد والمسارات التعليمية والبرامج الرسمية التي تتبعها المدرسة.",
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
    books: [
      {
        id: `${grade.id}-book-1`,
        name: `${grade.className} Arabic Reader`,
        status: "active" as const,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: `${grade.id}-book-2`,
        name: `${grade.className} Mathematics Workbook`,
        status: "active" as const,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
      {
        id: `${grade.id}-book-3`,
        name: `${grade.className} Science Notebook`,
        status: "active" as const,
        createdAt: timestamp,
        updatedAt: timestamp,
      },
    ],
    updatedAt: timestamp,
  }));
}

function buildDefaultPublicContent(): Omit<AdminContent, "rules"> {
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
      overviewEntry?.content ?? defaults.overview.content,
      overviewEntry?.updatedAt ?? defaults.overview.updatedAt,
    ),
    contact: createPublicInfoEntry(
      "contact",
      defaults.contact.title,
      {
        en: mergeTextBlocks(contactEntry?.content.en, locationEntry?.content.en) || defaults.contact.content.en,
        fr: mergeTextBlocks(contactEntry?.content.fr, locationEntry?.content.fr) || defaults.contact.content.fr,
        ar: mergeTextBlocks(contactEntry?.content.ar, locationEntry?.content.ar) || defaults.contact.content.ar,
      },
      latestContactTimestamp ?? defaults.contact.updatedAt,
    ),
    officeHours: createPublicInfoEntry(
      "officeHours",
      defaults.officeHours.title,
      officeHoursEntry?.content ?? defaults.officeHours.content,
      officeHoursEntry?.updatedAt ?? defaults.officeHours.updatedAt,
    ),
    tuition: createPublicInfoEntry(
      "tuition",
      defaults.tuition.title,
      tuitionEntry?.content ?? defaults.tuition.content,
      tuitionEntry?.updatedAt ?? defaults.tuition.updatedAt,
    ),
    programs: createPublicInfoEntry(
      "programs",
      defaults.programs.title,
      programsEntry?.content ?? defaults.programs.content,
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
      return rules.map(sanitizeRule);
    }

    const seededRules = buildRulesFromOriginalRulebook().map(sanitizeRule);
    await kv.set(ADMIN_RULES_KEY, seededRules);

    return seededRules;
  } catch {
    return [];
  }
}

async function readAdminPublicContent(): Promise<Omit<AdminContent, "rules">> {
  const defaults = buildDefaultPublicContent();

  try {
    const content = await kv.get<Partial<Omit<AdminContent, "rules">>>(PUBLIC_INFO_KEY);

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
  const [rules, publicContent] = await Promise.all([
    readAdminRules(),
    readAdminPublicContent(),
  ]);

  return {
    rules,
    publicInfo: publicContent.publicInfo,
    gradeInfo: publicContent.gradeInfo,
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

  const nextPublicContent: Omit<AdminContent, "rules"> = {
    publicInfo: sanitizePublicInfo(publicInfo),
    gradeInfo: sanitizeGradeInfo(gradeInfo ?? current.gradeInfo, current.gradeInfo),
    updatedAt: nowIso(),
  };

  await kv.set(PUBLIC_INFO_KEY, nextPublicContent);

  return {
    ...nextPublicContent,
    rules: current.rules,
  };
}

export async function getPublishedRules() {
  const rules = await readAdminRules();
  return rules.filter((rule) => rule.status === "published");
}

export function getOriginalRulebookText() {
  return readLegacyRulesText();
}

export async function getPublishedRulesText() {
  const publishedRules = await getPublishedRules();

  if (publishedRules.length === 0) {
    return readLegacyRulesText();
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

  const gradeTuitionText = content.gradeInfo
    .map((grade) => {
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
    })
    .join("\n\n");

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
