import { promises as fs } from "fs";
import path from "path";

import {
  agendaItems,
  announcements,
  attendance,
  classes,
  evaluations,
  excelImports,
  libraryFiles,
  messages,
  parents,
  psychologistCases,
  psychologists,
  schedules,
  scheduleConfig,
  sessionReports,
  students,
  subjects,
  teachers,
  users,
} from "./mock-data";
import type {
  AgendaItem,
  Announcement,
  Attendance,
  Evaluation,
  LibraryFile,
  Message,
  ParentProfile,
  PortalUser,
  PsychologistCase,
  PsychologistProfile,
  Schedule,
  ScheduleConfig,
  SchoolClass,
  SessionReport,
  StudentProfile,
  Subject,
  TeacherProfile,
  UploadedExcelImport,
} from "./types";

export type ServerPortalData = {
  users: PortalUser[];
  students: StudentProfile[];
  parents: ParentProfile[];
  psychologists: PsychologistProfile[];
  teachers: TeacherProfile[];
  classes: SchoolClass[];
  subjects: Subject[];
  schedules: Schedule[];
  scheduleConfig: ScheduleConfig;
  attendance: Attendance[];
  sessionReports: SessionReport[];
  agendaItems: AgendaItem[];
  evaluations: Evaluation[];
  messages: Message[];
  announcements: Announcement[];
  libraryFiles: LibraryFile[];
  excelImports: UploadedExcelImport[];
  psychologistCases: PsychologistCase[];
};

const portalDataPath = path.join(process.cwd(), "data", "portal-data.json");

function cloneArray<T>(items: T[]) {
  return items.map((item) => ({ ...item }));
}

export function defaultPortalData(): ServerPortalData {
  return {
    users: cloneArray(users),
    students: cloneArray(students),
    parents: cloneArray(parents),
    psychologists: cloneArray(psychologists),
    teachers: cloneArray(teachers),
    classes: cloneArray(classes),
    subjects: cloneArray(subjects),
    schedules: cloneArray(schedules),
    scheduleConfig: {
      days: [...scheduleConfig.days],
      periods: scheduleConfig.periods.map((period) => ({ ...period })),
    },
    attendance: attendance.map((item) => ({
      ...item,
      records: item.records.map((record) => ({ ...record })),
    })),
    sessionReports: sessionReports.map((item) => ({
      ...item,
      individualRemarks: item.individualRemarks.map((remark) => ({ ...remark })),
    })),
    agendaItems: agendaItems.map((item) => ({
      ...item,
      attachmentTitles: [...item.attachmentTitles],
    })),
    evaluations: cloneArray(evaluations),
    messages: cloneArray(messages),
    announcements: announcements.map((item) => ({
      ...item,
      classIds: item.classIds ? [...item.classIds] : undefined,
      attachmentTitles: [...item.attachmentTitles],
    })),
    libraryFiles: cloneArray(libraryFiles),
    excelImports: excelImports.map((item) => ({
      ...item,
      notes: [...item.notes],
    })),
    psychologistCases: cloneArray(psychologistCases),
  };
}

export function applyPortalDataToMemory(data: ServerPortalData) {
  users.splice(0, users.length, ...data.users);
  students.splice(0, students.length, ...data.students);
  parents.splice(0, parents.length, ...data.parents);
  psychologists.splice(0, psychologists.length, ...data.psychologists);
  teachers.splice(0, teachers.length, ...data.teachers);
  classes.splice(0, classes.length, ...data.classes);
  subjects.splice(0, subjects.length, ...data.subjects);
  schedules.splice(0, schedules.length, ...data.schedules);
  attendance.splice(0, attendance.length, ...data.attendance);
  sessionReports.splice(0, sessionReports.length, ...data.sessionReports);
  agendaItems.splice(0, agendaItems.length, ...data.agendaItems);
  evaluations.splice(0, evaluations.length, ...data.evaluations);
  messages.splice(0, messages.length, ...data.messages);
  announcements.splice(0, announcements.length, ...data.announcements);
  libraryFiles.splice(0, libraryFiles.length, ...data.libraryFiles);
  excelImports.splice(0, excelImports.length, ...data.excelImports);
  psychologistCases.splice(0, psychologistCases.length, ...data.psychologistCases);
  scheduleConfig.days.splice(0, scheduleConfig.days.length, ...data.scheduleConfig.days);
  scheduleConfig.periods.splice(0, scheduleConfig.periods.length, ...data.scheduleConfig.periods);
}

function splitDisplayName(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "New",
    lastName: parts.slice(1).join(" ") || "User",
  };
}

export function ensureProfileForUser(data: ServerPortalData, user: PortalUser) {
  const name = splitDisplayName(user.displayName);

  if (user.role === "teacher" && !data.teachers.some((teacher) => teacher.userId === user.id)) {
    data.teachers.push({
      id: `teacher-${Date.now()}`,
      userId: user.id,
      firstName: name.firstName,
      lastName: name.lastName,
      subjects: data.subjects[0]?.id ? [data.subjects[0].id] : [],
      classIds: [],
    });
  }

  if (user.role === "student" && !data.students.some((student) => student.userId === user.id)) {
    data.students.push({
      id: `student-${Date.now()}`,
      userId: user.id,
      firstName: name.firstName,
      lastName: name.lastName,
      classId: data.classes[0]?.id || "g1",
      parentIds: [],
      dateOfBirth: new Date().toISOString().slice(0, 10),
      entranceExamStatus: "pending",
    });
  }

  if (user.role === "parent" && !data.parents.some((parent) => parent.userId === user.id)) {
    data.parents.push({
      id: `parent-${Date.now()}`,
      userId: user.id,
      firstName: name.firstName,
      lastName: name.lastName,
      phone: "",
      studentIds: [],
    });
  }

  if (user.role === "psychologist" && !data.psychologists.some((psychologist) => psychologist.userId === user.id)) {
    data.psychologists.push({
      id: `psychologist-${Date.now()}`,
      userId: user.id,
      assignedStudentIds: [],
      parentContactEnabled: false,
    });
  }
}

function mergeById<T extends { id: string }>(serverItems: T[], incomingItems: T[]) {
  const merged = new Map<string, T>();
  serverItems.forEach((item) => merged.set(item.id, item));
  incomingItems.forEach((item) => merged.set(item.id, item));
  return Array.from(merged.values());
}

export function mergeServerPortalData(
  serverData: ServerPortalData,
  incomingData: ServerPortalData,
): ServerPortalData {
  const merged: ServerPortalData = {
    ...serverData,
    ...incomingData,
    users: mergeById(serverData.users, incomingData.users ?? []),
    students: mergeById(serverData.students, incomingData.students ?? []),
    parents: mergeById(serverData.parents, incomingData.parents ?? []),
    psychologists: mergeById(serverData.psychologists, incomingData.psychologists ?? []),
    teachers: mergeById(serverData.teachers, incomingData.teachers ?? []),
    classes: mergeById(serverData.classes, incomingData.classes ?? []),
    subjects: mergeById(serverData.subjects, incomingData.subjects ?? []),
    schedules: mergeById(serverData.schedules, incomingData.schedules ?? []),
    attendance: mergeById(serverData.attendance, incomingData.attendance ?? []),
    sessionReports: mergeById(serverData.sessionReports, incomingData.sessionReports ?? []),
    agendaItems: mergeById(serverData.agendaItems, incomingData.agendaItems ?? []),
    evaluations: mergeById(serverData.evaluations, incomingData.evaluations ?? []),
    messages: mergeById(serverData.messages, incomingData.messages ?? []),
    announcements: mergeById(serverData.announcements, incomingData.announcements ?? []),
    libraryFiles: mergeById(serverData.libraryFiles, incomingData.libraryFiles ?? []),
    excelImports: mergeById(serverData.excelImports, incomingData.excelImports ?? []),
    psychologistCases: mergeById(serverData.psychologistCases, incomingData.psychologistCases ?? []),
    scheduleConfig: {
      ...serverData.scheduleConfig,
      ...(incomingData.scheduleConfig ?? {}),
      days: incomingData.scheduleConfig?.days?.length
        ? incomingData.scheduleConfig.days
        : serverData.scheduleConfig.days,
      periods: incomingData.scheduleConfig?.periods?.length
        ? incomingData.scheduleConfig.periods
        : serverData.scheduleConfig.periods,
    },
  };

  merged.users.forEach((user) => ensureProfileForUser(merged, user));
  return merged;
}

export async function readServerPortalData() {
  try {
    const raw = await fs.readFile(portalDataPath, "utf8");
    const data = JSON.parse(raw) as ServerPortalData;
    const merged = { ...defaultPortalData(), ...data };
    applyPortalDataToMemory(merged);
    return merged;
  } catch {
    const data = defaultPortalData();
    await writeServerPortalData(data);
    return data;
  }
}

export async function writeServerPortalData(data: ServerPortalData) {
  const merged = {
    ...defaultPortalData(),
    ...data,
    scheduleConfig: {
      ...defaultPortalData().scheduleConfig,
      ...(data.scheduleConfig ?? {}),
      days: data.scheduleConfig?.days?.length ? data.scheduleConfig.days : defaultPortalData().scheduleConfig.days,
      periods: data.scheduleConfig?.periods?.length ? data.scheduleConfig.periods : defaultPortalData().scheduleConfig.periods,
    },
  };
  merged.users.forEach((user) => ensureProfileForUser(merged, user));
  await fs.mkdir(path.dirname(portalDataPath), { recursive: true });
  await fs.writeFile(portalDataPath, JSON.stringify(merged, null, 2));
  applyPortalDataToMemory(merged);
}
