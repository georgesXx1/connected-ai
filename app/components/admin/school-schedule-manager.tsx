"use client";

import { useMemo, useState } from "react";

import type {
  PublicTeacherAccount,
  ScheduleDay,
  ScheduleEntry,
  SchedulePeriod,
  SchoolClassSection,
  SchoolScheduleData,
  TeacherAccount,
} from "@/lib/school-schedule";

type ScheduleTab = "classes" | "teachers" | "periods" | "timetables";
type TeacherDraft = TeacherAccount & { password?: string };

type SchoolScheduleManagerProps = {
  initialSchedule: SchoolScheduleData;
};

const DAY_LABELS: Record<ScheduleDay, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
};
const SCHEDULE_DAYS: ScheduleDay[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
];
const DEFAULT_PERIODS = 8;
type Meridiem = "AM" | "PM";

function createClientId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function nowIso() {
  return new Date().toISOString();
}

function splitList(value: string) {
  return [...new Set(value.split(",").map((item) => item.trim()).filter(Boolean))];
}

function joinList(value: string[]) {
  return value.join(", ");
}

function classLabel(classSection: SchoolClassSection) {
  return classSection.displayLabel || classSection.name;
}

function publicTeacherName(teacher: PublicTeacherAccount | TeacherDraft | undefined) {
  return teacher?.fullName || "No teacher";
}

function splitTimeParts(value: string): { timeText: string; meridiem: Meridiem } {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2}):(\d{2})(?:\s*(AM|PM))?$/i);

  if (!match) {
    return {
      timeText: trimmed.replace(/\s*(AM|PM)$/i, ""),
      meridiem: /PM$/i.test(trimmed) ? "PM" : "AM",
    };
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const explicitMeridiem = match[3]?.toUpperCase() as Meridiem | undefined;

  if (explicitMeridiem) {
    return {
      timeText: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
      meridiem: explicitMeridiem,
    };
  }

  if (hour === 0) {
    return { timeText: `12:${String(minute).padStart(2, "0")}`, meridiem: "AM" };
  }

  if (hour === 12) {
    return { timeText: `12:${String(minute).padStart(2, "0")}`, meridiem: "PM" };
  }

  if (hour > 12 && hour <= 23) {
    return {
      timeText: `${String(hour - 12).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
      meridiem: "PM",
    };
  }

  return {
    timeText: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
    meridiem: "AM",
  };
}

function normalizeTime12(value: string) {
  const { timeText, meridiem } = splitTimeParts(value);

  if (!timeText.trim()) {
    return "";
  }

  const match = timeText.trim().match(/^(\d{1,2}):(\d{2})$/);

  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (hour < 1 || hour > 12 || minute < 0 || minute > 59) {
    return null;
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${meridiem}`;
}

function getInvalidTimeMessage(periods: Array<Pick<SchedulePeriod, "label" | "startTime" | "endTime">>) {
  const invalidPeriod = periods.find(
    (period) =>
      normalizeTime12(period.startTime) === null ||
      normalizeTime12(period.endTime) === null,
  );

  return invalidPeriod
    ? `${invalidPeriod.label || "This period"} has an invalid time. Use 12-hour format like 07:45 AM.`
    : "";
}

function findClientConflict(entries: ScheduleEntry[]) {
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

function PeriodTimeInput({
  value,
  onChange,
  onInvalid,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  onInvalid: () => void;
  className: string;
}) {
  const { timeText, meridiem } = splitTimeParts(value);

  function updateTime(nextTimeText: string, nextMeridiem = meridiem) {
    onChange(nextTimeText.trim() ? `${nextTimeText} ${nextMeridiem}` : "");
  }

  function normalizeOnBlur() {
    const normalized = normalizeTime12(`${timeText} ${meridiem}`);

    if (normalized === null) {
      onInvalid();
      return;
    }

    onChange(normalized);
  }

  return (
    <div className="schedule-time-input">
      <input
        type="text"
        inputMode="numeric"
        value={timeText}
        onChange={(event) => updateTime(event.target.value)}
        onBlur={normalizeOnBlur}
        placeholder="07:45"
        className={`${className} schedule-admin-control schedule-time-input-field`}
      />
      <select
        value={meridiem}
        onChange={(event) => updateTime(timeText, event.target.value as Meridiem)}
        className="schedule-time-input-meridiem h-11 rounded-2xl border border-white/10 bg-[#0f1319] px-3 text-sm text-white outline-none"
      >
        <option value="AM">AM</option>
        <option value="PM">PM</option>
      </select>
    </div>
  );
}

export default function SchoolScheduleManager({
  initialSchedule,
}: SchoolScheduleManagerProps) {
  const [activeTab, setActiveTab] = useState<ScheduleTab>("classes");
  const [classes, setClasses] = useState<SchoolClassSection[]>(
    initialSchedule.classes,
  );
  const [teachers, setTeachers] = useState<TeacherDraft[]>(
    initialSchedule.teachers.map((teacher) => ({ ...teacher, password: "" })),
  );
  const [periods, setPeriods] = useState<SchedulePeriod[]>(
    initialSchedule.periods,
  );
  const [entries, setEntries] = useState<ScheduleEntry[]>(initialSchedule.entries);
  const [selectedClassId, setSelectedClassId] = useState(
    initialSchedule.classes[0]?.id || "",
  );
  const [classForm, setClassForm] = useState({
    name: "",
    gradeLevel: "",
    displayLabel: "",
  });
  const [teacherForm, setTeacherForm] = useState({
    fullName: "",
    username: "",
    password: "",
    subjects: "",
    classIds: [] as string[],
  });
  const [periodForm, setPeriodForm] = useState({
    label: "",
    startTime: "",
    endTime: "",
    type: "class" as "class" | "recess",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const selectedClass = classes.find((entry) => entry.id === selectedClassId);
  const visiblePeriods = periods.length > 0
    ? periods
    : Array.from({ length: DEFAULT_PERIODS }, (_value, index) => ({
        id: `period-${index + 1}`,
        label: `Period ${index + 1}`,
        startTime: "",
        endTime: "",
        type: "class" as const,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      }));

  const teacherById = useMemo(
    () => new Map(teachers.map((teacher) => [teacher.id, teacher])),
    [teachers],
  );
  const classById = useMemo(
    () => new Map(classes.map((classSection) => [classSection.id, classSection])),
    [classes],
  );

  function clearMessages() {
    setSuccess("");
    setError("");
  }

  function addClassSection() {
    clearMessages();
    const name = classForm.name.trim();

    if (!name) {
      setError("Class name is required.");
      return;
    }

    const timestamp = nowIso();
    const nextClass: SchoolClassSection = {
      id: createClientId("class"),
      name,
      gradeLevel: classForm.gradeLevel.trim() || name,
      displayLabel: classForm.displayLabel.trim() || undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    setClasses((current) => [...current, nextClass]);
    setSelectedClassId(nextClass.id);
    setClassForm({ name: "", gradeLevel: "", displayLabel: "" });
  }

  function updateClassSection(
    classId: string,
    field: keyof Pick<SchoolClassSection, "name" | "gradeLevel" | "displayLabel">,
    value: string,
  ) {
    clearMessages();
    setClasses((current) =>
      current.map((classSection) =>
        classSection.id === classId
          ? {
              ...classSection,
              [field]: value,
              updatedAt: nowIso(),
            }
          : classSection,
      ),
    );
  }

  function deleteClassSection(classId: string) {
    clearMessages();
    setClasses((current) => current.filter((classSection) => classSection.id !== classId));
    setEntries((current) => current.filter((entry) => entry.classId !== classId));
    setTeachers((current) =>
      current.map((teacher) => ({
        ...teacher,
        classIds: teacher.classIds.filter((entry) => entry !== classId),
      })),
    );

    if (selectedClassId === classId) {
      setSelectedClassId(classes.find((classSection) => classSection.id !== classId)?.id || "");
    }
  }

  function addTeacher() {
    clearMessages();
    const fullName = teacherForm.fullName.trim();
    const username = teacherForm.username.trim().toLowerCase();
    const password = teacherForm.password;

    if (!fullName || !username || !password) {
      setError("Teacher name, username, and password are required.");
      return;
    }

    if (teachers.some((teacher) => teacher.username.toLowerCase() === username)) {
      setError("That teacher username is already in use.");
      return;
    }

    const timestamp = nowIso();
    const nextTeacher: TeacherDraft = {
      id: createClientId("teacher"),
      fullName,
      username,
      password,
      passwordHash: "",
      subjects: splitList(teacherForm.subjects),
      classIds: teacherForm.classIds,
      status: "active",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    setTeachers((current) => [...current, nextTeacher]);
    setTeacherForm({
      fullName: "",
      username: "",
      password: "",
      subjects: "",
      classIds: [],
    });
  }

  function updateTeacher(
    teacherId: string,
    field: keyof Pick<TeacherDraft, "fullName" | "username" | "password" | "status">,
    value: string,
  ) {
    clearMessages();
    setTeachers((current) =>
      current.map((teacher) =>
        teacher.id === teacherId
          ? {
              ...teacher,
              [field]: field === "username" ? value.trim().toLowerCase() : value,
              updatedAt: nowIso(),
            }
          : teacher,
      ),
    );
  }

  function updateTeacherList(
    teacherId: string,
    field: keyof Pick<TeacherDraft, "subjects" | "classIds">,
    value: string[] | string,
  ) {
    clearMessages();
    setTeachers((current) =>
      current.map((teacher) =>
        teacher.id === teacherId
          ? {
              ...teacher,
              [field]: Array.isArray(value) ? value : splitList(value),
              updatedAt: nowIso(),
            }
          : teacher,
      ),
    );
  }

  function deleteTeacher(teacherId: string) {
    clearMessages();
    setTeachers((current) => current.filter((teacher) => teacher.id !== teacherId));
    setEntries((current) =>
      current.map((entry) =>
        entry.teacherId === teacherId
          ? { ...entry, teacherId: undefined, updatedAt: nowIso() }
          : entry,
      ),
    );
  }

  function addPeriod() {
    clearMessages();
    const normalizedStartTime = normalizeTime12(periodForm.startTime);
    const normalizedEndTime = normalizeTime12(periodForm.endTime);

    if (normalizedStartTime === null || normalizedEndTime === null) {
      setError("Invalid time. Use 12-hour format like 07:45 AM.");
      return;
    }

    const timestamp = nowIso();
    const nextPeriod: SchedulePeriod = {
      id: createClientId("period"),
      label: periodForm.label.trim() || `Period ${periods.length + 1}`,
      startTime: normalizedStartTime,
      endTime: normalizedEndTime,
      type: periodForm.type,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    setPeriods((current) => [...current, nextPeriod]);
    setPeriodForm({
      label: "",
      startTime: "",
      endTime: "",
      type: "class",
    });
  }

  function updatePeriod(
    periodIndex: number,
    field: keyof Pick<SchedulePeriod, "label" | "startTime" | "endTime" | "type">,
    value: string,
  ) {
    clearMessages();
    setPeriods((current) =>
      current.map((period, index) =>
        index === periodIndex
          ? {
              ...period,
              [field]: value,
              updatedAt: nowIso(),
            }
          : period,
      ),
    );

    if (field === "type" && value === "recess") {
      setEntries((current) =>
        current.map((entry) =>
          entry.periodIndex === periodIndex
            ? {
                ...entry,
                type: "recess",
                subject: "Recess",
                teacherId: undefined,
                updatedAt: nowIso(),
              }
            : entry,
        ),
      );
    }
  }

  function deletePeriod(periodIndex: number) {
    clearMessages();
    setPeriods((current) => current.filter((_period, index) => index !== periodIndex));
    setEntries((current) =>
      current
        .filter((entry) => entry.periodIndex !== periodIndex)
        .map((entry) =>
          entry.periodIndex > periodIndex
            ? { ...entry, periodIndex: entry.periodIndex - 1, updatedAt: nowIso() }
            : entry,
        ),
    );
  }

  function getEntry(classId: string, dayOfWeek: ScheduleDay, periodIndex: number) {
    return entries.find(
      (entry) =>
        entry.classId === classId &&
        entry.dayOfWeek === dayOfWeek &&
        entry.periodIndex === periodIndex,
    );
  }

  function updateScheduleCell(
    classId: string,
    dayOfWeek: ScheduleDay,
    periodIndex: number,
    patch: Partial<ScheduleEntry>,
  ) {
    clearMessages();
    const existing = getEntry(classId, dayOfWeek, periodIndex);
    const timestamp = nowIso();
    const nextEntry: ScheduleEntry = {
      id: existing?.id || createClientId("entry"),
      classId,
      dayOfWeek,
      periodIndex,
      type:
        periods[periodIndex]?.type === "recess"
          ? "recess"
          : patch.type ?? existing?.type ?? "class",
      subject: patch.subject ?? existing?.subject ?? "",
      teacherId: patch.teacherId ?? existing?.teacherId,
      updatedAt: timestamp,
    };

    if (nextEntry.type === "recess" || periods[periodIndex]?.type === "recess") {
      nextEntry.subject = "Recess";
      nextEntry.teacherId = undefined;
    }

    const nextEntries = [
      ...entries.filter(
        (entry) =>
          !(
            entry.classId === classId &&
            entry.dayOfWeek === dayOfWeek &&
            entry.periodIndex === periodIndex
          ),
      ),
      nextEntry,
    ];
    const conflict = findClientConflict(nextEntries);

    if (conflict) {
      setError("This teacher is already assigned to another class during this time.");
      return;
    }

    setEntries(nextEntries);
  }

  function clearScheduleCell(
    classId: string,
    dayOfWeek: ScheduleDay,
    periodIndex: number,
  ) {
    clearMessages();
    setEntries((current) =>
      current.filter(
        (entry) =>
          !(
            entry.classId === classId &&
            entry.dayOfWeek === dayOfWeek &&
            entry.periodIndex === periodIndex
          ),
      ),
    );
  }

  async function saveSchedule() {
    clearMessages();
    const timeError = getInvalidTimeMessage(periods);

    if (timeError) {
      setError(timeError);
      return;
    }

    const conflict = findClientConflict(entries);

    if (conflict) {
      setError("This teacher is already assigned to another class during this time.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/admin/school-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schedule: {
            classes,
            teachers,
            periods,
            entries,
            updatedAt: nowIso(),
          },
        }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok || !payload?.schedule) {
        throw new Error(payload?.error || "Could not save the school schedule.");
      }

      setClasses(payload.schedule.classes);
      setTeachers(
        payload.schedule.teachers.map((teacher: TeacherAccount) => ({
          ...teacher,
          password: "",
        })),
      );
      setPeriods(payload.schedule.periods);
      setEntries(payload.schedule.entries);
      setSuccess("School schedule saved successfully.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Could not save the school schedule.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="schedule-admin space-y-7">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-[30px] border border-white/10 bg-white/[0.04] p-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
            School Schedule
          </p>
          <p className="mt-2 text-sm leading-7 text-zinc-400">
            Manage class sections, teacher accounts, and weekly timetables.
          </p>
        </div>
        <button
          type="button"
          onClick={saveSchedule}
          disabled={isSaving}
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-cyan-400 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:opacity-60"
        >
          {isSaving ? "Saving..." : "Save schedule system"}
        </button>
      </div>

      <div className="flex flex-wrap gap-2 rounded-[26px] border border-white/10 bg-white/[0.04] p-2">
        {(["classes", "teachers", "periods", "timetables"] as ScheduleTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              clearMessages();
              setActiveTab(tab);
            }}
            className={`h-11 rounded-2xl px-4 text-sm font-semibold capitalize transition ${
              activeTab === tab
                ? "bg-cyan-400 text-slate-950"
                : "text-zinc-300 hover:bg-white/[0.06] hover:text-white"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {success ? (
        <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">
          {success}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
          {error}
        </div>
      ) : null}

      {activeTab === "classes" ? (
        <div className="schedule-admin-split schedule-admin-split--classes">
          <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
              New class section
            </p>
            <div className="mt-6 space-y-4">
              <input
                value={classForm.name}
                onChange={(event) =>
                  setClassForm((current) => ({ ...current, name: event.target.value }))
                }
                placeholder="KG1A, Grade 4B..."
                className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-cyan-400/35"
              />
              <input
                value={classForm.gradeLevel}
                onChange={(event) =>
                  setClassForm((current) => ({
                    ...current,
                    gradeLevel: event.target.value,
                  }))
                }
                placeholder="Grade level"
                className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-cyan-400/35"
              />
              <input
                value={classForm.displayLabel}
                onChange={(event) =>
                  setClassForm((current) => ({
                    ...current,
                    displayLabel: event.target.value,
                  }))
                }
                placeholder="Optional display label"
                className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-cyan-400/35"
              />
              <button
                type="button"
                onClick={addClassSection}
                className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-cyan-400 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Add class
              </button>
            </div>
          </div>

          <div className="schedule-admin-list grid gap-4 md:grid-cols-2">
            {classes.length === 0 ? (
              <div className="rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm text-zinc-400">
                No class sections yet.
              </div>
            ) : (
              classes.map((classSection) => (
                <div
                  key={classSection.id}
                  className="schedule-admin-card rounded-[26px] border border-white/10 bg-black/20 p-5"
                >
                  <div className="space-y-3">
                    <input
                      value={classSection.name}
                      onChange={(event) =>
                        updateClassSection(classSection.id, "name", event.target.value)
                      }
                      className="schedule-admin-control h-11 rounded-2xl border border-white/10 bg-[#0f1319] px-4 text-sm font-semibold text-white outline-none"
                    />
                    <input
                      value={classSection.gradeLevel}
                      onChange={(event) =>
                        updateClassSection(
                          classSection.id,
                          "gradeLevel",
                          event.target.value,
                        )
                      }
                      className="schedule-admin-control h-11 rounded-2xl border border-white/10 bg-[#0f1319] px-4 text-sm text-zinc-200 outline-none"
                    />
                    <input
                      value={classSection.displayLabel || ""}
                      onChange={(event) =>
                        updateClassSection(
                          classSection.id,
                          "displayLabel",
                          event.target.value,
                        )
                      }
                      placeholder="Display label"
                      className="schedule-admin-control h-11 rounded-2xl border border-white/10 bg-[#0f1319] px-4 text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteClassSection(classSection.id)}
                    className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-sm text-rose-100 transition hover:bg-rose-400/15"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}

      {activeTab === "teachers" ? (
        <div className="schedule-admin-split schedule-admin-split--teachers">
          <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
              New teacher account
            </p>
            <div className="mt-6 space-y-4">
              <input
                value={teacherForm.fullName}
                onChange={(event) =>
                  setTeacherForm((current) => ({
                    ...current,
                    fullName: event.target.value,
                  }))
                }
                placeholder="Full name"
                className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-zinc-500"
              />
              <input
                value={teacherForm.username}
                onChange={(event) =>
                  setTeacherForm((current) => ({
                    ...current,
                    username: event.target.value,
                  }))
                }
                placeholder="Username"
                className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-zinc-500"
              />
              <input
                type="password"
                value={teacherForm.password}
                onChange={(event) =>
                  setTeacherForm((current) => ({
                    ...current,
                    password: event.target.value,
                  }))
                }
                placeholder="Password"
                className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-zinc-500"
              />
              <input
                value={teacherForm.subjects}
                onChange={(event) =>
                  setTeacherForm((current) => ({
                    ...current,
                    subjects: event.target.value,
                  }))
                }
                placeholder="Subjects, comma separated"
                className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-zinc-500"
              />
              <div className="flex flex-wrap gap-2">
                {classes.map((classSection) => (
                  <button
                    key={classSection.id}
                    type="button"
                    onClick={() =>
                      setTeacherForm((current) => ({
                        ...current,
                        classIds: current.classIds.includes(classSection.id)
                          ? current.classIds.filter((id) => id !== classSection.id)
                          : [...current.classIds, classSection.id],
                      }))
                    }
                    className={`rounded-full border px-3 py-1.5 text-xs transition ${
                      teacherForm.classIds.includes(classSection.id)
                        ? "border-cyan-400/25 bg-cyan-400/10 text-white"
                        : "border-white/10 bg-black/20 text-zinc-300"
                    }`}
                  >
                    {classLabel(classSection)}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={addTeacher}
                className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-cyan-400 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Add teacher
              </button>
            </div>
          </div>

          <div className="schedule-admin-list space-y-4">
            {teachers.length === 0 ? (
              <div className="rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm text-zinc-400">
                No teacher accounts yet.
              </div>
            ) : (
              teachers.map((teacher) => (
                <div
                  key={teacher.id}
                  className="schedule-admin-card rounded-[26px] border border-white/10 bg-black/20 p-5"
                >
                  <div className="schedule-admin-edit-grid schedule-admin-edit-grid--two">
                    <input
                      value={teacher.fullName}
                      onChange={(event) =>
                        updateTeacher(teacher.id, "fullName", event.target.value)
                      }
                      className="schedule-admin-control h-11 rounded-2xl border border-white/10 bg-[#0f1319] px-4 text-sm font-semibold text-white outline-none"
                    />
                    <input
                      value={teacher.username}
                      onChange={(event) =>
                        updateTeacher(teacher.id, "username", event.target.value)
                      }
                      className="schedule-admin-control h-11 rounded-2xl border border-white/10 bg-[#0f1319] px-4 text-sm text-white outline-none"
                    />
                    <input
                      type="password"
                      value={teacher.password || ""}
                      onChange={(event) =>
                        updateTeacher(teacher.id, "password", event.target.value)
                      }
                      placeholder="New password (leave blank to keep)"
                      className="schedule-admin-control h-11 rounded-2xl border border-white/10 bg-[#0f1319] px-4 text-sm text-white outline-none placeholder:text-zinc-600"
                    />
                    <select
                      value={teacher.status}
                      onChange={(event) =>
                        updateTeacher(teacher.id, "status", event.target.value)
                      }
                      className="schedule-admin-control h-11 rounded-2xl border border-white/10 bg-[#0f1319] px-4 text-sm text-white outline-none"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                  <input
                    value={joinList(teacher.subjects)}
                    onChange={(event) =>
                      updateTeacherList(teacher.id, "subjects", event.target.value)
                    }
                    placeholder="Subjects"
                    className="mt-4 h-11 w-full rounded-2xl border border-white/10 bg-[#0f1319] px-4 text-sm text-zinc-200 outline-none placeholder:text-zinc-600"
                  />
                  <div className="mt-4 flex flex-wrap gap-2">
                    {classes.map((classSection) => (
                      <button
                        key={classSection.id}
                        type="button"
                        onClick={() =>
                          updateTeacherList(
                            teacher.id,
                            "classIds",
                            teacher.classIds.includes(classSection.id)
                              ? teacher.classIds.filter((id) => id !== classSection.id)
                              : [...teacher.classIds, classSection.id],
                          )
                        }
                        className={`rounded-full border px-3 py-1.5 text-xs transition ${
                          teacher.classIds.includes(classSection.id)
                            ? "border-cyan-400/25 bg-cyan-400/10 text-white"
                            : "border-white/10 bg-black/20 text-zinc-300"
                        }`}
                      >
                        {classLabel(classSection)}
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteTeacher(teacher.id)}
                    className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-sm text-rose-100 transition hover:bg-rose-400/15"
                  >
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}

      {activeTab === "periods" ? (
        <div className="schedule-admin-split schedule-admin-split--periods">
          <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
              New period
            </p>
            <div className="mt-6 space-y-4">
              <input
                value={periodForm.label}
                onChange={(event) =>
                  setPeriodForm((current) => ({
                    ...current,
                    label: event.target.value,
                  }))
                }
                placeholder="Period 1, Recess 1..."
                className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none placeholder:text-zinc-500"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <PeriodTimeInput
                  value={periodForm.startTime}
                  onChange={(value) =>
                    setPeriodForm((current) => ({
                      ...current,
                      startTime: value,
                    }))
                  }
                  onInvalid={() =>
                    setError("Invalid start time. Use 12-hour format like 07:45 AM.")
                  }
                  className="h-12 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none"
                />
                <PeriodTimeInput
                  value={periodForm.endTime}
                  onChange={(value) =>
                    setPeriodForm((current) => ({
                      ...current,
                      endTime: value,
                    }))
                  }
                  onInvalid={() =>
                    setError("Invalid end time. Use 12-hour format like 08:35 AM.")
                  }
                  className="h-12 rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none"
                />
              </div>
              <select
                value={periodForm.type}
                onChange={(event) =>
                  setPeriodForm((current) => ({
                    ...current,
                    type: event.target.value as "class" | "recess",
                  }))
                }
                className="h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none"
              >
                <option value="class">Class period</option>
                <option value="recess">Recess</option>
              </select>
              <button
                type="button"
                onClick={addPeriod}
                className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-cyan-400 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Add period
              </button>
            </div>
          </div>

          <div className="schedule-admin-list space-y-4">
            {visiblePeriods.map((period, index) => (
              <div
                key={period.id}
                className="schedule-admin-card rounded-[26px] border border-white/10 bg-black/20 p-5"
              >
                <div className="schedule-admin-edit-grid schedule-admin-edit-grid--period">
                  <input
                    value={period.label}
                    onChange={(event) =>
                      updatePeriod(index, "label", event.target.value)
                    }
                    className="schedule-admin-control h-11 rounded-2xl border border-white/10 bg-[#0f1319] px-4 text-center text-sm font-semibold text-white outline-none"
                  />
                  <PeriodTimeInput
                    value={period.startTime}
                    onChange={(value) =>
                      updatePeriod(index, "startTime", value)
                    }
                    onInvalid={() =>
                      setError(`${period.label || "This period"} has an invalid start time. Use 12-hour format like 07:45 AM.`)
                    }
                    className="h-11 rounded-2xl border border-white/10 bg-[#0f1319] px-4 text-center text-sm text-white outline-none"
                  />
                  <PeriodTimeInput
                    value={period.endTime}
                    onChange={(value) =>
                      updatePeriod(index, "endTime", value)
                    }
                    onInvalid={() =>
                      setError(`${period.label || "This period"} has an invalid end time. Use 12-hour format like 08:35 AM.`)
                    }
                    className="h-11 rounded-2xl border border-white/10 bg-[#0f1319] px-4 text-center text-sm text-white outline-none"
                  />
                  <select
                    value={period.type}
                    onChange={(event) =>
                      updatePeriod(index, "type", event.target.value)
                    }
                    className="schedule-admin-control h-11 rounded-2xl border border-white/10 bg-[#0f1319] px-4 text-center text-sm text-white outline-none"
                  >
                    <option value="class">Class</option>
                    <option value="recess">Recess</option>
                  </select>
                  <div className="schedule-admin-delete-row">
                    <button
                      type="button"
                      onClick={() => deletePeriod(index)}
                      className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-sm text-rose-100 transition hover:bg-rose-400/15"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {activeTab === "timetables" ? (
        <div className="space-y-6">
          <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-6">
            <label className="block max-w-sm">
              <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
                Class timetable
              </span>
              <select
                value={selectedClassId}
                onChange={(event) => setSelectedClassId(event.target.value)}
                className="mt-4 h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm text-white outline-none"
              >
                <option value="">Choose a class</option>
                {classes.map((classSection) => (
                  <option key={classSection.id} value={classSection.id}>
                    {classLabel(classSection)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selectedClass ? (
            <div className="overflow-x-auto rounded-[30px] border border-white/10 bg-black/20">
              <table className="min-w-[1100px] w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="w-28 px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300/80">
                      Period
                    </th>
                    {SCHEDULE_DAYS.map((day) => (
                      <th
                        key={day}
                        className="px-4 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300/80"
                      >
                        {DAY_LABELS[day]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visiblePeriods.map((period, periodIndex) => (
                    <tr key={period.id} className="border-b border-white/10 last:border-b-0">
                      <td className="px-4 py-4 align-top text-sm font-semibold text-white">
                        <div>{period.label}</div>
                        <div className="mt-1 text-xs font-normal text-zinc-500">
                          {period.startTime && period.endTime
                            ? `${period.startTime} - ${period.endTime}`
                            : "Time not set"}
                        </div>
                      </td>
                      {SCHEDULE_DAYS.map((day) => {
                        const entry = getEntry(selectedClass.id, day, periodIndex);
                        const isRecess = period.type === "recess" || entry?.type === "recess";

                        return (
                          <td key={day} className="min-w-[190px] px-3 py-4 align-top">
                            <div className="space-y-3 rounded-[20px] border border-white/10 bg-[#0f1319] p-3">
                              <label className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                                <input
                                  type="checkbox"
                                  checked={isRecess}
                                  disabled={period.type === "recess"}
                                  onChange={(event) =>
                                    updateScheduleCell(
                                      selectedClass.id,
                                      day,
                                      periodIndex,
                                      {
                                        type: event.target.checked ? "recess" : "class",
                                        subject: event.target.checked ? "Recess" : "",
                                        teacherId: undefined,
                                      },
                                    )
                                  }
                                  className="h-4 w-4 accent-cyan-400"
                                />
                                Recess
                              </label>
                              <input
                                value={isRecess ? "Recess" : entry?.subject || ""}
                                onChange={(event) =>
                                  updateScheduleCell(
                                    selectedClass.id,
                                    day,
                                    periodIndex,
                                    {
                                      type: "class",
                                      subject: event.target.value,
                                    },
                                  )
                                }
                                disabled={isRecess}
                                placeholder="Subject"
                                className="h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none placeholder:text-zinc-600 disabled:opacity-60"
                              />
                              <select
                                value={entry?.teacherId || ""}
                                onChange={(event) =>
                                  updateScheduleCell(
                                    selectedClass.id,
                                    day,
                                    periodIndex,
                                    {
                                      type: "class",
                                      teacherId: event.target.value || undefined,
                                    },
                                  )
                                }
                                disabled={isRecess}
                                className="h-10 w-full rounded-xl border border-white/10 bg-black/20 px-3 text-sm text-white outline-none disabled:opacity-60"
                              >
                                <option value="">Teacher</option>
                                {teachers
                                  .filter((teacher) => teacher.status === "active")
                                  .map((teacher) => (
                                    <option key={teacher.id} value={teacher.id}>
                                      {teacher.fullName}
                                    </option>
                                  ))}
                              </select>
                              {entry ? (
                                <div className="text-xs leading-5 text-zinc-400">
                                  {isRecess ? (
                                    <span>
                                      Recess
                                      {period.startTime && period.endTime
                                        ? ` - ${period.startTime} to ${period.endTime}`
                                        : ""}
                                    </span>
                                  ) : (
                                    <span>
                                      {entry.subject || "Subject"} -{" "}
                                      {publicTeacherName(teacherById.get(entry.teacherId || ""))}
                                    </span>
                                  )}
                                </div>
                              ) : null}
                              {entry ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    clearScheduleCell(selectedClass.id, day, periodIndex)
                                  }
                                  className="text-xs font-semibold text-rose-200 hover:text-rose-100"
                                >
                                  Clear
                                </button>
                              ) : null}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-[24px] border border-white/10 bg-black/20 p-5 text-sm text-zinc-400">
              Create or choose a class section to start building its timetable.
            </div>
          )}

          <div className="rounded-[26px] border border-white/10 bg-white/[0.04] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-cyan-300/80">
              Current assignments
            </p>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {entries
                .filter((entry) => entry.type === "class" && entry.teacherId)
                .map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-[18px] border border-white/10 bg-black/20 p-4 text-sm text-zinc-300"
                  >
                    <p className="font-semibold text-white">
                      {entry.subject || "Subject"} -{" "}
                      {publicTeacherName(teacherById.get(entry.teacherId || ""))}
                    </p>
                    <p className="mt-2 text-xs text-zinc-500">
                      {classById.get(entry.classId)
                        ? classLabel(classById.get(entry.classId) as SchoolClassSection)
                        : "Unknown class"} /{" "}
                      {DAY_LABELS[entry.dayOfWeek]} /{" "}
                      {periods[entry.periodIndex]?.label || `Period ${entry.periodIndex + 1}`}
                      {periods[entry.periodIndex]?.startTime && periods[entry.periodIndex]?.endTime
                        ? ` (${periods[entry.periodIndex].startTime} - ${periods[entry.periodIndex].endTime})`
                        : ""}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
