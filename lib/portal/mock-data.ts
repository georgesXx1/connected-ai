import type {
  AdminProfile,
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

export const schoolInfo = {
  name: "1ere Ecole Officielle - Jbeil",
  grades: "Kindergarten 1 to Grade 9",
  tuition: "No tuition fees",
  books: "Books are donated by staff and benefactors.",
  curriculum:
    "The school follows the official rules and curriculum requirements of the Lebanese Ministry of Education.",
  admission: "New students must pass an entrance exam before acceptance.",
};

export const classes: SchoolClass[] = [
  { id: "kg1", name: "KG1", cycle: "Kindergarten", homeroomTeacherId: "teacher-1" },
  { id: "kg2", name: "KG2", cycle: "Kindergarten", homeroomTeacherId: "teacher-1" },
  { id: "g1", name: "Grade 1", cycle: "Primary", homeroomTeacherId: "teacher-2" },
  { id: "g2", name: "Grade 2", cycle: "Primary", homeroomTeacherId: "teacher-2" },
  { id: "g3", name: "Grade 3", cycle: "Primary", homeroomTeacherId: "teacher-2" },
  { id: "g4", name: "Grade 4", cycle: "Primary", homeroomTeacherId: "teacher-3" },
  { id: "g5", name: "Grade 5", cycle: "Primary", homeroomTeacherId: "teacher-3" },
  { id: "g6", name: "Grade 6", cycle: "Primary", homeroomTeacherId: "teacher-3" },
  { id: "g7", name: "Grade 7", cycle: "Middle" },
  { id: "g8", name: "Grade 8", cycle: "Middle" },
  { id: "g9", name: "Grade 9", cycle: "Middle" },
];

export const subjects: Subject[] = [
  { id: "arabic", name: "Arabic", ministryAligned: true },
  { id: "math", name: "Mathematics", ministryAligned: true },
  { id: "science", name: "Science", ministryAligned: true },
  { id: "french", name: "French", ministryAligned: true },
  { id: "civics", name: "Civics", ministryAligned: true },
  { id: "arts", name: "Arts", ministryAligned: true },
];

export const scheduleConfig: ScheduleConfig = {
  days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  periods: [
    { period: 1, label: "Period 1", startTime: "08:00", endTime: "08:45", type: "class" },
    { period: 2, label: "Period 2", startTime: "08:50", endTime: "09:35", type: "class" },
    { period: 3, label: "Period 3", startTime: "09:50", endTime: "10:35", type: "class" },
    { period: 4, label: "Period 4", startTime: "10:40", endTime: "11:25", type: "class" },
    { period: 5, label: "Period 5", startTime: "11:40", endTime: "12:25", type: "class" },
    { period: 6, label: "Period 6", startTime: "12:30", endTime: "13:15", type: "class" },
    { period: 7, label: "Period 7", startTime: "13:20", endTime: "14:05", type: "class" },
    { period: 8, label: "Period 8", startTime: "14:10", endTime: "14:55", type: "class" },
  ],
};

export const users: PortalUser[] = [
  { id: "user-student-1", username: "student1", password: "password123", role: "student", displayName: "Maya Haddad", avatarInitials: "MH" },
  { id: "user-student-2", username: "student2", password: "password123", role: "student", displayName: "Karim Nassar", avatarInitials: "KN" },
  { id: "user-student-3", username: "student3", password: "password123", role: "student", displayName: "Lea Khoury", avatarInitials: "LK" },
  { id: "user-student-4", username: "student4", password: "password123", role: "student", displayName: "Georges Mansour", avatarInitials: "GM" },
  { id: "user-student-5", username: "student5", password: "password123", role: "student", displayName: "Nour Saliba", avatarInitials: "NS" },
  { id: "user-parent-1", username: "parent1", password: "password123", role: "parent", displayName: "Rana Haddad", avatarInitials: "RH" },
  { id: "user-parent-2", username: "parent2", password: "password123", role: "parent", displayName: "Samir Nassar", avatarInitials: "SN" },
  { id: "user-parent-3", username: "parent3", password: "password123", role: "parent", displayName: "Mireille Khoury", avatarInitials: "MK" },
  { id: "user-parent-4", username: "parent4", password: "password123", role: "parent", displayName: "Joseph Mansour", avatarInitials: "JM" },
  { id: "user-parent-5", username: "parent5", password: "password123", role: "parent", displayName: "Tania Saliba", avatarInitials: "TS" },
  { id: "user-teacher-1", username: "teacher1", password: "password123", role: "teacher", displayName: "Nadine Farah", avatarInitials: "NF" },
  { id: "user-teacher-2", username: "teacher2", password: "password123", role: "teacher", displayName: "Elie Aoun", avatarInitials: "EA" },
  { id: "user-teacher-3", username: "teacher3", password: "password123", role: "teacher", displayName: "Mona Daher", avatarInitials: "MD" },
  { id: "user-admin-1", username: "admin1", password: "password123", role: "admin", displayName: "School Administration", avatarInitials: "SA" },
  { id: "user-admin-2", username: "admin2", password: "password123", role: "admin", displayName: "Academic Office", avatarInitials: "AO" },
  { id: "user-psychologist-1", username: "psychologist1", password: "password123", role: "psychologist", displayName: "Dr. Carla Rahme", avatarInitials: "CR" },
];

export const students: StudentProfile[] = [
  { id: "student-1", userId: "user-student-1", firstName: "Maya", lastName: "Haddad", classId: "kg1", parentIds: ["parent-1"], dateOfBirth: "2020-04-12", entranceExamStatus: "passed" },
  { id: "student-2", userId: "user-student-2", firstName: "Karim", lastName: "Nassar", classId: "kg2", parentIds: ["parent-2"], dateOfBirth: "2019-09-03", entranceExamStatus: "passed" },
  { id: "student-3", userId: "user-student-3", firstName: "Lea", lastName: "Khoury", classId: "g1", parentIds: ["parent-3"], dateOfBirth: "2018-02-21", entranceExamStatus: "passed" },
  { id: "student-4", userId: "user-student-4", firstName: "Georges", lastName: "Mansour", classId: "g5", parentIds: ["parent-4"], dateOfBirth: "2014-11-08", entranceExamStatus: "passed" },
  { id: "student-5", userId: "user-student-5", firstName: "Nour", lastName: "Saliba", classId: "g9", parentIds: ["parent-5"], dateOfBirth: "2010-05-17", entranceExamStatus: "passed" },
];

export const parents: ParentProfile[] = [
  { id: "parent-1", userId: "user-parent-1", firstName: "Rana", lastName: "Haddad", phone: "+961 70 111 204", studentIds: ["student-1"] },
  { id: "parent-2", userId: "user-parent-2", firstName: "Samir", lastName: "Nassar", phone: "+961 71 218 441", studentIds: ["student-2"] },
  { id: "parent-3", userId: "user-parent-3", firstName: "Mireille", lastName: "Khoury", phone: "+961 76 884 930", studentIds: ["student-3"] },
  { id: "parent-4", userId: "user-parent-4", firstName: "Joseph", lastName: "Mansour", phone: "+961 03 342 109", studentIds: ["student-4"] },
  { id: "parent-5", userId: "user-parent-5", firstName: "Tania", lastName: "Saliba", phone: "+961 81 442 600", studentIds: ["student-5"] },
];

export const teachers: TeacherProfile[] = [
  { id: "teacher-1", userId: "user-teacher-1", firstName: "Nadine", lastName: "Farah", subjects: ["arabic", "arts"], classIds: ["kg1", "kg2"] },
  { id: "teacher-2", userId: "user-teacher-2", firstName: "Elie", lastName: "Aoun", subjects: ["math", "science"], classIds: ["g1", "g2", "g3"] },
  { id: "teacher-3", userId: "user-teacher-3", firstName: "Mona", lastName: "Daher", subjects: ["math", "french", "civics"], classIds: ["g4", "g5", "g6", "g9"] },
];

export const admins: AdminProfile[] = [
  { id: "admin-1", userId: "user-admin-1", title: "General administration" },
  { id: "admin-2", userId: "user-admin-2", title: "Academic records" },
];

export const psychologists: PsychologistProfile[] = [
  { id: "psychologist-1", userId: "user-psychologist-1", assignedStudentIds: ["student-4", "student-5"], parentContactEnabled: false },
];

export const schedules: Schedule[] = [
  { id: "sch-1", classId: "g5", teacherId: "teacher-3", subjectId: "math", day: "Monday", period: 1, startTime: "8:00", endTime: "8:45", room: "Room 204" },
  { id: "sch-2", classId: "g9", teacherId: "teacher-3", subjectId: "french", day: "Monday", period: 2, startTime: "8:50", endTime: "9:35", room: "Room 301" },
  { id: "sch-3", classId: "kg1", teacherId: "teacher-1", subjectId: "arts", day: "Monday", period: 1, startTime: "8:00", endTime: "8:40", room: "KG Studio" },
  { id: "sch-4", classId: "g1", teacherId: "teacher-2", subjectId: "science", day: "Tuesday", period: 3, startTime: "10:00", endTime: "10:45", room: "Lab 1" },
  { id: "sch-5", classId: "g5", teacherId: "teacher-3", subjectId: "civics", day: "Wednesday", period: 4, startTime: "10:50", endTime: "11:35", room: "Room 204" },
];

export const attendance: Attendance[] = [
  { id: "att-1", date: "2026-05-21", classId: "g5", teacherId: "teacher-3", subjectId: "math", period: 1, records: [{ studentId: "student-4", status: "present" }] },
  { id: "att-2", date: "2026-05-21", classId: "g9", teacherId: "teacher-3", subjectId: "french", period: 2, records: [{ studentId: "student-5", status: "late" }] },
];

export const sessionReports: SessionReport[] = [
  {
    id: "sr-1",
    date: "2026-05-21",
    classId: "g5",
    teacherId: "teacher-3",
    subjectId: "math",
    period: 1,
    lessonTitle: "Equivalent fractions",
    completedWork: "Reviewed equivalent fractions and solved textbook exercises from page 34.",
    homework: "Exercises 4, 5, and 6 on page 35.",
    generalRemark: "The class participated well after the board examples.",
    visibleToParents: true,
    individualRemarks: [{ studentId: "student-4", remark: "Georges should bring his copybook tomorrow.", visibleToParent: true }],
  },
];

export const agendaItems: AgendaItem[] = [
  { id: "ag-1", title: "Math practice", description: "Complete fractions worksheet and review examples.", subjectId: "math", classId: "g5", dueDate: "2026-05-22", teacherId: "teacher-3", attachmentTitles: ["Fractions worksheet.pdf"] },
  { id: "ag-2", title: "Reading folder", description: "Bring the reading folder for phonics activities.", subjectId: "arabic", classId: "kg1", dueDate: "2026-05-22", teacherId: "teacher-1", attachmentTitles: [] },
  { id: "ag-3", title: "Science observation", description: "Write three observations from the seed growth experiment.", subjectId: "science", classId: "g1", dueDate: "2026-05-23", teacherId: "teacher-2", attachmentTitles: ["Observation guide.docx"] },
];

export const evaluations: Evaluation[] = [
  { id: "ev-1", studentId: "student-4", classId: "g5", subjectId: "math", title: "Fractions quiz", mark: 16, maximumMark: 20, date: "2026-05-18", teacherId: "teacher-3", comment: "Good progress; show all steps." },
  { id: "ev-2", studentId: "student-5", classId: "g9", subjectId: "french", title: "Oral presentation", mark: 17, maximumMark: 20, date: "2026-05-17", teacherId: "teacher-3", comment: "Clear pronunciation and strong preparation." },
  { id: "ev-3", studentId: "student-1", classId: "kg1", subjectId: "arts", title: "Fine motor activity", mark: 9, maximumMark: 10, date: "2026-05-16", teacherId: "teacher-1", comment: "Confident use of colors and shapes." },
];

export const libraryFiles: LibraryFile[] = [
  { id: "file-1", title: "Fractions worksheet", description: "Practice worksheet aligned with Grade 5 math objectives.", subjectId: "math", classId: "g5", uploadedByUserId: "user-teacher-3", uploadedAt: "2026-05-20", fileType: "PDF" },
  { id: "file-2", title: "Seed observation guide", description: "Simple guide for recording science observations.", subjectId: "science", classId: "g1", uploadedByUserId: "user-teacher-2", uploadedAt: "2026-05-19", fileType: "DOCX" },
  { id: "file-3", title: "KG color cards", description: "Printable cards for classroom recognition games.", subjectId: "arts", classId: "kg1", uploadedByUserId: "user-teacher-1", uploadedAt: "2026-05-18", fileType: "Image" },
];

export const messages: Message[] = [
  { id: "msg-1", senderId: "user-parent-4", receiverId: "user-teacher-3", subject: "Copybook note", body: "Georges will bring the copybook tomorrow morning.", sentAt: "2026-05-21 09:10", read: false },
  { id: "msg-2", senderId: "user-admin-1", receiverId: "user-teacher-3", subject: "Schedule update", body: "Please confirm the Grade 5 room change for Wednesday.", sentAt: "2026-05-20 14:25", read: true },
  { id: "msg-3", senderId: "user-psychologist-1", receiverId: "user-admin-1", subject: "Follow-up request", body: "I recommend a short meeting about the Grade 9 case this week.", sentAt: "2026-05-19 11:00", read: true },
];

export const announcements: Announcement[] = [
  { id: "an-1", title: "Entrance exam reminder", body: "New student applicants must complete the entrance exam before final acceptance.", targetAudience: "all", date: "2026-05-21", attachmentTitles: [] },
  { id: "an-2", title: "Book donation coordination", body: "Staff and benefactors are coordinating donated books for the next academic cycle.", targetAudience: "parent", date: "2026-05-20", attachmentTitles: ["Book donation list.pdf"] },
  { id: "an-3", title: "Grade 9 revision plan", body: "Grade 9 students will follow the official revision plan aligned with Ministry requirements.", targetAudience: "specific-class", classId: "g9", date: "2026-05-18", attachmentTitles: [] },
];

export const excelImports: UploadedExcelImport[] = [
  { id: "imp-1", templateName: "Student + Parent Accounts", uploadedByUserId: "user-admin-1", uploadedAt: "2026-05-19", status: "needs-review", validRows: 42, invalidRows: 3, notes: ["3 rows missing parent phone numbers", "2 usernames will be generated automatically"] },
  { id: "imp-2", templateName: "Teacher Schedules", uploadedByUserId: "user-admin-2", uploadedAt: "2026-05-18", status: "ready", validRows: 85, invalidRows: 0, notes: ["Ready to confirm"] },
];

export const psychologistCases: PsychologistCase[] = [
  { id: "case-1", studentId: "student-4", status: "needs-follow-up", lastUpdated: "2026-05-20", summary: "Class participation fluctuates after schedule changes.", privateNote: "Observe during group work before contacting parent." },
  { id: "case-2", studentId: "student-5", status: "normal", lastUpdated: "2026-05-18", summary: "Exam stress check-in completed.", privateNote: "Student responded well to planning strategy." },
];

export function findUserByUsername(username: string) {
  return users.find(
    (user) => user.username.toLowerCase() === username.trim().toLowerCase(),
  );
}

export function getClassName(classId: string) {
  return classes.find((schoolClass) => schoolClass.id === classId)?.name ?? classId;
}

export function getSubjectName(subjectId: string) {
  return subjects.find((subject) => subject.id === subjectId)?.name ?? subjectId;
}

export function getTeacherName(teacherId: string) {
  const teacher = teachers.find((entry) => entry.id === teacherId);
  return teacher ? `${teacher.firstName} ${teacher.lastName}` : teacherId;
}

export function getStudentName(studentId: string) {
  const student = students.find((entry) => entry.id === studentId);
  return student ? `${student.firstName} ${student.lastName}` : studentId;
}
