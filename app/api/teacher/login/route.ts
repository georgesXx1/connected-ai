import { NextResponse } from "next/server";

import { attachTeacherSession } from "@/lib/teacher-auth";
import { authenticateTeacher, toPublicTeacher } from "@/lib/school-schedule";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const username =
    typeof (body as { username?: unknown })?.username === "string"
      ? (body as { username: string }).username.trim()
      : "";
  const password =
    typeof (body as { password?: unknown })?.password === "string"
      ? (body as { password: string }).password
      : "";

  const teacher = await authenticateTeacher(username, password);

  if (!teacher) {
    return NextResponse.json(
      { error: "Invalid teacher credentials." },
      { status: 401 },
    );
  }

  const response = NextResponse.json({ teacher: toPublicTeacher(teacher) });
  return attachTeacherSession(response, teacher.id);
}
