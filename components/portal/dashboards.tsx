"use client";

import { ChangeEvent, FormEvent, useState } from "react";

import {
  admins,
  agendaItems,
  announcements,
  attendance,
  classes,
  evaluations,
  excelImports,
  getClassName,
  getStudentName,
  getSubjectName,
  getTeacherName,
  libraryFiles,
  messages,
  parents,
  psychologistCases,
  psychologists,
  schedules,
  schoolInfo,
  sessionReports,
  students,
  subjects,
  teachers,
  users,
} from "@/lib/portal/mock-data";
import type { PortalRole, PortalUser } from "@/lib/portal/types";
import { readableNow, todayDate, updatePortalData, usePortalDataSync } from "@/lib/portal/client-store";
import { formatDate, roleLabels } from "@/lib/portal/utils";

import {
  ActionGrid,
  DataTable,
  Panel,
  PortalIcon,
  PortalShell,
  PrototypeForm,
  SimpleList,
  StatCard,
  type NavItem,
  type PortalIconName,
} from "./portal-ui";
import {
  AdminClassesManager,
  AdminParentsManager,
  AdminScheduleBuilder,
  AdminStudentsManager,
  AdminTeachersManager,
} from "./admin-management";

type PortalSection = {
  label: string;
  slug: string;
  icon: PortalIconName;
  description: string;
};

export const portalSections = {
  student: [
    { label: "Dashboard", slug: "", icon: "dashboard", description: "Your daily school overview." },
    { label: "Class Schedule", slug: "my-schedule", icon: "schedule", description: "Your class timetable and periods." },
    { label: "Agenda", slug: "agenda", icon: "agenda", description: "Homework, agenda notes, and due dates." },
    { label: "Announcements", slug: "announcements", icon: "announcements", description: "Announcements sent to your class." },
  ],
  parent: [
    { label: "Dashboard", slug: "", icon: "dashboard", description: "Family overview for linked children." },
    { label: "My Child", slug: "my-child", icon: "child", description: "Child profile, class, and entrance record." },
    { label: "Child Schedule", slug: "child-schedule", icon: "schedule", description: "Your child's class timetable." },
    { label: "Attendance", slug: "attendance", icon: "attendance", description: "Daily attendance filtered to your child." },
    { label: "Agenda", slug: "agenda", icon: "agenda", description: "Homework and agenda notes for your child." },
    { label: "Evaluations", slug: "evaluations", icon: "evaluations", description: "Marks, comments, and academic progress." },
    { label: "Announcements", slug: "announcements", icon: "announcements", description: "Posts for parents and your child's class." },
    { label: "Messages", slug: "messages", icon: "messages", description: "Teacher and administration conversations." },
  ],
  teacher: [
    { label: "Dashboard", slug: "", icon: "dashboard", description: "Teaching overview and next actions." },
    { label: "My Schedule", slug: "my-schedule", icon: "schedule", description: "Your live weekly teaching timetable." },
    { label: "My Classes", slug: "my-classes", icon: "classes", description: "Assigned classes and student lists." },
    { label: "Attendance", slug: "attendance", icon: "attendance", description: "Fill attendance for class sessions." },
    { label: "Session Reports", slug: "session-reports", icon: "reports", description: "Record what happened in each session." },
    { label: "Agenda/Homework", slug: "agenda-homework", icon: "agenda", description: "Publish agenda and homework items." },
    { label: "Library", slug: "library", icon: "library", description: "Upload class files and worksheets." },
    { label: "Messages", slug: "messages", icon: "messages", description: "Communicate with parents and administration." },
  ],
  admin: [
    { label: "Dashboard", slug: "", icon: "dashboard", description: "School operations command center." },
    { label: "Users", slug: "users", icon: "users", description: "Manage all portal accounts." },
    { label: "Students", slug: "students", icon: "students", description: "Student lists from KG1 to Grade 9." },
    { label: "Parents", slug: "parents", icon: "parents", description: "Parent accounts and child links." },
    { label: "Teachers", slug: "teachers", icon: "teachers", description: "Teacher accounts, subjects, and classes." },
    { label: "Classes", slug: "classes", icon: "classes", description: "Class setup and homeroom teachers." },
    { label: "Schedules", slug: "schedules", icon: "schedule", description: "Class and teacher schedules." },
    { label: "Attendance", slug: "attendance", icon: "attendance", description: "Attendance by date, class, student, teacher." },
    { label: "Session Reports", slug: "session-reports", icon: "reports", description: "Teacher session reports." },
    { label: "Agenda", slug: "agenda", icon: "agenda", description: "Manage school agenda and homework." },
    { label: "Evaluations", slug: "evaluations", icon: "evaluations", description: "View and manage marks." },
    { label: "Messages", slug: "messages", icon: "messages", description: "Internal communication center." },
    { label: "Announcements", slug: "announcements", icon: "announcements", description: "Publish official school posts." },
    { label: "Excel Import", slug: "excel-import", icon: "excel", description: "Download templates and preview uploads." },
    { label: "Settings", slug: "settings", icon: "settings", description: "School information and visibility controls." },
  ],
  psychologist: [
    { label: "Dashboard", slug: "", icon: "dashboard", description: "Counselor overview and sensitive follow-up." },
    { label: "Student Follow-Up", slug: "student-follow-up", icon: "profile", description: "Assigned student profiles and context." },
    { label: "Private Notes", slug: "private-notes", icon: "notes", description: "Confidential notes not shown by default." },
    { label: "Cases", slug: "cases", icon: "cases", description: "Normal, follow-up, urgent, and resolved cases." },
    { label: "Reports", slug: "reports", icon: "reports", description: "Follow-up history and summaries." },
  ],
} satisfies Record<PortalRole, PortalSection[]>;

export function getPortalNavItems(role: PortalRole): NavItem[] {
  return (portalSections[role] as readonly PortalSection[]).map((section) => ({
    label: section.label,
    icon: section.icon,
    href: section.slug ? `/portal/${role}/${section.slug}` : `/portal/${role}`,
  }));
}

export function getPortalSection(role: PortalRole, slug: string) {
  return (portalSections[role] as readonly PortalSection[]).find((section) => section.slug === slug) ?? null;
}

function sectionHref(role: PortalRole, slug: string) {
  return slug ? `/portal/${role}/${slug}` : `/portal/${role}`;
}

function dashboardActions(role: PortalRole, slugs: string[]) {
  return slugs
    .map((slug) => getPortalSection(role, slug))
    .filter((section): section is PortalSection => Boolean(section))
    .map((section) => ({
      title: section.label,
      body: section.description,
      href: sectionHref(role, section.slug),
      icon: section.icon,
    }));
}

function announcementsFor(user: PortalUser, classId?: string) {
  return announcements.filter(
    (announcement) =>
      announcement.targetAudience === "all" ||
      announcement.targetAudience === user.role ||
      (announcement.targetAudience === "specific-class" &&
        (announcement.classId === classId ||
          announcement.classIds?.includes(classId ?? ""))),
  );
}

function announcementAudienceLabel(announcement: { targetAudience: string; classId?: string; classIds?: string[] }) {
  if (announcement.targetAudience !== "specific-class") {
    return announcement.targetAudience;
  }

  const targetClassIds = announcement.classIds?.length
    ? announcement.classIds
    : announcement.classId
      ? [announcement.classId]
      : [];

  if (targetClassIds.length === classes.length) {
    return "all classes";
  }

  return targetClassIds.map(getClassName).join(", ") || "specific classes";
}

function parentsForClass(classId: string) {
  const classStudents = students.filter((student) => student.classId === classId);
  const parentIds = new Set(classStudents.flatMap((student) => student.parentIds));
  return parents.filter((parent) => parentIds.has(parent.id));
}

function parentUserForParent(parentId: string) {
  const parent = parents.find((entry) => entry.id === parentId);
  return users.find((entry) => entry.id === parent?.userId);
}

function teacherParentMessages(teacherUserId?: string) {
  return messages.filter((message) => {
    const sender = users.find((user) => user.id === message.senderId);
    const receiver = users.find((user) => user.id === message.receiverId);
    return (
      sender?.role === "teacher" &&
      receiver?.role === "parent" &&
      (!teacherUserId || message.senderId === teacherUserId)
    );
  });
}

function messageListItems(items = teacherParentMessages()) {
  return items.map((message) => {
    const sender = users.find((user) => user.id === message.senderId);
    const receiver = users.find((user) => user.id === message.receiverId);
    return {
      title: message.subject,
      meta: `${sender?.displayName ?? "Teacher"} -> ${receiver?.displayName ?? "Parent"} - ${message.sentAt}`,
      body: message.body,
      badge: message.classId ? getClassName(message.classId) : undefined,
    };
  });
}

function studentForUser(user: PortalUser) {
  return students.find((entry) => entry.userId === user.id);
}

function MissingProfilePanel({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <Panel title={title} eyebrow="Profile setup">
      <p className="portal-empty-state">{body}</p>
    </Panel>
  );
}

function parentForUser(user: PortalUser) {
  return parents.find((entry) => entry.userId === user.id);
}

function teacherForUser(user: PortalUser) {
  return teachers.find((entry) => entry.userId === user.id);
}

function psychologistForUser(user: PortalUser) {
  return psychologists.find((entry) => entry.userId === user.id);
}

function currentChild(user: PortalUser) {
  const parent = parentForUser(user);
  return students.find((student) => student.id === parent?.studentIds[0]);
}

function messageItemsForUser(user: PortalUser) {
  return messages
    .filter((message) => message.senderId === user.id || message.receiverId === user.id)
    .map((message) => ({
      title: message.subject,
      meta: message.sentAt,
      body: message.body,
      badge: message.read ? "Read" : "Unread",
    }));
}

function AnnouncementComposer() {
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const allSelected = selectedClassIds.length === classes.length;

  function toggleClass(classId: string) {
    setSelectedClassIds((current) =>
      current.includes(classId)
        ? current.filter((entry) => entry !== classId)
        : [...current, classId],
    );
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const title = String(formData.get("title") ?? "").trim() || "New announcement";
    const body = String(formData.get("body") ?? "").trim() || "Announcement details.";
    const audience = String(formData.get("audience") ?? "all");
    const targetClassIds = selectedClassIds.length ? selectedClassIds : classes.map((schoolClass) => schoolClass.id);

    updatePortalData((data) => {
      data.announcements.push({
        id: `an-${Date.now()}`,
        title,
        body,
        targetAudience: audience === "specific-class" ? "specific-class" : "all",
        classId: audience === "specific-class" ? targetClassIds[0] : undefined,
        classIds: audience === "specific-class" ? targetClassIds : undefined,
        date: todayDate(),
        attachmentTitles: [],
      });
    });

    setStatus("Announcement published.");
    form.reset();
    setSelectedClassIds([]);
  }

  return (
    <form className="portal-form" onSubmit={handleSubmit}>
      <h3>Announcement</h3>
      <div className="portal-form-grid">
        <label>
          <span>Title</span>
          <input name="title" placeholder="Announcement title" />
        </label>
        <label>
          <span>Audience</span>
          <select name="audience" defaultValue="all">
            <option value="all">Everyone</option>
            <option value="specific-class">Selected classes</option>
          </select>
        </label>
        <label className="portal-field-wide">
          <span>Classes</span>
          <div className="portal-picker">
            <button
              type="button"
              className={allSelected ? "is-active" : ""}
              onClick={() => setSelectedClassIds(classes.map((schoolClass) => schoolClass.id))}
            >
              All
            </button>
            {classes.map((schoolClass) => (
              <button
                key={schoolClass.id}
                type="button"
                className={selectedClassIds.includes(schoolClass.id) ? "is-active" : ""}
                onClick={() => toggleClass(schoolClass.id)}
              >
                {schoolClass.name}
              </button>
            ))}
          </div>
        </label>
        <label className="portal-field-wide">
          <span>Body</span>
          <textarea name="body" placeholder="Body" rows={5} />
        </label>
      </div>
      {status ? <div className="portal-success">{status}</div> : null}
      <div className="portal-form-actions">
        <button type="button" className="portal-secondary-button" onClick={() => setSelectedClassIds([])}>
          Clear classes
        </button>
        <button type="submit" className="portal-primary-button">
          Publish announcement
        </button>
      </div>
    </form>
  );
}

function TeacherMessageCenter({ user }: { user: PortalUser }) {
  const teacher = teacherForUser(user);
  const teacherClasses = classes.filter((schoolClass) => teacher?.classIds.includes(schoolClass.id));
  const [classId, setClassId] = useState(teacherClasses[0]?.id ?? "");
  const [status, setStatus] = useState("");
  const availableParents = parentsForClass(classId);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const parentId = String(formData.get("parentId") ?? "");
    const receiver = parentUserForParent(parentId);

    if (!teacher || !receiver || !classId) {
      setStatus("Choose a class and parent first.");
      return;
    }

    updatePortalData((data) => {
      data.messages.push({
        id: `msg-${Date.now()}`,
        senderId: user.id,
        receiverId: receiver.id,
        subject: String(formData.get("subject") ?? "").trim() || "Teacher message",
        body: String(formData.get("body") ?? "").trim() || "Message body.",
        sentAt: readableNow(),
        read: false,
        classId,
      });
    });

    setStatus("Message sent to parent.");
    form.reset();
  }

  return (
    <div className="portal-grid-two">
      <Panel title="Send parent notice" eyebrow="One-way teacher message">
        <form className="portal-form" onSubmit={handleSubmit}>
          <div className="portal-form-grid">
            <label>
              <span>Class</span>
              <select value={classId} onChange={(event) => setClassId(event.target.value)}>
                {teacherClasses.map((schoolClass) => (
                  <option key={schoolClass.id} value={schoolClass.id}>
                    {schoolClass.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Parent</span>
              <select name="parentId">
                {availableParents.map((parent) => (
                  <option key={parent.id} value={parent.id}>
                    {parent.firstName} {parent.lastName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Subject</span>
              <input name="subject" placeholder="Subject" />
            </label>
            <label className="portal-field-wide">
              <span>Message</span>
              <textarea name="body" rows={5} placeholder="Write the parent notice" />
            </label>
          </div>
          {status ? <div className="portal-success">{status}</div> : null}
          <div className="portal-form-actions">
            <button type="submit" className="portal-primary-button">
              Send message
            </button>
          </div>
        </form>
      </Panel>
      <Panel title="Sent messages" eyebrow="Visible to administration">
        <SimpleList empty="No parent messages sent yet." items={messageListItems(teacherParentMessages(user.id))} />
      </Panel>
    </div>
  );
}

function filesToItems(files = libraryFiles) {
  return files.map((file) => ({
    title: file.title,
    meta: `${file.fileType} uploaded ${formatDate(file.uploadedAt)}`,
    body: file.description,
    badge: getSubjectName(file.subjectId),
  }));
}

function agendaToItems(items = agendaItems) {
  return items.map((item) => ({
    title: item.title,
    meta: `${getClassName(item.classId)} · ${getSubjectName(item.subjectId)} · due ${formatDate(item.dueDate)}`,
    body: item.description,
    badge: getTeacherName(item.teacherId),
  }));
}

function evaluationsToRows(items = evaluations) {
  return items.map((item) => [
    getStudentName(item.studentId),
    getClassName(item.classId),
    getSubjectName(item.subjectId),
    item.title,
    `${item.mark}/${item.maximumMark}`,
    formatDate(item.date),
  ]);
}

function scheduleRows(items = schedules) {
  return items.map((entry) => [
    entry.day,
    entry.period,
    getClassName(entry.classId),
    getSubjectName(entry.subjectId),
    getTeacherName(entry.teacherId),
    `${entry.startTime}-${entry.endTime}`,
    entry.room,
  ]);
}

function attendanceRows(items = attendance) {
  return items.map((item) => [
    formatDate(item.date),
    getClassName(item.classId),
    getTeacherName(item.teacherId),
    getSubjectName(item.subjectId),
    item.period,
    item.records.length,
  ]);
}

function sessionReportItems(items = sessionReports) {
  return items.map((report) => ({
    title: report.lessonTitle,
    meta: `${getClassName(report.classId)} · ${getSubjectName(report.subjectId)} · ${formatDate(report.date)}`,
    body: `${report.completedWork} Homework: ${report.homework}`,
    badge: report.visibleToParents ? "Parent visible" : "Admin only",
  }));
}

function studentReportItems(items = sessionReports) {
  return items.flatMap((report) =>
    report.individualRemarks.map((remark) => ({
      title: getStudentName(remark.studentId),
      meta: `${getClassName(report.classId)} - ${formatDate(report.date)} - ${getTeacherName(report.teacherId)}`,
      body: remark.remark,
      badge: getSubjectName(report.subjectId),
    })),
  );
}

function TeacherAttendanceManager({ user }: { user: PortalUser }) {
  const teacher = teacherForUser(user);
  const teacherClasses = classes.filter((schoolClass) => teacher?.classIds.includes(schoolClass.id));
  const [classId, setClassId] = useState(teacherClasses[0]?.id ?? "");
  const [date, setDate] = useState(todayDate());
  const [absentIds, setAbsentIds] = useState<string[]>([]);
  const [status, setStatus] = useState("");
  const classStudents = students.filter((student) => student.classId === classId);

  function toggleAbsent(studentId: string) {
    setAbsentIds((current) =>
      current.includes(studentId)
        ? current.filter((entry) => entry !== studentId)
        : [...current, studentId],
    );
  }

  function saveAttendance(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!teacher || !classId) return;
    const formData = new FormData(event.currentTarget);

    updatePortalData((data) => {
      data.attendance = data.attendance.filter(
        (entry) => !(entry.date === date && entry.classId === classId && entry.teacherId === teacher.id),
      );
      data.attendance.push({
        id: `att-${Date.now()}`,
        date,
        classId,
        teacherId: teacher.id,
        subjectId: String(formData.get("subjectId") ?? teacher.subjects[0] ?? subjects[0]?.id ?? "math"),
        period: Number(formData.get("period")) || 1,
        records: data.students
          .filter((student) => student.classId === classId)
          .map((student) => ({
            studentId: student.id,
            status: absentIds.includes(student.id) ? "absent" as const : "present" as const,
          })),
      });
    });

    setStatus("Attendance saved.");
    setAbsentIds([]);
  }

  return (
    <div className="portal-grid-two">
      <Panel title="Take attendance" eyebrow="Pick day, class, then mark absent students">
        <form className="portal-form" onSubmit={saveAttendance}>
          <div className="portal-form-grid">
            <label>
              <span>Date</span>
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </label>
            <label>
              <span>Class</span>
              <select
                value={classId}
                onChange={(event) => {
                  setClassId(event.target.value);
                  setAbsentIds([]);
                }}
              >
                {teacherClasses.map((schoolClass) => (
                  <option key={schoolClass.id} value={schoolClass.id}>
                    {schoolClass.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Subject</span>
              <select name="subjectId" defaultValue={teacher?.subjects[0] ?? subjects[0]?.id}>
                {(teacher?.subjects ?? []).map((subjectId) => (
                  <option key={subjectId} value={subjectId}>
                    {getSubjectName(subjectId)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Period</span>
              <input name="period" type="number" min={1} defaultValue={1} />
            </label>
          </div>
          <div className="portal-check-grid">
            {classStudents.map((student) => (
              <label key={student.id} className={absentIds.includes(student.id) ? "is-selected" : ""}>
                <input
                  type="checkbox"
                  checked={absentIds.includes(student.id)}
                  onChange={() => toggleAbsent(student.id)}
                />
                <span>{student.firstName} {student.lastName}</span>
              </label>
            ))}
          </div>
          {status ? <div className="portal-success">{status}</div> : null}
          <div className="portal-form-actions">
            <button type="button" className="portal-secondary-button" onClick={() => setAbsentIds(classStudents.map((student) => student.id))}>
              Mark all absent
            </button>
            <button type="submit" className="portal-primary-button">
              Save attendance
            </button>
          </div>
        </form>
      </Panel>
      <Panel title="Recent absents" eyebrow="My classes">
        <SimpleList
          empty="No absent students recorded."
          items={attendance
            .filter((entry) => entry.teacherId === teacher?.id)
            .flatMap((entry) =>
              entry.records
                .filter((record) => record.status === "absent")
                .map((record) => ({
                  title: getStudentName(record.studentId),
                  meta: `${getClassName(entry.classId)} - ${formatDate(entry.date)}`,
                  body: `${getSubjectName(entry.subjectId)} period ${entry.period}`,
                  badge: "absent",
                })),
            )}
        />
      </Panel>
    </div>
  );
}

function TeacherStudentReportsManager({ user }: { user: PortalUser }) {
  const teacher = teacherForUser(user);
  const teacherClasses = classes.filter((schoolClass) => teacher?.classIds.includes(schoolClass.id));
  const [classId, setClassId] = useState(teacherClasses[0]?.id ?? "");
  const [date, setDate] = useState(todayDate());
  const [status, setStatus] = useState("");
  const classStudents = students.filter((student) => student.classId === classId);

  function saveReports(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!teacher || !classId) return;
    const formData = new FormData(event.currentTarget);
    const subjectId = String(formData.get("subjectId") ?? teacher.subjects[0] ?? subjects[0]?.id ?? "math");
    const remarks = classStudents
      .map((student) => ({
        studentId: student.id,
        remark: String(formData.get(`remark-${student.id}`) ?? "").trim(),
        visibleToParent: true,
      }))
      .filter((remark) => remark.remark);

    updatePortalData((data) => {
      data.sessionReports.push({
        id: `sr-${Date.now()}`,
        date,
        classId,
        teacherId: teacher.id,
        subjectId,
        period: 1,
        lessonTitle: `Student reports - ${getClassName(classId)}`,
        completedWork: "Individual student reports recorded.",
        homework: "",
        generalRemark: String(formData.get("generalRemark") ?? "").trim(),
        visibleToParents: true,
        individualRemarks: remarks,
      });
    });

    setStatus("Student reports saved.");
    event.currentTarget.reset();
  }

  return (
    <div className="portal-grid-two">
      <Panel title="Write student reports" eyebrow="One note per student">
        <form className="portal-form" onSubmit={saveReports}>
          <div className="portal-form-grid">
            <label>
              <span>Date</span>
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </label>
            <label>
              <span>Class</span>
              <select value={classId} onChange={(event) => setClassId(event.target.value)}>
                {teacherClasses.map((schoolClass) => (
                  <option key={schoolClass.id} value={schoolClass.id}>
                    {schoolClass.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Subject</span>
              <select name="subjectId" defaultValue={teacher?.subjects[0] ?? subjects[0]?.id}>
                {(teacher?.subjects ?? []).map((subjectId) => (
                  <option key={subjectId} value={subjectId}>
                    {getSubjectName(subjectId)}
                  </option>
                ))}
              </select>
            </label>
            <label className="portal-field-wide">
              <span>General note</span>
              <textarea name="generalRemark" rows={3} placeholder="Optional class-level note" />
            </label>
          </div>
          <div className="portal-report-editor">
            {classStudents.map((student) => (
              <label key={student.id}>
                <span>{student.firstName} {student.lastName}</span>
                <textarea name={`remark-${student.id}`} rows={3} placeholder="Student report" />
              </label>
            ))}
          </div>
          {status ? <div className="portal-success">{status}</div> : null}
          <div className="portal-form-actions">
            <button type="submit" className="portal-primary-button">
              Save student reports
            </button>
          </div>
        </form>
      </Panel>
      <Panel title="Previous student reports" eyebrow="My classes">
        <SimpleList empty="No student reports yet." items={studentReportItems(sessionReports.filter((entry) => entry.teacherId === teacher?.id))} />
      </Panel>
    </div>
  );
}

function AdminAttendanceBrowser() {
  const dates = Array.from(new Set(attendance.map((entry) => entry.date))).sort().reverse();
  const [date, setDate] = useState(dates[0] ?? todayDate());
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const sheet = attendance.find((entry) => entry.date === date && entry.classId === classId);
  const classStudents = students.filter((student) => student.classId === classId);
  const absentIds = new Set(sheet?.records.filter((record) => record.status === "absent").map((record) => record.studentId) ?? []);

  return (
    <div className="portal-grid-two">
      <Panel title="Attendance by day" eyebrow="Choose a date, then enter each class">
        <div className="portal-form">
          <div className="portal-form-grid">
            <label>
              <span>Day</span>
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </label>
          </div>
        </div>
        <div className="portal-class-browser">
          {classes.map((schoolClass) => {
            const entry = attendance.find((item) => item.date === date && item.classId === schoolClass.id);
            const absentCount = entry?.records.filter((record) => record.status === "absent").length ?? 0;
            return (
              <button
                key={schoolClass.id}
                type="button"
                className={classId === schoolClass.id ? "is-active" : ""}
                onClick={() => setClassId(schoolClass.id)}
              >
                <strong>{schoolClass.name}</strong>
                <span>{entry ? `${absentCount} absent` : "No sheet"}</span>
              </button>
            );
          })}
        </div>
      </Panel>
      <Panel title={`${getClassName(classId)} attendance`} eyebrow={formatDate(date)}>
        <DataTable
          columns={["Student", "Status"]}
          rows={classStudents.map((student) => [
            getStudentName(student.id),
            sheet ? absentIds.has(student.id) ? "Absent" : "Present" : "No sheet",
          ])}
        />
      </Panel>
      <Panel title="Absents" eyebrow="Selected day and class">
        <SimpleList
          empty="No absents for this class/day."
          items={classStudents
            .filter((student) => absentIds.has(student.id))
            .map((student) => ({
              title: getStudentName(student.id),
              meta: `${getClassName(classId)} - ${formatDate(date)}`,
              body: sheet ? `${getTeacherName(sheet.teacherId)} - ${getSubjectName(sheet.subjectId)}` : "",
              badge: "absent",
            }))}
        />
      </Panel>
    </div>
  );
}

function AdminStudentReportsBrowser() {
  const reportDates = Array.from(new Set(sessionReports.map((report) => report.date))).sort().reverse();
  const [date, setDate] = useState(reportDates[0] ?? todayDate());
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const reportsForClass = sessionReports.filter((report) => report.date === date && report.classId === classId);

  return (
    <div className="portal-grid-two">
      <Panel title="Student reports by day" eyebrow="Choose a date, then enter each class">
        <div className="portal-form">
          <div className="portal-form-grid">
            <label>
              <span>Day</span>
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </label>
          </div>
        </div>
        <div className="portal-class-browser">
          {classes.map((schoolClass) => {
            const count = sessionReports
              .filter((report) => report.date === date && report.classId === schoolClass.id)
              .reduce((total, report) => total + report.individualRemarks.length, 0);
            return (
              <button
                key={schoolClass.id}
                type="button"
                className={classId === schoolClass.id ? "is-active" : ""}
                onClick={() => setClassId(schoolClass.id)}
              >
                <strong>{schoolClass.name}</strong>
                <span>{count ? `${count} reports` : "No reports"}</span>
              </button>
            );
          })}
        </div>
      </Panel>
      <Panel title={`${getClassName(classId)} reports`} eyebrow={formatDate(date)}>
        <SimpleList empty="No reports for this class/day." items={studentReportItems(reportsForClass)} />
      </Panel>
    </div>
  );
}

function AdminAgendaManager() {
  const [classId, setClassId] = useState("all");
  const visibleAgenda = agendaItems.filter((item) => classId === "all" || item.classId === classId);
  const adminTeacher = teachers[0];
  const [status, setStatus] = useState("");

  function addAgenda(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);

    updatePortalData((data) => {
      data.agendaItems.push({
        id: `ag-${Date.now()}`,
        title: String(formData.get("title") ?? "").trim() || "Agenda item",
        description: String(formData.get("description") ?? "").trim() || "Agenda details.",
        subjectId: String(formData.get("subjectId") ?? subjects[0]?.id ?? "math"),
        classId: String(formData.get("classId") ?? classes[0]?.id ?? "g1"),
        dueDate: String(formData.get("dueDate") ?? "") || todayDate(),
        teacherId: String(formData.get("teacherId") ?? adminTeacher?.id ?? "teacher-1"),
        attachmentTitles: [],
      });
    });

    setStatus("Agenda item added.");
    form.reset();
  }

  function deleteAgenda(itemId: string) {
    updatePortalData((data) => {
      data.agendaItems = data.agendaItems.filter((item) => item.id !== itemId);
    });
    setStatus("Agenda item deleted.");
  }

  return (
    <div className="portal-admin-manager">
      <section className="portal-card">
        <div className="portal-panel-head">
          <div>
            <p className="portal-kicker">School agenda</p>
            <h2>Add agenda item</h2>
          </div>
        </div>
        <form className="portal-form" onSubmit={addAgenda}>
          <div className="portal-form-grid">
            <label>
              <span>Title</span>
              <input name="title" placeholder="Homework or agenda title" />
            </label>
            <label>
              <span>Class</span>
              <select name="classId" defaultValue={classes[0]?.id}>
                {classes.map((schoolClass) => (
                  <option key={schoolClass.id} value={schoolClass.id}>
                    {schoolClass.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Subject</span>
              <select name="subjectId" defaultValue={subjects[0]?.id}>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Teacher</span>
              <select name="teacherId" defaultValue={adminTeacher?.id}>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {getTeacherName(teacher.id)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Due date</span>
              <input name="dueDate" type="date" defaultValue={todayDate()} />
            </label>
            <label className="portal-field-wide">
              <span>Description</span>
              <textarea name="description" rows={4} placeholder="Agenda details" />
            </label>
          </div>
          {status ? <div className="portal-success">{status}</div> : null}
          <div className="portal-form-actions">
            <button type="submit" className="portal-primary-button">
              Add agenda
            </button>
          </div>
        </form>
      </section>

      <section className="portal-card">
        <div className="portal-panel-head">
          <div>
            <p className="portal-kicker">Browse agenda</p>
            <h2>Class agenda items</h2>
          </div>
          <label className="portal-inline-filter">
            <span>Class</span>
            <select value={classId} onChange={(event) => setClassId(event.target.value)}>
              <option value="all">All classes</option>
              {classes.map((schoolClass) => (
                <option key={schoolClass.id} value={schoolClass.id}>
                  {schoolClass.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="portal-list">
          {visibleAgenda.length ? visibleAgenda.map((item) => (
            <article key={item.id} className="portal-list-item">
              <div>
                <strong>{item.title}</strong>
                <span>{getClassName(item.classId)} - {getSubjectName(item.subjectId)} - due {formatDate(item.dueDate)}</span>
                <p>{item.description}</p>
              </div>
              <button type="button" className="portal-mini-danger-button" onClick={() => deleteAgenda(item.id)}>
                Delete
              </button>
            </article>
          )) : <div className="portal-empty">No agenda items for this class.</div>}
        </div>
      </section>
    </div>
  );
}

export function StudentDashboard({ user }: { user: PortalUser }) {
  usePortalDataSync();
  const student = studentForUser(user);

  if (!student) {
    return (
      <PortalShell
        user={user}
        role="student"
        navItems={getPortalNavItems("student")}
        activePath="/portal/student"
      >
        <MissingProfilePanel
          title="Student profile not linked"
          body="This account is signed in as a student, but it is not linked to a student profile yet. Ask administration to link the user to a student record."
        />
      </PortalShell>
    );
  }

  const classAgenda = agendaItems.filter((item) => item.classId === student.classId);
  const classSchedule = schedules.filter((entry) => entry.classId === student.classId);
  const classAnnouncements = announcementsFor(user, student.classId);

  return (
    <PortalShell
      user={user}
      role="student"
      navItems={getPortalNavItems("student")}
      activePath="/portal/student"
    >
      <div className="portal-hero">
        <div>
          <p className="portal-kicker">Today</p>
          <h2>Good morning, {student.firstName}</h2>
          <p>
            Your {getClassName(student.classId)} portal is simple: class
            schedule, agenda, and announcements sent to your class.
          </p>
        </div>
      </div>

      <ActionGrid
        actions={dashboardActions("student", [
          "my-schedule",
          "agenda",
          "announcements",
        ])}
      />

      <div className="portal-stats-grid">
        <StatCard label="Class" value={getClassName(student.classId)} detail="Lebanese curriculum aligned" icon="classes" href="/portal/student/my-schedule" />
        <StatCard label="Homework" value={String(classAgenda.length)} detail="Open items for your class" icon="agenda" href="/portal/student/agenda" />
        <StatCard label="Announcements" value={String(classAnnouncements.length)} detail="Posts visible to your class" icon="announcements" href="/portal/student/announcements" />
      </div>

      <div className="portal-grid-two">
        <Panel title="Today's agenda" eyebrow="Agenda/Homework" actionHref="/portal/student/agenda">
          <SimpleList empty="No agenda items for your class yet." items={agendaToItems(classAgenda)} />
        </Panel>
        <Panel title="Personal schedule" eyebrow="Schedule" actionHref="/portal/student/my-schedule">
          <DataTable
            columns={["Day", "Period", "Class", "Subject", "Teacher", "Time", "Room"]}
            rows={scheduleRows(classSchedule)}
          />
        </Panel>
        <Panel title="Class announcements" eyebrow="Announcements" actionHref="/portal/student/announcements">
          <SimpleList empty="No announcements for your class." items={classAnnouncements.map((announcement) => ({ title: announcement.title, meta: formatDate(announcement.date), body: announcement.body }))} />
        </Panel>
      </div>
    </PortalShell>
  );
}

export function ParentDashboard({ user }: { user: PortalUser }) {
  usePortalDataSync();
  const child = currentChild(user);

  if (!child) {
    return (
      <PortalShell
        user={user}
        role="parent"
        navItems={getPortalNavItems("parent")}
        activePath="/portal/parent"
      >
        <MissingProfilePanel
          title="Parent account not linked"
          body="This parent account exists, but no child is linked yet. Administration can link the parent to a student from the Parents page."
        />
      </PortalShell>
    );
  }

  const childAttendance = attendance.filter((item) =>
    item.records.some((record) => record.studentId === child.id),
  );
  const childEvaluations = evaluations.filter((item) => item.studentId === child.id);
  const childAgenda = agendaItems.filter((item) => item.classId === child.classId);

  return (
    <PortalShell
      user={user}
      role="parent"
      navItems={getPortalNavItems("parent")}
      activePath="/portal/parent"
    >
      <div className="portal-hero">
        <div>
          <p className="portal-kicker">Linked child</p>
          <h2>{getStudentName(child.id)} · {getClassName(child.classId)}</h2>
          <p>
            Parents see their child profile, timetable, attendance, agenda,
            evaluations, class announcements, and teacher communication.
          </p>
        </div>
      </div>

      <ActionGrid
        actions={dashboardActions("parent", [
          "my-child",
          "child-schedule",
          "attendance",
          "agenda",
          "evaluations",
          "announcements",
          "messages",
        ])}
      />

      <div className="portal-stats-grid">
        <StatCard label="Child" value={child.firstName} detail={getClassName(child.classId)} icon="child" href="/portal/parent/my-child" />
        <StatCard label="Attendance" value={`${childAttendance.length} record`} detail="Filtered to linked child" icon="attendance" href="/portal/parent/attendance" />
        <StatCard label="Agenda" value={String(childAgenda.length)} detail="Homework and class notes" icon="agenda" href="/portal/parent/agenda" />
      </div>

      <div className="portal-grid-two">
        <Panel title="Child agenda" eyebrow="Homework" actionHref="/portal/parent/agenda">
          <SimpleList empty="No agenda items." items={agendaToItems(childAgenda)} />
        </Panel>
        <Panel title="Child schedule" eyebrow="Timetable" actionHref="/portal/parent/child-schedule">
          <DataTable
            columns={["Day", "Period", "Class", "Subject", "Teacher", "Time", "Room"]}
            rows={scheduleRows(schedules.filter((entry) => entry.classId === child.classId))}
          />
        </Panel>
        <Panel title="Attendance" eyebrow="Daily records" actionHref="/portal/parent/attendance">
          <DataTable
            columns={["Date", "Class", "Teacher", "Subject", "Period", "Records"]}
            rows={attendanceRows(childAttendance)}
          />
        </Panel>
        <Panel title="Evaluations" eyebrow="Marks" actionHref="/portal/parent/evaluations">
          <DataTable
            columns={["Student", "Class", "Subject", "Title", "Mark", "Date"]}
            rows={evaluationsToRows(childEvaluations)}
          />
        </Panel>
        <Panel title="Message teachers" eyebrow="Prototype form" actionHref="/portal/parent/messages">
          <SimpleList empty="No teacher messages yet." items={messageItemsForUser(user)} />
        </Panel>
      </div>
    </PortalShell>
  );
}

export function TeacherDashboard({ user }: { user: PortalUser }) {
  usePortalDataSync();
  const teacher = teacherForUser(user);

  if (!teacher) {
    return (
      <PortalShell
        user={user}
        role="teacher"
        navItems={getPortalNavItems("teacher")}
        activePath="/portal/teacher"
      >
        <MissingProfilePanel
          title="Teacher profile not linked"
          body="This teacher account exists, but no teacher profile is linked yet. Sign out and back in once, or ask administration to open the Teachers page to complete assignments."
        />
      </PortalShell>
    );
  }

  const teacherSchedules = schedules.filter((entry) => entry.teacherId === teacher.id);
  const teacherClasses = classes.filter((entry) => teacher.classIds.includes(entry.id));
  const teacherReports = sessionReports.filter((entry) => entry.teacherId === teacher.id);

  return (
    <PortalShell
      user={user}
      role="teacher"
      navItems={getPortalNavItems("teacher")}
      activePath="/portal/teacher"
    >
      <div className="portal-hero">
        <div>
          <p className="portal-kicker">Live schedule</p>
          <h2>{teacher.firstName} {teacher.lastName}</h2>
          <p>
            Open a session, fill attendance, write what was done, add homework,
            upload files, and send parent messages.
          </p>
        </div>
      </div>

      <ActionGrid
        actions={dashboardActions("teacher", [
          "my-schedule",
          "my-classes",
          "attendance",
          "session-reports",
          "agenda-homework",
          "library",
          "messages",
        ])}
      />

      <div className="portal-stats-grid">
        <StatCard label="Assigned classes" value={String(teacherClasses.length)} detail={teacherClasses.map((item) => item.name).join(", ")} icon="classes" href="/portal/teacher/my-classes" />
        <StatCard label="Subjects" value={String(teacher.subjects.length)} detail={teacher.subjects.map(getSubjectName).join(", ")} icon="evaluations" href="/portal/teacher/my-schedule" />
        <StatCard label="Reports" value={String(teacherReports.length)} detail="Visible to administration" icon="reports" href="/portal/teacher/session-reports" />
      </div>

      <div className="portal-grid-two">
        <Panel title="Today's schedule" eyebrow="My Schedule" actionHref="/portal/teacher/my-schedule">
          <DataTable
            columns={["Day", "Period", "Class", "Subject", "Teacher", "Time", "Room"]}
            rows={scheduleRows(teacherSchedules)}
          />
        </Panel>
        <Panel title="Session workflow" eyebrow="Attendance and report" actionHref="/portal/teacher/session-reports">
          <PrototypeForm currentUser={user} title="Save class session" fields={["Class", "Attendance summary", "Lesson title", "What was done", "Homework", "Individual student remark"]} submitLabel="Save session" />
        </Panel>
        <Panel title="Previous session reports" eyebrow="History" actionHref="/portal/teacher/session-reports">
          <SimpleList empty="No reports saved yet." items={sessionReportItems(teacherReports)} />
        </Panel>
        <Panel title="Library upload" eyebrow="Documents" actionHref="/portal/teacher/library">
          <PrototypeForm currentUser={user} title="Upload class file" fields={["Title", "Subject", "Class", "Description", "File"]} submitLabel="Publish file" />
        </Panel>
      </div>
    </PortalShell>
  );
}

export function AdminDashboard({ user }: { user: PortalUser }) {
  usePortalDataSync();
  return (
    <PortalShell
      user={user}
      role="admin"
      navItems={getPortalNavItems("admin")}
      activePath="/portal/admin"
    >
      <div className="portal-hero">
        <div>
          <p className="portal-kicker">Full control</p>
          <h2>Administration command center</h2>
          <p>{schoolInfo.curriculum} {schoolInfo.books}</p>
        </div>
      </div>

      <ActionGrid
        actions={dashboardActions("admin", [
          "users",
          "students",
          "teachers",
          "schedules",
          "attendance",
          "messages",
          "announcements",
          "excel-import",
          "settings",
        ])}
      />

      <div className="portal-stats-grid">
        <StatCard label="Users" value={String(users.length)} detail="Students, parents, staff" icon="users" href="/portal/admin/users" />
        <StatCard label="Classes" value="KG1-G9" detail={`${classes.length} configured groups`} icon="classes" href="/portal/admin/classes" />
        <StatCard label="Excel imports" value={String(excelImports.length)} detail="Templates and upload previews" icon="excel" href="/portal/admin/excel-import" />
      </div>

      <div className="portal-grid-two">
        <Panel title="User management" eyebrow="Accounts" actionHref="/portal/admin/users">
          <DataTable columns={["Area", "Current", "Prototype action"]} rows={[["Students", students.length, "Create/edit/delete"], ["Parents", parents.length, "Link to children"], ["Teachers", teachers.length, "Assign classes"], ["Admins", admins.length, "Full access"], ["Psychologist", psychologists.length, "Limited sensitive access"]]} />
        </Panel>
        <Panel title="Excel import" eyebrow="Templates" actionHref="/portal/admin/excel-import">
          <ExcelImportPreview />
        </Panel>
        <Panel title="Attendance and sessions" eyebrow="Operations" actionHref="/portal/admin/attendance">
          <DataTable columns={["Date", "Class", "Teacher", "Subject", "Period", "Records"]} rows={attendanceRows()} />
        </Panel>
        <Panel title="Announcements" eyebrow="Posts" actionHref="/portal/admin/announcements">
          <AnnouncementComposer />
        </Panel>
      </div>
    </PortalShell>
  );
}

export function PsychologistDashboard({ user }: { user: PortalUser }) {
  usePortalDataSync();
  const psychologist = psychologistForUser(user);

  if (!psychologist) {
    return (
      <PortalShell
        user={user}
        role="psychologist"
        navItems={getPortalNavItems("psychologist")}
        activePath="/portal/psychologist"
      >
        <MissingProfilePanel
          title="Psychologist profile not linked"
          body="This account exists, but no psychologist profile is linked yet."
        />
      </PortalShell>
    );
  }

  const assignedCases = psychologistCases.filter((entry) =>
    psychologist.assignedStudentIds.includes(entry.studentId),
  );

  return (
    <PortalShell
      user={user}
      role="psychologist"
      navItems={getPortalNavItems("psychologist")}
      activePath="/portal/psychologist"
    >
      <div className="portal-hero">
        <div>
          <p className="portal-kicker">Sensitive workspace</p>
          <h2>Student follow-up and private notes</h2>
          <p>
            Psychologist notes stay private by default. Parent communication is
            controlled by administration permissions.
          </p>
        </div>
      </div>

      <ActionGrid
        actions={dashboardActions("psychologist", [
          "student-follow-up",
          "private-notes",
          "cases",
          "reports",
        ])}
      />

      <div className="portal-stats-grid">
        <StatCard label="Assigned students" value={String(psychologist.assignedStudentIds.length)} detail="Limited access scope" icon="profile" href="/portal/psychologist/student-follow-up" />
        <StatCard label="Open cases" value={String(assignedCases.filter((item) => item.status !== "resolved").length)} detail="Normal, follow-up, urgent, resolved" icon="cases" href="/portal/psychologist/cases" />
        <StatCard label="Parent contact" value={psychologist.parentContactEnabled ? "Enabled" : "Disabled"} detail="Administration controlled" icon="messages" />
      </div>

      <div className="portal-grid-two">
        <Panel title="Cases" eyebrow="Follow-up" actionHref="/portal/psychologist/cases">
          <SimpleList empty="No assigned cases." items={psychologistCaseItems(assignedCases)} />
        </Panel>
        <Panel title="Private note" eyebrow="Confidential" actionHref="/portal/psychologist/private-notes">
          <PrototypeForm currentUser={user} title="Add follow-up note" fields={["Student", "Case status", "Private note", "Next action"]} submitLabel="Save private note" />
        </Panel>
        <Panel title="Teacher remarks allowed by administration" eyebrow="Context" actionHref="/portal/psychologist/student-follow-up">
          <SimpleList empty="No allowed remarks." items={allowedRemarkItems(psychologist.assignedStudentIds)} />
        </Panel>
        <Panel title="Reports" eyebrow="Follow-up history" actionHref="/portal/psychologist/reports">
          <SimpleList empty="No reports." items={psychologistCaseItems(assignedCases)} />
        </Panel>
      </div>
    </PortalShell>
  );
}

export function PortalSectionView({
  user,
  role,
  section,
}: {
  user: PortalUser;
  role: PortalRole;
  section: PortalSection;
}) {
  usePortalDataSync();
  return (
    <PortalShell
      user={user}
      role={role}
      navItems={getPortalNavItems(role)}
      activePath={sectionHref(role, section.slug)}
      pageTitle={section.label}
      pageEyebrow={`${roleLabels[role]} workspace`}
    >
      <div className="portal-section-hero">
        <PortalIcon name={section.icon} />
        <div>
          <p className="portal-kicker">{roleLabels[role]}</p>
          <h2>{section.label}</h2>
          <p>{section.description}</p>
        </div>
      </div>
      {renderSectionContent(user, role, section.slug)}
    </PortalShell>
  );
}

function renderSectionContent(user: PortalUser, role: PortalRole, slug: string) {
  if (role === "student") {
    return <StudentSection user={user} slug={slug} />;
  }
  if (role === "parent") {
    return <ParentSection user={user} slug={slug} />;
  }
  if (role === "teacher") {
    return <TeacherSection user={user} slug={slug} />;
  }
  if (role === "admin") {
    return <AdminSection user={user} slug={slug} />;
  }
  return <PsychologistSection user={user} slug={slug} />;
}

function StudentSection({ user, slug }: { user: PortalUser; slug: string }) {
  const student = studentForUser(user);

  if (!student) {
    return (
      <MissingProfilePanel
        title="Student profile not linked"
        body="This account is signed in as a student, but it is not linked to a student profile yet."
      />
    );
  }

  const classAgenda = agendaItems.filter((item) => item.classId === student.classId);
  const classSchedule = schedules.filter((entry) => entry.classId === student.classId);

  if (slug === "my-schedule") {
    return <Panel title="My class schedule" eyebrow={getClassName(student.classId)}><DataTable columns={["Day", "Period", "Class", "Subject", "Teacher", "Time", "Room"]} rows={scheduleRows(classSchedule)} /></Panel>;
  }
  if (slug === "agenda") {
    return <Panel title="Homework and agenda" eyebrow="Assigned to your class"><SimpleList empty="No agenda items." items={agendaToItems(classAgenda)} /></Panel>;
  }
  return <Panel title="Announcements" eyebrow="Administration"><SimpleList empty="No announcements." items={announcementsFor(user, student.classId).map((announcement) => ({ title: announcement.title, meta: formatDate(announcement.date), body: announcement.body }))} /></Panel>;
}

function ParentSection({ user, slug }: { user: PortalUser; slug: string }) {
  const child = currentChild(user);
  const parent = parentForUser(user);

  if (!child || !parent) {
    return (
      <MissingProfilePanel
        title="Parent account not linked"
        body="This parent account exists, but no child is linked yet."
      />
    );
  }

  const childAttendance = attendance.filter((item) =>
    item.records.some((record) => record.studentId === child.id),
  );
  const childAgenda = agendaItems.filter((item) => item.classId === child.classId);
  const childEvaluations = evaluations.filter((item) => item.studentId === child.id);

  if (slug === "my-child") {
    return (
      <div className="portal-grid-two">
        <Panel title={getStudentName(child.id)} eyebrow="Child profile">
          <DataTable columns={["Class", "Date of birth", "Entrance exam", "Parent phone"]} rows={[[getClassName(child.classId), formatDate(child.dateOfBirth), child.entranceExamStatus, parent.phone]]} />
        </Panel>
        <Panel title="Child schedule" eyebrow="Timetable">
          <DataTable columns={["Day", "Period", "Class", "Subject", "Teacher", "Time", "Room"]} rows={scheduleRows(schedules.filter((entry) => entry.classId === child.classId))} />
        </Panel>
      </div>
    );
  }
  if (slug === "child-schedule") {
    return <Panel title="Child schedule" eyebrow={getClassName(child.classId)}><DataTable columns={["Day", "Period", "Class", "Subject", "Teacher", "Time", "Room"]} rows={scheduleRows(schedules.filter((entry) => entry.classId === child.classId))} /></Panel>;
  }
  if (slug === "attendance") {
    return <Panel title="Attendance records" eyebrow={getStudentName(child.id)}><DataTable columns={["Date", "Class", "Teacher", "Subject", "Period", "Records"]} rows={attendanceRows(childAttendance)} /></Panel>;
  }
  if (slug === "agenda") {
    return <Panel title="Child agenda" eyebrow={getClassName(child.classId)}><SimpleList empty="No agenda items." items={agendaToItems(childAgenda)} /></Panel>;
  }
  if (slug === "evaluations") {
    return <Panel title="Child evaluations" eyebrow="Marks"><DataTable columns={["Student", "Class", "Subject", "Title", "Mark", "Date"]} rows={evaluationsToRows(childEvaluations)} /></Panel>;
  }
  if (slug === "messages") {
    return (
      <Panel title="Teacher messages" eyebrow="Read-only parent inbox">
        <SimpleList empty="No teacher messages yet." items={messageItemsForUser(user)} />
      </Panel>
    );
  }
  return <Panel title="Announcements" eyebrow="Administration"><SimpleList empty="No announcements." items={announcementsFor(user, child.classId).map((announcement) => ({ title: announcement.title, meta: formatDate(announcement.date), body: announcement.body }))} /></Panel>;
}

function TeacherSection({ user, slug }: { user: PortalUser; slug: string }) {
  const teacher = teacherForUser(user);

  if (!teacher) {
    return (
      <MissingProfilePanel
        title="Teacher profile not linked"
        body="This teacher account exists, but no teacher profile is linked yet."
      />
    );
  }

  const teacherSchedules = schedules.filter((entry) => entry.teacherId === teacher.id);
  const teacherClasses = classes.filter((entry) => teacher.classIds.includes(entry.id));

  if (slug === "my-schedule") {
    return <Panel title="My teaching schedule" eyebrow="Live timetable"><DataTable columns={["Day", "Period", "Class", "Subject", "Teacher", "Time", "Room"]} rows={scheduleRows(teacherSchedules)} /></Panel>;
  }
  if (slug === "my-classes") {
    return (
      <div className="portal-grid-two">
        <Panel title="Assigned classes" eyebrow="Classes"><DataTable columns={["Class", "Cycle", "Students in demo", "Homeroom"]} rows={teacherClasses.map((schoolClass) => [schoolClass.name, schoolClass.cycle, students.filter((student) => student.classId === schoolClass.id).length, schoolClass.homeroomTeacherId === teacher.id ? "Yes" : "No"])} /></Panel>
        <Panel title="Student lists" eyebrow="Roster"><DataTable columns={["Student", "Class", "Entrance exam"]} rows={students.filter((student) => teacher.classIds.includes(student.classId)).map((student) => [getStudentName(student.id), getClassName(student.classId), student.entranceExamStatus])} /></Panel>
      </div>
    );
  }
  if (slug === "attendance") {
    return <TeacherAttendanceManager user={user} />;
  }
  if (slug === "session-reports") {
    return <TeacherStudentReportsManager user={user} />;
  }
  if (slug === "agenda-homework") {
    return (
      <div className="portal-grid-two">
        <Panel title="Create agenda item" eyebrow="Homework"><PrototypeForm currentUser={user} title="Agenda/Homework" fields={["Title", "Subject", "Class", "Due date", "Description", "Attachment"]} submitLabel="Publish agenda" /></Panel>
        <Panel title="My agenda items" eyebrow="Published"><SimpleList empty="No items." items={agendaToItems(agendaItems.filter((item) => item.teacherId === teacher.id))} /></Panel>
      </div>
    );
  }
  if (slug === "student-remarks") {
    return <Panel title="Student remarks" eyebrow="Individual notes"><PrototypeForm currentUser={user} title="Add student remark" fields={["Student", "Class", "Remark", "Visible to parent", "Visible to student"]} submitLabel="Save remark" /></Panel>;
  }
  if (slug === "library") {
    return (
      <div className="portal-grid-two">
        <Panel title="Upload file" eyebrow="Library"><PrototypeForm currentUser={user} title="Class document" fields={["Title", "Subject", "Class", "Description", "File"]} submitLabel="Publish file" /></Panel>
        <Panel title="My files" eyebrow="Documents"><SimpleList empty="No files." items={filesToItems(libraryFiles.filter((file) => file.uploadedByUserId === user.id))} /></Panel>
      </div>
    );
  }
  return (
    <TeacherMessageCenter user={user} />
  );
}

function splitName(displayName: string) {
  const parts = displayName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "New",
    lastName: parts.slice(1).join(" ") || "User",
  };
}

function makeInitials(displayName: string) {
  return displayName
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "U";
}

function AdminUsersManager() {
  const [roleFilter, setRoleFilter] = useState<PortalRole | "all">("all");
  const [status, setStatus] = useState("");
  const visibleUsers = users.filter((user) => roleFilter === "all" || user.role === roleFilter);

  function addUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const displayName = String(formData.get("displayName") ?? "").trim() || "New User";
    const role = String(formData.get("role") ?? "student") as PortalRole;
    const username = String(formData.get("username") ?? "").trim();
    const password = String(formData.get("password") ?? "").trim();
    const userId = `user-${role}-${Date.now()}`;
    const name = splitName(displayName);

    if (!username || !password) {
      setStatus("Username and password are required.");
      return;
    }

    updatePortalData((data) => {
      data.users.push({
        id: userId,
        username,
        password,
        role,
        displayName,
        avatarInitials: makeInitials(displayName),
      });

      if (role === "teacher") {
        data.teachers.push({
          id: `teacher-${Date.now()}`,
          userId,
          firstName: name.firstName,
          lastName: name.lastName,
          subjects: data.subjects[0]?.id ? [data.subjects[0].id] : [],
          classIds: [],
        });
      }

      if (role === "student") {
        data.students.push({
          id: `student-${Date.now()}`,
          userId,
          firstName: name.firstName,
          lastName: name.lastName,
          classId: data.classes[0]?.id || "g1",
          parentIds: [],
          dateOfBirth: todayDate(),
          entranceExamStatus: "pending",
        });
      }

      if (role === "parent") {
        data.parents.push({
          id: `parent-${Date.now()}`,
          userId,
          firstName: name.firstName,
          lastName: name.lastName,
          phone: "",
          studentIds: [],
        });
      }

      if (role === "psychologist") {
        data.psychologists.push({
          id: `psychologist-${Date.now()}`,
          userId,
          assignedStudentIds: [],
          parentContactEnabled: false,
        });
      }
    });

    setStatus(`${displayName} account created and saved.`);
    form.reset();
  }

  return (
    <div className="portal-admin-manager">
      <section className="portal-card">
        <div className="portal-panel-head">
          <div>
            <p className="portal-kicker">Accounts</p>
            <h2>Create login</h2>
          </div>
        </div>
        <form className="portal-form" onSubmit={addUser}>
          <div className="portal-form-grid">
            <label>
              <span>Full name</span>
              <input name="displayName" placeholder="Full name" />
            </label>
            <label>
              <span>Role</span>
              <select name="role" defaultValue="student">
                <option value="student">Student</option>
                <option value="parent">Parent</option>
                <option value="teacher">Teacher</option>
                <option value="admin">Admin</option>
                <option value="psychologist">Psychologist</option>
              </select>
            </label>
            <label>
              <span>Username</span>
              <input name="username" placeholder="username" />
            </label>
            <label>
              <span>Password</span>
              <input name="password" placeholder="password" />
            </label>
          </div>
          {status ? <div className="portal-success">{status}</div> : null}
          <div className="portal-form-actions">
            <button type="submit" className="portal-primary-button">
              Create account
            </button>
          </div>
        </form>
      </section>

      <section className="portal-card">
        <div className="portal-panel-head">
          <div>
            <p className="portal-kicker">Credentials</p>
            <h2>All usernames and passwords</h2>
          </div>
          <label className="portal-inline-filter">
            <span>Role</span>
            <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as PortalRole | "all")}>
              <option value="all">All roles</option>
              <option value="student">Students</option>
              <option value="parent">Parents</option>
              <option value="teacher">Teachers</option>
              <option value="admin">Admins</option>
              <option value="psychologist">Psychologists</option>
            </select>
          </label>
        </div>
        <DataTable
          columns={["Name", "Role", "Username", "Password"]}
          rows={visibleUsers.map((user) => [
            user.displayName,
            roleLabels[user.role],
            user.username,
            user.password,
          ])}
        />
      </section>
    </div>
  );
}

function AdminSection({ user, slug }: { user: PortalUser; slug: string }) {
  if (slug === "users") {
    return <AdminUsersManager />;
  }
  if (slug === "students") {
    return <AdminStudentsManager />;
  }
  if (slug === "parents") {
    return <AdminParentsManager />;
  }
  if (slug === "teachers") {
    return <AdminTeachersManager />;
  }
  if (slug === "classes") {
    return <AdminClassesManager />;
  }
  if (slug === "schedules") {
    return <AdminScheduleBuilder />;
  }
  if (slug === "attendance") {
    return <AdminAttendanceBrowser />;
  }
  if (slug === "session-reports") {
    return <AdminStudentReportsBrowser />;
  }
  if (slug === "agenda") {
    return <AdminAgendaManager />;
  }
  if (slug === "evaluations") {
    return (
      <div className="portal-grid-two">
        <Panel title="Evaluations" eyebrow="Marks"><DataTable columns={["Student", "Class", "Subject", "Title", "Mark", "Date"]} rows={evaluationsToRows()} /></Panel>
        <Panel title="Add evaluation" eyebrow="Marks"><PrototypeForm currentUser={user} title="Evaluation" fields={["Student", "Class", "Subject", "Title", "Mark", "Maximum mark", "Date", "Teacher", "Comment"]} submitLabel="Save evaluation" /></Panel>
      </div>
    );
  }
  if (slug === "library") {
    return <Panel title="Library files" eyebrow="All uploaded documents"><SimpleList empty="No files." items={filesToItems()} /></Panel>;
  }
  if (slug === "messages") {
    return <Panel title="Teacher to parent messages" eyebrow="Administration can review every sent notice"><SimpleList empty="No teacher messages." items={messageListItems()} /></Panel>;
  }
  if (slug === "announcements") {
    return (
      <div className="portal-grid-two">
        <Panel title="Announcements" eyebrow="Posts"><SimpleList empty="No announcements." items={announcements.map((announcement) => ({ title: announcement.title, meta: formatDate(announcement.date), body: announcement.body, badge: announcementAudienceLabel(announcement) }))} /></Panel>
        <Panel title="Publish announcement" eyebrow="Create"><AnnouncementComposer /></Panel>
      </div>
    );
  }
  if (slug === "excel-import") {
    return <Panel title="Excel import center" eyebrow="Templates and upload preview"><ExcelImportPreview full /></Panel>;
  }
  return (
    <div className="portal-grid-two">
      <Panel title="School information" eyebrow="Settings"><SimpleList empty="No information." items={[{ title: schoolInfo.grades, meta: "Grades", body: schoolInfo.curriculum }, { title: schoolInfo.tuition, meta: "Financial policy", body: schoolInfo.books }, { title: "Entrance exam", meta: "Admissions", body: schoolInfo.admission }]} /></Panel>
      <Panel title="Visibility controls" eyebrow="Prototype"><PrototypeForm currentUser={user} title="Portal permissions" fields={["Parent attendance visibility", "Student remarks visibility", "Psychologist parent contact", "Announcement audience"]} submitLabel="Save settings" /></Panel>
    </div>
  );
}

function PsychologistSection({ user, slug }: { user: PortalUser; slug: string }) {
  const psychologist = psychologistForUser(user);

  if (!psychologist) {
    return (
      <MissingProfilePanel
        title="Psychologist profile not linked"
        body="This account exists, but no psychologist profile is linked yet."
      />
    );
  }

  const assignedCases = psychologistCases.filter((entry) =>
    psychologist.assignedStudentIds.includes(entry.studentId),
  );
  const assignedStudents = students.filter((student) =>
    psychologist.assignedStudentIds.includes(student.id),
  );

  if (slug === "student-follow-up") {
    return <Panel title="Assigned student profiles" eyebrow="Limited scope"><DataTable columns={["Student", "Class", "Entrance exam", "Latest status"]} rows={assignedStudents.map((student) => [getStudentName(student.id), getClassName(student.classId), student.entranceExamStatus, assignedCases.find((entry) => entry.studentId === student.id)?.status ?? "normal"])} /></Panel>;
  }
  if (slug === "private-notes") {
    return (
      <div className="portal-grid-two">
        <Panel title="Private notes" eyebrow="Confidential"><SimpleList empty="No notes." items={assignedCases.map((entry) => ({ title: getStudentName(entry.studentId), meta: entry.status, body: entry.privateNote }))} /></Panel>
        <Panel title="Add private note" eyebrow="Not visible by default"><PrototypeForm currentUser={user} title="Follow-up note" fields={["Student", "Case status", "Private note", "Next action"]} submitLabel="Save note" /></Panel>
      </div>
    );
  }
  if (slug === "cases") {
    return <Panel title="Cases" eyebrow="Normal, follow-up, urgent, resolved"><SimpleList empty="No cases." items={psychologistCaseItems(assignedCases)} /></Panel>;
  }
  if (slug === "messages") {
    return (
      <div className="portal-grid-two">
        <Panel title="Messages" eyebrow="Administration"><SimpleList empty="No messages." items={messageItemsForUser(user)} /></Panel>
        <Panel title="Send message" eyebrow="Permission aware"><PrototypeForm currentUser={user} title="New message" fields={["Receiver", "Subject", "Message"]} submitLabel="Send message" /></Panel>
      </div>
    );
  }
  return <Panel title="Reports" eyebrow="Follow-up history"><SimpleList empty="No reports." items={psychologistCaseItems(assignedCases)} /></Panel>;
}

function psychologistCaseItems(items = psychologistCases) {
  return items.map((item) => ({
    title: getStudentName(item.studentId),
    meta: `${item.status} · updated ${formatDate(item.lastUpdated)}`,
    body: item.summary,
    badge: item.status,
  }));
}

function allowedRemarkItems(assignedStudentIds: string[]) {
  return sessionReports
    .flatMap((report) => report.individualRemarks)
    .filter((remark) => assignedStudentIds.includes(remark.studentId))
    .map((remark) => ({
      title: getStudentName(remark.studentId),
      meta: "Teacher remark allowed by administration",
      body: remark.remark,
    }));
}

export function LegacyExcelImportPreview({ full = false }: { full?: boolean }) {
  const templates = [
    "Student + parent account creation",
    "Teacher account creation",
    "Class student lists",
    "Class schedules",
    "Teacher schedules",
    "Attendance sheets",
  ];

  return (
    <>
      <div className="portal-template-grid">
        {templates.map((template) => (
          <button key={template} type="button">
            <PortalIcon name="excel" />
            <span>{template}</span>
          </button>
        ))}
      </div>
      {full ? (
        <PrototypeForm
          title="Upload and preview workbook"
          fields={["Template type", "Excel file", "Import notes"]}
          submitLabel="Preview rows"
        />
      ) : null}
      <SimpleList
        empty="No imports."
        items={excelImports.map((item) => ({
          title: item.templateName,
          meta: `${item.validRows} valid · ${item.invalidRows} invalid`,
          body: item.notes.join(". "),
          badge: item.status,
        }))}
      />
    </>
  );
}

function ExcelImportPreview({ full = false }: { full?: boolean }) {
  const templates = [
    {
      id: "student-parent",
      label: "Student + parent account creation",
      columns: ["Student First Name", "Student Last Name", "Student Class", "Student Username", "Student Password", "Parent First Name", "Parent Last Name", "Parent Phone", "Parent Username", "Parent Password"],
      sample: ["John", "Smith", "Grade 5", "", "", "Maya", "Smith", "+961 70 000 000", "", ""],
    },
    {
      id: "teacher",
      label: "Teacher account creation",
      columns: ["Teacher First Name", "Teacher Last Name", "Subject", "Classes Assigned", "Username", "Password"],
      sample: ["Rita", "Hobeika", "Mathematics", "Grade 5;Grade 6", "", ""],
    },
    {
      id: "classes",
      label: "Class creation",
      columns: ["Class", "Cycle", "Homeroom Teacher"],
      sample: ["Grade 6", "Primary", "Mona Daher"],
    },
    {
      id: "class-schedule",
      label: "Class schedules",
      columns: ["Class", "Day", "Period", "Start Time", "End Time", "Subject", "Teacher", "Room"],
      sample: ["Grade 5", "Monday", "1", "8:00", "8:45", "Mathematics", "Mona Daher", "Room 204"],
    },
    {
      id: "attendance",
      label: "Attendance sheets",
      columns: ["Date", "Class", "Teacher", "Subject", "Period", "Student", "Status"],
      sample: [todayDate(), "Grade 5", "Mona Daher", "Mathematics", "1", "Georges Mansour", "present"],
    },
    {
      id: "announcements",
      label: "Announcements",
      columns: ["Title", "Body", "Audience", "Class", "Date"],
      sample: ["Reminder", "Bring signed forms tomorrow.", "parents", "", todayDate()],
    },
    {
      id: "evaluations",
      label: "Evaluations",
      columns: ["Student", "Class", "Subject", "Title", "Mark", "Maximum Mark", "Date", "Teacher", "Comment"],
      sample: ["Georges Mansour", "Grade 5", "Mathematics", "Quiz", "16", "20", todayDate(), "Mona Daher", "Good progress"],
    },
  ];
  const [templateId, setTemplateId] = useState(templates[0].id);
  const [previewRows, setPreviewRows] = useState<Array<Record<string, string>>>([]);
  const [status, setStatus] = useState("");
  const activeTemplate = templates.find((template) => template.id === templateId) ?? templates[0];

  function downloadTemplate(template: typeof templates[number]) {
    const csv = [template.columns, template.sample]
      .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${template.id}-template.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const rows = parseCsvRows(String(reader.result ?? ""));
      setPreviewRows(rows);
      setStatus(`${rows.length} row${rows.length === 1 ? "" : "s"} ready to import.`);
    };
    reader.readAsText(file);
  }

  function applyImport() {
    updatePortalData((data) => {
      previewRows.forEach((row) => {
        if (templateId === "student-parent" || templateId === "class-list") {
          const firstName = row["Student First Name"] || "Student";
          const lastName = row["Student Last Name"] || "Imported";
          const classId = findClassId(row["Student Class"] || row.Class) || data.classes[0]?.id || "g1";
          const studentUserId = `user-student-${Date.now()}-${Math.random()}`;
          const studentId = `student-${Date.now()}-${Math.random()}`;
          const studentUsername =
            row["Student Username"] ||
            row.Username ||
            `${firstName}.${lastName}.${getClassName(classId).replace("Grade ", "g")}`.toLowerCase().replaceAll(" ", "");

          data.users.push({
            id: studentUserId,
            username: studentUsername,
            password: row["Student Password"] || row.Password || "school2026",
            role: "student",
            displayName: `${firstName} ${lastName}`,
            avatarInitials: `${firstName[0] ?? "S"}${lastName[0] ?? "I"}`.toUpperCase(),
          });
          data.students.push({
            id: studentId,
            userId: studentUserId,
            firstName,
            lastName,
            classId,
            parentIds: [],
            dateOfBirth: todayDate(),
            entranceExamStatus: "passed",
          });

          if (templateId === "student-parent") {
            const parentFirstName = row["Parent First Name"] || "Parent";
            const parentLastName = row["Parent Last Name"] || lastName;
            const parentUserId = `user-parent-${Date.now()}-${Math.random()}`;
            const parentId = `parent-${Date.now()}-${Math.random()}`;
            data.users.push({
              id: parentUserId,
              username: row["Parent Username"] || `parent.${firstName}.${lastName}`.toLowerCase(),
              password: row["Parent Password"] || "school2026",
              role: "parent",
              displayName: `${parentFirstName} ${parentLastName}`,
              avatarInitials: `${parentFirstName[0] ?? "P"}${parentLastName[0] ?? "I"}`.toUpperCase(),
            });
            data.parents.push({
              id: parentId,
              userId: parentUserId,
              firstName: parentFirstName,
              lastName: parentLastName,
              phone: row["Parent Phone"] || "",
              studentIds: [studentId],
            });
            const student = data.students.find((entry) => entry.id === studentId);
            if (student) student.parentIds = [parentId];
          }
          return;
        }

        if (templateId === "teacher") {
          const firstName = row["Teacher First Name"] || "Teacher";
          const lastName = row["Teacher Last Name"] || "Imported";
          const teacherUserId = `user-teacher-${Date.now()}-${Math.random()}`;
          const teacherId = `teacher-${Date.now()}-${Math.random()}`;
          const subjectId = findSubjectId(row.Subject) || data.subjects[0]?.id || "math";
          const classIds = (row["Classes Assigned"] || "")
            .split(";")
            .map((name) => findClassId(name.trim()))
            .filter((classId): classId is string => Boolean(classId));

          data.users.push({
            id: teacherUserId,
            username: row.Username || `${firstName}.${lastName}`.toLowerCase(),
            password: row.Password || "school2026",
            role: "teacher",
            displayName: `${firstName} ${lastName}`,
            avatarInitials: `${firstName[0] ?? "T"}${lastName[0] ?? "I"}`.toUpperCase(),
          });
          data.teachers.push({
            id: teacherId,
            userId: teacherUserId,
            firstName,
            lastName,
            subjects: [subjectId],
            classIds,
          });
          return;
        }

        if (templateId === "announcements") {
          data.announcements.push({
            id: `an-${Date.now()}-${Math.random()}`,
            title: row.Title || "Imported announcement",
            body: row.Body || "",
            targetAudience: normalizeAudience(row.Audience),
            classId: findClassId(row.Class),
            date: row.Date || todayDate(),
            attachmentTitles: [],
          });
          return;
        }

        if (templateId === "classes") {
          const className = row.Class || "Imported Class";
          if (!data.classes.some((schoolClass) => schoolClass.name === className)) {
            const classId = `class-${Date.now()}-${Math.random()}`;
            const homeroomTeacherId = findTeacherId(row["Homeroom Teacher"]);
            data.classes.push({
              id: classId,
              name: className,
              cycle: row.Cycle === "Middle" || row.Cycle === "Kindergarten" ? row.Cycle : "Primary",
              homeroomTeacherId,
            });
            const assignedTeacher = data.teachers.find((teacher) => teacher.id === homeroomTeacherId);
            if (assignedTeacher && !assignedTeacher.classIds.includes(classId)) {
              assignedTeacher.classIds.push(classId);
            }
          }
          return;
        }

        if (templateId === "class-schedule") {
          data.schedules.push({
            id: `sch-${Date.now()}-${Math.random()}`,
            classId: findClassId(row.Class) || data.classes[0]?.id || "g1",
            teacherId: findTeacherId(row.Teacher) || data.teachers[0]?.id || "teacher-1",
            subjectId: findSubjectId(row.Subject) || data.subjects[0]?.id || "math",
            day: row.Day || "Monday",
            period: Number(row.Period) || 1,
            startTime: row["Start Time"] || "8:00",
            endTime: row["End Time"] || "8:45",
            room: row.Room || "Room",
          });
          return;
        }

        if (templateId === "attendance") {
          const studentId = findStudentId(row.Student);
          data.attendance.push({
            id: `att-${Date.now()}-${Math.random()}`,
            date: row.Date || todayDate(),
            classId: findClassId(row.Class) || data.classes[0]?.id || "g1",
            teacherId: findTeacherId(row.Teacher) || data.teachers[0]?.id || "teacher-1",
            subjectId: findSubjectId(row.Subject) || data.subjects[0]?.id || "math",
            period: Number(row.Period) || 1,
            records: studentId ? [{ studentId, status: normalizeAttendance(row.Status) }] : [],
          });
          return;
        }

        if (templateId === "evaluations") {
          data.evaluations.push({
            id: `ev-${Date.now()}-${Math.random()}`,
            studentId: findStudentId(row.Student) || data.students[0]?.id || "student-1",
            classId: findClassId(row.Class) || data.students[0]?.classId || "g1",
            subjectId: findSubjectId(row.Subject) || data.subjects[0]?.id || "math",
            title: row.Title || "Imported evaluation",
            mark: Number(row.Mark) || 0,
            maximumMark: Number(row["Maximum Mark"]) || 20,
            date: row.Date || todayDate(),
            teacherId: findTeacherId(row.Teacher) || data.teachers[0]?.id || "teacher-1",
            comment: row.Comment || "",
          });
        }
      });

      data.excelImports.push({
        id: `imp-${Date.now()}`,
        templateName: activeTemplate.label,
        uploadedByUserId: "user-admin-1",
        uploadedAt: todayDate(),
        status: "imported",
        validRows: previewRows.length,
        invalidRows: 0,
        notes: ["Imported from an Excel-ready CSV template."],
      });
    });
    setStatus("Import applied across the portal.");
    setPreviewRows([]);
  }

  return (
    <>
      <div className="portal-template-grid">
        {templates.map((template) => (
          <button key={template.id} type="button" onClick={() => downloadTemplate(template)}>
            <span>{template.label}</span>
            <small>Download CSV</small>
          </button>
        ))}
      </div>
      {full ? (
        <div className="portal-import-box">
          <label>
            <span>Template type</span>
            <select value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>Upload filled template</span>
            <input type="file" accept=".csv,.txt" onChange={handleUpload} />
          </label>
          {status ? <div className="portal-success">{status}</div> : null}
          {previewRows.length > 0 ? (
            <>
              <DataTable columns={Object.keys(previewRows[0])} rows={previewRows.slice(0, 8).map((row) => Object.values(row))} />
              <div className="portal-form-actions">
                <button type="button" className="portal-primary-button" onClick={applyImport}>
                  Confirm import
                </button>
              </div>
            </>
          ) : null}
        </div>
      ) : null}
      <SimpleList
        empty="No imports."
        items={excelImports.map((item) => ({
          title: item.templateName,
          meta: `${item.validRows} valid · ${item.invalidRows} invalid`,
          body: item.notes.join(". "),
          badge: item.status,
        }))}
      />
    </>
  );
}

function parseCsvRows(value: string) {
  const lines = value.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const headers = lines[0]?.split(",").map((header) => header.replaceAll('"', "").trim()) ?? [];

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((cell) => cell.replaceAll('"', "").trim());
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function findClassId(name: string) {
  return classes.find((schoolClass) => schoolClass.name.toLowerCase() === name?.toLowerCase())?.id;
}

function findSubjectId(name: string) {
  return subjects.find((subject) => subject.name.toLowerCase() === name?.toLowerCase())?.id;
}

function findTeacherId(name: string) {
  return teachers.find((teacher) => `${teacher.firstName} ${teacher.lastName}`.toLowerCase() === name?.toLowerCase())?.id;
}

function findStudentId(name: string) {
  return students.find((student) => `${student.firstName} ${student.lastName}`.toLowerCase() === name?.toLowerCase())?.id;
}

function normalizeAudience(value: string) {
  const normalized = value.toLowerCase();
  if (normalized === "parent" || normalized === "parents") return "parent";
  if (normalized === "student" || normalized === "students") return "student";
  if (normalized === "teacher" || normalized === "teachers") return "teacher";
  if (normalized === "psychologist") return "psychologist";
  if (normalized === "admin" || normalized === "administration") return "admin";
  if (normalized === "specific-class") return "specific-class";
  return "all";
}

function normalizeAttendance(value: string) {
  const normalized = value.toLowerCase();
  if (normalized === "absent" || normalized === "late" || normalized === "excused") {
    return normalized;
  }

  return "present";
}
