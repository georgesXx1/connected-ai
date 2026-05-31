"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

import { readableNow, todayDate, updatePortalData } from "@/lib/portal/client-store";
import {
  classes,
  getClassName,
  getTeacherName,
  schoolInfo,
  students,
  subjects,
  teachers,
  users,
} from "@/lib/portal/mock-data";
import type { PortalRole, PortalUser } from "@/lib/portal/types";
import { roleLabels } from "@/lib/portal/utils";

export type PortalIconName =
  | "dashboard"
  | "schedule"
  | "agenda"
  | "evaluations"
  | "documents"
  | "messages"
  | "announcements"
  | "child"
  | "attendance"
  | "classes"
  | "reports"
  | "remarks"
  | "library"
  | "users"
  | "students"
  | "parents"
  | "teachers"
  | "settings"
  | "excel"
  | "cases"
  | "notes"
  | "profile";

export type NavItem = {
  label: string;
  href: string;
  icon: PortalIconName;
};

export const iconPaths: Record<PortalIconName, React.ReactNode> = {
  dashboard: (
    <>
      <path d="M4 5h6v6H4z" />
      <path d="M14 5h6v4h-6z" />
      <path d="M14 13h6v6h-6z" />
      <path d="M4 15h6v4H4z" />
    </>
  ),
  schedule: (
    <>
      <path d="M7 3v4" />
      <path d="M17 3v4" />
      <path d="M4 8h16" />
      <rect x="4" y="5" width="16" height="15" rx="3" />
      <path d="M8 12h3" />
      <path d="M13 16h3" />
    </>
  ),
  agenda: (
    <>
      <path d="M5 4h11l3 3v13H5z" />
      <path d="M16 4v4h4" />
      <path d="M8 12h8" />
      <path d="M8 16h6" />
    </>
  ),
  evaluations: (
    <>
      <path d="M5 19V5" />
      <path d="M5 19h15" />
      <path d="M9 16v-5" />
      <path d="M13 16V8" />
      <path d="M17 16v-3" />
    </>
  ),
  documents: (
    <>
      <path d="M7 3h8l4 4v14H7z" />
      <path d="M15 3v5h5" />
      <path d="M10 13h7" />
      <path d="M10 17h5" />
    </>
  ),
  messages: (
    <>
      <path d="M4 6h16v10H8l-4 4z" />
      <path d="M8 10h8" />
      <path d="M8 13h5" />
    </>
  ),
  announcements: (
    <>
      <path d="M4 12h4l9-5v10l-9-5H4z" />
      <path d="M8 12v5" />
      <path d="M19 9a4 4 0 0 1 0 6" />
    </>
  ),
  child: (
    <>
      <circle cx="12" cy="7" r="3" />
      <path d="M6 21a6 6 0 0 1 12 0" />
      <path d="M8 14l4 3 4-3" />
    </>
  ),
  attendance: (
    <>
      <path d="M5 12l4 4L19 6" />
      <path d="M4 4h16v16H4z" />
    </>
  ),
  classes: (
    <>
      <path d="M4 6h16" />
      <path d="M6 6v14" />
      <path d="M18 6v14" />
      <path d="M8 10h8" />
      <path d="M8 14h8" />
    </>
  ),
  reports: (
    <>
      <path d="M6 3h12v18H6z" />
      <path d="M9 8h6" />
      <path d="M9 12h6" />
      <path d="M9 16h4" />
    </>
  ),
  remarks: (
    <>
      <path d="M5 5h14v10H8l-3 4z" />
      <path d="M9 9h6" />
      <path d="M9 12h4" />
    </>
  ),
  library: (
    <>
      <path d="M5 4h4v16H5z" />
      <path d="M10 4h4v16h-4z" />
      <path d="M15 6h4v14h-4z" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2" />
      <path d="M3 20a6 6 0 0 1 12 0" />
      <path d="M14 18a5 5 0 0 1 7 2" />
    </>
  ),
  students: (
    <>
      <path d="M3 8l9-4 9 4-9 4z" />
      <path d="M7 10v5c3 2 7 2 10 0v-5" />
    </>
  ),
  parents: (
    <>
      <circle cx="8" cy="8" r="3" />
      <circle cx="16" cy="8" r="3" />
      <path d="M3 20a5 5 0 0 1 10 0" />
      <path d="M11 20a5 5 0 0 1 10 0" />
    </>
  ),
  teachers: (
    <>
      <path d="M4 5h16v10H4z" />
      <path d="M8 19h8" />
      <path d="M12 15v4" />
      <path d="M8 9h8" />
    </>
  ),
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3v3" />
      <path d="M12 18v3" />
      <path d="M3 12h3" />
      <path d="M18 12h3" />
      <path d="M5.5 5.5l2 2" />
      <path d="M16.5 16.5l2 2" />
      <path d="M18.5 5.5l-2 2" />
      <path d="M7.5 16.5l-2 2" />
    </>
  ),
  excel: (
    <>
      <path d="M6 4h12v16H6z" />
      <path d="M9 8h6" />
      <path d="M9 12h6" />
      <path d="M9 16h6" />
      <path d="M12 8v8" />
    </>
  ),
  cases: (
    <>
      <path d="M7 7V5h10v2" />
      <path d="M5 7h14v12H5z" />
      <path d="M9 13h6" />
      <path d="M12 10v6" />
    </>
  ),
  notes: (
    <>
      <path d="M5 4h14v16H5z" />
      <path d="M9 4v16" />
      <path d="M12 9h4" />
      <path d="M12 13h4" />
    </>
  ),
  profile: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M5 21a7 7 0 0 1 14 0" />
    </>
  ),
};

export function PortalIcon({ name }: { name: PortalIconName }) {
  return (
    <span className="portal-icon" aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        {iconPaths[name]}
      </svg>
    </span>
  );
}

export function PortalShell({
  user,
  role,
  navItems,
  children,
  activePath,
  pageTitle,
  pageEyebrow,
}: {
  user: PortalUser;
  role: PortalRole;
  navItems: NavItem[];
  children: React.ReactNode;
  activePath: string;
  pageTitle?: string;
  pageEyebrow?: string;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <main className={`portal-page ${isSidebarCollapsed ? "is-sidebar-collapsed" : ""}`}>
      <aside className="portal-sidebar">
        <div className="portal-sidebar-head">
          <Link href="/" className="portal-brand" title={schoolInfo.name}>
            <span className="portal-brand-text">
              <span className="portal-kicker">Private Portal</span>
              <strong>{schoolInfo.name}</strong>
            </span>
          </Link>
          <button
            type="button"
            className="portal-sidebar-toggle"
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!isSidebarCollapsed}
            onClick={() => setIsSidebarCollapsed((value) => !value)}
          >
            {isSidebarCollapsed ? ">" : "<"}
          </button>
        </div>

        <nav className="portal-nav" aria-label={`${roleLabels[role]} navigation`}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`portal-nav-link ${
                activePath === item.href ? "is-active" : ""
              }`}
              title={item.label}
            >
              <PortalIcon name={item.icon} />
              <span className="portal-nav-short" aria-hidden="true">
                {item.label.slice(0, 2)}
              </span>
              <span className="portal-nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="portal-sidebar-note">
          <strong>School information</strong>
          <span>{schoolInfo.grades}</span>
          <span>{schoolInfo.tuition}</span>
          <span>Entrance exam required for new students.</span>
        </div>
      </aside>

      <section className="portal-main">
        <header className="portal-topbar">
          <div>
            <p className="portal-kicker">{pageEyebrow ?? roleLabels[role]}</p>
            <h1>{pageTitle ?? `${roleLabels[role]} Dashboard`}</h1>
          </div>
          <div className="portal-user-chip">
            <span>{user.avatarInitials}</span>
            <div>
              <strong>{user.displayName}</strong>
              <small>{user.username}</small>
            </div>
            <form action="/api/portal/logout" method="post">
              <button type="submit">Sign out</button>
            </form>
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}

export function StatCard({
  label,
  value,
  detail,
  icon,
  href,
}: {
  label: string;
  value: string;
  detail: string;
  icon?: PortalIconName;
  href?: string;
}) {
  const content = (
    <>
      <div className="portal-stat-head">
        <p>{label}</p>
        {icon ? <PortalIcon name={icon} /> : null}
      </div>
      <strong>{value}</strong>
      <span>{detail}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="portal-card portal-stat portal-link-card">
        {content}
      </Link>
    );
  }

  return <article className="portal-card portal-stat">{content}</article>;
}

export function ActionGrid({
  actions,
}: {
  actions: Array<{
    title: string;
    body: string;
    href: string;
    icon: PortalIconName;
  }>;
}) {
  return (
    <div className="portal-action-grid">
      {actions.map((action) => (
        <Link key={action.href} href={action.href} className="portal-action-card">
          <PortalIcon name={action.icon} />
          <span>
            <strong>{action.title}</strong>
            <small>{action.body}</small>
          </span>
        </Link>
      ))}
    </div>
  );
}

export function Panel({
  title,
  eyebrow,
  children,
  actionHref,
  actionLabel = "Open page",
}: {
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <section className="portal-card">
      <div className="portal-panel-head">
        <div>
          {eyebrow ? <p className="portal-kicker">{eyebrow}</p> : null}
          <h2>{title}</h2>
        </div>
        {actionHref ? (
          <Link href={actionHref} className="portal-panel-action">
            {actionLabel}
          </Link>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function SimpleList({
  items,
  empty,
}: {
  items: Array<{ title: string; meta: string; body?: string; badge?: string }>;
  empty: string;
}) {
  if (items.length === 0) {
    return <div className="portal-empty">{empty}</div>;
  }

  return (
    <div className="portal-list">
      {items.map((item) => (
        <article key={`${item.title}-${item.meta}`} className="portal-list-item">
          <div>
            <strong>{item.title}</strong>
            <span>{item.meta}</span>
            {item.body ? <p>{item.body}</p> : null}
          </div>
          {item.badge ? <em>{item.badge}</em> : null}
        </article>
      ))}
    </div>
  );
}

export function DataTable({
  columns,
  rows,
}: {
  columns: string[];
  rows: Array<Array<string | number>>;
}) {
  return (
    <div className="portal-table-wrap">
      <table className="portal-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{column}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={row.join("-") || rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={`${cell}-${cellIndex}`}>{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PrototypeForm({
  title,
  fields,
  submitLabel,
  currentUser,
}: {
  title: string;
  fields: string[];
  submitLabel: string;
  currentUser?: PortalUser;
}) {
  const [status, setStatus] = useState("");
  const formId = useMemo(
    () => title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    [title],
  );

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const getValue = (field: string) =>
      String(formData.get(field) ?? "").trim();
    const getFileName = (field: string) => {
      const value = formData.get(field);
      return value instanceof File && value.name ? value.name : "";
    };
    const teacher = teachers.find((entry) => entry.userId === currentUser?.id);
    const normalizedTitle = title.toLowerCase();
    const normalizedSubmit = submitLabel.toLowerCase();

    updatePortalData((data) => {
      if (normalizedTitle.includes("announcement")) {
        const audience = getValue("Audience") || "all";
        data.announcements.push({
          id: `an-${Date.now()}`,
          title: getValue("Title") || "New announcement",
          body: getValue("Body") || "Announcement details will be completed soon.",
          targetAudience:
            audience === "specific-class"
              ? "specific-class"
              : audience === "parent" ||
                  audience === "student" ||
                  audience === "teacher" ||
                  audience === "admin" ||
                  audience === "psychologist"
                ? audience
                : "all",
          classId: audience === "specific-class" ? getValue("Class") : undefined,
          date: todayDate(),
          attachmentTitles: [getFileName("Attachment")].filter(Boolean),
        });
        return;
      }

      if (
        normalizedTitle.includes("agenda") ||
        normalizedSubmit.includes("publish agenda")
      ) {
        data.agendaItems.push({
          id: `ag-${Date.now()}`,
          title: getValue("Title") || "New agenda item",
          description: getValue("Description") || getValue("Homework") || "Agenda details.",
          subjectId: getValue("Subject") || subjects[0]?.id || "math",
          classId: getValue("Class") || classes[0]?.id || "g1",
          dueDate: getValue("Due date") || todayDate(),
          teacherId: teacher?.id || getValue("Teacher") || teachers[0]?.id || "teacher-1",
          attachmentTitles: [getFileName("Attachment")].filter(Boolean),
        });
        return;
      }

      if (
        normalizedTitle.includes("upload") ||
        normalizedTitle.includes("document") ||
        normalizedTitle.includes("class file")
      ) {
        const fileName = getFileName("File") || getFileName("Attachment");
        data.libraryFiles.push({
          id: `file-${Date.now()}`,
          title: getValue("Title") || fileName || "New class file",
          description: getValue("Description") || "Uploaded portal file.",
          subjectId: getValue("Subject") || subjects[0]?.id || "math",
          classId: getValue("Class") || classes[0]?.id || "g1",
          uploadedByUserId: currentUser?.id || users[0]?.id || "user-admin-1",
          uploadedAt: todayDate(),
          fileType: fileName.toLowerCase().endsWith(".pptx")
            ? "PPTX"
            : fileName.toLowerCase().endsWith(".docx")
              ? "DOCX"
              : fileName.toLowerCase().match(/\.(png|jpg|jpeg|webp)$/)
                ? "Image"
                : "PDF",
        });
        return;
      }

      if (normalizedTitle.includes("attendance")) {
        const classId = getValue("Class") || teacher?.classIds[0] || classes[0]?.id || "g1";
        data.attendance.push({
          id: `att-${Date.now()}`,
          date: getValue("Date") || todayDate(),
          classId,
          teacherId: teacher?.id || getValue("Teacher") || teachers[0]?.id || "teacher-1",
          subjectId: getValue("Subject") || subjects[0]?.id || "math",
          period: Number(getValue("Period")) || 1,
          records: data.students
            .filter((student) => student.classId === classId)
            .map((student) => ({ studentId: student.id, status: "present" })),
        });
        return;
      }

      if (normalizedTitle.includes("session report") || normalizedTitle.includes("class session")) {
        data.sessionReports.push({
          id: `sr-${Date.now()}`,
          date: getValue("Date") || todayDate(),
          classId: getValue("Class") || teacher?.classIds[0] || classes[0]?.id || "g1",
          teacherId: teacher?.id || getValue("Teacher") || teachers[0]?.id || "teacher-1",
          subjectId: getValue("Subject") || subjects[0]?.id || "math",
          period: Number(getValue("Period")) || 1,
          lessonTitle: getValue("Lesson title") || "Class session",
          completedWork: getValue("What was done") || "Session details saved.",
          homework: getValue("Homework"),
          generalRemark: getValue("General remark"),
          visibleToParents: true,
          individualRemarks: [],
        });
        return;
      }

      if (normalizedTitle.includes("message")) {
        data.messages.push({
          id: `msg-${Date.now()}`,
          senderId: currentUser?.id || users[0]?.id || "user-admin-1",
          receiverId: getValue("Receiver") || getValue("Teacher") || users[0]?.id || "user-admin-1",
          subject: getValue("Subject") || "Portal message",
          body: getValue("Message") || "Message body.",
          sentAt: readableNow(),
          read: false,
        });
        return;
      }

      if (normalizedTitle.includes("evaluation")) {
        data.evaluations.push({
          id: `ev-${Date.now()}`,
          studentId: getValue("Student") || students[0]?.id || "student-1",
          classId: getValue("Class") || students[0]?.classId || "g1",
          subjectId: getValue("Subject") || subjects[0]?.id || "math",
          title: getValue("Title") || "Evaluation",
          mark: Number(getValue("Mark")) || 0,
          maximumMark: Number(getValue("Maximum mark")) || 20,
          date: getValue("Date") || todayDate(),
          teacherId: teacher?.id || getValue("Teacher") || teachers[0]?.id || "teacher-1",
          comment: getValue("Comment"),
        });
        return;
      }

      if (normalizedTitle.includes("class setup") || normalizedTitle === "class") {
        const name = getValue("Class name") || getValue("Class") || "New Class";
        const classId = `class-${Date.now()}`;
        const homeroomTeacherId = getValue("Teacher") || undefined;
        data.classes.push({
          id: classId,
          name,
          cycle: getValue("Cycle") === "Middle" || getValue("Cycle") === "Kindergarten"
            ? getValue("Cycle") as "Middle" | "Kindergarten"
            : "Primary",
          homeroomTeacherId,
        });
        const assignedTeacher = data.teachers.find((entry) => entry.id === homeroomTeacherId);
        if (assignedTeacher && !assignedTeacher.classIds.includes(classId)) {
          assignedTeacher.classIds.push(classId);
        }
        return;
      }

      if (normalizedTitle.includes("schedule")) {
        data.schedules.push({
          id: `sch-${Date.now()}`,
          classId: getValue("Class") || classes[0]?.id || "g1",
          teacherId: getValue("Teacher") || teachers[0]?.id || "teacher-1",
          subjectId: getValue("Subject") || subjects[0]?.id || "math",
          day: getValue("Day") || "Monday",
          period: Number(getValue("Period")) || 1,
          startTime: getValue("Start time") || "8:00",
          endTime: getValue("End time") || "8:45",
          room: getValue("Room") || "Room",
        });
      }
    });

    setStatus(`${submitLabel} saved.`);
    event.currentTarget.reset();
  }

  return (
    <form className="portal-form" onSubmit={handleSubmit}>
      <h3>{title}</h3>
      <div className="portal-form-grid">
        {fields.map((field) => (
          <label key={field} htmlFor={`${formId}-${field}`}>
            <span>{field}</span>
            <PortalField id={`${formId}-${field}`} field={field} />
          </label>
        ))}
      </div>
      {status ? <div className="portal-success">{status}</div> : null}
      <div className="portal-form-actions">
        <button type="button" className="portal-secondary-button">
          Save draft
        </button>
        <button type="submit" className="portal-primary-button">
          {submitLabel}
        </button>
      </div>
    </form>
  );
}

function PortalField({ id, field }: { id: string; field: string }) {
  const normalized = field.toLowerCase();
  const baseProps = { id, name: field };

  if (normalized === "audience") {
    return (
      <select {...baseProps} defaultValue="all">
        <option value="all">All</option>
        <option value="parent">Parents</option>
        <option value="student">Students</option>
        <option value="teacher">Teachers</option>
        <option value="admin">Administration</option>
        <option value="psychologist">Psychologist / Counselor</option>
        <option value="specific-class">Specific class</option>
      </select>
    );
  }

  if (normalized === "class") {
    return (
      <select {...baseProps} defaultValue={classes[0]?.id}>
        {classes.map((schoolClass) => (
          <option key={schoolClass.id} value={schoolClass.id}>
            {schoolClass.name}
          </option>
        ))}
      </select>
    );
  }

  if (normalized === "subject") {
    return (
      <select {...baseProps} defaultValue={subjects[0]?.id}>
        {subjects.map((subject) => (
          <option key={subject.id} value={subject.id}>
            {subject.name}
          </option>
        ))}
      </select>
    );
  }

  if (normalized === "teacher") {
    return (
      <select {...baseProps} defaultValue={teachers[0]?.id}>
        {teachers.map((teacher) => (
          <option key={teacher.id} value={teacher.id}>
            {getTeacherName(teacher.id)}
          </option>
        ))}
      </select>
    );
  }

  if (normalized === "student") {
    return (
      <select {...baseProps} defaultValue={students[0]?.id}>
        {students.map((student) => (
          <option key={student.id} value={student.id}>
            {student.firstName} {student.lastName} · {getClassName(student.classId)}
          </option>
        ))}
      </select>
    );
  }

  if (normalized === "receiver") {
    return (
      <select {...baseProps} defaultValue={users[0]?.id}>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.displayName} · {roleLabels[user.role]}
          </option>
        ))}
      </select>
    );
  }

  if (normalized === "template type") {
    return (
      <select {...baseProps} defaultValue="student-parent">
        <option value="student-parent">Student + parent accounts</option>
        <option value="teacher">Teacher accounts</option>
        <option value="class-list">Class student lists</option>
        <option value="class-schedule">Class schedules</option>
        <option value="teacher-schedule">Teacher schedules</option>
        <option value="attendance">Attendance sheets</option>
        <option value="announcement">Announcements</option>
        <option value="evaluation">Evaluations</option>
      </select>
    );
  }

  if (normalized === "case status") {
    return (
      <select {...baseProps} defaultValue="normal">
        <option value="normal">Normal</option>
        <option value="needs-follow-up">Needs follow-up</option>
        <option value="urgent">Urgent</option>
        <option value="resolved">Resolved</option>
      </select>
    );
  }

  if (normalized === "cycle") {
    return (
      <select {...baseProps} defaultValue="Primary">
        <option value="Kindergarten">Kindergarten</option>
        <option value="Primary">Primary</option>
        <option value="Middle">Middle</option>
      </select>
    );
  }

  if (normalized === "day") {
    return (
      <select {...baseProps} defaultValue="Monday">
        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"].map((day) => (
          <option key={day} value={day}>
            {day}
          </option>
        ))}
      </select>
    );
  }

  if (normalized.includes("visible")) {
    return (
      <select {...baseProps} defaultValue="yes">
        <option value="yes">Yes</option>
        <option value="no">No</option>
      </select>
    );
  }

  if (
    normalized.includes("description") ||
    normalized === "body" ||
    normalized === "message" ||
    normalized.includes("remark") ||
    normalized.includes("note") ||
    normalized.includes("what was done") ||
    normalized === "homework"
  ) {
    return <textarea {...baseProps} placeholder={field} rows={4} />;
  }

  if (normalized.includes("date") || normalized === "due date") {
    return <input {...baseProps} type="date" />;
  }

  if (normalized.includes("time")) {
    return <input {...baseProps} type="time" />;
  }

  if (
    normalized.includes("file") ||
    normalized.includes("attachment")
  ) {
    return <input {...baseProps} type="file" />;
  }

  if (
    normalized === "period" ||
    normalized === "mark" ||
    normalized === "maximum mark"
  ) {
    return <input {...baseProps} type="number" placeholder={field} />;
  }

  return <input {...baseProps} placeholder={field} />;
}
