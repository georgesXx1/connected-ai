import crypto from "crypto";
import fs from "fs/promises";
import path from "path";

import { kv } from "@vercel/kv";

export type ScheduleDay = "monday" | "tuesday" | "wednesday" | "thursday" | "friday";
export type ScheduleEntryType = "class" | "recess";
export type TeacherAccountStatus = "active" | "inactive";

export type SchedulePeriod = {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  type: ScheduleEntryType;
  createdAt: string;
  updatedAt: string;
};

export type SchoolClassSection = {
  id: string;
  name: string;
  gradeLevel: string;
  displayLabel?: string;
  createdAt: string;
  updatedAt: string;
};

export type TeacherAccount = {
  id: string;
  fullName: string;
  username: string;
  passwordHash: string;
  subjects: string[];
  classIds: string[];
  status: TeacherAccountStatus;
  createdAt: string;
  updatedAt: string;
};

export type PublicTeacherAccount = Omit<TeacherAccount, "passwordHash">;

export type ScheduleEntry = {
  id: string;
  classId: string;
  dayOfWeek: ScheduleDay;
  periodIndex: number;
  type: ScheduleEntryType;
  subject: string;
  teacherId?: string;
  updatedAt: string;
};

export type ClassPeriodOverride = {
  id: string;
  classId: string;
  periodIndex: number;
  startTime: string;
  endTime: string;
  hidden: boolean;
  updatedAt: string;
};

export type SchoolScheduleData = {
  classes: SchoolClassSection[];
  teachers: TeacherAccount[];
  periods: SchedulePeriod[];
  classPeriodOverrides: ClassPeriodOverride[];
  entries: ScheduleEntry[];
  updatedAt: string;
};

export type TeacherScheduleEntry = ScheduleEntry & {
  className: string;
  teacherName: string;
  periodLabel: string;
  startTime: string;
  endTime: string;
};

export const SCHOOL_SCHEDULE_KEY = "school_schedule";
export const SCHEDULE_DAYS: ScheduleDay[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
];
export const DEFAULT_PERIODS = 8;

const LOCAL_SCHEDULE_PATH = path.join(process.cwd(), "data", "school-schedule.json");
const PASSWORD_ITERATIONS = 120000;
const PASSWORD_KEY_LENGTH = 32;
const PASSWORD_DIGEST = "sha256";

function nowIso() {
  return new Date().toISOString();
}

export function createId(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

export function hashTeacherPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("base64url");
  const hash = crypto
    .pbkdf2Sync(password, salt, PASSWORD_ITERATIONS, PASSWORD_KEY_LENGTH, PASSWORD_DIGEST)
    .toString("base64url");

  return `pbkdf2$${PASSWORD_ITERATIONS}$${salt}$${hash}`;
}

export function verifyTeacherPassword(password: string, storedHash: string) {
  const [scheme, iterationsRaw, salt, hash] = storedHash.split("$");
  const iterations = Number(iterationsRaw);

  if (scheme !== "pbkdf2" || !salt || !hash || Number.isNaN(iterations)) {
    return false;
  }

  const candidate = crypto
    .pbkdf2Sync(password, salt, iterations, PASSWORD_KEY_LENGTH, PASSWORD_DIGEST)
    .toString("base64url");

  try {
    return crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(hash));
  } catch {
    return false;
  }
}

export function toPublicTeacher(teacher: TeacherAccount): PublicTeacherAccount {
  return {
    id: teacher.id,
    fullName: teacher.fullName,
    username: teacher.username,
    subjects: teacher.subjects,
    classIds: teacher.classIds,
    status: teacher.status,
    createdAt: teacher.createdAt,
    updatedAt: teacher.updatedAt,
  };
}

function normalizeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeList(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return [...new Set(value.map(normalizeString).filter(Boolean))];
}

function isScheduleDay(value: unknown): value is ScheduleDay {
  return typeof value === "string" && SCHEDULE_DAYS.includes(value as ScheduleDay);
}

function normalizeClassSection(value: unknown, index: number): SchoolClassSection {
  const item = value && typeof value === "object" ? (value as Partial<SchoolClassSection>) : {};
  const timestamp = nowIso();
  const name = normalizeString(item.name) || `Class ${index + 1}`;
  const gradeLevel = normalizeString(item.gradeLevel) || name;

  return {
    id: normalizeString(item.id) || createId("class"),
    name,
    gradeLevel,
    displayLabel: normalizeString(item.displayLabel) || undefined,
    createdAt: normalizeString(item.createdAt) || timestamp,
    updatedAt: normalizeString(item.updatedAt) || timestamp,
  };
}

function buildDefaultPeriods(count = DEFAULT_PERIODS): SchedulePeriod[] {
  const timestamp = nowIso();

  return Array.from({ length: count }, (_value, index) => ({
    id: `period-${index + 1}`,
    label: `Period ${index + 1}`,
    startTime: "",
    endTime: "",
    type: "class" as const,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));
}

function normalizeSchedulePeriod(value: unknown, index: number): SchedulePeriod {
  const item = value && typeof value === "object" ? (value as Partial<SchedulePeriod>) : {};
  const timestamp = nowIso();

  return {
    id: normalizeString(item.id) || createId("period"),
    label: normalizeString(item.label) || `Period ${index + 1}`,
    startTime: normalizeString(item.startTime),
    endTime: normalizeString(item.endTime),
    type: item.type === "recess" ? "recess" : "class",
    createdAt: normalizeString(item.createdAt) || timestamp,
    updatedAt: normalizeString(item.updatedAt) || timestamp,
  };
}

function normalizeTeacherAccount(value: unknown, index: number): TeacherAccount {
  const item = value && typeof value === "object" ? (value as Partial<TeacherAccount>) : {};
  const timestamp = nowIso();
  const fullName = normalizeString(item.fullName) || `Teacher ${index + 1}`;
  const username = normalizeString(item.username).toLowerCase() || `teacher${index + 1}`;
  const passwordHash = normalizeString(item.passwordHash) || hashTeacherPassword("change-me");

  return {
    id: normalizeString(item.id) || createId("teacher"),
    fullName,
    username,
    passwordHash,
    subjects: normalizeList(item.subjects),
    classIds: normalizeList(item.classIds),
    status: item.status === "inactive" ? "inactive" : "active",
    createdAt: normalizeString(item.createdAt) || timestamp,
    updatedAt: normalizeString(item.updatedAt) || timestamp,
  };
}

function normalizeScheduleEntry(value: unknown, index: number): ScheduleEntry | null {
  const item = value && typeof value === "object" ? (value as Partial<ScheduleEntry>) : {};
  const timestamp = nowIso();
  const classId = normalizeString(item.classId);
  const periodIndex = Number(item.periodIndex);

  if (!classId || !isScheduleDay(item.dayOfWeek) || !Number.isInteger(periodIndex) || periodIndex < 0) {
    return null;
  }

  const type = item.type === "recess" ? "recess" : "class";

  return {
    id: normalizeString(item.id) || `entry-${index + 1}`,
    classId,
    dayOfWeek: item.dayOfWeek,
    periodIndex,
    type,
    subject: type === "recess" ? "Recess" : normalizeString(item.subject),
    teacherId: type === "class" ? normalizeString(item.teacherId) || undefined : undefined,
    updatedAt: normalizeString(item.updatedAt) || timestamp,
  };
}

function normalizeClassPeriodOverride(value: unknown, index: number): ClassPeriodOverride | null {
  const item = value && typeof value === "object" ? (value as Partial<ClassPeriodOverride>) : {};
  const timestamp = nowIso();
  const classId = normalizeString(item.classId);
  const periodIndex = Number(item.periodIndex);

  if (!classId || !Number.isInteger(periodIndex) || periodIndex < 0) {
    return null;
  }

  return {
    id: normalizeString(item.id) || `class-period-${index + 1}`,
    classId,
    periodIndex,
    startTime: normalizeString(item.startTime),
    endTime: normalizeString(item.endTime),
    hidden: Boolean(item.hidden),
    updatedAt: normalizeString(item.updatedAt) || timestamp,
  };
}

export function sanitizeSchoolScheduleData(value: unknown): SchoolScheduleData {
  const item = value && typeof value === "object" ? (value as Partial<SchoolScheduleData>) : {};
  const classes = Array.isArray(item.classes)
    ? item.classes.map(normalizeClassSection)
    : [];
  const teachers = Array.isArray(item.teachers)
    ? item.teachers.map(normalizeTeacherAccount)
    : [];
  const highestEntryPeriod = Array.isArray(item.entries)
    ? item.entries.reduce((highest, rawEntry) => {
        const periodIndex =
          rawEntry && typeof rawEntry === "object"
            ? Number((rawEntry as Partial<ScheduleEntry>).periodIndex)
            : -1;

        return Number.isInteger(periodIndex) && periodIndex >= 0
          ? Math.max(highest, periodIndex)
          : highest;
      }, -1)
    : -1;
  const periods = Array.isArray(item.periods) && item.periods.length > 0
    ? item.periods.map(normalizeSchedulePeriod)
    : buildDefaultPeriods(Math.max(DEFAULT_PERIODS, highestEntryPeriod + 1));
  const knownClassIds = new Set(classes.map((classSection) => classSection.id));
  const knownTeacherIds = new Set(teachers.map((teacher) => teacher.id));
  const classPeriodOverrides = new Map<string, ClassPeriodOverride>();
  const dedupedEntries = new Map<string, ScheduleEntry>();

  if (Array.isArray(item.classPeriodOverrides)) {
    item.classPeriodOverrides.forEach((rawOverride, index) => {
      const override = normalizeClassPeriodOverride(rawOverride, index);

      if (
        !override ||
        !knownClassIds.has(override.classId) ||
        override.periodIndex >= periods.length
      ) {
        return;
      }

      classPeriodOverrides.set(`${override.classId}:${override.periodIndex}`, override);
    });
  }

  if (Array.isArray(item.entries)) {
    item.entries.forEach((rawEntry, index) => {
      const entry = normalizeScheduleEntry(rawEntry, index);

      if (!entry || !knownClassIds.has(entry.classId)) {
        return;
      }

      if (classPeriodOverrides.get(`${entry.classId}:${entry.periodIndex}`)?.hidden) {
        return;
      }

      if (entry.teacherId && !knownTeacherIds.has(entry.teacherId)) {
        entry.teacherId = undefined;
      }

      if (periods[entry.periodIndex]?.type === "recess") {
        entry.type = "recess";
        entry.subject = "Recess";
        entry.teacherId = undefined;
      }

      dedupedEntries.set(`${entry.classId}:${entry.dayOfWeek}:${entry.periodIndex}`, entry);
    });
  }

  return {
    classes,
    teachers,
    periods,
    classPeriodOverrides: [...classPeriodOverrides.values()],
    entries: [...dedupedEntries.values()],
    updatedAt: normalizeString(item.updatedAt) || nowIso(),
  };
}

async function readLocalSchedule() {
  try {
    const content = await fs.readFile(LOCAL_SCHEDULE_PATH, "utf8");
    return sanitizeSchoolScheduleData(JSON.parse(content));
  } catch {
    return sanitizeSchoolScheduleData(null);
  }
}

async function saveLocalSchedule(data: SchoolScheduleData) {
  await fs.mkdir(path.dirname(LOCAL_SCHEDULE_PATH), { recursive: true });
  await fs.writeFile(LOCAL_SCHEDULE_PATH, JSON.stringify(data, null, 2), "utf8");
}

export async function readSchoolScheduleData() {
  try {
    const data = await kv.get<SchoolScheduleData>(SCHOOL_SCHEDULE_KEY);
    return sanitizeSchoolScheduleData(data);
  } catch {
    return readLocalSchedule();
  }
}

export async function saveSchoolScheduleData(input: SchoolScheduleData) {
  const data = sanitizeSchoolScheduleData({
    ...input,
    updatedAt: nowIso(),
  });

  const conflict = findTeacherConflict(data.entries);

  if (conflict) {
    const error = new Error("This teacher is already assigned to another class during this time.");
    error.name = "TeacherScheduleConflict";
    throw error;
  }

  try {
    await kv.set(SCHOOL_SCHEDULE_KEY, data);
  } catch {
    await saveLocalSchedule(data);
  }

  return data;
}

export function findTeacherConflict(entries: ScheduleEntry[]) {
  const seen = new Map<string, ScheduleEntry>();

  for (const entry of entries) {
    if (entry.type !== "class" || !entry.teacherId) {
      continue;
    }

    const key = `${entry.teacherId}:${entry.dayOfWeek}:${entry.periodIndex}`;
    const existing = seen.get(key);

    if (existing && existing.classId !== entry.classId) {
      return { existing, attempted: entry };
    }

    seen.set(key, entry);
  }

  return null;
}

export async function authenticateTeacher(username: string, password: string) {
  const data = await readSchoolScheduleData();
  const teacher = data.teachers.find(
    (entry) => entry.username.toLowerCase() === username.trim().toLowerCase(),
  );

  if (!teacher || teacher.status !== "active") {
    return null;
  }

  return verifyTeacherPassword(password, teacher.passwordHash) ? teacher : null;
}

export function getTeacherSchedule(
  data: SchoolScheduleData,
  teacherId: string,
): TeacherScheduleEntry[] {
  const classNames = new Map(
    data.classes.map((classSection) => [
      classSection.id,
      classSection.displayLabel || classSection.name,
    ]),
  );
  const teacher = data.teachers.find((entry) => entry.id === teacherId);

  return data.entries
    .filter((entry) => entry.type === "class" && entry.teacherId === teacherId)
    .map((entry) => ({
      ...entry,
      className: classNames.get(entry.classId) || "Unknown class",
      teacherName: teacher?.fullName || "Teacher",
      periodLabel: getClassPeriodForClass(data, entry.classId, entry.periodIndex)?.label
        || `Period ${entry.periodIndex + 1}`,
      startTime: getClassPeriodForClass(data, entry.classId, entry.periodIndex)?.startTime || "",
      endTime: getClassPeriodForClass(data, entry.classId, entry.periodIndex)?.endTime || "",
    }))
    .sort((left, right) => {
      const dayDelta = SCHEDULE_DAYS.indexOf(left.dayOfWeek) - SCHEDULE_DAYS.indexOf(right.dayOfWeek);
      return dayDelta || left.periodIndex - right.periodIndex;
    });
}

export function getClassPeriodOverride(
  data: Pick<SchoolScheduleData, "classPeriodOverrides">,
  classId: string,
  periodIndex: number,
) {
  return data.classPeriodOverrides.find(
    (override) => override.classId === classId && override.periodIndex === periodIndex,
  );
}

export function getClassPeriodForClass(
  data: Pick<SchoolScheduleData, "periods" | "classPeriodOverrides">,
  classId: string,
  periodIndex: number,
) {
  const period = data.periods[periodIndex];

  if (!period) {
    return null;
  }

  const override = getClassPeriodOverride(data, classId, periodIndex);

  return {
    ...period,
    startTime: override ? override.startTime : period.startTime,
    endTime: override ? override.endTime : period.endTime,
    hidden: override?.hidden ?? false,
  };
}

export function getVisibleClassPeriods(
  data: Pick<SchoolScheduleData, "periods" | "classPeriodOverrides">,
  classId: string,
) {
  return data.periods
    .map((_, periodIndex) => ({
      periodIndex,
      period: getClassPeriodForClass(data, classId, periodIndex),
    }))
    .filter(
      (
        item,
      ): item is {
        periodIndex: number;
        period: NonNullable<ReturnType<typeof getClassPeriodForClass>>;
      } => {
        if (!item.period) {
          return false;
        }

        return !item.period.hidden;
      },
    );
}
