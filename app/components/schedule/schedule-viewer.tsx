"use client";

import { useMemo, useState } from "react";

import type {
  ClassPeriodOverride,
  ScheduleDay,
  SchedulePeriod,
  SchoolScheduleData,
} from "@/lib/school-schedule";

type ScheduleViewerProps = {
  schedule: SchoolScheduleData;
  language: Language;
};

type Language = "en" | "fr" | "ar";

const SCHEDULE_DAYS: ScheduleDay[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
];

const DAY_LABELS: Record<ScheduleDay, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
};

const TRANSLATIONS: Record<
  Language,
  {
    chooseClass: string;
    noClasses: string;
    weeklyTimetable: string;
    time: string;
    timeNotSet: string;
    recess: string;
    subject: string;
    teacherNotAssigned: string;
    empty: string;
    noSchedules: string;
    days: Record<ScheduleDay, string>;
  }
> = {
  en: {
    chooseClass: "Choose class",
    noClasses: "No classes available",
    weeklyTimetable: "Weekly timetable",
    time: "Time",
    timeNotSet: "Time not set",
    recess: "Recess",
    subject: "Subject",
    teacherNotAssigned: "Teacher not assigned",
    empty: "Empty",
    noSchedules: "No class schedules have been published yet.",
    days: DAY_LABELS,
  },
  fr: {
    chooseClass: "Choisir une classe",
    noClasses: "Aucune classe disponible",
    weeklyTimetable: "Emploi du temps hebdomadaire",
    time: "Horaire",
    timeNotSet: "Horaire non defini",
    recess: "Recreation",
    subject: "Matiere",
    teacherNotAssigned: "Aucun enseignant attribue",
    empty: "Vide",
    noSchedules: "Aucun emploi du temps n'a encore ete publie.",
    days: {
      monday: "Lundi",
      tuesday: "Mardi",
      wednesday: "Mercredi",
      thursday: "Jeudi",
      friday: "Vendredi",
    },
  },
  ar: {
    chooseClass: "اختر الصف",
    noClasses: "لا توجد صفوف متاحة",
    weeklyTimetable: "الجدول الأسبوعي",
    time: "الوقت",
    timeNotSet: "لم يتم تحديد الوقت",
    recess: "استراحة",
    subject: "المادة",
    teacherNotAssigned: "لم يتم تعيين معلم",
    empty: "فارغ",
    noSchedules: "لم يتم نشر أي جداول صفوف حتى الآن.",
    days: {
      monday: "الاثنين",
      tuesday: "الثلاثاء",
      wednesday: "الأربعاء",
      thursday: "الخميس",
      friday: "الجمعة",
    },
  },
};

function classLabel(classSection: SchoolScheduleData["classes"][number]) {
  return classSection.displayLabel || classSection.name;
}

function getVisibleClassPeriods(
  periods: SchedulePeriod[],
  classPeriodOverrides: ClassPeriodOverride[],
  classId: string,
) {
  return periods
    .map((period, periodIndex) => {
      const override = classPeriodOverrides.find(
        (entry) => entry.classId === classId && entry.periodIndex === periodIndex,
      );

      return {
        periodIndex,
        period: {
          ...period,
          startTime: override ? override.startTime : period.startTime,
          endTime: override ? override.endTime : period.endTime,
          hidden: override?.hidden ?? false,
        },
      };
    })
    .filter((entry) => !entry.period.hidden);
}

export default function ScheduleViewer({ schedule, language }: ScheduleViewerProps) {
  const translation = TRANSLATIONS[language];
  const textDirection = language === "ar" ? "rtl" : "ltr";
  const textAlignClass = language === "ar" ? "text-right" : "text-left";
  const [selectedClassId, setSelectedClassId] = useState(
    schedule.classes[0]?.id || "",
  );
  const selectedClass = schedule.classes.find(
    (classSection) => classSection.id === selectedClassId,
  );
  const teacherById = useMemo(
    () => new Map(schedule.teachers.map((teacher) => [teacher.id, teacher])),
    [schedule.teachers],
  );
  const visiblePeriods = useMemo(
    () => (
      selectedClassId
        ? getVisibleClassPeriods(
            schedule.periods,
            schedule.classPeriodOverrides,
            selectedClassId,
          )
        : []
    ),
    [schedule, selectedClassId],
  );

  function getEntry(dayOfWeek: ScheduleDay, periodIndex: number) {
    return schedule.entries.find(
      (entry) =>
        entry.classId === selectedClassId &&
        entry.dayOfWeek === dayOfWeek &&
        entry.periodIndex === periodIndex,
    );
  }

  return (
    <div className={`space-y-6 ${textAlignClass}`} dir={textDirection}>
      <div className="gem-panel rounded-[30px] p-6 sm:p-7">
        <label className="block max-w-md">
          <span className="gem-eyebrow">{translation.chooseClass}</span>
          <select
            value={selectedClassId}
            onChange={(event) => setSelectedClassId(event.target.value)}
            className="gem-input mt-4 h-12 w-full rounded-2xl px-4 text-sm font-semibold outline-none"
          >
            {schedule.classes.length === 0 ? (
              <option value="">{translation.noClasses}</option>
            ) : null}
            {schedule.classes.map((classSection) => (
              <option key={classSection.id} value={classSection.id}>
                {classLabel(classSection)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {selectedClass ? (
        <div className="gem-panel overflow-hidden rounded-[30px]">
          <div className="border-b border-blue-900/10 px-6 py-5">
            <p className="gem-eyebrow">{translation.weeklyTimetable}</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
              {classLabel(selectedClass)}
            </h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              {selectedClass.gradeLevel}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-[980px] w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-blue-900/10 bg-white/55">
                  <th className="w-48 px-5 py-4 text-xs font-bold uppercase tracking-[0.16em] text-blue-700">
                    {translation.time}
                  </th>
                  {SCHEDULE_DAYS.map((day) => (
                    <th
                      key={day}
                      className="px-5 py-4 text-xs font-bold uppercase tracking-[0.16em] text-blue-700"
                    >
                      {translation.days[day]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visiblePeriods.map(({ period, periodIndex }) => {
                  const isRecessPeriod = period.type === "recess";

                  return (
                    <tr
                      key={period.id}
                      className={`border-b border-blue-900/10 last:border-b-0 ${
                        isRecessPeriod ? "bg-cyan-50/60" : ""
                      }`}
                    >
                      <td className="px-5 py-4 align-top">
                        <p className="text-sm font-black text-slate-950">
                          {period.label}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {period.startTime && period.endTime
                            ? `${period.startTime} - ${period.endTime}`
                            : translation.timeNotSet}
                        </p>
                      </td>
                      {SCHEDULE_DAYS.map((day) => {
                        const entry = getEntry(day, periodIndex);
                        const isRecess = isRecessPeriod || entry?.type === "recess";
                        const teacher = entry?.teacherId
                          ? teacherById.get(entry.teacherId)
                          : null;

                        return (
                          <td key={day} className="min-w-[160px] px-5 py-4 align-top">
                            {isRecess ? (
                              <div className="rounded-2xl border border-cyan-200/70 bg-cyan-50 px-4 py-3">
                                <p className="text-sm font-black text-blue-950">
                                  {translation.recess}
                                </p>
                                <p className="mt-1 text-xs font-semibold text-blue-700">
                                  {period.startTime && period.endTime
                                    ? `${period.startTime} - ${period.endTime}`
                                    : period.label}
                                </p>
                              </div>
                            ) : entry ? (
                              <div className="rounded-2xl border border-blue-900/10 bg-white/80 px-4 py-3">
                                <p className="text-sm font-black text-slate-950">
                                  {entry.subject || translation.subject}
                                </p>
                                <p className="mt-1 text-xs font-semibold text-slate-500">
                                  {teacher?.fullName || translation.teacherNotAssigned}
                                </p>
                              </div>
                            ) : (
                              <div className="rounded-2xl border border-dashed border-blue-900/10 bg-white/40 px-4 py-3 text-sm text-slate-400">
                                {translation.empty}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="gem-panel rounded-[30px] p-7 text-sm leading-7 text-slate-500">
          {translation.noSchedules}
        </div>
      )}
    </div>
  );
}
