import { redirect } from "next/navigation";

import { PortalSectionView } from "@/components/portal/dashboards";
import { requirePortalRole } from "@/lib/portal/auth";
import type { PortalRole } from "@/lib/portal/types";

const roles = ["student", "parent", "teacher", "admin", "psychologist"] as const;
const sectionLookup = {
  student: [
    ["my-schedule", "Class Schedule", "schedule", "Your class timetable and periods."],
    ["agenda", "Agenda", "agenda", "Homework, agenda notes, and due dates."],
    ["announcements", "Announcements", "announcements", "Announcements sent to your class."],
  ],
  parent: [
    ["my-child", "My Child", "child", "Child profile, class, and entrance record."],
    ["child-schedule", "Child Schedule", "schedule", "Your child's class timetable."],
    ["attendance", "Attendance", "attendance", "Daily attendance filtered to your child."],
    ["agenda", "Agenda", "agenda", "Homework and agenda notes for your child."],
    ["evaluations", "Evaluations", "evaluations", "Marks, comments, and academic progress."],
    ["announcements", "Announcements", "announcements", "Posts for parents and your child's class."],
    ["messages", "Messages", "messages", "Teacher and administration conversations."],
  ],
  teacher: [
    ["my-schedule", "My Schedule", "schedule", "Your live weekly teaching timetable."],
    ["my-classes", "My Classes", "classes", "Assigned classes and student lists."],
    ["attendance", "Attendance", "attendance", "Fill attendance for class sessions."],
    ["session-reports", "Session Reports", "reports", "Record what happened in each session."],
    ["agenda-homework", "Agenda/Homework", "agenda", "Publish agenda and homework items."],
    ["library", "Library", "library", "Upload class files and worksheets."],
    ["messages", "Messages", "messages", "Communicate with parents and administration."],
  ],
  admin: [
    ["users", "Users", "users", "Manage all portal accounts."],
    ["students", "Students", "students", "Student lists from KG1 to Grade 9."],
    ["parents", "Parents", "parents", "Parent accounts and child links."],
    ["teachers", "Teachers", "teachers", "Teacher accounts, subjects, and classes."],
    ["classes", "Classes", "classes", "Class setup and homeroom teachers."],
    ["schedules", "Schedules", "schedule", "Class and teacher schedules."],
    ["attendance", "Attendance", "attendance", "Attendance by date, class, student, teacher."],
    ["session-reports", "Session Reports", "reports", "Teacher session reports."],
    ["agenda", "Agenda", "agenda", "Manage school agenda and homework."],
    ["evaluations", "Evaluations", "evaluations", "View and manage marks."],
    ["messages", "Messages", "messages", "Internal communication center."],
    ["announcements", "Announcements", "announcements", "Publish official school posts."],
    ["excel-import", "Excel Import", "excel", "Download templates and preview uploads."],
    ["settings", "Settings", "settings", "School information and visibility controls."],
  ],
  psychologist: [
    ["student-follow-up", "Student Follow-Up", "profile", "Assigned student profiles and context."],
    ["private-notes", "Private Notes", "notes", "Confidential notes not shown by default."],
    ["cases", "Cases", "cases", "Normal, follow-up, urgent, and resolved cases."],
    ["reports", "Reports", "reports", "Follow-up history and summaries."],
  ],
} as const;

function isPortalRole(value: string): value is PortalRole {
  return roles.includes(value as PortalRole);
}

export default async function PortalRoleSectionPage({
  params,
}: {
  params: Promise<{ role: string; section: string }>;
}) {
  const { role: roleParam, section: sectionSlug } = await params;

  if (!isPortalRole(roleParam)) {
    redirect("/portal");
  }

  const { user, redirectTo } = await requirePortalRole(roleParam);

  if (redirectTo || !user) {
    redirect(redirectTo ?? "/login");
  }

  const rawSection = sectionLookup[roleParam].find(([slug]) => slug === sectionSlug);

  if (!rawSection) {
    redirect(`/portal/${roleParam}`);
  }

  const section = {
    slug: rawSection[0],
    label: rawSection[1],
    icon: rawSection[2],
    description: rawSection[3],
  };

  return <PortalSectionView user={user} role={roleParam} section={section} />;
}
