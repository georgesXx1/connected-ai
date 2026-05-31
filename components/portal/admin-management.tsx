"use client";

import { FormEvent, useState } from "react";

import { todayDate, updatePortalData } from "@/lib/portal/client-store";
import {
  classes,
  getClassName,
  getStudentName,
  getSubjectName,
  getTeacherName,
  parents,
  schedules,
  scheduleConfig,
  students,
  subjects,
  teachers,
  users,
} from "@/lib/portal/mock-data";
import type { SchoolClass } from "@/lib/portal/types";

const allScheduleDayOptions = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const periodTimes: Record<number, { startTime: string; endTime: string }> = {
  1: { startTime: "08:00", endTime: "08:45" },
  2: { startTime: "08:50", endTime: "09:35" },
  3: { startTime: "09:50", endTime: "10:35" },
  4: { startTime: "10:40", endTime: "11:25" },
  5: { startTime: "11:40", endTime: "12:25" },
  6: { startTime: "12:30", endTime: "13:15" },
  7: { startTime: "13:20", endTime: "14:05" },
  8: { startTime: "14:10", endTime: "14:55" },
};

function uniqueId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cleanSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/kg\s*/g, "kg")
    .replace(/grade\s*/g, "g")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function initials(firstName: string, lastName: string, fallback = "U") {
  return `${firstName[0] ?? fallback[0] ?? "U"}${lastName[0] ?? ""}`.toUpperCase();
}

function generatedPassword() {
  return `school-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

function generatedStudentUsername(firstName: string, lastName: string, classId: string) {
  const classCode = getClassName(classId).replace("Grade ", "g").replace(/\s+/g, "").toLowerCase();
  return `${firstName}.${lastName}.${classCode}`.toLowerCase();
}

function generatedParentUsername(firstName: string, lastName: string) {
  return `parent.${firstName}.${lastName}`.toLowerCase();
}

function generatedStaffUsername(firstName: string, lastName: string) {
  return `${firstName}.${lastName}`.toLowerCase();
}

function userFor(userId: string) {
  return users.find((user) => user.id === userId);
}

function defaultTeacherId(classId?: string) {
  return (
    teachers.find((teacher) => classId && teacher.classIds.includes(classId))?.id ??
    teachers[0]?.id ??
    "teacher-1"
  );
}

function defaultSubjectId(teacherId?: string, classId?: string) {
  return (
    teachers.find((teacher) => teacher.id === teacherId)?.subjects[0] ??
    subjectOptionsForClass(classId)[0]?.id ??
    subjects[0]?.id ??
    "math"
  );
}

function teachersForClass(classId?: string) {
  const assignedTeachers = teachers.filter((teacher) => classId && teacher.classIds.includes(classId));
  return assignedTeachers.length > 0 ? assignedTeachers : teachers;
}

function subjectOptionsForClass(classId?: string) {
  const allowedSubjectIds = new Set(
    teachersForClass(classId).flatMap((teacher) => teacher.subjects),
  );
  const options = subjects.filter((subject) => allowedSubjectIds.has(subject.id));
  return options.length > 0 ? options : subjects;
}

function subjectOptionsForTeacher(teacherId: string, classId?: string) {
  const teacher = teachers.find((entry) => entry.id === teacherId);

  if (!teacher) return subjectOptionsForClass(classId);

  const options = subjects.filter((subject) => teacher.subjects.includes(subject.id));
  return options.length > 0 ? options : subjectOptionsForClass(classId);
}

function teacherOptionsForLesson(classId: string, subjectId?: string) {
  const assignedTeachers = teachersForClass(classId);
  const exactMatches = assignedTeachers.filter(
    (teacher) => !subjectId || teacher.subjects.includes(subjectId),
  );

  if (exactMatches.length > 0) return exactMatches;

  const subjectMatches = teachers.filter(
    (teacher) => !subjectId || teacher.subjects.includes(subjectId),
  );
  return subjectMatches.length > 0 ? subjectMatches : assignedTeachers;
}

function ensureOption<T extends { id: string }>(options: T[], current: T | undefined) {
  return current && !options.some((option) => option.id === current.id)
    ? [current, ...options]
    : options;
}

function teacherLabel(teacherId: string) {
  const teacher = teachers.find((entry) => entry.id === teacherId);
  if (!teacher) return teacherId;
  return `${teacher.firstName} ${teacher.lastName}`;
}

function parentLabel(parentId: string) {
  const parent = parents.find((entry) => entry.id === parentId);
  return parent ? `${parent.firstName} ${parent.lastName}` : parentId;
}

function statusMessage(action: string, name: string) {
  return `${name} ${action}. Changes are live across the portal on this device.`;
}

function removeStudentEverywhere(studentId: string) {
  updatePortalData((data) => {
    const student = data.students.find((entry) => entry.id === studentId);
    if (!student) return;

    const parentIds = student.parentIds;
    const nextParents = data.parents.map((parent) => ({
      ...parent,
      studentIds: parent.studentIds.filter((id) => id !== studentId),
    }));
    const removedParentUserIds = nextParents
      .filter((parent) => parentIds.includes(parent.id) && parent.studentIds.length === 0)
      .map((parent) => parent.userId);

    data.students = data.students.filter((entry) => entry.id !== studentId);
    data.parents = nextParents.filter(
      (parent) => !(parentIds.includes(parent.id) && parent.studentIds.length === 0),
    );
    data.users = data.users.filter(
      (user) => user.id !== student.userId && !removedParentUserIds.includes(user.id),
    );
    data.attendance = data.attendance
      .map((item) => ({
        ...item,
        records: item.records.filter((record) => record.studentId !== studentId),
      }))
      .filter((item) => item.records.length > 0);
    data.evaluations = data.evaluations.filter((item) => item.studentId !== studentId);
    data.sessionReports = data.sessionReports.map((report) => ({
      ...report,
      individualRemarks: report.individualRemarks.filter((remark) => remark.studentId !== studentId),
    }));
    data.psychologistCases = data.psychologistCases.filter((item) => item.studentId !== studentId);
  });
}

export function AdminStudentsManager() {
  const [classFilter, setClassFilter] = useState("all");
  const [status, setStatus] = useState("");
  const visibleStudents = students.filter((student) => classFilter === "all" || student.classId === classFilter);

  function addStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const firstName = String(formData.get("firstName") ?? "").trim() || "New";
    const lastName = String(formData.get("lastName") ?? "").trim() || "Student";
    const classId = String(formData.get("classId") ?? classes[0]?.id ?? "g1");
    const studentUserId = uniqueId("user-student");
    const studentId = uniqueId("student");
    const parentFirstName = String(formData.get("parentFirstName") ?? "").trim();
    const parentLastName = String(formData.get("parentLastName") ?? "").trim();
    const parentPhone = String(formData.get("parentPhone") ?? "").trim();
    const createdParentId = parentFirstName || parentLastName ? uniqueId("parent") : "";

    updatePortalData((data) => {
      data.users.push({
        id: studentUserId,
        username:
          String(formData.get("studentUsername") ?? "").trim() ||
          generatedStudentUsername(firstName, lastName, classId),
        password: String(formData.get("studentPassword") ?? "").trim() || generatedPassword(),
        role: "student",
        displayName: `${firstName} ${lastName}`,
        avatarInitials: initials(firstName, lastName, "S"),
      });

      data.students.push({
        id: studentId,
        userId: studentUserId,
        firstName,
        lastName,
        classId,
        parentIds: createdParentId ? [createdParentId] : [],
        dateOfBirth: String(formData.get("dateOfBirth") ?? "").trim() || todayDate(),
        entranceExamStatus:
          String(formData.get("entranceExamStatus")) === "scheduled" ||
          String(formData.get("entranceExamStatus")) === "pending"
            ? (String(formData.get("entranceExamStatus")) as "scheduled" | "pending")
            : "passed",
      });

      if (createdParentId) {
        const parentUserId = uniqueId("user-parent");
        const cleanParentFirstName = parentFirstName || "Parent";
        const cleanParentLastName = parentLastName || lastName;

        data.users.push({
          id: parentUserId,
          username:
            String(formData.get("parentUsername") ?? "").trim() ||
            generatedParentUsername(firstName, lastName),
          password: String(formData.get("parentPassword") ?? "").trim() || generatedPassword(),
          role: "parent",
          displayName: `${cleanParentFirstName} ${cleanParentLastName}`,
          avatarInitials: initials(cleanParentFirstName, cleanParentLastName, "P"),
        });
        data.parents.push({
          id: createdParentId,
          userId: parentUserId,
          firstName: cleanParentFirstName,
          lastName: cleanParentLastName,
          phone: parentPhone,
          studentIds: [studentId],
        });
      }
    });

    setStatus(statusMessage("created", `${firstName} ${lastName}`));
    form.reset();
  }

  function updateStudent(studentId: string, patch: { classId?: string; entranceExamStatus?: "passed" | "scheduled" | "pending" }) {
    updatePortalData((data) => {
      data.students = data.students.map((student) =>
        student.id === studentId ? { ...student, ...patch } : student,
      );
    });
    setStatus(statusMessage("updated", getStudentName(studentId)));
  }

  function deleteStudent(studentId: string) {
    const name = getStudentName(studentId);
    if (typeof window !== "undefined" && !window.confirm(`Remove ${name} and linked records from the portal prototype?`)) {
      return;
    }
    removeStudentEverywhere(studentId);
    setStatus(statusMessage("removed", name));
  }

  return (
    <div className="portal-admin-manager">
      <section className="portal-card portal-admin-editor">
        <div className="portal-panel-head">
          <div>
            <p className="portal-kicker">Students</p>
            <h2>Add student and linked parent</h2>
          </div>
        </div>
        <form className="portal-form" onSubmit={addStudent}>
          <div className="portal-form-grid">
            <label>
              <span>Student first name</span>
              <input name="firstName" placeholder="Georges" />
            </label>
            <label>
              <span>Student last name</span>
              <input name="lastName" placeholder="Mansour" />
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
              <span>Entrance exam</span>
              <select name="entranceExamStatus" defaultValue="passed">
                <option value="passed">Passed</option>
                <option value="scheduled">Scheduled</option>
                <option value="pending">Pending</option>
              </select>
            </label>
            <label>
              <span>Date of birth</span>
              <input name="dateOfBirth" type="date" />
            </label>
            <label>
              <span>Student username</span>
              <input name="studentUsername" placeholder="Generated if empty" />
            </label>
            <label>
              <span>Student password</span>
              <input name="studentPassword" placeholder="Generated if empty" />
            </label>
            <label>
              <span>Parent first name</span>
              <input name="parentFirstName" placeholder="Optional" />
            </label>
            <label>
              <span>Parent last name</span>
              <input name="parentLastName" placeholder="Optional" />
            </label>
            <label>
              <span>Parent phone</span>
              <input name="parentPhone" placeholder="+961 ..." />
            </label>
            <label>
              <span>Parent username</span>
              <input name="parentUsername" placeholder="Generated if empty" />
            </label>
            <label>
              <span>Parent password</span>
              <input name="parentPassword" placeholder="Generated if empty" />
            </label>
          </div>
          {status ? <div className="portal-success">{status}</div> : null}
          <div className="portal-form-actions">
            <button type="submit" className="portal-primary-button">
              Add student
            </button>
          </div>
        </form>
      </section>

      <section className="portal-card">
        <div className="portal-admin-toolbar">
          <div>
            <p className="portal-kicker">Roster</p>
            <h2>Manage students</h2>
          </div>
          <label>
            <span>Filter class</span>
            <select value={classFilter} onChange={(event) => setClassFilter(event.target.value)}>
              <option value="all">All classes</option>
              {classes.map((schoolClass) => (
                <option key={schoolClass.id} value={schoolClass.id}>
                  {schoolClass.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="portal-admin-list">
          {visibleStudents.map((student) => (
            <article key={student.id} className="portal-admin-row">
              <div>
                <strong>{student.firstName} {student.lastName}</strong>
                <span>{userFor(student.userId)?.username ?? "No login"} / Parents: {student.parentIds.map(parentLabel).join(", ") || "Not linked"}</span>
              </div>
              <label>
                <span>Class</span>
                <select value={student.classId} onChange={(event) => updateStudent(student.id, { classId: event.target.value })}>
                  {classes.map((schoolClass) => (
                    <option key={schoolClass.id} value={schoolClass.id}>
                      {schoolClass.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Entrance exam</span>
                <select
                  value={student.entranceExamStatus}
                  onChange={(event) =>
                    updateStudent(student.id, {
                      entranceExamStatus: event.target.value as "passed" | "scheduled" | "pending",
                    })
                  }
                >
                  <option value="passed">Passed</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="pending">Pending</option>
                </select>
              </label>
              <button type="button" className="portal-danger-button" onClick={() => deleteStudent(student.id)}>
                Remove
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export function AdminParentsManager() {
  const [status, setStatus] = useState("");

  function addParent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const firstName = String(formData.get("firstName") ?? "").trim() || "New";
    const lastName = String(formData.get("lastName") ?? "").trim() || "Parent";
    const studentId = String(formData.get("studentId") ?? "");
    const parentId = uniqueId("parent");
    const userId = uniqueId("user-parent");

    updatePortalData((data) => {
      data.users.push({
        id: userId,
        username: String(formData.get("username") ?? "").trim() || generatedParentUsername(firstName, lastName),
        password: String(formData.get("password") ?? "").trim() || generatedPassword(),
        role: "parent",
        displayName: `${firstName} ${lastName}`,
        avatarInitials: initials(firstName, lastName, "P"),
      });
      data.parents.push({
        id: parentId,
        userId,
        firstName,
        lastName,
        phone: String(formData.get("phone") ?? "").trim(),
        studentIds: studentId ? [studentId] : [],
      });
      const student = data.students.find((entry) => entry.id === studentId);
      if (student && !student.parentIds.includes(parentId)) {
        student.parentIds = [...student.parentIds, parentId];
      }
    });

    setStatus(statusMessage("created", `${firstName} ${lastName}`));
    form.reset();
  }

  function linkChild(parentId: string, studentId: string) {
    if (!studentId) return;

    updatePortalData((data) => {
      const parent = data.parents.find((entry) => entry.id === parentId);
      const student = data.students.find((entry) => entry.id === studentId);
      if (parent && !parent.studentIds.includes(studentId)) {
        parent.studentIds = [...parent.studentIds, studentId];
      }
      if (student && !student.parentIds.includes(parentId)) {
        student.parentIds = [...student.parentIds, parentId];
      }
    });
    setStatus("Child link updated.");
  }

  function deleteParent(parentId: string) {
    const parent = parents.find((entry) => entry.id === parentId);
    if (!parent) return;

    if (typeof window !== "undefined" && !window.confirm(`Remove ${parent.firstName} ${parent.lastName}?`)) {
      return;
    }

    updatePortalData((data) => {
      data.parents = data.parents.filter((entry) => entry.id !== parentId);
      data.users = data.users.filter((user) => user.id !== parent.userId);
      data.students = data.students.map((student) => ({
        ...student,
        parentIds: student.parentIds.filter((id) => id !== parentId),
      }));
    });
    setStatus(statusMessage("removed", `${parent.firstName} ${parent.lastName}`));
  }

  return (
    <div className="portal-admin-manager">
      <section className="portal-card">
        <div className="portal-panel-head">
          <div>
            <p className="portal-kicker">Parents</p>
            <h2>Add parent account</h2>
          </div>
        </div>
        <form className="portal-form" onSubmit={addParent}>
          <div className="portal-form-grid">
            <label>
              <span>First name</span>
              <input name="firstName" placeholder="Rana" />
            </label>
            <label>
              <span>Last name</span>
              <input name="lastName" placeholder="Haddad" />
            </label>
            <label>
              <span>Phone</span>
              <input name="phone" placeholder="+961 ..." />
            </label>
            <label>
              <span>Link child</span>
              <select name="studentId" defaultValue={students[0]?.id}>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {getStudentName(student.id)} / {getClassName(student.classId)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Username</span>
              <input name="username" placeholder="Generated if empty" />
            </label>
            <label>
              <span>Password</span>
              <input name="password" placeholder="Generated if empty" />
            </label>
          </div>
          {status ? <div className="portal-success">{status}</div> : null}
          <div className="portal-form-actions">
            <button type="submit" className="portal-primary-button">
              Add parent
            </button>
          </div>
        </form>
      </section>

      <section className="portal-card">
        <div className="portal-panel-head">
          <div>
            <p className="portal-kicker">Links</p>
            <h2>Parent and child links</h2>
          </div>
        </div>
        <div className="portal-admin-list">
          {parents.map((parent) => (
            <article key={parent.id} className="portal-admin-row portal-admin-row-compact">
              <div>
                <strong>{parent.firstName} {parent.lastName}</strong>
                <span>{parent.phone || "No phone"} / {parent.studentIds.map(getStudentName).join(", ") || "No child linked"}</span>
              </div>
              <label>
                <span>Add child</span>
                <select defaultValue="" onChange={(event) => linkChild(parent.id, event.target.value)}>
                  <option value="">Choose student</option>
                  {students.map((student) => (
                    <option key={student.id} value={student.id}>
                      {getStudentName(student.id)}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" className="portal-danger-button" onClick={() => deleteParent(parent.id)}>
                Remove
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export function AdminTeachersManager() {
  const [status, setStatus] = useState("");

  function addTeacher(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const firstName = String(formData.get("firstName") ?? "").trim() || "New";
    const lastName = String(formData.get("lastName") ?? "").trim() || "Teacher";
    const subjectId = String(formData.get("subjectId") ?? subjects[0]?.id ?? "math");
    const classId = String(formData.get("classId") ?? "");
    const userId = uniqueId("user-teacher");
    const teacherId = uniqueId("teacher");

    updatePortalData((data) => {
      data.users.push({
        id: userId,
        username: String(formData.get("username") ?? "").trim() || generatedStaffUsername(firstName, lastName),
        password: String(formData.get("password") ?? "").trim() || generatedPassword(),
        role: "teacher",
        displayName: `${firstName} ${lastName}`,
        avatarInitials: initials(firstName, lastName, "T"),
      });
      data.teachers.push({
        id: teacherId,
        userId,
        firstName,
        lastName,
        subjects: [subjectId],
        classIds: classId ? [classId] : [],
      });
    });

    setStatus(statusMessage("created", `${firstName} ${lastName}`));
    form.reset();
  }

  function updateTeacherList(teacherId: string, field: "subjects" | "classIds", value: string, action: "add" | "remove") {
    if (!value) return;

    updatePortalData((data) => {
      data.teachers = data.teachers.map((teacher) => {
        if (teacher.id !== teacherId) return teacher;
        const current = teacher[field];
        const next =
          action === "add"
            ? Array.from(new Set([...current, value]))
            : current.filter((entry) => entry !== value);
        return { ...teacher, [field]: next };
      });
    });
    setStatus("Teacher assignment updated.");
  }

  function assignAllClasses(teacherId: string) {
    updatePortalData((data) => {
      data.teachers = data.teachers.map((teacher) =>
        teacher.id === teacherId
          ? { ...teacher, classIds: data.classes.map((schoolClass) => schoolClass.id) }
          : teacher,
      );
    });
    setStatus("Teacher assigned to all classes.");
  }

  function addSubject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("subjectName") ?? "").trim();

    if (!name) {
      setStatus("Enter a subject name first.");
      return;
    }

    updatePortalData((data) => {
      const id = cleanSlug(name) || uniqueId("subject");
      if (data.subjects.some((subject) => subject.id === id || subject.name.toLowerCase() === name.toLowerCase())) {
        return;
      }
      data.subjects.push({ id, name, ministryAligned: true });
    });
    setStatus(`${name} added to subject dropdowns.`);
    form.reset();
  }

  function deleteTeacher(teacherId: string) {
    const teacher = teachers.find((entry) => entry.id === teacherId);
    if (!teacher) return;
    const name = teacherLabel(teacherId);

    if (typeof window !== "undefined" && !window.confirm(`Remove ${name} and their future schedule entries?`)) {
      return;
    }

    updatePortalData((data) => {
      data.teachers = data.teachers.filter((entry) => entry.id !== teacherId);
      data.users = data.users.filter((user) => user.id !== teacher.userId);
      data.classes = data.classes.map((schoolClass) =>
        schoolClass.homeroomTeacherId === teacherId
          ? { ...schoolClass, homeroomTeacherId: undefined }
          : schoolClass,
      );
      data.schedules = data.schedules.filter((entry) => entry.teacherId !== teacherId);
      data.agendaItems = data.agendaItems.filter((item) => item.teacherId !== teacherId);
      data.messages = data.messages.filter((message) => message.senderId !== teacher.userId && message.receiverId !== teacher.userId);
    });
    setStatus(statusMessage("removed", name));
  }

  return (
    <div className="portal-admin-manager">
      <section className="portal-card">
        <div className="portal-panel-head">
          <div>
            <p className="portal-kicker">Teachers</p>
            <h2>Add teacher account</h2>
          </div>
        </div>
        <form className="portal-form" onSubmit={addTeacher}>
          <div className="portal-form-grid">
            <label>
              <span>First name</span>
              <input name="firstName" placeholder="Mona" />
            </label>
            <label>
              <span>Last name</span>
              <input name="lastName" placeholder="Daher" />
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
              <span>Initial class</span>
              <select name="classId" defaultValue={classes[0]?.id}>
                {classes.map((schoolClass) => (
                  <option key={schoolClass.id} value={schoolClass.id}>
                    {schoolClass.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>Username</span>
              <input name="username" placeholder="Generated if empty" />
            </label>
            <label>
              <span>Password</span>
              <input name="password" placeholder="Generated if empty" />
            </label>
          </div>
          {status ? <div className="portal-success">{status}</div> : null}
          <div className="portal-form-actions">
            <button type="submit" className="portal-primary-button">
              Add teacher
            </button>
          </div>
        </form>
      </section>

      <section className="portal-card">
        <div className="portal-panel-head">
          <div>
            <p className="portal-kicker">Subjects</p>
            <h2>Add subject</h2>
          </div>
        </div>
        <form className="portal-form" onSubmit={addSubject}>
          <div className="portal-form-grid">
            <label>
              <span>Subject name</span>
              <input name="subjectName" placeholder="Physics" />
            </label>
          </div>
          <div className="portal-form-actions">
            <button type="submit" className="portal-primary-button">
              Add subject
            </button>
          </div>
        </form>
        <div className="portal-chip-row">
          {subjects.map((subject) => (
            <button key={subject.id} type="button">
              {subject.name}
            </button>
          ))}
        </div>
      </section>

      <section className="portal-card">
        <div className="portal-panel-head">
          <div>
            <p className="portal-kicker">Assignments</p>
            <h2>Teacher access</h2>
          </div>
        </div>
        <div className="portal-admin-list">
          {teachers.map((teacher) => (
            <article key={teacher.id} className="portal-admin-row portal-admin-row-wide">
              <div>
                <strong>{teacher.firstName} {teacher.lastName}</strong>
                <span>{userFor(teacher.userId)?.username ?? "No login"}</span>
                <div className="portal-chip-row">
                  {teacher.subjects.map((subjectId) => (
                    <button key={subjectId} type="button" onClick={() => updateTeacherList(teacher.id, "subjects", subjectId, "remove")}>
                      {getSubjectName(subjectId)} x
                    </button>
                  ))}
                  {teacher.classIds.map((classId) => (
                    <button key={classId} type="button" onClick={() => updateTeacherList(teacher.id, "classIds", classId, "remove")}>
                      {getClassName(classId)} x
                    </button>
                  ))}
                </div>
              </div>
              <label>
                <span>Add subject</span>
                <select
                  defaultValue=""
                  onChange={(event) => {
                    updateTeacherList(teacher.id, "subjects", event.target.value, "add");
                    event.currentTarget.value = "";
                  }}
                >
                  <option value="">Choose subject</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Add class</span>
                <select
                  defaultValue=""
                  onChange={(event) => {
                    updateTeacherList(teacher.id, "classIds", event.target.value, "add");
                    event.currentTarget.value = "";
                  }}
                >
                  <option value="">Choose class</option>
                  {classes.map((schoolClass) => (
                    <option key={schoolClass.id} value={schoolClass.id}>
                      {schoolClass.name}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" className="portal-secondary-button" onClick={() => assignAllClasses(teacher.id)}>
                All classes
              </button>
              <button type="button" className="portal-danger-button" onClick={() => deleteTeacher(teacher.id)}>
                Remove
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export function AdminClassesManager() {
  const [status, setStatus] = useState("");

  function addClass(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") ?? "").trim() || "New Class";
    const idBase = cleanSlug(name) || "class";
    const classId = classes.some((schoolClass) => schoolClass.id === idBase) ? uniqueId(idBase) : idBase;
    const homeroomTeacherId = String(formData.get("homeroomTeacherId") ?? "");
    const cycle = String(formData.get("cycle") ?? "Primary") as SchoolClass["cycle"];

    updatePortalData((data) => {
      data.classes.push({
        id: classId,
        name,
        cycle,
        homeroomTeacherId: homeroomTeacherId || undefined,
      });
      const teacher = data.teachers.find((entry) => entry.id === homeroomTeacherId);
      if (teacher && !teacher.classIds.includes(classId)) {
        teacher.classIds = [...teacher.classIds, classId];
      }
    });

    setStatus(statusMessage("created", name));
    form.reset();
  }

  function updateClass(classId: string, patch: Partial<SchoolClass>) {
    updatePortalData((data) => {
      data.classes = data.classes.map((schoolClass) =>
        schoolClass.id === classId ? { ...schoolClass, ...patch } : schoolClass,
      );
      if (patch.homeroomTeacherId) {
        const teacher = data.teachers.find((entry) => entry.id === patch.homeroomTeacherId);
        if (teacher && !teacher.classIds.includes(classId)) {
          teacher.classIds = [...teacher.classIds, classId];
        }
      }
    });
    setStatus(statusMessage("updated", getClassName(classId)));
  }

  function deleteClass(classId: string) {
    const name = getClassName(classId);
    if (classes.length <= 1) {
      setStatus("Keep at least one class in the portal.");
      return;
    }

    if (typeof window !== "undefined" && !window.confirm(`Remove ${name}? Students will move to another available class in this prototype.`)) {
      return;
    }

    updatePortalData((data) => {
      const fallbackClass = data.classes.find((schoolClass) => schoolClass.id !== classId)?.id || "g1";
      data.classes = data.classes.filter((schoolClass) => schoolClass.id !== classId);
      data.students = data.students.map((student) =>
        student.classId === classId ? { ...student, classId: fallbackClass } : student,
      );
      data.teachers = data.teachers.map((teacher) => ({
        ...teacher,
        classIds: teacher.classIds.filter((id) => id !== classId),
      }));
      data.schedules = data.schedules.filter((entry) => entry.classId !== classId);
      data.attendance = data.attendance.filter((item) => item.classId !== classId);
      data.agendaItems = data.agendaItems.filter((item) => item.classId !== classId);
      data.libraryFiles = data.libraryFiles.filter((file) => file.classId !== classId);
      data.evaluations = data.evaluations.map((item) =>
        item.classId === classId ? { ...item, classId: fallbackClass } : item,
      );
    });
    setStatus(statusMessage("removed", name));
  }

  return (
    <div className="portal-admin-manager">
      <section className="portal-card">
        <div className="portal-panel-head">
          <div>
            <p className="portal-kicker">Classes</p>
            <h2>Create class</h2>
          </div>
        </div>
        <form className="portal-form" onSubmit={addClass}>
          <div className="portal-form-grid">
            <label>
              <span>Class name</span>
              <input name="name" placeholder="Grade 6" />
            </label>
            <label>
              <span>Cycle</span>
              <select name="cycle" defaultValue="Primary">
                <option value="Kindergarten">Kindergarten</option>
                <option value="Primary">Primary</option>
                <option value="Middle">Middle</option>
              </select>
            </label>
            <label>
              <span>Homeroom teacher</span>
              <select name="homeroomTeacherId" defaultValue="">
                <option value="">Not assigned</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacherLabel(teacher.id)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {status ? <div className="portal-success">{status}</div> : null}
          <div className="portal-form-actions">
            <button type="submit" className="portal-primary-button">
              Create class
            </button>
          </div>
        </form>
      </section>

      <section className="portal-card">
        <div className="portal-panel-head">
          <div>
            <p className="portal-kicker">Structure</p>
            <h2>Edit classes</h2>
          </div>
        </div>
        <div className="portal-admin-list">
          {classes.map((schoolClass) => (
            <article key={schoolClass.id} className="portal-admin-row">
              <div>
                <strong>{schoolClass.name}</strong>
                <span>{students.filter((student) => student.classId === schoolClass.id).length} students / {schedules.filter((entry) => entry.classId === schoolClass.id).length} lessons</span>
              </div>
              <label>
                <span>Cycle</span>
                <select
                  value={schoolClass.cycle}
                  onChange={(event) => updateClass(schoolClass.id, { cycle: event.target.value as SchoolClass["cycle"] })}
                >
                  <option value="Kindergarten">Kindergarten</option>
                  <option value="Primary">Primary</option>
                  <option value="Middle">Middle</option>
                </select>
              </label>
              <label>
                <span>Homeroom</span>
                <select
                  value={schoolClass.homeroomTeacherId ?? ""}
                  onChange={(event) => updateClass(schoolClass.id, { homeroomTeacherId: event.target.value || undefined })}
                >
                  <option value="">Not assigned</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacherLabel(teacher.id)}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" className="portal-danger-button" onClick={() => deleteClass(schoolClass.id)}>
                Remove
              </button>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export function AdminScheduleBuilder() {
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id ?? "");
  const [status, setStatus] = useState("");
  const activeClassId = classes.some((schoolClass) => schoolClass.id === selectedClassId)
    ? selectedClassId
    : classes[0]?.id ?? "";
  const activeClass = classes.find((schoolClass) => schoolClass.id === activeClassId);
  const scheduleDays = scheduleConfig.days;
  const activePeriods = [...scheduleConfig.periods].sort((left, right) => left.period - right.period);
  const remainingDayOptions = allScheduleDayOptions.filter((day) => !scheduleDays.includes(day));

  function entryFor(day: string, period: number) {
    return schedules.find(
      (entry) => entry.classId === activeClassId && entry.day === day && entry.period === period,
    );
  }

  function saveCell(day: string, period: number, patch: Partial<(typeof schedules)[number]> = {}) {
    if (!activeClassId) return;
    const existing = entryFor(day, period);
    const requestedSubjectId = patch.subjectId ?? existing?.subjectId;
    const requestedTeacherId = patch.teacherId ?? existing?.teacherId;
    const teacherOptions = teacherOptionsForLesson(activeClassId, requestedSubjectId);
    const teacherStillFits = requestedTeacherId
      ? teacherOptions.some((teacher) => teacher.id === requestedTeacherId)
      : false;
    const teacherId =
      (teacherStillFits ? requestedTeacherId : teacherOptions[0]?.id) ??
      defaultTeacherId(activeClassId);
    const subjectOptions = subjectOptionsForTeacher(teacherId, activeClassId);
    const subjectStillFits = requestedSubjectId
      ? subjectOptions.some((subject) => subject.id === requestedSubjectId)
      : false;
    const subjectId =
      (subjectStillFits ? requestedSubjectId : subjectOptions[0]?.id) ??
      defaultSubjectId(teacherId, activeClassId);
    const times = scheduleConfig.periods.find((item) => item.period === period) ?? scheduleConfig.periods[0] ?? periodTimes[1];

    updatePortalData((data) => {
      if (existing) {
        data.schedules = data.schedules.map((entry) =>
          entry.id === existing.id
            ? {
                ...entry,
                ...patch,
                teacherId,
                subjectId,
                classId: activeClassId,
                day,
                period,
              }
            : entry,
        );
      } else {
        data.schedules.push({
          id: uniqueId("sch"),
          classId: activeClassId,
          teacherId,
          subjectId,
          day,
          period,
          startTime: patch.startTime ?? times.startTime,
          endTime: patch.endTime ?? times.endTime,
          room: patch.room ?? activeClass?.name ?? "Classroom",
        });
      }

      const assignedTeacher = data.teachers.find((teacher) => teacher.id === teacherId);
      if (assignedTeacher && !assignedTeacher.classIds.includes(activeClassId)) {
        assignedTeacher.classIds = [...assignedTeacher.classIds, activeClassId];
      }
    });
    setStatus(`${getClassName(activeClassId)} schedule updated.`);
  }

  function removeCell(day: string, period: number) {
    if (!activeClassId) return;
    updatePortalData((data) => {
      data.schedules = data.schedules.filter(
        (entry) => !(entry.classId === activeClassId && entry.day === day && entry.period === period),
      );
    });
    setStatus(`${day} period ${period} removed.`);
  }

  function fillStarterWeek() {
    if (!activeClassId) return;
    updatePortalData((data) => {
      scheduleConfig.days.forEach((day) => {
        scheduleConfig.periods.filter((item) => item.type === "class").forEach((periodConfig, index) => {
          const period = periodConfig.period;
          const exists = data.schedules.some(
            (entry) => entry.classId === activeClassId && entry.day === day && entry.period === period,
          );
          if (exists) return;

          const classTeachers = teachersForClass(activeClassId);
          const teacher = classTeachers[index % Math.max(classTeachers.length, 1)];
          const teacherId = teacher?.id ?? defaultTeacherId(activeClassId);
          const subjectId = teacher?.subjects[index % Math.max(teacher.subjects.length, 1)] ?? defaultSubjectId(teacherId, activeClassId);
          data.schedules.push({
            id: uniqueId("sch"),
            classId: activeClassId,
            teacherId,
            subjectId,
            day,
            period,
            startTime: periodConfig.startTime,
            endTime: periodConfig.endTime,
            room: activeClass?.name ?? "Classroom",
          });
          const dataTeacher = data.teachers.find((entry) => entry.id === teacherId);
          if (dataTeacher && !dataTeacher.classIds.includes(activeClassId)) {
            dataTeacher.classIds = [...dataTeacher.classIds, activeClassId];
          }
        });
      });
    });
    setStatus(`${getClassName(activeClassId)} starter week added.`);
  }

  function clearClassSchedule() {
    if (!activeClassId) return;
    if (typeof window !== "undefined" && !window.confirm(`Clear the full schedule for ${getClassName(activeClassId)}?`)) {
      return;
    }

    updatePortalData((data) => {
      data.schedules = data.schedules.filter((entry) => entry.classId !== activeClassId);
    });
    setStatus(`${getClassName(activeClassId)} schedule cleared.`);
  }

  function updatePeriod(period: number, patch: Partial<(typeof scheduleConfig.periods)[number]>) {
    updatePortalData((data) => {
      data.scheduleConfig.periods = data.scheduleConfig.periods.map((item) =>
        item.period === period ? { ...item, ...patch } : item,
      );
      if (patch.startTime || patch.endTime) {
        data.schedules = data.schedules.map((entry) =>
          entry.period === period
            ? {
                ...entry,
                startTime: patch.startTime ?? entry.startTime,
                endTime: patch.endTime ?? entry.endTime,
              }
            : entry,
        );
      }
      if (patch.type === "recess") {
        data.schedules = data.schedules.filter((entry) => entry.period !== period);
      }
    });
    setStatus("Period setup updated for every class.");
  }

  function addRecessPeriod() {
    const nextPeriod = Math.max(0, ...scheduleConfig.periods.map((item) => item.period)) + 1;
    updatePortalData((data) => {
      data.scheduleConfig.periods.push({
        period: nextPeriod,
        label: "Recess",
        startTime: "10:35",
        endTime: "10:50",
        type: "recess",
      });
    });
    setStatus("Recess added to the global schedule.");
  }

  function deletePeriod(period: number) {
    if (typeof window !== "undefined" && !window.confirm(`Delete period ${period} from every class schedule?`)) {
      return;
    }
    updatePortalData((data) => {
      data.scheduleConfig.periods = data.scheduleConfig.periods.filter((item) => item.period !== period);
      data.schedules = data.schedules.filter((entry) => entry.period !== period);
    });
    setStatus(`Period ${period} deleted everywhere.`);
  }

  function addDay(day: string) {
    if (!day) return;
    updatePortalData((data) => {
      if (!data.scheduleConfig.days.includes(day)) {
        data.scheduleConfig.days.push(day);
      }
    });
    setStatus(`${day} added to the schedule.`);
  }

  function removeDay(day: string) {
    if (typeof window !== "undefined" && !window.confirm(`Remove ${day} from every class schedule?`)) {
      return;
    }
    updatePortalData((data) => {
      data.scheduleConfig.days = data.scheduleConfig.days.filter((entry) => entry !== day);
      data.schedules = data.schedules.filter((entry) => entry.day !== day);
    });
    setStatus(`${day} removed from every class.`);
  }

  return (
    <div className="portal-admin-manager portal-schedule-manager">
      <section className="portal-card">
        <div className="portal-admin-toolbar">
          <div>
            <p className="portal-kicker">Schedules</p>
            <h2>Weekly schedule builder</h2>
            <p className="portal-muted-text">
              Choose a class, fill the weekly grid, and teachers immediately see the periods assigned to them.
            </p>
          </div>
          <div className="portal-schedule-actions">
            <button type="button" className="portal-secondary-button" onClick={fillStarterWeek}>
              Add starter week
            </button>
            <button type="button" className="portal-danger-button" onClick={clearClassSchedule}>
              Clear class
            </button>
          </div>
        </div>
        <div className="portal-class-picker" aria-label="Class schedule picker">
          {classes.map((schoolClass) => {
            const classTeacherCount = teachersForClass(schoolClass.id).filter((teacher) =>
              teacher.classIds.includes(schoolClass.id),
            ).length;

            return (
              <button
                key={schoolClass.id}
                type="button"
                className={schoolClass.id === activeClassId ? "is-active" : ""}
                onClick={() => setSelectedClassId(schoolClass.id)}
              >
                <strong>{schoolClass.name}</strong>
                <span>{classTeacherCount || "No"} teachers</span>
              </button>
            );
          })}
        </div>
        {status ? <div className="portal-success">{status}</div> : null}
      </section>

      <section className="portal-card">
        <div className="portal-admin-toolbar">
          <div>
            <p className="portal-kicker">Global setup</p>
            <h2>Days, periods, and recess</h2>
            <p className="portal-muted-text">
              These controls apply to every class. Edit a period time once, and all matching lessons update together.
            </p>
          </div>
          <div className="portal-schedule-actions">
            <select
              defaultValue=""
              onChange={(event) => {
                addDay(event.target.value);
                event.currentTarget.value = "";
              }}
            >
              <option value="">Add day</option>
              {remainingDayOptions.map((day) => (
                <option key={day} value={day}>
                  {day}
                </option>
              ))}
            </select>
            <button type="button" className="portal-secondary-button" onClick={addRecessPeriod}>
              Add recess
            </button>
          </div>
        </div>
        <div className="portal-chip-row">
          {scheduleDays.map((day) => (
            <button key={day} type="button" onClick={() => removeDay(day)}>
              {day} x
            </button>
          ))}
        </div>
        <div className="portal-period-config-list">
          {activePeriods.map((periodConfig) => (
            <article key={periodConfig.period} className={periodConfig.type === "recess" ? "is-recess" : ""}>
              <strong>{periodConfig.label}</strong>
              <select
                value={periodConfig.type}
                onChange={(event) => updatePeriod(periodConfig.period, { type: event.target.value as "class" | "recess" })}
              >
                <option value="class">Class period</option>
                <option value="recess">Recess</option>
              </select>
              <input
                value={periodConfig.label}
                onChange={(event) => updatePeriod(periodConfig.period, { label: event.target.value })}
                aria-label={`${periodConfig.label} label`}
              />
              <input
                type="time"
                value={periodConfig.startTime}
                onChange={(event) => updatePeriod(periodConfig.period, { startTime: event.target.value })}
                aria-label={`${periodConfig.label} start`}
              />
              <input
                type="time"
                value={periodConfig.endTime}
                onChange={(event) => updatePeriod(periodConfig.period, { endTime: event.target.value })}
                aria-label={`${periodConfig.label} end`}
              />
              <button type="button" className="portal-mini-danger-button" onClick={() => deletePeriod(periodConfig.period)}>
                Delete period
              </button>
            </article>
          ))}
        </div>
      </section>

      <section className="portal-card portal-schedule-card">
        <div
          className="portal-schedule-board"
          style={{ gridTemplateColumns: `128px repeat(${Math.max(scheduleDays.length, 1)}, minmax(236px, 1fr))` }}
        >
          <div className="portal-schedule-head">Period</div>
          {scheduleDays.map((day) => (
            <div key={day} className="portal-schedule-head">
              {day}
            </div>
          ))}
          {activePeriods.map((periodConfig) => (
            <div key={periodConfig.period} className="portal-schedule-row-fragment">
              <div className="portal-schedule-period">
                <strong>{periodConfig.label}</strong>
                <span>{periodConfig.startTime}-{periodConfig.endTime}</span>
              </div>
              {periodConfig.type === "recess" ? (
                <div className="portal-schedule-recess" style={{ gridColumn: `span ${Math.max(scheduleDays.length, 1)}` }}>
                  Recess for all classes
                </div>
              ) : scheduleDays.map((day) => {
                const period = periodConfig.period;
                const entry = entryFor(day, period);
                const currentTeacher = teachers.find((teacher) => teacher.id === entry?.teacherId);
                const currentSubject = subjects.find((subject) => subject.id === entry?.subjectId);
                const subjectOptions = entry
                  ? ensureOption(subjectOptionsForTeacher(entry.teacherId, activeClassId), currentSubject)
                  : subjectOptionsForClass(activeClassId);
                const teacherOptions = entry
                  ? ensureOption(teacherOptionsForLesson(activeClassId, entry.subjectId), currentTeacher)
                  : teachersForClass(activeClassId);

                return (
                  <div key={`${day}-${period}`} className={`portal-schedule-cell ${entry ? "is-filled" : ""}`}>
                    {entry ? (
                      <div className="portal-schedule-cell-form">
                        <div className="portal-schedule-cell-title">
                          <strong>{getSubjectName(entry.subjectId)}</strong>
                          <span>{getTeacherName(entry.teacherId)}</span>
                        </div>
                        <select
                          aria-label={`${day} period ${period} subject`}
                          value={entry.subjectId}
                          onChange={(event) => saveCell(day, period, { subjectId: event.target.value })}
                        >
                          {subjectOptions.map((subject) => (
                            <option key={subject.id} value={subject.id}>
                              {subject.name}
                            </option>
                          ))}
                        </select>
                        <select
                          aria-label={`${day} period ${period} teacher`}
                          value={entry.teacherId}
                          onChange={(event) => saveCell(day, period, { teacherId: event.target.value })}
                        >
                          {teacherOptions.map((teacher) => (
                            <option key={teacher.id} value={teacher.id}>
                              {teacherLabel(teacher.id)}
                            </option>
                          ))}
                        </select>
                        <div className="portal-schedule-time-row">
                          <input
                            aria-label={`${day} period ${period} start`}
                            type="time"
                            value={entry.startTime}
                            onChange={(event) => saveCell(day, period, { startTime: event.target.value })}
                          />
                          <input
                            aria-label={`${day} period ${period} end`}
                            type="time"
                            value={entry.endTime}
                            onChange={(event) => saveCell(day, period, { endTime: event.target.value })}
                          />
                        </div>
                        <input
                          aria-label={`${day} period ${period} room`}
                          value={entry.room}
                          onChange={(event) => saveCell(day, period, { room: event.target.value })}
                        />
                        <button type="button" className="portal-mini-danger-button" onClick={() => removeCell(day, period)}>
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="portal-empty-cell-form">
                        <select
                          aria-label={`${day} period ${period} new subject`}
                          defaultValue=""
                          onChange={(event) => saveCell(day, period, { subjectId: event.target.value })}
                        >
                          <option value="">Subject</option>
                          {subjectOptions.map((subject) => (
                            <option key={subject.id} value={subject.id}>
                              {subject.name}
                            </option>
                          ))}
                        </select>
                        <select
                          aria-label={`${day} period ${period} new teacher`}
                          defaultValue=""
                          onChange={(event) => saveCell(day, period, { teacherId: event.target.value })}
                        >
                          <option value="">Teacher</option>
                          {teacherOptions.map((teacher) => (
                            <option key={teacher.id} value={teacher.id}>
                              {teacherLabel(teacher.id)}
                            </option>
                          ))}
                        </select>
                        <button type="button" className="portal-empty-cell-button" onClick={() => saveCell(day, period)}>
                          Add lesson
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </section>

      <section className="portal-card">
        <div className="portal-panel-head">
          <div>
            <p className="portal-kicker">Teacher view</p>
            <h2>Live schedule records</h2>
          </div>
        </div>
        <div className="portal-table-wrap">
          <table className="portal-table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Period</th>
                <th>Subject</th>
                <th>Teacher</th>
                <th>Time</th>
                <th>Room</th>
              </tr>
            </thead>
            <tbody>
              {schedules
                .filter((entry) => entry.classId === activeClassId)
                .map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.day}</td>
                    <td>{entry.period}</td>
                    <td>{getSubjectName(entry.subjectId)}</td>
                    <td>{getTeacherName(entry.teacherId)}</td>
                    <td>{entry.startTime}-{entry.endTime}</td>
                    <td>{entry.room}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
