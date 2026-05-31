export type PortalRole =
  | "student"
  | "parent"
  | "teacher"
  | "admin"
  | "psychologist";

export type AttendanceStatus = "present" | "absent" | "late" | "excused";
export type CaseStatus = "normal" | "needs-follow-up" | "urgent" | "resolved";
export type ImportStatus = "ready" | "needs-review" | "imported";

export type PortalUser = {
  id: string;
  username: string;
  password: string;
  role: PortalRole;
  displayName: string;
  avatarInitials: string;
};

export type StudentProfile = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  classId: string;
  parentIds: string[];
  dateOfBirth: string;
  entranceExamStatus: "passed" | "scheduled" | "pending";
};

export type ParentProfile = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  phone: string;
  studentIds: string[];
};

export type TeacherProfile = {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  subjects: string[];
  classIds: string[];
};

export type AdminProfile = {
  id: string;
  userId: string;
  title: string;
};

export type PsychologistProfile = {
  id: string;
  userId: string;
  assignedStudentIds: string[];
  parentContactEnabled: boolean;
};

export type SchoolClass = {
  id: string;
  name: string;
  cycle: "Kindergarten" | "Primary" | "Middle";
  homeroomTeacherId?: string;
};

export type Subject = {
  id: string;
  name: string;
  ministryAligned: boolean;
};

export type SchedulePeriodConfig = {
  period: number;
  label: string;
  startTime: string;
  endTime: string;
  type: "class" | "recess";
};

export type ScheduleConfig = {
  days: string[];
  periods: SchedulePeriodConfig[];
};

export type Schedule = {
  id: string;
  classId: string;
  teacherId: string;
  subjectId: string;
  day: string;
  period: number;
  startTime: string;
  endTime: string;
  room: string;
};

export type Attendance = {
  id: string;
  date: string;
  classId: string;
  teacherId: string;
  subjectId: string;
  period: number;
  records: Array<{ studentId: string; status: AttendanceStatus }>;
};

export type SessionReport = {
  id: string;
  date: string;
  classId: string;
  teacherId: string;
  subjectId: string;
  period: number;
  lessonTitle: string;
  completedWork: string;
  homework: string;
  generalRemark: string;
  visibleToParents: boolean;
  individualRemarks: Array<{
    studentId: string;
    remark: string;
    visibleToParent: boolean;
  }>;
};

export type AgendaItem = {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  classId: string;
  dueDate: string;
  teacherId: string;
  attachmentTitles: string[];
};

export type Evaluation = {
  id: string;
  studentId: string;
  classId: string;
  subjectId: string;
  title: string;
  mark: number;
  maximumMark: number;
  date: string;
  teacherId: string;
  comment: string;
};

export type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  subject: string;
  body: string;
  sentAt: string;
  read: boolean;
  classId?: string;
  studentId?: string;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  targetAudience: "all" | PortalRole | "specific-class";
  classId?: string;
  classIds?: string[];
  date: string;
  attachmentTitles: string[];
};

export type LibraryFile = {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  classId: string;
  uploadedByUserId: string;
  uploadedAt: string;
  fileType: "PDF" | "DOCX" | "PPTX" | "Image" | "Worksheet";
};

export type UploadedExcelImport = {
  id: string;
  templateName: string;
  uploadedByUserId: string;
  uploadedAt: string;
  status: ImportStatus;
  validRows: number;
  invalidRows: number;
  notes: string[];
};

export type PsychologistCase = {
  id: string;
  studentId: string;
  status: CaseStatus;
  lastUpdated: string;
  summary: string;
  privateNote: string;
};
