import { NextResponse } from "next/server";

import { getTeacherSessionId } from "@/lib/teacher-auth";
import {
  getTeacherSchedule,
  readSchoolScheduleData,
  toPublicTeacher,
} from "@/lib/school-schedule";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const teacherId = await getTeacherSessionId();

  if (!teacherId) {
    return NextResponse.json(
      { error: "Unauthorized.", teacher: null, schedule: [] },
      { status: 401 },
    );
  }

  const data = await readSchoolScheduleData();
  const teacher = data.teachers.find((entry) => entry.id === teacherId);

  if (!teacher || teacher.status !== "active") {
    return NextResponse.json(
      { error: "Unauthorized.", teacher: null, schedule: [] },
      { status: 401 },
    );
  }

  return NextResponse.json({
    teacher: toPublicTeacher(teacher),
    schedule: getTeacherSchedule(data, teacher.id),
  });
}
