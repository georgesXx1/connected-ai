"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";

import type {
  AdminContent,
  AdminPublicInfo,
  AdminRule,
  AdminRuleStatus,
  GradeBook,
  GradePublicInfo,
  MoneyCurrency,
} from "@/lib/admin-content";

type Language = "en" | "fr" | "ar";
type AdminSection = "dashboard" | "rules" | "public" | "settings";
type RuleManagerMode = "add" | "edit" | "trash";
type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  result?: AssistantResult;
  error?: boolean;
};

type AssistantResult = {
  review: string;
  draft: string;
  suggestedTitle?: string;
  note?: string;
};

type AdminPortalProps = {
  authenticated: boolean;
  language: Language;
  username: string | null;
  initialContent: AdminContent | null;
};

type TranslationSet = {
  portalSubtitle: string;
  adminLabel: string;
  back: string;
  loginTitle: string;
  loginDescription: string;
  username: string;
  password: string;
  signIn: string;
  signingIn: string;
  loginError: string;
  sections: Record<AdminSection, string>;
  dashboard: {
    title: string;
    totalRules: string;
    recentRule: string;
    publicSummary: string;
    quickActions: string;
    openRules: string;
    openPublicInfo: string;
    openRulesPage: string;
    none: string;
  };
  rules: {
    title: string;
    addTitle: string;
    modeAdd?: string;
    modeEdit?: string;
    modeTrash?: string;
    addDescription: string;
    addPlaceholder: string;
    addSend: string;
    addSending: string;
    addEmpty: string;
    addError: string;
    draftLabel: string;
    question: string;
    confirm: string;
    edit: string;
    cancel: string;
    existingTitle: string;
    existingDescription: string;
    selectRulePrompt?: string;
    searchPlaceholder: string;
    allCategories: string;
    newest: string;
    oldest: string;
    activeRules: string;
    recycleBin: string;
    showRecycleBin: string;
    hideRecycleBin: string;
    noRules: string;
    noTrash: string;
    actionTitle: string;
    editRule: string;
    trashRule: string;
    restoreRule: string;
    deleteForever: string;
    editModalTitle: string;
    titleLabel: string;
    categoryLabel: string;
    customCategory: string;
    statusLabel: string;
    arabicRule: string;
    published: string;
    draft: string;
    save: string;
    saving: string;
    saveSuccess: string;
    saveError: string;
    trashTitle: string;
    trashBody: string;
    trashSuccess: string;
    restoreTitle: string;
    restoreBody: string;
    restoreSuccess: string;
    permanentDeleteTitle: string;
    permanentDeleteBody: string;
    permanentDeleteSuccess: string;
    deleteError: string;
    previewTitle: string;
    previewEmpty: string;
  };
  publicInfo: {
    title: string;
    description: string;
    save: string;
    saving: string;
    saved: string;
    preview: string;
    confirmTitle: string;
    confirmBody: string;
    confirm: string;
    editAgain: string;
    cancel: string;
    translateFrom: string;
    translating: string;
    translateSuccess: string;
    translateError: string;
    languages: Record<Language, string>;
  };
  settings: {
    title: string;
    description: string;
    currentUser: string;
    authMode: string;
    logout: string;
    loggingOut: string;
    future: string;
  };
};

const SIDEBAR_ICONS: Record<AdminSection, string> = {
  dashboard: "D",
  rules: "R",
  public: "P",
  settings: "S",
};

const CATEGORY_SUGGESTIONS = [
  "General",
  "Attendance",
  "Exams",
  "Leaving School",
  "Uniform",
  "Devices",
  "Behavior",
  "Health",
] as const;

const TRANSLATIONS: Record<Language, TranslationSet> = {
  en: {
    portalSubtitle: "Official GEMAI content control",
    adminLabel: "Admin",
    back: "Back to GEMAI",
    loginTitle: "Administrator Sign In",
    loginDescription:
      "Use the school administration credentials to open the protected GEMAI administration portal.",
    username: "Username",
    password: "Password",
    signIn: "Sign in",
    signingIn: "Signing in...",
    loginError: "The username or password is incorrect.",
    sections: {
      dashboard: "Dashboard",
      rules: "Rules Manager",
      public: "Public Information",
      settings: "Settings / Access",
    },
    dashboard: {
      title: "Dashboard",
      totalRules: "Published rules",
      recentRule: "Recently updated rule",
      publicSummary: "Public information",
      quickActions: "Quick shortcuts",
      openRules: "Open Rules Manager",
      openPublicInfo: "Open Public Information",
      openRulesPage: "Open Public Rules Page",
      none: "Nothing to show yet.",
    },
    rules: {
      title: "Rules Manager",
      addTitle: "Add Rules",
      modeAdd: "Add Rule",
      modeEdit: "Edit Rule",
      modeTrash: "Trash",
      addDescription:
        "Describe a rule naturally. GEMAI will review the request, draft the official Arabic wording, and ask if you want to add it.",
      addPlaceholder:
        "Example: Add a rule that students must wear black shoes every school day.",
      addSend: "Send",
      addSending: "Generating...",
      addEmpty:
        "Start a drafting conversation here. The official rule suggestion will always stay in Arabic.",
      addError: "Could not generate the draft right now. Please try again.",
      draftLabel: "Official Arabic draft",
      question: "Would you like to add this rule officially?",
      confirm: "Yes / Confirm",
      edit: "Edit",
      cancel: "Cancel",
      existingTitle: "Edit / Delete Rules",
      existingDescription:
        "Select an active rule to open a focused editor with its title, category, Arabic text, and status.",
      selectRulePrompt: "Select a rule from the list to edit it.",
      searchPlaceholder: "Search rules...",
      allCategories: "All categories",
      newest: "Newest first",
      oldest: "Oldest first",
      activeRules: "Active rules",
      recycleBin: "Recycle Bin",
      showRecycleBin: "Show trash",
      hideRecycleBin: "Hide trash",
      noRules: "No active rules match this view.",
      noTrash: "The recycle bin is empty.",
      actionTitle: "Choose an action",
      editRule: "Edit",
      trashRule: "Move to trash",
      restoreRule: "Restore",
      deleteForever: "Delete permanently",
      editModalTitle: "Edit rule",
      titleLabel: "Rule title",
      categoryLabel: "Category",
      customCategory: "Custom category",
      statusLabel: "Status",
      arabicRule: "Official Arabic rule text",
      published: "Published",
      draft: "Draft",
      save: "Save",
      saving: "Saving...",
      saveSuccess: "Rule saved successfully.",
      saveError: "Could not save rule. Please try again.",
      trashTitle: "Move this rule to the recycle bin?",
      trashBody:
        "The rule will be removed from the active list, but you will still be able to restore it from the recycle bin.",
      trashSuccess: "Rule moved to the recycle bin.",
      restoreTitle: "Restore this rule?",
      restoreBody:
        "The rule will return to the active list and become published again.",
      restoreSuccess: "Rule restored successfully.",
      permanentDeleteTitle: "Delete this rule permanently?",
      permanentDeleteBody:
        "This action removes the rule from the recycle bin permanently.",
      permanentDeleteSuccess: "Rule permanently deleted.",
      deleteError: "Could not update the rule. Please try again.",
      previewTitle: "Preview",
      previewEmpty: "The Arabic rule preview will appear here.",
    },
    publicInfo: {
      title: "Public Information",
      description:
        "Keep the school's public information short, clear, and easy for families or visitors to understand.",
      save: "Save public information",
      saving: "Saving changes...",
      saved: "Public information saved successfully.",
      preview: "Preview",
      confirmTitle: "Confirm public information changes",
      confirmBody:
        "These updates will become the official public information used by GEMAI Guest.",
      confirm: "Confirm",
      editAgain: "Edit again",
      cancel: "Cancel",
      translateFrom: "Auto-fill from",
      translating: "Translating...",
      translateSuccess: "Translations were filled in. You can still edit them before saving.",
      translateError: "Could not generate translations right now. Please try again.",
      languages: {
        en: "English",
        fr: "French",
        ar: "Arabic",
      },
    },
    settings: {
      title: "Settings / Access",
      description:
        "This version uses server-validated administrator credentials with an HTTP-only signed session cookie.",
      currentUser: "Current user",
      authMode: "Authentication",
      logout: "Log out",
      loggingOut: "Logging out...",
      future:
        "This area is ready for future access roles, password rotation, and audit controls.",
    },
  },
  fr: {
    portalSubtitle: "Controle officiel du contenu GEMAI",
    adminLabel: "Admin",
    back: "Retour a GEMAI",
    loginTitle: "Connexion administrateur",
    loginDescription:
      "Utilisez les identifiants de l'administration scolaire pour ouvrir le portail d'administration protege de GEMAI.",
    username: "Nom d'utilisateur",
    password: "Mot de passe",
    signIn: "Se connecter",
    signingIn: "Connexion...",
    loginError: "Le nom d'utilisateur ou le mot de passe est incorrect.",
    sections: {
      dashboard: "Tableau de bord",
      rules: "Gestion des regles",
      public: "Informations publiques",
      settings: "Parametres / Acces",
    },
    dashboard: {
      title: "Tableau de bord",
      totalRules: "Regles publiees",
      recentRule: "Regle recemment modifiee",
      publicSummary: "Informations publiques",
      quickActions: "Raccourcis",
      openRules: "Ouvrir la gestion des regles",
      openPublicInfo: "Ouvrir les informations publiques",
      openRulesPage: "Ouvrir la page publique des regles",
      none: "Rien a afficher pour le moment.",
    },
    rules: {
      title: "Gestion des regles",
      addTitle: "Ajouter des regles",
      modeAdd: "Ajouter",
      modeEdit: "Modifier",
      modeTrash: "Corbeille",
      addDescription:
        "Decrivez une regle naturellement. GEMAI relira la demande, redigera la formulation arabe officielle et vous demandera si vous souhaitez l'ajouter.",
      addPlaceholder:
        "Exemple : ajoute une regle indiquant que les eleves doivent porter des chaussures noires chaque jour d'ecole.",
      addSend: "Envoyer",
      addSending: "Generation...",
      addEmpty:
        "Commencez ici une conversation de redaction. La proposition officielle restera toujours en arabe.",
      addError: "Le brouillon n'a pas pu etre genere pour le moment. Veuillez reessayer.",
      draftLabel: "Projet officiel en arabe",
      question: "Souhaitez-vous ajouter officiellement cette regle ?",
      confirm: "Oui / Confirmer",
      edit: "Modifier",
      cancel: "Annuler",
      existingTitle: "Modifier / Supprimer les regles",
      existingDescription:
        "Selectionnez une regle active pour ouvrir un editeur centre avec son titre, sa categorie, son texte arabe et son statut.",
      selectRulePrompt: "Selectionnez une regle dans la liste pour la modifier.",
      searchPlaceholder: "Rechercher des regles...",
      allCategories: "Toutes les categories",
      newest: "Plus recentes",
      oldest: "Plus anciennes",
      activeRules: "Regles actives",
      recycleBin: "Corbeille",
      showRecycleBin: "Afficher la corbeille",
      hideRecycleBin: "Masquer la corbeille",
      noRules: "Aucune regle active ne correspond a cette vue.",
      noTrash: "La corbeille est vide.",
      actionTitle: "Choisir une action",
      editRule: "Modifier",
      trashRule: "Mettre a la corbeille",
      restoreRule: "Restaurer",
      deleteForever: "Supprimer definitivement",
      editModalTitle: "Modifier la regle",
      titleLabel: "Titre de la regle",
      categoryLabel: "Categorie",
      customCategory: "Categorie personnalisee",
      statusLabel: "Statut",
      arabicRule: "Texte officiel arabe",
      published: "Publiee",
      draft: "Brouillon",
      save: "Enregistrer",
      saving: "Enregistrement...",
      saveSuccess: "La regle a ete enregistree.",
      saveError: "La regle n'a pas pu etre enregistree. Veuillez reessayer.",
      trashTitle: "Placer cette regle dans la corbeille ?",
      trashBody:
        "La regle sera retiree de la liste active, mais pourra encore etre restauree depuis la corbeille.",
      trashSuccess: "La regle a ete deplacee vers la corbeille.",
      restoreTitle: "Restaurer cette regle ?",
      restoreBody:
        "La regle reviendra dans la liste active et redeviendra publiee.",
      restoreSuccess: "La regle a ete restauree.",
      permanentDeleteTitle: "Supprimer cette regle definitivement ?",
      permanentDeleteBody:
        "Cette action supprime la regle de la corbeille de maniere definitive.",
      permanentDeleteSuccess: "La regle a ete supprimee definitivement.",
      deleteError: "La regle n'a pas pu etre mise a jour. Veuillez reessayer.",
      previewTitle: "Apercu",
      previewEmpty: "L'apercu du texte arabe apparaitra ici.",
    },
    publicInfo: {
      title: "Informations publiques",
      description:
        "Gardez les informations publiques de l'ecole courtes, claires et faciles a comprendre pour les familles ou les visiteurs.",
      save: "Enregistrer les informations publiques",
      saving: "Enregistrement...",
      saved: "Les informations publiques ont ete enregistrees.",
      preview: "Apercu",
      confirmTitle: "Confirmer les informations publiques",
      confirmBody:
        "Ces modifications deviendront les informations publiques officielles utilisees par GEMAI Guest.",
      confirm: "Confirmer",
      editAgain: "Modifier encore",
      cancel: "Annuler",
      translateFrom: "Remplir automatiquement a partir de",
      translating: "Traduction...",
      translateSuccess: "Les traductions ont ete completees. Vous pouvez encore les modifier avant l'enregistrement.",
      translateError: "Les traductions n'ont pas pu etre generees pour le moment. Veuillez reessayer.",
      languages: {
        en: "Anglais",
        fr: "Francais",
        ar: "Arabe",
      },
    },
    settings: {
      title: "Parametres / Acces",
      description:
        "Cette version utilise des identifiants verifies cote serveur avec un cookie de session signe et HTTP-only.",
      currentUser: "Utilisateur actuel",
      authMode: "Authentification",
      logout: "Se deconnecter",
      loggingOut: "Deconnexion...",
      future:
        "Cette zone est prete pour des roles d'acces, la rotation des mots de passe et un journal d'audit.",
    },
  },
  ar: {
    portalSubtitle: "التحكم الرسمي بالمحتوى في GEMAI",
    adminLabel: "Admin",
    back: "العودة إلى GEMAI",
    loginTitle: "تسجيل دخول الإدارة",
    loginDescription:
      "استخدم بيانات اعتماد الإدارة المدرسية لفتح بوابة GEMAI الإدارية المحمية.",
    username: "اسم المستخدم",
    password: "كلمة المرور",
    signIn: "تسجيل الدخول",
    signingIn: "جارٍ تسجيل الدخول...",
    loginError: "اسم المستخدم أو كلمة المرور غير صحيح.",
    sections: {
      dashboard: "لوحة التحكم",
      rules: "إدارة القوانين",
      public: "المعلومات العامة",
      settings: "الإعدادات / الوصول",
    },
    dashboard: {
      title: "لوحة التحكم",
      totalRules: "القوانين المنشورة",
      recentRule: "آخر قانون تم تحديثه",
      publicSummary: "المعلومات العامة",
      quickActions: "اختصارات",
      openRules: "فتح إدارة القوانين",
      openPublicInfo: "فتح المعلومات العامة",
      openRulesPage: "فتح صفحة القوانين العامة",
      none: "لا يوجد ما يُعرض بعد.",
    },
    rules: {
      title: "إدارة القوانين",
      addTitle: "إضافة القوانين",
      addDescription:
        "اكتب القانون بشكل طبيعي. سيقوم GEMAI بمراجعة الطلب وصياغة النص العربي الرسمي ثم يسألك إن كنت تريد إضافته.",
      addPlaceholder:
        "مثال: أضف قانونًا ينص على أن يرتدي الطلاب أحذية سوداء كل يوم دراسي.",
      addSend: "إرسال",
      addSending: "جارٍ الإنشاء...",
      addEmpty:
        "ابدأ هنا محادثة الصياغة. سيبقى الاقتراح الرسمي دائمًا باللغة العربية.",
      addError: "تعذّر إنشاء المسودة الآن. يرجى المحاولة مرة أخرى.",
      draftLabel: "المسودة العربية الرسمية",
      question: "هل تريد إضافة هذا القانون رسميًا؟",
      confirm: "نعم / تأكيد",
      edit: "تعديل",
      cancel: "إلغاء",
      existingTitle: "تعديل / حذف القوانين",
      existingDescription:
        "تصفّح القوانين النشطة، وافتح سلة المحذوفات عند الحاجة، ثم اضغط على أي قانون لفتح قائمة إجراءات بسيطة.",
      searchPlaceholder: "ابحث في القوانين...",
      allCategories: "كل الفئات",
      newest: "الأحدث أولًا",
      oldest: "الأقدم أولًا",
      activeRules: "القوانين النشطة",
      recycleBin: "سلة المحذوفات",
      showRecycleBin: "إظهار السلة",
      hideRecycleBin: "إخفاء السلة",
      noRules: "لا توجد قوانين نشطة مطابقة لهذا العرض.",
      noTrash: "سلة المحذوفات فارغة.",
      actionTitle: "اختر إجراءً",
      editRule: "تعديل",
      trashRule: "نقل إلى السلة",
      restoreRule: "استعادة",
      deleteForever: "حذف نهائي",
      editModalTitle: "تعديل القانون",
      titleLabel: "عنوان القانون",
      categoryLabel: "الفئة",
      customCategory: "فئة مخصصة",
      statusLabel: "الحالة",
      arabicRule: "النص الرسمي للقانون بالعربية",
      published: "منشور",
      draft: "مسودة",
      save: "حفظ",
      saving: "جارٍ الحفظ...",
      saveSuccess: "تم حفظ القانون بنجاح.",
      saveError: "تعذّر حفظ القانون. يرجى المحاولة مرة أخرى.",
      trashTitle: "هل تريد نقل هذا القانون إلى سلة المحذوفات؟",
      trashBody:
        "سيتم حذف القانون من القائمة النشطة، لكن سيبقى بإمكانك استعادته من سلة المحذوفات.",
      trashSuccess: "تم نقل القانون إلى سلة المحذوفات.",
      restoreTitle: "هل تريد استعادة هذا القانون؟",
      restoreBody: "سيعود القانون إلى القائمة النشطة وسيصبح منشورًا من جديد.",
      restoreSuccess: "تمت استعادة القانون بنجاح.",
      permanentDeleteTitle: "هل تريد حذف هذا القانون نهائيًا؟",
      permanentDeleteBody:
        "سيؤدي هذا الإجراء إلى إزالة القانون من سلة المحذوفات بشكل دائم.",
      permanentDeleteSuccess: "تم حذف القانون نهائيًا.",
      deleteError: "تعذّر تحديث القانون. يرجى المحاولة مرة أخرى.",
      previewTitle: "معاينة",
      previewEmpty: "ستظهر معاينة النص العربي هنا.",
    },
    publicInfo: {
      title: "المعلومات العامة",
      description:
        "حافظ على معلومات المدرسة العامة قصيرة وواضحة وسهلة الفهم للعائلات والزوار.",
      save: "حفظ المعلومات العامة",
      saving: "جارٍ الحفظ...",
      saved: "تم حفظ المعلومات العامة بنجاح.",
      preview: "معاينة",
      confirmTitle: "تأكيد تغييرات المعلومات العامة",
      confirmBody:
        "ستصبح هذه التعديلات المعلومات العامة الرسمية التي يستخدمها GEMAI للزائر.",
      confirm: "تأكيد",
      editAgain: "تعديل من جديد",
      cancel: "إلغاء",
      translateFrom: "الملء التلقائي انطلاقًا من",
      translating: "جارٍ الترجمة...",
      translateSuccess: "تم ملء الترجمات. لا يزال بإمكانك تعديلها قبل الحفظ.",
      translateError: "تعذّر إنشاء الترجمات الآن. يرجى المحاولة مرة أخرى.",
      languages: {
        en: "الإنجليزية",
        fr: "الفرنسية",
        ar: "العربية",
      },
    },
    settings: {
      title: "الإعدادات / الوصول",
      description:
        "تستخدم هذه النسخة بيانات اعتماد إدارية يتم التحقق منها على الخادم مع ملف ارتباط جلسة موقّع ومخفي عن الواجهة.",
      currentUser: "المستخدم الحالي",
      authMode: "المصادقة",
      logout: "تسجيل الخروج",
      loggingOut: "جارٍ تسجيل الخروج...",
      future:
        "هذه المساحة جاهزة لأدوار وصول مستقبلية وتدوير كلمات المرور وسجل تدقيق.",
    },
  },
};

function cloneRule(rule: AdminRule) {
  return { ...rule };
}

function clonePublicInfo(publicInfo: AdminPublicInfo) {
  return structuredClone(publicInfo);
}

function cloneGradeInfo(gradeInfo: GradePublicInfo[]) {
  return structuredClone(gradeInfo);
}

function createFallbackPublicInfo(): AdminPublicInfo {
  const now = new Date().toISOString();

  return {
    overview: {
      key: "overview",
      title: { en: "School Overview", fr: "Presentation de l'ecole", ar: "نظرة عامة على المدرسة" },
      content: { en: "", fr: "", ar: "" },
      updatedAt: now,
    },
    contact: {
      key: "contact",
      title: { en: "Contact Information", fr: "Coordonnees", ar: "معلومات التواصل" },
      content: { en: "", fr: "", ar: "" },
      updatedAt: now,
    },
    officeHours: {
      key: "officeHours",
      title: { en: "Office Hours", fr: "Horaires administratifs", ar: "ساعات الدوام" },
      content: { en: "", fr: "", ar: "" },
      updatedAt: now,
    },
    tuition: {
      key: "tuition",
      title: { en: "Tuition", fr: "Frais de scolarite", ar: "الاقساط" },
      content: { en: "", fr: "", ar: "" },
      updatedAt: now,
    },
    programs: {
      key: "programs",
      title: { en: "Programs", fr: "Programmes", ar: "البرامج" },
      content: { en: "", fr: "", ar: "" },
      updatedAt: now,
    },
  };
}

function createFallbackGradeInfo(): GradePublicInfo[] {
  const now = new Date().toISOString();
  const seeds: Array<{ id: string; className: string; ageRange?: string }> = [
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

  return seeds.map((grade, index) => ({
    ...grade,
    tuitionAmount: String(1800 + index * 120),
    tuitionCurrency: "USD",
    stationeryAmount: String(90 + index * 8),
    stationeryCurrency: "USD",
    books: [
      {
        id: `${grade.id}-book-1`,
        name: `${grade.className} Arabic Reader`,
        status: "active",
        createdAt: now,
        updatedAt: now,
      },
      {
        id: `${grade.id}-book-2`,
        name: `${grade.className} Mathematics Workbook`,
        status: "active",
        createdAt: now,
        updatedAt: now,
      },
    ],
    updatedAt: now,
  }));
}

function formatTimestamp(value: string, language: Language) {
  try {
    return new Intl.DateTimeFormat(language, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function buildRulePreview(rule: AdminRule, maxLength = 220) {
  const normalized = (rule.arabicText || rule.title).replace(/\s+/g, " ").trim();

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const shortened = normalized.slice(0, maxLength);
  const lastSpace = shortened.lastIndexOf(" ");

  return `${shortened.slice(0, lastSpace > 0 ? lastSpace : maxLength).trim()}...`;
}

function createEmptyRule(status: AdminRuleStatus = "published"): AdminRule {
  const now = new Date().toISOString();

  return {
    id: `rule-${Math.random().toString(36).slice(2, 10)}`,
    title: "",
    arabicText: "",
    category: "General",
    createdAt: now,
    updatedAt: now,
    status,
  };
}

function sortRules(rules: AdminRule[], direction: "newest" | "oldest") {
  return [...rules].sort((left, right) => {
    const leftTime = new Date(left.updatedAt).getTime();
    const rightTime = new Date(right.updatedAt).getTime();
    return direction === "newest" ? rightTime - leftTime : leftTime - rightTime;
  });
}

function buildRulePayload(rule: AdminRule) {
  return {
    ...rule,
    title: rule.title.trim() || "Untitled rule",
    arabicText: rule.arabicText.trim(),
    category: rule.category.trim() || "General",
    updatedAt: new Date().toISOString(),
  };
}

function SectionChip({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1.5 text-xs transition ${
        active
          ? "border-cyan-400/25 bg-cyan-400/10 text-white"
          : "border-white/10 bg-black/20 text-zinc-300 hover:bg-white/[0.04]"
      }`}
    >
      {label}
    </button>
  );
}

export default function AdminPortal({
  authenticated,
  language,
  username,
  initialContent,
}: AdminPortalProps) {
  const router = useRouter();
  const t = TRANSLATIONS[language];
  const isArabic = language === "ar";
  const textDirection = isArabic ? "rtl" : "ltr";
  const textAlignClass = isArabic ? "text-right" : "text-left";

  const initialRules = initialContent?.rules ?? [];
  const initialPublicInfo = initialContent?.publicInfo ?? createFallbackPublicInfo();
  const initialGradeInfo = initialContent?.gradeInfo ?? createFallbackGradeInfo();

  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const [loginForm, setLoginForm] = useState({ username: "", password: "" });
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [rules, setRules] = useState<AdminRule[]>(initialRules);
  const [ruleSearch, setRuleSearch] = useState("");
  const [ruleCategoryFilter, setRuleCategoryFilter] = useState("all");
  const [ruleSort, setRuleSort] = useState<"newest" | "oldest">("newest");
  const [ruleManagerMode, setRuleManagerMode] = useState<RuleManagerMode>("add");
  const [rulesSuccess, setRulesSuccess] = useState("");
  const [rulesError, setRulesError] = useState("");
  const [isSavingRule, setIsSavingRule] = useState(false);

  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatDraft, setChatDraft] = useState<AdminRule | null>(null);
  const [isEditingChatDraft, setIsEditingChatDraft] = useState(false);
  const [chatError, setChatError] = useState("");
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);

  const [selectedRuleId, setSelectedRuleId] = useState<string | null>(null);
  const [editingRule, setEditingRule] = useState<AdminRule | null>(null);
  const [showRuleActionModal, setShowRuleActionModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteMode, setDeleteMode] = useState<"trash" | "permanent">("trash");
  const [showRestoreModal, setShowRestoreModal] = useState(false);

  const [publicInfo, setPublicInfo] = useState<AdminPublicInfo>(
    clonePublicInfo(initialPublicInfo),
  );
  const [gradeInfo, setGradeInfo] = useState<GradePublicInfo[]>(
    cloneGradeInfo(initialGradeInfo),
  );
  const [selectedGradeInfoId, setSelectedGradeInfoId] = useState(
    initialGradeInfo[0]?.id ?? "kg1",
  );
  const [newBookName, setNewBookName] = useState("");
  const [showPublicConfirm, setShowPublicConfirm] = useState(false);
  const [isSavingPublicInfo, setIsSavingPublicInfo] = useState(false);
  const [publicInfoSuccess, setPublicInfoSuccess] = useState("");
  const [publicInfoError, setPublicInfoError] = useState("");

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const adminSidebarWidth = isSidebarCollapsed ? 96 : 280;
  const adminContentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!initialContent) {
      return;
    }

    setPublicInfo(clonePublicInfo(initialContent.publicInfo));
    setGradeInfo(cloneGradeInfo(initialContent.gradeInfo));
    setSelectedGradeInfoId((current) =>
      initialContent.gradeInfo.some((grade) => grade.id === current)
        ? current
        : initialContent.gradeInfo[0]?.id ?? "kg1",
    );
  }, [initialContent]);

  const categories = useMemo(() => {
    const next = new Set<string>(CATEGORY_SUGGESTIONS);
    rules.forEach((rule) => {
      if (rule.category.trim()) {
        next.add(rule.category.trim());
      }
    });
    return [...next];
  }, [rules]);

  const publishedRules = useMemo(
    () => rules.filter((rule) => rule.status === "published"),
    [rules],
  );

  const activeRules = useMemo(
    () => rules.filter((rule) => rule.status !== "trashed"),
    [rules],
  );

  const trashedRules = useMemo(
    () => rules.filter((rule) => rule.status === "trashed"),
    [rules],
  );

  const filteredActiveRules = useMemo(() => {
    const query = ruleSearch.trim().toLowerCase();

    return sortRules(activeRules, ruleSort).filter((rule) => {
      if (ruleCategoryFilter !== "all" && rule.category !== ruleCategoryFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [rule.title, rule.category, rule.arabicText]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [activeRules, ruleCategoryFilter, ruleSearch, ruleSort]);

  const filteredTrashedRules = useMemo(() => {
    const query = ruleSearch.trim().toLowerCase();

    return sortRules(trashedRules, ruleSort).filter((rule) => {
      if (ruleCategoryFilter !== "all" && rule.category !== ruleCategoryFilter) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [rule.title, rule.category, rule.arabicText]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [trashedRules, ruleCategoryFilter, ruleSearch, ruleSort]);

  const selectedRule = selectedRuleId
    ? rules.find((rule) => rule.id === selectedRuleId) ?? null
    : null;
  const ruleModeLabels: Record<RuleManagerMode, string> = {
    add: t.rules.modeAdd ?? t.rules.addTitle,
    edit: t.rules.modeEdit ?? t.rules.editRule,
    trash: t.rules.modeTrash ?? t.rules.recycleBin,
  };

  const latestRuleUpdate = publishedRules[0]
    ? sortRules(publishedRules, "newest")[0]
    : null;

  const latestPublicInfoUpdate = useMemo(() => {
    const entries = Object.values(publicInfo);
    return entries.sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
    )[0];
  }, [publicInfo]);

  const selectedGradeInfo =
    gradeInfo.find((grade) => grade.id === selectedGradeInfoId) ?? gradeInfo[0];
  const activeGradeBooks =
    selectedGradeInfo?.books.filter((book) => book.status === "active") ?? [];
  const trashedGradeBooks =
    selectedGradeInfo?.books.filter((book) => book.status === "trashed") ?? [];

  useEffect(() => {
    adminContentRef.current?.scrollTo({ top: 0, left: 0 });
  }, [activeSection]);

  function switchAdminSection(section: AdminSection) {
    setActiveSection(section);
  }

  function clearRuleMessages() {
    setRulesSuccess("");
    setRulesError("");
  }

  function handleLoginChange(field: "username" | "password", value: string) {
    setLoginForm((current) => ({ ...current, [field]: value }));
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSigningIn(true);
    setLoginError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });

      if (!response.ok) {
        setLoginError(t.loginError);
        return;
      }

      window.location.reload();
    } catch {
      setLoginError(t.loginError);
    } finally {
      setIsSigningIn(false);
    }
  }

  async function handleLogout() {
    setIsLoggingOut(true);

    try {
      await fetch("/api/admin/logout", { method: "POST" });
      window.location.reload();
    } finally {
      setIsLoggingOut(false);
    }
  }

  function pushChatMessage(message: ChatMessage) {
    setChatMessages((current) => [...current, message]);
  }

  function updateChatDraftText(value: string) {
    setChatDraft((current) =>
      current
        ? {
            ...current,
            arabicText: value,
            updatedAt: new Date().toISOString(),
          }
        : current,
    );
  }

  async function generateRuleDraft() {
    const prompt = chatInput.trim();

    if (!prompt) {
      return;
    }

    setIsGeneratingDraft(true);
    setChatError("");
    setChatInput("");
    setChatDraft(null);
    setIsEditingChatDraft(false);

    setChatMessages([{
      id: `user-${Date.now()}`,
      role: "user",
      content: prompt,
    }]);

    try {
      const response = await fetch("/api/admin/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceText: prompt,
          kind: "rule",
          language,
          category: "General",
          existingRuleTitle: "",
          existingRuleText: "",
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | AssistantResult
        | { error?: string }
        | null;

      if (
        !response.ok ||
        !payload ||
        !("review" in payload) ||
        typeof payload.review !== "string" ||
        typeof payload.draft !== "string"
      ) {
        throw new Error(payload && "error" in payload ? payload.error : t.rules.addError);
      }

      const nextDraft = {
        ...createEmptyRule("published"),
        title: payload.suggestedTitle?.trim() || "Official rule draft",
        arabicText: payload.draft.trim(),
      };

      setChatDraft(nextDraft);
      setIsEditingChatDraft(false);
      pushChatMessage({
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: payload.review,
        result: payload,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : t.rules.addError;
      setChatError("");
      setChatInput(prompt);
      pushChatMessage({
        id: `assistant-error-${Date.now()}`,
        role: "assistant",
        content: message,
        error: true,
      });
    } finally {
      setIsGeneratingDraft(false);
    }
  }

  async function confirmAddDraft() {
    if (!chatDraft) {
      return;
    }

    setIsSavingRule(true);
    clearRuleMessages();

    try {
      const response = await fetch("/api/admin/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rule: buildRulePayload(chatDraft) }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { rules?: AdminRule[]; error?: string }
        | null;

      if (!response.ok || !payload?.rules) {
        throw new Error(payload?.error || t.rules.saveError);
      }

      setRules(payload.rules);
      setSelectedRuleId(chatDraft.id);
      setChatDraft(null);
      setIsEditingChatDraft(false);
      setChatMessages([]);
      setRulesSuccess(t.rules.saveSuccess);
    } catch (error) {
      const message = error instanceof Error ? error.message : t.rules.saveError;
      setRulesError(message);
    } finally {
      setIsSavingRule(false);
    }
  }

  function cancelAddDraft() {
    setChatDraft(null);
    setIsEditingChatDraft(false);
    setChatMessages([]);
    setChatInput("");
    setChatError("");
  }

  function editAddDraft() {
    if (!chatDraft) {
      return;
    }

    setIsEditingChatDraft(true);
  }

  function openRuleEditor(rule: AdminRule) {
    setSelectedRuleId(rule.id);
    setEditingRule(cloneRule(rule));
    setShowEditModal(true);
    setRuleManagerMode("edit");
    clearRuleMessages();
  }

  function selectRuleForActions(rule: AdminRule) {
    setSelectedRuleId(rule.id);
    setEditingRule(null);
    setRuleManagerMode("edit");
    clearRuleMessages();
  }

  function cancelRuleSelection() {
    setSelectedRuleId(null);
    setEditingRule(null);
    clearRuleMessages();
  }

  function updateEditingRule<K extends keyof AdminRule>(field: K, value: AdminRule[K]) {
    setEditingRule((current) =>
      current
        ? {
            ...current,
            [field]: value,
            updatedAt: new Date().toISOString(),
          }
        : current,
    );
  }

  async function saveEditedRule() {
    if (!editingRule) {
      return;
    }

    const isExistingRule = rules.some((rule) => rule.id === editingRule.id);

    setIsSavingRule(true);
    clearRuleMessages();

    try {
      const response = await fetch("/api/admin/rules", {
        method: isExistingRule ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rule: buildRulePayload(editingRule) }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { rules?: AdminRule[]; error?: string }
        | null;

      if (!response.ok || !payload?.rules) {
        throw new Error(payload?.error || t.rules.saveError);
      }

      setRules(payload.rules);
      setSelectedRuleId(editingRule.id);
      setEditingRule(cloneRule(editingRule));
      setChatDraft((current) =>
        current && current.id === editingRule.id ? null : current,
      );
      setRulesSuccess(t.rules.saveSuccess);
    } catch (error) {
      const message = error instanceof Error ? error.message : t.rules.saveError;
      setRulesError(message);
    } finally {
      setIsSavingRule(false);
    }
  }

  async function moveRuleToTrash(rule = editingRule) {
    if (!rule) {
      return;
    }

    setIsSavingRule(true);
    clearRuleMessages();

    try {
      const response = await fetch("/api/admin/rules", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rule.id }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { rules?: AdminRule[]; error?: string }
        | null;

      if (!response.ok || !payload?.rules) {
        throw new Error(payload?.error || t.rules.deleteError);
      }

      setRules(payload.rules);
      setSelectedRuleId(null);
      setEditingRule(null);
      setRuleManagerMode("trash");
      setRulesSuccess(t.rules.trashSuccess);
    } catch (error) {
      const message = error instanceof Error ? error.message : t.rules.deleteError;
      setRulesError(message);
    } finally {
      setIsSavingRule(false);
    }
  }

  async function restoreRule(rule: AdminRule | null) {
    if (!rule) {
      return;
    }

    setIsSavingRule(true);
    clearRuleMessages();

    try {
      const response = await fetch("/api/admin/rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rule: {
            ...rule,
            status: "published",
          },
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { rules?: AdminRule[]; error?: string }
        | null;

      if (!response.ok || !payload?.rules) {
        throw new Error(payload?.error || t.rules.deleteError);
      }

      setRules(payload.rules);
      setSelectedRuleId(rule.id);
      setEditingRule(cloneRule({ ...rule, status: "published" }));
      setRuleManagerMode("edit");
      setRulesSuccess(t.rules.restoreSuccess);
    } catch (error) {
      const message = error instanceof Error ? error.message : t.rules.deleteError;
      setRulesError(message);
    } finally {
      setIsSavingRule(false);
    }
  }

  async function restoreSelectedRule() {
    await restoreRule(selectedRule);
    setShowRestoreModal(false);
  }

  async function permanentlyDeleteRule(rule: AdminRule | null) {
    if (!rule) {
      return;
    }

    setIsSavingRule(true);
    clearRuleMessages();

    try {
      const response = await fetch("/api/admin/rules", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: rule.id, permanent: true }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { rules?: AdminRule[]; error?: string }
        | null;

      if (!response.ok || !payload?.rules) {
        throw new Error(payload?.error || t.rules.deleteError);
      }

      setRules(payload.rules);
      if (selectedRuleId === rule.id) {
        setSelectedRuleId(null);
      }
      setRulesSuccess(t.rules.permanentDeleteSuccess);
    } catch (error) {
      const message = error instanceof Error ? error.message : t.rules.deleteError;
      setRulesError(message);
    } finally {
      setIsSavingRule(false);
    }
  }

  async function permanentlyDeleteSelectedRule() {
    await permanentlyDeleteRule(selectedRule);
    setShowDeleteModal(false);
  }

  function updateSelectedGradeInfo(
    field:
      | "ageRange"
      | "tuitionAmount"
      | "tuitionCurrency"
      | "stationeryAmount"
      | "stationeryCurrency",
    value: string | MoneyCurrency,
  ) {
    const now = new Date().toISOString();
    setGradeInfo((current) =>
      current.map((grade) =>
        grade.id === selectedGradeInfoId
          ? {
              ...grade,
              [field]: value,
              updatedAt: now,
            }
          : grade,
      ),
    );
    setPublicInfoSuccess("");
    setPublicInfoError("");
  }

  function addGradeBook() {
    const name = newBookName.trim();

    if (!name) {
      return;
    }

    const now = new Date().toISOString();
    const nextBook: GradeBook = {
      id: `book-${Date.now()}`,
      name,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };

    setGradeInfo((current) =>
      current.map((grade) =>
        grade.id === selectedGradeInfoId
          ? {
              ...grade,
              books: [...grade.books, nextBook],
              updatedAt: now,
            }
          : grade,
      ),
    );
    setNewBookName("");
    setPublicInfoSuccess("");
    setPublicInfoError("");
  }

  function updateGradeBook(bookId: string, name: string) {
    const now = new Date().toISOString();
    setGradeInfo((current) =>
      current.map((grade) =>
        grade.id === selectedGradeInfoId
          ? {
              ...grade,
              books: grade.books.map((book) =>
                book.id === bookId
                  ? {
                      ...book,
                      name,
                      updatedAt: now,
                    }
                  : book,
              ),
              updatedAt: now,
            }
          : grade,
      ),
    );
    setPublicInfoSuccess("");
    setPublicInfoError("");
  }

  function setGradeBookStatus(bookId: string, status: GradeBook["status"]) {
    const now = new Date().toISOString();
    setGradeInfo((current) =>
      current.map((grade) =>
        grade.id === selectedGradeInfoId
          ? {
              ...grade,
              books: grade.books.map((book) =>
                book.id === bookId
                  ? {
                      ...book,
                      status,
                      updatedAt: now,
                    }
                  : book,
              ),
              updatedAt: now,
            }
          : grade,
      ),
    );
    setPublicInfoSuccess("");
    setPublicInfoError("");
  }

  async function confirmSavePublicInfo() {
    setIsSavingPublicInfo(true);
    setPublicInfoError("");

    try {
      const response = await fetch("/api/admin/public-info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicInfo, gradeInfo }),
      });

      const payload = (await response.json().catch(() => null)) as
        | {
            publicInfo?: AdminPublicInfo;
            gradeInfo?: GradePublicInfo[];
            error?: string;
          }
        | null;

      if (!response.ok || !payload?.publicInfo || !payload?.gradeInfo) {
        throw new Error(payload?.error || "Save failed.");
      }

      setPublicInfo(payload.publicInfo);
      setGradeInfo(payload.gradeInfo);
      setShowPublicConfirm(false);
      setPublicInfoSuccess(t.publicInfo.saved);
      router.refresh();
    } catch {
      setPublicInfoSuccess("");
      setPublicInfoError(t.publicInfo.translateError);
    } finally {
      setIsSavingPublicInfo(false);
    }
  }

  if (!authenticated) {
    return (
      <main className="gem-page text-slate-950">
        <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-5 py-10 sm:px-8">
          <div className="gem-shell w-full max-w-md overflow-hidden rounded-[32px]">
            <div className="border-b border-blue-900/10 px-7 py-8 sm:px-8">
              <Link
                href={{ pathname: "/", query: { lang: language } }}
                className="gem-soft-button inline-flex h-10 items-center justify-center rounded-2xl px-4 text-sm font-semibold"
              >
                {t.back}
              </Link>
              <div className="mt-7 flex items-center gap-3">
                <span className="gem-logo-mark flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/80 p-2">
                  <Image src="/school-logo.png" alt="" width={42} height={42} className="object-contain" />
                </span>
                <p className="gem-eyebrow">GEMAI Admin</p>
              </div>
              <h1
                className={`mt-5 text-3xl font-black tracking-tight text-slate-950 ${textAlignClass}`}
                dir={textDirection}
              >
                {t.loginTitle}
              </h1>
              <p
                className={`mt-4 text-sm leading-7 text-slate-600 ${textAlignClass}`}
                dir={textDirection}
              >
                {t.loginDescription}
              </p>
            </div>

            <form className="space-y-6 px-7 py-8 sm:px-8" onSubmit={handleLogin}>
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  {t.username}
                </span>
                <input
                  value={loginForm.username}
                  onChange={(event) => handleLoginChange("username", event.target.value)}
                  className="gem-input h-12 w-full rounded-2xl px-4 outline-none"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">
                  {t.password}
                </span>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(event) => handleLoginChange("password", event.target.value)}
                  className="gem-input h-12 w-full rounded-2xl px-4 outline-none"
                />
              </label>

              {loginError ? (
                <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                  {loginError}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSigningIn}
                className="gem-button inline-flex h-12 w-full items-center justify-center rounded-2xl text-sm font-bold disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSigningIn ? t.signingIn : t.signIn}
              </button>
            </form>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className="gem-app-bg flex h-screen overflow-hidden"
      dir="ltr"
    >
      <aside
        className="z-40 flex h-screen shrink-0 flex-col overflow-y-auto border-r border-blue-900/10 bg-white/72 p-4 shadow-[24px_0_90px_-58px_rgba(11,47,134,0.55)] backdrop-blur-2xl transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        dir={textDirection}
        style={{ width: adminSidebarWidth }}
      >
        <div
          className={`flex items-start gap-3 ${
            isSidebarCollapsed ? "flex-col items-center" : "justify-between"
          }`}
        >
          <div
            className={`flex min-w-0 items-center gap-3 ${
              isSidebarCollapsed ? "flex-col" : ""
            }`}
          >
            <div className="gem-logo-mark flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/80 p-2">
              <Image src="/school-logo.png" alt="" width={36} height={36} className="object-contain" />
            </div>
            {!isSidebarCollapsed ? (
              <div className={`min-w-0 ${textAlignClass}`}>
                <p className="gem-eyebrow">
                  GEMAI
                </p>
                <p className="mt-2 text-sm font-bold text-slate-950">
                  {t.adminLabel}
                </p>
                <p className="truncate text-xs font-medium text-slate-500">{username}</p>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => setIsSidebarCollapsed((current) => !current)}
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="gem-soft-button flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
          >
            {isSidebarCollapsed ? ">" : "<"}
          </button>
        </div>

        <nav className="mt-8 flex flex-1 flex-col gap-3">
          {(["dashboard", "rules", "public", "settings"] as AdminSection[]).map(
            (section) => (
              <button
                key={section}
                type="button"
                onClick={() => switchAdminSection(section)}
                title={isSidebarCollapsed ? t.sections[section] : undefined}
                className={`flex h-14 w-full items-center overflow-hidden rounded-[22px] border transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                  isSidebarCollapsed
                    ? "justify-center gap-0 px-0"
                    : "justify-start gap-3 px-4 text-left"
                } ${
                  activeSection === section
                    ? "border-blue-500/30 bg-blue-600/10 shadow-[0_18px_40px_-30px_rgba(11,47,134,0.72)]"
                    : "border-blue-900/10 bg-white/45 hover:border-blue-500/20 hover:bg-white/85"
                }`}
              >
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border text-xs font-bold ${
                    activeSection === section
                      ? "border-blue-500/20 bg-blue-600 text-white"
                      : "border-blue-900/10 bg-white/80 text-blue-800"
                  }`}
                >
                  {SIDEBAR_ICONS[section]}
                </span>
                {!isSidebarCollapsed ? (
                  <span
                    className={`truncate whitespace-nowrap text-sm font-bold ${
                      activeSection === section ? "text-blue-950" : "text-slate-700"
                    }`}
                  >
                    {t.sections[section]}
                  </span>
                ) : null}
              </button>
            ),
          )}
        </nav>
      </aside>

      <div
        ref={adminContentRef}
        className="h-screen min-w-0 flex-1 overflow-y-auto overflow-x-hidden transition-[width] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
      >
        <div className="mx-auto max-w-[1280px] px-4 py-5 sm:px-6 sm:py-6">
          <section
            className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(28,37,48,0.98),rgba(18,25,33,0.98))] shadow-[0_28px_100px_-60px_rgba(0,0,0,0.85)]"
            dir={textDirection}
          >
            <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_34%)] px-7 py-8 sm:px-10">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className={textAlignClass}>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
                    {t.sections[activeSection]}
                  </p>
                  <h1 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                    {activeSection === "dashboard"
                      ? t.dashboard.title
                      : activeSection === "rules"
                        ? t.rules.title
                        : activeSection === "public"
                          ? t.publicInfo.title
                          : t.settings.title}
                  </h1>
                  <p className="mt-4 max-w-3xl text-sm leading-7 text-zinc-300">
                    {activeSection === "dashboard"
                      ? t.portalSubtitle
                      : activeSection === "rules"
                        ? t.rules.addDescription
                        : activeSection === "public"
                          ? t.publicInfo.description
                          : t.settings.description}
                  </p>
                </div>

                <Link
                  href={{ pathname: "/", query: { lang: language } }}
                  className="inline-flex h-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-zinc-200 transition hover:bg-white/[0.08]"
                >
                  {t.back}
                </Link>
              </div>
            </div>

            <div className="p-7 sm:p-10">
              {activeSection === "dashboard" ? (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
                      {t.dashboard.totalRules}
                    </p>
                    <p className="mt-5 text-3xl font-semibold text-white">
                      {publishedRules.length}
                    </p>
                  </div>

                  <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
                      {t.rules.recycleBin}
                    </p>
                    <p className="mt-5 text-3xl font-semibold text-white">
                      {trashedRules.length}
                    </p>
                  </div>

                  <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 xl:col-span-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
                      {t.dashboard.recentRule}
                    </p>
                    <p className="mt-5 text-lg font-semibold text-white">
                      {latestRuleUpdate?.title || t.dashboard.none}
                    </p>
                    {latestRuleUpdate ? (
                      <p className="mt-3 text-sm text-zinc-500">
                        {formatTimestamp(latestRuleUpdate.updatedAt, language)}
                      </p>
                    ) : null}
                  </div>

                  <div className="rounded-[28px] border border-white/10 bg-white/[0.04] p-6 sm:col-span-2 xl:col-span-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
                      {t.dashboard.publicSummary}
                    </p>
                    <p className="mt-5 text-lg font-semibold text-white">
                      {latestPublicInfoUpdate?.title[language] || t.dashboard.none}
                    </p>
                    {latestPublicInfoUpdate ? (
                      <p className="mt-3 text-sm text-zinc-500">
                        {formatTimestamp(latestPublicInfoUpdate.updatedAt, language)}
                      </p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {activeSection === "rules" ? (
                <div className="space-y-7">
                  <div className="flex flex-wrap gap-2 rounded-[26px] border border-white/10 bg-white/[0.04] p-2">
                    {(["add", "edit", "trash"] as RuleManagerMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          setRuleManagerMode(mode);
                          clearRuleMessages();
                        }}
                        className={`h-11 rounded-2xl px-4 text-sm font-semibold transition ${
                          ruleManagerMode === mode
                            ? "bg-cyan-400 text-slate-950"
                            : "text-zinc-300 hover:bg-white/[0.06] hover:text-white"
                        }`}
                      >
                        {ruleModeLabels[mode]}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-6">
                    {rulesSuccess ? (
                      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                        {rulesSuccess}
                      </div>
                    ) : null}

                    {rulesError ? (
                      <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                        {rulesError}
                      </div>
                    ) : null}

                    {ruleManagerMode === "add" ? (
                    <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-7">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
                        {t.rules.addTitle}
                      </p>
                      <p className="mt-4 text-sm leading-7 text-zinc-400">
                        {t.rules.addDescription}
                      </p>

                      <div className="mt-6 flex min-h-[520px] flex-col rounded-[26px] border border-white/10 bg-black/20 p-5">
                        <div className="flex-1 space-y-4 overflow-y-auto pr-1">
                          {chatMessages.length === 0 ? (
                            <div className="rounded-[20px] border border-white/10 bg-[#0f1319] p-5 text-sm leading-7 text-zinc-400">
                              {t.rules.addEmpty}
                            </div>
                          ) : (
                            chatMessages.map((message) => (
                              <div
                                key={message.id}
                                className={`rounded-[22px] border p-5 ${
                                  message.role === "user"
                                    ? "ml-auto max-w-[88%] border-cyan-400/20 bg-cyan-400/10"
                                    : message.error
                                      ? "max-w-[92%] border-rose-400/20 bg-rose-400/10"
                                      : "max-w-[92%] border-white/10 bg-[#0f1319]"
                                }`}
                              >
                                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
                                  {message.role === "user" ? "Admin" : "GEMAI"}
                                </p>
                                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-200">
                                  {message.content}
                                </p>

                                {message.result ? (
                                  <div className="mt-5 rounded-[18px] border border-white/10 bg-black/20 p-4">
                                    <p className="text-xs uppercase tracking-[0.18em] text-cyan-300/80">
                                      {t.rules.draftLabel}
                                    </p>
                                    {isEditingChatDraft && chatDraft ? (
                                      <textarea
                                        value={chatDraft.arabicText}
                                        onChange={(event) =>
                                          updateChatDraftText(event.target.value)
                                        }
                                        dir="rtl"
                                        rows={7}
                                        className="mt-4 w-full rounded-[18px] border border-cyan-400/25 bg-[#0c0f14] px-4 py-4 text-right text-base leading-8 text-zinc-100 outline-none transition focus:border-cyan-300/50"
                                      />
                                    ) : (
                                      <p
                                        className="mt-4 whitespace-pre-wrap rounded-[18px] border border-white/10 bg-[#0c0f14] px-4 py-4 text-right text-base leading-8 text-zinc-100"
                                        dir="rtl"
                                      >
                                        {chatDraft?.arabicText || message.result.draft}
                                      </p>
                                    )}
                                    <p className="mt-5 text-sm leading-7 text-zinc-300">
                                      {t.rules.question}
                                    </p>
                                    <div className="mt-4 flex flex-wrap gap-3">
                                      <button
                                        type="button"
                                        onClick={confirmAddDraft}
                                        disabled={
                                          isSavingRule || !chatDraft?.arabicText.trim()
                                        }
                                        className="inline-flex h-11 items-center justify-center rounded-2xl bg-cyan-400 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
                                      >
                                        {isSavingRule ? t.rules.saving : t.rules.confirm}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={editAddDraft}
                                        disabled={!chatDraft || isEditingChatDraft}
                                        className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white transition hover:bg-white/[0.08] disabled:opacity-60"
                                      >
                                        {t.rules.edit}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={cancelAddDraft}
                                        className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white transition hover:bg-white/[0.08]"
                                      >
                                        {t.rules.cancel}
                                      </button>
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            ))
                          )}
                        </div>

                        {chatError ? (
                          <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                            {chatError}
                          </div>
                        ) : null}

                        <div className="mt-5 rounded-[22px] border border-white/10 bg-[#0f1319] p-4">
                          <textarea
                            value={chatInput}
                            onChange={(event) => setChatInput(event.target.value)}
                            rows={4}
                            placeholder={t.rules.addPlaceholder}
                            className="w-full resize-none bg-transparent text-sm leading-7 text-white outline-none placeholder:text-zinc-500"
                          />
                          <div className="mt-4 flex justify-end">
                            <button
                              type="button"
                              onClick={generateRuleDraft}
                              disabled={isGeneratingDraft || !chatInput.trim()}
                              className="inline-flex h-11 items-center justify-center rounded-2xl bg-cyan-400 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {isGeneratingDraft ? t.rules.addSending : t.rules.addSend}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    ) : null}

                    {ruleManagerMode === "edit" ? (
                      <div className="space-y-6">
                          <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
                              {t.rules.existingTitle}
                            </p>
                            <p className="mt-4 text-sm leading-7 text-zinc-400">
                              {t.rules.existingDescription}
                            </p>

                            <div className="mt-6 space-y-4">
                              <input
                                value={ruleSearch}
                                onChange={(event) => setRuleSearch(event.target.value)}
                                placeholder={t.rules.searchPlaceholder}
                                className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-cyan-400/35"
                              />

                              <div className="flex flex-wrap gap-2">
                                <SectionChip
                                  active={ruleCategoryFilter === "all"}
                                  label={t.rules.allCategories}
                                  onClick={() => setRuleCategoryFilter("all")}
                                />
                                {categories.map((category) => (
                                  <SectionChip
                                    key={category}
                                    active={ruleCategoryFilter === category}
                                    label={category}
                                    onClick={() => setRuleCategoryFilter(category)}
                                  />
                                ))}
                              </div>

                              <div className="flex flex-wrap gap-2">
                                <SectionChip
                                  active={ruleSort === "newest"}
                                  label={t.rules.newest}
                                  onClick={() => setRuleSort("newest")}
                                />
                                <SectionChip
                                  active={ruleSort === "oldest"}
                                  label={t.rules.oldest}
                                  onClick={() => setRuleSort("oldest")}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6">
                            <p className="text-sm font-semibold text-white">{t.rules.activeRules}</p>
                            <div className="mt-4 max-h-[560px] space-y-3 overflow-y-auto pr-1">
                              {filteredActiveRules.length === 0 ? (
                                <div className="rounded-[22px] border border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
                                  {t.rules.noRules}
                                </div>
                              ) : (
                                filteredActiveRules.map((rule) => (
                                  <div
                                    key={rule.id}
                                    className={`rounded-[22px] border px-4 py-4 transition ${
                                      selectedRuleId === rule.id
                                        ? "border-cyan-300/35 bg-cyan-300/15 shadow-[0_0_28px_rgba(34,211,238,0.08)]"
                                        : "border-white/10 bg-black/20 hover:bg-white/[0.04]"
                                    }`}
                                  >
                                    <button
                                      type="button"
                                      onClick={() => selectRuleForActions(rule)}
                                      className="w-full text-left"
                                    >
                                      <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className={textAlignClass}>
                                          <p className="text-sm font-semibold text-white">
                                            {rule.title}
                                          </p>
                                          <p className="mt-1 text-xs text-zinc-500">
                                            {rule.category}
                                          </p>
                                        </div>
                                        <span className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-zinc-300">
                                          {rule.status === "published"
                                            ? t.rules.published
                                            : t.rules.draft}
                                        </span>
                                      </div>
                                      <p
                                        className="mt-4 line-clamp-3 text-right text-sm leading-7 text-zinc-300"
                                        dir="rtl"
                                      >
                                        {rule.arabicText}
                                      </p>
                                    </button>

                                    {selectedRuleId === rule.id ? (
                                      <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
                                        <button
                                          type="button"
                                          onClick={() => openRuleEditor(rule)}
                                          className="inline-flex h-10 items-center justify-center rounded-2xl bg-cyan-400 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                                        >
                                          {t.rules.editRule}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => moveRuleToTrash(rule)}
                                          disabled={isSavingRule}
                                          className="inline-flex h-10 items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 text-sm text-rose-100 transition hover:bg-rose-400/15 disabled:opacity-60"
                                        >
                                          {t.rules.trashRule}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={cancelRuleSelection}
                                          className="inline-flex h-10 items-center justify-center rounded-2xl border border-white/10 bg-transparent px-4 text-sm text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
                                        >
                                          {t.rules.cancel}
                                        </button>
                                      </div>
                                    ) : null}
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                      </div>
                    ) : null}

                    {ruleManagerMode === "trash" ? (
                      <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-7">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
                              {t.rules.recycleBin}
                          </p>
                          <p className="mt-4 text-sm leading-7 text-zinc-400">
                              {t.rules.permanentDeleteBody}
                          </p>
                        </div>
                      </div>

                      <div className="mt-6 space-y-4">
                        <input
                          value={ruleSearch}
                          onChange={(event) => setRuleSearch(event.target.value)}
                          placeholder={t.rules.searchPlaceholder}
                          className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-cyan-400/35"
                        />

                        <div className="flex flex-wrap gap-2">
                          <SectionChip
                            active={ruleCategoryFilter === "all"}
                            label={t.rules.allCategories}
                            onClick={() => setRuleCategoryFilter("all")}
                          />
                          {categories.map((category) => (
                            <SectionChip
                              key={category}
                              active={ruleCategoryFilter === category}
                              label={category}
                              onClick={() => setRuleCategoryFilter(category)}
                            />
                          ))}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <SectionChip
                            active={ruleSort === "newest"}
                            label={t.rules.newest}
                            onClick={() => setRuleSort("newest")}
                          />
                          <SectionChip
                            active={ruleSort === "oldest"}
                            label={t.rules.oldest}
                            onClick={() => setRuleSort("oldest")}
                          />
                        </div>
                      </div>

                        <div className="mt-6 space-y-3">
                          {filteredTrashedRules.length === 0 ? (
                            <div className="rounded-[22px] border border-white/10 bg-black/20 p-4 text-sm text-zinc-400">
                              {t.rules.noTrash}
                            </div>
                          ) : (
                            filteredTrashedRules.map((rule) => (
                              <div
                                key={rule.id}
                                className="rounded-[24px] border border-white/10 bg-black/20 p-5"
                              >
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                  <div className={textAlignClass}>
                                    <p className="text-sm font-semibold text-white">
                                      {rule.title}
                                    </p>
                                    <p className="mt-1 text-xs text-zinc-500">
                                      {rule.category}
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap gap-2">
                                    <button
                                      type="button"
                                      onClick={() => restoreRule(rule)}
                                      disabled={isSavingRule}
                                      className="inline-flex h-10 items-center justify-center rounded-2xl bg-cyan-400 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
                                    >
                                      {t.rules.restoreRule}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => permanentlyDeleteRule(rule)}
                                      disabled={isSavingRule}
                                      className="inline-flex h-10 items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 text-sm text-rose-100 transition hover:bg-rose-400/15 disabled:opacity-60"
                                    >
                                      {t.rules.deleteForever}
                                    </button>
                                  </div>
                                </div>
                                <p
                                  className="mt-4 whitespace-pre-wrap text-right text-sm leading-7 text-zinc-300"
                                  dir="rtl"
                                >
                                  {rule.arabicText}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ) : null}
                </div>
                </div>
              ) : null}

              {activeSection === "public" ? (
                <div className="grid items-start gap-8 xl:grid-cols-[340px_minmax(0,1fr)]">
                  <div className="gem-panel rounded-[30px] p-7">
                    <p className="gem-eyebrow">
                      Classes / Grades
                    </p>
                    <div className="mt-6 space-y-4">
                      {gradeInfo.map((grade) => (
                        <button
                          key={grade.id}
                          type="button"
                          onClick={() => setSelectedGradeInfoId(grade.id)}
                          className={`w-full rounded-[24px] border px-5 py-4 text-left transition ${
                            grade.id === selectedGradeInfoId
                              ? "border-blue-500/30 bg-blue-600/10 shadow-[0_16px_36px_-30px_rgba(11,47,134,0.75)]"
                              : "border-blue-900/10 bg-white/65 hover:border-blue-500/20 hover:bg-white/90"
                          }`}
                        >
                          <p className="text-sm font-bold text-slate-950">
                            {grade.className}
                          </p>
                          {grade.ageRange ? (
                            <p className="mt-2 text-xs font-medium text-slate-500">
                              {grade.ageRange}
                            </p>
                          ) : null}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-8">
                    {publicInfoSuccess ? (
                      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
                        {publicInfoSuccess}
                      </div>
                    ) : null}

                    {publicInfoError ? (
                      <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                        {publicInfoError}
                      </div>
                    ) : null}

                    {selectedGradeInfo ? (
                      <>
                        <div className="gem-panel rounded-[30px] p-8">
                          <div className="flex flex-wrap items-start justify-between gap-6">
                            <div className="min-w-0">
                              <p className="gem-eyebrow">
                                Grade public information
                              </p>
                              <h2 className="mt-4 text-2xl font-black text-slate-950">
                                {selectedGradeInfo.className}
                              </h2>
                              {selectedGradeInfo.ageRange ? (
                                <p className="mt-2 text-sm font-medium text-slate-500">
                                  {selectedGradeInfo.ageRange}
                                </p>
                              ) : null}
                            </div>
                            <button
                              type="button"
                              onClick={() => setShowPublicConfirm(true)}
                              disabled={isSavingPublicInfo}
                              className="gem-button inline-flex h-11 items-center justify-center rounded-2xl px-4 text-sm font-bold disabled:opacity-60"
                            >
                              {isSavingPublicInfo ? t.publicInfo.saving : t.publicInfo.save}
                            </button>
                          </div>

                          <label className="mt-8 block max-w-md rounded-[24px] border border-blue-900/10 bg-white/70 p-5">
                            <span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                              Age range
                            </span>
                            <input
                              value={selectedGradeInfo.ageRange ?? ""}
                              onChange={(event) =>
                                updateSelectedGradeInfo("ageRange", event.target.value)
                              }
                              placeholder="ages 6-7"
                              className="gem-input mt-4 h-12 w-full rounded-2xl px-4 text-sm font-semibold outline-none placeholder:text-slate-400"
                            />
                          </label>

                          <div className="mt-8 grid gap-6 md:grid-cols-2">
                            <div className="rounded-[24px] border border-blue-900/10 bg-white/70 p-6">
                              <span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                                Tuition
                              </span>
                              <div className="mt-4 flex gap-3">
                                <input
                                  type="number"
                                  inputMode="numeric"
                                  min="0"
                                  value={selectedGradeInfo.tuitionAmount}
                                  onChange={(event) =>
                                    updateSelectedGradeInfo(
                                      "tuitionAmount",
                                      event.target.value,
                                    )
                                  }
                                  className="gem-input h-12 min-w-0 flex-1 rounded-2xl px-4 text-lg font-bold outline-none"
                                />
                                <select
                                  value={selectedGradeInfo.tuitionCurrency}
                                  onChange={(event) =>
                                    updateSelectedGradeInfo(
                                      "tuitionCurrency",
                                      event.target.value as MoneyCurrency,
                                    )
                                  }
                                  className="gem-input h-12 w-28 rounded-2xl px-3 text-sm font-bold outline-none"
                                >
                                  <option value="USD">USD</option>
                                  <option value="LBP">LBP</option>
                                </select>
                              </div>
                            </div>

                            <div className="rounded-[24px] border border-blue-900/10 bg-white/70 p-6">
                              <span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-700">
                                قرطاسيّة / Stationery fee
                              </span>
                              <div className="mt-4 flex gap-3">
                                <input
                                  type="number"
                                  inputMode="numeric"
                                  min="0"
                                  value={selectedGradeInfo.stationeryAmount}
                                  onChange={(event) =>
                                    updateSelectedGradeInfo(
                                      "stationeryAmount",
                                      event.target.value,
                                    )
                                  }
                                  className="gem-input h-12 min-w-0 flex-1 rounded-2xl px-4 text-lg font-bold outline-none"
                                />
                                <select
                                  value={selectedGradeInfo.stationeryCurrency}
                                  onChange={(event) =>
                                    updateSelectedGradeInfo(
                                      "stationeryCurrency",
                                      event.target.value as MoneyCurrency,
                                    )
                                  }
                                  className="gem-input h-12 w-28 rounded-2xl px-3 text-sm font-bold outline-none"
                                >
                                  <option value="USD">USD</option>
                                  <option value="LBP">LBP</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="gem-panel rounded-[30px] p-8">
                          <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                              <p className="gem-eyebrow">
                                Required books
                              </p>
                              <p className="mt-3 text-sm leading-7 text-slate-500">
                                Add, edit, remove, and restore books for this grade.
                              </p>
                            </div>
                          </div>

                          <div className="mt-7 flex flex-col gap-4 sm:flex-row">
                            <input
                              value={newBookName}
                              onChange={(event) => setNewBookName(event.target.value)}
                              placeholder="Add a book name..."
                              className="gem-input h-12 flex-1 rounded-2xl px-4 text-sm outline-none placeholder:text-slate-400"
                            />
                            <button
                              type="button"
                              onClick={addGradeBook}
                              disabled={!newBookName.trim()}
                              className="gem-button inline-flex h-12 items-center justify-center rounded-2xl px-5 text-sm font-bold disabled:opacity-60"
                            >
                              Add book
                            </button>
                          </div>

                          <div className="mt-7 space-y-4">
                            {activeGradeBooks.map((book) => (
                              <div
                                key={book.id}
                                className="flex flex-col gap-4 rounded-[22px] border border-blue-900/10 bg-white/70 p-5 sm:flex-row"
                              >
                                <input
                                  value={book.name}
                                  onChange={(event) =>
                                    updateGradeBook(book.id, event.target.value)
                                  }
                                  className="gem-input h-11 flex-1 rounded-2xl px-4 text-sm outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => setGradeBookStatus(book.id, "trashed")}
                                  className="rounded-2xl border border-rose-500/20 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>

                          {trashedGradeBooks.length > 0 ? (
                            <div className="mt-7 rounded-[24px] border border-blue-900/10 bg-white/70 p-5">
                              <p className="text-sm font-bold text-slate-950">
                                Recycle bin
                              </p>
                              <div className="mt-4 space-y-3">
                                {trashedGradeBooks.map((book) => (
                                  <div
                                    key={book.id}
                                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-blue-900/10 bg-white/80 px-4 py-3"
                                  >
                                    <p className="text-sm font-medium text-slate-700">{book.name}</p>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setGradeBookStatus(book.id, "active")
                                      }
                                      className="gem-soft-button rounded-xl px-3 py-2 text-xs font-semibold"
                                    >
                                      Restore
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {activeSection === "settings" ? (
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-7">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
                      {t.settings.authMode}
                    </p>
                    <p className="mt-5 text-lg font-semibold text-white">
                      Username + password with signed session cookie
                    </p>
                    <p className="mt-4 text-sm leading-7 text-zinc-400">
                      {t.settings.description}
                    </p>
                  </div>

                  <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-7">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
                      {t.settings.currentUser}
                    </p>
                    <p className="mt-5 text-lg font-semibold text-white">{username}</p>
                    <p className="mt-4 text-sm leading-7 text-zinc-400">
                      {t.settings.future}
                    </p>
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="mt-7 inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white transition hover:bg-white/[0.08] disabled:opacity-60"
                    >
                      {isLoggingOut ? t.settings.loggingOut : t.settings.logout}
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>

      {showRuleActionModal && selectedRule ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="rule-action-title"
            className={`w-full max-w-xl rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(31,38,49,0.98),rgba(18,22,29,0.98))] p-6 shadow-[0_32px_110px_-48px_rgba(0,0,0,0.95)] sm:p-7 ${textAlignClass}`}
            dir={textDirection}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
              GEMAI
            </p>
            <h2
              id="rule-action-title"
              className="mt-4 text-xl font-semibold tracking-tight text-white"
            >
              {t.rules.actionTitle}
            </h2>
            <p className="mt-3 text-base font-semibold text-white">
              {selectedRule.title}
            </p>
            <p
              className="mt-4 rounded-[22px] border border-white/10 bg-black/20 px-4 py-4 text-right text-sm leading-7 text-zinc-300"
              dir="rtl"
            >
              {buildRulePreview(selectedRule)}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {selectedRule.status === "trashed" ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setShowRuleActionModal(false);
                      setShowRestoreModal(true);
                    }}
                    className="inline-flex h-11 items-center justify-center rounded-2xl bg-cyan-400 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                  >
                    {t.rules.restoreRule}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteMode("permanent");
                      setShowRuleActionModal(false);
                      setShowDeleteModal(true);
                    }}
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 text-sm text-rose-100 transition hover:bg-rose-400/15"
                  >
                    {t.rules.deleteForever}
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingRule(cloneRule(selectedRule));
                      setShowRuleActionModal(false);
                      setShowEditModal(true);
                    }}
                    className="inline-flex h-11 items-center justify-center rounded-2xl bg-cyan-400 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
                  >
                    {t.rules.editRule}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteMode("trash");
                      setShowRuleActionModal(false);
                      setShowDeleteModal(true);
                    }}
                    className="inline-flex h-11 items-center justify-center rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 text-sm text-rose-100 transition hover:bg-rose-400/15"
                  >
                    {t.rules.trashRule}
                  </button>
                </>
              )}
              <button
                type="button"
                onClick={() => setShowRuleActionModal(false)}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-transparent px-4 text-sm text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
              >
                {t.rules.cancel}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showEditModal && editingRule ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="rule-edit-title"
            className="max-h-[calc(100vh-3rem)] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(31,38,49,0.98),rgba(18,22,29,0.98))] p-6 shadow-[0_32px_110px_-48px_rgba(0,0,0,0.95)] sm:p-7"
            dir={textDirection}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
              GEMAI
            </p>
            <h2
              id="rule-edit-title"
              className="mt-4 text-xl font-semibold tracking-tight text-white"
            >
              {t.rules.editModalTitle}
            </h2>
            <div className="mt-6 grid gap-5">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-zinc-200">
                  {t.rules.titleLabel}
                </span>
                <input
                  value={editingRule.title}
                  onChange={(event) => updateEditingRule("title", event.target.value)}
                  className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-white outline-none transition focus:border-cyan-400/35"
                />
              </label>

              <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
                <div>
                  <span className="mb-2 block text-sm font-medium text-zinc-200">
                    {t.rules.categoryLabel}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {categories.map((category) => (
                      <SectionChip
                        key={category}
                        active={editingRule.category === category}
                        label={category}
                        onClick={() => updateEditingRule("category", category)}
                      />
                    ))}
                  </div>
                  <input
                    value={editingRule.category}
                    onChange={(event) => updateEditingRule("category", event.target.value)}
                    placeholder={t.rules.customCategory}
                    className="mt-3 h-11 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none transition placeholder:text-zinc-500 focus:border-cyan-400/35"
                  />
                </div>

                <div>
                  <span className="mb-2 block text-sm font-medium text-zinc-200">
                    {t.rules.statusLabel}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {(["published", "draft"] as const).map((status) => (
                      <SectionChip
                        key={status}
                        active={editingRule.status === status}
                        label={status === "published" ? t.rules.published : t.rules.draft}
                        onClick={() => updateEditingRule("status", status)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-zinc-200">
                  {t.rules.arabicRule}
                </span>
                <textarea
                  value={editingRule.arabicText}
                  onChange={(event) => updateEditingRule("arabicText", event.target.value)}
                  dir="rtl"
                  rows={9}
                  className="w-full rounded-[24px] border border-white/10 bg-black/20 px-4 py-4 text-right text-base leading-8 text-white outline-none transition focus:border-cyan-400/35"
                />
              </label>

              <div className="rounded-[24px] border border-white/10 bg-black/20 p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
                  {t.rules.previewTitle}
                </p>
                <p
                  className="mt-4 whitespace-pre-wrap text-right text-base leading-8 text-zinc-100"
                  dir="rtl"
                >
                  {editingRule.arabicText || t.rules.previewEmpty}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={saveEditedRule}
                  disabled={isSavingRule}
                  className="inline-flex h-11 items-center justify-center rounded-2xl bg-cyan-400 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
                >
                  {isSavingRule ? t.rules.saving : t.rules.save}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingRule(null);
                  }}
                  className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-transparent px-4 text-sm text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
                >
                  {t.rules.cancel}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {showDeleteModal && selectedRule ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="rule-delete-title"
            className={`w-full max-w-xl rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(31,38,49,0.98),rgba(18,22,29,0.98))] p-6 shadow-[0_32px_110px_-48px_rgba(0,0,0,0.95)] sm:p-7 ${textAlignClass}`}
            dir={textDirection}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
              GEMAI
            </p>
            <h2
              id="rule-delete-title"
              className="mt-4 text-xl font-semibold tracking-tight text-white"
            >
              {deleteMode === "trash"
                ? t.rules.trashTitle
                : t.rules.permanentDeleteTitle}
            </h2>
            <p className="mt-3 text-base font-semibold text-white">
              {selectedRule.title}
            </p>
            <p
              className="mt-4 rounded-[22px] border border-white/10 bg-black/20 px-4 py-4 text-right text-sm leading-7 text-zinc-300"
              dir="rtl"
            >
              {buildRulePreview(selectedRule)}
            </p>
            <p className="mt-3 text-sm leading-7 text-zinc-400">
              {deleteMode === "trash"
                ? t.rules.trashBody
                : t.rules.permanentDeleteBody}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={
                  deleteMode === "trash"
                    ? () => moveRuleToTrash(selectedRule)
                    : permanentlyDeleteSelectedRule
                }
                disabled={isSavingRule}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-rose-500 px-4 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:opacity-60"
              >
                {isSavingRule
                  ? t.rules.saving
                  : deleteMode === "trash"
                    ? t.rules.trashRule
                    : t.rules.deleteForever}
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-transparent px-4 text-sm text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
              >
                {t.rules.cancel}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showRestoreModal && selectedRule ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="rule-restore-title"
            className={`w-full max-w-xl rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(31,38,49,0.98),rgba(18,22,29,0.98))] p-6 shadow-[0_32px_110px_-48px_rgba(0,0,0,0.95)] sm:p-7 ${textAlignClass}`}
            dir={textDirection}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
              GEMAI
            </p>
            <h2
              id="rule-restore-title"
              className="mt-4 text-xl font-semibold tracking-tight text-white"
            >
              {t.rules.restoreTitle}
            </h2>
            <p className="mt-3 text-base font-semibold text-white">
              {selectedRule.title}
            </p>
            <p
              className="mt-4 rounded-[22px] border border-white/10 bg-black/20 px-4 py-4 text-right text-sm leading-7 text-zinc-300"
              dir="rtl"
            >
              {buildRulePreview(selectedRule)}
            </p>
            <p className="mt-3 text-sm leading-7 text-zinc-400">{t.rules.restoreBody}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={restoreSelectedRule}
                disabled={isSavingRule}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-cyan-400 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
              >
                {isSavingRule ? t.rules.saving : t.rules.restoreRule}
              </button>
              <button
                type="button"
                onClick={() => setShowRestoreModal(false)}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-transparent px-4 text-sm text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
              >
                {t.rules.cancel}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showPublicConfirm ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm"
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="public-info-confirm-title"
            className={`w-full max-w-xl rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(31,38,49,0.98),rgba(18,22,29,0.98))] p-6 shadow-[0_32px_110px_-48px_rgba(0,0,0,0.95)] sm:p-7 ${textAlignClass}`}
            dir={textDirection}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
              GEMAI
            </p>
            <h2
              id="public-info-confirm-title"
              className="mt-4 text-xl font-semibold tracking-tight text-white"
            >
              {t.publicInfo.confirmTitle}
            </h2>
            <p className="mt-3 text-sm leading-7 text-zinc-300">
              {t.publicInfo.confirmBody}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <button
                type="button"
                onClick={confirmSavePublicInfo}
                disabled={isSavingPublicInfo}
                className="inline-flex h-11 items-center justify-center rounded-2xl bg-cyan-400 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
              >
                {isSavingPublicInfo ? t.publicInfo.saving : t.publicInfo.confirm}
              </button>
              <button
                type="button"
                onClick={() => setShowPublicConfirm(false)}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-white transition hover:bg-white/[0.08]"
              >
                {t.publicInfo.editAgain}
              </button>
              <button
                type="button"
                onClick={() => setShowPublicConfirm(false)}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-white/10 bg-transparent px-4 text-sm text-zinc-300 transition hover:bg-white/[0.06] hover:text-white"
              >
                {t.publicInfo.cancel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}
