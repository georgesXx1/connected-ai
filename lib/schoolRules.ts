import {
  getOriginalRulebookText,
  getPublishedRules,
  type AdminRule,
} from "@/lib/admin-content";

type Concept = {
  name: string;
  aliases: string[];
  terms: string[];
  requiredTermGroups?: string[][];
  specificity: number;
};

type SearchableRuleChunk = {
  text: string;
  searchableText: string;
  source: "updated" | "rulebook";
};

const A = {
  phone: "\u0647\u0627\u062a\u0641",
  mobilePhone: "\u0647\u0627\u062a\u0641 \u0646\u0642\u0627\u0644",
  smartWatch: "\u0633\u0627\u0639\u0629 \u0630\u0643\u064a\u0629",
  electronicGames:
    "\u0627\u0644\u0639\u0627\u0628 \u0627\u0644\u0643\u062a\u0631\u0648\u0646\u064a\u0629",
  prank: "\u0645\u0642\u0644\u0628",
  pranks: "\u0645\u0642\u0627\u0644\u0628",
  joke: "\u0645\u0632\u0627\u062d",
  joking: "\u0645\u0632\u062d",
  aprilFools: "\u0643\u0630\u0628\u0629 \u0627\u0628\u0631\u064a\u0644",
  teacher: "\u0645\u0639\u0644\u0645",
  teachers: "\u0645\u0639\u0644\u0645\u064a\u0646",
  theTeachers: "\u0627\u0644\u0645\u0639\u0644\u0645\u064a\u0646",
  femaleTeachers: "\u0645\u0639\u0644\u0645\u0627\u062a",
  teachingStaff:
    "\u0627\u0644\u0647\u064a\u0626\u0629 \u0627\u0644\u062a\u0639\u0644\u064a\u0645\u064a\u0629",
  smoke: "\u062f\u062e\u0627\u0646",
  smoking: "\u062a\u062f\u062e\u064a\u0646",
  cigarette: "\u0633\u064a\u062c\u0627\u0631\u0629",
  cigarettes: "\u0633\u062c\u0627\u0626\u0631",
  tobacco: "\u062a\u0628\u063a",
  allSmokeTypes:
    "\u0627\u0644\u062f\u062e\u0627\u0646 \u0639\u0644\u0649 \u0627\u0646\u0648\u0627\u0639\u0647",
  weapon: "\u0633\u0644\u0627\u062d",
  weapons: "\u0627\u0633\u0644\u062d\u0629",
  knife: "\u0633\u0643\u064a\u0646",
  knives: "\u0633\u0643\u0627\u0643\u064a\u0646",
  sharpTools:
    "\u0627\u062f\u0648\u0627\u062a \u0642\u0627\u0637\u0639\u0629",
  firearms: "\u0627\u0633\u0644\u062d\u0629 \u0646\u0627\u0631\u064a\u0629",
  bladedWeapons: "\u0627\u0633\u0644\u062d\u0629 \u0628\u064a\u0636\u0627\u0621",
  leave: "\u0645\u063a\u0627\u062f\u0631\u0629",
  permission: "\u0627\u0630\u0646",
  exam: "\u0627\u0645\u062a\u062d\u0627\u0646",
  test: "\u0627\u062e\u062a\u0628\u0627\u0631",
  absence: "\u063a\u064a\u0627\u0628",
  late: "\u062a\u0627\u062e\u0631",
  uniform: "\u0632\u064a",
  clothes: "\u0644\u0628\u0627\u0633",
  hat: "\u0642\u0628\u0639\u0629",
  hats: "\u0642\u0628\u0639\u0627\u062a",
  conduct: "\u0633\u0644\u0648\u0643",
  respect: "\u0627\u062d\u062a\u0631\u0627\u0645",
  violence: "\u0639\u0646\u0641",
  bullying: "\u062a\u0646\u0645\u0631",
  food: "\u0627\u0643\u0644",
  drink: "\u0634\u0631\u0628",
  gum: "\u0639\u0644\u0643\u0629",
};

const CONCEPTS: Concept[] = [
  {
    name: "weapon",
    aliases: [
      "weapon",
      "weapons",
      "gun",
      "guns",
      "knife",
      "knives",
      "blade",
      "firearm",
      "sharp object",
      "cutter",
      A.weapon,
      A.weapons,
      A.knife,
      A.knives,
    ],
    terms: [
      "weapon",
      "gun",
      "knife",
      "blade",
      "firearm",
      "sharp object",
      "cutter",
      A.weapon,
      A.weapons,
      A.knife,
      A.knives,
      A.sharpTools,
      A.firearms,
      A.bladedWeapons,
    ],
    requiredTermGroups: [
      [
        "weapon",
        "gun",
        "knife",
        "blade",
        "firearm",
        "sharp object",
        "cutter",
        A.weapon,
        A.weapons,
        A.knife,
        A.knives,
        A.sharpTools,
      ],
    ],
    specificity: 14,
  },
  {
    name: "teacher_pranks",
    aliases: [
      "prank",
      "pranks",
      "joke",
      "jokes",
      "practical joke",
      "april fools",
      "april's fools",
      "teacher prank",
      "prank teacher",
      "staff prank",
      A.prank,
      A.pranks,
      A.joke,
      A.joking,
      A.aprilFools,
    ],
    terms: [
      "prank",
      "joke",
      "april fools",
      "teacher",
      "teachers",
      "staff",
      A.prank,
      A.pranks,
      A.joke,
      A.joking,
      A.aprilFools,
      A.teacher,
      A.teachers,
      A.theTeachers,
      A.femaleTeachers,
      A.teachingStaff,
    ],
    requiredTermGroups: [
      ["prank", "joke", "april fools", A.prank, A.pranks, A.joke, A.joking, A.aprilFools],
      ["teacher", "teachers", "staff", A.teacher, A.teachers, A.theTeachers, A.femaleTeachers, A.teachingStaff],
    ],
    specificity: 13,
  },
  {
    name: "smoking",
    aliases: [
      "smoke",
      "smokes",
      "smoking",
      "cigarette",
      "cigarettes",
      "vape",
      "vaping",
      "nicotine",
      "tobacco",
      A.smoke,
      A.smoking,
      A.cigarette,
      A.cigarettes,
    ],
    terms: [
      "smoke",
      "smoking",
      "cigarette",
      "vape",
      "nicotine",
      "tobacco",
      A.smoke,
      A.smoking,
      A.cigarette,
      A.cigarettes,
      A.tobacco,
      A.allSmokeTypes,
    ],
    requiredTermGroups: [
      ["smoke", "smoking", "cigarette", "vape", "nicotine", "tobacco", A.smoke, A.smoking, A.cigarette, A.cigarettes, A.tobacco],
    ],
    specificity: 12,
  },
  {
    name: "phone",
    aliases: [
      "phone",
      "phones",
      "mobile",
      "cellphone",
      "cell phone",
      "smartphone",
      "smart watch",
      "smartwatch",
      "watch",
      A.phone,
      A.mobilePhone,
      A.smartWatch,
    ],
    terms: [
      "phone",
      "mobile",
      "cellphone",
      "smartphone",
      "smartwatch",
      A.phone,
      A.mobilePhone,
      A.smartWatch,
      A.electronicGames,
    ],
    requiredTermGroups: [
      ["phone", "mobile", "cellphone", "smartphone", "smartwatch", A.phone, A.mobilePhone, A.smartWatch, A.electronicGames],
    ],
    specificity: 10,
  },
  {
    name: "leave_early",
    aliases: ["leave school", "leave early", "go home early", "appointment", "dismissal", "permission to leave", A.leave, A.permission],
    terms: ["leave early", "appointment", "permission", A.leave, A.permission],
    specificity: 7,
  },
  {
    name: "exam",
    aliases: ["exam", "exams", "test", "tests", "quiz", "assessment", A.exam, A.test],
    terms: ["exam", "test", "quiz", "assessment", A.exam, A.test, A.absence],
    specificity: 6,
  },
  {
    name: "uniform",
    aliases: ["uniform", "dress code", "clothes", "clothing", "shoes", "shirts", "hats", "caps", "makeup", "hair", A.uniform, A.clothes, A.hat, A.hats],
    terms: ["uniform", "dress code", "clothes", "shoes", "shirts", "hats", "caps", A.uniform, A.clothes, A.hat, A.hats],
    specificity: 6,
  },
  {
    name: "food_drink",
    aliases: ["food", "drink", "eat", "eating", "gum", "chewing gum", "snack", A.food, A.drink, A.gum],
    terms: ["food", "drink", "eat", "gum", A.food, A.drink, A.gum],
    specificity: 5,
  },
  {
    name: "attendance",
    aliases: ["late", "lateness", "absent", "absence", "attendance", "school hours", "arrive", A.absence, A.late],
    terms: ["attendance", "late", "absence", A.absence, A.late],
    specificity: 5,
  },
  {
    name: "behavior",
    aliases: ["bully", "bullying", "violence", "violent", "respect", "behavior", "conduct", "harassment", "fight", A.conduct, A.respect, A.violence, A.bullying],
    terms: ["bullying", "violence", "respect", "conduct", A.conduct, A.respect, A.violence, A.bullying],
    specificity: 2,
  },
];

const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "at",
  "be",
  "bring",
  "can",
  "could",
  "do",
  "does",
  "for",
  "have",
  "i",
  "in",
  "is",
  "it",
  "may",
  "my",
  "of",
  "on",
  "or",
  "our",
  "school",
  "the",
  "to",
  "we",
  "with",
]);

function normalizeArabic(text: string) {
  return text
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/\u0640/g, "")
    .replace(/[\u0623\u0625\u0622\u0671]/g, "\u0627")
    .replace(/\u0649/g, "\u064a")
    .replace(/\u0629/g, "\u0647")
    .replace(/\u0624/g, "\u0648")
    .replace(/\u0626/g, "\u064a");
}

function normalizeText(text: string) {
  return normalizeArabic(text)
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string) {
  return normalizeText(text)
    .split(" ")
    .map((word) => word.trim())
    .filter((word) => word.length >= 2 && !STOP_WORDS.has(word));
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function termMatchesChunk(term: string, normalizedChunk: string, chunkTokens: Set<string>) {
  const normalizedTerm = normalizeText(term);

  if (!normalizedTerm) {
    return false;
  }

  return normalizedTerm.includes(" ")
    ? normalizedChunk.includes(normalizedTerm)
    : chunkTokens.has(normalizedTerm) || normalizedChunk.includes(normalizedTerm);
}

function conceptMatchesChunk(
  concept: Concept,
  normalizedChunk: string,
  chunkTokens: Set<string>,
) {
  if (concept.requiredTermGroups?.length) {
    return concept.requiredTermGroups.every((group) =>
      group.some((term) => termMatchesChunk(term, normalizedChunk, chunkTokens)),
    );
  }

  return concept.terms.some((term) => termMatchesChunk(term, normalizedChunk, chunkTokens));
}

function countConceptTermHits(
  concept: Concept,
  normalizedChunk: string,
  chunkTokens: Set<string>,
) {
  return concept.terms.filter((term) =>
    termMatchesChunk(term, normalizedChunk, chunkTokens),
  ).length;
}

function getMatchedConcepts(question: string) {
  const normalizedQuestion = normalizeText(question);

  return CONCEPTS.filter((concept) =>
    concept.aliases.some((alias) => normalizedQuestion.includes(normalizeText(alias))),
  );
}

function buildSearchTerms(question: string) {
  const questionTokens = tokenize(question);
  const matchedConcepts = getMatchedConcepts(question);
  const conceptTerms = matchedConcepts.flatMap((concept) => concept.terms.map(normalizeText));

  return {
    questionTokens: unique(questionTokens),
    matchedConcepts,
    conceptTerms: unique(conceptTerms.filter((term) => term.length > 0)),
  };
}

export async function getSchoolRulesText() {
  const publishedRules = await getPublishedRules();
  const dynamicRulesText = publishedRules
    .map((rule) => formatPublishedRuleForContext(rule))
    .join("\n\n");
  const rulebookText = getOriginalRulebookText();

  return `
UPDATED SCHOOL RULES (HIGHEST PRIORITY):
${dynamicRulesText || "No updated published rules are currently available."}

--------------------------------------

OFFICIAL RULEBOOK:
${rulebookText}
  `.trim();
}

function formatPublishedRuleForContext(rule: AdminRule) {
  return [
    `- ${rule.title}`,
    `Category: ${rule.category}`,
    rule.arabicText,
  ].join("\n");
}

function buildSearchableRuleText(title: string, category: string, text: string) {
  const baseText = [title, category, text].join("\n");
  const normalized = normalizeText(baseText);
  const tags: string[] = [];

  if (
    /حذاء|احذيه|قميص|قمصان|زي|لباس|uniform|shirt|shoe|dress code/.test(
      normalized,
    )
  ) {
    tags.push("uniform dress code clothes clothing shoes shirts زي لباس احذيه قمصان");
  }

  if (
    /هاتف|هواتف|حاسوب|كمبيوتر|لابتوب|اجهزه|phone|mobile|laptop|computer|device/.test(
      normalized,
    )
  ) {
    tags.push("devices phone mobile laptop computer electronics اجهزه هاتف حاسوب");
  }

  if (/فرصه|استراحه|صف|recess|break|classroom|class/.test(normalized)) {
    tags.push("recess break classroom class صف فرصه استراحه");
  }

  if (/امتحان|اختبار|فرض|exam|test|quiz/.test(normalized)) {
    tags.push("exam test quiz assessment امتحان اختبار");
  }

  if (
    /الصف الحادي عشر|الحادي عشر|grade 11|بكالوريا|scientifique|scientific|علمي|علميه|المواد العلميه|المواد العلمية/.test(
      normalized,
    )
  ) {
    tags.push(
      "grade 11 bac scientifique scientific track scientific average bac e grade 10 final report card average الصف الحادي عشر البكالوريا العلمية معدل علمي الصف العاشر الشهادة النهائية بكالوريا اقتصادية",
    );
  }

  if (/معدل|علامات|نتائج|average|report card|final report|10 20|12 20/.test(normalized)) {
    tags.push(
      "average general average scientific average final report card grades results معدل عام معدل علمي الشهادة النهائية النتائج العلامات",
    );
  }

  return [baseText, ...tags].join("\n");
}

function splitRuleTextForSearch(text: string) {
  const normalizedText = text.trim();

  if (!normalizedText) {
    return [];
  }

  const paragraphs = normalizedText
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  if (paragraphs.length > 1) {
    return paragraphs;
  }

  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length <= 3) {
    return [normalizedText];
  }

  const chunks: string[] = [];
  let currentGroup: string[] = [];

  for (const line of lines) {
    const startsSection =
      /^(?:\d+\s*[-.)]|[A-Za-z][A-Za-z\s]{2,}:|[\u0600-\u06ff\s]{3,}:)/.test(line) &&
      currentGroup.length > 0;

    if (startsSection) {
      chunks.push(currentGroup.join("\n"));
      currentGroup = [line];
      continue;
    }

    currentGroup.push(line);
  }

  if (currentGroup.length > 0) {
    chunks.push(currentGroup.join("\n"));
  }

  const usefulChunks = chunks.filter((chunk) => chunk.length >= 80);

  return usefulChunks.length > 0 ? usefulChunks : [normalizedText];
}

async function getSearchableRuleChunks(): Promise<SearchableRuleChunk[]> {
  const publishedRules = await getPublishedRules();
  const updatedChunks = publishedRules
    .flatMap((rule) =>
      splitRuleTextForSearch(rule.arabicText).map((text) => ({
        text,
        searchableText: buildSearchableRuleText(rule.title, rule.category, text),
        source: "updated" as const,
      })),
    )
    .filter((chunk) => chunk.text.length > 0);

  const rulebookChunks = getOriginalRulebookText()
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0)
    .map((chunk) => ({
      text: chunk,
      searchableText: chunk,
      source: "rulebook" as const,
    }));

  return [...updatedChunks, ...rulebookChunks];
}

export async function getSchoolRulesChunks() {
  const chunks = await getSearchableRuleChunks();
  return chunks.map((chunk) => chunk.text);
}

export async function findRelevantRuleChunks(question: string, limit = 3) {
  const chunks = await getSearchableRuleChunks();
  const { questionTokens, matchedConcepts, conceptTerms } = buildSearchTerms(question);

  const scoredChunks = chunks.map((chunk) => {
    const normalizedChunk = normalizeText(chunk.searchableText);
    const chunkTokens = new Set(tokenize(chunk.searchableText));
    const directRuleHit = isRuleChunkDirectlyRelevant(question, chunk.searchableText);

    let score = directRuleHit ? 15 : 0;

    for (const concept of matchedConcepts) {
      if (conceptMatchesChunk(concept, normalizedChunk, chunkTokens)) {
        score += 12 + concept.specificity;
        score += Math.min(countConceptTermHits(concept, normalizedChunk, chunkTokens), 8);
      }
    }

    for (const term of conceptTerms) {
      if (termMatchesChunk(term, normalizedChunk, chunkTokens)) {
        score += term.includes(" ") ? 5 : 3;
      }
    }

    for (const token of questionTokens) {
      if (chunkTokens.has(token)) {
        score += token.length > 4 ? 3 : 2;
      } else if (normalizedChunk.includes(token)) {
        score += 1;
      }
    }

    if (
      matchedConcepts.length === 0 &&
      questionTokens.length > 0 &&
      questionTokens.every((token) => normalizedChunk.includes(token))
    ) {
      score += 4;
    }

    if (chunk.source === "updated" && score > 0) {
      score += 200;
    }

    return { chunk: chunk.text, score, source: chunk.source };
  });

  return scoredChunks
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }

      if (a.source !== b.source) {
        return a.source === "updated" ? -1 : 1;
      }

      return 0;
    })
    .slice(0, limit)
    .map((item) => item.chunk);
}

export function isRuleChunkDirectlyRelevant(question: string, chunk: string) {
  const normalizedChunk = normalizeText(chunk);
  const chunkTokens = new Set(tokenize(chunk));
  const { questionTokens, matchedConcepts } = buildSearchTerms(question);

  const tokenHits = questionTokens.filter(
    (token) => chunkTokens.has(token) || normalizedChunk.includes(token),
  ).length;

  const hasDirectPolicyLanguage = [
    "\u064a\u0645\u0646\u0639",
    "\u0645\u0645\u0646\u0648\u0639",
    "\u0644\u0627 \u064a\u062c\u0648\u0632",
    "\u064a\u062d\u0638\u0631",
    "\u062d\u0638\u0631",
    "\u064a\u062d\u0642",
    "\u064a\u0633\u0645\u062d",
    "\u064a\u0644\u062a\u0632\u0645",
    "\u0639\u0644\u0649 \u0627\u0644\u062a\u0644\u0645\u064a\u0630",
    "\u0639\u0644\u0649 \u0627\u0644\u062a\u0644\u0627\u0645\u064a\u0630",
    "must",
    "may",
    "may not",
    "not allowed",
    "allowed",
    "prohibited",
    "forbidden",
    "required",
  ].some((phrase) => normalizedChunk.includes(normalizeText(phrase)));

  if (matchedConcepts.length > 0) {
    const hasSpecificConceptHit = matchedConcepts.some((concept) =>
      conceptMatchesChunk(concept, normalizedChunk, chunkTokens),
    );

    return hasSpecificConceptHit && (hasDirectPolicyLanguage || tokenHits >= 1);
  }

  if (questionTokens.length === 0) {
    return false;
  }

  return hasDirectPolicyLanguage && tokenHits >= Math.min(2, questionTokens.length);
}
