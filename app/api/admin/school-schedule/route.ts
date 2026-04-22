import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

import { getAdminSessionUser } from "@/lib/admin-auth";
import {
  type SchoolScheduleData,
  hashTeacherPassword,
  saveSchoolScheduleData,
  sanitizeSchoolScheduleData,
  readSchoolScheduleData,
} from "@/lib/school-schedule";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TeacherInput = SchoolScheduleData["teachers"][number] & {
  password?: string;
};

function prepareSchedulePayload(body: unknown) {
  const rawData = (body as { schedule?: unknown })?.schedule;
  const schedule = sanitizeSchoolScheduleData(rawData);
  const rawTeachers = Array.isArray((rawData as { teachers?: unknown })?.teachers)
    ? ((rawData as { teachers: TeacherInput[] }).teachers)
    : [];

  schedule.teachers = schedule.teachers.map((teacher, index) => {
    const rawTeacher = rawTeachers[index];
    const password = typeof rawTeacher?.password === "string" ? rawTeacher.password : "";

    return {
      ...teacher,
      passwordHash: password ? hashTeacherPassword(password) : teacher.passwordHash,
    };
  });

  return schedule;
}

async function requireAdmin() {
  return getAdminSessionUser();
}

export async function GET() {
  const username = await requireAdmin();

  if (!username) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const schedule = await readSchoolScheduleData();
  return NextResponse.json({ schedule });
}

export async function POST(request: Request) {
  const username = await requireAdmin();

  if (!username) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const schedule = await saveSchoolScheduleData(prepareSchedulePayload(body));

    revalidatePath("/administration", "page");
    revalidatePath("/teacher", "page");
    revalidatePath("/schedule", "page");

    return NextResponse.json({ schedule });
  } catch (error) {
    if (error instanceof Error && error.name === "TeacherScheduleConflict") {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }

    return NextResponse.json(
      { error: "Could not save the school schedule." },
      { status: 500 },
    );
  }
}
