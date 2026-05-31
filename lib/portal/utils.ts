import type { PortalRole } from "./types";

export const roleLabels: Record<PortalRole, string> = {
  admin: "Administration",
  teacher: "Teacher",
  student: "Student",
  parent: "Parent",
  psychologist: "Psychologist",
};

export const roleHomePaths: Record<PortalRole, string> = {
  admin: "/portal/admin",
  teacher: "/portal/teacher",
  student: "/portal/student",
  parent: "/portal/parent",
  psychologist: "/portal/psychologist",
};

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

export function classToUsernameGrade(className: string) {
  return className.toLowerCase().replace("grade ", "g").replace(/\s+/g, "");
}
