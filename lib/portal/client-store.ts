"use client";

import { useEffect, useState } from "react";

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
  SchoolClass,
  ScheduleConfig,
  SessionReport,
  StudentProfile,
  Subject,
  TeacherProfile,
  UploadedExcelImport,
} from "./types";

export const PORTAL_STORAGE_KEY = "school-portal-data-v2";
const EVENT_NAME = "school-portal-data-updated";

export type PortalMutableData = {
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

const arrayTargets = {
  users,
  students,
  parents,
  psychologists,
  teachers,
  classes,
  subjects,
  schedules,
  attendance,
  sessionReports,
  agendaItems,
  evaluations,
  messages,
  announcements,
  libraryFiles,
  excelImports,
  psychologistCases,
};

function cloneArray<T>(items: T[]) {
  return items.map((item) => ({ ...item }));
}

export function snapshotPortalData(): PortalMutableData {
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

function sortPortalData(data: PortalMutableData) {
  const byDateDesc = <T extends Record<string, unknown>>(field: keyof T) => {
    return (a: T, b: T) =>
      String(b[field] ?? "").localeCompare(String(a[field] ?? ""));
  };

  data.announcements.sort(byDateDesc<Announcement>("date"));
  data.agendaItems.sort(byDateDesc<AgendaItem>("dueDate"));
  data.attendance.sort(byDateDesc<Attendance>("date"));
  data.evaluations.sort(byDateDesc<Evaluation>("date"));
  data.libraryFiles.sort(byDateDesc<LibraryFile>("uploadedAt"));
  data.messages.sort(byDateDesc<Message>("sentAt"));
  data.sessionReports.sort(byDateDesc<SessionReport>("date"));
  data.excelImports.sort(byDateDesc<UploadedExcelImport>("uploadedAt"));
}

export function applyPortalData(nextData: PortalMutableData) {
  sortPortalData(nextData);

  (Object.keys(arrayTargets) as Array<keyof typeof arrayTargets>).forEach((key) => {
    const target = arrayTargets[key] as unknown[];
    target.splice(0, target.length, ...(nextData[key] as unknown[]));
  });

  scheduleConfig.days.splice(0, scheduleConfig.days.length, ...((nextData.scheduleConfig?.days?.length ? nextData.scheduleConfig.days : scheduleConfig.days) as string[]));
  scheduleConfig.periods.splice(
    0,
    scheduleConfig.periods.length,
    ...((nextData.scheduleConfig?.periods?.length ? nextData.scheduleConfig.periods : scheduleConfig.periods) as ScheduleConfig["periods"]),
  );
}

export function savePortalData(nextData = snapshotPortalData()) {
  if (typeof window === "undefined") {
    return;
  }

  sortPortalData(nextData);
  window.localStorage.setItem(PORTAL_STORAGE_KEY, JSON.stringify(nextData));
  void fetch("/api/portal/data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nextData),
    keepalive: true,
  }).catch(() => undefined);
}

function readPortalData() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(PORTAL_STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as PortalMutableData;
  } catch {
    return null;
  }
}

function mergeById<T extends { id: string }>(serverItems: T[], localItems: T[]) {
  const merged = new Map<string, T>();
  serverItems.forEach((item) => merged.set(item.id, item));
  localItems.forEach((item) => merged.set(item.id, item));
  return Array.from(merged.values());
}

function mergePortalData(serverData: PortalMutableData, localData: PortalMutableData | null): PortalMutableData {
  if (!localData) {
    return serverData;
  }

  return {
    ...serverData,
    ...localData,
    users: mergeById(serverData.users, localData.users),
    students: mergeById(serverData.students, localData.students),
    parents: mergeById(serverData.parents, localData.parents),
    psychologists: mergeById(serverData.psychologists, localData.psychologists),
    teachers: mergeById(serverData.teachers, localData.teachers),
    classes: mergeById(serverData.classes, localData.classes),
    subjects: mergeById(serverData.subjects, localData.subjects),
    schedules: mergeById(serverData.schedules, localData.schedules),
    attendance: mergeById(serverData.attendance, localData.attendance),
    sessionReports: mergeById(serverData.sessionReports, localData.sessionReports),
    agendaItems: mergeById(serverData.agendaItems, localData.agendaItems),
    evaluations: mergeById(serverData.evaluations, localData.evaluations),
    messages: mergeById(serverData.messages, localData.messages),
    announcements: mergeById(serverData.announcements, localData.announcements),
    libraryFiles: mergeById(serverData.libraryFiles, localData.libraryFiles),
    excelImports: mergeById(serverData.excelImports, localData.excelImports),
    psychologistCases: mergeById(serverData.psychologistCases, localData.psychologistCases),
    scheduleConfig: localData.scheduleConfig ?? serverData.scheduleConfig,
  };
}

export function updatePortalData(mutator: (data: PortalMutableData) => void) {
  const nextData = snapshotPortalData();
  mutator(nextData);
  applyPortalData(nextData);
  savePortalData(nextData);
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function usePortalDataSync() {
  const [, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        const response = await fetch("/api/portal/data", { cache: "no-store" });
        const serverData = response.ok ? await response.json() as PortalMutableData : null;
        const stored = readPortalData();

        if (serverData && !cancelled) {
          const mergedData = mergePortalData(serverData, stored);
          applyPortalData(mergedData);
          window.localStorage.setItem(PORTAL_STORAGE_KEY, JSON.stringify(mergedData));
          setVersion((version) => version + 1);
          return;
        }
      } catch {
      }

      const stored = readPortalData();

      if (stored) {
        applyPortalData(stored);
      } else {
        savePortalData();
      }

      if (!cancelled) {
        setVersion((version) => version + 1);
      }
    }

    void hydrate();

    function handleUpdate() {
      const latest = readPortalData();

      if (latest) {
        applyPortalData(latest);
      }

      setVersion((version) => version + 1);
    }

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      cancelled = true;
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);
}

export function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export function readableNow() {
  return new Date().toISOString().slice(0, 16).replace("T", " ");
}
